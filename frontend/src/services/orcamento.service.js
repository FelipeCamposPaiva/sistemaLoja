import api, { resource } from "./api";

const orcamentos = resource("/orcamentos");

const FECHADOS = new Set(["aprovada", "concluida", "modelo", "aguardando"]);

export function sinaisDoStatus(status) {
    const codigo = status || "em_aberto";
    return {
        status: codigo,
        aberto: !FECHADOS.has(codigo),
        pendente: codigo === "pendente",
        sinal: codigo === "aprovada" ? "ok" : codigo === "nao_aprovada" ? "alerta" : "neutro"
    };
}

export function orcamentoDaApi(raw) {
    const data = String(raw?.dataOrcamento || "").slice(0, 10);
    const status = sinaisDoStatus(raw?.status || "em_aberto");
    return {
        id: raw?.id,
        numero: raw?.numero || "",
        data,
        cliente: raw?.clienteNome || "",
        clienteId: raw?.clienteId || null,
        fantasia: raw?.nomeFantasia || "",
        valor: Number(raw?.valor || 0),
        vendedor: raw?.vendedor || "",
        email: Boolean(raw?.emailEnviado),
        observacoes: raw?.observacoes || "",
        ...status
    };
}

export function orcamentoParaApi(item) {
    const status = sinaisDoStatus(item.status || "em_aberto");
    const data = item.data || new Date().toISOString().slice(0, 10);
    return {
        id: typeof item.id === "number" ? item.id : null,
        numero: item.numero ? String(item.numero) : "",
        clienteId: item.clienteId || null,
        clienteNome: item.cliente || "",
        nomeFantasia: item.fantasia || "",
        valor: Number(item.valor || 0),
        observacoes: item.observacoes || "",
        status: status.status,
        dataOrcamento: data.length === 10 ? `${data}T12:00:00` : data,
        vendedor: item.vendedor || "",
        emailEnviado: Boolean(item.email)
    };
}

export async function listarOrcamentos() {
    const dados = await orcamentos.list();
    return Array.isArray(dados) ? dados.map(orcamentoDaApi) : [];
}

export async function salvarOrcamento(item) {
    const payload = orcamentoParaApi(item);
    const salvo = payload.id ? await orcamentos.update(payload.id, payload) : await orcamentos.create(payload);
    return orcamentoDaApi(salvo);
}

export async function excluirOrcamento(id) {
    await orcamentos.remove(id);
}

export async function importarOrcamentosLote(itens, onProgress) {
    const payload = (Array.isArray(itens) ? itens : []).map((item) => orcamentoParaApi(item)).filter((item) => item.clienteNome || item.numero);
    if (!payload.length) {
        return { novos: 0, atualizados: 0, erros: 0, total: 0 };
    }
    const totais = { novos: 0, atualizados: 0, erros: 0, total: 0 };
    const tamanho = 200;
    const partes = [];
    for (let i = 0; i < payload.length; i += tamanho) {
        partes.push(payload.slice(i, i + tamanho));
    }
    for (let i = 0; i < partes.length; i++) {
        const { data } = await api.post("/orcamentos/importar", partes[i]);
        totais.novos += Number(data?.novos || 0);
        totais.atualizados += Number(data?.atualizados || 0);
        totais.erros += Number(data?.erros || 0);
        totais.total += Number(data?.total || 0);
        onProgress?.({ parte: i + 1, partes: partes.length, ...totais });
    }
    return totais;
}
