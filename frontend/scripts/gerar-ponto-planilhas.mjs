import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const DIR = "F:/Ponto - Funcionario";
const OUT = path.resolve("src/constants/pontoPlanilhas.js");

const FONTES = [
    { arquivo: "Ponto Ailema.xlsx", id: 2401, nome: "AILEMA CAMARGO REIS" },
    { arquivo: "Ponto Ana Julia - Andamento.xlsx", id: 2510, nome: "ANA JULIA DE SOUZA OLIVEIRA" },
    { arquivo: "Ponto Andjara  - Atualizar.xlsx", id: 2505, nome: "ANDJARA" },
    { arquivo: "Ponto Arthur - ok.xlsx", id: 23, nome: "ARTHUR BRITO DE JESUS" },
    { arquivo: "Ponto Carmem.xlsx", id: 2509, nome: "CARMEM BEATRIZ" },
    { arquivo: "Ponto Elen - Andamento.xlsx", id: 32, nome: "ELEN LACERDA CLARO" },
    { arquivo: "Ponto Gabi  - Atualizar.xlsx", id: 2513, nome: "GABRIELA RIBEIRO MELLO DE LIMA" },
    { arquivo: "Ponto Gabriel - ok.xlsx", id: 104, nome: "GABRIEL IVAN CAMPOS DIAS" },
    { arquivo: "Ponto Gabriela - ok.xlsx", id: 105, nome: "GABRIELA FERREIRA DE PAULA" },
    { arquivo: "Ponto Joelma - Atualizar.xlsx", id: 2506, nome: "JOELMA TULLER" },
    { arquivo: "Ponto Laisa - Atualizar.xlsx", id: 2508, nome: "LAISA AMARAL" },
    { arquivo: "Ponto Leonam.xlsx", id: 3, nome: "LEONAM RAFAEL DE FREITAS BEZERRA" },
    { arquivo: "Ponto Maria Antonia.xlsx", id: 2194, nome: "MARIA ANTONIA DOS SANTOS ZORGDRAGER" },
    { arquivo: "Ponto Marina - Atualizar.xlsx", id: 2507, nome: "MARINA" },
    { arquivo: "Ponto Meiriele - Atualizar.xlsx", id: 2503, nome: "MEIRIELE" },
    { arquivo: "Ponto Nádia - Andamento.xlsx", id: 216, nome: "NADIA CRISTINA LOPES DO CARMO CORDEIRO" },
    { arquivo: "Ponto Pamela.xlsx", id: 2402, nome: "PAMELLA CHRISTINA DE OLIVEIRA RESENDE" },
    { arquivo: "Ponto Sabrina - ok.xlsx", id: 2502, nome: "SABRINA" }
];

function pad(n) {
    return String(n).padStart(2, "0");
}

function isoDe(data) {
    if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
        return "";
    }
    return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

function parseData(valor) {
    if (valor instanceof Date) {
        return isoDe(valor);
    }
    if (typeof valor === "number" && valor > 20000 && valor < 60000) {
        const d = XLSX.SSF.parse_date_code(valor);
        if (d) {
            return `${d.y}-${pad(d.m)}-${pad(d.d)}`;
        }
    }
    const s = String(valor || "").trim();
    if (!s) {
        return "";
    }
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
        return `${iso[1]}-${iso[2]}-${iso[3]}`;
    }
    const br = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (br) {
        let a = Number(br[1]);
        let b = Number(br[2]);
        let y = Number(br[3]);
        if (y < 100) {
            y += y >= 70 ? 1900 : 2000;
        }
        if (a > 12) {
            return `${y}-${pad(b)}-${pad(a)}`;
        }
        return `${y}-${pad(a)}-${pad(b)}`;
    }
    return "";
}

