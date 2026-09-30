import { resource } from "./api";

const contas = resource("/contas-receber");

export async function listarContasReceber() {
    const dados = await contas.list();
    return Array.isArray(dados) ? dados : [];
}

export async function salvarContaReceber(conta) {
    return contas.create(conta);
}

export async function receberConta(id, valor) {
    const { default: api } = await import("./api");
    const { data } = await api.put(`/contas-receber/${id}/receber`, valor != null ? { valor } : {});
    return data;
}

export async function receberContasLote(ids) {
    const { default: api } = await import("./api");
    const { data } = await api.put("/contas-receber/receber-lote", ids);
    return {
        ok: Number(data?.ok || 0),
        erros: Number(data?.erros || 0),
        mensagens: data?.mensagens || []
    };
}

export async function excluirContaReceber(id) {
    await contas.remove(id);
}

export async function agruparParcelarReceber(pedido) {
    const { default: api } = await import("./api");
    const { data } = await api.post("/contas-receber/agrupar-parcelar", pedido);
    return data;
}

export async function boletoContaReceber(id) {
    const { default: api } = await import("./api");
    const { data } = await api.get(`/contas-receber/${id}/boleto`);
    return data;
}
