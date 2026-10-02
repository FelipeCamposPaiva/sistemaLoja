import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Check,
    Globe,
    LayoutDashboard,
    Plug,
    ShoppingBag,
    Sparkles,
    Wallet,
    Zap
} from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/versao.css";

const ATUALIZADO_EM = "1 de setembro de 2026";

const FILTROS = [
    { id: "ecossistema", nome: "Ecossistema" },
    { id: "erp", nome: "ERP" },
    { id: "hub", nome: "Hub" },
    { id: "pdv", nome: "PDV" },
    { id: "conta", nome: "Conta Digital" },
    { id: "ecommerce", nome: "Ecommerce" },
    { id: "lis", nome: "Lis" },
    { id: "credito", nome: "Crédito" }
];

const PRODUTOS = {
    erp: { id: "erp", nome: "ERP", Icon: LayoutDashboard },
    hub: { id: "hub", nome: "Hub", Icon: Plug },
    pdv: { id: "pdv", nome: "PDV", Icon: ShoppingBag },
    conta: { id: "conta", nome: "Conta Digital", Icon: Wallet },
    ecommerce: { id: "ecommerce", nome: "Ecommerce", Icon: Globe },
    lis: { id: "lis", nome: "Lis", Icon: Sparkles },
    credito: { id: "credito", nome: "Crédito", Icon: Wallet }
};

const DESTAQUES = [
    {
        id: "notas-entrada",
        produto: "erp",
        titulo: "Notas de Entrada",
        texto: "Registre compras e conferência de mercadoria no mesmo fluxo. Abra a nota, confira itens e atualize o estoque sem sair do ERP.",
        rota: "/notas_entrada#list",
        ancora: "notas-lista",
        tom: "erp"
    },
    {
        id: "integracoes",
        produto: "hub",
        titulo: "Integrações",
        texto: "Conecte Mercado Livre, Shopee, Nuvemshop e Loja Integrada. Veja o resumo de pedidos no Índice e gerencie os canais em um só lugar.",
        rota: ROTAS.INTEGRACOES,
        ancora: "hub-canais",
        tom: "hub"
    },
    {
        id: "pdv",
        produto: "pdv",
        titulo: "PDV",
        texto: "Frente de caixa com atalho de NFC-e para faturar a venda na hora. Do PDV ao pedido de venda, o fluxo fica no mesmo sistema.",
        rota: "/pdv",
        ancora: "pdv-nfce",
        tom: "pdv"
    },
    {
        id: "financeiro",
        produto: "conta",
        titulo: "Contas a receber e a pagar",
        texto: "Acompanhe o caixa, as cobranças e o que entra e sai. O financeiro do Tem de Tudo concentra receber, pagar e extrato bancário.",
        rota: "/contas-receber",
        ancora: "caixa",
        tom: "conta"
    },
    {
        id: "ecommerce",
        produto: "ecommerce",
        titulo: "Pedidos do e-commerce",
        texto: "Importe pedidos das lojas, responda perguntas e faça o pós-venda sem trocar de ferramenta. O canal entra no mesmo estoque e faturamento.",
        rota: "/pedido-ecommerce",
        ancora: "ecom-pedidos",
        tom: "ecom"
    },
    {
        id: "agenda",
        produto: "erp",
        titulo: "Agenda",
        texto: "Organize compromissos por empresa e responsável, com vistas mensal, semanal e diária e status do andamento.",
        rota: ROTAS.AGENDA,
        ancora: "agenda-lista",
        tom: "agenda"
    }
];

