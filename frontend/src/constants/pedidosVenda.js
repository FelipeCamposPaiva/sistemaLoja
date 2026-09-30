import { nomesEquipe, PCT_COMISSAO_PADRAO } from "./vendaVendedores";

export const ORIGENS_PEDIDO = ["Loja", "PDV", "Olist", "Shopee", "Mercado Livre", "Nuvemshop"];

export const ABAS_PEDIDO = [
    { id: "todas", label: "todos", cor: "" },
    { id: "em-aberto", label: "em aberto", cor: "#eab308" },
    { id: "aprovado", label: "aprovado", cor: "#22c55e" },
    { id: "preparando", label: "preparando envio", cor: "#f59e0b" },
    { id: "faturado", label: "faturado", cor: "#ef4444" },
    { id: "pronto", label: "pronto para envio", cor: "#38bdf8" },
    { id: "enviado", label: "enviado", cor: "#64748b" },
    { id: "entregue", label: "entregue", cor: "#84cc16" },
    { id: "nao-entregue", label: "não entregue", cor: "#111827" },
    { id: "dados-incompletos", label: "dados incompletos", cor: "#94a3b8" },
    { id: "cancelado", label: "cancelado", cor: "#64748b" }
];

export const ABAS_PEDIDO_MAIS = [
    { id: "estoque-nao", label: "estoque não lançado", cor: "#ef4444" },
    { id: "estoque-sim", label: "estoque lançado", cor: "#22c55e" },
    { id: "contas-nao", label: "contas não lançadas", cor: "#f97316" },
    { id: "contas-sim", label: "contas lançadas", cor: "#22c55e" }
];

export const ABAS_SEPARACAO = [
    { id: "todas", label: "Todas", cor: "#94a3b8" },
    { id: "sep-pendente", label: "Aguardando", cor: "#f59e0b" },
    { id: "sep-separando", label: "Separando", cor: "#3b82f6" },
    { id: "sep-separado", label: "Separado", cor: "#22c55e" },
    { id: "sep-embalagem", label: "Embalagem", cor: "#a855f7" },
    { id: "estoque-nao", label: "Estoque não lançado", cor: "#ef4444" }
];

export const ABAS_EXPEDICAO = [
    { id: "todas", label: "Todas", cor: "#94a3b8" },
    { id: "exp-pendente", label: "Pendente", cor: "#f59e0b" },
    { id: "exp-despachado", label: "Despachado", cor: "#22c55e" },
    { id: "estoque-nao", label: "Estoque não lançado", cor: "#ef4444" }
];

export const COLUNAS_PEDIDO = [
    { id: "foto", label: "Foto" },
    { id: "numero", label: "Nº" },
    { id: "data", label: "Data" },
    { id: "previsto", label: "Previsto" },
    { id: "despacho", label: "Data limite de despacho" },
    { id: "cliente", label: "Cliente" },
    { id: "fantasia", label: "Nome fantasia" },
    { id: "uf", label: "UF" },
    { id: "cidade", label: "Cidade" },
    { id: "documento", label: "CNPJ / CPF" },
    { id: "pagamento", label: "Status de pagamento" },
    { id: "total", label: "Total" },
    { id: "npedido", label: "Nº pedido" },
    { id: "nf", label: "Nº nota fiscal" },
    { id: "envio", label: "Forma de envio" },
    { id: "rastreio", label: "Rastreamento" },
    { id: "marcadores", label: "Marcadores" },
    { id: "integracoes", label: "Integrações" }
];

export const COLUNAS_PEDIDO_PADRAO = [
    "foto", "numero", "data", "previsto", "despacho", "cliente", "fantasia", "uf", "cidade",
    "documento", "pagamento", "total", "npedido", "nf", "envio", "rastreio", "marcadores", "integracoes"
];

