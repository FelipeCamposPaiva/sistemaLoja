import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    CalendarDays,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Columns3,
    FileSpreadsheet,
    FileText,
    MoreHorizontal,
    Printer,
    Search,
    SlidersHorizontal,
    Tag,
    Trash2,
    X
} from "lucide-react";

import {
    COLUNAS_OS,
    MESES,
    SITUACOES,
    abaDaSituacao,
    dataBr,
    isoDate,
    moeda,
    nomesTecnicos,
    situacaoMeta
} from "../../../constants/ordensServico";
import { listarTecnicos } from "../../../constants/tecnicos";
import { registrarOsCaixa } from "../../../services/caixa.service";
import {
    atualizarOS,
    atualizarStatusOS,
    excluirOS,
    importarOSLote,
    listarOS
} from "../../../services/os.service";
import { lerArquivoOS, lerPlanilhaOS, mesclarLeiturasOS } from "../../../services/osImport.service";
import ROTAS from "../../../constants/rotas";
import { lerContatos } from "../../../constants/contatos";
import ImportadorMassa from "../../cadastros/ImportadorMassa";
import NovaOS from "./NovaOS";

import "../../../styles/layout/app-shell.css";
import "../../../styles/pages/indice.css";
import "../../../styles/pages/ferramentas.css";
import "../../../styles/pages/clientes.css";
import "../../../styles/pages/produtos.css";
import "../../../styles/pages/os.css";

const COLUNAS_KEY = "erp-os-colunas-v3";
const COLUNAS_PADRAO = ["numero", "data", "prevista", "conclusao", "cliente", "fantasia", "total", "equipamento", "marcadores", "integracoes"];
const TAMANHOS_PAGINA = [20, 50, 100];
const HOJE = new Date();

function periodoPadrao() {
    return {
        modo: "nenhum",
        campo: "entrada",
        mes: HOJE.getMonth(),
        ano: HOJE.getFullYear(),
        dia: isoDate(HOJE),
        de: isoDate(HOJE),
        ate: isoDate(HOJE)
    };
}

function dataCampo(os, campo) {
    if (campo === "prevista") {
        return os.dataPrevisao;
    }
    if (campo === "conclusao") {
        return os.dataConclusao;
    }
    return os.dataAbertura;
}

function passaPeriodo(os, periodo) {
    if (periodo.modo === "nenhum") {
        return true;
    }
    const iso = isoDate(dataCampo(os, periodo.campo));
    if (!iso) {
        return false;
    }
    if (periodo.modo === "mes") {
        const d = new Date(`${iso}T12:00:00`);
        return d.getMonth() === periodo.mes && d.getFullYear() === periodo.ano;
    }
    if (periodo.modo === "dia") {
        return iso === periodo.dia;
    }
    if (periodo.modo === "intervalo") {
        return iso >= periodo.de && iso <= periodo.ate;
    }
    return true;
}

function rotuloPeriodo(periodo) {
    if (periodo.modo === "nenhum") {
        return "por período";
    }
    if (periodo.modo === "dia") {
        return dataBr(periodo.dia);
    }
    if (periodo.modo === "intervalo") {
        return "intervalo";
    }
    return MESES[periodo.mes];
}

function mudarMes(periodo, delta) {
    const d = new Date(periodo.ano, periodo.mes + delta, 1);
    return { ...periodo, mes: d.getMonth(), ano: d.getFullYear() };
}

function mudarDia(periodo, delta) {
    const d = new Date(`${periodo.dia || isoDate(HOJE)}T12:00:00`);
    d.setDate(d.getDate() + delta);
    return { ...periodo, dia: isoDate(d) };
}

function colunasSalvas() {
    try {
        const bruto = JSON.parse(localStorage.getItem(COLUNAS_KEY) || "null");
        if (Array.isArray(bruto) && bruto.length) {
            return bruto;
        }
    } catch {
        /* ignore */
    }
    return [...COLUNAS_PADRAO];
}