function parseHora(valor) {
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
        return valor.toTimeString().slice(0, 8);
    }
    if (typeof valor === "number") {
        if (valor > 0 && valor < 1) {
            const total = Math.round(valor * 24 * 3600);
            const h = Math.floor(total / 3600);
            const m = Math.floor((total % 3600) / 60);
            const s = total % 60;
            if (h === 0 && m === 0 && s === 0) {
                return "";
            }
            return `${pad(h)}:${pad(m)}:${pad(s)}`;
        }
        return "";
    }
    const s = String(valor || "").trim();
    if (!s) {
        return "";
    }
    const ampm = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (ampm) {
        let h = Number(ampm[1]) % 12;
        if (/pm/i.test(ampm[4])) {
            h += 12;
        }
        const m = Number(ampm[2]);
        const sec = Number(ampm[3] || 0);
        if (h === 0 && m === 0 && sec === 0) {
            return "";
        }
        return `${pad(h)}:${pad(m)}:${pad(sec)}`;
    }
    const hm = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!hm) {
        return "";
    }
    const h = Number(hm[1]);
    const m = Number(hm[2]);
    const sec = Number(hm[3] || 0);
    if (h === 0 && m === 0 && sec === 0) {
        return "";
    }
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

function statusDe(justificativa, temPonto) {
    const j = String(justificativa || "").toLowerCase();
    if (/\bdescanso\b|\bfolga\b/.test(j)) {
        return "descanso";
    }
    if (/\batestado\b|\bferiado\b|\babono\b/.test(j)) {
        return "abonado";
    }
    return temPonto ? "ok" : "pendente";
}

function eFolhaPonto(cabecalho) {
    const t = cabecalho.map((c) => String(c || "").toLowerCase()).join(" ");
    return t.includes("data") && t.includes("entrada") && t.includes("saida");
}

function parseAba(sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
    if (!rows.length || !eFolhaPonto(rows[0] || [])) {
        return {};
    }
    const dias = {};
    for (const row of rows.slice(1)) {
        const iso = parseData(row[0]);
        if (!iso) {
            continue;
        }
        const e1 = parseHora(row[2]);
        const s1 = parseHora(row[3]);
        const e2 = parseHora(row[4]);
        const s2 = parseHora(row[5]);
        const justificativa = String(row[9] || row[8] || "").trim();
        const temPonto = Boolean(e1 || s1 || e2 || s2);
        if (!temPonto && !justificativa) {
            continue;
        }
        dias[iso] = {
            e1,
            s1,
            e2,
            s2,
            justificativa,
            status: statusDe(justificativa, temPonto)
        };
    }
    return dias;
}

function acharArquivo(nome) {
    const direto = path.join(DIR, nome);
    if (fs.existsSync(direto)) {
        return direto;
    }
    const alvo = nome.normalize("NFC").toLowerCase();
    const achado = fs.readdirSync(DIR).find((item) => item.normalize("NFC").toLowerCase() === alvo);
    return achado ? path.join(DIR, achado) : direto;
}

const saida = {};
const resumo = [];

for (const fonte of FONTES) {
    const arquivo = acharArquivo(fonte.arquivo);
    if (!fs.existsSync(arquivo)) {
        resumo.push({ ...fonte, status: "arquivo ausente", dias: 0 });
        continue;
    }
    const wb = XLSX.readFile(arquivo, { cellDates: true });
    const dias = {};
    for (const nomeAba of wb.SheetNames) {
        if (/planilha2|13\s*\(parte|recis/i.test(nomeAba)) {
            continue;
        }
        if (/atualizar/i.test(fonte.arquivo) && /^novembro_2025$/i.test(nomeAba.trim())) {
            continue;
        }
        Object.assign(dias, parseAba(wb.Sheets[nomeAba]));
    }
    saida[String(fonte.id)] = {
        nome: fonte.nome,
        arquivo: fonte.arquivo,
        dias
    };
    resumo.push({
        id: fonte.id,
        nome: fonte.nome,
        arquivo: fonte.arquivo,
        dias: Object.keys(dias).length,
        comPonto: Object.values(dias).filter((d) => d.e1 || d.s1 || d.e2 || d.s2).length
    });
}

const corpo = `export const PONTO_PLANILHAS = ${JSON.stringify(saida, null, 2)};\n`;
fs.writeFileSync(OUT, corpo, "utf8");
console.log(JSON.stringify(resumo, null, 2));
console.log("gravado", OUT, "bytes", corpo.length);
