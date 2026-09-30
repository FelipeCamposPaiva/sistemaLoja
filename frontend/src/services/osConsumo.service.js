import api from "./api";

export async function listarConsumos(osId) {
    const { data } = await api.get(`/os-consumo/${osId}`);
    return Array.isArray(data) ? data : [];
}

export async function salvarConsumo(consumo) {
    const { data } = await api.post("/os-consumo", consumo);
    return data;
}

export async function excluirConsumo(id) {
    await api.delete(`/os-consumo/${id}`);
}

export async function consumirOS(osId) {
    const { data } = await api.put(`/os-consumo/consumir/${osId}`);
    return data;
}
