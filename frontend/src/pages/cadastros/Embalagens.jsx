import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    Ban,
    Box,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Cylinder,
    Download,
    Eye,
    Mail,
    PackageCheck,
    PenLine,
    Plus,
    Scale,
    Link2,
    Search,
    Shapes,
    Trash2,
    Upload,
    X
} from "lucide-react";

import {
    dimensoesDe,
    FORMATOS_EMBALAGEM,
    gravarEmbalagens,
    importarEmbalagensCorreios,
    lerEmbalagens,
    ORIGENS_EMBALAGEM,
    pesoBr,
    removerEmbalagem,
    rotuloStatus,
    rotuloTipoProduto,
    STATUS_EMBALAGEM,
    textoVinculo,
    TIPOS_EMBALAGEM,
    upsertEmbalagem
} from "../../constants/embalagens";
import ROTAS from "../../constants/rotas";
import { listarProdutos } from "../../services/produto.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/maquinas.css";
import "../../styles/pages/embalagens.css";

const TAMANHOS = [14, 20, 50];

const CARDS = [
    { id: "todos", label: "Total de embalagens", icon: Box, tom: "azul" },
    { id: "ativa", label: "Ativas", icon: PackageCheck, tom: "verde" },
    { id: "inativa", label: "Inativas", icon: Ban, tom: "vermelho" }
];

