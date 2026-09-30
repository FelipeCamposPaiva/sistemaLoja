import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    Ban,
    Box,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CirclePlay,
    Filter,
    MoreVertical,
    PenLine,
    Plus,
    Printer,
    Scissors,
    Search,
    Square,
    Wrench,
    X,
    Zap
} from "lucide-react";

import {
    gravarMaquinas,
    lerMaquinas,
    LOCAIS_MAQUINA,
    removerMaquina,
    rotuloStatus,
    STATUS_MAQUINA,
    TIPOS_MAQUINA,
    upsertMaquina
} from "../../constants/maquinas";
import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/maquinas.css";

const TAMANHOS = [10, 20, 50];

const CARDS = [
    { id: "todos", label: "Total de Máquinas", icon: Printer, tom: "azul" },
    { id: "operacao", label: "Em Operação", icon: CirclePlay, tom: "verde" },
    { id: "manutencao", label: "Em Manutenção", icon: Wrench, tom: "amarelo" },
    { id: "inativa", label: "Inativas", icon: Ban, tom: "vermelho" }
];

function iconeTipo(tipo) {
    if (tipo === "Plotter") {
        return Printer;
    }
    if (tipo === "Impressora 3D") {
        return Box;
    }
    if (tipo === "Laser") {
        return Zap;
    }
    if (tipo === "Prensa") {
        return Square;
    }
    if (tipo === "Corte") {
        return Scissors;
    }
    return Printer;
}

function dataBr(valor) {
    if (!valor) {
        return "-";
    }
    const [ano, mes, dia] = String(valor).split("-");
    if (!dia) {
        return valor;
    }
    return `${dia}/${mes}/${ano}`;
}

function horasBr(valor) {
    return `${Number(valor || 0).toLocaleString("pt-BR")}h`;
}

function textoDe(m) {
    return [m.nome, m.detalhe, m.tipo, m.modelo, m.marca, m.localizacao].join(" ").toLowerCase();
}