function faixasPagina(atual, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => ({ tipo: "pagina", n: i + 1 }));
    }
    let de = 2;
    let ate = 5;
    if (atual > 4 && atual < total - 3) {
        de = atual - 1;
        ate = atual + 1;
    } else if (atual >= total - 3) {
        de = Math.max(2, total - 4);
        ate = total - 1;
    }
    const itens = [{ tipo: "pagina", n: 1 }];
    if (de > 2) {
        itens.push({ tipo: "reticencias", id: "antes" });
    }
    for (let n = de; n <= ate; n += 1) {
        itens.push({ tipo: "pagina", n });
    }
    if (ate < total - 1) {
        itens.push({ tipo: "reticencias", id: "depois" });
    }
    itens.push({ tipo: "pagina", n: total });
    return itens;
}

function valorOrdem(os, campo) {
    if (campo === "numero") {
        const n = Number(String(os.numero || os.id || "").replace(/\D/g, ""));
        return Number.isFinite(n) ? n : 0;
    }
    if (campo === "data") {
        return isoDate(os.dataAbertura) || "";
    }
    if (campo === "prevista") {
        return isoDate(os.dataPrevisao) || "";
    }
    if (campo === "conclusao") {
        return isoDate(os.dataConclusao) || "";
    }
    if (campo === "total") {
        return Number(os.valor || 0);
    }
    if (campo === "cliente") {
        return String(os.cliente || "").toLowerCase();
    }
    if (campo === "fantasia") {
        return String(os.fantasia || "").toLowerCase();
    }
    if (campo === "equipamento") {
        return String(os.equipamento || "").toLowerCase();
    }
    if (campo === "marcadores") {
        return String(os.marcadores || "").toLowerCase();
    }
    if (campo === "tecnicos") {
        return nomesTecnicos(os).toLowerCase();
    }
    if (campo === "setor") {
        return String(os.setorAtual || os.status || "").toLowerCase();
    }
    return "";
}

