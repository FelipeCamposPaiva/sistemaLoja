import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer } from "lucide-react";

import { lerAssuntos } from "../../constants/crm";
import {
    dashboardFinanceiro,
    dashboardGeral,
    dashboardSuprimentos,
    dashboardVendas
} from "../../services/dashboard.service";
import { dataHoraLog, listarAuditoria, rotuloAcao } from "../../services/auditoria.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/os.css";

function brl(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function n(valor) {
    return Number(valor || 0).toLocaleString("pt-BR");
}

function texto(valor) {
    if (valor == null || valor === "") {
        return "—";
    }
    return String(valor);
}

async function carregarInicio() {
    const g = await dashboardGeral();
    return {
        sub: "Resumo do período: cadastros, serviços, vendas e caixa.",
        kpis: [
            ["Clientes", n(g.totalClientes)],
            ["Produtos", n(g.totalProdutos)],
            ["Faturamento do mês", brl(g.faturamentoMes)],
            ["Saldo do caixa", brl(g.saldoCaixa)]
        ],
        colunas: ["Indicador", "Valor"],
        linhas: [
            ["Clientes novos", n(g.clientesNovos)],
            ["Ordens de serviço", n(g.totalOS)],
            ["OS em produção", n(g.osProducao)],
            ["Orçamentos", n(g.totalOrcamentos)],
            ["Itens com estoque baixo", n(g.estoqueBaixo)],
            ["Vendas de hoje", brl(g.vendasHoje)],
            ["Contas a receber", brl(g.contasReceber)],
            ["Contas a pagar", brl(g.contasPagar)]
        ]
    };
}

async function carregarCadastros() {
    const g = await dashboardGeral();
    return {
        sub: "Quantidade dos cadastros usados no restante do ERP.",
        kpis: [
            ["Clientes", n(g.totalClientes)],
            ["Clientes novos", n(g.clientesNovos)],
            ["Produtos", n(g.totalProdutos)],
            ["Estoque baixo", n(g.estoqueBaixo)]
        ],
        colunas: ["Cadastro", "Quantidade"],
        linhas: [
            ["Clientes e fornecedores", n(g.totalClientes)],
            ["Clientes novos", n(g.clientesNovos)],
            ["Produtos", n(g.totalProdutos)],
            ["Produtos com estoque baixo", n(g.estoqueBaixo)]
        ]
    };
}

async function carregarSuprimentos() {
    const s = await dashboardSuprimentos();
    const reposicao = Array.isArray(s.reposicao) ? s.reposicao : [];
    return {
        sub: "Custo, venda e itens que pedem reposição.",
        kpis: [
            ["Valor de custo", brl(s.valorCusto)],
            ["Valor de venda", brl(s.valorVenda)],
            ["SKUs ativos", n(s.skuAtivos)],
            ["Para repor", n(s.skuReposicao)]
        ],
        colunas: ["SKU", "Produto", "Estoque", "Comprar"],
        linhas: reposicao.slice(0, 20).map((item) => [
            texto(item.sku),
            texto(item.nome),
            n(item.estoque),
            n(item.comprar)
        ])
    };
}

async function carregarVendas() {
    const v = await dashboardVendas({ periodo: "mes" });
    const produtos = Array.isArray(v.produtos) ? v.produtos : [];
    return {
        sub: "Vendas do mês atual, ticket e produtos.",
        kpis: [
            ["Pedidos", n(v.pedidos)],
            ["Total", brl(v.totalVendas)],
            ["Ticket médio", brl(v.ticketMedio)],
            ["Devoluções", n(v.devolucoesQtd)]
        ],
        colunas: ["Produto", "Quantidade"],
        linhas: produtos.slice(0, 20).map((item) => [texto(item.nome), n(item.qtd)])
    };
}

async function carregarFinanceiro() {
    const f = await dashboardFinanceiro();
    const contas = Array.isArray(f.contas) ? f.contas : [];
    const aging = Array.isArray(f.aging) ? f.aging : [];
    return {
        sub: "Caixa, resultado do mês e contas em aberto.",
        kpis: [
            ["Saldo do caixa", brl(f.saldoCaixa)],
            ["A receber", brl(f.contasReceber)],
            ["A pagar", brl(f.contasPagar)],
            ["Resultado do mês", brl(f.resultado)]
        ],
        colunas: ["Conta", "Saldo"],
        linhas: [
            ...contas.slice(0, 12).map((item) => [texto(item.nome), brl(item.saldo)]),
            ...aging.slice(0, 8).map((item) => [
                `Atraso ${texto(item.rotulo)}`,
                `receber ${brl(item.receber)} · pagar ${brl(item.pagar)}`
            ])
        ]
    };
}

async function carregarEcommerce() {
    const v = await dashboardVendas({ periodo: "mes" });
    const canais = Array.isArray(v.integracoes) ? v.integracoes : [];
    let assuntos = 0;
    try {
        assuntos = lerAssuntos().length;
    } catch {
        assuntos = 0;
    }
    return {
        sub: "Vendas por canal no mês e assuntos abertos no CRM.",
        kpis: [
            ["Vendas online", n(v.vendasEcommerce)],
            ["Vendas na loja", n(v.vendasFisicas)],
            ["NF-e emitidas", n(v.nfeEmitidas)],
            ["Assuntos no CRM", n(assuntos)]
        ],
        colunas: ["Canal", "Pedidos", "Valor"],
        linhas: canais.slice(0, 20).map((item) => [texto(item.nome), n(item.pedidos), brl(item.valor)])
    };
}

async function carregarLoja() {
    const v = await dashboardVendas({ periodo: "mes" });
    const estados = Array.isArray(v.estados) ? v.estados : [];
    return {
        sub: "Pedidos da loja no mês, por estado.",
        kpis: [
            ["Pedidos online", n(v.vendasEcommerce)],
            ["Total do mês", brl(v.totalVendas)],
            ["Ticket médio", brl(v.ticketMedio)],
            ["NF-e emitidas", n(v.nfeEmitidas)]
        ],
        colunas: ["UF", "Pedidos", "Valor"],
        linhas: estados.slice(0, 20).map((item) => [texto(item.uf), n(item.pedidos), brl(item.valor)])
    };
}

async function carregarConfiguracoes() {
    const logs = await listarAuditoria();
    const mapa = new Map();
    logs.forEach((log) => {
        const chave = texto(log.entidade);
        mapa.set(chave, (mapa.get(chave) || 0) + 1);
    });
    return {
        sub: "Movimentos registrados na auditoria.",
        kpis: [
            ["Registros", n(logs.length)],
            ["Entidades", n(mapa.size)],
            ["Cadastros", n(logs.filter((log) => log.acao === "CRIAR").length)],
            ["Alterações", n(logs.filter((log) => log.acao === "ALTERAR").length)]
        ],
        colunas: ["Quando", "Entidade", "Ação", "Registro"],
        linhas: logs.slice(0, 20).map((log) => [
            dataHoraLog(log.criadoEm || log.dataHora || log.data),
            texto(log.entidade),
            rotuloAcao(log.acao),
            texto(log.registroNome || log.registroId)
        ])
    };
}

const RELATORIOS = {
    inicio: { titulo: "Início", nome: "Relatório", carregar: carregarInicio },
    cadastros: { titulo: "Cadastros", nome: "Relatório", carregar: carregarCadastros },
    suprimentos: { titulo: "Suprimentos", nome: "Relatório", carregar: carregarSuprimentos },
    vendas: { titulo: "Vendas", nome: "Relatório", carregar: carregarVendas },
    financeiro: { titulo: "Financeiro", nome: "Relatório", carregar: carregarFinanceiro },
    ecommerce: { titulo: "E-commerce", nome: "Relatório", carregar: carregarEcommerce },
    "loja-virtual": { titulo: "Loja virtual", nome: "Relatório", carregar: carregarLoja },
    configuracoes: { titulo: "Configurações", nome: "Relatório", carregar: carregarConfiguracoes }
};

export default function RelatorioGrupo() {
    const { grupo } = useParams();
    const def = RELATORIOS[grupo];
    const [dados, setDados] = useState(null);
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        if (!def) {
            return undefined;
        }
        let ativo = true;
        setDados(null);
        setAviso("");
        def.carregar()
            .then((resultado) => {
                if (ativo) {
                    setDados(resultado);
                }
            })
            .catch(() => {
                if (ativo) {
                    setAviso("Não foi possível montar o relatório.");
                    setDados({ sub: "", kpis: [], colunas: [], linhas: [] });
                }
            });
        return () => {
            ativo = false;
        };
    }, [def]);

    if (!def) {
        return (
            <div className="os-page">
                <div className="fer-head">
                    <h2>Relatório</h2>
                    <p className="idx-sub">Este grupo ainda não tem relatório.</p>
                </div>
            </div>
        );
    }

    const linhas = dados?.linhas || [];

    return (
        <div className="os-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>{def.titulo.toLowerCase()}</span>
                <span>›</span>
                <span>relatório</span>
            </nav>
            <div className="fer-head">
                <div>
                    <h2>{def.nome}</h2>
                    <p className="idx-sub">{dados?.sub || "Carregando relatório…"}</p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    <button type="button" className="os-ghost" onClick={() => window.print()}>
                        <Printer size={15} /> imprimir
                    </button>
                </div>
            </div>

            {dados?.kpis?.length ? (
                <div className="os-kpis">
                    {dados.kpis.map(([rotulo, valor]) => (
                        <article key={rotulo}>
                            <small>{rotulo}</small>
                            <strong>{valor}</strong>
                        </article>
                    ))}
                </div>
            ) : null}

            <div className="os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            {(dados?.colunas || []).map((coluna) => <th key={coluna}>{coluna}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.length ? linhas.map((linha, indice) => (
                            <tr key={`${indice}-${linha[0]}`}>
                                {linha.map((celula, i) => <td key={i}>{celula}</td>)}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={Math.max(dados?.colunas?.length || 1, 1)}>
                                    {dados ? "Nenhum registro neste relatório." : "Carregando…"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
