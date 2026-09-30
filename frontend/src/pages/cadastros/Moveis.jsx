import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Ban,
    Box,
    CheckCircle2,
    ChevronDown,
    Filter,
    LayoutGrid,
    MapPin,
    Plus,
    Ruler,
    Search,
    Wrench,
    X
} from "lucide-react";

import {
    LOJAS_MOVEL,
    SETORES_LOJA,
    STATUS_MOVEL,
    TIPOS_MOVEL,
    lerMoveis,
    rotuloStatusMovel
} from "../../constants/moveis";
import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/maquinas.css";
import "../../styles/pages/moveis.css";

const CARDS = [
    { id: "todos", label: "Total de Móveis", icon: Box, tom: "azul" },
    { id: "uso", label: "Em Uso", icon: CheckCircle2, tom: "verde" },
    { id: "montagem", label: "Em Montagem", icon: Wrench, tom: "amarelo" },
    { id: "inativo", label: "Inativos", icon: Ban, tom: "vermelho" }
];

function textoDe(m) {
    return [m.nome, m.detalhe, m.descricao, m.tipo, m.setor, m.loja].join(" ").toLowerCase();
}

function dimensoes(m) {
    return `L ${m.largura || 0} cm  A ${m.altura || 0} cm  P ${m.profundidade || 0} cm`;
}

