import api, { resource } from "./api";
import { COLUNAS_PADRAO } from "../constants/kanbanProducao";

const producao = resource("/producao");

const COLUNA_STATUS = {
    orcamento: "ORCAMENTO",
    aprovado: "APROVADO",
    arte: "ARTE",
    producao: "PRODUCAO",
    acabamento: "ACABAMENTO",
    pronto: "PRONTO",
    entregue: "ENTREGUE"
};

const STATUS_COLUNA = Object.fromEntries(
    Object.entries(COLUNA_STATUS).map(([coluna, status]) => [status, coluna])
);

function prioridadeDaApi(valor) {
    const texto = String(valor || "NORMAL").toLowerCase();
    if (texto === "alta" || texto === "high") {
        return "alta";
    }
    if (texto === "baixa" || texto === "low") {
        return "baixa";
    }
    return "media";
}

function prioridadeParaApi(valor) {
    if (valor === "alta") {
        return "ALTA";
    }
    if (valor === "baixa") {
        return "BAIXA";
    }
    return "NORMAL";
}

export function cardDaApi(raw) {
    const status = String(raw?.status || raw?.etapa || "ORCAMENTO").toUpperCase();
    return {
        id: raw?.id,
        colunaId: STATUS_COLUNA[status] || "orcamento",
        titulo: raw?.produto || "",
        cliente: raw?.cliente || "",
        descricao: raw?.observacao || "",
        valor: "",
        prazo: raw?.dataEntrega || "",
        responsavel: raw?.responsavel || "",
        prioridade: prioridadeDaApi(raw?.prioridade),
        quantidade: raw?.quantidade || 1
    };
}

export function cardParaApi(card) {
    return {
        id: typeof card.id === "number" ? card.id : null,
        cliente: card.cliente || "",
        produto: card.titulo || "",
        quantidade: Number(card.quantidade) || 1,
        dataEntrega: card.prazo || null,
        prioridade: prioridadeParaApi(card.prioridade),
        responsavel: card.responsavel || "",
        etapa: COLUNA_STATUS[card.colunaId] || "ORCAMENTO",
        status: COLUNA_STATUS[card.colunaId] || "ORCAMENTO",
        observacao: card.descricao || ""
    };
}

export async function listarProducao() {
    const dados = await producao.list();
    return Array.isArray(dados) ? dados.map(cardDaApi) : [];
}

export async function painelProducaoDaApi() {
    const cards = await listarProducao();
    return { colunas: COLUNAS_PADRAO, cards };
}

export async function salvarProducao(card) {
    const payload = cardParaApi(card);
    if (typeof card.id === "number") {
        return cardDaApi(await producao.update(card.id, payload));
    }
    return cardDaApi(await producao.create(payload));
}

export async function moverProducao(id, colunaId) {
    const { data } = await api.put(`/producao/${id}/status`, {
        status: COLUNA_STATUS[colunaId] || "ORCAMENTO"
    });
    return cardDaApi(data);
}

export async function excluirProducao(id) {
    await producao.remove(id);
}
