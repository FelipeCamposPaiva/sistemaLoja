import {
    LayoutDashboard,
    CalendarDays,
    UserCircle,
    Plug,
    Wrench,

    Users,
    Package,
    Tags,
    BadgeDollarSign,
    Box,
    FolderTree,
    MapPinned,

    Warehouse,
    ClipboardList,
    ShoppingCart,
    FilePlus2,
    ClipboardCheck,
    Truck,
    RotateCcw,
    Boxes,

    ShoppingBag,
    Receipt,
    ScanLine,
    PackageCheck,

    Wallet,
    Landmark,
    CreditCard,
    ReceiptText,

    FileText,
    Printer,

    Globe,

    Clock3,
    BarChart3,

    Settings

} from "lucide-react";

import PERMISSOES from "./security/permissoes";

const MENU = [

    {
        id: "inicio",
        titulo: "Início",
        icon: LayoutDashboard,
        ordem: 1,

        itens: [

            {
                nome: "Dashboard",
                rota: "/",
                icon: LayoutDashboard,
                permissao: PERMISSOES.DASHBOARD
            },

            {
                nome: "Agenda",
                rota: "/agenda",
                icon: CalendarDays,
                permissao: PERMISSOES.AGENDA
            },

            {
                nome: "Minha Conta",
                rota: "/minha-conta",
                icon: UserCircle
            },

            {
                nome: "Integrações",
                rota: "/integracoes",
                icon: Plug
            },

            {
                nome: "Ferramentas",
                rota: "/ferramentas",
                icon: Wrench
            }

        ]

    },

    {
        id: "cadastros",
        titulo: "Cadastros",
        icon: Users,
        ordem: 2,

        itens: [

            {
                nome: "Clientes e Fornecedores",
                rota: "/clientes",
                icon: Users,
                permissao: PERMISSOES.CLIENTES
            },

            {
                nome: "Produtos",
                rota: "/produtos",
                icon: Package,
                permissao: PERMISSOES.PRODUTOS
            },

            {
                nome: "Categorias",
                rota: "/categorias-produtos",
                icon: FolderTree
            },

            {
                nome: "Vendedores",
                rota: "/vendedores",
                icon: BadgeDollarSign
            },

            {
                nome: "Embalagens",
                rota: "/embalagens",
                icon: Box
            },

            {
                nome: "Marcas",
                rota: "/marcas",
                icon: Tags
            },

            {
                nome: "Localizações",
                rota: "/localizacoes",
                icon: MapPinned
            }

        ]

    },

    {
        id: "suprimentos",
        titulo: "Suprimentos",
        icon: Warehouse,
        ordem: 3,

        itens: [

            {
                nome: "Controle de Estoque",
                rota: "/estoque",
                icon: Warehouse
            },

            {
                nome: "Inventário",
                rota: "/inventario",
                icon: ClipboardList
            },

            {
                nome: "Ordens de Compra",
                rota: "/ordens-compra",
                icon: ShoppingCart
            },

            {
                nome: "Notas de Entrada",
                rota: "/notas-entrada",
                icon: FilePlus2
            },

            {
                nome: "Conferência de Compra",
                rota: "/conferencia-compra",
                icon: ClipboardCheck
            },

            {
                nome: "Necessidades de Compra",
                rota: "/necessidades-compra",
                icon: ShoppingCart
            },

            {
                nome: "Serviços Tomados",
                rota: "/servicos-tomados",
                icon: Truck
            },

            {
                nome: "Giro de Estoque",
                rota: "/giro-estoque",
                icon: RotateCcw
            },

            {
                nome: "FCI",
                rota: "/fci",
                icon: Boxes
            }

        ]

    },

    {
        id: "vendas",
        titulo: "Vendas",
        icon: ShoppingBag,
        ordem: 4,

        itens: [

            {
                nome: "PDV",
                rota: "/pdv",
                icon: ShoppingBag
            },

            {
                nome: "Pedidos de Venda",
                rota: "/pedido-venda",
                icon: Receipt
            },

            {
                nome: "Nota Fiscal",
                rota: "/nota-fiscal",
                icon: ReceiptText
            },

            {
                nome: "NFC-e",
                rota: "/nfce",
                icon: ReceiptText
            },

            {
                nome: "Separação",
                rota: "/separacao",
                icon: PackageCheck
            },

            {
                nome: "Expedição",
                rota: "/expedicao",
                icon: Truck
            },

            {
                nome: "Devoluções",
                rota: "/devolucoes",
                icon: RotateCcw
            }

        ]

    },

    {
        id: "financeiro",
        titulo: "Financeiro",
        icon: Wallet,
        ordem: 5,

        itens: [

            {
                nome: "Dashboard Financeiro",
                rota: "/dashboard-financeiro",
                icon: BarChart3
            },

            {
                nome: "Caixa",
                rota: "/financeiro",
                icon: Wallet
            },

            {
                nome: "Contas a Receber",
                rota: "/contas-receber",
                icon: Landmark
            },

            {
                nome: "Contas a Pagar",
                rota: "/contas-pagar",
                icon: CreditCard
            },

            {
                nome: "Cobrança Bancária",
                rota: "/cobranca-bancaria",
                icon: ReceiptText
            },

            {
                nome: "Extrato Bancário",
                rota: "/extrato-bancario",
                icon: FileText
            }

        ]

    },

    {
        id: "servicos",
        titulo: "Serviços",
        icon: Printer,
        ordem: 6,

        itens: [

            {
                nome: "Orçamentos",
                rota: "/orcamentos",
                icon: FileText
            },

            {
                nome: "Ordens de Serviço",
                rota: "/os",
                icon: ClipboardList
            },

            {
                nome: "Nova OS",
                rota: "/nova-os",
                icon: FilePlus2
            },

            {
                nome: "Produção",
                rota: "/producao",
                icon: Printer
            },

            {
                nome: "Painel Produção",
                rota: "/painel-producao",
                icon: BarChart3
            },

            {
                nome: "Nota Fiscal Serviço",
                rota: "/nfs",
                icon: ReceiptText
            }

        ]

    },

    {
        id: "ecommerce",
        titulo: "E-commerce",
        icon: Globe,
        ordem: 7,

        itens: [

            {
                nome: "CRM",
                rota: "/crm",
                icon: Users
            },

            {
                nome: "Pedidos Ecommerce",
                rota: "/pedido-ecommerce",
                icon: ShoppingBag
            },

            {
                nome: "Perguntas Ecommerce",
                rota: "/perguntas-ecommerce",
                icon: FileText
            },

            {
                nome: "Pós Venda",
                rota: "/pos-venda-ecommerce",
                icon: RotateCcw
            },

            {
                nome: "Custos Ecommerce",
                rota: "/custo-ecommerce",
                icon: Wallet
            }

        ]

    },

    {
        id: "funcionarios",
        titulo: "Funcionários",
        icon: UserCircle,
        ordem: 8,

        itens: [

            {
                nome: "Ponto",
                rota: "/ponto",
                icon: Clock3
            },

            {
                nome: "Comissões",
                rota: "/comissoes",
                icon: BadgeDollarSign
            },

            {
                nome: "Performance",
                rota: "/performance-vendas",
                icon: BarChart3
            },

            {
                nome: "Holerite",
                rota: "/holerite",
                icon: FileText
            }

        ]

    },

    {
        id: "configuracoes",
        titulo: "Configurações",
        icon: Settings,
        ordem: 99,

        itens: [

            {
                nome: "Configurações",
                rota: "/configuracoes",
                icon: Settings
            }

        ]

    }

];

export default MENU;