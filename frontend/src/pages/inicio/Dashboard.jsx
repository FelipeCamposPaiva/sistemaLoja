import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis
} from "recharts";

import { dashboardGeral } from "../../services/dashboard.service";
import { listarOS } from "../../services/os.service";
import { moeda } from "../../constants/ordensServico";
import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";

const SERIE_VENDAS = [
    { dia: "03/08", valor: 980 },
    { dia: "08/08", valor: 1240 },
    { dia: "13/08", valor: 1510 },
    { dia: "18/08", valor: 1680 },
    { dia: "23/08", valor: 2100 },
    { dia: "28/08", valor: 1890 },
    { dia: "02/09", valor: 2340 }
];

const TICKET = [
    { dia: "03/08", valor: 42 },
    { dia: "08/08", valor: 48 },
    { dia: "13/08", valor: 51 },
    { dia: "18/08", valor: 47 },
    { dia: "23/08", valor: 55 },
    { dia: "28/08", valor: 53 },
    { dia: "02/09", valor: 58 }
];

const HORARIOS = [
    { hora: "09h", vendas: 12 },
    { hora: "11h", vendas: 28 },
    { hora: "13h", vendas: 19 },
    { hora: "15h", vendas: 34 },
    { hora: "17h", vendas: 41 },
    { hora: "19h", vendas: 22 }
];

const VENDAS_DEV = [
    { nome: "Vendas", qtd: 93 },
    { nome: "Devoluções", qtd: 8 }
];

const PRODUTOS = [
    { nome: "Envelope branco carta", qtd: 50 },
    { nome: "Caderno 96 folhas", qtd: 36 },
    { nome: "Caneta azul", qtd: 28 },
    { nome: "Papel A4 500fl", qtd: 21 }
];

function brl(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Dashboard() {
    const { hash, pathname } = useLocation();
    if (pathname === "/dashboard" && (!hash || hash === "#")) {
        return <Navigate to="/dashboard#/vendas" replace />;
    }
    return <PainelDashboard />;
}

function PainelDashboard() {
    const [osResumo, setOsResumo] = useState({ totalOS: 0, osProducao: 0, totalOrcamentos: 0, valorOS: 0 });

    useEffect(() => {
        let vivo = true;
        Promise.all([
            dashboardGeral().catch(() => null),
            listarOS().catch(() => [])
        ]).then(([dash, lista]) => {
            if (!vivo) {
                return;
            }
            const ordens = Array.isArray(lista) ? lista : [];
            const producao = ordens.filter((os) => /ARTE|PRODUC|ACABAMENTO|ANDAMENTO/i.test(String(os.status || os.setorAtual || ""))).length;
            const orcamentos = ordens.filter((os) => /ORCAMENT|ORÇAMENT|EM_ABERTO/i.test(String(os.status || os.setorAtual || ""))).length;
            const valorOS = ordens.reduce((acc, os) => acc + Number(os.valor || 0), 0);
            setOsResumo({
                totalOS: dash?.totalOS || ordens.length,
                osProducao: dash?.osProducao || producao,
                totalOrcamentos: dash?.totalOrcamentos || orcamentos,
                valorOS
            });
        });
        return () => {
            vivo = false;
        };
    }, []);

    return (
        <div className="dash-home">
            <header className="dash-vendas-head">
                <div>
                    <p className="dash-crumb">
                        <Link to="/index">início</Link>
                        {" › "}
                        <span>dashboard</span>
                        {" › "}
                        <span>vendas</span>
                    </p>
                    <h3>Dashboard de vendas</h3>
                </div>
                <div className="dash-pills">
                    <span>últimos 30 dias</span>
                    <span>Filtros</span>
                    <span>atualizado agora</span>
                </div>
            </header>

            <div className="dash-kpis">
                <article className="dash-kpi">
                    <small>Total de vendas</small>
                    <strong>{brl(41736.62)}</strong>
                    <em className="is-up">+7,54%</em>
                    <div className="dash-spark">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={SERIE_VENDAS}>
                                <defs>
                                    <linearGradient id="fillVendas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="valor" stroke="#3b82f6" fill="url(#fillVendas)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </article>
                <article className="dash-kpi">
                    <small>Ticket médio</small>
                    <strong>{brl(58.4)}</strong>
                    <em className="is-down">-3,12%</em>
                    <div className="dash-spark">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={TICKET}>
                                <Area type="monotone" dataKey="valor" stroke="#3b82f6" fill="#3b82f633" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </article>
            </div>

            <div className="dash-overview">
                <div><b>{osResumo.totalOS}</b><span>ordens de serviço</span></div>
                <div><b>{osResumo.osProducao}</b><span>OS em produção</span></div>
                <div><b>{osResumo.totalOrcamentos}</b><span>orçamentos</span></div>
                <div><b>R$ {moeda(osResumo.valorOS)}</b><span>valor das OS</span></div>
            </div>
            <p className="idx-sub" style={{ marginTop: -8, marginBottom: 18 }}>
                <Link to={ROTAS.ORDEM_SERVICO}>abrir OS</Link>
                {" · "}
                <Link to={ROTAS.PAINEL_PRODUCAO}>painel de produção</Link>
                {" · "}
                <Link to={ROTAS.RELATORIO_TECNICOS}>produtividade por técnico</Link>
                {" · "}
                <Link to={ROTAS.NFS}>NFS</Link>
            </p>

            <div className="dash-overview">
                <div><b>0</b><span>vendas em e-commerce</span></div>
                <div><b>93</b><span>vendas físicas</span></div>
                <div><b>{brl(1071.65)}</b><span>valor total</span></div>
                <div><b>38</b><span>nf-e emitidas</span></div>
            </div>

            <div className="dash-grid-4">
                <article className="dash-box">
                    <h4>Produtos mais vendidos</h4>
                    <ul>
                        {PRODUTOS.map((item) => (
                            <li key={item.nome}>
                                <span>{item.nome}</span>
                                <strong>{item.qtd}</strong>
                            </li>
                        ))}
                    </ul>
                    <Link to="/produtos#list">expandir detalhes</Link>
                </article>

                <article className="dash-box">
                    <h4>Horários com mais vendas</h4>
                    <div className="dash-mini-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={HORARIOS} layout="vertical" margin={{ left: 8 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="hora" stroke="#9aa0a6" width={36} tickLine={false} axisLine={false} />
                                <Bar dataKey="vendas" fill="#3b82f6" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <Link to={`${ROTAS.PEDIDO_VENDA}#list`}>expandir detalhes</Link>
                </article>

                <article className="dash-box">
                    <h4>Vendas X Devoluções</h4>
                    <div className="dash-mini-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={VENDAS_DEV}>
                                <XAxis dataKey="nome" stroke="#9aa0a6" tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Bar dataKey="qtd" fill="#3b82f6" radius={6} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <Link to="/devolucoes">expandir detalhes</Link>
                </article>

                <article className="dash-box">
                    <h4>Pedidos por estado</h4>
                    <div className="dash-map" aria-hidden="true">
                        <svg viewBox="0 0 200 180">
                            <path
                                d="M110 12 l18 14 22 8 10 22 -6 18 14 16 -8 22 -24 10 -16 24 -22 8 -20 -12 -18 6 -14 -20 4 -22 -16 -14 8 -24 22 -16 18 -10z"
                                fill="#3b82f6"
                                opacity="0.85"
                            />
                        </svg>
                    </div>
                    <Link to="/expedicao">expandir detalhes</Link>
                </article>
            </div>
        </div>
    );
}