const LISTA = [
    {
        id: "separacao",
        produto: "erp",
        categoria: "PEDIDOS",
        titulo: "Acompanhe o saldo do estoque ao separar produtos",
        texto: "Na separação, o saldo do item aparece junto do pedido para evitar vender o que não tem na prateleira.",
        rota: "/separacao"
    },
    {
        id: "notas-lista",
        produto: "erp",
        categoria: "FISCAL",
        titulo: "Notas de entrada e conferência de compra",
        texto: "Lance a nota do fornecedor, confira a mercadoria e atualize o estoque no módulo de suprimentos.",
        rota: "/notas_entrada#list"
    },
    {
        id: "financeiro-lista",
        produto: "erp",
        categoria: "FINANCEIRO",
        titulo: "Ações de contas em um só fluxo",
        texto: "Contas a pagar, a receber e o caixa ficam no mesmo menu financeiro, com o dashboard de valores.",
        rota: "/dashboard#/financas"
    },
    {
        id: "agenda-lista",
        produto: "erp",
        categoria: "AGENDA",
        titulo: "Compromissos por empresa e responsável",
        texto: "A Agenda ganhou vistas mensal, semanal e diária, status e sincronização da equipe.",
        rota: ROTAS.AGENDA
    },
    {
        id: "dashboard-lista",
        produto: "erp",
        categoria: "VENDAS",
        titulo: "Dashboard de vendas separado do Índice",
        texto: "Total vendido, ticket médio, horários e produtos mais vendidos agora ficam na tela de Dashboard.",
        rota: `${ROTAS.DASHBOARD}#/vendas`
    },
    {
        id: "indice-lista",
        produto: "erp",
        categoria: "INÍCIO",
        titulo: "Widgets e atalhos configuráveis no Índice",
        texto: "Ligue, desligue e reorganize integrações, pedidos, guia, ajuda, novidades e atalhos no painel lateral.",
        rota: ROTAS.INDICE
    },
    {
        id: "hub-canais",
        produto: "hub",
        categoria: "INTEGRAÇÕES",
        titulo: "Conecte marketplaces e lojas virtuais",
        texto: "Adicione ou pause canais no catálogo de integrações. O resumo de pedidos volta para o Índice.",
        rota: ROTAS.INTEGRACOES
    },
    {
        id: "hub-pedidos",
        produto: "hub",
        categoria: "PEDIDOS",
        titulo: "Pedidos importados nos últimos 7 dias",
        texto: "O gráfico do Índice mostra os pedidos que chegaram das lojas Nuvemshop, Loja Integrada, Shopee e Mercado Livre.",
        rota: ROTAS.INDICE
    },
    {
        id: "pdv-nfce",
        produto: "pdv",
        categoria: "VENDAS",
        titulo: "PDV com atalho de NFC-e",
        texto: "Fature no caixa e emita a NFC-e sem abrir outra tela. O pedido de venda continua no mesmo fluxo.",
        rota: "/pdv"
    },
    {
        id: "pdv-pedido",
        produto: "pdv",
        categoria: "VENDAS",
        titulo: "Pedidos de venda e devoluções",
        texto: "Depois do caixa, acompanhe o pedido, a expedição e as devoluções no módulo de vendas.",
        rota: "/vendas#list"
    },
    {
        id: "caixa",
        produto: "conta",
        categoria: "CAIXA",
        titulo: "Caixa e extrato no financeiro",
        texto: "Abra o caixa do dia, veja o extrato bancário e a cobrança sem sair do Tem de Tudo.",
        rota: ROTAS.FINANCEIRO
    },
    {
        id: "cobranca",
        produto: "conta",
        categoria: "COBRANÇA",
        titulo: "Cobrança bancária e contas a receber",
        texto: "Registre o que o cliente deve e acompanhe a baixa no contas a receber.",
        rota: "/cobranca-bancaria"
    },
    {
        id: "ecom-pedidos",
        produto: "ecommerce",
        categoria: "PEDIDOS",
        titulo: "Pedidos do e-commerce no mesmo estoque",
        texto: "Os pedidos das lojas entram no ERP para faturar, separar e expedir como qualquer venda.",
        rota: "/pedido-ecommerce"
    },
    {
        id: "ecom-pos",
        produto: "ecommerce",
        categoria: "PÓS-VENDA",
        titulo: "Perguntas e pós-venda do canal",
        texto: "Responda o cliente da loja e registre o pós-venda sem abrir outra ferramenta.",
        rota: "/pos-venda-ecommerce"
    }
];

const REDES = ["facebook", "tiktok", "instagram", "linkedin", "youtube"];

function Shot({ tom }) {
    return (
        <div className={`versao-shot is-${tom}`} aria-hidden="true">
            <span className="versao-shot-bar" />
            <span className="versao-shot-card" />
            <span className="versao-shot-line" />
            <span className="versao-shot-line is-short" />
        </div>
    );
}

