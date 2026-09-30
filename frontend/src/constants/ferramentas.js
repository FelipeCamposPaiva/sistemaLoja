export const FERRAMENTAS_GERAL = [
    { id: "agendar-tarefas", nome: "Agendamento de tarefas de manutenção", rota: "/ferramentas/agendar-tarefas" },
    { id: "backup", nome: "Backup", rota: "/ferramentas/backup" },
    { id: "exclusao", nome: "Exclusão de registros", rota: "/ferramentas/exclusao" },
    { id: "nfe-inutilizacao", nome: "Inutilizações de NFes", rota: "/ferramentas/nfe-inutilizacao" },
    { id: "anexos", nome: "Gerenciar Anexos", rota: "/ferramentas/anexos" },
    { id: "resumo-sincronizacoes", nome: "Resumo de Sincronizações", rota: "/ferramentas/resumo-sincronizacoes" },
    { id: "sincronizacoes-multiempresa", nome: "Sincronizações Multiempresa", rota: "/ferramentas/sincronizacoes-multiempresa" }
];

export const FERRAMENTAS_IMPORTACAO = [
    {
        grupo: "Cadastros",
        itens: [
            { id: "contatos", nome: "Contatos" },
            { id: "contatos-clientes", nome: "Contatos dos clientes" },
            { id: "produtos", nome: "Produtos" },
            { id: "gestor", nome: "Exportação Gestor — Tem de Tudo" },
            { id: "kits", nome: "Kits e Produtos Fabricados" },
            { id: "precos", nome: "Preços dos produtos" }
        ]
    },
    {
        grupo: "Suprimentos",
        itens: [
            { id: "estoque", nome: "Estoque" },
            { id: "compras", nome: "Ordens de Compra" }
        ]
    },
    {
        grupo: "Vendas",
        itens: [
            { id: "vendas", nome: "Pedidos de Venda" },
            { id: "propostas", nome: "Propostas Comerciais" },
            { id: "envio", nome: "Atualizar informações de envio" }
        ]
    },
    {
        grupo: "Notas Fiscais",
        itens: [
            { id: "xml-lote", nome: "XMLs em Lote" }
        ]
    },
    {
        grupo: "Finanças",
        itens: [
            { id: "caixa", nome: "Caixa" },
            { id: "categorias", nome: "Categorias de Receitas e Despesas" },
            { id: "receber", nome: "Contas a Receber" },
            { id: "pagar", nome: "Contas a Pagar" }
        ]
    },
    {
        grupo: "Serviços",
        itens: [
            { id: "os", nome: "Ordens de Serviço" }
        ]
    }
];

export const FERRAMENTAS_EXPORTACAO = [
    { id: "sintegra", nome: "Sintegra", rota: "/ferramentas/sintegra" }
];

export const LISTAS = {
    "agendar-tarefas": {
        titulo: "Agendamento de tarefas de manutenção",
        crumb: "agendamento de tarefas de manutenção",
        incluir: "Incluir tarefa",
        empty: "Você não possui nenhum item cadastrado. Para inserir novos registros você pode clicar em Incluir tarefa",
        key: "erp-fer-tarefas-v1"
    },
    backup: {
        titulo: "Backup",
        crumb: "backup",
        incluir: "Incluir backup",
        empty: "Você não possui nenhum item cadastrado. Para inserir novos registros você pode clicar em Incluir Backup.",
        key: "erp-fer-backup-v1"
    },
    exclusao: {
        titulo: "Exclusão de registros",
        crumb: "exclusão de registros",
        incluir: "Incluir tarefa exclusão",
        empty: "Você não possui nenhum item cadastrado. Para inserir novos registros você pode clicar em Incluir tarefa exclusão.",
        key: "erp-fer-exclusao-v1"
    },
    "nfe-inutilizacao": {
        titulo: "Números inutilizados",
        crumb: "números inutilizados",
        incluir: "Inutilizar numeração",
        empty: "Nenhum registro encontrado",
        busca: "Pesquisa pelo número do protocolo ou de série",
        key: "erp-fer-nfe-v1",
        filtros: ["por período", "modelo", "data e hora"],
        extra: "relatório de numeração"
    }
};

