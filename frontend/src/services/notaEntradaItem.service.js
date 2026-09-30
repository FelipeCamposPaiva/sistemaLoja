import api from "./api";

export async function listarItensNota(notaId) {
    const { data } = await api.get(`/notas-entrada-itens/${notaId}`);
    return Array.isArray(data) ? data : [];
}

export async function salvarItemNota(item) {
    const { data } = await api.post("/notas-entrada-itens", item);
    return data;
}

export async function excluirItemNota(id) {
    await api.delete(`/notas-entrada-itens/${id}`);
}