export default function DetalhesVersao() {
    const [filtro, setFiltro] = useState("ecossistema");

    const destaques = useMemo(() => {
        if (filtro === "ecossistema") {
            return DESTAQUES;
        }
        return DESTAQUES.filter((item) => item.produto === filtro);
    }, [filtro]);

    const grupos = useMemo(() => {
        const itens = filtro === "ecossistema"
            ? LISTA
            : LISTA.filter((item) => item.produto === filtro);
        const ordem = ["erp", "hub", "pdv", "conta", "ecommerce", "lis", "credito"];
        return ordem
            .map((id) => ({
                ...PRODUTOS[id],
                itens: itens.filter((item) => item.produto === id)
            }))
            .filter((grupo) => grupo.itens.length > 0);
    }, [filtro]);

    const vazio = destaques.length === 0 && grupos.length === 0;

    return (
        <div className="versao-page">
            <header className="versao-top">
                <nav className="dash-crumb" aria-label="Trilha">
                    <Link to={ROTAS.INDICE}>Início</Link>
                    <span>›</span>
                    <span>Novidades</span>
                </nav>
                <p className="versao-atualizado">Última atualização: {ATUALIZADO_EM}</p>
            </header>

            <h2>Novidades da Tem de Tudo</h2>

            <section className="versao-hero" aria-label="Destaque">
                <p>Atualizações dos produtos da Tem de Tudo que deixam seu negócio sempre à frente.</p>
                <div className="versao-hero-art" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </div>
            </section>

            <div className="versao-filtros">
                <span>Filtrar por:</span>
                <div className="versao-chips" role="tablist" aria-label="Filtrar novidades">
                    {FILTROS.map((item) => {
                        const ativo = filtro === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                role="tab"
                                aria-selected={ativo}
                                className={ativo ? "is-active" : ""}
                                onClick={() => setFiltro(item.id)}
                            >
                                {ativo ? <Check size={14} /> : null}
                                {item.nome}
                            </button>
                        );
                    })}
                </div>
            </div>

            {destaques.length ? (
                <section className="versao-destaques">
                    <h3>Destaques</h3>
                    <div className="versao-grid">
                        {destaques.map((item) => {
                            const produto = PRODUTOS[item.produto];
                            const Icon = produto.Icon;
                            return (
                                <article key={item.id} className="versao-card">
                                    <Shot tom={item.tom} />
                                    <span className="versao-tag">
                                        <Icon size={13} />
                                        {produto.nome}
                                    </span>
                                    <h4>{item.titulo}</h4>
                                    <p>{item.texto}</p>
                                    <footer>
                                        <Link to={item.rota} className="versao-cta">
                                            <Zap size={14} />
                                            Começar a usar
                                        </Link>
                                        <a href={`#novidade-${item.ancora}`} className="versao-more">
                                            + Saiba mais
                                        </a>
                                    </footer>
                                </article>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            {grupos.length ? (
                <section className="versao-lista">
                    <h3>Confira mais novidades</h3>
                    {grupos.map((grupo) => {
                        const Icon = grupo.Icon;
                        return (
                            <div key={grupo.id} className="versao-grupo">
                                <header>
                                    <Icon size={16} />
                                    <strong>{grupo.nome}</strong>
                                </header>
                                <ul>
                                    {grupo.itens.map((item) => (
                                        <li key={item.id} id={`novidade-${item.id}`}>
                                            <div>
                                                <h4>
                                                    <em>{item.categoria}</em>
                                                    <span>|</span>
                                                    {item.titulo}
                                                </h4>
                                                <p>{item.texto}</p>
                                            </div>
                                            <Link to={item.rota}>Saiba mais ›</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </section>
            ) : null}

            {vazio ? (
                <p className="versao-vazio">Nenhuma novidade neste produto por enquanto.</p>
            ) : null}

            <footer className="versao-social">
                Acompanhe nossas redes sociais:
                {REDES.map((rede) => (
                    <a key={rede} href={`#${rede}`}>
                        {rede}
                    </a>
                ))}
            </footer>
        </div>
    );
}
