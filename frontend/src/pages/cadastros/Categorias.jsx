import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowUpDown,
    BookOpen,
    Box,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Eye,
    Folder,
    Gamepad2,
    Gift,
    Info,
    LayoutGrid,
    Monitor,
    MoreVertical,
    Package,
    Pencil,
    PenLine,
    Plus,
    Search,
    Sparkles,
    Upload,
    Wrench,
    XCircle
} from "lucide-react";

import ROTAS from "../../constants/rotas";
import {
    caminhoDa,
    ehRaiz,
    filhosDe,
    gravarCategorias,
    importarLinhas,
    lerCategorias,
    mapaContagem,
    novaCategoria,
    produtoNaCategoria,
    resumoCategorias
} from "../../constants/categoriasProdutos";
import { garantirCatalogoLoja, produtosLoja } from "../../constants/catalogoLoja";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/categorias.css";

const ICONES = {
    folder: Folder,
    book: BookOpen,
    pen: PenLine,
    pencil: Pencil,
    gift: Gift,
    box: Box,
    game: Gamepad2,
    spark: Sparkles,
    monitor: Monitor,
    wrench: Wrench
};

function IconeCat({ id, size = 16 }) {
    const Icon = ICONES[id] || Folder;
    return <Icon size={size} />;
}

function fmt(n) {
    return Number(n || 0).toLocaleString("pt-BR");
}

