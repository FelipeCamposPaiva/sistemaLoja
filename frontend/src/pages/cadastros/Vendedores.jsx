import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    MoreVertical,
    PenLine,
    Plus,
    RotateCcw,
    Search,
    Trash2,
    UserRound,
    X
} from "lucide-react";

import ROTAS from "../../constants/rotas";
import {
    corAvatar,
    excluirVendedorCadastro,
    inicialDe,
    listarVendedoresCadastro,
    restaurarVendedorCadastro,
    rotuloStatus,
    salvarVendedorCadastro
} from "../../constants/vendedoresCadastro";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/localizacao.css";
import "../../styles/pages/vendedores.css";

const FORM_VAZIO = {
    nome: "",
    email: "",
    telefone: "",
    cidade: "Volta Redonda",
    uf: "RJ",
    cargo: "Vendedor",
    comissao: 5,
    status: "ativo"
};

function visivelNaAba(vendedor, aba) {
    if (aba === "excluidos") {
        return Boolean(vendedor.excluido) || vendedor.status === "excluido";
    }
    if (vendedor.excluido || vendedor.status === "excluido") {
        return false;
    }
    if (aba === "ativos") {
        return vendedor.status === "ativo";
    }
    if (aba === "inativos") {
        return vendedor.status === "inativo";
    }
    return true;
}

