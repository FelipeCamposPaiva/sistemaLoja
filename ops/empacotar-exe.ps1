# Gera a pasta e o zip para levar o ERP a outro computador Windows.
# Uso, na raiz do projeto: powershell -ExecutionPolicy Bypass -File ops/empacotar-exe.ps1
$ErrorActionPreference = "Stop"

$raiz = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$frontend = Join-Path $raiz "frontend"
$backend = Join-Path $raiz "backend"
$build = Join-Path $raiz "desktop\.build"
$entrada = Join-Path $build "entrada"
$runtime = Join-Path $build "runtime"
$saida = Join-Path $raiz "desktop\saida"
$nome = "ERP-TemDeTudo"

function Exigir($comando) {
    if (-not (Get-Command $comando -ErrorAction SilentlyContinue)) {
        throw "Não encontrei '$comando' no PATH."
    }
}

Exigir "java"
Exigir "jpackage"
Exigir "jlink"
Exigir "npm"

Write-Host "Compilando a tela..."
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Push-Location $frontend
    npm install
    Pop-Location
}
$env:VITE_API_URL = "/api"
Push-Location $frontend
npm run build
Pop-Location
if (-not (Test-Path (Join-Path $frontend "dist\index.html"))) {
    throw "O build da tela não gerou frontend\dist\index.html."
}

Write-Host "Compilando o servidor com a tela dentro..."
Push-Location $backend
& .\mvnw.cmd -Pdesktop -DskipTests package
if ($LASTEXITCODE -ne 0) { throw "Maven falhou com código $LASTEXITCODE." }
Pop-Location

$jar = Get-ChildItem (Join-Path $backend "target\*.jar") |
    Where-Object { $_.Name -notmatch "original|sources|javadoc" } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
if (-not $jar) { throw "JAR não encontrado em backend\target." }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($jar.FullName)
try {
    $entry = $zip.GetEntry("META-INF/MANIFEST.MF")
    $reader = New-Object System.IO.StreamReader($entry.Open())
    $manifesto = $reader.ReadToEnd()
    $reader.Close()
} finally {
    $zip.Dispose()
}
$mainClass = ([regex]::Match($manifesto, "(?m)^Main-Class:\s*(.+)$")).Groups[1].Value.Trim()
$startClass = ([regex]::Match($manifesto, "(?m)^Start-Class:\s*(.+)$")).Groups[1].Value.Trim()
if (-not $mainClass) { throw "O JAR não tem Main-Class." }
Write-Host "JAR: $($jar.Name)"
Write-Host "Main-Class: $mainClass"
Write-Host "Start-Class: $startClass"

if (Test-Path $build) { Remove-Item -Recurse -Force $build }
New-Item -ItemType Directory -Force -Path $entrada | Out-Null
Copy-Item $jar.FullName (Join-Path $entrada $jar.Name)

# A pasta target\classes\static fica do build desktop. Tira para o próximo
# mvn spring-boot:run não servir a tela antiga no lugar da API.
$staticDev = Join-Path $backend "target\classes\static"
if (Test-Path $staticDev) { Remove-Item -Recurse -Force $staticDev }

Write-Host "Montando o Java que vai dentro do executável..."
& jlink `
    --add-modules java.se,jdk.unsupported,jdk.crypto.ec,jdk.localedata,jdk.zipfs,java.instrument,jdk.management,jdk.crypto.cryptoki `
    --output $runtime `
    --strip-debug `
    --no-header-files `
    --no-man-pages `
    --strip-native-commands `
    --compress=zip-6 `
    --include-locales=pt,en
if ($LASTEXITCODE -ne 0) { throw "jlink falhou com código $LASTEXITCODE." }

if (Test-Path (Join-Path $saida $nome)) {
    Remove-Item -Recurse -Force (Join-Path $saida $nome)
}
New-Item -ItemType Directory -Force -Path $saida | Out-Null