export default function Categorias() {
    const arquivoRef = useRef(null);
    const fotoRef = useRef(null);
    const [lista, setLista] = useState(lerCategorias);
    const [produtos, setProdutos] = useState(() => produtosLoja());
    const [abertas, setAbertas] = useState(() => new Set(["50070", "cadernos", "canetas"]));
    const [selId, setSelId] = useState("50070");
    const [form, setForm] = useState(() => lerCategorias().find((c) => c.id === "50070") || novaCategoria());
    const [busca, setBusca] = useState("");
    const [filtroPai, setFiltroPai] = useState("todas");
    const [filtroStatus, setFiltroStatus] = useState("todos");
    const [aba, setAba] = useState("info");
    const [aviso, setAviso] = useState("");
    const [menuAberto, setMenuAberto] = useState(false);

    useEffect(() => {
        garantirCatalogoLoja().then(() => setProdutos(produtosLoja())).catch(() => setProdutos(produtosLoja()));
    }, []);

    const resumo = useMemo(() => resumoCategorias(lista, produtos), [lista, produtos]);
    const counts = resumo.counts;
    const raizes = useMemo(() => filhosDe(lista, null), [lista]);
    const selecionada = lista.find((c) => c.id === selId) || null;
    const alvoId = form.id || selId;
    const subSel = alvoId ? filhosDe(lista, alvoId) : [];
    const prodsSel = useMemo(() => {
        const alvo = lista.find((c) => c.id === (form.id || selId));
        if (!alvo) {
            return [];
        }
        const idsFilhos = new Set(subSel.map((s) => s.id));
        return produtos.filter((p) => {
            if (idsFilhos.size) {
                return subSel.some((s) => {
                    const netos = filhosDe(lista, s.id);
                    if (netos.length) {
                        return netos.some((n) => produtoNaCategoria(p, n));
                    }
                    return produtoNaCategoria(p, s);
                });
            }
            return produtoNaCategoria(p, alvo);
        }).slice(0, 40);
    }, [lista, produtos, form.id, selId, subSel]);

    function patchForm(parte) {
        setForm((atual) => ({ ...atual, ...parte }));
    }

    function gravar(proxima, msg) {
        setLista(proxima);
        gravarCategorias(proxima);
        if (msg) {
            setAviso(msg);
        }
    }

    function selecionar(cat) {
        setSelId(cat.id);
        setForm({ ...cat });
        setAba("info");
        setMenuAberto(false);
        setAviso("");
    }

    function abrirNova(paiId = null) {
        const irmaos = filhosDe(lista, paiId);
        setSelId("");
        setForm(novaCategoria(paiId, irmaos.length + 1));
        setAba("info");
        setMenuAberto(false);
        setAviso("");
        if (paiId) {
            setAbertas((atual) => new Set([...atual, paiId]));
        }
    }

    function salvar() {
        const nome = form.nome.trim();
        if (!nome) {
            setAviso("Informe o nome da categoria.");
            return;
        }
        if (form.id) {
            gravar(lista.map((c) => (c.id === form.id ? { ...form, nome } : c)), "Categoria salva.");
            return;
        }
        const id = `cat-${Date.now()}`;
        const nova = { ...form, id, nome, grupo: form.grupo || nome };
        gravar([nova, ...lista], "Categoria criada.");
        setSelId(id);
        setForm(nova);
    }

    function cancelar() {
        if (form.id) {
            const atual = lista.find((c) => c.id === form.id);
            setForm(atual ? { ...atual } : novaCategoria());
        } else if (selecionada) {
            selecionar(selecionada);
        } else {
            const primeira = raizes[0];
            if (primeira) {
                selecionar(primeira);
            }
        }
        setAviso("");
    }

    function excluir() {
        if (!form.id) {
            return;
        }
        const netos = lista.filter((c) => c.paiId === form.id);
        if (netos.length && !window.confirm("Esta categoria tem subcategorias. Excluir mesmo assim?")) {
            return;
        }
        const ids = new Set([form.id, ...netos.map((n) => n.id)]);
        const proxima = lista.filter((c) => !ids.has(c.id));
        gravar(proxima, "Categoria excluída.");
        const prox = proxima.find(ehRaiz) || proxima[0];
        if (prox) {
            selecionar(prox);
        } else {
            setSelId("");
            setForm(novaCategoria());
        }
        setMenuAberto(false);
    }

    function ordenar() {
        const ordenadas = [...raizes].sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
        const mapa = new Map(ordenadas.map((c, i) => [c.id, i + 1]));
        gravar(lista.map((c) => (mapa.has(c.id) ? { ...c, ordem: mapa.get(c.id) } : c)), "Categorias ordenadas A–Z.");
    }

    function importarArquivo(arquivo) {
        if (!arquivo) {
            return;
        }
        const leitor = new FileReader();
        leitor.onload = () => {
            gravar(importarLinhas(String(leitor.result || ""), lista), "Categorias importadas.");
        };
        leitor.readAsText(arquivo);
    }

    function toggleAberto(id, e) {
        e.stopPropagation();
        setAbertas((atual) => {
            const prox = new Set(atual);
            if (prox.has(id)) {
                prox.delete(id);
            } else {
                prox.add(id);
            }
            return prox;
        });
    }

    function visivel(cat) {
        const texto = busca.trim().toLowerCase();
        if (texto && !cat.nome.toLowerCase().includes(texto)) {
            return false;
        }
        if (filtroStatus === "ativas" && cat.ativo === false) {
            return false;
        }
        if (filtroStatus === "inativas" && cat.ativo !== false) {
            return false;
        }
        if (filtroPai !== "todas") {
            const caminho = caminhoDa(lista, cat.id).map((n) => n.toUpperCase());
            const pai = lista.find((c) => c.id === filtroPai);
            if (!pai || !caminho.includes(pai.nome.toUpperCase())) {
                return false;
            }
        }
        return true;
    }

    function linhasDe(paiId, profundidade) {
        return filhosDe(lista, paiId).flatMap((cat) => {
            const kids = filhosDe(lista, cat.id);
            const mostra = visivel(cat) || kids.some((k) => visivel(k) || filhosDe(lista, k.id).some(visivel));
            if (!mostra) {
                return [];
            }
            const aberta = abertas.has(cat.id);
            const Icon = ICONES[cat.icone] || Folder;
            return [
                <tr
                    key={cat.id}
                    className={`${selId === cat.id ? "is-on" : ""} ${cat.ativo === false ? "is-off" : ""}`}
                    onClick={() => selecionar(cat)}
                >
                    <td>
                        <div className="cat-nome" style={{ paddingLeft: profundidade * 18 }}>
                            {kids.length ? (
                                <button type="button" className="cat-exp" onClick={(e) => toggleAberto(cat.id, e)} aria-label={aberta ? "Recolher" : "Expandir"}>
                                    {aberta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                            ) : (
                                <span className="cat-exp" />
                            )}
                            <span className="cat-fold" style={{ background: cat.cor }}>
                                <Icon size={14} />
                            </span>
                            <b>{cat.nome}</b>
                        </div>
                    </td>
                    <td>{fmt(counts[cat.id] || 0)}</td>
                    <td>
                        <span className={`cat-badge ${cat.ativo === false ? "is-no" : "is-ok"}`}>
                            {cat.ativo === false ? "Inativa" : "Ativa"}
                        </span>
                    </td>
                    <td>
                        <div className="cat-row-acoes">
                            <button type="button" title="Ver" onClick={(e) => { e.stopPropagation(); selecionar(cat); }}>
                                <Eye size={14} />
                            </button>
                            <button type="button" title="Nova subcategoria" onClick={(e) => { e.stopPropagation(); abrirNova(cat.id); }}>
                                <Plus size={14} />
                            </button>
                            <button type="button" title="Editar" onClick={(e) => { e.stopPropagation(); selecionar(cat); }}>
                                <Pencil size={14} />
                            </button>
                        </div>
                    </td>
                </tr>,
                ...(aberta ? linhasDe(cat.id, profundidade + 1) : [])
            ];
        });
    }

    const IconForm = ICONES[form.icone] || Folder;
    const pais = lista.filter((c) => c.id && c.id !== form.id);

    return (
        <div className="cat-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <span>cadastros</span>
                <span>›</span>
                <span>categorias dos produtos</span>
            </nav>

            <div className="cat-head">
                <div>
                    <h2>Categorias dos produtos</h2>
                    <p>Organize seus produtos em categorias e subcategorias para facilitar a gestão e a pesquisa.</p>
                </div>
                <div className="cat-acoes">
                    <button type="button" className="cat-btn" onClick={ordenar}>
                        <ArrowUpDown size={15} /> Ordenar
                    </button>
                    <button type="button" className="cat-btn" onClick={() => arquivoRef.current?.click()}>
                        <Upload size={15} /> Importar
                    </button>
                    <input
                        ref={arquivoRef}
                        type="file"
                        accept=".csv,.txt,.tsv"
                        hidden
                        onChange={(e) => {
                            importarArquivo(e.target.files?.[0]);
                            e.target.value = "";
                        }}
                    />
                    <button type="button" className="cat-btn-pri" onClick={() => abrirNova(null)}>
                        <Plus size={16} /> Nova categoria
                    </button>
                </div>
            </div>

            {aviso ? <p className="cat-aviso">{aviso}</p> : null}

            <div className="cat-kpis">
                <article className="cat-kpi is-rosa">
                    <i><Folder size={18} /></i>
                    <div>
                        <strong>{fmt(resumo.total)}</strong>
                        <span>Categorias no total</span>
                    </div>
                </article>
                <article className="cat-kpi is-lilas">
                    <i><LayoutGrid size={18} /></i>
                    <div>
                        <strong>{fmt(resumo.subcategorias)}</strong>
                        <span>Subcategorias</span>
                    </div>
                </article>
                <article className="cat-kpi is-azul">
                    <i><Package size={18} /></i>
                    <div>
                        <strong>{fmt(resumo.vinculados)}</strong>
                        <span>Produtos vinculados</span>
                    </div>
                </article>
                <article className="cat-kpi is-verde">
                    <i><CheckCircle2 size={18} /></i>
                    <div>
                        <strong>{fmt(resumo.ativas)}</strong>
                        <span>Categorias ativas</span>
                    </div>
                </article>
                <article className="cat-kpi is-vermelho">
                    <i><XCircle size={18} /></i>
                    <div>
                        <strong>{fmt(resumo.inativas)}</strong>
                        <span>Categorias inativas</span>
                    </div>
                </article>
            </div>

            <div className="cat-body">
                <section className="cat-card">
                    <div className="cat-filtros">
                        <label>
                            <Search size={15} />
                            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar categoria..." />
                        </label>
                        <select value={filtroPai} onChange={(e) => setFiltroPai(e.target.value)} aria-label="Filtrar categoria">
                            <option value="todas">Todas as categorias</option>
                            {raizes.map((c) => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                        </select>
                        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} aria-label="Filtrar status">
                            <option value="todos">Status</option>
                            <option value="ativas">Ativas</option>
                            <option value="inativas">Inativas</option>
                        </select>
                    </div>
                    <table className="cat-tree">
                        <thead>
                            <tr>
                                <th>Categoria</th>
                                <th>Produtos</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linhasDe(null, 0)}
                        </tbody>
                    </table>
                    {!raizes.length ? <p className="cat-vazio">Nenhuma categoria ainda. Clique em Nova categoria.</p> : null}
                </section>

                <aside className="cat-card cat-edit">
                    <div className="cat-edit-top">
                        <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <span className="cat-edit-ico" style={{ background: form.cor || "#f59e0b" }}>
                                <IconForm size={22} />
                            </span>
                            <div>
                                <h3>{form.nome || "Nova categoria"}</h3>
                                <p>
                                    {form.ativo === false ? "Categoria inativa" : "Categoria ativa"}
                                    {form.paiId ? ` · ${caminhoDa(lista, form.paiId).join(" › ")}` : ""}
                                </p>
                            </div>
                        </div>
                        {form.id ? (
                            <div style={{ position: "relative" }}>
                                <button type="button" className="cat-btn" onClick={() => setMenuAberto((v) => !v)} aria-label="Mais ações">
                                    <MoreVertical size={16} />
                                </button>
                                {menuAberto ? (
                                    <button type="button" className="cat-ghost" style={{ position: "absolute", right: 0, top: 40, zIndex: 2 }} onClick={excluir}>
                                        Excluir
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    <div className="cat-tabs">
                        <button type="button" className={aba === "info" ? "is-on" : ""} onClick={() => setAba("info")}>
                            <Info size={13} /> Informações
                        </button>
                        <button type="button" className={aba === "subs" ? "is-on" : ""} onClick={() => setAba("subs")}>
                            Subcategorias ({subSel.length})
                        </button>
                        <button type="button" className={aba === "prods" ? "is-on" : ""} onClick={() => setAba("prods")}>
                            Produtos ({fmt(counts[form.id] || 0)})
                        </button>
                        <button type="button" className={aba === "seo" ? "is-on" : ""} onClick={() => setAba("seo")}>
                            SEO e Integrações
                        </button>
                    </div>

                    {aba === "info" ? (
                        <>
                            <label className="cat-campo">
                                <span className="cat-switch-row">
                                    Nome da categoria
                                    <button
                                        type="button"
                                        className={`cat-switch ${form.ativo !== false ? "is-on" : ""}`}
                                        onClick={() => patchForm({ ativo: form.ativo === false })}
                                        aria-label="Categoria ativa"
                                    >
                                        <i />
                                    </button>
                                </span>
                                <input value={form.nome} onChange={(e) => patchForm({ nome: e.target.value })} placeholder="PAPELARIA" />
                            </label>
                            <div className="cat-grid2">
                                <label className="cat-campo">
                                    <span>Categoria pai</span>
                                    <select value={form.paiId || ""} onChange={(e) => patchForm({ paiId: e.target.value || null })}>
                                        <option value="">Nenhuma (categoria principal)</option>
                                        {pais.map((c) => (
                                            <option key={c.id} value={c.id}>{c.nome}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="cat-campo">
                                    <span>Ordem</span>
                                    <input type="number" min={1} value={form.ordem} onChange={(e) => patchForm({ ordem: Number(e.target.value) || 1 })} />
                                </label>
                            </div>
                            <label className="cat-campo">
                                <span>Descrição</span>
                                <textarea
                                    maxLength={500}
                                    value={form.descricao}
                                    onChange={(e) => patchForm({ descricao: e.target.value })}
                                    placeholder="Materiais de papelaria e escritório em geral."
                                />
                                <em>{(form.descricao || "").length}/500</em>
                            </label>
                            <div className="cat-campo">
                                <span>Imagem da categoria</span>
                                <div className="cat-imgs">
                                    {Object.keys(ICONES).map((id) => (
                                        <button
                                            key={id}
                                            type="button"
                                            className={form.icone === id && !form.imagem ? "is-on" : ""}
                                            style={{ background: form.cor || "#f59e0b" }}
                                            onClick={() => patchForm({ icone: id, imagem: "" })}
                                            title={id}
                                        >
                                            <IconeCat id={id} />
                                        </button>
                                    ))}
                                    <label className={form.imagem ? "is-on" : ""} style={{ background: "#fce7f3", color: "var(--accent)" }}>
                                        {form.imagem ? <img src={form.imagem} alt="" /> : <Plus size={16} />}
                                        <input
                                            ref={fotoRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) {
                                                    return;
                                                }
                                                const leitor = new FileReader();
                                                leitor.onload = () => patchForm({ imagem: String(leitor.result || "") });
                                                leitor.readAsDataURL(file);
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </>
                    ) : null}

                    {aba === "subs" ? (
                        <div className="cat-lista">
                            {subSel.length ? subSel.map((s) => (
                                <article key={s.id}>
                                    <button type="button" className="cat-btn" onClick={() => selecionar(s)}>{s.nome}</button>
                                    <span>{fmt(counts[s.id] || 0)}</span>
                                </article>
                            )) : <p className="cat-vazio">Nenhuma subcategoria.</p>}
                            {form.id ? (
                                <button type="button" className="cat-btn" onClick={() => abrirNova(form.id)}>
                                    <Plus size={14} /> Nova subcategoria
                                </button>
                            ) : null}
                        </div>
                    ) : null}

                    {aba === "prods" ? (
                        <div className="cat-lista">
                            {prodsSel.length ? prodsSel.map((p) => (
                                <Link key={p.id} to={`/produtos?q=${encodeURIComponent(p.nome)}`}>
                                    <span>{p.nome}</span>
                                    <b>{Number(p.preco || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b>
                                </Link>
                            )) : <p className="cat-vazio">Nenhum produto vinculado a esta categoria.</p>}
                        </div>
                    ) : null}

                    {aba === "seo" ? (
                        <>
                            <label className="cat-campo">
                                <span>Título SEO</span>
                                <input value={form.seoTitulo} onChange={(e) => patchForm({ seoTitulo: e.target.value })} placeholder={form.nome} />
                            </label>
                            <label className="cat-campo">
                                <span>Descrição SEO</span>
                                <textarea value={form.seoDescricao} onChange={(e) => patchForm({ seoDescricao: e.target.value })} />
                            </label>
                            <label className="cat-campo">
                                <span>Grupo no catálogo</span>
                                <input value={form.grupo} onChange={(e) => patchForm({ grupo: e.target.value })} />
                            </label>
                        </>
                    ) : null}

                    <div className="cat-foot">
                        <button type="button" className="cat-ghost" onClick={cancelar}>Cancelar</button>
                        <button type="button" className="cat-save" onClick={salvar}>Salvar categoria</button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
