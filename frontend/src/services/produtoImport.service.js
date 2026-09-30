import * as XLSX from "xlsx";
import { tipoTinyParaCadastro } from "./kitComposicao";

function chave(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

const CAMPOS = {
    id: ["id"],
    idProduto: ["idproduto"],
    sku: ["codigosku", "sku", "codigointerno"],
    nome: ["descricao", "nome", "produtodescricao"],
    unidade: ["unidade", "unid"],
    ncm: ["classificacaofiscal", "ncm"],
    preco: ["preco", "precovenda", "valorunitario", "precounitario"],
    custo: ["precodecusto", "custo", "custocompra"],
    estoque: ["estoque", "estoquefisico"],
    estoqueMinimo: ["estoqueminimo"],
    estoqueMaximo: ["estoquemaximo"],
    gtin: ["gtinean", "codigodebarras", "ean", "gtin"],
    localizacao: ["localizacao"],
    categoria: ["categoria", "grupo"],
    observacoes: ["observacoes", "obs"],
    cest: ["cest"],
    peso: ["pesoliquidokg", "peso", "pesoliquido"],
    tipoTiny: ["tipodoproduto"],
    situacao: ["situacao", "status"],
    ativo: ["ativo"]
};

function mapaCabecalho(linha) {
    const mapa = {};
    Object.keys(linha || {}).forEach((col) => {
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

function ncm(valor) {
    const d = String(valor || "").replace(/\D/g, "");
    return d || String(valor || "").trim();
}

function ativoDe(situacao, ativo) {
    if (typeof ativo === "boolean") {
        return ativo;
    }
    const t = String(situacao || ativo || "").trim().toLowerCase();
    if (!t) {
        return true;
    }
    return !["inativo", "inativa", "nao", "não", "0", "false", "n"].includes(t);
}

function tipoProducao(tipoTiny) {
    const t = String(tipoTiny || "").trim().toUpperCase();
    return t === "F" || t === "FABRICADO";
}

function ehPedidos(linhas, nomeFolha) {
    if (/pedido/i.test(nomeFolha || "")) {
        return true;
    }
    const keys = Object.keys(linhas[0] || {}).map(chave);
    return keys.includes("numerodopedido") || (keys.includes("idproduto") && keys.includes("valorunitario"));
}

function escolherFolha(wb) {
    const nomes = wb.SheetNames || [];
    return nomes.find((n) => /^produtos$/i.test(n))
        || nomes.find((n) => /pedido/i.test(n))
        || nomes[0];
}

function skuDe(linha, mapa, pedidos) {
    const sku = String(celula(linha, mapa, "sku") || "").trim();
    if (sku) {
        return sku.slice(0, 50);
    }
    const gtin = String(celula(linha, mapa, "gtin") || "").trim();
    if (gtin && !/^SEM\s*GTIN$/i.test(gtin)) {
        return gtin.slice(0, 50);
    }
    const idRef = pedidos
        ? String(celula(linha, mapa, "idProduto") || "").trim()
        : String(celula(linha, mapa, "id") || "").trim();
    return idRef.slice(0, 50);
}

export function linhaParaProduto(linha, mapa, opcoes = {}) {
    const nome = String(celula(linha, mapa, "nome") || "").trim();
    if (!nome) {
        return null;
    }
    const pedidos = Boolean(opcoes.pedidos);
    const gtinBruto = String(celula(linha, mapa, "gtin") || "").trim();
    const gtin = gtinBruto && !/^SEM\s*GTIN$/i.test(gtinBruto) ? gtinBruto : "";
    const tipoTiny = celula(linha, mapa, "tipoTiny");
    return {
        sku: skuDe(linha, mapa, pedidos),
        codigoBarras: gtin,
        gtin,
        nome,
        unidade: String(celula(linha, mapa, "unidade") || "UN").trim().slice(0, 10) || "UN",
        ncm: ncm(celula(linha, mapa, "ncm")),
        preco: numero(celula(linha, mapa, "preco")),
        custo: numero(celula(linha, mapa, "custo")),
        custoCompra: numero(celula(linha, mapa, "custo")),
        estoque: pedidos ? 0 : numero(celula(linha, mapa, "estoque")),
        estoqueMinimo: numero(celula(linha, mapa, "estoqueMinimo")),
        estoqueMaximo: numero(celula(linha, mapa, "estoqueMaximo")),
        localizacao: String(celula(linha, mapa, "localizacao") || "").trim(),
        categoria: String(celula(linha, mapa, "categoria") || "").trim(),
        grupo: String(celula(linha, mapa, "categoria") || "").trim(),
        observacoes: String(celula(linha, mapa, "observacoes") || "").trim(),
        cest: String(celula(linha, mapa, "cest") || "").trim(),
        peso: numero(celula(linha, mapa, "peso")),
        produtoProducao: tipoProducao(tipoTiny),
        consomeEstoque: String(tipoTiny || "S").toUpperCase() !== "N",
        tipoCadastro: tipoTinyParaCadastro(tipoTiny),
        ativo: pedidos ? true : ativoDe(celula(linha, mapa, "situacao"), celula(linha, mapa, "ativo"))
    };
}

function chaveProduto(p) {
    return String(p.sku || p.gtin || p.nome || "").trim().toLowerCase();
}

export function dedupar(itens, somarEstoque) {
    const mapa = new Map();
    itens.forEach((p) => {
        const k = chaveProduto(p);
        if (!k) {
            return;
        }
        const atual = mapa.get(k);
        if (!atual) {
            mapa.set(k, { ...p });
            return;
        }
        const preco = Math.max(Number(atual.preco) || 0, Number(p.preco) || 0);
        const custo = Math.max(Number(atual.custo) || 0, Number(p.custo) || 0);
        mapa.set(k, {
            ...atual,
            ...p,
            sku: atual.sku || p.sku,
            gtin: atual.gtin || p.gtin,
            codigoBarras: atual.codigoBarras || p.codigoBarras,
            preco,
            custo,
            custoCompra: custo,
            estoque: somarEstoque
                ? (Number(atual.estoque) || 0) + (Number(p.estoque) || 0)
                : (Number(atual.estoque) || Number(p.estoque) || 0),
            ativo: atual.ativo !== false || p.ativo !== false,
            tipoCadastro: p.tipoCadastro || atual.tipoCadastro || "",
            componentes: p.componentes?.length ? p.componentes : atual.componentes
        });
    });
    return [...mapa.values()];
}

export function mesclarLeituras(leituras) {
    const todos = [];
    let pedidos = 0;
    let produtos = 0;
    (leituras || []).forEach((lido) => {
        const itens = Array.isArray(lido) ? lido : (lido?.itens || []);
        todos.push(...itens);
        if (lido?.origem === "pedidos") {
            pedidos += 1;
        } else if (lido?.origem === "produtos") {
            produtos += 1;
        }
    });
    const origem = pedidos && !produtos ? "pedidos" : produtos && !pedidos ? "produtos" : "misto";
    return {
        itens: dedupar(todos, origem === "produtos"),
        origem
    };
}

export async function lerPlanilhaProdutos(arquivo) {
    const buffer = await arquivo.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const nomeFolha = escolherFolha(wb);
    const folha = wb.Sheets[nomeFolha];
    const linhas = XLSX.utils.sheet_to_json(folha, { defval: "" });
    if (!linhas.length) {
        return { itens: [], origem: "vazia", nomeFolha };
    }
    const pedidos = ehPedidos(linhas, nomeFolha);
    const mapa = mapaCabecalho(linhas[0]);
    const brutos = linhas.map((linha) => linhaParaProduto(linha, mapa, { pedidos })).filter(Boolean);
    return {
        itens: dedupar(brutos, !pedidos),
        origem: pedidos ? "pedidos" : "produtos",
        nomeFolha
    };
}
