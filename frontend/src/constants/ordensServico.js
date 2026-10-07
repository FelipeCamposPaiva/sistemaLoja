export const SITUACOES = [
    { id: "todas", label: "todas" },
    { id: "em-aberto", label: "em aberto", status: ["EM_ABERTO"], cor: "#e11d48" },
    { id: "orcadas", label: "orçadas", status: ["ORCAMENTO", "ORÇAMENTO", "ORCADA"], cor: "#f97316" },
    { id: "aprovadas", label: "aprovadas", status: ["APROVADO", "APROVADA"], cor: "#22c55e" },
    { id: "nao-aprovadas", label: "não aprovadas", status: ["NAO_APROVADA", "NÃO APROVADA"], cor: "#64748b" },
    { id: "em-andamento", label: "em andamento", status: ["EM_ANDAMENTO", "ARTE", "AJUSTE_ARTE", "PRODUCAO", "PRODUÇÃO", "ACABAMENTO"], cor: "#ef4444" },
    { id: "servico-concluido", label: "serviço concluído", status: ["SERVICO_CONCLUIDO", "PRONTO"], cor: "#3b82f6" },
    { id: "canceladas", label: "canceladas", status: ["CANCELADA", "CANCELADO"], cor: "#94a3b8" },
    { id: "finalizadas", label: "finalizadas", status: ["FINALIZADA", "ENTREGUE"], cor: "#ff2f92" }
];

export const COLUNAS_OS = [
    { id: "numero", label: "Número" },
    { id: "data", label: "Data" },
    { id: "prevista", label: "Data Prevista" },
    { id: "conclusao", label: "Data de conclusão" },
    { id: "cliente", label: "Cliente" },
    { id: "fantasia", label: "Nome fantasia" },
    { id: "tecnicos", label: "Técnicos" },
    { id: "setor", label: "Setor" },
    { id: "total", label: "Total" },
    { id: "equipamento", label: "Equipamento" },
    { id: "marcadores", label: "Marcadores" },
    { id: "integracoes", label: "Integrações" },
    { id: "situacao", label: "Situação" }
];

export const TIPOS_ITEM_OS = [
    { id: "servico", label: "Serviço" },
    { id: "peca", label: "Peça / produto" }
];

export const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const FORMAS_RECEBIMENTO = [
    "Dinheiro",
    "Pix",
    "Cartão de crédito",
    "Cartão de débito",
    "Boleto",
    "Crediário",
    "Transferência"
];

export const CATEGORIAS_PAGAMENTO = ["Receita", "Serviço", "Venda"];

export const LISTAS_PRECO = ["Padrão", "Atacado", "Promocional"];

const LEGADO_ABA = {
    ORCAMENTO: "orcadas",
    "ORÇAMENTO": "orcadas",
    ORCADA: "orcadas",
    APROVADO: "aprovadas",
    APROVADA: "aprovadas",
    NAO_APROVADA: "nao-aprovadas",
    "NÃO APROVADA": "nao-aprovadas",
    EM_ABERTO: "em-aberto",
    EM_ANDAMENTO: "em-andamento",
    ARTE: "em-andamento",
    AJUSTE_ARTE: "em-andamento",
    PRODUCAO: "em-andamento",
    "PRODUÇÃO": "em-andamento",
    ACABAMENTO: "em-andamento",
    SERVICO_CONCLUIDO: "servico-concluido",
    PRONTO: "servico-concluido",
    CANCELADA: "canceladas",
    CANCELADO: "canceladas",
    FINALIZADA: "finalizadas",
    ENTREGUE: "finalizadas"
};

export function codigoStatus(valor) {
    const bruto = String(valor || "EM_ABERTO")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");
    const mapa = {
        EM_ABERTO: "EM_ABERTO",
        ABERTA: "EM_ABERTO",
        ABERTO: "EM_ABERTO",
        ORCADA: "ORCAMENTO",
        ORCADAS: "ORCAMENTO",
        ORCAMENTO: "ORCAMENTO",
        APROVADA: "APROVADO",
        APROVADAS: "APROVADO",
        APROVADO: "APROVADO",
        NAO_APROVADA: "NAO_APROVADA",
        EM_ANDAMENTO: "EM_ANDAMENTO",
        ARTE: "ARTE",
        AJUSTE_ARTE: "AJUSTE_ARTE",
        PRODUCAO: "PRODUCAO",
        PRODUCAO_GRAFICA: "PRODUCAO",
        ACABAMENTO: "ACABAMENTO",
        SERVICO_CONCLUIDO: "PRONTO",
        PRONTO: "PRONTO",
        CANCELADA: "CANCELADA",
        CANCELADO: "CANCELADA",
        FINALIZADA: "FINALIZADA",
        FINALIZADAS: "FINALIZADA",
        ENTREGUE: "ENTREGUE"
    };
    return mapa[bruto] || bruto || "EM_ABERTO";
}

