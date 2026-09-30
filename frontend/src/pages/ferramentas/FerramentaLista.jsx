import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Search } from "lucide-react";

import { LISTAS } from "../../constants/ferramentas";
import GatoPlug from "./GatoPlug";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/integracoes.css";
import "../../styles/pages/ferramentas.css";

function ler(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
        return [];
    }
}

export default function FerramentaLista() {
    const { pagina } = useParams();
    const navigate = useNavigate();
    const cfg = LISTAS[pagina];
    const [itens, setItens] = useState(() => (cfg ? ler(cfg.key) : []));
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState("aberto");
    const [painel, setPainel] = useState(false);
    const [nome, setNome] = useState("");

    useEffect(() => {
        if (cfg) {
            setItens(ler(cfg.key));
            setBusca("");
            setPainel(false);
        }
    }, [pagina, cfg]);

    const visiveis = useMemo(() => {
        const texto = busca.trim().toLowerCase();
        return itens.filter((item) => {
            if (filtro === "aberto" && item.status && item.status !== "aberto") {
                return false;
            }
            return !texto || item.nome.toLowerCase().includes(texto);
        });
    }, [itens, busca, filtro]);

    if (!cfg) {
        return <Navigate to="/ferramentas_geral" replace />;
    }

    function gravar(lista) {
        setItens(lista);
        localStorage.setItem(cfg.key, JSON.stringify(lista));
    }

    function incluir() {
        if (!nome.trim()) {
            return;
        }
        gravar([{ id: String(Date.now()), nome: nome.trim(), status: "aberto", quando: new Date().toISOString() }, ...itens]);
        setNome("");
        setPainel(false);
    }

    const filtros = cfg.filtros || ["Em aberto", "por período"];

    return (
        <div className={`fer-page${painel ? " has-drawer" : ""}`}>
            <div className="fer-main">
                <nav className="dash-crumb" aria-label="Trilha">
                    <button type="button" className="int-voltar" onClick={() => navigate("/ferramentas_geral")}>
                        <ChevronLeft size={16} />
                        voltar
                    </button>
                    <Link to="/index">início</Link>
                    <span>›</span>
                    <Link to="/ferramentas_geral">ferramentas</Link>
                    <span>›</span>
                    <span>{cfg.crumb}</span>
                </nav>
                <div className="fer-head">
                    <h2>{cfg.titulo}</h2>
                    <div>
                        {cfg.extra ? <button type="button" className="idx-text">{cfg.extra}</button> : null}
                        <button type="button" className="idx-pill int-add" onClick={() => setPainel(true)}>
                            {cfg.incluir}
                        </button>
                    </div>
                </div>
                <div className="fer-filtros">
                    <label className="fer-search">
                        <Search size={15} />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder={cfg.busca || "Pesquisa"}
                        />
                    </label>
                    {filtros.map((item, i) => (
                        <button
                            key={item}
                            type="button"
                            className={`fer-chip${filtro === (i === 0 ? "aberto" : item) ? " is-active" : ""}`}
                            onClick={() => setFiltro(i === 0 ? "aberto" : item)}
                        >
                            {item}
                        </button>
                    ))}
                    <button type="button" className="idx-text" onClick={() => { setBusca(""); setFiltro("aberto"); }}>
                        Limpar filtros
                    </button>
                </div>

                {visiveis.length ? (
                    <table className="fer-table">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Data</th>
                                <th>Situação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visiveis.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.nome}</td>
                                    <td>{new Date(item.quando).toLocaleString("pt-BR")}</td>
                                    <td>{item.status === "aberto" ? "Em aberto" : item.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="fer-empty">
                        <div>
                            <p>{cfg.empty}</p>
                            <button type="button" className="idx-pill int-add" onClick={() => setPainel(true)}>
                                {cfg.incluir}
                            </button>
                        </div>
                        <GatoPlug />
                    </div>
                )}
                <p className="fer-ajuda">
                    Ficou com alguma dúvida? <a href="#ajuda">Acesse a ajuda do ERP.</a>
                </p>
            </div>
            {painel ? (
                <aside className="int-drawer" aria-label={cfg.incluir}>
                    <header>
                        <h3>{cfg.incluir}</h3>
                        <button type="button" className="idx-text" onClick={() => setPainel(false)}>fechar x</button>
                    </header>
                    <div className="fer-drawer">
                        <label>
                            Descrição
                            <input value={nome} onChange={(e) => setNome(e.target.value)} />
                        </label>
                    </div>
                    <div className="idx-drawer-actions">
                        <button type="button" className="idx-pill" onClick={incluir}>salvar</button>
                    </div>
                </aside>
            ) : null}
        </div>
    );
}
