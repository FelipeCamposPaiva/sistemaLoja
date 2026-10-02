import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Check,
    Clock3,
    GripVertical,
    Headset,
    MoreHorizontal,
    PlayCircle,
    SlidersHorizontal
} from "lucide-react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import useAuth from "../../hooks/useAuth.jsx";
import { catalogoPorId, lerMinhasIntegracoes } from "../../constants/integracoes";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";

const WIDGETS_KEY = "erp-index-widgets";

const WIDGETS = [
    { id: "integracoes", nome: "Minhas integrações", desc: "Resumo de pedidos do e-commerce", editar: true },
    { id: "pedidos", nome: "Últimos pedidos do e-commerce", desc: "Pedidos importados nos últimos 7 dias" },
    { id: "onboarding", nome: "Onboarding", desc: "Guia para começar a vender no ERP" },
    { id: "ajuda", nome: "Precisa de ajuda?", desc: "Suporte e video tutoriais" },
    { id: "novidades", nome: "Novidades do Sistema ERP", desc: "Avisos e atualizações do sistema" },
    { id: "atalhos", nome: "Meus atalhos", desc: "Acesso rápido aos módulos", editar: true }
];

const ATALHOS = [
    { nome: "Dashboard", rota: "/dashboard#/vendas" },
    { nome: "Dashboard de expedição", rota: "/dashboard#/expedicao" },
    { nome: "Clientes", rota: "/contatos#/" },
    { nome: "PDV", rota: "/pdv" },
    { nome: "Notas de entrada", rota: "/notas_entrada#list" },
    { nome: "CRM", rota: "/crm" }
];

const NOVIDADES = [
    { titulo: "PDV com atalho de NFC-e", quando: "há 2 dias" },
    { titulo: "Integrações de marketplace no Índice", quando: "há 5 dias" }
];

function padraoWidgets() {
    return Object.fromEntries(WIDGETS.map((item) => [item.id, true]));
}

function lerWidgets() {
    try {
        const bruto = localStorage.getItem(WIDGETS_KEY);
        if (!bruto) {
            return padraoWidgets();
        }
        return { ...padraoWidgets(), ...JSON.parse(bruto) };
    } catch {
        return padraoWidgets();
    }
}

function saudacao() {
    const hora = new Date().getHours();
    if (hora < 12) {
        return "Bom dia";
    }
    if (hora < 18) {
        return "Boa tarde";
    }
    return "Boa noite";
}

function pedidos7Dias() {
    const fmt = new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit"
    });
    return Array.from({ length: 7 }, (_, i) => {
        const data = new Date();
        data.setDate(data.getDate() - (6 - i));
        return {
            dia: fmt.format(data).replace(".", ""),
            pedidos: 0
        };
    });
}

