import PERMISSOES from "./permissoes";

const ROLES = {

    ADMIN: {

        nome: "Administrador",

        permissoes: Object.values(PERMISSOES)

    },

    GERENTE: {

        nome: "Gerente",

        permissoes: [

            PERMISSOES.DASHBOARD,

            PERMISSOES.CLIENTES,

            PERMISSOES.FORNECEDORES,

            PERMISSOES.PRODUTOS,

            PERMISSOES.PEDIDOS,

            PERMISSOES.ORDEM_SERVICO,

            PERMISSOES.PRODUCAO,

            PERMISSOES.PAINEL_PRODUCAO,

            PERMISSOES.ESTOQUE,

            PERMISSOES.INVENTARIO,

            PERMISSOES.CONTAS_RECEBER,

            PERMISSOES.CONTAS_PAGAR,

            PERMISSOES.CAIXA,

            PERMISSOES.FINANCEIRO,

            PERMISSOES.AGENDA,

            PERMISSOES.RELATORIOS

        ]

    },

    FINANCEIRO: {

        nome: "Financeiro",

        permissoes: [

            PERMISSOES.DASHBOARD,

            PERMISSOES.CONTAS_RECEBER,

            PERMISSOES.CONTAS_PAGAR,

            PERMISSOES.CAIXA,

            PERMISSOES.FINANCEIRO,

            PERMISSOES.RELATORIOS

        ]

    },

    VENDAS: {

        nome: "Vendas",

        permissoes: [

            PERMISSOES.DASHBOARD,

            PERMISSOES.CLIENTES,

            PERMISSOES.PDV,

            PERMISSOES.PEDIDOS,

            PERMISSOES.ORCAMENTOS,

            PERMISSOES.ORDEM_SERVICO

        ]

    },

    PRODUCAO: {

        nome: "Produção",

        permissoes: [

            PERMISSOES.PAINEL_PRODUCAO,

            PERMISSOES.PRODUCAO,

            PERMISSOES.ORDEM_SERVICO

        ]

    },

    ESTOQUE: {

        nome: "Estoque",

        permissoes: [

            PERMISSOES.ESTOQUE,

            PERMISSOES.INVENTARIO,

            PERMISSOES.MOVIMENTACAO,

            PERMISSOES.ENTRADA_ESTOQUE

        ]

    },

    CAIXA: {

        nome: "Caixa",

        permissoes: [

            PERMISSOES.PDV,

            PERMISSOES.CLIENTES,

            PERMISSOES.CAIXA

        ]

    }

};

export default ROLES;