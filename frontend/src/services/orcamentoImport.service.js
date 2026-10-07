import * as XLSX from "xlsx";

import { sinaisDoStatus } from "./orcamento.service";

export const COLUNAS_LAYOUT_ORCAMENTO = [
    "Número",
    "Data",
    "Cliente",
    "Nome fantasia",
    "Valor",
    "Status",
    "Vendedor",
    "E-mail enviado",
    "Observações"
];

const EXEMPLO = [
    ["90", "03/10/2026", "Consumidor final", "", "93,60", "Em aberto", "Balcão", "sim", ""],
    ["91", "02/10/2026", "Bete", "Bete", "252,70", "Rascunho", "Loja", "não", "Kit escolar"]
];

function chave(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

const CAMPOS = {
    numero: ["numero", "n", "norcamento", "numerodoorcamento"],
    data: ["data", "dataorcamento", "datadoorcamento"],
    cliente: ["cliente", "nome", "nomedocontato", "contato"],
    fantasia: ["nomefantasia", "fantasia"],
    valor: ["valor", "valortotal", "total"],
    status: ["status", "situacao"],
    vendedor: ["vendedor"],
    email: ["emailenviado", "email", "enviado"],
    observacoes: ["observacoes", "obs"]
};

function resolverCampo(nome) {
    for (const [campo, aliases] of Object.entries(CAMPOS)) {
        if (aliases.includes(nome)) {
            return campo;
        }
    }
    if (nome.includes("fantasia")) {
        return "fantasia";
    }
    if (nome.includes("vendedor")) {
        return "vendedor";
    }
    if (nome.includes("cliente") || nome.includes("contato")) {
        return "cliente";
    }
    if (nome.includes("valor") || nome === "total") {
        return "valor";
    }
    if (nome.includes("status") || nome.includes("situac")) {
        return "status";
    }
    if (nome.includes("observ")) {
        return "observacoes";
    }
    if (nome.includes("email")) {
        return "email";
    }
    if (nome.includes("data")) {
        return "data";
    }
    if (nome.includes("numer") || nome === "n") {
        return "numero";
    }
    return "";
}

function mapaCabecalho(linha) {
    const mapa = {};
    Object.keys(linha || {}).forEach((col) => {
        const campo = resolverCampo(chave(col));
        if (campo && mapa[campo] === undefined) {
            mapa[campo] = col;
        }
    });
    return mapa;
}

function celula(linha, mapa, campo) {
    const col = mapa[campo];
    if (!col) {
        return "";
    }
    const valor = linha[col];
    return valor == null ? "" : valor;
}

function numero(valor) {
    if (typeof valor === "number" && Number.isFinite(valor)) {
        return valor;
    }
    const texto = String(valor || "").trim();
    if (!texto) {
        return 0;
    }
    const normal = texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto.replace(/[^\d.-]/g, "");
    const n = Number(normal);
    return Number.isFinite(n) ? n : 0;
}

function dataIso(valor) {
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
        const mes = String(valor.getMonth() + 1).padStart(2, "0");
        const dia = String(valor.getDate()).padStart(2, "0");
        return `${valor.getFullYear()}-${mes}-${dia}`;
    }
    const texto = String(valor || "").trim();
    const br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (br) {
        return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
        return texto.slice(0, 10);
    }
    return "";
}

function emailSim(valor) {
    const texto = chave(valor);
    return ["sim", "s", "1", "true", "enviado", "x"].includes(texto);
}

function codigoStatus(valor) {
    const texto = chave(valor);
    if (!texto || texto === "emaberto" || texto === "aberto") {
        return "em_aberto";
    }
    if (texto.startsWith("rascunh")) {
        return "rascunho";
    }
    if (texto.startsWith("pendent")) {
        return "pendente";
    }
    if (texto.startsWith("aguard")) {
        return "aguardando";
    }
    if (texto.startsWith("aprov")) {
        return "aprovada";
    }
    if (texto.includes("naoaprov") || texto.startsWith("recus")) {
        return "nao_aprovada";
    }
    if (texto.startsWith("conclu")) {
        return "concluida";
    }
    if (texto.startsWith("modelo")) {
        return "modelo";
    }
    return "em_aberto";
}

export async function lerPlanilhaOrcamentos(arquivo) {
    const buffer = await arquivo.arrayBuffer();
    const nome = String(arquivo?.name || "").toLowerCase();
    const csv = nome.endsWith(".csv");
    const wb = csv
        ? XLSX.read(new TextDecoder("utf-8").decode(buffer), { type: "string", cellDates: true })
        : XLSX.read(buffer, { type: "array", cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const linhas = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
    if (!linhas.length) {
        return [];
    }
    const mapa = mapaCabecalho(linhas[0]);
    return linhas.map((linha) => {
        const cliente = String(celula(linha, mapa, "cliente") || "").trim();
        const numeroOrc = String(celula(linha, mapa, "numero") || "").trim();
        if (!cliente && !numeroOrc) {
            return null;
        }
        const status = sinaisDoStatus(codigoStatus(celula(linha, mapa, "status")));
        return {
            numero: numeroOrc,
            data: dataIso(celula(linha, mapa, "data")),
            cliente,
            fantasia: String(celula(linha, mapa, "fantasia") || "").trim(),
            valor: numero(celula(linha, mapa, "valor")),
            vendedor: String(celula(linha, mapa, "vendedor") || "").trim(),
            email: emailSim(celula(linha, mapa, "email")),
            observacoes: String(celula(linha, mapa, "observacoes") || "").trim(),
            ...status
        };
    }).filter(Boolean);
}

export async function lerArquivoOrcamento(arquivo) {
    const itens = await lerPlanilhaOrcamentos(arquivo);
    return { itens, origem: "excel", erros: itens.length ? [] : [{ linha: 1, motivo: "Nenhum orçamento com número ou cliente." }] };
}

export function mesclarLeiturasOrcamentos(leituras) {
    const mapa = new Map();
    let semNumero = 0;
    (leituras || []).forEach((lido) => {
        const itens = Array.isArray(lido) ? lido : (lido?.itens || []);
        itens.forEach((item) => {
            const chaveItem = String(item.numero || "").trim() || `sem-numero-${semNumero++}`;
            mapa.set(chaveItem, item);
        });
    });
    return { itens: [...mapa.values()], origem: "excel" };
}

export function baixarLayoutOrcamento() {
    const linhas = EXEMPLO.map((linha) => {
        const obj = {};
        COLUNAS_LAYOUT_ORCAMENTO.forEach((col, i) => {
            obj[col] = linha[i] ?? "";
        });
        return obj;
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(linhas, { header: COLUNAS_LAYOUT_ORCAMENTO });
    XLSX.utils.book_append_sheet(wb, ws, "Orçamentos");
    XLSX.writeFile(wb, "layout_orcamentos.xls");
}
