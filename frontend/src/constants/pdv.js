import { produtosLoja } from "./catalogoLoja";
import { lerContatos } from "./contatos";
import { listarFuncionarios } from "./rh";
import { registrarComissaoPdv } from "./comissoes";
import { listarVendedoresCadastro } from "./vendedoresCadastro";
import { produtoNaLocalizacao, temEstoqueDisponivel } from "../services/localizacao";

export const PDV_KEY = "erp-pdv-v1";
export const DEPOSITO = "Água Limpa";
export const CATEGORIA = "Receita";
export const OPERADOR_PADRAO = { id: 1, nome: "ADELINE CAMPOS SILVA" };

export const PRODUTOS_PDV = [
    { id: "xerox-pb", sku: "XEROX-PB-A4", gtin: "7890000000501", fornecedor: "SERV", nome: "XEROX PB (FRENTE) - A4", preco: 0.5, unidade: "UN", atalho: true },
    { id: "imp-color", sku: "IMP-COLOR-A4", gtin: "7890000001101", fornecedor: "SERV", nome: "IMPRESSÃO COLOR ARTE E C/ CORTE (FRENTE) (GLOSSY / BRILHOSO) - 180G - A4", preco: 11, unidade: "UN", atalho: true },
    { id: "caneta-bic", sku: "CAN-BIC-AZ", gtin: "7890000002502", fornecedor: "BIC", nome: "Caneta esferográfica BIC azul", preco: 2.5, unidade: "UN" },
    { id: "caderno-10", sku: "CAD-10M", gtin: "7890000018903", fornecedor: "TILIBRA", nome: "Caderno universitário 10 matérias", preco: 18.9, unidade: "UN" },
    { id: "resma-a4", sku: "A4-75G", gtin: "7890000032004", fornecedor: "CHAMEQUINHO", nome: "Papel A4 75g — resma 500 folhas", preco: 32, unidade: "UN" },
    { id: "plast-rg", sku: "PLAST-RG", gtin: "7890000003005", fornecedor: "SERV", nome: "Plastificação RG / CPF", preco: 3, unidade: "UN" },
    { id: "caneca", sku: "CANECA-BR", gtin: "7890000035006", fornecedor: "SZ", nome: "Caneca branca para sublimação 325ml", preco: 35, unidade: "UN" }
];

export const FORMAS = [
    { id: "dinheiro", nome: "Dinheiro", atalho: "1" },
    { id: "crediario", nome: "Crediário", atalho: "2" },
    { id: "credito", nome: "Cartão de crédito", atalho: "3" },
    { id: "debito", nome: "Cartão de débito", atalho: "4" },
    { id: "pix", nome: "Pix", atalho: "5" },
    { id: "multiplas", nome: "Múltiplas", atalho: "6" },
    { id: "link", nome: "Link de pagamento", atalho: "/" }
];

export const REFINOS = [
    { id: "nao", nome: "Não refinar" },
    { id: "codigo", nome: "Código" },
    { id: "codigo-parcial", nome: "Código (parcial)" },
    { id: "fornecedor", nome: "Código no fornecedor" },
    { id: "gtin", nome: "GTIN/EAN" },
    { id: "descricao", nome: "Descrição" },
    { id: "palavras", nome: "Palavras-chave" },
    { id: "localizacao", nome: "Localização" }
];

export function brl(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function numBr(valor, casas = 2) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
    });
}

export function parseBr(texto) {
    const limpo = String(texto || "0").replace(/\./g, "").replace(",", ".");
    const n = Number(limpo);
    return Number.isFinite(n) ? n : 0;
}

function vazio() {
    return {
        caixa: {
            aberto: false,
            abertoEm: null,
            operadorId: OPERADOR_PADRAO.id,
            operadorNome: OPERADOR_PADRAO.nome,
            trocoInicial: 159.3,
            sangrias: [],
            reforcos: [],
            devolucoes: []
        },
        vendas: [],
        proximoNumero: 25380,
        atalhos: ["xerox-pb", "imp-color"],
        skipPagamento: false
    };
}

export function lerPdv() {
    try {
        const bruto = localStorage.getItem(PDV_KEY);
        if (!bruto) {
            return vazio();
        }
        return { ...vazio(), ...JSON.parse(bruto) };
    } catch {
        return vazio();
    }
}

export function gravarPdv(dados) {
    localStorage.setItem(PDV_KEY, JSON.stringify(dados));
    return dados;
}

