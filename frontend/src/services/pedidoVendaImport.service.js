import * as XLSX from "xlsx";
import { codigoStatusPedido, flagsStatusPedido, rotuloStatusPedido, dataPedidoBr } from "../constants/pedidosVenda";

export const COLUNAS_LAYOUT_PEDIDO = [
    "ID",
    "Número do pedido",
    "Data",
    "Data prevista",
    "ID contato",
    "Nome do contato",
    "Tipo de Pessoa",
    "CPF/CNPJ",
    "Município",
    "UF",
    "Observações",
    "Situação",
    "ID produto",
    "Descrição",
    "Quantidade",
    "Valor unitário",
    "Desconto item",
    "Código de rastreamento",
    "Vendedor",
    "Frete pedido",
    "Código (SKU)"
];

export const EXEMPLO_LAYOUT_PEDIDO = [
    ["923017808", "592", "21/03/2025", "", "752736096", "Consumidor Final", "F", "", "Volta Redonda", "RJ", "", "Entregue", "919650612", "IMPRESSÃO A4 PB FRENTE", "1", "1,00", "0,00", "", "ELEN LACERDA CLARO", "0,00", ""],
    ["923017920", "593", "21/03/2025", "", "752736096", "Consumidor Final", "F", "", "Volta Redonda", "RJ", "", "Entregue", "921932396", "CILIOS POSTIÇOS", "1", "7,50", "0,00", "", "ELEN LACERDA CLARO", "0,00", ""]
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
    numero: ["numerodopedido", "nmerodopedido", "numero", "n", "npedido", "pedidonumero", "numerodavenda"],
    data: ["data", "datadavenda", "datapedido"],
    prevista: ["dataprevista", "previsto"],
    contatoId: ["idcontato"],
    cliente: ["nomedocontato", "cliente", "nome"],
    fantasia: ["nomefantasia", "fantasia"],
    documento: ["cpfcnpj", "cnpj", "cpf"],
    cidade: ["municipio", "cidade"],
    uf: ["uf", "estado"],
    observacoes: ["observacoes", "obs"],
    status: ["situacao", "status"],
    idProduto: ["idproduto"],
    descricao: ["descricao", "produto"],
    quantidade: ["quantidade"],
    preco: ["valorunitario", "preco", "precounitario"],
    descontoItem: ["descontoitem"],
    rastreio: ["codigoderastreamento", "rastreamento", "rastreio"],
    vendedor: ["vendedor"],
    frete: ["fretepedido", "frete"],
    sku: ["codigosku", "sku", "codigo"],
    total: ["total", "valortotal"]
};

function resolverCampo(k) {
    for (const [campo, aliases] of Object.entries(CAMPOS)) {
        if (aliases.includes(k)) {
            return campo;
        }
    }
    if ((k.includes("numer") || k.includes("nmero") || k.includes("namero")) && k.includes("pedido") && !k.includes("compra")) {
        return "numero";
    }
    if (k.includes("nome") && k.includes("contato")) {
        return "cliente";
    }
    if (k === "idcontato" || (k.includes("id") && k.includes("contato"))) {
        return "contatoId";
    }
    if (k.includes("rastre")) {
        return "rastreio";
    }
    if ((k.includes("codigo") || k === "sku") && k.includes("sku")) {
        return "sku";
    }
    if (k.includes("valorunit")) {
        return "preco";
    }
    if (k.includes("municip") || k === "cidade") {
        return "cidade";
    }
    return "";
}