function exportarCsv(lista) {
    const linhas = [["Número", "Data", "Data prevista", "Conclusão", "Cliente", "Fantasia", "Total", "Equipamento", "Marcadores", "Situação"].join(";")];
    lista.forEach((os) => {
        linhas.push([
            os.numero, dataBr(os.dataAbertura), dataBr(os.dataPrevisao), dataBr(os.dataConclusao),
            os.cliente, os.fantasia, moeda(os.valor), os.equipamento, os.marcadores, situacaoMeta(os.status).label
        ].map((v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`).join(";"));
    });
    const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ordens-de-servico.csv";
    a.click();
    URL.revokeObjectURL(url);
}

export default function OrdemServico() {
    const { hash } = useLocation();
    if (hash === "#add" || hash.startsWith("#add")) {
        return <NovaOS />;
    }
    const editar = String(hash).match(/^#edit\/([^/?#]+)/);
    if (editar) {
        return <NovaOS id={decodeURIComponent(editar[1])} />;
    }
    return <ListaOS />;
}

function ListaOS() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const raiz = useRef(null);
    const xlsRef = useRef(null);
    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState("");
    const [aba, setAba] = useState("todas");
    const [periodo, setPeriodo] = useState(periodoPadrao);
    const [rascunhoPeriodo, setRascunhoPeriodo] = useState(periodoPadrao);
    const [aberto, setAberto] = useState(null);
    const [colunas, setColunas] = useState(colunasSalvas);
    const [rascunhoColunas, setRascunhoColunas] = useState(colunasSalvas);
    const [marcados, setMarcados] = useState([]);
    const [aviso, setAviso] = useState("");
    const [filtros, setFiltros] = useState({ marcador: "", tecnico: "" });
    const [rascunho, setRascunho] = useState({ marcador: "", tecnico: "" });
    const [importando, setImportando] = useState(false);
    const [importadorMassa, setImportadorMassa] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(50);
    const [ordem, setOrdem] = useState({ campo: "numero", dir: "desc" });

    async function carregar() {
        setLoading(true);
        try {
            setLista(await listarOS());
        } catch (erro) {
            console.error(erro);
            setLista([]);
            setAviso("Não foi possível ler as ordens de serviço do banco.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    useEffect(() => {
        setPagina(1);
    }, [busca, aba, periodo, filtros, porPagina]);

    useEffect(() => {
        const equipamento = params.get("equipamento");
        if (equipamento) {
            setBusca(equipamento);
        }
        const id = params.get("contato");
        if (!id) {
            return;
        }
        const contato = lerContatos().find((item) => String(item.id) === String(id));
        if (contato?.nome) {
            setBusca(contato.nome);
        }
    }, [params]);

    useEffect(() => {
        function fechar(ev) {
            if (raiz.current && !raiz.current.contains(ev.target)) {
                setAberto((atual) => (atual === "colunas" ? atual : null));
            }
        }
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, []);

    const baseFiltrada = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return lista.filter((os) => {
            if (!passaPeriodo(os, periodo)) {
                return false;
            }
            if (filtros.marcador === "sem" && String(os.marcadores || "").trim()) {
                return false;
            }
            if (filtros.marcador && filtros.marcador !== "sem" && filtros.marcador !== "nenhum"
                && !(os.marcadores || "").toLowerCase().includes(filtros.marcador.toLowerCase())) {
                return false;
            }
            if (filtros.tecnico) {
                const blobTec = [os.vendedor, nomesTecnicos(os)].join(" ").toLowerCase();
                if (!blobTec.includes(filtros.tecnico.toLowerCase())) {
                    return false;
                }
            }
            if (termo) {
                const blob = [os.cliente, os.fantasia, os.numero, os.descricao, os.equipamento, os.marcadores, nomesTecnicos(os)].join(" ").toLowerCase();
                if (!blob.includes(termo)) {
                    return false;
                }
            }
            return true;
        });
    }, [lista, busca, periodo, filtros]);

    const contagens = useMemo(() => {
        const base = Object.fromEntries(SITUACOES.map((s) => [s.id, 0]));
        baseFiltrada.forEach((os) => {
            base.todas += 1;
            const id = abaDaSituacao(os.status);
            base[id] = (base[id] || 0) + 1;
        });
        return base;
    }, [baseFiltrada]);

    const visiveis = useMemo(() => {
        return baseFiltrada.filter((os) => aba === "todas" || abaDaSituacao(os.status) === aba);
    }, [baseFiltrada, aba]);

    const ordenadas = useMemo(() => {
        const fator = ordem.dir === "asc" ? 1 : -1;
        return [...visiveis].sort((a, b) => {
            const va = valorOrdem(a, ordem.campo);
            const vb = valorOrdem(b, ordem.campo);
            if (va < vb) {
                return -1 * fator;
            }
            if (va > vb) {
                return 1 * fator;
            }
            return 0;
        });
    }, [visiveis, ordem]);

    const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / porPagina));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const fatia = ordenadas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);

    const temFiltro = busca || periodo.modo !== "nenhum" || filtros.marcador || filtros.tecnico || aba !== "todas";

    function visivel(id) {
        return colunas.includes(id);
    }

    function limparFiltros() {
        setBusca("");
        setAba("todas");
        const limpo = { ...periodoPadrao(), modo: "nenhum" };
        setPeriodo(limpo);
        setRascunhoPeriodo(limpo);
        setFiltros({ marcador: "", tecnico: "" });
        setRascunho({ marcador: "", tecnico: "" });
    }

    function toggleMarca(id) {
        setMarcados((atual) => atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]);
    }

    function marcarPagina(ev) {
        const ids = fatia.map((os) => os.id);
        if (ev.target.checked) {
            setMarcados((atual) => [...new Set([...atual, ...ids])]);
            return;
        }
        setMarcados((atual) => atual.filter((id) => !ids.includes(id)));
    }

    function alternarOrdem(campo) {
        setOrdem((atual) => (
            atual.campo === campo
                ? { campo, dir: atual.dir === "asc" ? "desc" : "asc" }
                : { campo, dir: campo === "numero" || campo === "data" || campo === "total" ? "desc" : "asc" }
        ));
    }

    async function aplicarStatus(status) {
        const ids = marcados.length ? marcados : [];
        if (!ids.length) {
            return;
        }
        await Promise.all(ids.map((id) => atualizarStatusOS(id, status).catch(() => null)));
        setMarcados([]);
        setAberto(null);
        await carregar();
    }

    async function excluirMarcadas() {
        if (!marcados.length) {
            return;
        }
        if (!window.confirm(`Excluir ${marcados.length} ordem(ns) de serviço?`)) {
            return;
        }
        await Promise.all(marcados.map((id) => excluirOS(id).catch(() => null)));
        setMarcados([]);
        setAberto(null);
        await carregar();
    }

    async function importarExcel(arquivo) {
        if (!arquivo) {
            return;
        }
        setImportando(true);
        try {
            const itens = await lerPlanilhaOS(arquivo);
            if (!itens.length) {
                setAviso("A planilha não tem ordens com número ou cliente.");
                return;
            }
            const resumo = await importarOSLote(itens);
            await carregar();
            const falhas = resumo.erros ? `, ${resumo.erros} com erro` : "";
            setAviso(`${arquivo.name}: ${resumo.novos} novas, ${resumo.atualizados} atualizadas${falhas}.`);
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível importar a planilha.");
        } finally {
            setImportando(false);
            setAberto(null);
            if (xlsRef.current) {
                xlsRef.current.value = "";
            }
        }
    }

    function imprimir() {
        window.print();
        setAberto(null);
    }

    if (loading) {
        return (
            <div className="os-page">
                <p>Carregando ordens de serviço...</p>
            </div>
        );
    }

    const selecionadas = lista.filter((os) => marcados.includes(os.id));
    const totalSel = selecionadas.reduce((acc, os) => acc + Number(os.valor || 0), 0);
    const totalVis = visiveis.reduce((acc, os) => acc + Number(os.valor || 0), 0);

    return (
        <div className="os-page has-pager" ref={raiz}>
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>serviços</span>
                <span>›</span>
                <span>ordens de serviço</span>
            </nav>

            <div className="fer-head">
                <div>
                    <h2>Ordens de serviço</h2>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    <button type="button" className="os-ghost" onClick={imprimir}>
                        <Printer size={15} />
                        imprimir
                    </button>
                    <button type="button" className="prd-btn prd-btn-primary" onClick={() => navigate({ pathname: ROTAS.ORDEM_SERVICO, hash: "add" })}>
                        incluir ordem de serviço
                    </button>
                    <div className="ctt-drop">
                        <button
                            type="button"
                            className={`os-ghost${aberto === "mais" ? " is-on" : ""}`}
                            onClick={() => setAberto(aberto === "mais" ? null : "mais")}
                        >
                            mais ações
                            <MoreHorizontal size={16} />
                        </button>
                        {aberto === "mais" ? (
                            <div className="ctt-menu is-right">
                                <button type="button" onClick={imprimir}>
                                    <Printer size={14} /> imprimir relatório
                                </button>
                                <button type="button" onClick={() => { navigate(ROTAS.TECNICOS); setAberto(null); }}>
                                    técnicos
                                </button>
                                <button type="button" onClick={() => { navigate(ROTAS.RELATORIO_TECNICOS); setAberto(null); }}>
                                    relatório por técnico
                                </button>
                                <button type="button" onClick={() => { navigate("/ordem_servicos/exportar"); setAberto(null); }}>
                                    <FileSpreadsheet size={14} /> exportar ordens de serviço para planilha
                                </button>
                                <button type="button" disabled={importando} onClick={() => { xlsRef.current?.click(); setAberto(null); }}>
                                    <FileSpreadsheet size={14} /> {importando ? "importando planilha…" : "importar planilha Olist (.xls)"}
                                </button>
                                <button type="button" disabled={importando} onClick={() => { setImportadorMassa(true); setAberto(null); }}>
                                    <FileSpreadsheet size={14} /> importar em massa (vários Excel)
                                </button>
                                <button type="button" onClick={() => { navigate("/ferramentas/importar/os"); setAberto(null); }}>
                                    <FileSpreadsheet size={14} /> baixar layout / ver exemplo
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <input
                ref={xlsRef}
                type="file"
                accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                hidden
                onChange={(e) => importarExcel(e.target.files?.[0])}
            />

            <div className="os-toolbar">
                <label className="fer-search">
                    <Search size={15} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Pesquise por cliente, nº da ordem ou nº da série"
                    />
                </label>
                <div className="ctt-drop">
                    <button
                        type="button"
                        className={`os-chip${periodo.modo !== "nenhum" ? " is-on" : ""}`}
                        onClick={() => {
                            setRascunhoPeriodo(periodo);
                            setAberto(aberto === "mes" ? null : "mes");
                        }}
                    >
                        <CalendarDays size={14} />
                        {rotuloPeriodo(periodo)}
                    </button>
                    {aberto === "mes" ? (
                        <div className="ctt-menu ctt-menu-form os-periodo">
                            <label>
                                Data a ser utilizada
                                <select
                                    value={rascunhoPeriodo.campo}
                                    onChange={(e) => setRascunhoPeriodo((a) => ({ ...a, campo: e.target.value }))}
                                >
                                    <option value="entrada">Data de entrada</option>
                                    <option value="prevista">Data prevista</option>
                                    <option value="conclusao">Data de conclusão</option>
                                </select>
                            </label>
                            <p>Período</p>
                            <div className="os-periodo-modos">
                                {[
                                    ["nenhum", "sem filtro"],
                                    ["dia", "do dia"],
                                    ["mes", "do mês"],
                                    ["intervalo", "do intervalo"]
                                ].map(([id, nome]) => (
                                    <button
                                        key={id}
                                        type="button"
                                        className={rascunhoPeriodo.modo === id ? "is-on" : ""}
                                        onClick={() => setRascunhoPeriodo((a) => ({ ...a, modo: id }))}
                                    >
                                        {nome}
                                    </button>
                                ))}
                            </div>
                            {rascunhoPeriodo.modo === "mes" ? (
                                <div className="os-mes-nav">
                                    <button type="button" onClick={() => setRascunhoPeriodo((a) => mudarMes(a, -1))}>‹</button>
                                    <strong>{String(rascunhoPeriodo.mes + 1).padStart(2, "0")} / {rascunhoPeriodo.ano}</strong>
                                    <button type="button" onClick={() => setRascunhoPeriodo((a) => mudarMes(a, 1))}>›</button>
                                </div>
                            ) : null}
                            {rascunhoPeriodo.modo === "dia" ? (
                                <div className="os-mes-nav">
                                    <button type="button" onClick={() => setRascunhoPeriodo((a) => mudarDia(a, -1))}>‹</button>
                                    <input type="date" value={rascunhoPeriodo.dia} onChange={(e) => setRascunhoPeriodo((a) => ({ ...a, dia: e.target.value }))} />
                                    <button type="button" onClick={() => setRascunhoPeriodo((a) => mudarDia(a, 1))}>›</button>
                                </div>
                            ) : null}
                            {rascunhoPeriodo.modo === "intervalo" ? (
                                <div className="os-intervalo">
                                    <input type="date" value={rascunhoPeriodo.de} onChange={(e) => setRascunhoPeriodo((a) => ({ ...a, de: e.target.value }))} />
                                    <input type="date" value={rascunhoPeriodo.ate} onChange={(e) => setRascunhoPeriodo((a) => ({ ...a, ate: e.target.value }))} />
                                </div>
                            ) : null}
                            <div className="ctt-menu-acoes">
                                <button type="button" className="prd-btn prd-btn-primary" onClick={() => { setPeriodo(rascunhoPeriodo); setAberto(null); }}>
                                    aplicar
                                </button>
                                <button type="button" className="prd-btn" onClick={() => setAberto(null)}>cancelar</button>
                            </div>
                        </div>
                    ) : null}
                </div>
                <div className="ctt-drop">
                    <button
                        type="button"
                        className={`os-chip${filtros.marcador || filtros.tecnico ? " is-on" : ""}`}
                        onClick={() => {
                            setRascunho(filtros);
                            setAberto(aberto === "filtros" ? null : "filtros");
                        }}
                    >
                        <SlidersHorizontal size={14} />
                        filtros
                    </button>
                    {aberto === "filtros" ? (
                        <div className="ctt-menu ctt-menu-form">
                            <label>
                                Marcador
                                <select
                                    value={rascunho.marcador}
                                    onChange={(e) => setRascunho((a) => ({ ...a, marcador: e.target.value }))}
                                >
                                    <option value="">Sem filtro por marcador</option>
                                    <option value="sem">Sem marcadores</option>
                                    {[...new Set(lista.flatMap((o) => String(o.marcadores || "").split(/[,;]/).map((t) => t.trim()).filter(Boolean)))].map((tag) => (
                                        <option key={tag} value={tag}>{tag}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Técnico
                                <select
                                    value={rascunho.tecnico}
                                    onChange={(e) => setRascunho((a) => ({ ...a, tecnico: e.target.value }))}
                                >
                                    <option value="">Qualquer técnico</option>
                                    {listarTecnicos().map((t) => (
                                        <option key={t.id} value={t.nome}>{t.nome}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="ctt-menu-acoes">
                                <button type="button" className="prd-btn prd-btn-primary" onClick={() => { setFiltros(rascunho); setAberto(null); }}>
                                    aplicar
                                </button>
                                <button type="button" className="prd-btn" onClick={() => setAberto(null)}>cancelar</button>
                            </div>
                        </div>
                    ) : null}
                </div>
                {temFiltro ? (
                    <button type="button" className="idx-text" onClick={limparFiltros}>
                        limpar filtros
                    </button>
                ) : null}
            </div>

            <div className="os-tabs">
                {SITUACOES.map((sit) => (
                    <button
                        key={sit.id}
                        type="button"
                        className={aba === sit.id ? "is-active" : ""}
                        style={aba === sit.id && sit.cor ? { borderBottomColor: sit.cor } : undefined}
                        onClick={() => setAba(sit.id)}
                    >
                        <span>
                            {sit.cor ? <i style={{ background: sit.cor }} /> : null}
                            {sit.label}
                        </span>
                        <strong>{String(contagens[sit.id] || 0).padStart(2, "0")}</strong>
                    </button>
                ))}
                <button
                    type="button"
                    className="os-cols-btn"
                    title="Informações visíveis"
                    onClick={() => {
                        setRascunhoColunas(colunas);
                        setAberto("colunas");
                    }}
                >
                    <Columns3 size={16} />
                </button>
            </div>

            <div className="os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th className="ctt-check">
                                <input
                                    type="checkbox"
                                    checked={fatia.length > 0 && fatia.every((os) => marcados.includes(os.id))}
                                    onChange={marcarPagina}
                                    aria-label="Selecionar a página"
                                />
                            </th>
                            <th />
                            {COLUNAS_OS.filter((c) => visivel(c.id)).map((c) => (
                                <th key={c.id} className={c.id === "total" ? "is-num" : ""}>
                                    <button type="button" className="os-sort" onClick={() => alternarOrdem(c.id)}>
                                        {c.label}
                                        <span>{ordem.campo === c.id ? (ordem.dir === "asc" ? "↑" : "↓") : "↕"}</span>
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ordenadas.length === 0 ? (
                            <tr>
                                <td colSpan={2 + colunas.length} className="ctt-vazio">
                                    Nenhuma ordem de serviço encontrada.
                                </td>
                            </tr>
                        ) : fatia.map((os) => {
                            const sit = situacaoMeta(os.status);
                            return (
                                <tr key={os.id} className={marcados.includes(os.id) ? "is-sel" : ""}>
                                    <td className="ctt-check">
                                        <input
                                            type="checkbox"
                                            checked={marcados.includes(os.id)}
                                            onChange={() => toggleMarca(os.id)}
                                        />
                                    </td>
                                    <td className="os-row-menu">
                                        <button type="button" onClick={() => setAberto(aberto === os.id ? null : os.id)} aria-label="Ações">
                                            <MoreHorizontal size={16} />
                                        </button>
                                        {aberto === os.id ? (
                                            <div className="ctt-menu is-row">
                                                <button type="button" onClick={() => navigate(`${ROTAS.ORDEM_SERVICO}#edit/${os.id}`)}>editar</button>
                                                <button type="button" onClick={() => { navigate(`${ROTAS.ORDEM_SERVICO}#edit/${os.id}`); }}>imprimir</button>
                                                <button type="button" onClick={async () => {
                                                    if (window.confirm(`Excluir a OS ${os.numero}?`)) {
                                                        await excluirOS(os.id);
                                                        await carregar();
                                                    }
                                                    setAberto(null);
                                                }}>excluir</button>
                                            </div>
                                        ) : null}
                                    </td>
                                    {visivel("numero") ? (
                                        <td>
                                            <Link className="os-num" to={`${ROTAS.ORDEM_SERVICO}#edit/${os.id}`}>{os.numero || os.id}</Link>
                                        </td>
                                    ) : null}
                                    {visivel("data") ? <td>{dataBr(os.dataAbertura)}</td> : null}
                                    {visivel("prevista") ? <td>{dataBr(os.dataPrevisao)}</td> : null}
                                    {visivel("conclusao") ? <td>{dataBr(os.dataConclusao)}</td> : null}
                                    {visivel("cliente") ? (
                                        <td>
                                            <Link className="os-cli" to={`${ROTAS.ORDEM_SERVICO}#edit/${os.id}`}>{os.cliente || "—"}</Link>
                                        </td>
                                    ) : null}
                                    {visivel("fantasia") ? <td>{os.fantasia || ""}</td> : null}
                                    {visivel("tecnicos") ? <td>{nomesTecnicos(os) || "—"}</td> : null}
                                    {visivel("setor") ? <td>{os.setorAtual || os.status || ""}</td> : null}
                                    {visivel("total") ? <td className="is-num">{moeda(os.valor)}</td> : null}
                                    {visivel("equipamento") ? <td>{os.equipamento || ""}</td> : null}
                                    {visivel("marcadores") ? <td>{os.marcadores || ""}</td> : null}
                                    {visivel("integracoes") ? (
                                        <td>
                                            <span className="os-int">
                                                <em className={os.contasLancadas ? "is-on" : ""} title="Contas"><Check size={12} /></em>
                                                <em className={os.estoqueLancado ? "is-on" : ""} title="Estoque"><Check size={12} /></em>
                                            </span>
                                        </td>
                                    ) : null}
                                    {visivel("situacao") ? (
                                        <td>
                                            <span className="os-dot" style={{ background: sit.cor }} title={sit.label} />
                                        </td>
                                    ) : null}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {marcados.length > 0 ? (
                <div className="os-bulk">
                    <span className="os-bulk-n">{String(marcados.length).padStart(2, "0")}</span>
                    <button type="button" className="os-bulk-pri" onClick={() => aplicarStatus("ENTREGUE")}>
                        <Check size={14} /> finalizar
                    </button>
                    <button type="button" onClick={imprimir}><Printer size={14} /> imprimir</button>
                    <button type="button" onClick={() => navigate(ROTAS.NFS)}><FileText size={14} /> gerar nota fiscal</button>
                    <button type="button" className="os-danger" onClick={excluirMarcadas}><Trash2 size={14} /> excluir</button>
                    <div className="ctt-drop">
                        <button type="button" className="os-ghost" onClick={() => setAberto(aberto === "bulk" ? null : "bulk")}>
                            mais ações <ChevronDown size={14} />
                        </button>
                        {aberto === "bulk" ? (
                            <div className="ctt-menu is-up">
                                <button type="button" onClick={() => aplicarStatus("ENTREGUE")}><Check size={14} /> finalizar</button>
                                <button type="button" onClick={imprimir}><Printer size={14} /> imprimir</button>
                                <button type="button" onClick={() => navigate(ROTAS.NFS)}><FileText size={14} /> gerar nota fiscal</button>
                                <button type="button" onClick={excluirMarcadas}><Trash2 size={14} /> excluir ordens de serviço</button>
                                <button type="button" onClick={async () => {
                                    await Promise.all(marcados.map(async (id) => {
                                        const item = lista.find((o) => o.id === id);
                                        if (!item) {
                                            return;
                                        }
                                        try {
                                            await registrarOsCaixa({
                                                valor: Number(item.valor || 0),
                                                descricao: `OS ${item.numero || id} · ${item.cliente}`,
                                                referenciaId: id
                                            });
                                            await atualizarOS(id, { ...item, contasLancadas: true });
                                        } catch {
                                            /* ignore */
                                        }
                                    }));
                                    await carregar();
                                    setAviso("Recebimentos lançados no caixa.");
                                    setAberto(null);
                                }}>$ lançar contas</button>
                                <button type="button" onClick={() => { setAviso("Lançamento de estoque fica disponível ao finalizar a OS."); setAberto(null); }}>lançar estoque</button>
                                <button type="button" onClick={() => {
                                    const tags = window.prompt("Marcadores (separados por vírgula)");
                                    if (tags != null) {
                                        setLista((atual) => atual.map((o) => marcados.includes(o.id) ? { ...o, marcadores: tags } : o));
                                    }
                                    setAberto(null);
                                }}><Tag size={14} /> alterar marcadores</button>
                                <div className="os-sit-list">
                                    {SITUACOES.filter((s) => s.status?.[0]).map((s) => (
                                        <button key={s.id} type="button" onClick={() => aplicarStatus(s.status[0])}>
                                            <i style={{ background: s.cor }} /> alterar situação — {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                    </div>
            ) : null}

            <footer className="os-foot">
                <div className="os-foot-nav">
                    <nav className="ctt-pag" aria-label="Páginas">
                        <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina(paginaAtual - 1)} aria-label="Página anterior">
                            <ChevronLeft size={16} />
                        </button>
                        {faixasPagina(paginaAtual, totalPaginas).map((item) => (
                            item.tipo === "reticencias" ? (
                                <span key={item.id} className="os-ellipsis">…</span>
                            ) : (
                                <button
                                    key={item.n}
                                    type="button"
                                    className={item.n === paginaAtual ? "is-active" : ""}
                                    onClick={() => setPagina(item.n)}
                                >
                                    {String(item.n).padStart(2, "0")}
                                </button>
                            )
                        ))}
                        <button type="button" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina(paginaAtual + 1)} aria-label="Próxima página">
                            <ChevronRight size={16} />
                        </button>
                    </nav>
                    <label className="erp-pager-size">
                        <select
                            value={porPagina}
                            onChange={(e) => setPorPagina(Number(e.target.value))}
                            aria-label="Itens por página"
                        >
                            {TAMANHOS_PAGINA.map((n) => (
                                <option key={n} value={n}>{n} por página</option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="os-foot-tot">
                    {marcados.length > 0 ? (
                        <span>
                            <strong>{marcados.length}</strong>
                            <small>selecionadas · {moeda(totalSel)}</small>
                        </span>
                    ) : null}
                    <span>
                        <strong>{visiveis.length}</strong>
                        <small>quantidade</small>
                    </span>
                    <span>
                        <strong>{moeda(totalVis)}</strong>
                        <small>valor total (R$)</small>
                    </span>
                </div>
            </footer>

            <ImportadorMassa
                aberto={importadorMassa}
                ocupado={importando}
                onFechar={() => setImportadorMassa(false)}
                titulo="Importar ordens de serviço"
                descricao="Selecione várias planilhas de OS do Olist (.xls/.xlsx) de uma vez."
                dica="Vários Excel: ordens_servico_1.xls, ordens_servico_2.xls…"
                aceitos=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                permitirXml={false}
                rotuloItem="ordens"
                lerExcel={lerArquivoOS}
                mesclar={mesclarLeiturasOS}
                importarLote={importarOSLote}
                onConcluido={async (mensagem) => {
                    setAviso(mensagem);
                    await carregar();
                }}
            />

            {aberto === "colunas" ? (
                <aside className="os-drawer">
                    <header>
                        <strong>Informações visíveis</strong>
                        <button type="button" onClick={() => setAberto(null)} aria-label="fechar"><X size={16} /></button>
                    </header>
                    <p>Selecione abaixo quais informações deseja que estejam visíveis</p>
                    <label className="os-sw">
                        <input
                            type="checkbox"
                            checked={rascunhoColunas.length === COLUNAS_OS.length}
                            onChange={(e) => setRascunhoColunas(e.target.checked ? COLUNAS_OS.map((c) => c.id) : [...rascunhoColunas])}
                        />
                        Colunas
                    </label>
                    {COLUNAS_OS.map((c) => (
                        <label key={c.id} className="os-sw">
                            <input
                                type="checkbox"
                                checked={rascunhoColunas.includes(c.id)}
                                onChange={(e) => setRascunhoColunas((atual) => (
                                    e.target.checked ? [...atual, c.id] : atual.filter((id) => id !== c.id)
                                ))}
                            />
                            {c.label}
                        </label>
                    ))}
                    <footer>
                        <button
                            type="button"
                            className="prd-btn prd-btn-primary"
                            onClick={() => {
                                const next = rascunhoColunas.length ? rascunhoColunas : ["numero", "cliente"];
                                setColunas(next);
                                localStorage.setItem(COLUNAS_KEY, JSON.stringify(next));
                                setAberto(null);
                            }}
                        >
                            aplicar
                        </button>
                        <button type="button" className="prd-btn" onClick={() => setAberto(null)}>cancelar</button>
                    </footer>
                </aside>
            ) : null}
        </div>
    );
}