function baseProdutos() {
    const loja = produtosLoja();
    return loja.length ? loja : PRODUTOS_PDV;
}

export function produtoPorId(id) {
    return baseProdutos().find((p) => String(p.id) === String(id));
}

function semAcento(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

export function buscarProdutos(texto, refino = "nao", opcoes = {}) {
    const lista = opcoes.catalogo || baseProdutos();
    const q = semAcento(String(texto || "").trim());
    return lista.filter((p) => {
        if (opcoes.soEstoque && !temEstoqueDisponivel(p)) {
            return false;
        }
        if (!q) {
            return true;
        }
        const nome = semAcento([p.nome, p.descricao, p.grupo, p.categoria, p.marca].filter(Boolean).join(" "));
        const sku = semAcento(p.sku);
        const gtin = semAcento(p.gtin || p.codigoBarras);
        const forn = semAcento([p.fornecedor, p.codigoFornecedor].filter(Boolean).join(" "));
        if (refino === "codigo") {
            return sku === q;
        }
        if (refino === "codigo-parcial") {
            return sku.includes(q);
        }
        if (refino === "fornecedor") {
            return forn.includes(q) || sku.includes(q);
        }
        if (refino === "gtin") {
            return gtin.includes(q);
        }
        if (refino === "descricao") {
            return nome.includes(q);
        }
        if (refino === "palavras") {
            return q.split(/\s+/).every((parte) => nome.includes(parte));
        }
        if (refino === "localizacao") {
            return produtoNaLocalizacao(p, q);
        }
        return nome.includes(q) || sku.includes(q) || gtin.includes(q) || produtoNaLocalizacao(p, q);
    }).slice(0, 80);
}

export function vendedoresPdv() {
    const cadastro = listarVendedoresCadastro().filter((v) => !v.excluido && v.status === "ativo");
    if (cadastro.length) {
        return cadastro.map((v) => ({
            id: v.funcId || v.id,
            nome: v.nome,
            cargo: v.cargo || "Vendedor"
        }));
    }
    const vistos = new Set();
    return listarFuncionarios()
        .filter((f) => ["ativo", "prolabore", "estagiario", "experiencia"].includes(f.situacao))
        .map((f) => ({ id: f.id, nome: f.nome, cargo: f.cargo || "" }))
        .filter((f) => {
            if (vistos.has(String(f.id))) {
                return false;
            }
            vistos.add(String(f.id));
            return true;
        });
}

export function clientesPdv() {
    return lerContatos().filter((c) => (c.tipos || []).includes("cliente") && c.ativo !== false);
}

export function totalItens(itens) {
    return itens.reduce((s, i) => s + Number(i.qtd || 0) * Number(i.preco || 0), 0);
}

export function qtdItens(itens) {
    return itens.reduce((s, i) => s + Number(i.qtd || 0), 0);
}

export function resumoFormas(caixa, vendas) {
    const mapa = { Dinheiro: Number(caixa.trocoInicial || 0) };
    for (const v of vendas || []) {
        if (v.caixaAbertoEm !== caixa.abertoEm) {
            continue;
        }
        const nome = FORMAS.find((f) => f.id === v.forma)?.nome || v.formaNome || "Dinheiro";
        mapa[nome] = Number(((mapa[nome] || 0) + Number(v.total || 0)).toFixed(2));
    }
    for (const devolucao of caixa?.devolucoes || []) {
        if (devolucao.reembolso === "DINHEIRO") {
            mapa.Dinheiro = Number(((mapa.Dinheiro || 0) - Number(devolucao.valor || 0)).toFixed(2));
        }
    }
    return Object.entries(mapa).map(([nome, valor]) => ({ nome, valor }));
}

export function finalizarVendaPdv(store, venda) {
    const numero = store.proximoNumero;
    const registro = {
        ...venda,
        numero,
        data: new Date().toISOString(),
        caixaAbertoEm: store.caixa.abertoEm
    };
    const proximo = {
        ...store,
        proximoNumero: numero + 1,
        vendas: [registro, ...store.vendas]
    };
    gravarPdv(proximo);
    if (venda.equipe?.length || venda.vendedorId) {
        registrarComissaoPdv({
            funcId: venda.vendedorId,
            equipe: venda.equipe,
            poolPct: venda.poolPct,
            pedido: numero,
            cliente: venda.clienteNome,
            valorVenda: venda.total
        });
    }
    return { store: proximo, registro };
}
