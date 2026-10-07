package com.temdetudo.erp.desktop;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

/**
 * Cria o banco no MySQL deste computador e, se houver, restaura o dump
 * gerado no computador anterior.
 */
public final class PrepararBanco {

    private static final String[] SCRIPTS = {
            "db/schema.sql",
            "db/V20260829__indexes_views.sql",
            "db/V20260915__bens_patrimoniais.sql",
            "db/V20260915__estoque_auditoria.sql",
            "db/V20260915__juros_multa.sql",
            "db/V20260915__produto_midia.sql"
    };

    private PrepararBanco() {
    }

    public record Conexao(
            String host,
            int portaMysql,
            String banco,
            String usuario,
            String senha,
            int portaErp
    ) {
        public String urlAplicacao() {
            return "jdbc:mysql://" + host + ":" + portaMysql + "/" + banco
                    + "?useSSL=false&allowPublicKeyRetrieval=true"
                    + "&serverTimezone=America/Sao_Paulo&characterEncoding=UTF-8";
        }
    }

    public static void validar(Conexao conexao) {
        if (conexao.host == null || conexao.host.isBlank() || conexao.host.indexOf(' ') >= 0) {
            throw new IllegalArgumentException("Informe o servidor do MySQL, por exemplo localhost.");
        }
        if (conexao.portaMysql < 1 || conexao.portaMysql > 65535) {
            throw new IllegalArgumentException("A porta do MySQL precisa estar entre 1 e 65535.");
        }
        if (conexao.portaErp < 1 || conexao.portaErp > 65535) {
            throw new IllegalArgumentException("A porta do ERP precisa estar entre 1 e 65535.");
        }
        if (conexao.banco == null || !conexao.banco.matches("[A-Za-z0-9_]+")) {
            throw new IllegalArgumentException("O nome do banco só pode ter letras, números e _.");
        }
        if (conexao.usuario == null || conexao.usuario.isBlank()) {
            throw new IllegalArgumentException("Informe o usuário do MySQL.");
        }
        if (conexao.senha != null && (conexao.senha.indexOf('\n') >= 0 || conexao.senha.indexOf('\r') >= 0)) {
            throw new IllegalArgumentException("A senha não pode ter quebra de linha.");
        }
    }

    public static void testar(Conexao conexao) throws SQLException {
        validar(conexao);
        try (Connection con = abrirServidor(conexao);
             Statement st = con.createStatement()) {
            st.execute("SELECT 1");
        }
    }

    public static void criarEstrutura(Conexao conexao) throws SQLException, IOException {
        validar(conexao);
        try (Connection con = abrirServidor(conexao);
             Statement st = con.createStatement()) {
            st.execute("CREATE DATABASE IF NOT EXISTS `" + conexao.banco
                    + "` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci");
        }
        try (Connection con = abrirBanco(conexao)) {
            for (String script : SCRIPTS) {
                String sql = lerClasspath(script);
                executarScript(con, sql);
            }
        }
    }

