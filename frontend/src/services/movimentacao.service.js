import api, { resource } from "./api";

const estoque = resource("/estoque");

function paramsLimpos(filtros = {}) {
    const params = {};
    Object.entries(filtros).forEach(([chave, valor]) => {
        if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
            params[chave] = valor;
        }
    });
    return params;
}

export async function listarMovimentacoes() {
    const dados = await estoque.list();
    return Array.isArray(dados) ? dados : [];
}

export async function consultarAuditoria(filtros = {}) {
    const { data } = await api.get("/estoque/auditoria", { params: paramsLimpos(filtros) });
    return Array.isArray(data) ? data : [];
}

export async function filtrosAuditoria() {
    const { data } = await api.get("/estoque/auditoria/filtros");
    return data || { usuarios: [], tipos: [], origens: [], status: [] };
}

export async function salvarMovimentacao(movimento) {
    return estoque.create(movimento);
}

export async function estornarMovimentacao(id) {
    const { data } = await api.put(`/estoque/${id}/estornar`);
    return data;
}
