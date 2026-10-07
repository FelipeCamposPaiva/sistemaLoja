import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Ban,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CirclePlay,
    Filter,
    MoreVertical,
    PenLine,
    Plus,
    Printer,
    Search,
    Wrench,
    X
} from "lucide-react";

import {
    GRUPOS_TIPO,
    LOCAIS_MAQUINA,
    STATUS_MAQUINA,
    lerMaquinas,
    gravarMaquinas,
    removerMaquina,
    rotuloStatus,
    upsertMaquina
} from "../../constants/maquinas";
import ROTAS from "../../constants/rotas";
import { listarLocaisEstoque } from "../../services/estoqueLocais";
import { excluirMaquinaApi, listarMaquinas, salvarMaquina } from "../../services/maquina.service";
import MaquinaEditor from "./MaquinaEditor";
import { listarMarcas } from "../../services/marca.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/maquinas.css";

const TAMANHOS = [10, 20, 50];
const HIST_KEY = "erp-maquinas-kpi-hist";
const OS_EQUIP_KEY = "erp-os-equipamento";

const CARDS = [
    { id: "todos", label: "Total de Máquinas", icon: Printer, tom: "azul", cor: "#ff2f92" },
    { id: "operacao", label: "Em Operação", icon: CirclePlay, tom: "verde", cor: "#16a34a" },
    { id: "manutencao", label: "Em Manutenção", icon: Wrench, tom: "amarelo", cor: "#d97706" },
    { id: "inativa", label: "Inativas", icon: Ban, tom: "vermelho", cor: "#e11d48" }
];

function dataBr(valor) {
    if (!valor) {
        return "-";
    }
    const [ano, mes, dia] = String(valor).slice(0, 10).split("-");
    if (!dia) {
        return valor;
    }
    return `${dia}/${mes}/${ano}`;
}

function horasBr(valor) {
    return `${Number(valor || 0).toLocaleString("pt-BR")}h`;
}

function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function textoDe(m) {
    return [m.nome, m.detalhe, m.tipo, m.modelo, m.marca, m.localizacao, m.numeroSerie, m.notaFiscal].join(" ").toLowerCase();
}

