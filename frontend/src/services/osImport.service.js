import * as XLSX from "xlsx";
import { osVazia, codigoStatus, dataBr, rotuloSituacao } from "../constants/ordensServico";

export const COLUNAS_LAYOUT_OS = [
    "ID",
    "Número da Ordem de Serviço",
    "Data",
    "Data prevista",
    "Total peças",
    "Total serviços",
    "Total",
    "ID contato",
    "Nome do contato",
    "Situação",
    "Vendedor",
    "ID produto",
    "Descrição",
    "Quantidade",
    "Unidade",
    "Valor unitário",
    "Tipo",
    "Total item",
    "Desconto item",
    "Desconto serviço",
    "Desconto geral"
];

export const EXEMPLO_LAYOUT_OS = [
    ["0", "1", "28/01/2014", "", "0", "90", "90", "0", "Fernando de Azevedo", "Em aberto", "Lucas", "0", "Novo Serviço", "3", "", "30", "S", "90", "0", "20.45", "5.5"],
    ["0", "2", "28/01/2014", "", "120", "0", "120", "0", "Fernando de Azevedo", "Em aberto", "Guilherme", "0", "Fone de Ouvido Headset Profissional", "3", "", "40", "P", "120", "0", "11.91", "9.91"],
    ["0", "3", "28/01/2014", "", "0", "30", "30", "0", "Fernando de Azevedo", "Em aberto", "Guilherme", "0", "Novo Serviço", "1", "", "30", "S", "30", "0", "0", "0"],
    ["0", "4", "28/01/2014", "", "0", "120", "120", "0", "Fernando de Azevedo", "Em aberto", "Lucas", "0", "Novo Serviço", "4", "", "30", "S", "120", "0", "0", "0"]
];

