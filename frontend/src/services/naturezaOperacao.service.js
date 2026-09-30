import api, { resource } from "./api";
import { NATUREZAS_OPERACAO, sugerirNatureza } from "../constants/naturezasOperacao";

const naturezas = resource("/naturezas-operacao");

export async function listarNaturezasOperacao() {
    try {
        const dados = await naturezas.list();
        if (Array.isArray(dados) && dados.length) {
            return dados;
        }
    } catch {
        /* usa catálogo local */
    }
    return NATUREZAS_OPERACAO.map((n, i) => ({ ...n, id: n.id || i + 1, ativo: true }));
}

export async function sugerirNaturezaOperacao(filtros = {}) {
    try {
        const params = {};
        ["clienteId", "uf", "cpfCnpj", "tipoPessoa", "contribuinte", "consumidorFinal", "finalidade"].forEach((chave) => {
            if (filtros[chave] !== undefined && filtros[chave] !== null && filtros[chave] !== "") {
                params[chave] = filtros[chave];
            }
        });
        const { data } = await api.get("/naturezas-operacao/sugerir", { params });
        if (data?.nome) {
            return data;
        }
    } catch {
        /* fallback local */
    }
    return sugerirNatureza(filtros);
}
