import api from "./api";

export async function listarItens(ordemId) {
    const { data } = await api.get(`/ordens-compra-itens/${ordemId}`);
    return Array.isArray(data) ? data : [];
}

export async function salvarItem(item) {
    const { data } = await api.post("/ordens-compra-itens", item);
    return data;
}

export async function excluirItem(id) {
    await api.delete(`/ordens-compra-itens/${id}`);
}