function chave(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

const CAMPOS = {
    olistId: ["id"],
    numero: ["numerodaordemdeservico", "numero", "n", "os", "numeroos", "nro"],
    cliente: ["nomedocontato", "cliente", "nome", "nomecliente"],
    contatoId: ["idcontato"],
    fantasia: ["nomefantasia", "fantasia"],
    descricao: ["descricao", "descricaodoservico", "servico"],
    valor: ["total", "valor", "valortotal"],
    totalServicos: ["totalservicos"],
    totalPecas: ["totalpecas"],
    status: ["situacao", "status"],
    data: ["data", "dataabertura", "datainicio", "datadeentrada"],
    prevista: ["dataprevista", "previsao", "dataentrega"],
    conclusao: ["dataconclusao", "conclusao"],
    equipamento: ["equipamento"],
    marcadores: ["marcadores", "marcador", "tags"],
    vendedor: ["vendedor", "responsavel", "tecnico"],
    idProduto: ["idproduto"],
    quantidade: ["quantidade"],
    unidade: ["unidade"],
    preco: ["valorunitario", "preco"],
    tipo: ["tipo"],
    totalItem: ["totalitem"],
    descontoItem: ["descontoitem"],
    descontoServico: ["descontoservico"],
    descontoGeral: ["descontogeral"]
};

function mapaCabecalho(linha) {
    const mapa = {};
    Object.keys(linha || {}).forEach((col) => {
        if (chave(col).startsWith("empty")) {
            return;
        }
        const k = chave(col);
        Object.entries(CAMPOS).forEach(([campo, aliases]) => {
            if (aliases.includes(k) && mapa[campo] === undefined) {
                mapa[campo] = col;
            }
        });
    });
    return mapa;
}

function celula(linha, mapa, campo) {
    const col = mapa[campo];
    if (!col) {
        return "";
    }
    const v = linha[col];
    return v == null ? "" : v;
}

function numero(valor) {
    if (typeof valor === "number" && Number.isFinite(valor)) {
        return valor;
    }
    const s = String(valor || "").trim();
    if (!s) {
        return 0;
    }
    if (s.includes(",") && s.includes(".")) {
        return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
    }
    if (s.includes(",")) {
        return Number(s.replace(",", ".")) || 0;
    }
    return Number(s) || 0;
}

function dataIso(valor) {
    if (!valor) {
        return "";
    }
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
        const local = new Date(valor.getTime() - valor.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    }
    const s = String(valor).trim();
    const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (br) {
        return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return s.slice(0, 10);
    }
    return "";
}

function baixarWorkbook(wb, nome) {
    XLSX.writeFile(wb, nome);
}

export function mesclarLeiturasOS(leituras) {
    const mapa = new Map();
    (leituras || []).forEach((lido) => {
        const itens = Array.isArray(lido) ? lido : (lido?.itens || []);
        itens.forEach((os) => {
            const chaveOs = String(os.numero || os.olistId || os.cliente || "").trim();
            if (!chaveOs) {
                return;
            }
            const atual = mapa.get(chaveOs);
            if (!atual) {
                mapa.set(chaveOs, { ...os, itens: [...(os.itens || [])] });
                return;
            }
            atual.itens = [...(atual.itens || []), ...(os.itens || [])];
            if (!atual.descricao && os.descricao) {
                atual.descricao = os.descricao;
            }
            if (Number(os.valor || 0) > Number(atual.valor || 0)) {
                atual.valor = os.valor;
            }
        });
    });
    return { itens: [...mapa.values()], origem: "excel" };
}

export async function lerArquivoOS(arquivo) {
    const itens = await lerPlanilhaOS(arquivo);
    return { itens, origem: "excel" };
}

export async function lerPlanilhaOS(arquivo) {
    const buffer = await arquivo.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const linhas = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
    if (!linhas.length) {
        return [];
    }
    const mapa = mapaCabecalho(linhas[0]);
    const agrupadas = new Map();
    linhas.forEach((linha) => {
        const numeroOs = String(celula(linha, mapa, "numero") || "").trim();
        const cliente = String(celula(linha, mapa, "cliente") || "").trim();
        if (!numeroOs && !cliente) {
            return;
        }
        const chaveOs = numeroOs || `${cliente}|${dataIso(celula(linha, mapa, "data"))}`;
        const descricao = String(celula(linha, mapa, "descricao") || "").trim();
        const item = descricao ? {
            descricao,
            codigo: String(celula(linha, mapa, "idProduto") || "").trim(),
            quantidade: String(numero(celula(linha, mapa, "quantidade")) || 1),
            preco: String(numero(celula(linha, mapa, "preco"))),
            desconto: String(numero(celula(linha, mapa, "descontoItem"))),
            orcar: false,
            ok: false
        } : null;
        const existente = agrupadas.get(chaveOs);
        if (existente) {
            if (item) {
                existente.itens.push(item);
            }
            return;
        }
        const base = osVazia();
        agrupadas.set(chaveOs, {
            ...base,
            olistId: String(celula(linha, mapa, "olistId") || "").trim() || null,
            contatoOlistId: String(celula(linha, mapa, "contatoId") || "").trim() || null,
            numero: numeroOs,
            cliente,
            descricao,
            valor: numero(celula(linha, mapa, "valor")),
            status: codigoStatus(celula(linha, mapa, "status") || "EM_ABERTO"),
            dataAbertura: dataIso(celula(linha, mapa, "data")) || base.dataAbertura,
            dataPrevisao: dataIso(celula(linha, mapa, "prevista")),
            dataConclusao: dataIso(celula(linha, mapa, "conclusao")),
            vendedor: String(celula(linha, mapa, "vendedor") || "").trim(),
            marcadores: String(celula(linha, mapa, "marcadores") || "").trim(),
            equipamento: String(celula(linha, mapa, "equipamento") || "").trim(),
            desconto: String(numero(celula(linha, mapa, "descontoGeral"))),
            itens: item ? [item] : []
        });
    });
    return [...agrupadas.values()];
}

export function exportarPlanilhaOS(lista, formato = "xls") {
    const linhas = [];
    (lista || []).forEach((os) => {
        const itens = os.itens?.length ? os.itens : [{ descricao: os.descricao || "", quantidade: "0", preco: "0", desconto: "0", codigo: "" }];
        itens.forEach((item) => {
            linhas.push({
                ID: os.olistId || os.id || "",
                "Número da Ordem de Serviço": os.numero || "",
                Data: dataBr(os.dataAbertura),
                "Data prevista": dataBr(os.dataPrevisao),
                "Total peças": 0,
                "Total serviços": Number(os.valor || 0),
                Total: Number(os.valor || 0),
                "ID contato": os.contatoOlistId || os.clienteId || "",
                "Nome do contato": os.cliente || "",
                Situação: rotuloSituacao(os.status),
                Vendedor: os.vendedor || "",
                "ID produto": item.codigo || "",
                Descrição: item.descricao || os.descricao || "",
                Quantidade: item.quantidade || "",
                Unidade: item.unidade || "",
                "Valor unitário": item.preco || "",
                Tipo: item.tipo || "S",
                "Total item": item.total || "",
                "Desconto item": item.desconto || "0",
                "Desconto serviço": "0",
                "Desconto geral": os.desconto || "0"
            });
        });
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(linhas, { header: COLUNAS_LAYOUT_OS });
    XLSX.utils.book_append_sheet(wb, ws, "Ordens de Serviço");
    const ext = formato === "csv" ? "csv" : "xls";
    baixarWorkbook(wb, `ordens_servico.${ext}`);
}

export function baixarLayoutOS(formato = "xls") {
    const linhas = EXEMPLO_LAYOUT_OS.map((linha) => {
        const obj = {};
        COLUNAS_LAYOUT_OS.forEach((col, i) => {
            obj[col] = linha[i] ?? "";
        });
        return obj;
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(linhas, { header: COLUNAS_LAYOUT_OS });
    XLSX.utils.book_append_sheet(wb, ws, "Ordens de Serviço");
    const ext = formato === "csv" ? "csv" : "xls";
    baixarWorkbook(wb, `ordem_servico - Padrao.${ext}`);
}