function exportarCsv(lista) {
    const linhas = [["Código", "Descrição", "Tipo", "Origem", "Produto vinculado", "Dimensões", "Peso", "Situação"].join(";")];
    lista.forEach((item) => {
        linhas.push([
            item.codigo,
            item.nome,
            item.tipo,
            item.origem,
            textoVinculo(item),
            dimensoesDe(item),
            pesoBr(item.peso),
            rotuloStatus(item.status)
        ].map((v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`).join(";"));
    });
    const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "embalagens.csv";
    a.click();
    URL.revokeObjectURL(url);
}

export default function Embalagens() {
    const raiz = useRef(null);
    const [lista, setLista] = useState(lerEmbalagens);
    const [busca, setBusca] = useState("");
    const [card, setCard] = useState("todos");
    const [tipo, setTipo] = useState("");
    const [status, setStatus] = useState("");
    const [origem, setOrigem] = useState("");
    const [ordem, setOrdem] = useState("id");
    const [dir, setDir] = useState("asc");
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(14);
    const [aberto, setAberto] = useState(null);
    const [marcados, setMarcados] = useState([]);
    const [modal, setModal] = useState(null);
    const [aviso, setAviso] = useState("");
    const [produtos, setProdutos] = useState([]);

    useEffect(() => {
        function fechar(ev) {
            if (raiz.current && !raiz.current.contains(ev.target)) {
                setAberto(null);
            }
        }
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, []);

    useEffect(() => {
        let vivo = true;
        listarProdutos()
            .then((dados) => {
                if (vivo) {
                    setProdutos(Array.isArray(dados) ? dados : []);
                }
            })
            .catch(() => {
                if (vivo) {
                    setProdutos([]);
                }
            });
        return () => {
            vivo = false;
        };
    }, []);

    const visiveis = useMemo(() => {
        const termo = busca.toLowerCase().trim();
        let itens = lista.filter((item) => {
            if (card === "ativa" && item.status !== "ativa") {
                return false;
            }
            if (card === "inativa" && item.status !== "inativa") {
                return false;
            }
            if (tipo && item.tipo !== tipo) {
                return false;
            }
            if (status && item.status !== status) {
                return false;
            }
            if (origem && item.origem !== origem) {
                return false;
            }
            if (termo && ![item.codigo, item.nome, item.tipo, item.origem, dimensoesDe(item), textoVinculo(item)].join(" ").toLowerCase().includes(termo)) {
                return false;
            }
            return true;
        });
        itens = [...itens].sort((a, b) => {
            const numerico = ordem === "peso" || ordem === "comprimento" || ordem === "id";
            const va = numerico ? Number(a[ordem] || 0) : String(a[ordem] ?? "").toLowerCase();
            const vb = numerico ? Number(b[ordem] || 0) : String(b[ordem] ?? "").toLowerCase();
            if (va < vb) {
                return dir === "asc" ? -1 : 1;
            }
            if (va > vb) {
                return dir === "asc" ? 1 : -1;
            }
            return 0;
        });
        return itens;
    }, [lista, busca, card, tipo, status, origem, ordem, dir]);

    const tiposUnicos = useMemo(
        () => [...new Set(lista.map((item) => item.tipo).filter(Boolean))],
        [lista]
    );
    const pesoMedio = useMemo(() => {
        if (!lista.length) {
            return 0;
        }
        return lista.reduce((soma, item) => soma + Number(item.peso || 0), 0) / lista.length;
    }, [lista]);
    const contagens = useMemo(() => ({
        todos: lista.length,
        ativa: lista.filter((item) => item.status === "ativa").length,
        inativa: lista.filter((item) => item.status === "inativa").length
    }), [lista]);

    const totalPaginas = Math.max(1, Math.ceil(visiveis.length / porPagina));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const inicio = (paginaAtual - 1) * porPagina;
    const fatia = visiveis.slice(inicio, inicio + porPagina);
    const temFiltro = Boolean(busca || tipo || status || origem || card !== "todos");

    function ordenar(campo) {
        if (ordem === campo) {
            setDir((atual) => (atual === "asc" ? "desc" : "asc"));
            return;
        }
        setOrdem(campo);
        setDir("asc");
    }

    function salvar(dados, atual) {
        const { lista: nova } = upsertEmbalagem(lista, { ...atual, ...dados });
        setLista(nova);
        setModal(null);
    }

    function excluir(item) {
        if (!window.confirm(`Excluir ${item.nome}?`)) {
            return;
        }
        setLista(removerEmbalagem(lista, item.id));
        setMarcados((atual) => atual.filter((id) => id !== item.id));
    }

    function excluirLote() {
        if (!marcados.length) {
            return;
        }
        if (!window.confirm(`Excluir ${marcados.length} embalagem(ns)?`)) {
            return;
        }
        setLista(gravarEmbalagens(lista.filter((item) => !marcados.includes(item.id))));
        setMarcados([]);
        setAberto(null);
    }

    function criarCorreios() {
        const { lista: nova, incluidas } = importarEmbalagensCorreios(lista);
        setLista(nova);
        setAberto(null);
        setAviso(incluidas
            ? `${incluidas} embalagem(ns) dos Correios incluídas.`
            : "As embalagens dos Correios já estavam cadastradas.");
    }

    return (
        <div className="prd-page mq-page emb-page has-pager" ref={raiz}>
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <Link to="/contatos#/">Cadastros</Link>
                <span>›</span>
                <Link to={ROTAS.EMBALAGENS}>Embalagens</Link>
            </nav>

            <div className="fer-head">
                <div>
                    <h2>Embalagens de produtos</h2>
                    <p className="prd-sub">Cadastre e gerencie os tipos de embalagens que você utiliza nos seus produtos.</p>
                </div>
                <div className="ctt-acoes">
                    <button type="button" className="prd-btn" onClick={criarCorreios}>
                        <Upload size={16} />
                        Importar
                    </button>
                    <button type="button" className="prd-btn prd-btn-primary" onClick={() => setModal({})}>
                        <Plus size={16} />
                        Incluir embalagem
                    </button>
                    <div className="ctt-drop">
                        <button
                            type="button"
                            className={`prd-btn${aberto === "mais" ? " is-on" : ""}`}
                            onClick={() => setAberto(aberto === "mais" ? null : "mais")}
                        >
                            Mais ações
                            <ChevronDown size={14} />
                        </button>
                        {aberto === "mais" ? (
                            <div className="ctt-menu">
                                <button type="button" onClick={criarCorreios}>criar embalagens Correios</button>
                                <button type="button" onClick={() => { exportarCsv(visiveis); setAberto(null); }}>
                                    exportar para planilha
                                </button>
                                <button type="button" disabled={!marcados.length} onClick={excluirLote}>
                                    excluir selecionadas
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {aviso ? <p className="emb-aviso">{aviso}</p> : null}

            <div className="mq-cards emb-cards">
                {CARDS.map((c) => {
                    const Icone = c.icon;
                    return (
                        <button
                            key={c.id}
                            type="button"
                            className={`mq-card is-${c.tom}${card === c.id ? " is-active" : ""}`}
                            onClick={() => { setCard(c.id); setPagina(1); }}
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
                <div className="mq-card is-amarelo">
                    <span className="mq-card-ico" aria-hidden>
                        <Scale size={18} />
                    </span>
                    <span>
                        Peso médio
                        <strong>{pesoBr(pesoMedio)}</strong>
                    </span>
                </div>
                <div className="mq-card is-roxo">
                    <span className="mq-card-ico" aria-hidden>
                        <Shapes size={18} />
                    </span>
                    <span>
                        Tipos de embalagens
                        <strong>{tiposUnicos.length}</strong>
                        <small className="emb-card-sub">{tiposUnicos.join(" e ") || "—"}</small>
                    </span>
                </div>
            </div>

            <div className="fer-filtros prd-filtros">
                <label className="fer-search">
                    <Search size={15} />
                    <input
                        value={busca}
                        onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                        placeholder="Pesquisar por nome, código ou descrição..."
                    />
                    <button type="button" className="prd-limpar" onClick={() => setBusca("")} aria-label="Limpar busca">
                        <X size={14} />
                    </button>
                </label>

                <div className="ctt-drop">
                    <button type="button" className={`fer-chip${tipo ? " is-active" : ""}`} onClick={() => setAberto(aberto === "tipo" ? null : "tipo")}>
                        {tipo || "Todos os tipos"}
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "tipo" ? (
                        <div className="ctt-menu">
                            <button type="button" className={!tipo ? "is-sel" : ""} onClick={() => { setTipo(""); setAberto(null); }}>
                                Todas
                            </button>
                            {TIPOS_EMBALAGEM.map((t) => (
                                <button key={t} type="button" className={tipo === t ? "is-sel" : ""} onClick={() => { setTipo(t); setAberto(null); setPagina(1); }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="ctt-drop">
                    <button type="button" className={`fer-chip${status ? " is-active" : ""}`} onClick={() => setAberto(aberto === "status" ? null : "status")}>
                        {status ? rotuloStatus(status) : "Todos os status"}
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "status" ? (
                        <div className="ctt-menu">
                            <button type="button" className={!status ? "is-sel" : ""} onClick={() => { setStatus(""); setAberto(null); }}>
                                Todas
                            </button>
                            {STATUS_EMBALAGEM.map((s) => (
                                <button key={s.id} type="button" className={status === s.id ? "is-sel" : ""} onClick={() => { setStatus(s.id); setAberto(null); setPagina(1); }}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="ctt-drop">
                    <button type="button" className={`fer-chip${origem ? " is-active" : ""}`} onClick={() => setAberto(aberto === "origem" ? null : "origem")}>
                        {origem || "Origem"}
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "origem" ? (
                        <div className="ctt-menu">
                            <button type="button" className={!origem ? "is-sel" : ""} onClick={() => { setOrigem(""); setAberto(null); }}>
                                Todas
                            </button>
                            {ORIGENS_EMBALAGEM.map((o) => (
                                <button key={o} type="button" className={origem === o ? "is-sel" : ""} onClick={() => { setOrigem(o); setAberto(null); setPagina(1); }}>
                                    {o}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <button type="button" className="prd-btn" onClick={() => exportarCsv(visiveis)}>
                    <Download size={15} />
                    Exportar
                </button>

                <button
                    type="button"
                    className="idx-text"
                    disabled={!temFiltro}
                    onClick={() => { setBusca(""); setTipo(""); setStatus(""); setOrigem(""); setCard("todos"); }}
                >
                    Limpar filtros
                </button>
            </div>

            <div className="prd-scroll">
                <table className="fer-table prd-table mq-table">
                    <thead>
                        <tr>
                            <th className="ctt-check">
                                <input
                                    type="checkbox"
                                    checked={fatia.length > 0 && fatia.every((item) => marcados.includes(item.id))}
                                    onChange={() => {
                                        const ids = fatia.map((item) => item.id);
                                        const todos = ids.every((id) => marcados.includes(id));
                                        setMarcados(todos
                                            ? marcados.filter((id) => !ids.includes(id))
                                            : [...new Set([...marcados, ...ids])]);
                                    }}
                                    aria-label="Selecionar página"
                                />
                            </th>
                            {[
                                ["codigo", "Código"],
                                ["nome", "Descrição"],
                                ["tipo", "Tipo"],
                                ["comprimento", "Dimensões (C x L x A)"],
                                ["peso", "Peso"],
                                ["status", "Situação"]
                            ].map(([id, label]) => (
                                <th key={id}>
                                    <button type="button" onClick={() => ordenar(id)}>
                                        {label}
                                        <span className={ordem === id ? "is-on" : ""}>{ordem === id && dir === "desc" ? "▾" : "▴"}</span>
                                    </button>
                                </th>
                            ))}
                            <th className="prd-th-acoes">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fatia.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="ctt-vazio">
                                    Nenhuma embalagem cadastrada. Inclua um tipo ou importe as caixas dos Correios.
                                </td>
                            </tr>
                        ) : fatia.map((item) => (
                            <tr key={item.id} className={marcados.includes(item.id) ? "is-sel" : ""}>
                                <td className="ctt-check">
                                    <input
                                        type="checkbox"
                                        checked={marcados.includes(item.id)}
                                        onChange={() => setMarcados((atual) => (
                                            atual.includes(item.id) ? atual.filter((id) => id !== item.id) : [...atual, item.id]
                                        ))}
                                    />
                                </td>
                                <td className="emb-codigo">{item.codigo}</td>
                                <td>
                                    <button type="button" className="prd-nome" onClick={() => setModal(item)}>
                                        <span className={`mq-foto${classeTipo(item.tipo)}`} aria-hidden>
                                            {iconeTipo(item.tipo)}
                                        </span>
                                        <span>
                                            <strong className="prd-desc">{item.nome}</strong>
                                            {textoVinculo(item) ? (
                                                <small className="emb-vinculo-linha">{textoVinculo(item)}</small>
                                            ) : null}
                                        </span>
                                    </button>
                                </td>
                                <td>
                                    <span className={`emb-tipo${classeTipo(item.tipo)}`}>{item.tipo}</span>
                                </td>
                                <td>{dimensoesDe(item)}</td>
                                <td>{pesoBr(item.peso)}</td>
                                <td>
                                    <span className={`emb-sit is-${item.status}`}>
                                        <i />
                                        {rotuloStatus(item.status)}
                                    </span>
                                </td>
                                <td>
                                    <div className="prd-acoes">
                                        <button type="button" title="Visualizar" onClick={() => setModal(item)}>
                                            <Eye size={15} />
                                        </button>
                                        <button type="button" title="Editar" onClick={() => setModal(item)}>
                                            <PenLine size={15} />
                                        </button>
                                        <button type="button" title="Excluir" onClick={() => excluir(item)}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {visiveis.length > 0 ? (
                <div className="prd-foot">
                    <span>
                        Mostrando {inicio + 1} a {Math.min(inicio + porPagina, visiveis.length)} de {visiveis.length} embalagens
                    </span>
                    <div className="prd-foot-nav">
                        <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} aria-label="Página anterior">
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                            <button
                                key={n}
                                type="button"
                                className={paginaAtual === n ? "is-active" : ""}
                                onClick={() => setPagina(n)}
                            >
                                {n}
                            </button>
                        ))}
                        <button type="button" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} aria-label="Próxima página">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <label className="erp-pager-size">
                        <select value={porPagina} onChange={(e) => setPorPagina(Number(e.target.value))} aria-label="Itens por página">
                            {TAMANHOS.map((n) => (
                                <option key={n} value={n}>{n} por página</option>
                            ))}
                        </select>
                    </label>
                </div>
            ) : null}

            {modal ? (
                <ModalEmbalagem
                    embalagem={modal.id ? modal : null}
                    produtos={produtos}
                    fechar={() => setModal(null)}
                    salvar={(dados) => salvar(dados, modal.id ? modal : null)}
                />
            ) : null}
        </div>
    );
}

function classeTipo(tipo) {
    const t = String(tipo || "").toLowerCase();
    if (t.includes("envelope")) {
        return " is-env";
    }
    if (t.includes("rolo") || t.includes("cilindro")) {
        return " is-rolo";
    }
    return "";
}

function iconeTipo(tipo) {
    const t = String(tipo || "").toLowerCase();
    if (t.includes("envelope")) {
        return <Mail size={18} />;
    }
    if (t.includes("rolo") || t.includes("cilindro")) {
        return <Cylinder size={18} />;
    }
    return <Box size={18} />;
}

function parseMedida(valor) {
    const n = Number(String(valor ?? "").replace(",", ".").trim());
    return Number.isFinite(n) ? n : NaN;
}

function formatarMedida(valor) {
    if (valor === "" || valor == null) {
        return "";
    }
    const n = parseMedida(valor);
    if (!Number.isFinite(n)) {
        return valor;
    }
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function tipoCadastroDe(produto) {
    const informado = String(produto?.tipoCadastro || produto?.tipo || "").toLowerCase();
    if (["simples", "materia-prima", "kits", "variacoes", "fabricado"].includes(informado)) {
        return informado;
    }
    const grupo = String(produto?.grupo || produto?.categoria || "").toUpperCase();
    const nome = String(produto?.nome || "").toUpperCase();
    if (grupo === "ARTESANATO" || /MAT[EÉ]RIA/.test(grupo) || grupo === "INSUMO" || grupo === "INSUMOS") {
        return "materia-prima";
    }
    if (/\bKITS?\b/.test(nome) || grupo === "KIT" || grupo === "KITS") {
        return "kits";
    }
    if (produto?.produtoProducao || (Array.isArray(produto?.componentes) && produto.componentes.length)) {
        return "fabricado";
    }
    if (produto?.variacaoPaiId) {
        return "variacoes";
    }
    return "simples";
}

function produtosVinculaveis(lista) {
    return (lista || []).filter((item) => {
        const tipo = tipoCadastroDe(item);
        return tipo === "simples" || tipo === "materia-prima";
    });
}

function ModalEmbalagem({ embalagem, produtos = [], fechar, salvar }) {
    const [erro, setErro] = useState("");
    const [form, setForm] = useState({
        nome: embalagem?.nome || "",
        codigo: embalagem?.codigo || "",
        tipo: embalagem?.tipo || "Pacote / Caixa",
        origem: embalagem?.origem || "Própria",
        status: embalagem?.status || "ativa",
        comprimento: embalagem?.comprimento ? formatarMedida(embalagem.comprimento) : "",
        largura: embalagem?.largura ? formatarMedida(embalagem.largura) : "",
        altura: embalagem?.altura ? formatarMedida(embalagem.altura) : "",
        peso: embalagem != null && embalagem.peso !== "" && embalagem.peso != null
            ? formatarMedida(embalagem.peso)
            : "",
        produtoId: embalagem?.produtoId || "",
        produtoSku: embalagem?.produtoSku || "",
        produtoNome: embalagem?.produtoNome || "",
        produtoTipo: embalagem?.produtoTipo || ""
    });
    const [vincular, setVincular] = useState(Boolean(embalagem?.produtoId || embalagem?.produtoSku));

    const ehEnvelope = form.tipo === "Envelope";
    const ehRolo = form.tipo === "Rolo / Cilindro";

    function alterar(campo, valor) {
        setErro("");
        setForm((atual) => ({ ...atual, [campo]: valor }));
    }

    function escolherFormato(tipo) {
        setErro("");
        setForm((atual) => ({
            ...atual,
            tipo,
            altura: tipo === "Pacote / Caixa" ? atual.altura : ""
        }));
    }

    function enviar(e) {
        e.preventDefault();
        const codigo = String(form.codigo || "").trim();
        const nome = String(form.nome || "").trim();
        const comprimento = parseMedida(form.comprimento);
        const largura = parseMedida(form.largura);
        const altura = parseMedida(form.altura);
        const peso = parseMedida(form.peso);

        if (!codigo) {
            setErro("Informe o código da embalagem.");
            return;
        }
        if (!nome) {
            setErro("Informe a descrição da embalagem.");
            return;
        }
        if (!Number.isFinite(comprimento) || comprimento <= 0) {
            setErro("Informe o comprimento em centímetros.");
            return;
        }
        if (!Number.isFinite(largura) || largura <= 0) {
            setErro(ehRolo ? "Informe o diâmetro em centímetros." : "Informe a largura em centímetros.");
            return;
        }
        if (!ehEnvelope && !ehRolo && (!Number.isFinite(altura) || altura <= 0)) {
            setErro("Informe a altura em centímetros.");
            return;
        }
        if (form.peso === "" || !Number.isFinite(peso) || peso < 0) {
            setErro("Informe o peso máximo em quilos.");
            return;
        }
        if (vincular && !form.produtoId && !form.produtoSku) {
            setErro("Selecione um produto simples ou matéria-prima para vincular.");
            return;
        }

        salvar({
            ...form,
            codigo,
            nome,
            comprimento,
            largura,
            altura: ehEnvelope || ehRolo ? 0 : altura,
            peso,
            produtoId: vincular ? form.produtoId : "",
            produtoSku: vincular ? form.produtoSku : "",
            produtoNome: vincular ? form.produtoNome : "",
            produtoTipo: vincular ? form.produtoTipo : ""
        });
    }

    return (
        <div
            className="produto-modal-overlay emb-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    fechar();
                }
            }}
        >
            <form className="emb-modal" onSubmit={enviar}>
                <div className="emb-modal-head">
                    <span className="emb-modal-ico" aria-hidden>
                        <Box size={18} />
                    </span>
                    <div>
                        <h2>{embalagem ? "Editar embalagem" : "Nova embalagem"}</h2>
                        <p>Informe as medidas em centímetros e o peso máximo em quilos.</p>
                    </div>
                    <button type="button" className="emb-modal-x" onClick={fechar} aria-label="Fechar">
                        <X size={16} />
                    </button>
                </div>

                <div className="emb-modal-body">
                    {erro ? <p className="emb-modal-erro" role="alert">{erro}</p> : null}

                    <label className="emb-campo">
                        <span>Código <i>*</i></span>
                        <input
                            autoFocus
                            value={form.codigo}
                            onChange={(e) => alterar("codigo", e.target.value)}
                            placeholder="CX-001"
                        />
                    </label>

                    <label className="emb-campo">
                        <span>Descrição <i>*</i></span>
                        <input
                            value={form.nome}
                            onChange={(e) => alterar("nome", e.target.value)}
                            placeholder="Caixa de Encomenda CE - 01"
                        />
                    </label>

                    <div className="emb-modal-grid">
                        <label className="emb-campo">
                            <span>Tipo <i>*</i></span>
                            <select value={form.tipo} onChange={(e) => escolherFormato(e.target.value)}>
                                {TIPOS_EMBALAGEM.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </label>
                        <label className="emb-campo">
                            <span>Origem</span>
                            <select value={form.origem} onChange={(e) => alterar("origem", e.target.value)}>
                                {ORIGENS_EMBALAGEM.map((o) => (
                                    <option key={o} value={o}>{o}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <fieldset className="emb-formatos">
                        <legend>Formato da embalagem</legend>
                        <div className="emb-formatos-grid">
                            {FORMATOS_EMBALAGEM.map((fmt) => (
                                <button
                                    key={fmt.id}
                                    type="button"
                                    className={`emb-fmt${form.tipo === fmt.id ? " is-on" : ""}`}
                                    onClick={() => escolherFormato(fmt.id)}
                                    aria-pressed={form.tipo === fmt.id}
                                >
                                    <span className="emb-fmt-radio" aria-hidden />
                                    <span className="emb-fmt-fig" aria-hidden>
                                        {fmt.id === "Envelope" ? <IlustraEnvelope /> : null}
                                        {fmt.id === "Pacote / Caixa" ? <IlustraCaixa /> : null}
                                        {fmt.id === "Rolo / Cilindro" ? <IlustraRolo /> : null}
                                    </span>
                                    <strong>{fmt.nome}</strong>
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    <div className={`emb-modal-grid emb-medidas${ehRolo ? " is-rolo" : ""}${ehEnvelope ? " is-env" : ""}`}>
                        <CampoMedida
                            rotulo="Comprimento (C)"
                            valor={form.comprimento}
                            onChange={(v) => alterar("comprimento", v)}
                            placeholder="18,00"
                            unidade="cm"
                        />
                        {ehRolo ? (
                            <CampoMedida
                                rotulo="Diâmetro (D)"
                                valor={form.largura}
                                onChange={(v) => alterar("largura", v)}
                                placeholder="8,00"
                                unidade="cm"
                            />
                        ) : (
                            <CampoMedida
                                rotulo="Largura (L)"
                                valor={form.largura}
                                onChange={(v) => alterar("largura", v)}
                                placeholder="13,50"
                                unidade="cm"
                            />
                        )}
                        {!ehEnvelope && !ehRolo ? (
                            <CampoMedida
                                rotulo="Altura (A)"
                                valor={form.altura}
                                onChange={(v) => alterar("altura", v)}
                                placeholder="9,00"
                                unidade="cm"
                            />
                        ) : null}
                    </div>

                    <div className="emb-modal-grid">
                        <CampoMedida
                            rotulo="Peso máximo"
                            valor={form.peso}
                            onChange={(v) => alterar("peso", v)}
                            placeholder="0,36"
                            unidade="Kg"
                        />
                        <label className="emb-campo">
                            <span>Situação</span>
                            <span className={`emb-sit-select is-${form.status}`}>
                                <i />
                                <select value={form.status} onChange={(e) => alterar("status", e.target.value)}>
                                    {STATUS_EMBALAGEM.map((s) => (
                                        <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                </select>
                            </span>
                        </label>
                    </div>

                    <VinculoProduto
                        produtos={produtos}
                        vincular={vincular}
                        form={form}
                        onVincular={(ligado) => {
                            setErro("");
                            setVincular(ligado);
                            if (!ligado) {
                                setForm((atual) => ({
                                    ...atual,
                                    produtoId: "",
                                    produtoSku: "",
                                    produtoNome: "",
                                    produtoTipo: ""
                                }));
                            }
                        }}
                        onEscolher={(produto) => {
                            setErro("");
                            if (!produto?.id && !produto?.sku) {
                                setForm((atual) => ({
                                    ...atual,
                                    produtoId: "",
                                    produtoSku: "",
                                    produtoNome: "",
                                    produtoTipo: ""
                                }));
                                return;
                            }
                            const tipo = tipoCadastroDe(produto);
                            setForm((atual) => ({
                                ...atual,
                                produtoId: produto.id || "",
                                produtoSku: produto.sku || "",
                                produtoNome: produto.nome || "",
                                produtoTipo: tipo,
                                codigo: atual.codigo || produto.sku || "",
                                nome: atual.nome || produto.nome || ""
                            }));
                        }}
                    />
                </div>

                <div className="emb-modal-foot">
                    <button type="button" className="emb-btn-ghost" onClick={fechar}>Cancelar</button>
                    <button type="submit" className="emb-btn-pri">Salvar embalagem</button>
                </div>
            </form>
        </div>
    );
}

function VinculoProduto({ produtos, vincular, form, onVincular, onEscolher }) {
    const [busca, setBusca] = useState("");
    const [aberto, setAberto] = useState(false);
    const caixa = useRef(null);
    const candidatas = useMemo(() => produtosVinculaveis(produtos), [produtos]);
    const filtradas = useMemo(() => {
        const termo = busca.toLowerCase().trim();
        const lista = termo
            ? candidatas.filter((item) => [item.sku, item.nome, item.gtin, item.codigoBarras, item.grupo]
                .join(" ")
                .toLowerCase()
                .includes(termo))
            : candidatas;
        return lista.slice(0, 8);
    }, [candidatas, busca]);

    useEffect(() => {
        function fechar(ev) {
            if (caixa.current && !caixa.current.contains(ev.target)) {
                setAberto(false);
            }
        }
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, []);

    const selecionado = form.produtoId || form.produtoSku;

    return (
        <div className="emb-vinculo">
            <label className="emb-check">
                <input
                    type="checkbox"
                    checked={vincular}
                    onChange={(e) => {
                        onVincular(e.target.checked);
                        if (e.target.checked) {
                            setAberto(true);
                        } else {
                            setBusca("");
                            setAberto(false);
                        }
                    }}
                />
                Vincular a um produto simples ou matéria-prima
            </label>
            <p className="emb-vinculo-ajuda">
                Use o estoque desse produto (caixa, envelope ou bobina) nesta embalagem.
            </p>
            {vincular ? (
                selecionado ? (
                    <div className="emb-prod-sel">
                        <span className="emb-prod-sel-ico" aria-hidden>
                            <Link2 size={15} />
                        </span>
                        <span>
                            <strong>{form.produtoSku || "Sem SKU"}</strong>
                            {form.produtoNome || "Produto vinculado"}
                            {form.produtoTipo ? (
                                <em className={`emb-prod-tipo is-${form.produtoTipo}`}>
                                    {rotuloTipoProduto(form.produtoTipo)}
                                </em>
                            ) : null}
                        </span>
                        <button
                            type="button"
                            aria-label="Desvincular produto"
                            onClick={() => {
                                onVincular(true);
                                onEscolher({ id: "", sku: "", nome: "", tipoCadastro: "" });
                                setBusca("");
                                setAberto(true);
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="emb-prod-busca" ref={caixa}>
                        <label className="emb-campo">
                            <span>Produto <i>*</i></span>
                            <span className="emb-prod-input">
                                <Search size={14} />
                                <input
                                    value={busca}
                                    onChange={(e) => {
                                        setBusca(e.target.value);
                                        setAberto(true);
                                    }}
                                    onFocus={() => setAberto(true)}
                                    placeholder="Buscar por SKU ou nome"
                                    autoComplete="off"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (filtradas[0]) {
                                                onEscolher(filtradas[0]);
                                                setBusca("");
                                                setAberto(false);
                                            }
                                        }
                                    }}
                                />
                            </span>
                        </label>
                        {aberto ? (
                            <ul className="emb-prod-lista">
                                {filtradas.length === 0 ? (
                                    <li className="is-vazio">
                                        {candidatas.length === 0
                                            ? "Nenhum produto simples ou matéria-prima cadastrado."
                                            : "Nenhum produto encontrado."}
                                    </li>
                                ) : filtradas.map((item) => {
                                    const tipo = tipoCadastroDe(item);
                                    return (
                                        <li key={item.id || item.sku}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onEscolher(item);
                                                    setBusca("");
                                                    setAberto(false);
                                                }}
                                            >
                                                <strong>{item.sku || "—"}</strong>
                                                <span>{item.nome}</span>
                                                <em className={`emb-prod-tipo is-${tipo}`}>{rotuloTipoProduto(tipo)}</em>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : null}
                    </div>
                )
            ) : null}
        </div>
    );
}

function CampoMedida({ rotulo, valor, onChange, placeholder, unidade }) {
    return (
        <label className="emb-campo">
            <span>{rotulo} <i>*</i></span>
            <span className="emb-medida">
                <input
                    value={valor}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={() => onChange(formatarMedida(valor))}
                    inputMode="decimal"
                    placeholder={placeholder}
                />
                <em>{unidade}</em>
            </span>
        </label>
    );
}

function IlustraEnvelope() {
    return (
        <svg viewBox="0 0 140 108" fill="none" aria-hidden>
            <path d="M24 76V40" stroke="#c4a484" strokeWidth="1.5" />
            <path d="M21 40h6M21 76h6" stroke="#c4a484" strokeWidth="1.5" />
            <text x="12" y="62" fill="#9a7b5c" fontSize="11" fontWeight="700">L</text>
            <rect x="36" y="30" width="80" height="50" rx="3" fill="#f4d7b3" stroke="#d9b48a" strokeWidth="1.4" />
            <path d="M36 32.5 76 54.5 116 32.5" fill="#ead0ab" stroke="#d9b48a" strokeWidth="1.2" />
            <path d="M36 80h80" stroke="#c4a484" strokeWidth="1.5" />
            <path d="M40 83v4h72v-4" stroke="#c4a484" strokeWidth="1.5" />
            <text x="76" y="100" textAnchor="middle" fill="#9a7b5c" fontSize="11" fontWeight="700">C</text>
        </svg>
    );
}

function IlustraCaixa() {
    return (
        <svg viewBox="0 0 140 108" fill="none" aria-hidden>
            <path d="M24 78V44" stroke="#c4a484" strokeWidth="1.5" />
            <path d="M21 44h6M21 78h6" stroke="#c4a484" strokeWidth="1.5" />
            <text x="11" y="64" fill="#9a7b5c" fontSize="11" fontWeight="700">A</text>
            <path d="M46 72 72 58l42 10v30L72 88 46 102V72Z" fill="#e6b57e" />
            <path d="M72 58l42 10v30L72 88V58Z" fill="#c78d52" />
            <path d="M46 72 72 58l42 10-26 14-42-10Z" fill="#f3c892" />
            <path d="M72 58v30M46 72v30M114 68v30" stroke="#bf8448" strokeWidth="1.1" />
            <path d="M46 86h4" stroke="#c4a484" strokeWidth="1.5" />
            <path d="M50 90h40" stroke="#c4a484" strokeWidth="1.5" />
            <path d="M50 86v8M90 86v8" stroke="#c4a484" strokeWidth="1.5" />
            <text x="68" y="104" fill="#9a7b5c" fontSize="11" fontWeight="700">L</text>
            <path d="M118 42v28" stroke="#c4a484" strokeWidth="1.5" />
            <path d="M115 42h6M115 70h6" stroke="#c4a484" strokeWidth="1.5" />
            <text x="128" y="60" fill="#9a7b5c" fontSize="11" fontWeight="700">C</text>
        </svg>
    );
}

function IlustraRolo() {
    return (
        <svg viewBox="0 0 140 108" fill="none" aria-hidden>
            <path d="M24 76V42" stroke="#c4a484" strokeWidth="1.5" />
            <path d="M21 42h6M21 76h6" stroke="#c4a484" strokeWidth="1.5" />
            <text x="11" y="62" fill="#9a7b5c" fontSize="11" fontWeight="700">D</text>
            <ellipse cx="78" cy="40" rx="26" ry="11" fill="#f3c892" stroke="#d4a574" strokeWidth="1.4" />
            <path d="M52 40v34c0 6 12 11 26 11s26-5 26-11V40" fill="#e6b57e" stroke="#d4a574" strokeWidth="1.2" />
            <ellipse cx="78" cy="74" rx="26" ry="11" fill="#c78d52" stroke="#b8885a" strokeWidth="1.4" />
            <ellipse cx="78" cy="40" rx="11" ry="4.5" fill="#f8e4c8" stroke="#d4a574" />
            <path d="M52 86h52" stroke="#c4a484" strokeWidth="1.5" />
            <path d="M56 89v4h44v-4" stroke="#c4a484" strokeWidth="1.5" />
            <text x="78" y="104" textAnchor="middle" fill="#9a7b5c" fontSize="11" fontWeight="700">C</text>
        </svg>
    );
}