export function passaAbaPedido(pedido, aba) {
    const status = String(pedido.status || "").toUpperCase();
    const sep = pedido.separacao || "PENDENTE";
    const exp = pedido.expedicao || "PENDENTE";
    if (!aba || aba === "todas") {
        return true;
    }
    if (aba === "estoque-nao") {
        return !pedido.estoqueLancado;
    }
    if (aba === "estoque-sim") {
        return Boolean(pedido.estoqueLancado);
    }
    if (aba === "contas-nao") {
        return !pedido.contasLancadas;
    }
    if (aba === "contas-sim") {
        return Boolean(pedido.contasLancadas);
    }
    if (aba === "em-aberto") {
        return ["ORCAMENTO", "EM_ABERTO", "APROVADO", "PRODUCAO", "PRONTO"].includes(status);
    }
    if (aba === "aprovado") {
        return status === "APROVADO";
    }
    if (aba === "preparando") {
        return status === "PRODUCAO" || sep === "SEPARANDO";
    }
    if (aba === "faturado") {
        return status === "FATURADO";
    }
    if (aba === "pronto") {
        return status === "PRONTO" || sep === "SEPARADO";
    }
    if (aba === "enviado") {
        return exp === "DESPACHADO" && status !== "ENTREGUE";
    }
    if (aba === "entregue") {
        return status === "ENTREGUE";
    }
    if (aba === "nao-entregue") {
        return status === "NAO_ENTREGUE" || (exp === "PENDENTE" && ["FATURADO", "PRONTO"].includes(status));
    }
    if (aba === "dados-incompletos") {
        return pedido.dadosIncompletos === true;
    }
    if (aba === "cancelado") {
        return status === "CANCELADO";
    }
    if (aba === "sep-pendente") {
        return sep === "PENDENTE";
    }
    if (aba === "sep-separando") {
        return sep === "SEPARANDO";
    }
    if (aba === "sep-separado") {
        return sep === "SEPARADO";
    }
    if (aba === "sep-embalagem") {
        return sep === "SEPARADO" && (pedido.embalagem || "AGUARDANDO") !== "EMBALADO";
    }
    if (aba === "exp-pendente") {
        return exp === "PENDENTE";
    }
    if (aba === "exp-despachado") {
        return exp === "DESPACHADO";
    }
    return true;
}

export function corSituacaoPedido(pedido) {
    const status = String(pedido.status || "").toUpperCase();
    if (status === "CANCELADO") {
        return "#94a3b8";
    }
    if (status === "ENTREGUE") {
        return "#84cc16";
    }
    if ((pedido.expedicao || "") === "DESPACHADO") {
        return "#64748b";
    }
    if (status === "FATURADO") {
        return "#ef4444";
    }
    if (status === "PRONTO" || pedido.separacao === "SEPARADO") {
        return "#38bdf8";
    }
    if (status === "PRODUCAO" || pedido.separacao === "SEPARANDO") {
        return "#f59e0b";
    }
    if (status === "APROVADO") {
        return "#22c55e";
    }
    return "#eab308";
}

export const STATUS_PEDIDO_VENDA = [
    { id: "ORCAMENTO", label: "Orçamento" },
    { id: "APROVADO", label: "Aprovado" },
    { id: "PRODUCAO", label: "Produção" },
    { id: "FATURADO", label: "Faturado" },
    { id: "PRONTO", label: "Pronto" },
    { id: "ENTREGUE", label: "Entregue" },
    { id: "CANCELADO", label: "Cancelado" }
];

export function rotuloStatusPedido(status) {
    return STATUS_PEDIDO_VENDA.find((s) => s.id === status)?.label || status || "—";
}

export function codigoStatusPedido(valor) {
    const bruto = String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
    const mapa = {
        orcamento: "ORCAMENTO",
        emaberto: "EM_ABERTO",
        aberto: "EM_ABERTO",
        aprovado: "APROVADO",
        preparandoenvio: "PRODUCAO",
        producao: "PRODUCAO",
        faturado: "FATURADO",
        prontoparaenvio: "PRONTO",
        pronto: "PRONTO",
        enviado: "FATURADO",
        entregue: "ENTREGUE",
        naoentregue: "NAO_ENTREGUE",
        cancelado: "CANCELADO",
        dadosincompletos: "EM_ABERTO"
    };
    return mapa[bruto] || "APROVADO";
}

export function flagsStatusPedido(situacao, status) {
    const bruto = String(situacao || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
    const entregue = status === "ENTREGUE" || bruto === "entregue";
    const enviado = bruto === "enviado";
    const faturado = status === "FATURADO" || bruto === "faturado";
    const pronto = status === "PRONTO" || bruto === "prontoparaenvio" || bruto === "pronto";
    const preparando = bruto === "preparandoenvio" || status === "PRODUCAO";
    return {
        estoqueLancado: entregue || enviado || faturado || pronto,
        contasLancadas: entregue,
        separacao: entregue || enviado || faturado || pronto ? "SEPARADO" : (preparando ? "SEPARANDO" : "PENDENTE"),
        expedicao: entregue || enviado ? "DESPACHADO" : "PENDENTE"
    };
}

export function dataPedidoParaApi(valor) {
    if (!valor) {
        return null;
    }
    const s = String(valor);
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
        return s.slice(0, 19);
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return `${s.slice(0, 10)}T12:00:00`;
    }
    return s;
}

export function moedaPedido(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dataPedidoBr(valor) {
    if (!valor) {
        return "—";
    }
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) {
        const s = String(valor);
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const [y, m, day] = s.slice(0, 10).split("-");
            return `${day}/${m}/${y}`;
        }
        return s;
    }
    return d.toLocaleDateString("pt-BR");
}

