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
    Scale,

    FileText,
    FileSignature,
    Printer,

    Globe,
    MessageCircle,
    Store,
    Monitor,
    Megaphone,
    Share2,
    Layers,
    Radio,
    Send,
    ExternalLink,

    Clock3,
    BarChart3,
    Fingerprint,
    History,
    TableProperties,
    PenLine,
    Umbrella,
    FileWarning,
    BellRing,
    FolderOpen,
    LayoutGrid,

    Info,
    Settings

} from "lucide-react";

import PERMISSOES from "./security/permissoes";
import { LOJA_SECOES } from "./loja";

const MENU = [

    {
        id: "inicio",
        titulo: "Início",
        icon: LayoutDashboard,
        ordem: 1,

        itens: [

            {
                nome: "Índice",
                rota: "/index",
                icon: LayoutDashboard,
                permissao: PERMISSOES.DASHBOARD
            },

            {
                nome: "Dashboard",
                rota: "/dashboard#/vendas",
                icon: BarChart3,
                permissao: PERMISSOES.DASHBOARD
            },

            {
                nome: "Agenda",
                rota: "/home_agenda",
                icon: CalendarDays,
                permissao: PERMISSOES.AGENDA
            },

            {
                nome: "Minha Conta",
                rota: "/dados_conta",
                icon: UserCircle
            },

            {
                nome: "Integrações",
                rota: "/integracoes",
                icon: Plug
            },

            {
                nome: "Ferramentas",
                rota: "/ferramentas_geral",
                icon: Wrench
            },

            {
                nome: "Sobre a versão",
                rota: "/detalhes_versao",
                icon: Info
            },

            {
                nome: "Relatório",
                rota: "/relatorio/inicio",
                icon: BarChart3,
                relatorio: true
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
                rota: "/contatos#/",
                icon: Users,
                permissao: PERMISSOES.CLIENTES
            },

            {
                nome: "Produtos",
                rota: "/produtos#list",
                icon: Package,
                permissao: PERMISSOES.PRODUTOS
            },

            {
                nome: "Categorias",
                rota: "/produto_categorias",
                icon: FolderTree
            },

            {
                nome: "Móveis",
                rota: "/moveis",
                icon: LayoutGrid
            },

            {
                nome: "Máquinas",
                rota: "/maquinas",
                icon: Printer
            },

            {
                nome: "Vendedores",
                rota: "/vendedores#list",
                icon: BadgeDollarSign
            },

            {
                nome: "Técnicos",
                rota: "/tecnicos",
                icon: Users
            },

            {
                nome: "Embalagens",
                rota: "/embalagens#list",
                icon: Box
            },

            {
                nome: "Marcas",
                rota: "/marcas#list",
                icon: Tags
            },

            {
                nome: "Localizações",
                rota: "/localizacoes",
                icon: MapPinned
            },

            {
                nome: "Relatório",
                rota: "/relatorio/cadastros",
                icon: BarChart3,
                relatorio: true
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
                icon: Warehouse,
                permissao: PERMISSOES.ESTOQUE
            },

            {
                nome: "Auditoria de Estoque",
                rota: "/estoque/auditoria",
                icon: History,
                permissao: PERMISSOES.ESTOQUE
            },

            {
                nome: "Inventário",
                rota: "/inventario",
                icon: ClipboardList
            },

            {
                nome: "Ordens de Compra",
                rota: "/pedidos_compra#list",
                icon: ShoppingCart
            },

            {
                nome: "Notas Fiscais de Entrada",
                rota: "/notas_entrada#list",
                icon: FilePlus2
            },

            {
                nome: "Conferência de Compra",
                rota: "/entrada_de_mercadorias",
                icon: ClipboardCheck
            },

            {
                nome: "Necessidades de Compra",
                rota: "/necessidades-compra",
                icon: ShoppingCart
            },

            {
                nome: "Serviços Tomados",
                rota: "/servicos_tomados#/",
                icon: Truck
            },

            {
                nome: "Giro de Estoque",
                rota: "/dashboard#/estoque",
                icon: RotateCcw
            },

            {
                nome: "FCI",
                rota: "/fci",
                icon: Boxes
            },

            {
                nome: "Relatório",
                rota: "/relatorio/suprimentos",
                icon: BarChart3,
                relatorio: true
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
                nome: "Promoções",
                rota: "/promocoes",
                icon: Tags
            },

            {
                nome: "Reajuste de preços",
                rota: "/produtos/reajuste",
                icon: BadgeDollarSign
            },

            {
                nome: "Pedidos de Venda",
                rota: "/vendas#list",
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
            },

            {
                nome: "Relatório",
                rota: "/relatorio/vendas",
                icon: BarChart3,
                relatorio: true
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
                rota: "/dashboard#/financas",
                icon: BarChart3
            },

            {
                nome: "Balancete",
                rota: "/balancete",
                icon: Scale
            },

            {
                nome: "Balanço Patrimonial",
                rota: "/balanco-patrimonial",
                icon: Scale
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
            },

            {
                nome: "Relatório",
                rota: "/relatorio/financeiro",
                icon: BarChart3,
                relatorio: true
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
                nome: "Painel Produção",
                rota: "/painel_ordem_servicos",
                icon: BarChart3
            },

            {
                nome: "Orçamentos de Serviço",
                rota: "/orcamentos_servicos#list",
                icon: FileText
            },

            {
                nome: "Ordens de Serviço",
                rota: "/ordem_servicos#list",
                icon: ClipboardList
            },

            {
                nome: "Ordens de Produção Interna",
                rota: "/ordem_producao#list",
                icon: Printer
            },

            {
                nome: "Contratos",
                rota: "/contratos_servicos#list",
                icon: FileSignature
            },

            {
                nome: "Cobranças",
                rota: "/cobrancas_servicos#list",
                icon: Wallet
            },

            {
                nome: "Nota Fiscal Serviço",
                rota: "/notas_servicos#list",
                icon: ReceiptText
            },

            {
                nome: "Relatórios",
                rota: "/relatorios_servicos#list",
                icon: BarChart3,
                relatorio: true
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
                icon: MessageCircle
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
            },

            {
                nome: "Relatório",
                rota: "/relatorio/ecommerce",
                icon: BarChart3,
                relatorio: true
            }

        ]

    },

    {
        id: "loja-virtual",
        titulo: "Loja virtual",
        icon: Store,
        ordem: 8,

        itens: [

            {
                id: "li-inicio",
                nome: "Início",
                rota: "/loja-admin",
                icon: LayoutDashboard
            },

            {
                id: "li-visao",
                nome: "Visão de Negócio",
                icon: BarChart3,
                filhos: [
                    { nome: "Diário de Bordo", rota: "/loja-admin/diario" }
                ]
            },

            {
                id: "li-vendas",
                nome: "Vendas",
                icon: ClipboardList,
                filhos: [
                    { nome: "Listar pedidos", rota: "/loja-admin/pedidos" },
                    { nome: "Criar pedido", rota: "/loja-admin/pedido-novo" },
                    { nome: "Link de carrinho", rota: "/loja-admin/link-carrinho" },
                    { nome: "Clientes", rota: "/loja-admin/usuarios" },
                    { nome: "Notas fiscais", rota: "/loja-admin/nfe", beta: true }
                ]
            },

            {
                id: "li-produtos",
                nome: "Produtos",
                icon: Package,
                filhos: [
                    { nome: "Listar produtos", rota: "/loja-admin/produtos" },
                    { nome: "Criar produto", rota: "/loja-admin/produto-novo" },
                    { nome: "Avaliações", rota: "/loja-admin/avaliacoes" },
                    { nome: "Importar", rota: "/loja-admin/importar" },
                    { nome: "Preços segmentados", rota: "/loja-admin/precos" },
                    { nome: "Categorias", rota: "/loja-admin/categorias" },
                    { nome: "Marcas", rota: "/loja-admin/marcas" },
                    { nome: "Grades", rota: "/loja-admin/grades" },
                    { nome: "Lixeira de produtos", rota: "/loja-admin/lixeira" }
                ]
            },

            {
                id: "li-marketing",
                nome: "Marketing",
                icon: Megaphone,
                filhos: [
                    { nome: "Promoções", rota: "/loja-admin/promocoes" },
                    { nome: "Brinde", rota: "/loja-admin/brinde" },
                    { nome: "Cupons de desconto", rota: "/loja-admin/cupons" },
                    { nome: "Automações", rota: "/loja-admin/automacoes" },
                    { nome: "Compre junto", rota: "/loja-admin/compre-junto" },
                    { nome: "Frete grátis", rota: "/loja-admin/frete-gratis" },
                    { nome: "Newsletter", rota: "/loja-admin/newsletter" },
                    { nome: "Avise-me", rota: "/loja-admin/avise-me" }
                ]
            },

            {
                id: "li-canais",
                nome: "Canais de vendas",
                icon: Share2,
                filhos: [
                    { nome: "TikTok", rota: "/loja-admin/tiktok" },
                    { nome: "Google Shopping", rota: "/loja-admin/google-shopping" }
                ]
            },

            {
                id: "li-solucoes",
                nome: "Soluções",
                icon: Layers,
                filhos: [
                    { nome: "Aplicativos", rota: "/loja-admin/aplicativos" },
                    { nome: "Temas", rota: "/loja-admin/temas" },
                    { nome: "Serviços", rota: "/loja-admin/servicos-loja" }
                ]
            },

            {
                id: "li-financeiro",
                nome: "Financeiro",
                icon: Wallet,
                filhos: [
                    { nome: "Planos", rota: "/loja-admin/planos" },
                    { nome: "Dados para pagamento", rota: "/loja-admin/dados-pagamento" },
                    { nome: "Histórico de faturas", rota: "/loja-admin/faturas" }
                ]
            },

            {
                id: "li-personalize",
                nome: "Personalize sua loja",
                icon: Monitor,
                filhos: LOJA_SECOES.personalize.map((s) => ({
                    nome: s.nome,
                    rota: `/loja-admin/${s.id}`
                }))
            },

            {
                id: "li-config",
                nome: "Configurações",
                icon: Settings,
                filhos: LOJA_SECOES.configuracoes.map((s) => ({
                    nome: s.nome,
                    rota: `/loja-admin/${s.id}`
                }))
            },

            {
                id: "li-hub",
                nome: "Hub de Canais",
                rota: "/loja-admin/hub-canais",
                icon: Radio,
                beta: true
            },

            {
                id: "li-drop",
                nome: "Dropshipping",
                rota: "/loja-admin/dropshipping",
                icon: Truck
            },

            {
                id: "li-enviai",
                nome: "Enviaí",
                rota: "/loja-admin/enviai",
                icon: Send
            },

            {
                id: "li-pagai",
                nome: "Pagai",
                rota: "/loja-admin/pagai",
                icon: CreditCard
            },

            {
                id: "li-ver",
                nome: "Ver a loja",
                rota: "/",
                icon: ExternalLink,
                externo: true
            },

            {
                id: "li-relatorio",
                nome: "Relatório",
                rota: "/relatorio/loja-virtual",
                icon: BarChart3,
                relatorio: true
            }

        ]

    },

    {
        id: "funcionarios",
        titulo: "Funcionários",
        icon: UserCircle,
        ordem: 9,

        itens: [

            {
                nome: "Painel RH",
                rota: "/rh",
                icon: LayoutGrid
            },

            {
                nome: "Equipe",
                rota: "/funcionarios",
                icon: Users
            },

            {
                nome: "Férias",
                rota: "/ferias",
                icon: Umbrella
            },

            {
                nome: "Rescisões",
                rota: "/rescisoes",
                icon: FileWarning
            },

            {
                nome: "Informes",
                rota: "/informes",
                icon: ReceiptText
            },

            {
                nome: "Holerite",
                rota: "/holerite",
                icon: FileText
            },

            {
                nome: "Guias",
                rota: "/guias",
                icon: Landmark
            },

            {
                nome: "Documentos RH",
                rota: "/rh-documentos",
                icon: FolderOpen
            },

            {
                nome: "Avisos RH",
                rota: "/rh-avisos",
                icon: BellRing
            },

            {
                nome: "Marcar Ponto",
                rota: "/ponto",
                icon: Fingerprint
            },

            {
                nome: "Meus Registros",
                rota: "/ponto/registros",
                icon: History
            },

            {
                nome: "Espelho de Ponto",
                rota: "/ponto/espelho",
                icon: TableProperties
            },

            {
                nome: "Ajustes de Ponto",
                rota: "/ponto/ajustes",
                icon: PenLine
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
                nome: "Relatórios de Ponto",
                rota: "/ponto/relatorios",
                icon: Clock3,
                relatorio: true
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
                rota: "/preferencias_geral",
                icon: Settings
            },

            {
                nome: "Auditoria",
                rota: "/auditoria",
                icon: History
            },

            {
                nome: "Relatório",
                rota: "/relatorio/configuracoes",
                icon: BarChart3,
                relatorio: true
            }

        ]

    }

];

