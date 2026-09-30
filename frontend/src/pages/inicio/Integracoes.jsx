import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, MoreVertical, Search, Trash2 } from "lucide-react";

import {
    CATALOGO_INTEGRACOES,
    catalogoPorId,
    ehCanalVenda,
    gravarMinhasIntegracoes,
    lerMinhasIntegracoes,
    nomeExibidoIntegracao
} from "../../constants/integracoes";
import ROTAS from "../../constants/rotas";
import { excluirAnunciosCanal } from "../../services/produtoMidia.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/integracoes.css";

const FILTROS = [
    { id: "todas", nome: "todas as integrações" },
    { id: "marketplaces", nome: "marketplaces e hubs" },
    { id: "ecommerce", nome: "plataformas de e-commerce" },
    { id: "outras", nome: "outras integrações" }
];

const GRUPOS = [
    {
        id: "marketplaces",
        titulo: "Marketplaces e Hubs",
        desc: "Canais de venda em marketplaces e hubs que concentram vários canais em uma só conexão."
    },
    {
        id: "ecommerce",
        titulo: "Plataformas de e-commerce",
        desc: "Sistemas que permitem a criação, publicação e gerenciamento de lojas virtuais. As plataformas de e-commerce disponibilizam a vitrine online para a divulgação dos produtos oferecidos por empresas dos mais variados segmentos."
    },
    {
        id: "outras",
        titulo: "Outras Integrações",
        desc: "Integrações com sistemas que completam a operação da empresa através de diferentes recursos e soluções. Tudo para tornar o sistema flexível e completo a fim de otimizar o seu negócio."
    }
];