    public static void importarDump(Conexao conexao, Path dump) throws IOException, InterruptedException {
        validar(conexao);
        if (dump == null || !Files.isRegularFile(dump)) {
            throw new IOException("Arquivo de dados não encontrado.");
        }
        Path mysql = acharCliente("mysql.exe");
        if (mysql == null) {
            throw new IOException("Não encontrei o mysql.exe. Instale o MySQL Server "
                    + "(com os programas de linha de comando) ou desmarque a restauração dos dados.");
        }
        Path cnf = arquivoCliente(conexao);
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    mysql.toString(),
                    "--defaults-extra-file=" + cnf,
                    "--default-character-set=utf8mb4",
                    "--batch"
            );
            pb.redirectInput(dump.toFile());
            pb.redirectErrorStream(true);
            Process processo = pb.start();
            StringBuilder log = new StringBuilder();
            Thread leitor = new Thread(() -> {
                try {
                    log.append(new String(processo.getInputStream().readAllBytes(), StandardCharsets.UTF_8));
                } catch (IOException ignored) {
                    // o processo encerrou a saída
                }
            }, "erp-mysql-import");
            leitor.setDaemon(true);
            leitor.start();
            if (!processo.waitFor(30, TimeUnit.MINUTES)) {
                processo.destroyForcibly();
                throw new IOException("A restauração dos dados demorou demais e foi interrompida.");
            }
            leitor.join(5000);
            if (processo.exitValue() != 0) {
                throw new IOException(resumir(log.toString(), "Falha ao restaurar os dados."));
            }
        } finally {
            Files.deleteIfExists(cnf);
        }
    }

    static void executarScript(Connection con, String script) throws SQLException {
        List<String> comandos = separar(script);
        try (Statement st = con.createStatement()) {
            for (String comando : comandos) {
                String sql = comando.trim();
                if (sql.isEmpty()
                        || sql.regionMatches(true, 0, "CREATE DATABASE", 0, 15)
                        || sql.regionMatches(true, 0, "USE ", 0, 4)) {
                    continue;
                }
                try {
                    st.execute(sql);
                } catch (SQLException ex) {
                    throw new SQLException(ex.getMessage() + " — " + resumir(sql, "comando SQL"), ex);
                }
            }
        }
    }

    static List<String> separar(String script) {
        List<String> comandos = new ArrayList<>();
        String delim = ";";
        StringBuilder atual = new StringBuilder();
        int i = 0;
        int n = script.length();
        while (i < n) {
            if (emBranco(atual) && ignoraEspaco(script.charAt(i))) {
                i++;
                continue;
            }
            if (emBranco(atual) && comecaComentarioLinha(script, i)) {
                i = pularLinha(script, i);
                continue;
            }
            if (emBranco(atual) && comecaBloco(script, i)) {
                i = pularBloco(script, i);
                continue;
            }
            if (emBranco(atual) && comecaPalavra(script, i, "DELIMITER")) {
                i += "DELIMITER".length();
                while (i < n && (script.charAt(i) == ' ' || script.charAt(i) == '\t')) {
                    i++;
                }
                int inicio = i;
                while (i < n && !ignoraEspaco(script.charAt(i))) {
                    i++;
                }
                delim = script.substring(inicio, i);
                if (delim.isEmpty()) {
                    delim = ";";
                }
                i = pularLinha(script, i);
                continue;
            }
            char c = script.charAt(i);
            if (c == '\'' || c == '"' || c == '`') {
                i = copiarTexto(script, i, atual);
                continue;
            }
            if (comeca(script, i, delim)) {
                comandos.add(atual.toString());
                atual.setLength(0);
                i += delim.length();
                continue;
            }
            atual.append(c);
            i++;
        }
        if (!emBranco(atual)) {
            comandos.add(atual.toString());
        }
        return comandos;
    }

    private static Connection abrirServidor(Conexao conexao) throws SQLException {
        carregarDriver();
        String url = "jdbc:mysql://" + conexao.host + ":" + conexao.portaMysql
                + "/?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo";
        return DriverManager.getConnection(url, conexao.usuario, conexao.senha == null ? "" : conexao.senha);
    }

    private static Connection abrirBanco(Conexao conexao) throws SQLException {
        carregarDriver();
        return DriverManager.getConnection(
                conexao.urlAplicacao(),
                conexao.usuario,
                conexao.senha == null ? "" : conexao.senha
        );
    }

    private static void carregarDriver() throws SQLException {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException ex) {
            throw new SQLException("Driver do MySQL não encontrado dentro do executável.", ex);
        }
    }

    private static String lerClasspath(String caminho) throws IOException {
        try (InputStream in = PrepararBanco.class.getClassLoader().getResourceAsStream(caminho)) {
            if (in == null) {
                throw new IOException("Script não encontrado: " + caminho);
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static Path arquivoCliente(Conexao conexao) throws IOException {
        Path arquivo = Files.createTempFile("erp-mysql-", ".cnf");
        String senha = conexao.senha == null ? "" : conexao.senha.replace("\\", "\\\\").replace("\"", "\\\"");
        String texto = "[client]\nprotocol=tcp\nhost=" + conexao.host
                + "\nport=" + conexao.portaMysql
                + "\nuser=" + conexao.usuario
                + "\npassword=\"" + senha + "\"\n";
        Files.writeString(arquivo, texto, StandardCharsets.UTF_8);
        return arquivo;
    }

    static Path acharCliente(String nome) {
        String path = System.getenv("PATH");
        if (path != null) {
            for (String pasta : path.split(";")) {
                if (pasta.isBlank()) {
                    continue;
                }
                Path candidato = Path.of(pasta.trim(), nome);
                if (Files.isRegularFile(candidato)) {
                    return candidato;
                }
            }
        }
        List<Path> raizes = List.of(
                Path.of("C:/Program Files/MySQL"),
                Path.of("C:/Program Files/MariaDB"),
                Path.of("C:/Program Files (x86)/MySQL"),
                Path.of("C:/xampp/mysql"),
                Path.of("C:/wamp64/bin/mysql")
        );
        List<Path> achados = new ArrayList<>();
        for (Path raiz : raizes) {
            if (!Files.isDirectory(raiz)) {
                continue;
            }
            procurar(raiz, nome, 4, achados);
        }
        return achados.stream().max(Comparator.comparing(Path::toString)).orElse(null);
    }

    private static void procurar(Path pasta, String nome, int profundidade, List<Path> achados) {
        if (profundidade < 0 || achados.size() > 8) {
            return;
        }
        Path direto = pasta.resolve(nome);
        if (Files.isRegularFile(direto)) {
            achados.add(direto);
        }
        if (profundidade == 0) {
            return;
        }
        try (Stream<Path> filhos = Files.list(pasta)) {
            for (Path filho : filhos.filter(Files::isDirectory).toList()) {
                procurar(filho, nome, profundidade - 1, achados);
            }
        } catch (IOException ignored) {
            // pasta sem permissão: segue para o próximo lugar comum
        }
    }

    private static boolean emBranco(StringBuilder texto) {
        return texto.toString().isBlank();
    }

    private static boolean ignoraEspaco(char c) {
        return c == ' ' || c == '\t' || c == '\r' || c == '\n';
    }

    private static boolean comeca(String texto, int indice, String trecho) {
        return texto.regionMatches(indice, trecho, 0, trecho.length());
    }

    private static boolean comecaPalavra(String texto, int indice, String palavra) {
        if (!texto.regionMatches(true, indice, palavra, 0, palavra.length())) {
            return false;
        }
        int depois = indice + palavra.length();
        return depois >= texto.length() || ignoraEspaco(texto.charAt(depois));
    }

    private static boolean comecaComentarioLinha(String texto, int indice) {
        char c = texto.charAt(indice);
        if (c == '#') {
            return true;
        }
        return c == '-' && indice + 1 < texto.length() && texto.charAt(indice + 1) == '-';
    }

    private static boolean comecaBloco(String texto, int indice) {
        return texto.charAt(indice) == '/'
                && indice + 1 < texto.length()
                && texto.charAt(indice + 1) == '*';
    }

    private static int pularLinha(String texto, int indice) {
        while (indice < texto.length() && texto.charAt(indice) != '\n') {
            indice++;
        }
        return Math.min(indice + 1, texto.length());
    }

    private static int pularBloco(String texto, int indice) {
        int fim = texto.indexOf("*/", indice + 2);
        if (fim < 0) {
            return texto.length();
        }
        return fim + 2;
    }

    private static int copiarTexto(String texto, int indice, StringBuilder atual) {
        char aspas = texto.charAt(indice);
        atual.append(aspas);
        indice++;
        while (indice < texto.length()) {
            char c = texto.charAt(indice);
            atual.append(c);
            indice++;
            if (c == '\\' && indice < texto.length()) {
                atual.append(texto.charAt(indice));
                indice++;
                continue;
            }
            if (c == aspas) {
                if (aspas == '\'' && indice < texto.length() && texto.charAt(indice) == '\'') {
                    atual.append('\'');
                    indice++;
                    continue;
                }
                break;
            }
        }
        return indice;
    }

    private static String resumir(String texto, String reserva) {
        if (texto == null || texto.isBlank()) {
            return reserva;
        }
        String umaLinha = texto.replace('\r', ' ').replace('\n', ' ').trim();
        if (umaLinha.length() > 220) {
            return umaLinha.substring(0, 220) + "...";
        }
        return umaLinha;
    }
}