export default function Moveis() {
    const raiz = useRef(null);
    const navigate = useNavigate();
    const [lista] = useState(lerMoveis);
    const [busca, setBusca] = useState("");
    const [card, setCard] = useState("todos");
    const [tipo, setTipo] = useState("");
    const [setor, setSetor] = useState("");
    const [status, setStatus] = useState("");
    const [loja, setLoja] = useState(LOJAS_MOVEL[0]);
    const [aberto, setAberto] = useState(null);
    const [layout, setLayout] = useState(false);

    const visiveis = useMemo(() => {
        const termo = busca.toLowerCase().trim();
        return lista.filter((m) => {
            if (loja && m.loja !== loja) {
                return false;
            }
            if (card !== "todos" && m.status !== card) {
                return false;
            }
            if (tipo && m.tipo !== tipo) {
                return false;
            }
            if (setor && m.setor !== setor) {
                return false;
            }
            if (status && m.status !== status) {
                return false;
            }
            if (termo && !textoDe(m).includes(termo)) {
                return false;
            }
            return true;
        });
    }, [lista, busca, card, tipo, setor, status, loja]);

    const daLoja = useMemo(() => lista.filter((m) => !loja || m.loja === loja), [lista, loja]);
    const contagens = useMemo(() => ({
        todos: daLoja.length,
        uso: daLoja.filter((m) => m.status === "uso").length,
        montagem: daLoja.filter((m) => m.status === "montagem").length,
        inativo: daLoja.filter((m) => m.status === "inativo").length
    }), [daLoja]);

    const temFiltro = busca || card !== "todos" || tipo || setor || status;

    function limparFiltros() {
        setBusca("");
        setCard("todos");
        setTipo("");
        setSetor("");
        setStatus("");
    }

    return (
        <div className="prd-page mv-page" ref={raiz}>
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <span>Cadastros</span>
                <span>›</span>
                <span>Móveis</span>
            </nav>

            <div className="mv-head">
                <div>
                    <h2>Móveis da Loja</h2>
                    <p>Gerencie os móveis, prateleiras e estruturas da sua loja.</p>
                </div>
                <div className="mv-head-acoes">
                    <button type="button" className="prd-btn" onClick={() => setLayout(true)}>
                        <LayoutGrid size={15} />
                        Visualizar layout
                    </button>
                    <button type="button" className="prd-btn" onClick={() => navigate(`${ROTAS.MOVEIS}/1?aba=prateleiras`)}>
                        <Ruler size={15} />
                        Editar layout
                    </button>
                    <button type="button" className="prd-btn prd-btn-primary" onClick={() => navigate(`${ROTAS.MOVEIS}/novo`)}>
                        <Plus size={16} />
                        Novo móvel
                    </button>
                    <select className="mv-loja" value={loja} onChange={(e) => setLoja(e.target.value)} aria-label="Loja">
                        {LOJAS_MOVEL.map((l) => (
                            <option key={l} value={l}>{l.replace("Loja ", "")}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mq-cards">
                {CARDS.map((c) => {
                    const Icone = c.icon;
                    return (
                        <button
                            key={c.id}
                            type="button"
                            className={`mq-card is-${c.tom}${card === c.id ? " is-active" : ""}`}
                            onClick={() => setCard(c.id)}
                        >
                            <span className="mq-card-ico" aria-hidden>
                                <Icone size={18} />
                            </span>
                            <span>
                                {c.label}
                                <strong>{contagens[c.id]}</strong>
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="fer-filtros prd-filtros">
                <label className="fer-search">
                    <Search size={15} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Pesquisar por nome, tipo ou descrição..."
                    />
                    <button type="button" className="prd-limpar" onClick={() => setBusca("")} aria-label="Limpar busca">
                        <X size={14} />
                    </button>
                </label>

                <div className="ctt-drop">
                    <button type="button" className={`fer-chip${tipo ? " is-active" : ""}`} onClick={() => setAberto(aberto === "tipo" ? null : "tipo")}>
                        {tipo || "Tipo de móvel"}
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "tipo" ? (
                        <div className="ctt-menu">
                            <button type="button" className={!tipo ? "is-sel" : ""} onClick={() => { setTipo(""); setAberto(null); }}>
                                Todos os tipos
                            </button>
                            {TIPOS_MOVEL.map((t) => (
                                <button key={t} type="button" className={tipo === t ? "is-sel" : ""} onClick={() => { setTipo(t); setAberto(null); }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="ctt-drop">
                    <button type="button" className={`fer-chip${setor ? " is-active" : ""}`} onClick={() => setAberto(aberto === "setor" ? null : "setor")}>
                        {setor || "Setor da loja"}
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "setor" ? (
                        <div className="ctt-menu">
                            <button type="button" className={!setor ? "is-sel" : ""} onClick={() => { setSetor(""); setAberto(null); }}>
                                Todos os setores
                            </button>
                            {SETORES_LOJA.map((s) => (
                                <button key={s} type="button" className={setor === s ? "is-sel" : ""} onClick={() => { setSetor(s); setAberto(null); }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="ctt-drop">
                    <button type="button" className={`fer-chip${status ? " is-active" : ""}`} onClick={() => setAberto(aberto === "status" ? null : "status")}>
                        {status ? rotuloStatusMovel(status) : "Status"}
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "status" ? (
                        <div className="ctt-menu">
                            <button type="button" className={!status ? "is-sel" : ""} onClick={() => { setStatus(""); setAberto(null); }}>
                                Todos
                            </button>
                            {STATUS_MOVEL.map((s) => (
                                <button key={s.id} type="button" className={status === s.id ? "is-sel" : ""} onClick={() => { setStatus(s.id); setAberto(null); }}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <button type="button" className="fer-chip" onClick={() => setAberto(aberto === "filtros" ? null : "filtros")}>
                    <Filter size={14} />
                    Filtros
                </button>

                <button type="button" className="idx-text" onClick={limparFiltros} disabled={!temFiltro}>
                    Limpar filtros
                </button>
            </div>

            <div className="mv-grid">
                {visiveis.map((m) => (
                    <article key={m.id} className="mv-card">
                        <Link
                            to={`${ROTAS.MOVEIS}/${m.id}`}
                            className="mv-card-foto"
                            style={{ backgroundImage: `url(${m.foto || m.galeria?.[0] || ""})` }}
                            aria-label={m.nome}
                        />
                        <div className="mv-card-body">
                            <h3>{m.nome}</h3>
                            <small>{m.detalhe || m.tipo}</small>
                            <div className="mv-card-meta">
                                <span>{m.tipo}</span>
                                <span><Ruler size={12} /> {dimensoes(m)}</span>
                                <span><MapPin size={12} /> {m.loja}</span>
                            </div>
                            <span className={`mv-st is-${m.status}`}>
                                <i />
                                {rotuloStatusMovel(m.status)}
                            </span>
                        </div>
                        <div className="mv-card-acoes">
                            <Link to={`${ROTAS.MOVEIS}/${m.id}`}>Editar</Link>
                            <Link to={`${ROTAS.MOVEIS}/${m.id}`}>Ver detalhes</Link>
                        </div>
                    </article>
                ))}
                <button type="button" className="mv-cta" onClick={() => navigate(`${ROTAS.MOVEIS}/novo`)}>
                    <h3>Adicionar novo móvel</h3>
                    <p>Cadastre prateleiras, nichos, balcões e outros móveis da sua loja.</p>
                    <span className="prd-btn prd-btn-primary">
                        <Plus size={16} />
                        Novo móvel
                    </span>
                </button>
            </div>

            {layout ? (
                <div className="mv-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setLayout(false); }}>
                    <div className="mv-overlay-box">
                        <h3>Layout da loja — {loja}</h3>
                        <div className="mv-planta">
                            {daLoja.map((m) => (
                                <button key={m.id} type="button" onClick={() => navigate(`${ROTAS.MOVEIS}/${m.id}`)}>
                                    {m.nome}
                                    <small>{m.detalhe} · {m.setor}</small>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