export function abaDaSituacao(status) {
    return LEGADO_ABA[codigoStatus(status)] || "em-aberto";
}

export function situacaoMeta(status) {
    const aba = abaDaSituacao(status);
    return SITUACOES.find((s) => s.id === aba) || SITUACOES[1];
}

export function rotuloSituacao(status) {
    const label = situacaoMeta(status).label;
    return label.charAt(0).toUpperCase() + label.slice(1);
}

export function itemServicoVazio() {
    return {
        descricao: "",
        codigo: "",
        tipo: "servico",
        quantidade: "1",
        preco: "0",
        desconto: "0",
        orcar: false,
        ok: false
    };
}

export function parcelaVazia(dias = 30) {
    const data = new Date();
    data.setDate(data.getDate() + Number(dias || 0));
    return {
        dias: String(dias || 30),
        data: isoDate(data),
        valor: "0"
    };
}

export function osVazia() {
    const hoje = isoDate(new Date());
    return {
        id: null,
        numero: "",
        clienteId: "",
        cliente: "",
        fantasia: "",
        equipamento: "",
        maquinaId: null,
        marcadores: "",
        telefone: "",
        descricao: "",
        consideracoes: "",
        municipioDiferente: false,
        listaPreco: "Padrão",
        valor: 0,
        status: "EM_ABERTO",
        dataAbertura: hoje,
        dataPrevisao: "",
        dataConclusao: "",
        hora: "",
        desconto: "0",
        observacoes: "",
        observacoesInternas: "",
        vendedor: "",
        comissaoPct: "0",
        valorComissao: "0",
        tecnicos: [],
        setorAtual: "ORCAMENTO",
        historicoWorkflow: [],
        formaPagamento: "Crediário",
        categoria: "Receita",
        condicao: "30",
        dadosAdicionais: "",
        itens: [],
        parcelas: [parcelaVazia(30)],
        anexos: [],
        contasLancadas: false,
        estoqueLancado: false,
        nfsEmitida: false,
        descontoAutomatico: true,
        naturezaOperacaoId: "",
        naturezaOperacao: "",
        naturezaCodigo: "",
        cfop: ""
    };
}

export function isoDate(valor) {
    if (!valor) {
        return "";
    }
    if (Array.isArray(valor) && valor.length >= 3) {
        const [y, m, d] = valor;
        return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    const s = String(valor);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return s.slice(0, 10);
    }
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) {
        return "";
    }
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