function exportarCsv(lista) {
    const linhas = [["Máquina", "Tipo", "Modelo", "Marca", "Localização", "Status", "Próx. Manutenção", "Horas de Uso"].join(";")];
    lista.forEach((m) => {
        linhas.push([
            m.nome, m.tipo, m.modelo, m.marca, m.localizacao, rotuloStatus(m.status), dataBr(m.proxManutencao), m.horasUso
        ].map((v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`).join(";"));
    });
    const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "maquinas.csv";
    a.click();
    URL.revokeObjectURL(url);
}

export default function Maquinas() {
    const raiz = useRef(null);
    const [lista, setLista] = useState(lerMaquinas);
    const [busca, setBusca] = useState("");
    const [card, setCard] = useState("todos");
    const [tipo, setTipo] = useState("");
    const [status, setStatus] = useState("");
    const [local, setLocal] = useState("");
    const [marca, setMarca] = useState("");
    const [rascunho, setRascunho] = useState({ marca: "" });
    const [ordem, setOrdem] = useState("nome");
    const [dir, setDir] = useState("asc");
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);
    const [aberto, setAberto] = useState(null);
    const [menuLinha, setMenuLinha] = useState(null);
    const [marcados, setMarcados] = useState([]);
    const [modal, setModal] = useState(null);

    useEffect(() => {
        function fechar(ev) {
            if (raiz.current && !raiz.current.contains(ev.target)) {
                setAberto(null);
                setMenuLinha(null);
            }
        }
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, []);

    const visiveis = useMemo(() => {
        const termo = busca.toLowerCase().trim();
        let itens = lista.filter((m) => {
            if (card !== "todos" && m.status !== card) {
                return false;
            }
            if (tipo && m.tipo !== tipo) {
                return false;
            }
            if (status && m.status !== status) {
                return false;
            }
            if (local && m.localizacao !== local) {
                return false;
            }
            if (marca && !(m.marca || "").toLowerCase().includes(marca.toLowerCase())) {
                return false;
            }
            if (termo && !textoDe(m).includes(termo)) {
                return false;
            }
            return true;
        });
        itens = [...itens].sort((a, b) => {
            const campo = ordem === "nome" ? "nome" : ordem;
            const va = a[campo] ?? "";
            const vb = b[campo] ?? "";
            const cmp = String(va).localeCompare(String(vb), "pt-BR", { numeric: true, sensitivity: "base" });
            return dir === "desc" ? -cmp : cmp;
        });
        return itens;
    }, [lista, busca, card, tipo, status, local, marca, ordem, dir]);

    const contagens = useMemo(() => ({
        todos: lista.length,
        operacao: lista.filter((m) => m.status === "operacao").length,
        manutencao: lista.filter((m) => m.status === "manutencao").length,
        inativa: lista.filter((m) => m.status === "inativa").length
    }), [lista]);

    const totalPaginas = Math.max(1, Math.ceil(visiveis.length / porPagina));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const inicio = (paginaAtual - 1) * porPagina;
    const fatia = visiveis.slice(inicio, inicio + porPagina);

    useEffect(() => {
        setPagina(1);
    }, [busca, card, tipo, status, local, marca, ordem, dir, porPagina]);

    const temFiltro = busca || card !== "todos" || tipo || status || local || marca;

    function limparFiltros() {
        setBusca("");
        setCard("todos");
        setTipo("");
        setStatus("");
        setLocal("");
        setMarca("");
        setRascunho({ marca: "" });
        setOrdem("nome");
        setDir("asc");
    }

    function ordenar(campo) {
        if (ordem === campo) {
            setDir((d) => (d === "asc" ? "desc" : "asc"));
            return;
        }
        setOrdem(campo);
        setDir("asc");
    }

    function toggleMarca(id) {
        setMarcados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
    }

    function marcarPagina(ev) {
        const ids = fatia.map((m) => m.id);
        if (ev.target.checked) {
            setMarcados((atual) => [...new Set([...atual, ...ids])]);
        } else {
            setMarcados((atual) => atual.filter((id) => !ids.includes(id)));
        }
    }

    function salvar(dados, editando) {
        const { lista: nova } = upsertMaquina(lista, { ...editando, ...dados });
        setLista(nova);
        setModal(null);
    }

    function excluir(maquina) {
        if (!window.confirm(`Excluir a máquina "${maquina.nome}"?`)) {
            return;
        }
        setLista(removerMaquina(lista, maquina.id));
        setMenuLinha(null);
        setMarcados((atual) => atual.filter((id) => id !== maquina.id));
    }

    function excluirLote() {
        if (!marcados.length) {
            return;
        }
        if (!window.confirm(`Excluir ${marcados.length} máquina(s)?`)) {
            return;
        }
        const nova = gravarMaquinas(lista.filter((m) => !marcados.includes(m.id)));
        setLista(nova);
        setMarcados([]);
        setAberto(null);
    }

    return (
        <div className="prd-page mq-page" ref={raiz}>
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <span>Cadastros</span>
                <span>›</span>
                <span>Máquinas</span>
            </nav>

            <div className="fer-head">
                <div>
                    <h2>Máquinas</h2>
                    <p className="prd-sub">Gerencie as máquinas, equipamentos e ferramentas da sua produção.</p>
                </div>
                <div className="ctt-acoes">
                    <button type="button" className="prd-btn prd-btn-primary" onClick={() => setModal({})}>
                        <Plus size={16} />
                        Incluir máquina
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
                                <button type="button" onClick={() => { exportarCsv(visiveis); setAberto(null); }}>
                                    exportar máquinas para planilha
                                </button>
                                <button type="button" onClick={() => { window.print(); setAberto(null); }}>
                                    imprimir
                                </button>
                                <button type="button" disabled={!marcados.length} onClick={excluirLote}>
                                    excluir selecionadas
                                </button>
                            </div>
                        ) : null}
                    </div>
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
                        placeholder="Pesquise por nome, modelo ou tipo..."
                    />
                    <button type="button" className="prd-limpar" onClick={() => setBusca("")} aria-label="Limpar busca">
                        <X size={14} />
                    </button>
                </label>

                <div className="ctt-drop">
                    <button type="button" className={`fer-chip${tipo ? " is-active" : ""}`} onClick={() => setAberto(aberto === "tipo" ? null : "tipo")}>
                        {tipo || "Tipo de máquina"}
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "tipo" ? (
                        <div className="ctt-menu">
                            <button type="button" className={!tipo ? "is-sel" : ""} onClick={() => { setTipo(""); setAberto(null); }}>
                                Todos os tipos
                            </button>
                            {TIPOS_MAQUINA.map((t) => (
                                <button key={t} type="button" className={tipo === t ? "is-sel" : ""} onClick={() => { setTipo(t); setAberto(null); }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="ctt-drop">
                    <button type="button" className={`fer-chip${status ? " is-active" : ""}`} onClick={() => setAberto(aberto === "status" ? null : "status")}>
                        {status ? rotuloStatus(status) : "Status"}
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "status" ? (
                        <div className="ctt-menu">
                            <button type="button" className={!status ? "is-sel" : ""} onClick={() => { setStatus(""); setAberto(null); }}>
                                Todos
                            </button>
                            {STATUS_MAQUINA.map((s) => (
                                <button key={s.id} type="button" className={status === s.id ? "is-sel" : ""} onClick={() => { setStatus(s.id); setAberto(null); }}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="ctt-drop">
                    <button type="button" className={`fer-chip${local ? " is-active" : ""}`} onClick={() => setAberto(aberto === "local" ? null : "local")}>
                        {local || "Localização"}
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "local" ? (
                        <div className="ctt-menu">
                            <button type="button" className={!local ? "is-sel" : ""} onClick={() => { setLocal(""); setAberto(null); }}>
                                Todas
                            </button>
                            {LOCAIS_MAQUINA.map((l) => (
                                <button key={l} type="button" className={local === l ? "is-sel" : ""} onClick={() => { setLocal(l); setAberto(null); }}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="ctt-drop">
                    <button
                        type="button"
                        className={`fer-chip${marca ? " is-active" : ""}`}
                        onClick={() => {
                            setRascunho({ marca });
                            setAberto(aberto === "filtros" ? null : "filtros");
                        }}
                    >
                        <Filter size={14} />
                        Filtros
                    </button>
                    {aberto === "filtros" ? (
                        <div className="ctt-menu ctt-menu-form">
                            <strong>Filtros</strong>
                            <label>
                                Marca
                                <input
                                    value={rascunho.marca}
                                    placeholder="Qualquer marca"
                                    onChange={(e) => setRascunho({ marca: e.target.value })}
                                />
                            </label>
                            <div className="ctt-menu-acoes">
                                <button type="button" className="prd-btn prd-btn-primary" onClick={() => { setMarca(rascunho.marca); setAberto(null); }}>
                                    aplicar
                                </button>
                                <button type="button" className="prd-btn" onClick={() => setAberto(null)}>
                                    cancelar
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                <button type="button" className="idx-text" onClick={limparFiltros} disabled={!temFiltro}>
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
                                    checked={fatia.length > 0 && fatia.every((m) => marcados.includes(m.id))}
                                    onChange={marcarPagina}
                                    aria-label="Selecionar página"
                                />
                            </th>
                            {[
                                ["nome", "Máquina"],
                                ["tipo", "Tipo"],
                                ["modelo", "Modelo"],
                                ["marca", "Marca"],
                                ["localizacao", "Localização"],
                                ["status", "Status"],
                                ["proxManutencao", "Próx. Manutenção"],
                                ["horasUso", "Horas de Uso"]
                            ].map(([id, label]) => (
                                <th key={id} className={id === "horasUso" ? "is-num" : ""}>
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
                                <td colSpan="10" className="ctt-vazio">
                                    Nenhuma máquina encontrada. Inclua um equipamento da produção.
                                </td>
                            </tr>
                        ) : fatia.map((m) => {
                            const Icone = iconeTipo(m.tipo);
                            return (
                                <tr key={m.id} className={marcados.includes(m.id) ? "is-sel" : ""}>
                                    <td className="ctt-check">
                                        <input
                                            type="checkbox"
                                            checked={marcados.includes(m.id)}
                                            onChange={() => toggleMarca(m.id)}
                                        />
                                    </td>
                                    <td>
                                        <button type="button" className="prd-nome" onClick={() => setModal(m)}>
                                            <span className="mq-foto" aria-hidden>
                                                <Icone size={18} />
                                            </span>
                                            <span>
                                                <strong className="prd-desc">{m.nome}</strong>
                                                <small className="prd-cat">{m.detalhe}</small>
                                            </span>
                                        </button>
                                    </td>
                                    <td>
                                        <span className={`mq-tipo is-${slugTipo(m.tipo)}`}>{m.tipo}</span>
                                    </td>
                                    <td>{m.modelo || "-"}</td>
                                    <td>{m.marca || "-"}</td>
                                    <td>{m.localizacao || "-"}</td>
                                    <td>
                                        <span className={`mq-st is-${m.status}`}>
                                            <i />
                                            {rotuloStatus(m.status)}
                                        </span>
                                    </td>
                                    <td>{dataBr(m.proxManutencao)}</td>
                                    <td className="is-num">{horasBr(m.horasUso)}</td>
                                    <td>
                                        <div className="prd-acoes">
                                            <button type="button" title="Editar" onClick={() => setModal(m)}>
                                                <PenLine size={15} />
                                            </button>
                                            <div className="ctt-row-menu">
                                                <button type="button" title="Mais" onClick={() => setMenuLinha(menuLinha === m.id ? null : m.id)}>
                                                    <MoreVertical size={15} />
                                                </button>
                                                {menuLinha === m.id ? (
                                                    <div className="ctt-menu is-row is-right">
                                                        <button type="button" onClick={() => { setModal(m); setMenuLinha(null); }}>
                                                            editar
                                                        </button>
                                                        <button type="button" onClick={() => excluir(m)}>
                                                            excluir
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {visiveis.length > 0 ? (
                <div className="prd-foot">
                    <span>
                        Mostrando {inicio + 1} a {Math.min(inicio + porPagina, visiveis.length)} de {visiveis.length} máquinas
                    </span>
                    <div className="prd-foot-nav">
                        <select value={porPagina} onChange={(e) => setPorPagina(Number(e.target.value))} aria-label="Itens por página">
                            {TAMANHOS.map((n) => (
                                <option key={n} value={n}>{n} por página</option>
                            ))}
                        </select>
                        <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} aria-label="Página anterior">
                            <ChevronLeft size={16} />
                        </button>
                        <button type="button" className="is-active">{paginaAtual}</button>
                        <button type="button" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} aria-label="Próxima página">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            ) : null}

            {modal ? (
                <ModalMaquina
                    maquina={modal.id ? modal : null}
                    fechar={() => setModal(null)}
                    salvar={(dados) => salvar(dados, modal.id ? modal : null)}
                />
            ) : null}
        </div>
    );
}

function slugTipo(tipo) {
    return String(tipo || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function ModalMaquina({ maquina, fechar, salvar }) {
    const [form, setForm] = useState({
        nome: maquina?.nome || "",
        detalhe: maquina?.detalhe || "",
        tipo: maquina?.tipo || "Impressora",
        modelo: maquina?.modelo || "",
        marca: maquina?.marca || "",
        localizacao: maquina?.localizacao || LOCAIS_MAQUINA[0],
        status: maquina?.status || "operacao",
        proxManutencao: maquina?.proxManutencao || "",
        horasUso: maquina?.horasUso ?? 0
    });

    function alterar(campo, valor) {
        setForm((atual) => ({ ...atual, [campo]: valor }));
    }

    function enviar(e) {
        e.preventDefault();
        if (!form.nome.trim()) {
            alert("Informe o nome da máquina.");
            return;
        }
        salvar(form);
    }

    return (
        <div
            className="produto-modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    fechar();
                }
            }}
        >
            <form className="produto-modal" onSubmit={enviar}>
                <div className="produto-modal-header">
                    <div>
                        <span>PRODUÇÃO</span>
                        <h2>{maquina ? "Editar máquina" : "Nova máquina"}</h2>
                        <p>Cadastre equipamentos da gráfica e da papelaria.</p>
                    </div>
                    <button type="button" className="modal-fechar" onClick={fechar}>×</button>
                </div>
                <div className="produto-modal-body">
                    <div className="campo-grande">
                        <label>Nome *</label>
                        <input autoFocus value={form.nome} onChange={(e) => alterar("nome", e.target.value)} placeholder="Ex.: Epson L1800" />
                    </div>
                    <div className="modal-grid">
                        <div>
                            <label>Descrição</label>
                            <input value={form.detalhe} onChange={(e) => alterar("detalhe", e.target.value)} placeholder="Impressora Fotográfica" />
                        </div>
                        <div>
                            <label>Tipo</label>
                            <select value={form.tipo} onChange={(e) => alterar("tipo", e.target.value)}>
                                {TIPOS_MAQUINA.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Modelo</label>
                            <input value={form.modelo} onChange={(e) => alterar("modelo", e.target.value)} />
                        </div>
                        <div>
                            <label>Marca</label>
                            <input value={form.marca} onChange={(e) => alterar("marca", e.target.value)} />
                        </div>
                        <div>
                            <label>Localização</label>
                            <select value={form.localizacao} onChange={(e) => alterar("localizacao", e.target.value)}>
                                {LOCAIS_MAQUINA.map((l) => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Status</label>
                            <select value={form.status} onChange={(e) => alterar("status", e.target.value)}>
                                {STATUS_MAQUINA.map((s) => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Próxima manutenção</label>
                            <input type="date" value={form.proxManutencao} onChange={(e) => alterar("proxManutencao", e.target.value)} />
                        </div>
                        <div>
                            <label>Horas de uso</label>
                            <input type="number" min="0" value={form.horasUso} onChange={(e) => alterar("horasUso", e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="produto-modal-footer">
                    <button type="button" className="btn-secundario" onClick={fechar}>Cancelar</button>
                    <button type="submit" className="btn-primary">
                        {maquina ? "Salvar alterações" : "Cadastrar máquina"}
                    </button>
                </div>
            </form>
        </div>
    );
}
