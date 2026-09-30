import api, { resource } from "./api";

const bens = resource("/bens-patrimoniais");

export async function buscarBalanco(ano, mes) {
    const { data } = await api.get("/balanco-patrimonial", { params: { ano, mes } });
    return data || {};
}

export async function listarBensPatrimoniais() {
    const dados = await bens.list();
    return Array.isArray(dados) ? dados : [];
}

export async function salvarBemPatrimonial(bem) {
    if (bem?.id) {
        return bens.update(bem.id, bem);
    }
    return bens.create(bem);
}

export async function baixarBemPatrimonial(id, dataBaixa) {
    const { data } = await api.put(`/bens-patrimoniais/${id}/baixar`, dataBaixa ? { dataBaixa } : {});
    return data;
}

export async function excluirBemPatrimonial(id) {
    await bens.remove(id);
}
