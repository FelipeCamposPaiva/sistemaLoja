import { resource } from "./api";

const caixa = resource("/caixa");

export async function listarCaixa() {
    const dados = await caixa.list();
    return Array.isArray(dados) ? dados : [];
}

export async function salvarMovimento(movimento) {
    return caixa.create(movimento);
}

export async function excluirMovimento(id) {
    await caixa.remove(id);
}

export async function registrarVendaCaixa({ valor, descricao, referenciaId }) {
    return salvarMovimento({
        tipo: "ENTRADA",
        origem: "PDV",
        valor,
        descricao,
        referenciaId: referenciaId || null
    });
}

export async function registrarOsCaixa({ valor, descricao, referenciaId }) {
    return salvarMovimento({
        tipo: "ENTRADA",
        origem: "OS",
        valor,
        descricao,
        referenciaId: referenciaId || null
    });
}
