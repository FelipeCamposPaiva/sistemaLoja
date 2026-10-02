import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { Pause as PauseIcon, Play as PlayIcon, RefreshCw as RefreshIcon } from "lucide-react";

import { dashboardFinanceiro, dashboardVendas } from "../../services/dashboard.service";
import { ESTAGIOS_CRM, lerAssuntos } from "../../constants/crm";
import ROTAS from "../../constants/rotas";
import DashboardSuprimentos from "../suprimentos/DashboardSuprimentos";
import DashboardExpedicao from "../vendas/DashboardExpedicao";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/dash-olist.css";

const CORES_PIE = ["#fb7185", "#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f97316"];
const FILTROS = [
    { id: "mes", label: "mês atual" },
    { id: "7", label: "últimos 7 dias" },
    { id: "15", label: "últimos 15 dias" },
    { id: "30", label: "últimos 30 dias" },
    { id: "90", label: "últimos 90 dias" }
];

function brl(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function inteiro(valor) {
    return Number(valor || 0).toLocaleString("pt-BR");
}

function variacaoTexto(valor) {
    if (valor == null || Number.isNaN(Number(valor))) {
        return { texto: "—", classe: "is-flat" };
    }
    const n = Number(valor);
    const sinal = n > 0 ? "+" : "";
    return {
        texto: `${sinal}${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`,
        classe: n > 0 ? "is-up" : n < 0 ? "is-down" : "is-flat"
    };
}

function segundosAtras(iso) {
    if (!iso) {
        return "agora";
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
        return "agora";
    }
    const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
    if (s < 15) {
        return "agora";
    }
    if (s < 60) {
        return `a ${s}s`;
    }
    return `a ${Math.round(s / 60)}m`;
}

function Tip({ active, payload, moeda: emMoeda }) {
    if (!active || !payload?.length) {
        return null;
    }
    const ponto = payload[0].payload || {};
    return (
        <div className="dash-tip">
            <strong>{ponto.rotulo || ponto.nome}</strong>
            {payload.map((item) => (
                <span key={item.dataKey}>
                    {item.name}: {emMoeda ? brl(item.value) : inteiro(item.value)}
                </span>
            ))}
        </div>
    );
}

const ABAS = ["vendas", "financas", "estoque", "expedicao"];
const TITULOS = {
    vendas: "Dashboard de vendas",
    financas: "Dashboard de finanças",
    estoque: "Dashboard de estoque",
    expedicao: "Dashboard de expedição"
};

function abaDe(hash) {
    const texto = String(hash || "").replace(/^#\/?/, "").toLowerCase();
    return ABAS.find((id) => texto === id || texto.startsWith(`${id}/`)) || "vendas";
}

export default function Dashboard() {
    const { hash, pathname } = useLocation();
    if (pathname === "/dashboard" && (!hash || hash === "#")) {
        return <Navigate to="/dashboard#/vendas" replace />;
    }
    return <PainelDashboard />;
}

function PainelDashboard() {
    const { hash } = useLocation();
    const aba = abaDe(hash);
    const [filtro, setFiltro] = useState("mes");
    const [menuFiltro, setMenuFiltro] = useState(false);
    const [vendas, setVendas] = useState(null);
    const [fin, setFin] = useState(null);
    const [aviso, setAviso] = useState("");
    const [pausado, setPausado] = useState(false);

    const params = filtro === "mes" ? { periodo: "mes" } : { dias: Number(filtro) };

    async function carregar(silencioso) {
        if (!silencioso) {
            setAviso("");
        }
        try {
            if (aba === "estoque" || aba === "expedicao") {
                return;
            }
            if (aba === "financas") {
                setFin(await dashboardFinanceiro());
            } else {
                setVendas(await dashboardVendas(params));
            }
        } catch (error) {
            setAviso(error?.response?.data?.mensagem || "Não foi possível carregar o dashboard.");
        }
    }

    useEffect(() => {
        carregar(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aba, filtro]);

    useEffect(() => {
        if (pausado) {
            return undefined;
        }
        const id = setInterval(() => carregar(true), 60000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aba, filtro, pausado]);

    const filtroLabel = FILTROS.find((f) => f.id === filtro)?.label || "mês atual";
    const atualizado = segundosAtras(aba === "financas" ? fin?.atualizadoEm : vendas?.atualizadoEm);
    const interno = aba === "estoque" || aba === "expedicao";

    return (
        <div className="dash-ol">
            <p className="dash-crumb">
                <Link to="/index">início</Link>
                {" › "}
                <span>dashboard</span>
                {" › "}
                <span>{aba === "financas" ? "finanças" : aba === "estoque" ? "estoque" : aba === "expedicao" ? "expedição" : "vendas"}</span>
            </p>
            <header className="dash-ol-head">
                <div>
                    <h3>{TITULOS[aba]}</h3>
                    <nav className="dash-ol-tabs">
                        <Link to="/dashboard#/vendas" className={aba === "vendas" ? "is-on" : ""}>vendas</Link>
                        <Link to="/dashboard#/financas" className={aba === "financas" ? "is-on" : ""}>finanças</Link>
                        <Link to="/dashboard#/estoque" className={aba === "estoque" ? "is-on" : ""}>estoque</Link>
                        <Link to="/dashboard#/expedicao" className={aba === "expedicao" ? "is-on" : ""}>expedição</Link>
                    </nav>
                </div>
                {interno ? null : (
                    <div className="dash-ol-tools">
                        {aba === "vendas" ? (
                            <div className="dash-ol-filtro">
                                <button type="button" className="is-on" onClick={() => setFiltro("mes")}>mês atual</button>
                                <button type="button" onClick={() => setMenuFiltro((v) => !v)}>Filtros</button>
                                {menuFiltro ? (
                                    <ul>
                                        {FILTROS.map((opcao) => (
                                            <li key={opcao.id}>
                                                <button
                                                    type="button"
                                                    className={filtro === opcao.id ? "is-on" : ""}
                                                    onClick={() => { setFiltro(opcao.id); setMenuFiltro(false); }}
                                                >
                                                    {opcao.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        ) : null}
                        <button type="button" onClick={() => carregar(true)}>
                            <RefreshIcon size={14} />
                            atualizado {atualizado}
                        </button>
                        <button type="button" onClick={() => setPausado((v) => !v)} aria-label={pausado ? "Retomar" : "Pausar"}>
                            {pausado ? <PlayIcon size={14} /> : <PauseIcon size={14} />}
                        </button>
                    </div>
                )}
            </header>
            {aviso && !interno ? <p className="dash-aviso">{aviso}</p> : null}
            {aba === "financas" ? (
                <AbaFinancas dados={fin} />
            ) : aba === "estoque" ? (
                <div className="dash-ol-embed">
                    <DashboardSuprimentos embutido />
                </div>
            ) : aba === "expedicao" ? (
                <div className="dash-ol-embed">
                    <DashboardExpedicao embutido />
                </div>
            ) : (
                <AbaVendas dados={vendas} filtroLabel={filtroLabel} />
            )}
        </div>
    );
}

function AbaVendas({ dados, filtroLabel }) {
    const vendasVar = variacaoTexto(dados?.variacaoVendas);
    const ticketVar = variacaoTexto(dados?.variacaoTicket);
    const serie = dados?.serieVendas || [];
    const ticket = dados?.serieTicket || [];
    const produtos = dados?.produtos || [];
    const horarios = dados?.horarios || [];
    const estados = dados?.estados || [];
    const integracoes = dados?.integracoes || [];
    const dev = (dados?.serieDevolucoes || []).map((p) => ({
        rotulo: p.rotulo,
        vendas: Number(p.valor || 0),
        devolucoes: Number(p.devolucoes || 0)
    }));
    const funil = useMemo(() => {
        const assuntos = lerAssuntos().filter((a) => a.estagio && a.estagio !== "concluido");
        return ESTAGIOS_CRM
            .filter((e) => e.id !== "concluido")
            .map((e) => ({ nome: e.nome, qtd: assuntos.filter((a) => a.estagio === e.id).length }))
            .filter((e) => e.qtd > 0);
    }, [dados?.atualizadoEm]);

    const minVendas = Number(dados?.eixoMinVendas || 0);
    const maxTicket = Math.max(Number(dados?.eixoMaxTicket || 0), 10);

    return (
        <>
            <div className="dash-ol-kpis">
                <article className="dash-ol-card">
                    <header>
                        <div>
                            <small>Total das vendas</small>
                            <strong>{brl(dados?.totalVendas)}</strong>
                        </div>
                        <em className={vendasVar.classe}>{vendasVar.texto}</em>
                    </header>
                    <div className="dash-ol-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="olVendas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="var(--line)" />
                                <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                                <YAxis
                                    domain={[minVendas, "auto"]}
                                    tickFormatter={(v) => brl(v).replace("R$", "R$")}
                                    width={72}
                                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<Tip moeda />} />
                                <Area type="monotone" dataKey="valor" name="Vendas" stroke="#3b82f6" fill="url(#olVendas)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <Link to={`${ROTAS.PEDIDO_VENDA}#list`}>expandir detalhes</Link>
                </article>
                <article className="dash-ol-card">
                    <header>
                        <div>
                            <small>Ticket médio</small>
                            <strong>{brl(dados?.ticketMedio)}</strong>
                        </div>
                        <em className={ticketVar.classe}>{ticketVar.texto}</em>
                    </header>
                    <div className="dash-ol-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={ticket} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke="var(--line)" />
                                <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, maxTicket]} width={48} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                                <Tooltip content={<Tip moeda />} />
                                <Area type="monotone" dataKey="valor" name="Ticket" stroke="#3b82f6" fill="#3b82f633" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <Link to={`${ROTAS.PEDIDO_VENDA}#list`}>expandir detalhes</Link>
                </article>
            </div>

            <section className="dash-ol-visao">
                <h4>Visão geral</h4>
                <ul>
                    <li><b>{inteiro(dados?.pedidos)}</b><span>pedidos</span></li>
                    <li><b>{inteiro(dados?.vendasEcommerce)}</b><span>vendas em e-commerce</span></li>
                    <li><b>{inteiro(dados?.vendasFisicas)}</b><span>vendas físicas</span></li>
                    <li><b>{brl(dados?.totalVendas)}</b><span>valor total</span></li>
                    <li><b>{inteiro(dados?.nfeEmitidas)}</b><span>nf-e emitidas</span></li>
                    <li><b>{dados?.integracaoAlta || "—"}</b><span>integração em alta</span></li>
                </ul>
                <p className="dash-ol-periodo">{filtroLabel}</p>
            </section>

            <div className="dash-ol-grid">
                <article className="dash-ol-card">
                    <h4>Pedidos por integrações</h4>
                    {integracoes.length ? (
                        <div className="dash-ol-chart is-pie">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={integracoes} dataKey="pedidos" nameKey="nome" innerRadius={48} outerRadius={78} paddingAngle={2}>
                                        {integracoes.map((_, i) => <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />)}
                                    </Pie>
                                    <Tooltip content={<Tip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <ul className="dash-ol-legenda">
                                {integracoes.map((item, i) => (
                                    <li key={item.nome}><i style={{ background: CORES_PIE[i % CORES_PIE.length] }} />{item.nome} · {inteiro(item.pedidos)}</li>
                                ))}
                            </ul>
                        </div>
                    ) : <p className="dash-empty">Sem pedidos no período.</p>}
                    <Link to={ROTAS.INTEGRACOES}>expandir detalhes</Link>
                </article>

                <article className="dash-ol-card">
                    <h4>Pedidos por estado</h4>
                    {estados.length ? (
                        <ul className="dash-uf">
                            {estados.map((item) => (
                                <li key={item.uf}><span>{item.uf}</span><strong>{inteiro(item.pedidos)} · {brl(item.valor)}</strong></li>
                            ))}
                        </ul>
                    ) : <p className="dash-empty">Nenhum pedido com UF.</p>}
                    <Link to={ROTAS.EXPEDICAO}>expandir detalhes</Link>
                </article>

                <article className="dash-ol-card">
                    <h4>Funil de assuntos no CRM</h4>
                    <small>Assuntos com ações pendentes</small>
                    {funil.length ? (
                        <ul className="dash-uf">
                            {funil.map((item) => (
                                <li key={item.nome}><span>{item.nome}</span><strong>{inteiro(item.qtd)}</strong></li>
                            ))}
                        </ul>
                    ) : (
                        <p className="dash-empty">Sua pesquisa não retornou resultados. Tente outras opções de filtros.</p>
                    )}
                    <Link to={ROTAS.CRM}>ver assuntos</Link>
                </article>

                <article className="dash-ol-card">
                    <h4>Produtos mais vendidos</h4>
                    {produtos.length ? (
                        <ul>
                            {produtos.map((item) => (
                                <li key={item.nome}>
                                    <span>{item.nome}</span>
                                    <strong className={item.tendencia === "DOWN" ? "is-down" : "is-up"}>
                                        {inteiro(item.qtd)} {item.tendencia === "DOWN" ? "↓" : "↑"}
                                    </strong>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="dash-empty">Sem itens no período.</p>}
                    <Link to="/produtos#list">expandir detalhes</Link>
                </article>

                <article className="dash-ol-card">
                    <h4>Horários com mais vendas</h4>
                    <div className="dash-ol-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={horarios} layout="vertical" margin={{ left: 8 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="rotulo" width={52} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                                <Tooltip content={<Tip />} />
                                <Bar dataKey="valor" name="Vendas" fill="#38bdf8" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <Link to={`${ROTAS.PEDIDO_VENDA}#list`}>expandir detalhes</Link>
                </article>

                <article className="dash-ol-card">
                    <h4>Vendas X Devoluções <small>{inteiro(dados?.vendasQtd)} · {inteiro(dados?.devolucoesQtd)}</small></h4>
                    <div className="dash-ol-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dev}>
                                <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip content={<Tip />} />
                                <Bar dataKey="vendas" name="Vendas" fill="#3b82f6" radius={4} />
                                <Bar dataKey="devolucoes" name="Devoluções" fill="#fb7185" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <Link to="/devolucoes">expandir detalhes</Link>
                </article>
            </div>
        </>
    );
}

function AbaFinancas({ dados }) {
    const contas = dados?.contas || [];
    const fluxo = dados?.fluxo || [];
    const aging = dados?.aging || [];
    return (
        <>
            <section className="dash-ol-visao">
                <h4>Visão geral</h4>
                <ul>
                    <li><b>{brl(dados?.saldoCaixa)}</b><span>saldo atual</span></li>
                    <li><b>{brl(dados?.contasPagar)}</b><span>contas a pagar</span></li>
                    <li><b>{brl(dados?.contasReceber)}</b><span>contas a receber</span></li>
                    <li><b>{inteiro(dados?.contasVencendoHoje)}</b><span>contas vencendo hoje</span></li>
                    <li><b>{dados?.caixaMaior || "Caixa"}</b><span>conta com maior saldo</span></li>
                </ul>
            </section>
            <div className="dash-ol-grid is-fin">
                <article className="dash-ol-card">
                    <h4>Saldo atual de contas <strong>{brl(dados?.saldoCaixa)}</strong></h4>
                    <div className="dash-ol-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={contas}>
                                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: "var(--muted)" }} interval={0} angle={-25} height={48} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip content={<Tip moeda />} />
                                <Bar dataKey="saldo" name="Saldo" fill="#38bdf8" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <Link to={ROTAS.BALANCETE}>acessar caixa</Link>
                </article>
                <article className="dash-ol-card">
                    <h4>Fluxo de caixa</h4>
                    <div className="dash-ol-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={fluxo}>
                                <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip content={<Tip moeda />} />
                                <Bar dataKey="valor" name="Saldo" fill="#fb7185" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <Link to={ROTAS.CONTAS_RECEBER}>expandir detalhes</Link>
                </article>
                <article className="dash-ol-card is-wide">
                    <h4>Contas a receber e a pagar</h4>
                    <div className="dash-ol-chart is-tall">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={aging}>
                                <CartesianGrid vertical={false} stroke="var(--line)" />
                                <XAxis dataKey="rotulo" tick={{ fontSize: 10, fill: "var(--muted)" }} interval={0} angle={-20} height={52} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip content={<Tip moeda />} />
                                <Bar dataKey="receber" name="Receber" fill="#38bdf8" radius={4} />
                                <Bar dataKey="pagar" name="Pagar" fill="#fb7185" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="dash-ol-links">
                        <Link to={ROTAS.CONTAS_RECEBER}>contas a receber</Link>
                        <Link to={ROTAS.CONTAS_PAGAR}>contas a pagar</Link>
                    </div>
                </article>
            </div>
        </>
    );
}
