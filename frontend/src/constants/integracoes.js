export const INTEGRACOES_KEY = "erp-integracoes-v1";

export const CATALOGO_INTEGRACOES = [
    { id: "mercado-livre", nome: "Mercado Livre", tipo: "Marketplace", grupo: "marketplaces", sigla: "ML", cor: "#ffe600", tinta: "#111", badges: ["FULL", "via HUB"] },
    { id: "shopee", nome: "Shopee", tipo: "Marketplace", grupo: "marketplaces", sigla: "S", cor: "#ee4d2d", tinta: "#fff" },
    { id: "amazon", nome: "Amazon", tipo: "Marketplace", grupo: "marketplaces", sigla: "A", cor: "#ff9900", tinta: "#111" },
    { id: "magalu", nome: "Magalu Marketplace", tipo: "Marketplace", grupo: "marketplaces", sigla: "M", cor: "#0086ff", tinta: "#fff" },
    { id: "americanas", nome: "Americanas Marketplace", tipo: "Marketplace", grupo: "marketplaces", sigla: "AM", cor: "#e60014", tinta: "#fff" },
    { id: "casas-bahia", nome: "Casas Bahia Marketplace", tipo: "Marketplace", grupo: "marketplaces", sigla: "CB", cor: "#0033a0", tinta: "#fff" },
    { id: "carrefour", nome: "Carrefour", tipo: "Marketplace", grupo: "marketplaces", sigla: "C", cor: "#003da5", tinta: "#fff" },
    { id: "madeira", nome: "MadeiraMadeira", tipo: "Marketplace", grupo: "marketplaces", sigla: "MM", cor: "#f5a623", tinta: "#111" },
    { id: "aliexpress", nome: "AliExpress", tipo: "Marketplace", grupo: "marketplaces", sigla: "AE", cor: "#e62e04", tinta: "#fff" },
    { id: "tiktok", nome: "TikTok Shop", tipo: "Marketplace", grupo: "marketplaces", sigla: "TT", cor: "#111", tinta: "#fff" },
    { id: "anymarket", nome: "Anymarket", tipo: "Hub", grupo: "marketplaces", sigla: "Any", cor: "#00b5ad", tinta: "#fff" },
    { id: "pluggto", nome: "Plugg.to", tipo: "Hub", grupo: "marketplaces", sigla: "P", cor: "#6c2bd9", tinta: "#fff" },
    { id: "netshoes", nome: "Netshoes", tipo: "Marketplace", grupo: "marketplaces", sigla: "N", cor: "#5a00a3", tinta: "#fff" },
    { id: "shein", nome: "Shein", tipo: "Marketplace", grupo: "marketplaces", sigla: "Sh", cor: "#111", tinta: "#fff" },
    { id: "temu", nome: "Temu", tipo: "Marketplace", grupo: "marketplaces", sigla: "T", cor: "#fb7701", tinta: "#fff", beta: true },
    { id: "ifood", nome: "iFood Mercado", tipo: "Marketplace", grupo: "marketplaces", sigla: "iF", cor: "#ea1d2c", tinta: "#fff" },
    { id: "nuvemshop", nome: "Loja Nuvemshop", tipo: "Plataforma de e-commerce", grupo: "ecommerce", sigla: "N", cor: "#2e6bff", tinta: "#fff" },
    { id: "tray", nome: "Tray", tipo: "Plataforma de e-commerce", grupo: "ecommerce", sigla: "T", cor: "#00a0e3", tinta: "#fff" },
    { id: "loja-integrada", nome: "Loja Integrada", tipo: "Plataforma de e-commerce", grupo: "ecommerce", sigla: "LI", cor: "#22c55e", tinta: "#0b1a10" },
    { id: "woocommerce", nome: "WooCommerce", tipo: "Plataforma de e-commerce", grupo: "ecommerce", sigla: "W", cor: "#7f54b3", tinta: "#fff" },
    { id: "shopify", nome: "Shopify", tipo: "Plataforma de e-commerce", grupo: "ecommerce", sigla: "Sh", cor: "#95bf47", tinta: "#111" },
    { id: "wix", nome: "Wix", tipo: "Plataforma de e-commerce", grupo: "ecommerce", sigla: "Wx", cor: "#0c6efa", tinta: "#fff" },
    { id: "magento", nome: "Magento", tipo: "Plataforma de e-commerce", grupo: "ecommerce", sigla: "Mg", cor: "#f26322", tinta: "#fff" },
    { id: "vtex", nome: "VTEX", tipo: "Plataforma de e-commerce", grupo: "ecommerce", sigla: "V", cor: "#f71963", tinta: "#fff" },
    { id: "yampi", nome: "Yampi", tipo: "Plataforma de e-commerce", grupo: "ecommerce", sigla: "Y", cor: "#5b21b6", tinta: "#fff" },
    { id: "hotmart", nome: "Hotmart", tipo: "Plataforma de e-commerce", grupo: "ecommerce", sigla: "H", cor: "#f04e23", tinta: "#fff" },
    { id: "bagy", nome: "Bagy", tipo: "Plataforma de e-commerce", grupo: "ecommerce", sigla: "B", cor: "#7c3aed", tinta: "#fff", beta: true },
    { id: "opencart", nome: "OpenCart", tipo: "Plataforma de e-commerce", grupo: "ecommerce", sigla: "OC", cor: "#23a1d1", tinta: "#fff" },
    { id: "google-agenda", nome: "Google Agenda", tipo: "Outra Integração", grupo: "outras", sigla: "G", cor: "#4285f4", tinta: "#fff" },
    { id: "pluga", nome: "Pluga", tipo: "Outra Integração", grupo: "outras", sigla: "P", cor: "#6d28d9", tinta: "#fff" },
    { id: "api-erp", nome: "API do ERP", tipo: "Outra Integração", grupo: "outras", sigla: "API", cor: "#3b82f6", tinta: "#fff" },
    { id: "bling", nome: "Bling ERP", tipo: "Outra Integração", grupo: "outras", sigla: "B", cor: "#1d4ed8", tinta: "#fff" },
    { id: "zenvia", nome: "Zenvia", tipo: "Outra Integração", grupo: "outras", sigla: "Z", cor: "#00c4b3", tinta: "#111" },
    { id: "mercos", nome: "Mercos", tipo: "Outra Integração", grupo: "outras", sigla: "Me", cor: "#0ea5e9", tinta: "#fff" },
    { id: "arquivei", nome: "Arquivei", tipo: "Outra Integração", grupo: "outras", sigla: "Ar", cor: "#16a34a", tinta: "#fff" },
    { id: "meli99", nome: "99Meli", tipo: "Outra Integração", grupo: "outras", sigla: "99", cor: "#f97316", tinta: "#111" },
    { id: "whatsapp-business", nome: "WhatsApp Business", tipo: "Outra Integração", grupo: "outras", sigla: "WA", cor: "#25d366", tinta: "#052e16" },
    { id: "chatgpt", nome: "ChatGPT", tipo: "Inteligência artificial", grupo: "outras", sigla: "GPT", cor: "#10a37f", tinta: "#fff" }
];