export default function Vendedores() {
    const [lista, setLista] = useState(() => listarVendedoresCadastro());
    const [busca, setBusca] = useState("");
    const [aba, setAba] = useState("todos");
    const [cidade, setCidade] = useState("");
    const [uf, setUf] = useState("");
    const [filtrosAberto, setFiltrosAberto] = useState(false);
    const [ordem, setOrdem] = useState({ campo: "nome", dir: 1 });
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);
    const [marcados, setMarcados] = useState([]);
    const [menuId, setMenuId] = useState("");
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(FORM_VAZIO);
    const [aviso, setAviso] = useState("");

    function recarregar() {
        setLista(listarVendedoresCadastro());
    }

    const totais = useMemo(() => ({
        todos: lista.filter((v) => !v.excluido && v.status !== "excluido").length,
        ativos: lista.filter((v) => !v.excluido && v.status === "ativo").length,
        inativos: lista.filter((v) => !v.excluido && v.status === "inativo").length,
        excluidos: lista.filter((v) => v.excluido || v.status === "excluido").length
    }), [lista]);

    const cidades = useMemo(
        () => [...new Set(lista.map((v) => v.cidade).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt")),
        [lista]
    );

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const dados = lista.filter((v) => {
            if (!visivelNaAba(v, aba)) {
                return false;
            }
            if (cidade && v.cidade !== cidade) {
                return false;
            }
            if (uf && v.uf !== uf) {
                return false;
            }
            if (!termo) {
                return true;
            }
            return [v.nome, v.codigo, v.email, v.telefone, v.cidade]
                .join(" ")
                .toLowerCase()
                .includes(termo);
        });
        return [...dados].sort((a, b) => {
            const campo = ordem.campo;
            const va = String(a[campo] || a.nome || "");
            const vb = String(b[campo] || b.nome || "");
            return va.localeCompare(vb, "pt-BR", { numeric: true }) * ordem.dir;
        });
    }, [lista, busca, aba, cidade, uf, ordem]);

    const paginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
    const paginaAtual = Math.min(pagina, paginas);
    const inicio = (paginaAtual - 1) * porPagina;
    const visiveis = filtrados.slice(inicio, inicio + porPagina);

    useEffect(() => {
        setPagina(1);
    }, [busca, aba, cidade, uf, porPagina]);

    function ordenar(campo) {
        setOrdem((atual) => ({ campo, dir: atual.campo === campo ? -atual.dir : 1 }));
    }

    function abrirNovo() {
        setForm(FORM_VAZIO);
        setModal({ modo: "editar" });
    }

    function abrir(vendedor, modo) {
        setForm({ ...FORM_VAZIO, ...vendedor });
        setModal({ modo, vendedor });
        setMenuId("");
    }

    function salvar() {
        if (!String(form.nome || "").trim()) {
            setAviso("Informe o nome do vendedor.");
            return;
        }
        salvarVendedorCadastro({ ...modal?.vendedor, ...form, nome: form.nome.trim() });
        recarregar();
        setModal(null);
        setAviso("Vendedor salvo.");
    }

    function excluir(vendedor) {
        if (!window.confirm(`Excluir ${vendedor.nome}? O registro vai para Excluídos.`)) {
            return;
        }
        excluirVendedorCadastro(vendedor.id);
        recarregar();
        setMenuId("");
        setAviso("Vendedor movido para excluídos.");
    }

    const leitura = modal?.modo === "ver";

    return (
        <div className="ctt-page ctt-loja vend-page has-pager">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <span>Cadastros</span>
                <span>›</span>
                <Link to={ROTAS.VENDEDORES}>Vendedores</Link>
            </nav>

            <div className="ctt-hero">
                <div>
                    <h2><UserRound size={28} /> Vendedores</h2>
                    <p className="ctt-sub">Cadastre e gerencie os vendedores que têm acesso ao sistema.</p>
                    {aviso ? <p className="ctt-sub ctt-ok">{aviso}</p> : null}
                </div>
                <div className="ctt-acoes">
                    <button type="button" className="ctt-btn-incluir" onClick={abrirNovo}>
                        <Plus size={16} /> Incluir vendedor
                    </button>
                </div>
            </div>

            <div className="vend-filtros">
                <label className="vend-busca">
                    <Search size={16} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Pesquise por nome, código ou e-mail..."
                    />
                    {busca ? (
                        <button type="button" className="vend-limpar" onClick={() => setBusca("")} aria-label="Limpar busca">
                            <X size={14} />
                        </button>
                    ) : null}
                </label>
                <div className="loc-menu-wrap">
                    <button type="button" className="vend-mais" onClick={() => setFiltrosAberto((v) => !v)}>
                        <Filter size={15} /> Mais filtros <ChevronDown size={14} />
                    </button>
                    {filtrosAberto ? (
                        <div className="loc-pop">
                            <label>
                                Cidade
                                <select value={cidade} onChange={(e) => setCidade(e.target.value)}>
                                    <option value="">Todas</option>
                                    {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </label>
                            <label>
                                Estado
                                <select value={uf} onChange={(e) => setUf(e.target.value)}>
                                    <option value="">Todos</option>
                                    <option value="RJ">RJ</option>
                                    <option value="SP">SP</option>
                                    <option value="MG">MG</option>
                                </select>
                            </label>
                            <button type="button" onClick={() => { setCidade(""); setUf(""); setFiltrosAberto(false); }}>
                                Limpar filtros
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="vend-chips">
                {[
                    ["todos", "Todos", totais.todos],
                    ["ativos", "Ativos", totais.ativos],
                    ["inativos", "Inativos", totais.inativos],
                    ["excluidos", "Excluídos", totais.excluidos]
                ].map(([id, nome, qtd]) => (
                    <button type="button" key={id} className={aba === id ? "is-on" : ""} onClick={() => setAba(id)}>
                        <i className={`vend-dot is-${id}`} />
                        {nome} <strong>{qtd}</strong>
                    </button>
                ))}
            </div>

            <div className="os-scroll vend-tabela">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th className="ctt-check">
                                <input
                                    type="checkbox"
                                    checked={visiveis.length > 0 && visiveis.every((v) => marcados.includes(v.id))}
                                    onChange={() => {
                                        const ids = visiveis.map((v) => v.id);
                                        const todos = ids.every((id) => marcados.includes(id));
                                        setMarcados(todos ? marcados.filter((id) => !ids.includes(id)) : [...new Set([...marcados, ...ids])]);
                                    }}
                                    aria-label="Selecionar visíveis"
                                />
                            </th>
                            <th><button type="button" className="vend-ord" onClick={() => ordenar("nome")}>Nome</button></th>
                            <th><button type="button" className="vend-ord" onClick={() => ordenar("codigo")}>Código</button></th>
                            <th>E-mail</th>
                            <th>Telefone</th>
                            <th><button type="button" className="vend-ord" onClick={() => ordenar("cidade")}>Cidade</button></th>
                            <th>Estado</th>
                            <th><button type="button" className="vend-ord" onClick={() => ordenar("status")}>Status</button></th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visiveis.length === 0 ? (
                            <tr><td colSpan={9} className="ctt-vazio">Nenhum vendedor nesta lista.</td></tr>
                        ) : visiveis.map((v, i) => (
                            <tr key={v.id} className={marcados.includes(v.id) ? "is-sel" : ""}>
                                <td className="ctt-check">
                                    <input type="checkbox" checked={marcados.includes(v.id)} onChange={() => setMarcados((ids) => ids.includes(v.id) ? ids.filter((x) => x !== v.id) : [...ids, v.id])} />
                                </td>
                                <td>
                                    <button type="button" className="vend-nome" onClick={() => abrir(v, "editar")}>
                                        <span className="vend-avatar" style={{ background: corAvatar(v.nome, i) }}>{inicialDe(v.nome)}</span>
                                        {v.nome}
                                    </button>
                                </td>
                                <td>{v.codigo}</td>
                                <td>{v.email || "—"}</td>
                                <td>{v.telefone || "—"}</td>
                                <td>{v.cidade || "—"}</td>
                                <td>{v.uf || "—"}</td>
                                <td>
                                    <span className={`vend-status is-${v.status}`}>{rotuloStatus(v.status)}</span>
                                </td>
                                <td>
                                    <div className="vend-acoes">
                                        <button type="button" title="Ver" onClick={() => abrir(v, "ver")}><Eye size={15} /></button>
                                        <button type="button" title="Editar" onClick={() => abrir(v, "editar")}><PenLine size={15} /></button>
                                        <div className="loc-menu-wrap">
                                            <button type="button" title="Mais" onClick={() => setMenuId(menuId === String(v.id) ? "" : String(v.id))}>
                                                <MoreVertical size={15} />
                                            </button>
                                            {menuId === String(v.id) ? (
                                                <div className="loc-pop">
                                                    {aba === "excluidos" ? (
                                                        <button type="button" onClick={() => { restaurarVendedorCadastro(v.id); recarregar(); setMenuId(""); }}>
                                                            <RotateCcw size={13} /> Restaurar
                                                        </button>
                                                    ) : (
                                                        <button type="button" onClick={() => excluir(v)}>
                                                            <Trash2 size={13} /> Excluir
                                                        </button>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="vend-rodape">
                <span>
                    Mostrando {filtrados.length ? inicio + 1 : 0} a {Math.min(inicio + visiveis.length, filtrados.length)} de {filtrados.length} vendedores
                </span>
                <div className="vend-pagina">
                    <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina((n) => n - 1)} aria-label="Anterior">
                        <ChevronLeft size={14} />
                    </button>
                    <button type="button" className="is-on">{paginaAtual}</button>
                    <button type="button" disabled={paginaAtual >= paginas} onClick={() => setPagina((n) => n + 1)} aria-label="Próxima">
                        <ChevronRight size={14} />
                    </button>
                </div>
                <label className="erp-pager-size">
                    <select value={porPagina} onChange={(e) => setPorPagina(Number(e.target.value))} aria-label="Por página">
                        <option value={10}>10 por página</option>
                        <option value={20}>20 por página</option>
                        <option value={50}>50 por página</option>
                    </select>
                </label>
            </div>

            <aside className="vend-promo" aria-hidden>
                <svg viewBox="0 0 120 88" width="88" height="64">
                    <circle cx="28" cy="22" r="12" fill="#f9a8d4" />
                    <circle cx="52" cy="18" r="13" fill="#fb7185" />
                    <circle cx="76" cy="22" r="12" fill="#f472b6" />
                    <circle cx="98" cy="28" r="11" fill="#c4b5fd" />
                    <ellipse cx="28" cy="58" rx="16" ry="18" fill="#fbcfe8" />
                    <ellipse cx="52" cy="56" rx="18" ry="20" fill="#fb7185" />
                    <ellipse cx="76" cy="58" rx="16" ry="18" fill="#f9a8d4" />
                    <ellipse cx="98" cy="62" rx="14" ry="16" fill="#ddd6fe" />
                </svg>
                <p>Pessoas que <b>vendem resultados!</b></p>
            </aside>

            {modal ? (
                <div className="pv-modal-bg" onClick={() => setModal(null)}>
                    <div className="pv-modal vend-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{leitura ? "Ver vendedor" : modal.vendedor ? "Editar vendedor" : "Incluir vendedor"}</h3>
                        <div className="vend-form">
                            <label>Nome<input value={form.nome} disabled={leitura} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} /></label>
                            <label>E-mail<input value={form.email} disabled={leitura} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></label>
                            <label>Telefone<input value={form.telefone} disabled={leitura} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} /></label>
                            <label>Cidade<input value={form.cidade} disabled={leitura} onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))} /></label>
                            <label>Estado<input value={form.uf} disabled={leitura} maxLength={2} onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value.toUpperCase() }))} /></label>
                            <label>Cargo<input value={form.cargo} disabled={leitura} onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))} /></label>
                            <label>Comissão (%)<input type="number" value={form.comissao} disabled={leitura} onChange={(e) => setForm((f) => ({ ...f, comissao: Number(e.target.value) }))} /></label>
                            <label>Status
                                <select value={form.status} disabled={leitura} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                                    <option value="ativo">Ativo</option>
                                    <option value="inativo">Inativo</option>
                                    <option value="pendente">Pendente</option>
                                </select>
                            </label>
                        </div>
                        <div className="ctt-menu-acoes">
                            {leitura ? null : (
                                <button type="button" className="ctt-btn-incluir" onClick={salvar}>Salvar</button>
                            )}
                            <button type="button" className="vend-cancelar" onClick={() => setModal(null)}>
                                {leitura ? "Fechar" : "Cancelar"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