function slugTipo(tipo) {
    return String(tipo || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
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

function atualizarVariacao(contagens) {
    const mes = new Date().toISOString().slice(0, 7);
    let hist = {};
    try {
        hist = JSON.parse(localStorage.getItem(HIST_KEY) || "{}");
    } catch {
        hist = {};
    }
    if (hist.atual?.mes && hist.atual.mes !== mes) {
        hist.anterior = hist.atual;
    }
    const base = hist.anterior;
    hist.atual = { mes, ...contagens };
    localStorage.setItem(HIST_KEY, JSON.stringify(hist));
    function pct(id) {
        if (!base) {
            return 0;
        }
        const antes = Number(base[id] || 0);
        const agora = Number(contagens[id] || 0);
        if (!antes) {
            return agora ? 100 : 0;
        }
        return Math.round(((agora - antes) / antes) * 100);
    }
    return {
        todos: pct("todos"),
        operacao: pct("operacao"),
        manutencao: pct("manutencao"),
        inativa: pct("inativa")
    };
}

function textoVar(id, pct) {
    const valor = Number(pct || 0);
    const sinal = valor > 0 ? "+" : "";
    const tom = valor > 0 ? "alta" : valor < 0 ? "baixa" : id === "manutencao" ? "amarelo" : id === "inativa" ? "vermelho" : "neutro";
    return { texto: `${sinal}${valor}% vs. mês anterior`, tom };
}

function Spark({ valores, cor }) {
    const pontos = valores.length >= 2 ? valores : [1, 1.4, 1.1, 1.8];
    const max = Math.max(...pontos);
    const min = Math.min(...pontos);
    const largura = 78;
    const altura = 32;
    const d = pontos.map((valor, indice) => {
        const x = (indice / Math.max(pontos.length - 1, 1)) * largura;
        const y = altura - 4 - ((valor - min) / (max - min || 1)) * (altura - 8);
        return `${indice ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return (
        <svg className="mq-spark" viewBox={`0 0 ${largura} ${altura}`} aria-hidden>
            <path d={d} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function Maquinas() {
    const navigate = useNavigate();
    const raiz = useRef(null);
    const [lista, setLista] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [aviso, setAviso] = useState("");
    const [noBanco, setNoBanco] = useState(false);
    const [marcas, setMarcas] = useState([]);
    const [locaisSistema, setLocaisSistema] = useState([]);
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
    const [vars, setVars] = useState({ todos: 0, operacao: 0, manutencao: 0, inativa: 0 });

    async function carregar() {
        setCarregando(true);
        const [maq, marc, locs] = await Promise.allSettled([
            listarMaquinas(),
            listarMarcas(),
            listarLocaisEstoque()
        ]);
        if (maq.status === "fulfilled") {
            setLista(maq.value);
            setNoBanco(true);
            setAviso("");
        } else {
            setLista(lerMaquinas());
            setNoBanco(false);
            setAviso("O cadastro está neste navegador. O banco de máquinas ainda não respondeu.");
        }
        setMarcas(marc.status === "fulfilled" ? marc.value : []);
        setLocaisSistema(locs.status === "fulfilled" ? locs.value : []);
        setCarregando(false);
    }

    useEffect(() => {
        carregar();
    }, []);

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

    const locais = useMemo(() => {
        const nomes = new Set(LOCAIS_MAQUINA);
        locaisSistema.forEach((item) => {
            const nome = String(item?.nome || "").trim();
            const codigo = String(item?.codigo || "").trim();
            if (nome && codigo) {
                nomes.add(`${nome} (${codigo})`);
            } else if (nome || codigo) {
                nomes.add(nome || codigo);
            }
        });
        lista.forEach((m) => {
            if (m.localizacao) {
                nomes.add(m.localizacao);
            }
        });
        return [...nomes];
    }, [locaisSistema, lista]);

    const marcasOpcoes = useMemo(() => {
        const nomes = new Set();
        marcas.forEach((item) => {
            if (item?.nome) {
                nomes.add(item.nome);
            }
        });
        lista.forEach((m) => {
            if (m.marca) {
                nomes.add(m.marca);
            }
        });
        return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [marcas, lista]);

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

    useEffect(() => {
        if (!carregando) {
            setVars(atualizarVariacao(contagens));
        }
    }, [carregando, contagens]);

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

    function serieDe(id) {
        const itens = id === "todos" ? lista : lista.filter((m) => m.status === id);
        return itens.map((m) => Number(m.horasUso || 0));
    }

    async function salvar(dados, editando) {
        const item = { ...(editando || {}), ...dados, horasUso: Number(dados.horasUso || 0) };
        if (noBanco) {
            try {
                const salva = await salvarMaquina(item);
                setLista((atual) => {
                    const idx = atual.findIndex((m) => String(m.id) === String(salva.id));
                    if (idx >= 0) {
                        return atual.map((m) => (String(m.id) === String(salva.id) ? salva : m));
                    }
                    return [salva, ...atual];
                });
                setModal(null);
                return;
            } catch (erro) {
                console.error(erro);
                setAviso("Não foi possível gravar no banco. A máquina ficou só neste navegador.");
                setNoBanco(false);
            }
        }
        const { lista: nova } = upsertMaquina(lista, item);
        setLista(nova);
        setModal(null);
    }

    async function excluir(maquina) {
        if (!window.confirm(`Excluir a máquina "${maquina.nome}"?`)) {
            return false;
        }
        if (noBanco && maquina.id) {
            try {
                await excluirMaquinaApi(maquina.id);
                setLista((atual) => atual.filter((m) => String(m.id) !== String(maquina.id)));
                setMenuLinha(null);
                setMarcados((atual) => atual.filter((id) => String(id) !== String(maquina.id)));
                return true;
            } catch (erro) {
                console.error(erro);
                setAviso("Não foi possível excluir no banco.");
                return false;
            }
        }
        setLista(removerMaquina(lista, maquina.id));
        setMenuLinha(null);
        setMarcados((atual) => atual.filter((id) => id !== maquina.id));
        return true;
    }

    async function excluirLote() {
        if (!marcados.length) {
            return;
        }
        if (!window.confirm(`Excluir ${marcados.length} máquina(s)?`)) {
            return;
        }
        if (noBanco) {
            try {
                await Promise.all(marcados.map((id) => excluirMaquinaApi(id)));
                setLista((atual) => atual.filter((m) => !marcados.map(String).includes(String(m.id))));
                setMarcados([]);
                setAberto(null);
                return;
            } catch (erro) {
                console.error(erro);
                setAviso("Não foi possível excluir a seleção no banco.");
                return;
            }
        }
        const nova = gravarMaquinas(lista.filter((m) => !marcados.includes(m.id)));
        setLista(nova);
        setMarcados([]);
        setAberto(null);
    }

    function abrirOs(maquina, nova) {
        const nome = maquina?.nome || "";
        if (nova) {
            sessionStorage.setItem(OS_EQUIP_KEY, nome);
            if (maquina?.id) {
                sessionStorage.setItem("erp-os-maquina-id", String(maquina.id));
            }
            const id = maquina?.id ? `&maquinaId=${encodeURIComponent(maquina.id)}` : "";
            navigate({
                pathname: ROTAS.ORDEM_SERVICO,
                search: `?equipamento=${encodeURIComponent(nome)}${id}`,
                hash: "add"
            });
            return;
        }
        navigate({
            pathname: ROTAS.ORDEM_SERVICO,
            search: nome ? `?equipamento=${encodeURIComponent(nome)}` : ""
        });
    }

    return (
        <div className="prd-page mq-page has-pager" ref={raiz}>
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <span>Cadastros</span>
                <span>›</span>
                <span>Máquinas</span>
            </nav>

            <div className="mq-head">
                <div className="mq-titulo">
                    <span className="mq-titulo-ico" aria-hidden>
                        <Printer size={20} />
                    </span>
                    <div>
                        <h2>Máquinas</h2>
                        <p className="prd-sub">Gerencie as máquinas, equipamentos e ferramentas da sua produção.</p>
                    </div>
                </div>
                <div className="mq-acoes">
                    <button type="button" className="mq-btn mq-btn-primary" onClick={() => setModal({})}>
                        <Plus size={16} />
                        Incluir máquina
                    </button>
                    <div className="ctt-drop">
                        <button
                            type="button"
                            className={`mq-btn${aberto === "mais" ? " is-on" : ""}`}
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
                                <button type="button" onClick={() => navigate(ROTAS.PAINEL_PRODUCAO)}>
                                    abrir painel de produção
                                </button>
                                <button type="button" onClick={() => abrirOs(null, false)}>
                                    abrir ordens de serviço
                                </button>
                                <button type="button" onClick={() => navigate(ROTAS.BALANCO_PATRIMONIAL)}>
                                    abrir patrimônio
                                </button>
                                <button type="button" disabled={!marcados.length} onClick={excluirLote}>
                                    excluir selecionadas
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {aviso ? <p className="mq-aviso">{aviso}</p> : null}

            <div className="mq-cards">
                {CARDS.map((c) => {
                    const Icone = c.icon;
                    const variacao = textoVar(c.id, vars[c.id]);
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
                                <span className="mq-kpi-txt">
                                    {c.label}
                                    <strong>{contagens[c.id]}</strong>
                                    <em className={`mq-var is-${variacao.tom}`}>{variacao.texto}</em>
                                </span>
                                <Spark valores={serieDe(c.id)} cor={c.cor} />
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
                        placeholder="Pesquise por nome, modelo, marca ou localização..."
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
                            {GRUPOS_TIPO.map((grupo) => (
                                <div key={grupo.grupo}>
                                    <div className="mq-menu-rotulo">{grupo.grupo}</div>
                                    {grupo.itens.map((t) => (
                                        <button key={t} type="button" className={tipo === t ? "is-sel" : ""} onClick={() => { setTipo(t); setAberto(null); }}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
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
                            {locais.map((l) => (
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
                                Marca do cadastro
                                <select value={rascunho.marca} onChange={(e) => setRascunho({ marca: e.target.value })}>
                                    <option value="">Qualquer marca</option>
                                    {marcasOpcoes.map((nome) => (
                                        <option key={nome} value={nome}>{nome}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="ctt-menu-acoes">
                                <button type="button" className="mq-btn mq-btn-primary" onClick={() => { setMarca(rascunho.marca); setAberto(null); }}>
                                    aplicar
                                </button>
                                <button type="button" className="mq-btn" onClick={() => setAberto(null)}>
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

            <div className="mq-painel">
                <div className="prd-scroll">
                    <table className="fer-table prd-table mq-table">
                        <thead>
                            <tr>
                                <th className="ctt-check">
                                    <input
                                        type="checkbox"
                                        checked={fatia.length > 0 && fatia.every((m) => marcados.includes(m.id))}
                                        onChange={(ev) => {
                                            const ids = fatia.map((m) => m.id);
                                            if (ev.target.checked) {
                                                setMarcados((atual) => [...new Set([...atual, ...ids])]);
                                            } else {
                                                setMarcados((atual) => atual.filter((id) => !ids.includes(id)));
                                            }
                                        }}
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
                            {carregando ? (
                                <tr>
                                    <td colSpan="10" className="ctt-vazio">Carregando máquinas...</td>
                                </tr>
                            ) : fatia.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="ctt-vazio">
                                        Nenhuma máquina encontrada. Inclua um equipamento da produção.
                                    </td>
                                </tr>
                            ) : fatia.map((m) => (
                                <tr key={m.id} className={marcados.includes(m.id) ? "is-sel" : ""}>
                                    <td className="ctt-check">
                                        <input
                                            type="checkbox"
                                            checked={marcados.includes(m.id)}
                                            onChange={() => setMarcados((atual) => (atual.includes(m.id) ? atual.filter((x) => x !== m.id) : [...atual, m.id]))}
                                        />
                                    </td>
                                    <td>
                                        <button type="button" className="prd-nome" onClick={() => setModal(m)}>
                                            <span className="mq-foto" aria-hidden>
                                                {m.fotoCapa ? <img src={m.fotoCapa} alt="" /> : <Printer size={18} />}
                                            </span>
                                            <span>
                                                <strong className="prd-desc">{m.nome}</strong>
                                                <small className="prd-cat">{m.detalhe}</small>
                                                {Number(m.valorCompra) > 0 ? <small className="prd-cat">{moeda(m.valorCompra)}</small> : null}
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
                                    <td>
                                        {m.status === "manutencao" && m.previsaoRetorno ? (
                                            <span className="mq-retorno">{dataBr(m.previsaoRetorno)}<small>retorno</small></span>
                                        ) : dataBr(m.proxManutencao)}
                                    </td>
                                    <td className="is-num">{horasBr(m.horasUso)}</td>
                                    <td>
                                        <div className="prd-acoes">
                                            <button type="button" className="mq-ico" title="Editar" onClick={() => setModal(m)}>
                                                <PenLine size={15} />
                                            </button>
                                            <div className="ctt-row-menu">
                                                <button type="button" className="mq-ico" title="Mais" onClick={() => setMenuLinha(menuLinha === m.id ? null : m.id)}>
                                                    <MoreVertical size={15} />
                                                </button>
                                                {menuLinha === m.id ? (
                                                    <div className="ctt-menu is-row is-right">
                                                        <button type="button" onClick={() => { setModal(m); setMenuLinha(null); }}>
                                                            editar
                                                        </button>
                                                        <button type="button" onClick={() => abrirOs(m, true)}>
                                                            nova ordem de serviço
                                                        </button>
                                                        <button type="button" onClick={() => abrirOs(m, false)}>
                                                            ver ordens desta máquina
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
                            ))}
                        </tbody>
                    </table>
                </div>

                {visiveis.length > 0 ? (
                    <div className="prd-foot">
                        <span>
                            Mostrando {inicio + 1} a {Math.min(inicio + porPagina, visiveis.length)} de {visiveis.length} máquinas
                        </span>
                        <div className="prd-foot-nav">
                            <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} aria-label="Página anterior">
                                <ChevronLeft size={16} />
                            </button>
                            <button type="button" className="is-active">{paginaAtual}</button>
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
            </div>

            {modal ? (
                <MaquinaEditor
                    maquina={modal.id ? modal : null}
                    locais={locais}
                    marcas={marcasOpcoes}
                    online={noBanco}
                    fechar={() => setModal(null)}
                    excluir={async () => {
                        if (modal.id && await excluir(modal)) {
                            setModal(null);
                        }
                    }}
                    abrirOs={(nova) => abrirOs(modal.id ? modal : null, Boolean(nova))}
                    aoSalvo={async (local) => {
                        if (local) {
                            await salvar(local, modal.id ? modal : null);
                            return;
                        }
                        try {
                            setLista(await listarMaquinas());
                        } catch {
                            setAviso("A máquina foi salva, mas a lista não atualizou.");
                        }
                        setModal(null);
                    }}
                />
            ) : null}
        </div>
    );
}