export const PADRAO_MINHAS_INTEGRACOES = [
    { id: "loja-integrada", ativa: true },
    { id: "shopee", ativa: true },
    { id: "mercado-livre", ativa: true },
    { id: "nuvemshop", ativa: false }
];

export function catalogoPorId(id) {
    return CATALOGO_INTEGRACOES.find((item) => item.id === id);
}

export function lerMinhasIntegracoes() {
    try {
        const bruto = localStorage.getItem(INTEGRACOES_KEY);
        if (!bruto) {
            return PADRAO_MINHAS_INTEGRACOES;
        }
        const lido = JSON.parse(bruto);
        return Array.isArray(lido) ? lido : PADRAO_MINHAS_INTEGRACOES;
    } catch {
        return PADRAO_MINHAS_INTEGRACOES;
    }
}

export function gravarMinhasIntegracoes(lista) {
    localStorage.setItem(INTEGRACOES_KEY, JSON.stringify(lista));
}

export const CFG_KEY = "erp-integracao-cfg-v1";

export const SITUACOES_ERP = [
    "Aberto",
    "Aprovado",
    "Faturado",
    "Preparando envio",
    "Enviado",
    "Entregue",
    "Cancelado"
];

export const FORMAS_RECEBIMENTO = [
    "Não definida",
    "Dinheiro",
    "Cartão de crédito",
    "Cartão de débito",
    "Boleto",
    "Depósito",
    "Crediário",
    "Vale-troca",
    "Pix",
    "Link de pagamento",
    "Cashback"
];

export const LANCAMENTOS_ESTOQUE = [
    { id: "padrao", nome: "Usar configuração padrão da conta" },
    { id: "manual", nome: "Manual" },
    { id: "autorizar-nf", nome: "Automático ao autorizar a nota fiscal" },
    { id: "salvar-nf", nome: "Automático ao salvar a nota fiscal" },
    { id: "salvar-pedido", nome: "Automático ao salvar o pedido" },
    { id: "enviado", nome: "Automático ao marcar pedido como enviado" }
];

