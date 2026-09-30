import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    CalendarDays,
    Check,
    ChevronDown,
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
import ImportadorMassa from "../../cadastros/ImportadorMassa";
import NovaOS from "./NovaOS";

import "../../../styles/layout/app-shell.css";
import "../../../styles/pages/indice.css";
import "../../../styles/pages/ferramentas.css";
import "../../../styles/pages/clientes.css";
import "../../../styles/pages/produtos.css";
import "../../../styles/pages/os.css";

const COLUNAS_KEY = "erp-os-colunas-v2";
const HOJE = new Date();

function periodoPadrao() {
    return {
        modo: "mes",
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
    return COLUNAS_OS.map((c) => c.id);
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
                const blob = [os.cliente, os.fantasia, os.numero, os.descricao, os.marcadores, nomesTecnicos(os)].join(" ").toLowerCase();
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
        if (ev.target.checked) {
            setMarcados(visiveis.map((os) => os.id));
            return;
        }
        setMarcados([]);
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
        <div className="os-page" ref={raiz}>
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
                    <Link className="os-ghost" to={ROTAS.TECNICOS}>técnicos</Link>
                    <Link className="os-ghost" to={ROTAS.RELATORIO_TECNICOS}>relatório por técnico</Link>
                    <div className="ctt-drop">
                        <button
                            type="button"
                            className={`os-ghost${aberto === "mais" ? " is-on" : ""}`}
                            onClick={() => setAberto(aberto === "mais" ? null : "mais")}
                        >
                            mais ações
                            <ChevronDown size={14} />
                        </button>
                        {aberto === "mais" ? (
                            <div className="ctt-menu is-right">
                                <button type="button" onClick={imprimir}>
                                    <Printer size={14} /> imprimir relatório
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
                        placeholder="Pesquise por cliente, nº da ordem ou nº de série"
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
                <button type="button" className="idx-text" disabled={!temFiltro} onClick={limparFiltros}>
                    limpar filtros
                </button>
            </div>

            <div className="os-tabs">
                {SITUACOES.map((sit) => (
                    <button
                        key={sit.id}
                        type="button"
                        className={aba === sit.id ? "is-active" : ""}
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
                                    checked={visiveis.length > 0 && visiveis.every((os) => marcados.includes(os.id))}
                                    onChange={marcarPagina}
                                    aria-label="Selecionar todas"
                                />
                            </th>
                            <th />
                            {COLUNAS_OS.filter((c) => visivel(c.id)).map((c) => (
                                <th key={c.id} className={c.id === "total" ? "is-num" : ""}>
                                    {c.label} <span>↕</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visiveis.length === 0 ? (
                            <tr>
                                <td colSpan={2 + colunas.length} className="ctt-vazio">
                                    Nenhuma ordem de serviço encontrada.
                                </td>
                            </tr>
                        ) : visiveis.map((os) => {
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
                                                <em className={os.contasLancadas ? "is-on" : ""}>C</em>
                                                <em className={os.estoqueLancado ? "is-on" : ""}>V</em>
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
                    <button type="button" onClick={() => navigate("/nfs")}><FileText size={14} /> gerar nota fiscal</button>
                    <button type="button" className="os-danger" onClick={excluirMarcadas}><Trash2 size={14} /> excluir</button>
                    <div className="ctt-drop">
                        <button type="button" className="os-ghost" onClick={() => setAberto(aberto === "bulk" ? null : "bulk")}>
                            mais ações <ChevronDown size={14} />
                        </button>
                        {aberto === "bulk" ? (
                            <div className="ctt-menu is-up">
                                <button type="button" onClick={() => aplicarStatus("ENTREGUE")}><Check size={14} /> finalizar</button>
                                <button type="button" onClick={imprimir}><Printer size={14} /> imprimir</button>
                                <button type="button" onClick={() => navigate("/nfs")}><FileText size={14} /> gerar nota fiscal</button>
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
                    <div className="os-bulk-tot">
                        <span>selecionadas <strong>{marcados.length}</strong></span>
                        <span>quantidade <strong>{visiveis.length}</strong></span>
                        <span>valor total (R$) <strong>{moeda(totalSel)}</strong></span>
                    </div>
                </div>
            ) : (
                <div className="os-bulk os-bulk-only">
                    <div className="os-bulk-tot">
                        <span>quantidade <strong>{visiveis.length}</strong></span>
                        <span>valor total (R$) <strong>{moeda(totalVis)}</strong></span>
                    </div>
                </div>
            )}

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
