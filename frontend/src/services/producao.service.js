import ROTAS from "../constants/rotas";
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

function lerDetalhe(observacao) {
    try {
        const parsed = JSON.parse(observacao || "");
        if (parsed && parsed.v === 1) {
            return parsed;
        }
    } catch {
        /* observação em texto livre */
    }
    return null;
}

export function ordemDaApi(raw) {
    const detalhe = lerDetalhe(raw?.observacao);
    return {
        id: raw?.id,
        cliente: raw?.cliente || "",
        produto: raw?.produto || "",
        quantidade: raw?.quantidade || 1,
        data: raw?.dataEntrega || "",
        hora: raw?.hora || "09:00",
        responsavel: raw?.responsavel || "",
        supervisor: raw?.supervisor || "",
        status: String(raw?.status || raw?.etapa || "EM_ABERTO").toUpperCase(),
        observacao: detalhe ? (detalhe.texto || "") : (raw?.observacao || ""),
        unidade: detalhe?.unidade || "UN",
        numero: raw?.numero || detalhe?.numero || "",
        foto: detalhe?.foto || "",
        anexos: Array.isArray(detalhe?.anexos) ? detalhe.anexos : [],
        dataPrevista: detalhe?.dataPrevista || "",
        pedido: detalhe?.pedido || "",
        sku: detalhe?.sku || "",
        produtoId: detalhe?.produtoId || "",
        categoria: detalhe?.categoria || "",
        criadoEm: normalizarInstante(raw?.criadoEm),
        marcadores: detalhe?.marcadores || "",
        composicao: Array.isArray(detalhe?.composicao) ? detalhe.composicao : [],
        etapas: Array.isArray(detalhe?.etapas) ? detalhe.etapas : [],
        inicio: normalizarInstante(raw?.inicio || detalhe?.inicio),
        termino: normalizarInstante(raw?.termino || detalhe?.termino),
        inicioManual: Boolean(detalhe?.inicioManual),
        terminoManual: Boolean(detalhe?.terminoManual),
        alteracoes: Array.isArray(detalhe?.alteracoes) ? detalhe.alteracoes : [],
        agendaEventoId: raw?.agendaEventoId || null
    };
}

function completarSegundos(valor) {
    if (!valor) {
        return null;
    }
    const texto = String(valor).replace(" ", "T");
    if (texto.length === 16) {
        return `${texto}:00`;
    }
    return texto.slice(0, 19);
}

function normalizarInstante(valor) {
    if (!valor) {
        return "";
    }
    return String(valor).replace(" ", "T").slice(0, 19);
}

export function ordemParaApi(ordem) {
    return {
        cliente: ordem.cliente || "",
        produto: ordem.produto || "",
        quantidade: Number(ordem.quantidade) || 1,
        dataEntrega: ordem.data || null,
        hora: ordem.hora || "09:00",
        prioridade: "NORMAL",
        responsavel: ordem.responsavel || "",
        supervisor: ordem.supervisor || "",
        numero: Number(ordem.numero) || null,
        etapa: ordem.status || "EM_ABERTO",
        status: ordem.status || "EM_ABERTO",
        inicio: completarSegundos(ordem.inicio),
        termino: completarSegundos(ordem.termino),
        observacao: JSON.stringify({
            v: 1,
            texto: ordem.observacao || "",
            unidade: ordem.unidade || "UN",
            numero: ordem.numero || "",
            foto: ordem.foto || "",
            anexos: (ordem.anexos || []).map((item) => ({
                nome: item.nome || "anexo",
                url: item.url || ""
            })),
            dataPrevista: ordem.dataPrevista || "",
            pedido: ordem.pedido || "",
            sku: ordem.sku || "",
            produtoId: ordem.produtoId || "",
            categoria: ordem.categoria || "",
            marcadores: ordem.marcadores || "",
            composicao: ordem.composicao || [],
            etapas: ordem.etapas || [],
            inicio: ordem.inicio || "",
            termino: ordem.termino || "",
            inicioManual: Boolean(ordem.inicioManual),
            terminoManual: Boolean(ordem.terminoManual),
            alteracoes: ordem.alteracoes || []
        })
    };
}

export function rotaNovaOrdemProducao(dados = {}) {
    const params = new URLSearchParams();
    ["pedido", "cliente", "produto", "sku", "quantidade", "unidade"].forEach((chave) => {
        const valor = String(dados[chave] ?? "").trim();
        if (valor) {
            params.set(chave, valor);
        }
    });
    const consulta = params.toString();
    return `${ROTAS.PRODUCAO}${consulta ? `?${consulta}` : ""}#add`;
}

export function rotaOrdemDoPedido(pedido) {
    const item = (pedido?.itens || [])[0] || {};
    return rotaNovaOrdemProducao({
        pedido: pedido?.numero || pedido?.id || "",
        cliente: pedido?.cliente || "",
        produto: item.descricao || item.nome || "",
        sku: item.sku || "",
        quantidade: item.quantidade || 1
    });
}

export async function listarOrdensProducao() {
    const dados = await producao.list();
    return Array.isArray(dados) ? dados.map(ordemDaApi) : [];
}

export async function salvarOrdemProducao(ordem) {
    const payload = ordemParaApi(ordem);
    if (typeof ordem.id === "number") {
        return ordemDaApi(await producao.update(ordem.id, payload));
    }
    return ordemDaApi(await producao.create(payload));
}

export async function excluirOrdemProducao(id) {
    await producao.remove(id);
}

export async function enviarAnexoProducao(id, arquivo) {
    const corpo = new FormData();
    corpo.append("arquivo", arquivo);
    const { data } = await api.post(`/producao/${id}/anexo`, corpo, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return { nome: data?.nome || arquivo.name, url: data?.url || "" };
}