export const IMPORTADORES = {
    contatos: { titulo: "Importador de Contatos", colunas: ["ID", "Nome", "Tipo", "CPF/CNPJ", "E-mail", "Telefone", "Cidade", "UF"] },
    "contatos-clientes": { titulo: "Importador de Contatos dos clientes", colunas: ["ID cliente", "Nome", "Cargo", "E-mail", "Telefone"] },
    produtos: { titulo: "Importador de Produtos", colunas: ["SKU", "Descrição", "Unidade", "Preço", "NCM", "GTIN", "Estoque"] },
    kits: { titulo: "Importador de Kits e Produtos Fabricados", colunas: ["SKU kit", "Descrição", "SKU componente", "Quantidade"] },
    precos: { titulo: "Importador de Preços dos produtos", colunas: ["SKU", "Lista", "Preço", "Preço promocional"] },
    estoque: { titulo: "Importador de Estoque", colunas: ["SKU", "Depósito", "Saldo", "Reservado"] },
    compras: { titulo: "Importador de Ordens de Compra", colunas: ["Número", "Fornecedor", "Data", "SKU", "Quantidade", "Valor"] },
    vendas: {
        titulo: "Importador de Pedidos de Venda",
        colunas: [
            "ID", "Número do pedido", "Data", "Data prevista", "ID contato", "Nome do contato",
            "Tipo de Pessoa", "CPF/CNPJ", "Município", "UF", "Observações", "Situação",
            "ID produto", "Descrição", "Quantidade", "Valor unitário", "Desconto item",
            "Código de rastreamento", "Vendedor", "Frete pedido", "Código (SKU)"
        ]
    },
    propostas: { titulo: "Importador de Propostas Comerciais", colunas: ["Número", "Cliente", "Data", "Validade", "Total"] },
    envio: { titulo: "Atualizar informações de envio", colunas: ["Pedido", "Rastreio", "Transportadora", "Situação"] },
    "xml-lote": { titulo: "Importador de XMLs em Lote", colunas: ["Arquivo", "Chave", "Emitente", "Data", "Valor"] },
    caixa: { titulo: "Importador de Caixa", colunas: ["Data", "Histórico", "Categoria", "Entrada", "Saída"] },
    categorias: { titulo: "Importador de Categorias financeiras", colunas: ["Código", "Nome", "Tipo", "DRE"] },
    receber: { titulo: "Importador de Contas a Receber", colunas: ["Cliente", "Vencimento", "Valor", "Categoria", "Situação"] },
    pagar: { titulo: "Importador de Contas a Pagar", colunas: ["Fornecedor", "Vencimento", "Valor", "Categoria", "Situação"] },
    os: {
        titulo: "Importador de Ordens de Serviço",
        colunas: [
            "ID", "Número da Ordem de Serviço", "Data", "Data prevista", "Total peças", "Total serviços", "Total",
            "ID contato", "Nome do contato", "Situação", "Vendedor", "ID produto", "Descrição", "Quantidade",
            "Unidade", "Valor unitário", "Tipo", "Total item", "Desconto item", "Desconto serviço", "Desconto geral"
        ]
    }
};

export const ANEXOS_DEMO = [
    { nome: "Acrilex.png", tam: "0,07", origem: "Produto", id: "Descrição: TINTA ACRILEX 20ML, SKU: 88120" },
    { nome: "162686-1200-auto.webp", tam: "0,03", origem: "Produto", id: "Descrição: CALCULADORA 8 DÍGITOS CORAÇÃO - LETRON, SKU: 99339" },
    { nome: "162890-1200-auto.webp", tam: "0,04", origem: "Produto", id: "Descrição: CANETA ESFEROGRÁFICA BIC, SKU: 11002" },
    { nome: "163388-1200-auto.webp", tam: "0,05", origem: "Clientes e fornecedores", id: "Contato: Papelaria Central" },
    { nome: "logo-cliente.png", tam: "0,02", origem: "Clientes e fornecedores", id: "Contato: Escola Horizonte" },
    { nome: "nfe-332.pdf", tam: "0,18", origem: "Pedidos de Venda", id: "Pedido 332" },
    { nome: "comprovante.webp", tam: "0,09", origem: "Conta a receber", id: "Título 8841" },
    { nome: "os-foto.png", tam: "0,11", origem: "Ordem de Serviço", id: "OS 1001" }
];

export const SYNC_FALHAS = [
    "CANETA ESFEROGRÁFICA BIC CRISTAL AZUL",
    "CADERNO UNIVERSITÁRIO 96 FOLHAS",
    "COLA BRANCA 90G",
    "ENVELOPE OFÍCIO KRAFT",
    "CANETA HIDROGRÁFICA 12 CORES",
    "BORRACHA BRANCA MERCUR",
    "LÁPIS PRETO N.2",
    "MARCA TEXTO AMARELO"
];

export const MULTI_OK = [
    { codigo: "KIT-PROF-10-ART-HAPPY-FELIZ-DIA-BRANCO", desc: "KIT DIA DOS PROFESSORES: 10 UNIDADES - CANETA GEL ART HAPPY + CARTÃO FELIZ DIA DOS PROF BRANCO" },
    { codigo: "CANETA-GEL-ART-HAPPY-AZUL", desc: "CANETA GEL ART HAPPY AZUL 0.7MM" },
    { codigo: "CARTAO-FELIZ-DIA-PROF-BRANCO", desc: "CARTÃO FELIZ DIA DOS PROFESSORES BRANCO" },
    { codigo: "KIT-ESCOLA-BASICO", desc: "KIT ESCOLAR BÁSICO 5 ITENS" },
    { codigo: "CADERNO-96-UNIV", desc: "CADERNO UNIVERSITÁRIO 96 FOLHAS CAPA DURA" },
    { codigo: "ESTOJO-TECIDO-AZUL", desc: "ESTOJO DE TECIDO AZUL" },
    { codigo: "MOCHILA-COSTAS-P", desc: "MOCHILA DE COSTAS P" },
    { codigo: "MARCA-TEXTO-AMARELO", desc: "MARCA TEXTO AMARELO" }
];