export default function Indice() {
    const { usuario } = useAuth();
    const nome = (usuario?.nome || "Administrador").split(" ")[0];
    const seriePedidos = useMemo(() => pedidos7Dias(), []);
    const [visiveis, setVisiveis] = useState(lerWidgets);
    const [painel, setPainel] = useState(null);
    const [loja, setLoja] = useState("integrada");
    const [atalhos, setAtalhos] = useState(ATALHOS);
    const minhasIntegracoes = useMemo(() => {
        return lerMinhasIntegracoes()
            .map((item) => {
                const meta = catalogoPorId(item.id);
                if (!meta) {
                    return null;
                }
                return {
                    ...item,
                    ...meta,
                    pedidos: 0,
                    quando: item.ativa ? "agora" : "inativa"
                };
            })
            .filter(Boolean);
    }, []);

    function gravarWidgets(proximo) {
        setVisiveis(proximo);
        try {
            localStorage.setItem(WIDGETS_KEY, JSON.stringify(proximo));
        } catch {
            /* ignore */
        }
    }

    function alternarWidget(id) {
        gravarWidgets({ ...visiveis, [id]: !visiveis[id] });
    }

    function removerAtalho(rota) {
        setAtalhos((atual) => atual.filter((item) => item.rota !== rota));
    }

    return (
        <div className={`idx-page${painel ? " has-drawer" : ""}`}>
            <div className="idx-main">
                <header className="idx-head">
                    <div>
                        <h2>
                            {saudacao()}, {nome}
                        </h2>
                        <Link to="/detalhes_versao" className="dash-link">
                            Descubra o que mudou no ERP na última semana
                        </Link>
                    </div>
                    <button
                        type="button"
                        className="idx-config"
                        onClick={() => setPainel(painel ? null : "widgets")}
                    >
                        <SlidersHorizontal size={16} />
                        configurar widgets
                    </button>
                </header>

                {visiveis.integracoes ? (
                    <section className="dash-sec">
                        <div className="dash-sec-head">
                            <h3>Minhas integrações</h3>
                            <div className="idx-sec-actions">
                                <button type="button" className="idx-text" onClick={() => setPainel("integracoes")}>
                                    editar
                                </button>
                                <Link to="/integracoes/nova" className="dash-add">
                                    + adicionar integração
                                </Link>
                            </div>
                        </div>
                        <div className="dash-integrations">
                            {minhasIntegracoes.map((lojaItem) => (
                                <article key={lojaItem.id} className="dash-int idx-int">
                                    <header>
                                        <span className="idx-logo" style={{ background: lojaItem.cor, color: lojaItem.tinta }}>
                                            {lojaItem.sigla}
                                        </span>
                                        <strong>{lojaItem.nome}</strong>
                                        <button type="button" className="idx-more" aria-label="Mais opções">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </header>
                                    <em>{lojaItem.pedidos} pedidos</em>
                                    <footer>
                                        <Link to="/pedido-ecommerce">ver pedidos</Link>
                                        <span>
                                            <Clock3 size={13} />
                                            {lojaItem.quando}
                                        </span>
                                    </footer>
                                </article>
                            ))}
                        </div>
                    </section>
                ) : null}

                {visiveis.pedidos ? (
                    <section className="dash-sec">
                        <div className="dash-sec-head">
                            <div>
                                <h3>Pedidos nos últimos 7 dias</h3>
                                <p className="idx-sub">Pedidos importados no Sistema ERP</p>
                            </div>
                            <select
                                className="dash-select"
                                value={loja}
                                onChange={(e) => setLoja(e.target.value)}
                                aria-label="Loja"
                            >
                                <option value="integrada">Loja Integrada</option>
                                <option value="nuvem">Nuvemshop</option>
                                <option value="shopee">Shopee</option>
                                <option value="ml">Mercado Livre</option>
                            </select>
                        </div>
                        <div className="dash-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={seriePedidos} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                                    <CartesianGrid stroke="#f3cfe0" vertical={false} />
                                    <XAxis dataKey="dia" stroke="#9aa0a6" tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9aa0a6" tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#fff",
                                            border: "1px solid #f3cfe0",
                                            color: "#3d2a34",
                                            borderRadius: 8
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="pedidos"
                                        stroke="#ff2f92"
                                        strokeWidth={2}
                                        dot={{ r: 4, fill: "#fff", stroke: "#ff2f92" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                ) : null}

                {visiveis.onboarding ? (
                    <section className="idx-guia">
                        <div>
                            <h3>Guia do Nível 2</h3>
                            <p>Siga as etapas para começar a controlar as minhas vendas online no Sistema ERP.</p>
                            <div className="idx-progress">
                                <span>Etapas</span>
                                <div className="idx-bar">
                                    <i style={{ width: "50%" }} />
                                </div>
                                <strong>1 de 2</strong>
                            </div>
                        </div>
                        <ol>
                            <li>
                                <em>01</em>
                                <div>
                                    <p>Complete o cadastro de seus produtos</p>
                                    <Link to="/produtos#list" className="idx-pill">
                                        conferir passos
                                    </Link>
                                </div>
                            </li>
                            <li className="is-done">
                                <em>
                                    <Check size={14} />
                                </em>
                                <p>Finalize as configurações para faturar</p>
                            </li>
                        </ol>
                    </section>
                ) : null}

                {visiveis.ajuda ? (
                    <section className="dash-sec">
                        <h3>Precisa de ajuda?</h3>
                        <div className="idx-ajuda">
                            <article>
                                <Headset size={40} strokeWidth={1.4} />
                                <h4>Fale conosco</h4>
                                <p>Tem alguma dúvida? Abra um chamado para o nosso time de suporte.</p>
                                <Link to="/dados_conta">abrir chamado</Link>
                            </article>
                            <article>
                                <PlayCircle size={40} strokeWidth={1.4} />
                                <h4>Video tutoriais</h4>
                                <p>Explore o ERP com vídeos que mostram o passo a passo dos principais recursos.</p>
                                <Link to="/ferramentas_geral">ver tutoriais</Link>
                            </article>
                        </div>
                    </section>
                ) : null}

                {visiveis.novidades ? (
                    <section className="dash-sec">
                        <h3>Novidades</h3>
                        <ul className="idx-news">
                            {NOVIDADES.map((item) => (
                                <li key={item.titulo}>
                                    <strong>{item.titulo}</strong>
                                    <span>{item.quando}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}

                {visiveis.atalhos ? (
                    <section className="idx-atalhos">
                        <div className="dash-sec-head">
                            <h3>Meus atalhos</h3>
                            <button type="button" className="idx-text" onClick={() => setPainel("atalhos")}>
                                editar
                            </button>
                        </div>
                        <ul>
                            {atalhos.map((item) => (
                                <li key={item.rota}>
                                    <Link to={item.rota}>{item.nome}</Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}
            </div>

            {painel ? (
                <aside className="idx-drawer" aria-label="Configurar widgets">
                    <header>
                        <div>
                            <h3>
                                {painel === "atalhos"
                                    ? "Meus atalhos"
                                    : painel === "integracoes"
                                      ? "Minhas integrações"
                                      : "Configurar meus widgets"}
                            </h3>
                            {painel !== "widgets" ? (
                                <button type="button" className="idx-text" onClick={() => setPainel("widgets")}>
                                    voltar para as configurações gerais
                                </button>
                            ) : null}
                        </div>
                        <button type="button" className="idx-text" onClick={() => setPainel(null)}>
                            fechar x
                        </button>
                    </header>

                    {painel === "widgets" ? (
                        <ul className="idx-widget-list">
                            {WIDGETS.map((item) => (
                                <li key={item.id}>
                                    <GripVertical size={16} />
                                    <div>
                                        <strong>{item.nome}</strong>
                                        <span>{item.desc}</span>
                                        {item.editar ? (
                                            <button type="button" className="idx-text" onClick={() => setPainel(item.id === "integracoes" ? "integracoes" : "atalhos")}>
                                                editar
                                            </button>
                                        ) : null}
                                    </div>
                                    <label className="idx-switch">
                                        <input
                                            type="checkbox"
                                            checked={!!visiveis[item.id]}
                                            onChange={() => alternarWidget(item.id)}
                                        />
                                        <i />
                                    </label>
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    {painel === "integracoes" ? (
                        <ul className="idx-widget-list">
                            {minhasIntegracoes.map((lojaItem) => (
                                <li key={lojaItem.id}>
                                    <GripVertical size={16} />
                                    <span className="idx-logo" style={{ background: lojaItem.cor, color: lojaItem.tinta }}>
                                        {lojaItem.sigla}
                                    </span>
                                    <div>
                                        <strong>{lojaItem.nome}</strong>
                                        <span>Resumo de pedidos do e-commerce</span>
                                    </div>
                                    <label className="idx-switch">
                                        <input type="checkbox" checked={lojaItem.ativa} readOnly />
                                        <i />
                                    </label>
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    {painel === "atalhos" ? (
                        <div className="idx-atalho-edit">
                            <label>
                                Nome do grupo
                                <input defaultValue="Atalhos" />
                            </label>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Módulo</th>
                                        <th>Descrição</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {atalhos.map((item) => (
                                        <tr key={item.rota}>
                                            <td>{item.nome}</td>
                                            <td>{item.nome}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="idx-text"
                                                    onClick={() => removerAtalho(item.rota)}
                                                >
                                                    remover
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="idx-drawer-actions">
                                <button type="button" className="idx-pill" onClick={() => setPainel(null)}>
                                    salvar
                                </button>
                                <button type="button" className="idx-text" onClick={() => setPainel(null)}>
                                    cancelar
                                </button>
                            </div>
                        </div>
                    ) : null}
                </aside>
            ) : null}
        </div>
    );
}
