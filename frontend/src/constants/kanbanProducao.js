const KEY = "erp-painel-producao-v1";

export const PRIORIDADES = [
    { id: "baixa", nome: "Baixa", cor: "#64748b" },
    { id: "media", nome: "Média", cor: "#f59e0b" },
    { id: "alta", nome: "Alta", cor: "#ef4444" }
];

export const COLUNAS_PADRAO = [
    { id: "orcamento", nome: "Orçamento", cor: "#f59e0b" },
    { id: "aprovado", nome: "Aprovado", cor: "#3b82f6" },
    { id: "arte", nome: "Arte", cor: "#8b5cf6" },
    { id: "producao", nome: "Produção", cor: "#ea580c" },
    { id: "acabamento", nome: "Acabamento", cor: "#d97706" },
    { id: "pronto", nome: "Pronto", cor: "#16a34a" },
    { id: "entregue", nome: "Entregue", cor: "#15803d" }
];

export const CARDS_PADRAO = [
    {
        id: "os-1001",
        colunaId: "producao",
        titulo: "Banner 3x1,20m lona",
        cliente: "Papelaria Central",
        descricao: "Impressão solvente + ilhós a cada 50cm",
        valor: "280,00",
        prazo: "2026-09-04",
        responsavel: "Márcio",
        prioridade: "alta"
    },
    {
        id: "os-1002",
        colunaId: "arte",
        titulo: "Cartões de visita 1000un",
        cliente: "Escola Horizonte",
        descricao: "Couchê 300g, 4x4, verniz local",
        valor: "190,00",
        prazo: "2026-09-08",
        responsavel: "Ana",
        prioridade: "media"
    },
    {
        id: "os-1003",
        colunaId: "orcamento",
        titulo: "Adesivos vinil recorte",
        cliente: "Loja Tem de Tudo Matriz",
        descricao: "Logo 40x40cm, 20 unidades",
        valor: "150,00",
        prazo: "2026-09-10",
        responsavel: "Ana",
        prioridade: "baixa"
    },
    {
        id: "os-1004",
        colunaId: "acabamento",
        titulo: "Cadernos personalizados",
        cliente: "Colégio São José",
        descricao: "Capa dura A5, 80 un, wire-o",
        valor: "960,00",
        prazo: "2026-09-05",
        responsavel: "Márcio",
        prioridade: "alta"
    },
    {
        id: "os-1005",
        colunaId: "aprovado",
        titulo: "Faixa aniversário 5m",
        cliente: "Buffet Lua",
        descricao: "Lona fosca, corda e ilhós",
        valor: "220,00",
        prazo: "2026-09-06",
        responsavel: "Paula",
        prioridade: "media"
    },
    {
        id: "os-1006",
        colunaId: "pronto",
        titulo: "Folders A4 500un",
        cliente: "Farmácia Vida",
        descricao: "Couchê 150g, 4x4, dobra em U",
        valor: "410,00",
        prazo: "2026-09-03",
        responsavel: "Paula",
        prioridade: "media"
    }
];

export function painelVazio() {
    return { colunas: COLUNAS_PADRAO, cards: CARDS_PADRAO };
}

export function lerPainelProducao() {
    try {
        const bruto = JSON.parse(localStorage.getItem(KEY) || "null");
        if (bruto?.colunas?.length && Array.isArray(bruto.cards)) {
            return bruto;
        }
    } catch {
        /* ignore */
    }
    return painelVazio();
}

export function gravarPainelProducao(painel) {
    localStorage.setItem(KEY, JSON.stringify(painel));
}

export function novoId(prefixo) {
    return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