Write-Host "Gerando o executável..."
& jpackage `
    --type app-image `
    --dest $saida `
    --name $nome `
    --input $entrada `
    --main-jar $jar.Name `
    --main-class $mainClass `
    --runtime-image $runtime `
    --win-console `
    --vendor "Tem de Tudo" `
    --app-version 1.0.0 `
    --description "ERP Tem de Tudo" `
    --java-options "-Derp.home=`$ROOTDIR" `
    --java-options "-Derp.abrir-navegador=true"
if ($LASTEXITCODE -ne 0) { throw "jpackage falhou com código $LASTEXITCODE." }

$app = Join-Path $saida $nome
New-Item -ItemType Directory -Force -Path (Join-Path $app "banco") | Out-Null
Copy-Item (Join-Path $backend "src\main\resources\db\*.sql") (Join-Path $app "banco")

$uploads = Join-Path $backend "uploads"
if (Test-Path $uploads) {
    Write-Host "Copiando anexos (uploads)..."
    Copy-Item $uploads (Join-Path $app "uploads") -Recurse -Force
}

$cfg = Join-Path $backend "config\local.properties"
$mysqldump = $null
foreach ($candidato in @(
        "mysqldump",
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 9.0\bin\mysqldump.exe",
        "C:\xampp\mysql\bin\mysqldump.exe"
    )) {
    if (Get-Command $candidato -ErrorAction SilentlyContinue) {
        $mysqldump = (Get-Command $candidato).Source
        break
    }
    if (Test-Path $candidato) { $mysqldump = $candidato; break }
}

if ($mysqldump -and (Test-Path $cfg)) {
    Write-Host "Exportando o banco temdetudo_db..."
    $props = @{}
    Get-Content $cfg | ForEach-Object {
        if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)$') {
            $props[$Matches[1]] = $Matches[2]
        }
    }
    $usuario = $props["DB_USERNAME"]
    $senha = $props["DB_PASSWORD"]
    if ($usuario) {
        $cnf = Join-Path $build "mysql-dump.cnf"
        $senhaIni = ($senha -replace '\\', '\\\\') -replace '"', '\"'
        @"
[client]
protocol=tcp
host=localhost
port=3306
user=$usuario
password="$senhaIni"
"@ | Set-Content -Path $cnf -Encoding ascii
        $dump = Join-Path $app "banco\dados.sql"
        & $mysqldump --defaults-extra-file=$cnf --single-transaction --routines --triggers --no-tablespaces --default-character-set=utf8mb4 --databases temdetudo_db --result-file=$dump
        Remove-Item -Force $cnf -ErrorAction SilentlyContinue
        if ($LASTEXITCODE -eq 0 -and (Test-Path $dump)) {
            Write-Host "Dados exportados para banco\dados.sql."
        } else {
            Write-Warning "Não foi possível exportar o banco. O executável sobe assim mesmo; no computador novo marque só criar as tabelas."
            if (Test-Path $dump) { Remove-Item -Force $dump }
        }
    }
} else {
    Write-Warning "Sem mysqldump ou sem backend\config\local.properties. O pacote vai sem a cópia dos dados."
}

@'
ERP Tem de Tudo
================

Leve a PASTA inteira (ou o zip) para o computador novo.
O arquivo ERP-TemDeTudo.exe não funciona sozinho: ele precisa das pastas
runtime e app que estão ao lado dele.

No computador novo
------------------
1. Instale o MySQL Server e deixe o serviço em execução.
2. Extraia esta pasta, por exemplo em C:\ERP-TemDeTudo
3. Abra ERP-TemDeTudo.exe
4. Na primeira vez, informe servidor, usuário e senha do MySQL.
   Se banco\dados.sql existir, deixe marcado "Trazer os dados do computador anterior".
5. O navegador abre sozinho. Feche a janela preta para encerrar o sistema.

Se o banco estiver vazio, o usuário inicial é admin e a senha é 123456.
Troque essa senha depois do primeiro acesso.

Para mudar o MySQL depois, use Reconfigurar.cmd.

A pasta uploads guarda fotos e anexos. A pasta config guarda a senha do banco
deste computador — não envie esse arquivo para outras pessoas.
'@ | Set-Content -Path (Join-Path $app "LEIA-ME.txt") -Encoding utf8

@'
@echo off
cd /d "%~dp0"
"%~dp0ERP-TemDeTudo.exe" --configurar
'@ | Set-Content -Path (Join-Path $app "Reconfigurar.cmd") -Encoding ascii

$zipSaida = Join-Path $saida "ERP-TemDeTudo-windows.zip"
if (Test-Path $zipSaida) { Remove-Item -Force $zipSaida }
Write-Host "Compactando..."
Compress-Archive -Path $app -DestinationPath $zipSaida -CompressionLevel Optimal
Write-Host ""
Write-Host "Pronto:"
Write-Host "  $app\ERP-TemDeTudo.exe"
Write-Host "  $zipSaida"
