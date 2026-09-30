import { resource } from "./api";

const contas = resource("/contas-pagar");

export async function listarContasPagar() {
    const dados = await contas.list();
    return Array.isArray(dados) ? dados : [];
}

export async function salvarContaPagar(conta) {
    return contas.create(conta);
}

export async function baixarContaPagar(id, valor) {
    const { default: api } = await import("./api");
    const { data } = await api.put(`/contas-pagar/${id}/baixar`, valor != null ? { valor } : {});
    return data;
}

export async function agruparParcelarPagar(pedido) {
    const { default: api } = await import("./api");
    const { data } = await api.post("/contas-pagar/agrupar-parcelar", pedido);
    return data;
}

export async function excluirContaPagar(id) {
    await contas.remove(id);
}
