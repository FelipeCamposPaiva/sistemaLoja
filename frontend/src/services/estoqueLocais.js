import api from "./api";

export const DEPOSITOS = [
    { id: 1, codigo: "AL", nome: "Água Limpa", tipo: "LOJA" },
    { id: 2, codigo: "STG", nome: "Santo Agostinho", tipo: "LOJA" },
    { id: 3, codigo: "EST", nome: "Estoque", tipo: "DEPOSITO" },
    { id: 4, codigo: "DEP", nome: "Depósito", tipo: "DEPOSITO" },
    { id: 5, codigo: "TRANS", nome: "Em transferência", tipo: "DEPOSITO" }
];

const KEY = "erp-estoque-depositos-v1";

function lerMapa() {
    try {
        const bruto = JSON.parse(localStorage.getItem(KEY) || "{}");
        return bruto && typeof bruto === "object" ? bruto : {};
    } catch {
        return {};
    }
}

function gravarMapa(mapa) {
    localStorage.setItem(KEY, JSON.stringify(mapa));
}

export function lerCacheSaldos() {
    return lerMapa();
}

export function saldoNoDeposito(produto, deposito, depositos, cache) {
    const total = Number(produto?.estoque || 0);
    const gravado = cache?.[String(produto?.id ?? "")];
    if (!deposito) {
        if (gravado) {
            return Object.values(gravado).reduce((soma, valor) => soma + Number(valor || 0), 0);
        }
        return total;
    }
    if (gravado && gravado[deposito.codigo] != null) {
        return Number(gravado[deposito.codigo] || 0);
    }
    const preferido = depositos.find((item) => item.codigo === "EST")
        || depositos.find((item) => item.tipo === "DEPOSITO")
        || depositos[0];
    return deposito.codigo === preferido?.codigo ? total : 0;
}

function codigoDe(local) {
    return String(local?.sigla || local?.codigo || "").toUpperCase();
}

function depositosBase(locais = []) {
    if (Array.isArray(locais) && locais.length) {
        return locais.map((local) => ({
            id: Number(local.id),
            codigo: codigoDe(local) || String(local.id),
            nome: local.nome,
            tipo: local.tipo || "DEPOSITO"
        }));
    }
    return DEPOSITOS;
}

function saldoInicial(produto, depositos) {
    const total = Number(produto?.estoque || 0);
    const localId = Number(produto?.localId || 0);
    const preferido = depositos.find((d) => d.id === localId)
        || depositos.find((d) => d.codigo === "EST")
        || depositos[0];
    return Object.fromEntries(depositos.map((d) => [d.codigo, d.codigo === preferido?.codigo ? total : 0]));
}

function linhasDe(mapa, depositos) {
    return depositos.map((local) => ({
        ...local,
        quantidade: Number(mapa[local.codigo] || 0)
    }));
}

export function lojasDeposito(locais) {
    return depositosBase(locais).filter((d) => d.tipo === "LOJA" || d.codigo === "AL" || d.codigo === "STG");
}

export async function listarLocaisEstoque() {
    try {
        const { data } = await api.get("/estoque/locais");
        if (Array.isArray(data) && data.length) {
            return depositosBase(data);
        }
    } catch {
        /* catálogo padrão */
    }
    return DEPOSITOS;
}

export async function saldosProduto(produto) {
    const id = produto?.id;
    try {
        if (id) {
            const { data } = await api.get(`/estoque/saldos/${id}`);
            if (Array.isArray(data) && data.length) {
                const linhas = data.map((local) => ({
                    id: Number(local.id),
                    codigo: codigoDe(local),
                    nome: local.nome,
                    tipo: local.tipo || "DEPOSITO",
                    quantidade: Number(local.quantidade || 0)
                }));
                const mapa = lerMapa();
                mapa[String(id)] = Object.fromEntries(linhas.map((item) => [item.codigo, item.quantidade]));
                gravarMapa(mapa);
                return linhas;
            }
        }
    } catch {
        /* fallback local */
    }
    const depositos = await listarLocaisEstoque();
    const cache = lerMapa()[String(id || "")];
    return linhasDe(cache || saldoInicial(produto, depositos), depositos);
}

export async function transferirEntreLocais(produto, origemId, destinoId, quantidade, observacao) {
    const qtd = Number(quantidade);
    if (!produto?.id) {
        throw new Error("Produto sem identificador.");
    }
    if (!origemId || !destinoId || origemId === destinoId) {
        throw new Error("Escolha origem e destino diferentes.");
    }
    if (!(qtd > 0)) {
        throw new Error("Informe a quantidade.");
    }
    try {
        const { data } = await api.post("/estoque/transferir", {
            produtoId: produto.id,
            localOrigem: Number(origemId),
            localDestino: Number(destinoId),
            quantidade: qtd,
            observacao
        });
        if (Array.isArray(data) && data.length) {
            const linhas = data.map((local) => ({
                id: Number(local.id),
                codigo: codigoDe(local),
                nome: local.nome,
                tipo: local.tipo || "DEPOSITO",
                quantidade: Number(local.quantidade || 0)
            }));
            const mapa = lerMapa();
            mapa[String(produto.id)] = Object.fromEntries(linhas.map((l) => [l.codigo, l.quantidade]));
            gravarMapa(mapa);
            return linhas;
        }
    } catch (erro) {
        const status = erro?.response?.status;
        if (status && status !== 404 && status !== 405) {
            throw new Error(erro?.response?.data?.mensagem || erro?.response?.data?.message || erro.message);
        }
    }
    const atuais = await saldosProduto(produto);
    const origem = atuais.find((l) => String(l.id) === String(origemId));
    const destino = atuais.find((l) => String(l.id) === String(destinoId));
    if (!origem || !destino) {
        throw new Error("Local não encontrado.");
    }
    if (Number(origem.quantidade) < qtd) {
        throw new Error(`Saldo insuficiente em ${origem.nome}.`);
    }
    const proximo = atuais.map((l) => {
        if (String(l.id) === String(origemId)) {
            return { ...l, quantidade: Number(l.quantidade) - qtd };
        }
        if (String(l.id) === String(destinoId)) {
            return { ...l, quantidade: Number(l.quantidade) + qtd };
        }
        return l;
    });
    const mapa = lerMapa();
    mapa[String(produto.id)] = Object.fromEntries(proximo.map((l) => [l.codigo, l.quantidade]));
    gravarMapa(mapa);
    return proximo;
}