export function ehRelatorio(item) {
    return Boolean(item?.relatorio) || /^relat[oó]rios?\b/i.test(String(item?.nome || ""));
}

export function itensComRelatorioNoFim(itens) {
    const lista = Array.isArray(itens) ? itens : [];
    const relatorios = [];
    const resto = [];
    lista.forEach((item) => {
        if (ehRelatorio(item)) {
            relatorios.push(item);
        } else {
            resto.push(item);
        }
    });
    return [...resto, ...relatorios];
}

export function itensPlanos(grupo) {
    return itensComRelatorioNoFim(grupo?.itens).flatMap((item) => (
        item.filhos ? [item, ...itensComRelatorioNoFim(item.filhos)] : [item]
    ));
}

export function acharItemMenu(pathname) {
    const caminho = String(pathname || "").split("#")[0];
    for (const grupo of MENU) {
        for (const entrada of grupo.itens) {
            const rota = String(entrada.rota || "").split("#")[0];
            if (rota && rota === caminho) {
                return { grupo, item: entrada, irmaos: grupo.itens.filter((i) => i !== entrada) };
            }
            const filho = entrada.filhos?.find((f) => String(f.rota || "").split("#")[0] === caminho);
            if (filho) {
                return { grupo, item: filho, irmaos: entrada.filhos.filter((f) => f !== filho) };
            }
        }
    }
    return null;
}

export default MENU;