function padraoMapeamentos() {
    return {
        situacoes: [
            { eco: "1019", erp: "Cancelado" },
            { eco: "7", erp: "Cancelado" },
            { eco: "1020", erp: "Cancelado" },
            { eco: "16", erp: "Cancelado" },
            { eco: "6", erp: "Cancelado" },
            { eco: "9", erp: "Aprovado" },
            { eco: "15", erp: "Preparando envio" },
            { eco: "14", erp: "Entregue" },
            { eco: "11", erp: "Enviado" },
            { eco: "4", erp: "Faturado" }
        ],
        recebimentos: [
            { forma: "Boleto", meio: "Banco", detalhe: "Internet", codigo: "paga-i-boleto" },
            { forma: "Boleto", meio: "Banco", detalhe: "PagSeg", codigo: "proxy-pagbank" },
            { forma: "Pix", meio: "Banco", detalhe: "Internet", codigo: "paga-i-pix" },
            { forma: "Cartão de crédito", meio: "Pag Seguro - gateway", detalhe: "", codigo: "proxy-pagbank" }
        ],
        fretes: [],
        categorias: [
            { erp: "Acessórios", eco: "24391040" },
            { erp: "Acessórios > Carteira Masculina", eco: "24391041" },
            { erp: "Acessórios > Bolsa", eco: "" },
            { erp: "Acessórios > Bolsa > Bolsa de Costas", eco: "" },
            { erp: "Acessórios > Pochete", eco: "" },
            { erp: "Acessórios de Cabelo", eco: "" }
        ],
        variacoes: [
            { chaveErp: "Quantidade", chaveEco: "Quantidade", valorErp: "500 unid.", valorEco: "" },
            { chaveErp: "Quantidade", chaveEco: "Quantidade", valorErp: "1000unid", valorEco: "" },
            { chaveErp: "Quantidade", chaveEco: "Quantidade", valorErp: "10 unid.", valorEco: "10 unid." },
            { chaveErp: "Quantidade", chaveEco: "Quantidade", valorErp: "25 unid.", valorEco: "25 unid." },
            { chaveErp: "Quantidade", chaveEco: "Quantidade", valorErp: "100 unid.", valorEco: "100 unid." },
            { chaveErp: "Quantidade", chaveEco: "Quantidade", valorErp: "01 Unid.", valorEco: "01 Unid." },
            { chaveErp: "Quantidade", chaveEco: "Quantidade", valorErp: "05 Unid.", valorEco: "05 Unid." }
        ]
    };
}

export function padraoCfgIntegracao(id) {
    const meta = catalogoPorId(id);
    return {
        nome: meta?.nome || id,
        estoqueAtualizar: "disponivel",
        deposito: "todos-proprios",
        lancamento: "enviado",
        somarReservado: true,
        estoqueSeguranca: false,
        precoRegra: "fixo",
        importarImagens: "anexos",
        enviarVideo: true,
        atualizarSku: true,
        exportarCusto: true,
        syncPedidos: true,
        importarFrete: true,
        formatarNomes: true,
        enderecoObs: true,
        enviarRastreio: true,
        marcarEntregue: true,
        intermediador: "sem",
        pagamentoCanal: true,
        natureza: "nfe-terceiros",
        naturezaIcms: false,
        custoFixo: "0,20",
        custoTaxa: "0,00",
        baseComissao: "sem-frete",
        etiqueta: "PDF",
        retrocederSituacao: true,
        importarRecebimento: true,
        formaPadrao: "Não definida",
        categoriaFinanceira: "Receita",
        ...padraoMapeamentos()
    };
}

export function lerCfgIntegracao(id) {
    try {
        const all = JSON.parse(localStorage.getItem(CFG_KEY) || "{}");
        return { ...padraoCfgIntegracao(id), ...(all[id] || {}) };
    } catch {
        return padraoCfgIntegracao(id);
    }
}

export function gravarCfgIntegracao(id, cfg) {
    const all = JSON.parse(localStorage.getItem(CFG_KEY) || "{}");
    all[id] = cfg;
    localStorage.setItem(CFG_KEY, JSON.stringify(all));
}

export function nomeExibidoIntegracao(id, meta) {
    const cfg = lerCfgIntegracao(id);
    return cfg.nome || meta?.nome || id;
}

export function ehCanalVenda(meta) {
    return meta?.grupo === "ecommerce" || meta?.grupo === "marketplaces";
}
