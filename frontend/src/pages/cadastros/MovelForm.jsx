import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    Box,
    Columns3,
    Copy,
    History,
    Image as ImageIcon,
    LayoutDashboard,
    LayoutGrid,
    MapPin,
    Package,
    Palette,
    Plus,
    Rows3,
    Ruler,
    Save,
    Trash2,
    Weight
} from "lucide-react";

import {
    ABAS_MOVEL,
    LOJAS_MOVEL,
    SETORES_LOJA,
    STATUS_MOVEL,
    TIPOS_MOVEL,
    duplicarMovel,
    lerMoveis,
    movelVazio,
    removerMovel,
    totalPrateleiras,
    upsertMovel
} from "../../constants/moveis";
import ROTAS from "../../constants/rotas";
import { registrarAuditoria } from "../../services/auditoria.service";
import HistoricoAuditoria from "../../components/HistoricoAuditoria";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/moveis.css";

const ICONES_ABA = {
    geral: LayoutDashboard,
    dimensoes: Ruler,
    prateleiras: Rows3,
    divisorias: Columns3,
    materiais: Palette,
    imagens: ImageIcon,
    localizacao: MapPin,
    historico: History
};

function dataHora(valor) {
    if (!valor) {
        return "—";
    }
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) {
        return valor;
    }
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MovelForm() {
    const { id } = useParams();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const nova = !id || id === "novo";
    const [lista, setLista] = useState(lerMoveis);
    const existente = !nova ? lista.find((m) => String(m.id) === String(id)) : null;
    const [form, setForm] = useState(() => existente || movelVazio());
    const [aba, setAba] = useState(params.get("aba") || "geral");
    const [vista, setVista] = useState("frente");
    const [tag, setTag] = useState("");
    const [layoutAberto, setLayoutAberto] = useState(false);

    useEffect(() => {
        if (existente) {
            setForm(existente);
        }
    }, [existente]);

    useEffect(() => {
        const proxima = params.get("aba");
        if (proxima) {
            setAba(proxima);
        }
    }, [params]);

    const statusInfo = STATUS_MOVEL.find((s) => s.id === form.status) || STATUS_MOVEL[0];
    const foto = form.foto || form.galeria?.[0] || "";
    const total = totalPrateleiras(form);
    const obs = form.observacao || "";

    function alterar(campo, valor) {
        setForm((atual) => ({ ...atual, [campo]: valor }));
    }

    function salvar() {
        if (!form.nome.trim()) {
            window.alert("Informe o nome do móvel.");
            return;
        }
        const { lista: novaLista, item } = upsertMovel(lista, form);
        setLista(novaLista);
        setForm(item);
        registrarAuditoria({
            entidade: "MOVEL",
            registroId: item.id,
            registroNome: item.nome,
            acao: nova ? "CRIAR" : "ALTERAR",
            resumo: nova ? "móvel cadastrado" : "cadastro de móvel atualizado"
        }).catch(() => null);
        if (nova) {
            navigate(`${ROTAS.MOVEIS}/${item.id}`, { replace: true });
        }
    }

    function excluir() {
        if (!form.id) {
            navigate(ROTAS.MOVEIS);
            return;
        }
        if (!window.confirm(`Excluir "${form.nome}"?`)) {
            return;
        }
        setLista(removerMovel(lista, form.id));
        registrarAuditoria({
            entidade: "MOVEL",
            registroId: form.id,
            registroNome: form.nome,
            acao: "EXCLUIR",
            resumo: "móvel excluído"
        }).catch(() => null);
        navigate(ROTAS.MOVEIS);
    }

    function duplicar() {
        if (!form.id) {
            return;
        }
        const { lista: novaLista, item } = duplicarMovel(lista, form);
        setLista(novaLista);
        navigate(`${ROTAS.MOVEIS}/${item.id}`);
    }

    function addTag() {
        const t = tag.trim();
        if (!t || (form.tags || []).includes(t)) {
            return;
        }
        alterar("tags", [...(form.tags || []), t]);
        setTag("");
    }

    function addFoto(arquivo) {
        if (!arquivo) {
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const url = String(reader.result || "");
            setForm((atual) => ({
                ...atual,
                foto: atual.foto || url,
                galeria: [...(atual.galeria || []), url]
            }));
        };
        reader.readAsDataURL(arquivo);
    }

    const layoutStyle = useMemo(() => ({
        gridTemplateColumns: `repeat(${Math.max(1, Number(form.colunas) || 1)}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${Math.max(1, Number(form.prateleiras) || 1)}, minmax(0, 1fr))`
    }), [form.colunas, form.prateleiras]);

    if (!nova && !existente) {
        return (
            <div className="mv-page">
                <p>Móvel não encontrado.</p>
                <Link to={ROTAS.MOVEIS}>voltar</Link>
            </div>
        );
    }

    return (
        <div className="prd-page mv-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <span>Cadastros</span>
                <span>›</span>
                <Link to={ROTAS.MOVEIS}>Móveis</Link>
                <span>›</span>
                <span>{nova ? "Novo" : "Editar"}</span>
            </nav>

            <div className="mv-ficha-top">
                <div>
                    <h2>
                        {form.nome || "Novo móvel"}
                        <span className={`mv-st is-${form.status}`}>
                            <i />
                            {statusInfo.label}
                        </span>
                    </h2>
                    <p>{form.descricao || form.detalhe || "Cadastre as medidas, o layout e as fotos do móvel."}</p>
                </div>
                <div className="mv-head-acoes">
                    {form.id ? (
                        <button type="button" className="prd-btn" onClick={duplicar}>
                            <Copy size={15} />
                            Duplicar
                        </button>
                    ) : null}
                    <button type="button" className="prd-btn mv-btn-danger" onClick={excluir}>
                        <Trash2 size={15} />
                        Excluir
                    </button>
                    <button type="button" className="prd-btn prd-btn-primary" onClick={salvar}>
                        <Save size={15} />
                        Salvar
                    </button>
                </div>
            </div>

            <div className="mv-tabs">
                {ABAS_MOVEL.map((a) => {
                    const Icone = ICONES_ABA[a.id] || LayoutDashboard;
                    return (
                        <button key={a.id} type="button" className={aba === a.id ? "is-on" : ""} onClick={() => setAba(a.id)}>
                            <Icone size={15} />
                            {a.label}
                        </button>
                    );
                })}
            </div>

            {aba === "geral" ? (
                <div className="mv-geral">
                    <section className="mv-hero">
                        <div
                            className={`mv-hero-foto is-${vista}`}
                            style={{ backgroundImage: foto ? `url(${foto})` : "none" }}
                        >
                            <span className="mv-dim is-h">{form.altura || 0} cm</span>
                            <span className="mv-dim is-w">{form.largura || 0} cm</span>
                            <span className="mv-dim is-d">{form.profundidade || 0} cm</span>
                        </div>
                        <div className="mv-vistas">
                            <button type="button" className={vista === "3d" ? "is-on" : ""} onClick={() => setVista("3d")}>
                                <Box size={14} /> Visual 3D
                            </button>
                            <button type="button" className={vista === "frente" ? "is-on" : ""} onClick={() => setVista("frente")}>
                                Frente
                            </button>
                            <button type="button" className={vista === "lateral" ? "is-on" : ""} onClick={() => setVista("lateral")}>
                                Lateral
                            </button>
                            <button type="button" className={vista === "topo" ? "is-on" : ""} onClick={() => setVista("topo")}>
                                Topo
                            </button>
                        </div>
                        <div className="mv-stats">
                            <div className="mv-stat">
                                <LayoutGrid size={16} />
                                <span>Total de Prateleiras<strong>{total}</strong></span>
                            </div>
                            <div className="mv-stat">
                                <Weight size={16} />
                                <span>Capacidade Estimada<strong>{form.capacidadeKg || 0} kg</strong></span>
                            </div>
                            <div className="mv-stat">
                                <Package size={16} />
                                <span>Itens Cadastrados<strong>{form.itens || 0}</strong></span>
                            </div>
                            <div className="mv-stat">
                                <History size={16} />
                                <span>Última Atualização<strong>{dataHora(form.atualizadoEm)}</strong></span>
                            </div>
                        </div>
                    </section>

                    <section className="mv-painel">
                        <div className="mv-box">
                            <h3>Informações do Móvel</h3>
                            <label className="mv-campo">
                                <span>Nome do Móvel *</span>
                                <input value={form.nome} onChange={(e) => alterar("nome", e.target.value)} />
                            </label>
                            <label className="mv-campo">
                                <span>Descrição</span>
                                <input value={form.descricao} onChange={(e) => alterar("descricao", e.target.value)} />
                            </label>
                            <div className="mv-dupla">
                                <label className="mv-campo">
                                    <span>Tipo de Móvel</span>
                                    <select value={form.tipo} onChange={(e) => alterar("tipo", e.target.value)}>
                                        {TIPOS_MOVEL.map((t) => <option key={t}>{t}</option>)}
                                    </select>
                                </label>
                                <label className="mv-campo">
                                    <span>Setor da Loja</span>
                                    <select value={form.setor} onChange={(e) => alterar("setor", e.target.value)}>
                                        {SETORES_LOJA.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </label>
                            </div>
                            <div className="mv-dupla">
                                <label className="mv-campo">
                                    <span>Status</span>
                                    <select value={form.status} onChange={(e) => alterar("status", e.target.value)}>
                                        {STATUS_MOVEL.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                </label>
                                <label className="mv-campo">
                                    <span>Localização</span>
                                    <select value={form.loja} onChange={(e) => alterar("loja", e.target.value)}>
                                        {LOJAS_MOVEL.map((l) => <option key={l}>{l}</option>)}
                                    </select>
                                </label>
                            </div>
                            <label className="mv-campo">
                                <span>Observações</span>
                                <textarea maxLength={500} value={obs} onChange={(e) => alterar("observacao", e.target.value)} />
                            </label>
                            <div className="mv-obs-count">{obs.length}/500</div>
                        </div>

                        <div className="mv-box">
                            <h3>Dimensões Totais</h3>
                            <div className="mv-tripla">
                                <label className="mv-campo">
                                    <span>Largura (cm)</span>
                                    <input type="number" min="0" value={form.largura} onChange={(e) => alterar("largura", Number(e.target.value))} />
                                </label>
                                <label className="mv-campo">
                                    <span>Altura (cm)</span>
                                    <input type="number" min="0" value={form.altura} onChange={(e) => alterar("altura", Number(e.target.value))} />
                                </label>
                                <label className="mv-campo">
                                    <span>Profundidade (cm)</span>
                                    <input type="number" min="0" value={form.profundidade} onChange={(e) => alterar("profundidade", Number(e.target.value))} />
                                </label>
                            </div>
                        </div>

                        <div className="mv-box">
                            <h3>Cores e Acabamento</h3>
                            <div className="mv-tripla">
                                <label className="mv-campo">
                                    <span>Cor Principal</span>
                                    <span className="mv-swatch"><i style={{ background: "#f4f4f5" }} />
                                        <input value={form.cor} onChange={(e) => alterar("cor", e.target.value)} />
                                    </span>
                                </label>
                                <label className="mv-campo">
                                    <span>Acabamento da Borda</span>
                                    <span className="mv-swatch"><i style={{ background: "#b45309" }} />
                                        <input value={form.borda} onChange={(e) => alterar("borda", e.target.value)} />
                                    </span>
                                </label>
                                <label className="mv-campo">
                                    <span>Material</span>
                                    <input value={form.material} onChange={(e) => alterar("material", e.target.value)} />
                                </label>
                            </div>
                            <div className="mv-campo">
                                <span>Tags</span>
                                <div className="mv-tags">
                                    {(form.tags || []).map((t) => (
                                        <span key={t} className="mv-tag">
                                            {t}
                                            <button type="button" onClick={() => alterar("tags", form.tags.filter((x) => x !== t))}>×</button>
                                        </span>
                                    ))}
                                    <input
                                        value={tag}
                                        placeholder="+ Adicionar tag"
                                        onChange={(e) => setTag(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="mv-lado">
                        <div className="mv-box">
                            <h3>Imagens do Móvel</h3>
                            <div className="mv-fotos">
                                {(form.galeria || []).slice(0, 3).map((src, i) => (
                                    <div key={src} className="mv-foto" style={{ backgroundImage: `url(${src})` }}>
                                        {i === 0 ? <span>Imagem principal</span> : null}
                                    </div>
                                ))}
                                <label className="mv-add-foto">
                                    <Plus size={16} />
                                    Adicionar imagens
                                    <input type="file" accept="image/*" hidden onChange={(e) => addFoto(e.target.files?.[0])} />
                                </label>
                            </div>
                        </div>
                        <div className="mv-box">
                            <h3>Layout das Prateleiras</h3>
                            <div className="mv-layout" style={layoutStyle}>
                                {Array.from({ length: total || 1 }).map((_, i) => <b key={i} />)}
                            </div>
                            <div className="mv-layout-meta">
                                <span>{form.colunas || 0} colunas × {form.prateleiras || 0} prateleiras</span>
                                <button type="button" className="prd-btn" onClick={() => { setAba("prateleiras"); setLayoutAberto(true); }}>
                                    Editar layout
                                </button>
                            </div>
                        </div>
                        <div className="mv-box">
                            <h3>Ações Rápidas</h3>
                            <div className="mv-acoes-rapidas">
                                <button type="button" className="prd-btn" onClick={duplicar} disabled={!form.id}>
                                    Duplicar Móvel
                                </button>
                                <button type="button" className="prd-btn mv-btn-danger" onClick={excluir}>
                                    Excluir Móvel
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            ) : aba === "historico" ? (
                <div className="mv-painel-aba">
                    <h3>Histórico</h3>
                    <ul className="mv-hist">
                        {(form.historico || []).length === 0 ? <li>Sem registros.</li> : null}
                        {[...(form.historico || [])].reverse().map((h, i) => (
                            <li key={`${h.quando}-${i}`}>
                                {h.texto}
                                <small>{dataHora(h.quando)}</small>
                            </li>
                        ))}
                    </ul>
                    {form.id ? <HistoricoAuditoria entidade="MOVEL" registroId={form.id} /> : null}
                </div>
            ) : (
                <div className="mv-painel-aba">
                    {aba === "dimensoes" ? (
                        <div className="mv-tripla">
                            <label className="mv-campo"><span>Largura (cm)</span><input type="number" value={form.largura} onChange={(e) => alterar("largura", Number(e.target.value))} /></label>
                            <label className="mv-campo"><span>Altura (cm)</span><input type="number" value={form.altura} onChange={(e) => alterar("altura", Number(e.target.value))} /></label>
                            <label className="mv-campo"><span>Profundidade (cm)</span><input type="number" value={form.profundidade} onChange={(e) => alterar("profundidade", Number(e.target.value))} /></label>
                        </div>
                    ) : null}
                    {aba === "prateleiras" || aba === "divisorias" || layoutAberto ? (
                        <div className="mv-dupla">
                            <label className="mv-campo"><span>Colunas / divisórias</span><input type="number" min="1" value={form.colunas} onChange={(e) => alterar("colunas", Number(e.target.value))} /></label>
                            <label className="mv-campo"><span>Prateleiras (linhas)</span><input type="number" min="1" value={form.prateleiras} onChange={(e) => alterar("prateleiras", Number(e.target.value))} /></label>
                            <div className="mv-layout" style={{ ...layoutStyle, maxWidth: 360 }}>
                                {Array.from({ length: total || 1 }).map((_, i) => <b key={i} />)}
                            </div>
                        </div>
                    ) : null}
                    {aba === "materiais" ? (
                        <div className="mv-tripla">
                            <label className="mv-campo"><span>Cor</span><input value={form.cor} onChange={(e) => alterar("cor", e.target.value)} /></label>
                            <label className="mv-campo"><span>Borda</span><input value={form.borda} onChange={(e) => alterar("borda", e.target.value)} /></label>
                            <label className="mv-campo"><span>Material</span><input value={form.material} onChange={(e) => alterar("material", e.target.value)} /></label>
                        </div>
                    ) : null}
                    {aba === "imagens" ? (
                        <div className="mv-fotos">
                            {(form.galeria || []).map((src) => (
                                <div key={src} className="mv-foto" style={{ backgroundImage: `url(${src})` }} />
                            ))}
                            <label className="mv-add-foto">
                                <Plus size={16} /> Adicionar
                                <input type="file" accept="image/*" hidden onChange={(e) => addFoto(e.target.files?.[0])} />
                            </label>
                        </div>
                    ) : null}
                    {aba === "localizacao" ? (
                        <div className="mv-dupla">
                            <label className="mv-campo"><span>Loja</span><select value={form.loja} onChange={(e) => alterar("loja", e.target.value)}>{LOJAS_MOVEL.map((l) => <option key={l}>{l}</option>)}</select></label>
                            <label className="mv-campo"><span>Setor</span><select value={form.setor} onChange={(e) => alterar("setor", e.target.value)}>{SETORES_LOJA.map((s) => <option key={s}>{s}</option>)}</select></label>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
