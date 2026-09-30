import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search } from "lucide-react";

import { acharItemMenu } from "../../constants/menu";
import { configLista } from "../../constants/listasModulo";
import ROTAS from "../../constants/rotas";
import GatoPlug from "../ferramentas/GatoPlug";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/integracoes.css";

function ler(key, seed) {
    try {
        const bruto = localStorage.getItem(key);
        if (bruto) {
            const lista = JSON.parse(bruto);
            if (Array.isArray(lista)) {
                return lista;
            }
        }
    } catch {
        /* ignore */
    }
    return seed.map((item) => ({ ...item }));
}

export default function Modulo() {
    const { pathname } = useLocation();
    const achado = acharItemMenu(pathname);
    const titulo = achado?.item?.nome || "Módulo";
    const grupoNome = achado?.grupo?.titulo || "ERP";
    const grupoItens = achado?.irmaos || [];

    const cfg = configLista(pathname, titulo);
    const [itens, setItens] = useState(() => ler(cfg.key, cfg.seed));
    const [busca, setBusca] = useState("");
    const [nome, setNome] = useState("");
    const [painel, setPainel] = useState(false);

    useEffect(() => {
        const atual = configLista(pathname, titulo);
        setItens(ler(atual.key, atual.seed));
        setBusca("");
        setNome("");
        setPainel(false);
    }, [pathname, titulo]);

    const visiveis = useMemo(() => {
        const texto = busca.trim().toLowerCase();
        return itens.filter((item) => {
            if (!texto) {
                return true;
            }
            return [item.nome, item.codigo, item.status].join(" ").toLowerCase().includes(texto);
        });
    }, [itens, busca]);

    function gravar(lista) {
        const atual = configLista(pathname, titulo);
        setItens(lista);
        localStorage.setItem(atual.key, JSON.stringify(lista));
    }

    function incluir() {
        if (!nome.trim()) {
            return;
        }
        const id = Date.now();
        gravar([{
            id,
            codigo: String(id).slice(-4),
            nome: nome.trim(),
            status: "Ativo",
            quando: new Date().toISOString()
        }, ...itens]);
        setNome("");
        setPainel(false);
    }

    return (
        <div className={`fer-page${painel ? " has-drawer" : ""}`}>
            <div className="fer-main">
                <nav className="dash-crumb" aria-label="Trilha">
                    <Link to={ROTAS.INDICE}>início</Link>
                    <span>›</span>
                    <span>{grupoNome.toLowerCase()}</span>
                    <span>›</span>
                    <span>{titulo.toLowerCase()}</span>
                </nav>
                <div className="fer-head">
                    <h2>{titulo}</h2>
                    <button type="button" className="idx-pill int-add" onClick={() => setPainel(true)}>
                        {cfg.incluir}
                    </button>
                </div>
                <div className="fer-filtros">
                    <label className="fer-search">
                        <Search size={15} />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Pesquisar"
                        />
                    </label>
                </div>
                {visiveis.length ? (
                    <table className="fer-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descrição</th>
                                <th>Situação</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visiveis.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.codigo || item.id}</td>
                                    <td>{item.nome}</td>
                                    <td>{item.status || "—"}</td>
                                    <td>{item.quando ? new Date(item.quando).toLocaleDateString("pt-BR") : "—"}</td>
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
                {grupoItens.length ? (
                    <div className="mod-relacionados">
                        <h3>No mesmo módulo</h3>
                        <ul>
                            {grupoItens.slice(0, 8).map((item) => (
                                <li key={item.rota}>
                                    <Link to={item.rota}>{item.nome}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
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
                            <input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
                        </label>
                    </div>
                    <div className="idx-drawer-actions">
                        <button type="button" className="idx-pill" onClick={incluir}>salvar</button>
                        <button type="button" className="idx-text" onClick={() => setPainel(false)}>cancelar</button>
                    </div>
                </aside>
            ) : null}
        </div>
    );
}