function extrasDetalhe(base = {}) {
    return {
        previsto: base.previsto || "",
        dataLimiteDespacho: base.dataLimiteDespacho || "",
        rastreio: base.rastreio || "",
        marcadores: base.marcadores || "",
        numeroPedido: base.numeroPedido || "",
        uf: base.uf || "",
        cidade: base.cidade || "",
        pagamento: base.pagamento || "",
        formaEnvio: base.formaEnvio || "",
        notaFiscal: base.notaFiscal || "",
        fantasia: base.fantasia || "",
        embalagem: base.embalagem || ""
    };
}

function detalhesDe(raw) {
    if (Array.isArray(raw?.itens) || Array.isArray(raw?.vendedores) || raw?.previsto || raw?.marcadores) {
        return {
            itens: raw.itens || [],
            vendedores: raw.vendedores || [],
            poolPct: Number(raw?.poolPct ?? PCT_COMISSAO_PADRAO),
            ...extrasDetalhe(raw)
        };
    }
    try {
        const parsed = typeof raw?.detalhes === "string" ? JSON.parse(raw.detalhes || "[]") : raw?.detalhes;
        if (Array.isArray(parsed)) {
            return { itens: parsed, vendedores: [], poolPct: PCT_COMISSAO_PADRAO, ...extrasDetalhe() };
        }
        if (parsed && typeof parsed === "object") {
            return {
                itens: parsed.itens || [],
                vendedores: parsed.vendedores || [],
                poolPct: Number(parsed.poolPct ?? PCT_COMISSAO_PADRAO),
                ...extrasDetalhe(parsed)
            };
        }
    } catch {
        /* ignore */
    }
    return { itens: [], vendedores: [], poolPct: PCT_COMISSAO_PADRAO, ...extrasDetalhe() };
}

export function pedidoDaApi(raw) {
    const detalhes = detalhesDe(raw);
    return {
        id: raw?.id,
        numero: raw?.numero || `PV-${raw?.id || ""}`,
        clienteId: raw?.clienteId || raw?.cliente_id || null,
        cliente: raw?.clienteNome || raw?.cliente || "Cliente",
        data: raw?.dataPedido || raw?.data_pedido || null,
        valor: Number(raw?.valorTotal || raw?.valor_total || 0),
        status: raw?.status || "APROVADO",
        vendedor: raw?.vendedor || nomesEquipe(detalhes.vendedores),
        vendedores: detalhes.vendedores,
        poolPct: detalhes.poolPct,
        origem: raw?.origem || "Loja",
        estoqueLancado: raw?.estoqueLancado === true || raw?.estoqueLancado === 1,
        contasLancadas: raw?.contasLancadas === true || raw?.contasLancadas === 1,
        separacao: raw?.separacao || "PENDENTE",
        expedicao: raw?.expedicao || "PENDENTE",
        embalagem: detalhes.embalagem || (raw?.separacao === "SEPARADO" ? "AGUARDANDO" : "PENDENTE"),
        observacoes: raw?.observacoes || "",
        naturezaOperacaoId: raw?.naturezaOperacaoId || null,
        naturezaOperacao: raw?.naturezaOperacao || "",
        cfop: raw?.cfop || "",
        itens: detalhes.itens,
        previsto: detalhes.previsto,
        dataLimiteDespacho: detalhes.dataLimiteDespacho,
        rastreio: detalhes.rastreio,
        marcadores: detalhes.marcadores,
        numeroPedido: detalhes.numeroPedido || raw?.numero || "",
        uf: detalhes.uf,
        cidade: detalhes.cidade,
        pagamento: detalhes.pagamento,
        formaEnvio: detalhes.formaEnvio,
        notaFiscal: detalhes.notaFiscal,
        fantasia: detalhes.fantasia
    };
}