function mapaCabecalho(linha) {
    const mapa = {};
    Object.keys(linha || {}).forEach((col) => {
        if (chave(col).startsWith("empty")) {
            return;
        }
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

export function mesclarLeiturasPedidos(leituras) {
    const mapa = new Map();
    (leituras || []).forEach((lido) => {
        const itens = Array.isArray(lido) ? lido : (lido?.itens || []);
        itens.forEach((pedido) => {
            const chavePv = String(pedido.numero || pedido.olistId || "").trim();
            if (!chavePv) {
                return;
            }
            const atual = mapa.get(chavePv);
            if (!atual) {
                mapa.set(chavePv, { ...pedido, itens: [...(pedido.itens || [])] });
                return;
            }
            atual.itens = [...(atual.itens || []), ...(pedido.itens || [])];
            if (Number(pedido.valor || 0) > Number(atual.valor || 0)) {
                atual.valor = pedido.valor;
            }
            if (!atual.rastreio && pedido.rastreio) {
                atual.rastreio = pedido.rastreio;
            }
        });
    });
    return { itens: [...mapa.values()], origem: "excel" };
}

export async function lerArquivoPedido(arquivo) {
    const itens = await lerPlanilhaPedidos(arquivo);
    return { itens, origem: "excel" };
}

export async function lerPlanilhaPedidos(arquivo) {
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
    const agrupadas = new Map();
    linhas.forEach((linha) => {
        const numeroPv = String(celula(linha, mapa, "numero") || "").trim();
        const cliente = String(celula(linha, mapa, "cliente") || "").trim();
        if (!numeroPv && !cliente) {
            return;
        }
        const chavePv = numeroPv || `${cliente}|${dataIso(celula(linha, mapa, "data"))}`;
        const descricao = String(celula(linha, mapa, "descricao") || "").trim();
        const sku = String(celula(linha, mapa, "sku") || "").trim();
        const qtd = numero(celula(linha, mapa, "quantidade")) || (descricao || sku ? 1 : 0);
        const preco = numero(celula(linha, mapa, "preco"));
        const item = descricao || sku ? {
            sku,
            descricao: descricao || sku,
            quantidade: qtd,
            valorUnitario: preco,
            produtoOlistId: String(celula(linha, mapa, "idProduto") || "").trim()
        } : null;
        const existente = agrupadas.get(chavePv);
        if (existente) {
            if (item) {
                existente.itens.push(item);
                existente.valor = Number(existente.valor || 0) + qtd * preco;
            }
            return;
        }
        const situacao = String(celula(linha, mapa, "status") || "").trim();
        const status = codigoStatusPedido(situacao);
        const flags = flagsStatusPedido(situacao, status);
        const totalPlanilha = numero(celula(linha, mapa, "total"));
        const frete = numero(celula(linha, mapa, "frete"));
        agrupadas.set(chavePv, {
            olistId: String(celula(linha, mapa, "olistId") || "").trim() || null,
            contatoOlistId: String(celula(linha, mapa, "contatoId") || "").trim() || null,
            numero: numeroPv,
            numeroPedido: numeroPv,
            cliente,
            fantasia: String(celula(linha, mapa, "fantasia") || "").trim(),
            documento: String(celula(linha, mapa, "documento") || "").trim(),
            cidade: String(celula(linha, mapa, "cidade") || "").trim(),
            uf: String(celula(linha, mapa, "uf") || "").trim(),
            observacoes: String(celula(linha, mapa, "observacoes") || "").trim(),
            data: dataIso(celula(linha, mapa, "data")),
            previsto: dataIso(celula(linha, mapa, "prevista")),
            status,
            vendedor: String(celula(linha, mapa, "vendedor") || "").trim(),
            origem: "Olist",
            rastreio: String(celula(linha, mapa, "rastreio") || "").trim(),
            marcadores: "",
            valor: totalPlanilha || qtd * preco + frete,
            itens: item ? [item] : [],
            ...flags
        });
    });
    return [...agrupadas.values()].map((pedido) => {
        if (!numero(pedido.valor)) {
            pedido.valor = (pedido.itens || []).reduce((acc, item) => acc + Number(item.quantidade || 0) * Number(item.valorUnitario || 0), 0);
        }
        return pedido;
    });
}

export function exportarPlanilhaPedidos(lista, formato = "xls") {
    const linhas = [];
    (lista || []).forEach((pedido) => {
        const itens = pedido.itens?.length ? pedido.itens : [{ descricao: "", quantidade: 0, valorUnitario: 0, sku: "" }];
        itens.forEach((item) => {
            linhas.push({
                ID: pedido.olistId || pedido.id || "",
                "Número do pedido": pedido.numero || "",
                Data: dataPedidoBr(pedido.data),
                "Data prevista": pedido.previsto ? dataPedidoBr(pedido.previsto) : "",
                "ID contato": pedido.contatoOlistId || pedido.clienteId || "",
                "Nome do contato": pedido.cliente || "",
                "Tipo de Pessoa": "",
                "CPF/CNPJ": pedido.documento || "",
                Município: pedido.cidade || "",
                UF: pedido.uf || "",
                Observações: pedido.observacoes || "",
                Situação: rotuloStatusPedido(pedido.status),
                "ID produto": item.produtoOlistId || "",
                Descrição: item.descricao || "",
                Quantidade: item.quantidade || "",
                "Valor unitário": item.valorUnitario || "",
                "Desconto item": item.desconto || "0",
                "Código de rastreamento": pedido.rastreio || "",
                Vendedor: pedido.vendedor || "",
                "Frete pedido": "",
                "Código (SKU)": item.sku || ""
            });
        });
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(linhas, { header: COLUNAS_LAYOUT_PEDIDO });
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos de Venda");
    const ext = formato === "csv" ? "csv" : "xls";
    baixarWorkbook(wb, `pedidos_venda.${ext}`);
}

export function baixarLayoutPedido(formato = "xls") {
    const linhas = EXEMPLO_LAYOUT_PEDIDO.map((linha) => {
        const obj = {};
        COLUNAS_LAYOUT_PEDIDO.forEach((col, i) => {
            obj[col] = linha[i] ?? "";
        });
        return obj;
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(linhas, { header: COLUNAS_LAYOUT_PEDIDO });
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos de Venda");
    const ext = formato === "csv" ? "csv" : "xls";
    baixarWorkbook(wb, `pedidos_venda - Padrao.${ext}`);
}
