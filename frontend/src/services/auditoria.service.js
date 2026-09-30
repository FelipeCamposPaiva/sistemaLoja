import api from "./api";

export const ENTIDADES_AUDITORIA = [
    { id: "", nome: "Todas" },
    { id: "PRODUTO", nome: "Produtos" },
    { id: "CLIENTE", nome: "Clientes" },
    { id: "OS", nome: "Ordens de serviço" },
    { id: "ESTOQUE", nome: "Estoque" },
    { id: "PEDIDO", nome: "Pedidos / compras" },
    { id: "CAIXA", nome: "Caixa" },
    { id: "NOTA", nome: "Notas de entrada" },
    { id: "TECNICO", nome: "Técnicos" },
    { id: "MOVEL", nome: "Móveis" }
];

export function camposDe(log) {
    const bruto = log?.alteracoes;
    if (Array.isArray(bruto)) {
        return bruto;
    }
    if (!bruto) {
        return [];
    }
    try {
        const parsed = JSON.parse(bruto);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [{ campo: "resumo", de: "", para: String(bruto) }];
    }
}

export function dataHoraLog(valor) {
    if (!valor) {
        return "";
    }
    if (Array.isArray(valor) && valor.length >= 5) {
        const [y, m, d, h = 0, min = 0] = valor;
        return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }
    const s = String(valor);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) {
        return s.replace("T", " ").slice(0, 16);
    }
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function rotuloAcao(acao) {
    const mapa = {
        CRIAR: "Cadastro",
        ALTERAR: "Alteração",
        EXCLUIR: "Exclusão",
        ENTRADA: "Entrada de estoque",
        SAIDA: "Saída de estoque",
        AJUSTE: "Ajuste de estoque",
        BALANCO: "Balanço",
        ESTORNO: "Estorno",
        PERDA: "Perda",
        PRODUCAO: "Produção",
        TRANSFERENCIA: "Transferência"
    };
    return mapa[acao] || acao || "—";
}

export async function listarAuditoria(filtros = {}) {
    const params = {};
    if (filtros.entidade) {
        params.entidade = filtros.entidade;
    }
    if (filtros.registroId) {
        params.registroId = filtros.registroId;
    }
    if (filtros.q) {
        params.q = filtros.q;
    }
    const { data } = await api.get("/auditoria", { params });
    return Array.isArray(data) ? data : [];
}

export async function registrarAuditoria(payload) {
    const { data } = await api.post("/auditoria", payload);
    return data;
}