export function pedidoParaApi(pedido) {
    const vendedores = pedido.vendedores || [];
    return {
        id: pedido.id,
        numero: pedido.numero,
        clienteId: pedido.clienteId || null,
        clienteNome: pedido.cliente,
        dataPedido: dataPedidoParaApi(pedido.data || pedido.dataPedido),
        valorTotal: Number(pedido.valor || 0),
        status: pedido.status || "APROVADO",
        vendedor: pedido.vendedor || nomesEquipe(vendedores) || "",
        origem: pedido.origem || "Loja",
        estoqueLancado: Boolean(pedido.estoqueLancado),
        contasLancadas: Boolean(pedido.contasLancadas),
        separacao: pedido.separacao || "PENDENTE",
        expedicao: pedido.expedicao || "PENDENTE",
        observacoes: pedido.observacoes || "",
        naturezaOperacaoId: pedido.naturezaOperacaoId || null,
        naturezaOperacao: pedido.naturezaOperacao || "",
        cfop: pedido.cfop || "",
        detalhes: JSON.stringify({
            itens: pedido.itens || [],
            vendedores,
            poolPct: Number(pedido.poolPct ?? PCT_COMISSAO_PADRAO),
            previsto: pedido.previsto || "",
            dataLimiteDespacho: pedido.dataLimiteDespacho || "",
            rastreio: pedido.rastreio || "",
            marcadores: pedido.marcadores || "",
            numeroPedido: pedido.numeroPedido || pedido.numero || "",
            uf: pedido.uf || "",
            cidade: pedido.cidade || "",
            pagamento: pedido.pagamento || "",
            formaEnvio: pedido.formaEnvio || "",
            notaFiscal: pedido.notaFiscal || "",
            fantasia: pedido.fantasia || "",
            embalagem: pedido.embalagem || ""
        })
    };
}

export function pedidosSemente() {
    const hoje = new Date().toISOString();
    const extra = {
        previsto: "",
        dataLimiteDespacho: "",
        rastreio: "",
        marcadores: "1ª venda",
        uf: "RJ",
        cidade: "Volta Redonda",
        formaEnvio: ""
    };
    return [
        {
            numero: "PV-8801",
            cliente: "Ana Marketplace",
            origem: "Shopee",
            vendedor: "Integração",
            data: hoje,
            valor: 89.9,
            status: "APROVADO",
            estoqueLancado: false,
            contasLancadas: false,
            separacao: "PENDENTE",
            expedicao: "PENDENTE",
            pagamento: "aguardando recebimento",
            ...extra,
            itens: [{ sku: "LAPIS-HB", descricao: "Lápis HB", gtin: "7890000001111", codigoFornecedor: "FOR-LAPIS", localizacao: "A-01-02", quantidade: 2, qtdSeparada: 0, valorUnitario: 4.5 }]
        },
        {
            numero: "PV-8802",
            cliente: "Bruno ML",
            origem: "Mercado Livre",
            vendedor: "Integração",
            data: hoje,
            valor: 149.0,
            status: "FATURADO",
            estoqueLancado: true,
            contasLancadas: true,
            separacao: "SEPARADO",
            expedicao: "DESPACHADO",
            pagamento: "recebido",
            ...extra,
            rastreio: "BR123456789",
            itens: [{ sku: "CANETA-AZUL", descricao: "Caneta azul", gtin: "7890000002502", codigoFornecedor: "BIC-AZ", localizacao: "A-01-01", quantidade: 3, qtdSeparada: 3, valorUnitario: 6 }]
        },
        {
            numero: "PV-8803",
            cliente: "Carla Nuvemshop",
            origem: "Nuvemshop",
            vendedor: "Integração",
            data: hoje,
            valor: 210.5,
            status: "APROVADO",
            estoqueLancado: false,
            contasLancadas: true,
            separacao: "SEPARANDO",
            expedicao: "PENDENTE",
            pagamento: "recebido",
            ...extra,
            itens: [{ sku: "CADERNO-96", descricao: "Caderno 96 folhas", gtin: "7890000018903", codigoFornecedor: "TIL-96", localizacao: "A-02-04", quantidade: 1, qtdSeparada: 0, valorUnitario: 21 }]
        },
        {
            numero: "PV-8804",
            cliente: "Diego Loja",
            origem: "Loja",
            vendedor: "Felipe",
            data: hoje,
            valor: 45,
            status: "APROVADO",
            estoqueLancado: false,
            contasLancadas: false,
            separacao: "PENDENTE",
            expedicao: "PENDENTE",
            pagamento: "aguardando recebimento",
            ...extra,
            itens: [{ sku: "BORRACHA", descricao: "Borracha branca", gtin: "7890000003008", codigoFornecedor: "FABER-BOR", localizacao: "B-01-02", quantidade: 4, qtdSeparada: 0, valorUnitario: 2.5 }]
        },
        {
            numero: "PV-8805",
            cliente: "Elena PDV",
            origem: "PDV",
            vendedor: "Gabriela",
            data: hoje,
            valor: 32.9,
            status: "FATURADO",
            estoqueLancado: true,
            contasLancadas: true,
            separacao: "SEPARADO",
            expedicao: "PENDENTE",
            pagamento: "recebido",
            ...extra,
            itens: [{ sku: "COLA-BASTAO", descricao: "Cola bastão", gtin: "7890000035009", codigoFornecedor: "PRITT", localizacao: "B-02-01", quantidade: 1, qtdSeparada: 1, valorUnitario: 32.9 }],
            embalagem: "AGUARDANDO"
        }
    ];
}
