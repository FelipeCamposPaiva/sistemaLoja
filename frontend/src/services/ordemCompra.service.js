import { resource } from "./api";

const ordens = resource("/ordens-compra");

export async function listarOrdensCompra() {
    const dados = await ordens.list();
    return Array.isArray(dados) ? dados : [];
}

export async function salvarOrdemCompra(ordem) {
    return ordens.create(ordem);
}

export async function excluirOrdemCompra(id) {
    await ordens.remove(id);
}

export async function receberOrdem(id) {
    const { default: api } = await import("./api");
    const { data } = await api.put(`/ordens-compra/${id}/receber`);
    return data;
}