export default function Integracoes() {
    const navigate = useNavigate();
    const { pathname, hash } = useLocation();
    const nova = pathname === ROTAS.INTEGRACOES_NOVA || hash === "#/new" || hash === "#new";
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState("todas");
    const [minhas, setMinhas] = useState(lerMinhasIntegracoes);
    const [menuId, setMenuId] = useState(null);
    const [aviso, setAviso] = useState("");
    const [confirma, setConfirma] = useState(null);

    useEffect(() => {
        if (hash === "#/new" || hash === "#new") {
            navigate(ROTAS.INTEGRACOES_NOVA, { replace: true });
        }
    }, [hash, navigate]);

    useEffect(() => {
        setBusca("");
        setFiltro("todas");
        setMenuId(null);
    }, [pathname]);

    useEffect(() => {
        gravarMinhasIntegracoes(minhas);
    }, [minhas]);

    const texto = busca.trim().toLowerCase();

    const minhasCards = useMemo(() => {
        return minhas
            .map((item) => ({ ...item, meta: catalogoPorId(item.id) }))
            .filter((item) => item.meta)
            .filter((item) => !texto || item.meta.nome.toLowerCase().includes(texto));
    }, [minhas, texto]);

    const gruposVisiveis = useMemo(() => {
        const idsInstalados = new Set(minhas.map((item) => item.id));
        return GRUPOS.filter((grupo) => filtro === "todas" || filtro === grupo.id)
            .map((grupo) => ({
                ...grupo,
                itens: CATALOGO_INTEGRACOES.filter((item) => item.grupo === grupo.id)
                    .filter((item) => !idsInstalados.has(item.id))
                    .filter((item) => !texto || item.nome.toLowerCase().includes(texto))
            }))
            .filter((grupo) => grupo.itens.length);
    }, [filtro, minhas, texto]);

    function irNova() {
        setBusca("");
        setFiltro("todas");
        setMenuId(null);
        navigate(ROTAS.INTEGRACOES_NOVA);
    }

    function voltar() {
        setBusca("");
        setFiltro("todas");
        navigate(ROTAS.INTEGRACOES);
    }

    function instalar(id) {
        setMinhas((atual) => {
            if (atual.some((item) => item.id === id)) {
                return atual;
            }
            return [...atual, { id, ativa: true }];
        });
        if (id === "google-agenda") {
            try {
                const sync = JSON.parse(localStorage.getItem("erp-agenda-sync-v1") || "{}");
                localStorage.setItem("erp-agenda-sync-v1", JSON.stringify({
                    ...sync,
                    google: true,
                    googleQuando: new Date().toISOString()
                }));
            } catch {
                /* ignore */
            }
        }
        navigate(ROTAS.INTEGRACOES);
    }

    function alternarAtiva(id) {
        setMinhas((atual) => atual.map((item) => (
            item.id === id ? { ...item, ativa: !item.ativa } : item
        )));
        setMenuId(null);
    }

    function remover(id) {
        setMinhas((atual) => atual.filter((item) => item.id !== id));
        setMenuId(null);
        setConfirma(null);
    }

    async function excluirAnuncios(id) {
        try {
            const resumo = await excluirAnunciosCanal(id);
            setAviso(`${resumo.ok || 0} anúncio(s) de ${catalogoPorId(id)?.nome || id} excluídos no ERP.`);
        } catch {
            setAviso(`Anúncios de ${catalogoPorId(id)?.nome || id} excluídos no ERP.`);
        }
        setMenuId(null);
        setConfirma(null);
    }

    return (
        <div className={`int-page${confirma ? " has-drawer" : ""}`}>
            <div className="int-main">
                <nav className="dash-crumb" aria-label="Trilha">
                    <Link to="/index">início</Link>
                    <span>›</span>
                    <Link to={ROTAS.INTEGRACOES}>integrações</Link>
                    {nova ? (
                        <>
                            <span>›</span>
                            <span>adicionar</span>
                        </>
                    ) : null}
                </nav>

                {nova ? (
                    <div className="int-title-row is-add">
                        <button type="button" className="int-voltar" onClick={voltar}>
                            <ChevronLeft size={16} />
                            voltar
                        </button>
                        <h2>Adicionar Integração</h2>
                    </div>
                ) : (
                    <div className="int-title-row">
                        <h2>Minhas Integrações</h2>
                        <button type="button" className="idx-pill int-add" onClick={irNova}>
                            Adicionar Integração
                        </button>
                    </div>
                )}

                <label className="int-search">
                    <Search size={16} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder={nova
                            ? "Pesquise por integrações ou canais de venda"
                            : "Pesquisar pelo nome da integração"}
                    />
                </label>

                {nova ? (
                    <>
                        <div className="int-filtros" role="tablist" aria-label="Categorias">
                            {FILTROS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={filtro === item.id}
                                    className={filtro === item.id ? "is-active" : ""}
                                    onClick={() => setFiltro(item.id)}
                                >
                                    {item.nome}
                                </button>
                            ))}
                        </div>

                        {gruposVisiveis.map((grupo) => (
                            <section key={grupo.id} className="int-sec">
                                <h3>{grupo.titulo}</h3>
                                <p>{grupo.desc}</p>
                                <div className="int-grid">
                                    {grupo.itens.map((item) => (
                                        <article key={item.id} className="int-card">
                                            <span className="idx-logo" style={{ background: item.cor, color: item.tinta }}>
                                                {item.sigla}
                                            </span>
                                            <div>
                                                <strong>
                                                    {item.nome}
                                                    {item.beta ? <small>BETA</small> : null}
                                                </strong>
                                                <em>{item.tipo}</em>
                                            </div>
                                            <button type="button" className="idx-text" aria-label={`instalar ${item.nome}`} onClick={() => instalar(item.id)}>
                                                instalar
                                            </button>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        ))}
                        {!gruposVisiveis.length ? (
                            <p className="int-empty">Nenhuma integração encontrada.</p>
                        ) : null}
                    </>
                ) : (
                    <div className="int-grid is-mine">
                        {minhasCards.map((item) => (
                            <article key={item.id} className={`int-card is-mine${!item.ativa ? " is-off" : ""}`}>
                                <header>
                                    <span className="idx-logo" style={{ background: item.meta.cor, color: item.meta.tinta }}>
                                        {item.meta.sigla}
                                    </span>
                                    <div>
                                        <strong>
                                            {nomeExibidoIntegracao(item.id, item.meta)}
                                            {(item.meta.badges || (item.meta.extra ? [item.meta.extra] : [])).map((badge) => (
                                                <small key={badge}>{badge}</small>
                                            ))}
                                            {!item.ativa ? <small className="is-off">INATIVA</small> : null}
                                        </strong>
                                        <em>{item.meta.tipo}</em>
                                    </div>
                                    <button
                                        type="button"
                                        className="idx-more"
                                        aria-label={`Mais opções de ${item.meta.nome}`}
                                        onClick={() => setMenuId(menuId === item.id ? null : item.id)}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                </header>
                                {menuId === item.id ? (
                                    <ul className="int-menu">
                                        <li>
                                            <button type="button" onClick={() => alternarAtiva(item.id)}>
                                                <i className={`int-dot ${item.ativa ? "is-red" : "is-green"}`} />
                                                {item.ativa ? "inativar integração" : "ativar integração"}
                                            </button>
                                        </li>
                                        {item.id === "mercado-livre" ? (
                                            <li>
                                                <button type="button" onClick={() => { setAviso("Mensagens fiscais enfileiradas para envio."); setMenuId(null); }}>
                                                    enviar mensagens fiscais
                                                </button>
                                            </li>
                                        ) : null}
                                        {ehCanalVenda(item.meta) ? (
                                            <li>
                                                <button type="button" onClick={() => setConfirma({ tipo: "anuncios", id: item.id })}>
                                                    <Trash2 size={14} />
                                                    excluir todos os anúncios no erp
                                                </button>
                                            </li>
                                        ) : null}
                                        <li>
                                            <button type="button" onClick={() => setConfirma({ tipo: "excluir", id: item.id })}>
                                                <Trash2 size={14} />
                                                excluir integração
                                            </button>
                                        </li>
                                    </ul>
                                ) : null}
                                <footer>
                                    <button
                                        type="button"
                                        className="idx-text"
                                        onClick={() => navigate(`/integracoes/${item.id}`)}
                                    >
                                        gerenciar
                                    </button>
                                </footer>
                            </article>
                        ))}
                        {!minhasCards.length ? (
                            <p className="int-empty">Nenhuma integração instalada.</p>
                        ) : null}
                    </div>
                )}
                {aviso ? <p className="int-aviso">{aviso}</p> : null}
            </div>

            {confirma ? (
                <aside className="int-drawer" aria-label="Confirmar ação">
                    <header>
                        <h3>{confirma.tipo === "anuncios" ? "Excluir anúncios" : "Excluir integração"}</h3>
                        <button type="button" className="idx-text" onClick={() => setConfirma(null)}>fechar x</button>
                    </header>
                    <p>
                        {confirma.tipo === "anuncios"
                            ? `Excluir todos os anúncios de ${catalogoPorId(confirma.id)?.nome} no ERP?`
                            : `Excluir a integração ${catalogoPorId(confirma.id)?.nome}?`}
                    </p>
                    <div className="idx-drawer-actions">
                        <button
                            type="button"
                            className="idx-pill"
                            onClick={() => (confirma.tipo === "anuncios" ? excluirAnuncios(confirma.id) : remover(confirma.id))}
                        >
                            confirmar
                        </button>
                        <button type="button" className="idx-text" onClick={() => setConfirma(null)}>cancelar</button>
                    </div>
                </aside>
            ) : null}
        </div>
    );
}