export function dataBr(valor) {
    const iso = isoDate(valor);
    if (!iso) {
        return "";
    }
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

export function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export function totalItem(item) {
    const qtd = Number(String(item?.quantidade ?? 1).replace(",", ".")) || 0;
    const preco = Number(String(item?.preco ?? 0).replace(",", ".")) || 0;
    const desc = Number(String(item?.desconto ?? 0).replace(",", ".")) || 0;
    const bruto = qtd * preco;
    return Math.max(0, bruto - (bruto * desc) / 100);
}

export function totalServicos(itens) {
    return (itens || []).reduce((acc, item) => acc + totalItem(item), 0);
}

export function tipoItem(item) {
    const tipo = String(item?.tipo || "servico").toLowerCase();
    return tipo === "peca" || tipo === "produto" ? "peca" : "servico";
}

export function totalPorTipo(itens, tipo) {
    return (itens || [])
        .filter((item) => tipoItem(item) === tipo)
        .reduce((acc, item) => acc + totalItem(item), 0);
}

export function pctDescontoOS(os) {
    const bruto = totalServicos(os?.itens);
    const raw = String(os?.desconto ?? "0").trim();
    if (raw.endsWith("%")) {
        return Math.max(0, Number(raw.replace("%", "").replace(",", ".")) || 0);
    }
    const valor = Number(raw.replace(",", ".")) || 0;
    if (bruto <= 0) {
        return 0;
    }
    return Math.max(0, (valor / bruto) * 100);
}

export function totalLiquido(os) {
    const bruto = totalServicos(os.itens);
    const raw = String(os.desconto ?? "0").trim();
    if (raw.endsWith("%")) {
        const pct = Number(raw.replace("%", "").replace(",", ".")) || 0;
        return Math.max(0, bruto - (bruto * pct) / 100);
    }
    const desc = Number(raw.replace(",", ".")) || 0;
    return Math.max(0, bruto - desc);
}

export function nomesTecnicos(os) {
    return (os?.tecnicos || []).map((t) => t.nome).filter(Boolean).join(", ");
}

export function calcularComissoes(os, faixaFn) {
    const liquido = totalLiquido(os);
    const servicos = totalPorTipo(os.itens, "servico");
    const pecas = totalPorTipo(os.itens, "peca");
    const pctVendedor = Number(String(os.comissaoPct ?? 0).replace(",", ".")) || 0;
    const valorVendedor = (pecas > 0 ? pecas : liquido) * pctVendedor / 100;
    const faixa = faixaFn ? faixaFn(pctDescontoOS(os)) : { pct: 0, label: "" };
    const tecnicos = os.tecnicos || [];
    const baseTecnico = servicos > 0 ? servicos : 0;
    const pool = baseTecnico * (faixa.pct || 0) / 100;
    const pesos = tecnicos.map((t) => Number(t.pct) || 1);
    const somaPesos = pesos.reduce((acc, n) => acc + n, 0) || 1;
    const detalheTecnicos = tecnicos.map((t, i) => {
        const valor = pool * pesos[i] / somaPesos;
        return { ...t, pct: faixa.pct || 0, valor: Math.round(valor * 100) / 100 };
    });
    const valorTecnicos = detalheTecnicos.reduce((acc, t) => acc + t.valor, 0);
    return {
        servicos,
        pecas,
        liquido,
        pctDesconto: pctDescontoOS(os),
        faixa,
        valorVendedor: Math.round(valorVendedor * 100) / 100,
        valorTecnicos: Math.round(valorTecnicos * 100) / 100,
        tecnicos: detalheTecnicos
    };
}

function detalhesDe(raw) {
    if (!raw) {
        return {};
    }
    if (typeof raw === "object") {
        return raw;
    }
    try {
        return JSON.parse(raw) || {};
    } catch {
        return {};
    }
}

export function osDaApi(raw) {
    const base = osVazia();
    const extra = detalhesDe(raw?.detalhes);
    const itens = Array.isArray(extra.itens) ? extra.itens : base.itens;
    const parcelas = Array.isArray(extra.parcelas) && extra.parcelas.length
        ? extra.parcelas
        : base.parcelas;
    return {
        ...base,
        ...extra,
        id: raw?.id,
        numero: raw?.numero ?? extra.numero ?? "",
        clienteId: raw?.clienteId || extra.clienteId || "",
        cliente: raw?.cliente || extra.cliente || "",
        fantasia: raw?.nomeFantasia || extra.fantasia || "",
        equipamento: raw?.equipamento || extra.equipamento || "",
        maquinaId: raw?.maquinaId || extra.maquinaId || null,
        marcadores: raw?.marcadores || extra.marcadores || "",
        telefone: raw?.telefone || extra.telefone || "",
        descricao: raw?.descricao || extra.descricao || "",
        consideracoes: extra.consideracoes || "",
        municipioDiferente: Boolean(extra.municipioDiferente),
        listaPreco: extra.listaPreco || "Padrão",
        valor: Number(raw?.valor ?? extra.valor ?? 0),
        status: codigoStatus(raw?.status || extra.status || "EM_ABERTO"),
        olistId: extra.olistId || null,
        contatoOlistId: extra.contatoOlistId || null,
        dataAbertura: isoDate(raw?.dataAbertura || extra.dataAbertura) || base.dataAbertura,
        dataPrevisao: isoDate(raw?.dataPrevisao || extra.dataPrevisao),
        dataConclusao: isoDate(raw?.dataConclusao || extra.dataConclusao),
        hora: extra.hora || "",
        desconto: extra.desconto != null ? String(extra.desconto) : "0",
        observacoes: raw?.observacoes || extra.observacoes || "",
        observacoesInternas: extra.observacoesInternas || "",
        vendedor: raw?.responsavel || extra.vendedor || "",
        comissaoPct: extra.comissaoPct != null ? String(extra.comissaoPct) : "0",
        valorComissao: extra.valorComissao != null ? String(extra.valorComissao) : "0",
        tecnicos: Array.isArray(extra.tecnicos) ? extra.tecnicos : [],
        setorAtual: extra.setorAtual || codigoStatus(raw?.status || extra.status || "EM_ABERTO"),
        historicoWorkflow: Array.isArray(extra.historicoWorkflow) ? extra.historicoWorkflow : [],
        formaPagamento: raw?.formaPagamento || extra.formaPagamento || "Crediário",
        categoria: raw?.categoria || extra.categoria || "Receita",
        condicao: extra.condicao || "30",
        dadosAdicionais: extra.dadosAdicionais || "",
        itens,
        parcelas,
        anexos: Array.isArray(extra.anexos) ? extra.anexos : [],
        contasLancadas: Boolean(extra.contasLancadas),
        estoqueLancado: Boolean(extra.estoqueLancado),
        nfsEmitida: Boolean(extra.nfsEmitida),
        descontoAutomatico: extra.descontoAutomatico !== false
    };
}

export function osParaApi(os) {
    const dosItens = totalLiquido(os);
    const valor = dosItens > 0 ? dosItens : Number(os.valor || 0);
    const detalhes = {
        listaPreco: os.listaPreco || "Padrão",
        olistId: os.olistId || null,
        contatoOlistId: os.contatoOlistId || null,
        consideracoes: os.consideracoes || "",
        municipioDiferente: Boolean(os.municipioDiferente),
        hora: os.hora || "",
        desconto: Number(String(os.desconto ?? 0).replace(",", ".")) || 0,
        observacoesInternas: os.observacoesInternas || "",
        comissaoPct: Number(String(os.comissaoPct ?? 0).replace(",", ".")) || 0,
        valorComissao: Number(String(os.valorComissao ?? 0).replace(",", ".")) || 0,
        tecnicos: os.tecnicos || [],
        setorAtual: os.setorAtual || codigoStatus(os.status || "EM_ABERTO"),
        historicoWorkflow: os.historicoWorkflow || [],
        condicao: os.condicao || "30",
        dadosAdicionais: os.dadosAdicionais || "",
        itens: os.itens || [],
        parcelas: os.parcelas || [],
        anexos: (os.anexos || []).map((a) => ({ nome: a.nome, dataUrl: a.dataUrl })),
        contasLancadas: Boolean(os.contasLancadas),
        estoqueLancado: Boolean(os.estoqueLancado),
        nfsEmitida: Boolean(os.nfsEmitida),
        descontoAutomatico: os.descontoAutomatico !== false,
        naturezaOperacaoId: os.naturezaOperacaoId || null,
        naturezaOperacao: os.naturezaOperacao || "",
        naturezaCodigo: os.naturezaCodigo || "",
        cfop: os.cfop || ""
    };
    return {
        id: os.id || null,
        numero: os.numero ? Number(os.numero) : null,
        clienteId: os.clienteId ? Number(os.clienteId) : null,
        cliente: os.cliente || null,
        nomeFantasia: os.fantasia || null,
        equipamento: os.equipamento || null,
        maquinaId: os.maquinaId ? Number(os.maquinaId) : null,
        marcadores: os.marcadores || null,
        telefone: os.telefone || null,
        descricao: os.descricao || null,
        valor,
        status: codigoStatus(os.status || "EM_ABERTO"),
        dataAbertura: os.dataAbertura || null,
        dataPrevisao: os.dataPrevisao || null,
        dataConclusao: os.dataConclusao || null,
        categoria: os.categoria || null,
        formaPagamento: os.formaPagamento || null,
        responsavel: os.vendedor || null,
        observacoes: os.observacoes || null,
        arquivoArte: os.anexos?.[0]?.nome || null,
        prioridade: "MEDIA",
        detalhes: JSON.stringify(detalhes)
    };
}
