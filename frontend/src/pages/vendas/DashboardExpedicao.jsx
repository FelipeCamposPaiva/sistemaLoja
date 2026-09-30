import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Maximize2, RefreshCw, Settings2 } from "lucide-react";

import ROTAS from "../../constants/rotas";
import { dashboardExpedicao } from "../../services/dashboard.service";
import { marcarFlagsPedido } from "../../services/pedidoVenda.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/estoque.css";
import "../../styles/pages/dash-expedicao.css";

const PREFS_KEY = "erp-dash-expedicao";
const COLUNAS = [
    { id: "SEPARAR", titulo: "Separar", cor: "#f59e0b" },
    { id: "SEPARANDO", titulo: "Parciais / separando", cor: "#3b82f6" },
    { id: "EMBALAR", titulo: "Embalar", cor: "#a855f7" },
    { id: "AGUARDANDO_COLETA", titulo: "Aguardando coleta", cor: "#f97316" },
    { id: "EM_TRANSPORTE", titulo: "Em transporte", cor: "#64748b" }
];

const PREFS_PADRAO = {
    kpis: true,
    kanban: true,
    transportadoras: true,
    coletas: true,
    refresh: 30,
    origem: "",
    envio: ""
};

function lerPrefs() {
    try {
        return { ...PREFS_PADRAO, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
    } catch {
        return { ...PREFS_PADRAO };
    }
}

function mensagemErro(error, padrao) {
    return error?.response?.data?.mensagem || padrao;
}

export default function DashboardExpedicao() {
    const [dados, setDados] = useState(null);
    const [aviso, setAviso] = useState("");
    const [prefs, setPrefs] = useState(lerPrefs);
    const [painel, setPainel] = useState(false);
    const [kiosk, setKiosk] = useState(false);
    const [agora, setAgora] = useState(() => new Date());

    async function carregar(silencioso) {
        if (!silencioso) {
            setAviso("");
        }
        try {
            const painelDados = await dashboardExpedicao();
            setDados(painelDados);
            setAgora(new Date());
        } catch (error) {
            setAviso(mensagemErro(error, "Não foi possível carregar o dashboard de expedição."));
        }
    }

    useEffect(() => {
        carregar(false);
    }, []);

    useEffect(() => {
        const ms = Math.max(10, Number(prefs.refresh) || 30) * 1000;
        const id = setInterval(() => carregar(true), ms);
        return () => clearInterval(id);
    }, [prefs.refresh]);

    function gravar(proximo) {
        setPrefs(proximo);
        localStorage.setItem(PREFS_KEY, JSON.stringify(proximo));
    }

    const origens = useMemo(() => {
        const set = new Set((dados?.pedidos || []).map((p) => p.origem).filter(Boolean));
        return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [dados]);

    const envios = useMemo(() => {
        const set = new Set((dados?.pedidos || []).map((p) => p.formaEnvio).filter(Boolean));
        return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [dados]);

    const pedidos = useMemo(() => {
        return (dados?.pedidos || []).filter((p) => {
            if (prefs.origem && p.origem !== prefs.origem) {
                return false;
            }
            if (prefs.envio && p.formaEnvio !== prefs.envio) {
                return false;
            }
            return true;
        });
    }, [dados, prefs.origem, prefs.envio]);

    const kpis = useMemo(() => {
        const base = { separar: 0, separando: 0, parciais: 0, embalar: 0, aguardandoColeta: 0, emTransporte: 0 };
        for (const p of pedidos) {
            if (p.etapa === "SEPARAR") {
                base.separar++;
            }
            if (p.etapa === "SEPARANDO") {
                base.separando++;
            }
            if (p.parcial) {
                base.parciais++;
            }
            if (p.etapa === "EMBALAR") {
                base.embalar++;
            }
            if (p.etapa === "AGUARDANDO_COLETA") {
                base.aguardandoColeta++;
            }
            if (p.etapa === "EM_TRANSPORTE") {
                base.emTransporte++;
            }
        }
        return base;
    }, [pedidos]);

    async function marcarColeta(id) {
        try {
            await marcarFlagsPedido(id, { expedicao: "DESPACHADO" });
            await carregar(true);
        } catch (error) {
            setAviso(mensagemErro(error, "Não foi possível marcar a coleta."));
        }
    }

    async function telaCheia() {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setKiosk(true);
            } else {
                await document.exitFullscreen();
                setKiosk(false);
            }
        } catch {
            setKiosk((atual) => !atual);
        }
    }

    const grupos = (dados?.transportadoras || []).filter((g) => !prefs.envio || g.nome === prefs.envio);

    return (
        <div className={`dash-home dash-exp${kiosk ? " is-kiosk" : ""}`}>
            <header className="dash-vendas-head">
                <div>
                    <p className="dash-crumb">
                        <Link to={ROTAS.INDICE}>início</Link>
                        {" › "}
                        <span>vendas</span>
                        {" › "}
                        <span>dashboard de expedição</span>
                    </p>
                    <h3>Dashboard de expedição</h3>
                    <p className="prd-sub">Atualizado {agora.toLocaleTimeString("pt-BR")} · a cada {prefs.refresh}s</p>
                </div>
                <div className="dash-pills">
                    <select value={prefs.envio} onChange={(e) => gravar({ ...prefs, envio: e.target.value })}>
                        <option value="">todas as transportadoras</option>
                        {envios.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                    </select>
                    <select value={prefs.origem} onChange={(e) => gravar({ ...prefs, origem: e.target.value })}>
                        <option value="">todas as origens</option>
                        {origens.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                    </select>
                    <button type="button" className="idx-pill" onClick={() => carregar(false)}>
                        <RefreshCw size={14} /> atualizar
                    </button>
                    <button type="button" className="idx-pill" onClick={() => setPainel((v) => !v)}>
                        <Settings2 size={14} /> personalizar
                    </button>
                    <button type="button" className="idx-pill" onClick={telaCheia}>
                        <Maximize2 size={14} /> {kiosk ? "sair do monitor" : "modo monitor"}
                    </button>
                    <Link className="idx-pill" to={ROTAS.EXPEDICAO}>expedição</Link>
                    <Link className="idx-pill" to={ROTAS.SEPARACAO}>separação</Link>
                </div>
            </header>

            {aviso ? <p className="int-aviso">{aviso}</p> : null}

            {painel ? (
                <aside className="dash-exp-prefs">
                    <label><input type="checkbox" checked={prefs.kpis} onChange={(e) => gravar({ ...prefs, kpis: e.target.checked })} /> indicadores</label>
                    <label><input type="checkbox" checked={prefs.kanban} onChange={(e) => gravar({ ...prefs, kanban: e.target.checked })} /> colunas do andamento</label>
                    <label><input type="checkbox" checked={prefs.transportadoras} onChange={(e) => gravar({ ...prefs, transportadoras: e.target.checked })} /> por transportadora</label>
                    <label><input type="checkbox" checked={prefs.coletas} onChange={(e) => gravar({ ...prefs, coletas: e.target.checked })} /> coletas pendentes</label>
                    <label>
                        atualizar (s)
                        <input
                            type="number"
                            min="10"
                            value={prefs.refresh}
                            onChange={(e) => gravar({ ...prefs, refresh: Number(e.target.value) || 30 })}
                        />
                    </label>
                </aside>
            ) : null}

            {prefs.kpis ? (
                <div className="dash-kpis dash-kpis-4 dash-exp-kpis">
                    <article className="dash-kpi"><small>Separar</small><strong>{kpis.separar}</strong><em>aguardando separação</em></article>
                    <article className="dash-kpi"><small>Parciais</small><strong>{kpis.parciais}</strong><em>{kpis.separando} em andamento</em></article>
                    <article className="dash-kpi"><small>Embalar / enviar</small><strong>{kpis.embalar}</strong><em>já separados</em></article>
                    <article className="dash-kpi"><small>Aguardando coleta</small><strong>{kpis.aguardandoColeta}</strong><em>prontos para a transportadora</em></article>
                    <article className="dash-kpi"><small>Em transporte</small><strong>{kpis.emTransporte}</strong><em>já despachados</em></article>
                    <article className="dash-kpi"><small>Entregues hoje</small><strong>{dados?.entreguesHoje || 0}</strong><em>concluídos no dia</em></article>
                </div>
            ) : null}

            {prefs.transportadoras ? (
                <div className="dash-grid-4">
                    {grupos.length ? grupos.map((g) => (
                        <article className="dash-box" key={g.nome}>
                            <h4>{g.nome}</h4>
                            <ul>
                                <li><span>Aguardando retirada</span><strong>{g.aguardandoColeta}</strong></li>
                                <li><span>Em transporte</span><strong>{g.emTransporte}</strong></li>
                                <li><span>Ainda na casa</span><strong>{g.separar}</strong></li>
                            </ul>
                        </article>
                    )) : (
                        <article className="dash-box"><h4>Transportadoras</h4><p className="prd-sub">Nenhum pedido em andamento.</p></article>
                    )}
                </div>
            ) : null}

            {prefs.kanban ? (
                <div className="dash-exp-kanban">
                    {COLUNAS.map((col) => {
                        const cards = pedidos.filter((p) => p.etapa === col.id);
                        return (
                            <section key={col.id} className="dash-box dash-exp-col">
                                <h4>
                                    <i style={{ background: col.cor }} />
                                    {col.titulo}
                                    <b>{cards.length}</b>
                                </h4>
                                <ul>
                                    {cards.map((p) => (
                                        <li key={p.id}>
                                            <Link to={`/separacao/${p.id}`}>
                                                <strong>{p.numero}</strong>
                                                <span>{p.cliente}</span>
                                            </Link>
                                            <em>{p.formaEnvio}{p.parcial ? ` · ${p.pctSeparacao}% separado` : ""}</em>
                                            {col.id === "AGUARDANDO_COLETA" ? (
                                                <button type="button" className="idx-text" onClick={() => marcarColeta(p.id)}>
                                                    marcar coletado
                                                </button>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        );
                    })}
                </div>
            ) : null}

            {prefs.coletas ? (
                <section className="dash-box dash-sup-bloco">
                    <h4>Coletas por transportadora</h4>
                    <div className="dash-sup-table-wrap">
                        <table className="fer-table">
                            <thead>
                                <tr>
                                    <th>Pedido</th>
                                    <th>Cliente</th>
                                    <th>Transportadora</th>
                                    <th>Rastreio</th>
                                    <th>Etapa</th>
                                    <th>Limite despacho</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {pedidos.filter((p) => p.etapa === "AGUARDANDO_COLETA" || p.etapa === "EM_TRANSPORTE").map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.numero}</td>
                                        <td>{p.cliente}</td>
                                        <td>{p.formaEnvio}</td>
                                        <td>{p.rastreio || "—"}</td>
                                        <td>{p.etapa === "EM_TRANSPORTE" ? "Em transporte" : "Aguardando coleta"}</td>
                                        <td>{p.dataLimiteDespacho || "—"}</td>
                                        <td>
                                            {p.etapa === "AGUARDANDO_COLETA" ? (
                                                <button type="button" className="prd-btn" onClick={() => marcarColeta(p.id)}>coletado</button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}
        </div>
    );
}
