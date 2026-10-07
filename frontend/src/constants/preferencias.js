export const PREFERENCIAS_ABAS = [
    { id: "geral", nome: "geral", rota: "/preferencias_geral", trilha: [] },
    { id: "cadastros", nome: "cadastros", rota: "/preferencias_cadastros", trilha: ["cadastros"] },
    { id: "suprimentos", nome: "suprimentos", rota: "/preferencias_suprimentos", trilha: ["suprimentos"] },
    { id: "vendas", nome: "vendas", rota: "/preferencias_vendas", trilha: ["vendas"] },
    { id: "notas_fiscais", nome: "notas fiscais", rota: "/preferencias_notas_fiscais", trilha: ["vendas"] },
    { id: "financeiro", nome: "finanças", rota: "/preferencias_financeiro", trilha: ["finanças"] },
    { id: "servicos", nome: "serviços", rota: "/preferencias_servicos", trilha: ["serviços"] },
    { id: "ecommerce", nome: "e-commerce", rota: "/preferencias_ecommerce", trilha: ["vendas"] },
    { id: "tributacao", nome: "tributação (RTC)", rota: "/preferencias_tributacao", trilha: ["vendas"], selo: "Novo" }
];

export const PREFERENCIAS = {
    geral: [
        { nome: "Alterar dados da empresa", rota: "/empresa" },
        { nome: "Alterar dados do usuário", rota: "/dados_usuario" },
        { nome: "Cadastro de usuários do sistema", rota: "/usuarios_sistema" },
        { nome: "Configurações do servidor de e-mail", rota: "/configuracoes_servidor_email" },
        { nome: "Configurações do envio de documentos", rota: "/parametros_envio_doc_geral" },
        { nome: "Configurações das etiquetas", rota: "/configuracoes_etiquetas#list" },
        { nome: "Configurações da agenda", rota: "/configuracoes_agenda" },
        { tipo: "secao", nome: "Outras configurações" },
        { nome: "Interface do usuário", rota: "/interface_usuario" },
        { nome: "Central de notificações", rota: "/configuracoes_notificacoes" },
        { nome: "Impressão PrintNode", rota: "/configuracoes_print_node" },
        { nome: "Multiempresa", rota: "/multi_empresas" },
        { nome: "Aplicativos", rota: "/aplicativos_api" },
        { nome: "Token API", rota: "/configuracoes_api_web_services" },
        { nome: "Configurações de API", rota: "/configuracoes_api" },
        { nome: "Webhooks", rota: "/configuracoes_webhooks_empresa" }
    ],
    cadastros: [
        { nome: "Configurações do cadastro de clientes", rota: "/contatos" },
        { nome: "Configurações do cadastro de produtos", rota: "/produtos" },
        { nome: "Configurações de variações de produtos", rota: "/produtos" },
        { nome: "Configurações de atributos de produtos", rota: "/produtos" },
        { nome: "Configurações de marcas de produtos", rota: "/marcas#list" },
        { nome: "Tabelas de medidas", rota: "/produtos" },
        { nome: "Configurações das tags", rota: "/produto_categorias" },
        { nome: "Tipos de contato", rota: "/contatos" },
        { nome: "Linhas de produto", rota: "/produto_categorias" },
        { nome: "Listas de preços", rota: "/promocoes" }
    ],
    suprimentos: [
        { nome: "Depósitos de estoque", rota: "/localizacoes" },
        { nome: "Configurações de estoque", rota: "/estoque" },
        { nome: "Configurações do envio de documentos", rota: "/parametros_envio_doc_geral" },
        { nome: "Configurações dos marcadores nas ordens de compra", rota: "/pedidos_compra" },
        { nome: "Configurações dos marcadores nos serviços tomados", rota: "/servicos_tomados" },
        { nome: "Configurações de ordens de compra", rota: "/pedidos_compra" },
        { nome: "Configurações dos marcadores nas ordens de produção", rota: "/ordens_producao" },
        { nome: "Configurações de ordens de produção", rota: "/ordens_producao" },
        { nome: "Configurações de conferência de compra", rota: "/conferencia-compra" }
    ],
    vendas: [
        { nome: "Configurações do PDV", rota: "/pdv" },
        { nome: "Configurações das propostas comerciais", rota: "/vendas" },
        { nome: "Configurações dos pedidos de venda", rota: "/vendas" },
        { nome: "Configurações do envio de documentos", rota: "/parametros_envio_doc_geral" },
        { nome: "Configurações dos marcadores nas vendas", rota: "/vendas" },
        { nome: "Configurações dos marcadores nas propostas comerciais", rota: "/vendas" },
        { nome: "Configurações dos marcadores nas devoluções de vendas", rota: "/devolucoes" },
        { nome: "Configurações das devoluções de vendas", rota: "/devolucoes" },
        { tipo: "secao", nome: "Expedição e Logística" },
        { nome: "Formas de envio", rota: "/expedicao" },
        { nome: "Gateways logísticos", rota: "/expedicao" },
        { nome: "Configurações da expedição", rota: "/expedicao" },
        { nome: "Configurações da separação", rota: "/separacao" },
        { nome: "Configurações dos marcadores na separação", rota: "/separacao" },
        { nome: "Configurações da Intelipost", rota: "/integracoes" },
        { tipo: "secao", nome: "CRM" },
        { nome: "Configurações do CRM", rota: "/crm" },
        { nome: "Configurações dos marcadores no CRM", rota: "/crm" },
        { nome: "Configurações dos estágios no funil do CRM", rota: "/crm" }
    ],
    notas_fiscais: [
        { nome: "Configurações gerais de notas fiscais", rota: "/nfs" },
        { nome: "Dados da empresa", rota: "/dados_conta" },
        { nome: "Configuração do certificado digital", rota: "/dados_conta" },
        { nome: "Ambiente das notas fiscais", rota: "/nfs", selo: "Ambiente de produção", seloTom: "info" },
        { nome: "Naturezas de operação de entrada (tributação)", rota: "/notas_entrada" },
        { nome: "Naturezas de operação de saída (tributação)", rota: "/vendas" },
        { tipo: "secao", nome: "Notas fiscais de venda" },
        { nome: "Configuração da nota fiscal eletrônica (NFe)", rota: "/vendas" },
        { nome: "Configuração da nota fiscal eletrônica para consumidor final (NFCe)", rota: "/pdv" },
        { nome: "ICMS DIFAL para não contribuinte", rota: "/vendas" },
        { nome: "Cálculo diferenciado de ST para consumidor contribuintes - DIFAL", rota: "/vendas" },
        { nome: "Configurações da Guia Nacional de Recolhimento de Tributos Estaduais (GNRE)", rota: "/vendas" },
        { nome: "Cadastro de intermediadores", rota: "/integracoes" },
        { nome: "Configurações dos marcadores nas notas fiscais de saída", rota: "/vendas" },
        { tipo: "secao", nome: "Notas Fiscais de entrada" },
        { nome: "Configurações de notas fiscais de entrada", rota: "/notas_entrada" },
        { nome: "Configurações dos marcadores nas notas fiscais de entrada", rota: "/notas_entrada" },
        { tipo: "secao", nome: "Notas Fiscais de serviço" },
        { nome: "Configuração da nota fiscal eletrônica de serviços (NFSe)", rota: "/nfs", selo: "configuração pendente", seloTom: "alerta" },
        { nome: "Configurações dos marcadores nas notas de serviço", rota: "/nfs" }
    ],
    financeiro: [
        { tipo: "secao", nome: "Geral" },
        { nome: "Configurações gerais", rota: "/configuracoes/juros-multa" },
        { nome: "Categorias de receita e despesa", rota: "/balancete" },
        { tipo: "secao", nome: "Contas e caixa" },
        { nome: "Cadastro de contas bancárias", rota: "/cobranca-bancaria" },
        { nome: "Cadastro de contas financeiras", rota: "/balancete" },
        { tipo: "secao", nome: "Recebimentos e pagamentos" },
        { nome: "Formas de recebimento", rota: "/contas-receber" },
        { nome: "Formas de pagamento", rota: "/contas-pagar" },
        { nome: "Cadastro de gateways", rota: "/cobranca-bancaria" },
        { nome: "Configurações das maquininhas de cartão", rota: "/pdv" },
        { tipo: "secao", nome: "Avisos e emails" },
        { nome: "Configurações do contas a pagar", rota: "/contas-pagar" },
        { nome: "Configurações do contas a receber", rota: "/contas-receber" },
        { nome: "Configurações do envio de documentos", rota: "/parametros_envio_doc_geral" },
        { tipo: "secao", nome: "Marcadores" },
        { nome: "Configurações dos marcadores", rota: "/contas-receber" }
    ],
    servicos: [
        { nome: "Configurações das ordens de serviço", rota: "/ordem_servicos" },
        { nome: "Configurações dos contratos", rota: "/ordem_servicos" },
        { nome: "Configurações do envio de documentos", rota: "/parametros_envio_doc_geral" },
        { nome: "Configurações dos marcadores nas ordens de serviço", rota: "/ordem_servicos" },
        { nome: "Configurações dos marcadores nos contratos", rota: "/ordem_servicos" },
        { nome: "Cadastro de CNAEs", rota: "/dados_conta" },
        { nome: "Configurações de campos adicionais para ordens de serviço", rota: "/ordem_servicos" }
    ],
    ecommerce: [
        { nome: "Configurações gerais", rota: "/loja-admin" },
        { nome: "Integrações", rota: "/integracoes" },
        { nome: "Token API", rota: "/configuracoes_api_web_services" }
    ],
    tributacao: [
        { tipo: "secao", nome: "NFe e NFCe" },
        { nome: "Configuração dos tributos e códigos de classificação", rota: "/vendas", ajuda: "CBS, IBS e códigos de classificação da reforma tributária." },
        { nome: "Habilitar cálculo de tributos da Reforma Tributária", selo: "desabilitado", seloTom: "alerta" },
        { nome: "Cadastro de regras tributárias", rota: "/vendas", ajuda: "Regras de tributação usadas na emissão." },
        { tipo: "secao", nome: "NFSe" },
        { nome: "Configuração dos tributos e códigos de classificação", rota: "/nfs", ajuda: "Tributos da NFS-e na reforma tributária." },
        { nome: "Habilitar cálculo de tributos da Reforma Tributária", selo: "desabilitado", seloTom: "alerta" }
    ]
};

export function abaPorRota(pathname) {
    return PREFERENCIAS_ABAS.find((aba) => aba.rota === pathname) || null;
}
