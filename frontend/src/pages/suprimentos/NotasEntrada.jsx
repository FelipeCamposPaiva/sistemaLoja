import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    ChevronDown,
    CloudUpload,
    FileUp,
    Filter,
    Link2,
    RefreshCw,
    Search,
    Upload,
    X
} from "lucide-react";

import { ESTADOS, lerContatos } from "../../constants/contatos";
import { aplicarProdutosNfe } from "../../constants/catalogoLoja";
import {
    CAMPOS_DATA,
    agregarItensNfe,
    formatarData,
    formatarMoeda,
    gravarContingencia,
    gravarNotas,
    gravarXmlTerceiros,
    INTEGRACOES,
    lerContingencia,
    lerNotas,
    lerXmlTerceiros,
    parseXmlNota,
    PERIODOS,
    proximoId,
    STATUS
} from "../../constants/notasEntrada";
import ROTAS from "../../constants/rotas";
import ModalDataEstoqueNf from "../../components/ModalDataEstoqueNf";
import {
    aplicarEstoqueNaNota,
    estornarNotaEntrada,
    lancarEstoqueNotaEntrada
} from "../../services/notasEntrada.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/notas-entrada.css";

const TAMANHO_MAX = 2 * 1024 * 1024;

function exportarCsv(lista) {
    const linhas = [["Nº", "Série", "Data emissão", "Remetente", "UF", "CNPJ", "Valor", "Situação", "Chave"].join(";")];
    lista.forEach((n) => {
        linhas.push([
            n.numero,
            n.serie,
            formatarData(n.dataEmissao),
            n.remetente,
            n.uf,
            n.cnpj || "",
            formatarMoeda(n.valor),
            n.status,
            n.chave || ""
        ].map((v) => `"${String(v).replaceAll("\"", "\"\"")}"`).join(";"));
    });
    const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notas-fiscais-entrada.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function imprimirLista(titulo, linhasHtml) {
    const janela = window.open("", "_blank");
    if (!janela) {
        return;
    }
    janela.document.write(`
        <html><head><title>${titulo}</title>
        <style>body{font:14px sans-serif;padding:24px} table{width:100%;border-collapse:collapse} th,td{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left}</style>
        </head><body><h1>${titulo}</h1>${linhasHtml}</body></html>
    `);
    janela.document.close();
    janela.print();
}

function dentroDoPeriodo(iso, dias) {
    if (dias === "sem" || !iso) {
        return true;
    }
    const data = new Date(`${iso}T12:00:00`);
    const limite = new Date();
    limite.setDate(limite.getDate() - Number(dias));
    limite.setHours(0, 0, 0, 0);
    return data >= limite;
}

export default function NotasEntrada() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const raiz = useRef(null);
    const [lista, setLista] = useState(lerNotas);
    const [xmls, setXmls] = useState(lerXmlTerceiros);
    const [busca, setBusca] = useState(() => params.get("q") || "");

    useEffect(() => {
        const q = params.get("q");
        if (q) {
            setBusca(q);
        }
    }, [params]);
    const [aba, setAba] = useState("todas");
    const [periodo, setPeriodo] = useState("30");
    const [campoData, setCampoData] = useState("emissao");
    const [filtros, setFiltros] = useState({ uf: "", marcador: "" });
    const [rascunho, setRascunho] = useState({ uf: "", marcador: "" });
    const [marcados, setMarcados] = useState([]);
    const [xmlMarcados, setXmlMarcados] = useState([]);
    const [aberto, setAberto] = useState(null);
    const [menuLinha, setMenuLinha] = useState(null);
    const [painel, setPainel] = useState(null);
    const [tipoXml, setTipoXml] = useState("nfe");
    const [modoTerceiros, setModoTerceiros] = useState("sefaz");
    const [marcadoresXml, setMarcadoresXml] = useState("");
    const [arquivo, setArquivo] = useState(null);
    const [aviso, setAviso] = useState("");
    const [chaveAcesso, setChaveAcesso] = useState("");
    const [sefazAtivo, setSefazAtivo] = useState(true);
    const [contingencia, setContingencia] = useState(lerContingencia);
    const [notaEstoque, setNotaEstoque] = useState(null);
    const [loteEstoque, setLoteEstoque] = useState([]);
    const [trabalhandoEstoque, setTrabalhandoEstoque] = useState(false);
    const [consultaEm] = useState(() => {
        const agora = new Date();
        return agora.toLocaleString("pt-BR");
    });

    useEffect(() => {
        gravarNotas(lista);
    }, [lista]);

    useEffect(() => {
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
        fetch("/data/nfe/31260871673990001904550010492420911208598360-nfe.xml")
            .then((resp) => (resp.ok ? resp.text() : null))
            .then((texto) => {
                if (!texto) {
                    return;
                }
                const parsed = parseXmlNota(texto);
                if (!parsed.chave) {
                    return;
                }
                setLista((atual) => {
                    const idx = atual.findIndex((n) => n.chave === parsed.chave);
                    if (idx >= 0) {
                        if (atual[idx].itens?.some((item) => item.cfop)) {
                            return atual;
                        }
                        return atual.map((n, i) => (i === idx ? { ...n, ...parsed, id: n.id, marcadores: n.marcadores || ["Natura"] } : n));
                    }
                    return [{ ...parsed, id: proximoId(atual), marcadores: ["Natura"], integracoes: ["E", "CC", "P"] }, ...atual];
                });
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        gravarXmlTerceiros(xmls);
    }, [xmls]);

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
        const termo = busca.trim().toLowerCase();
        return lista.filter((n) => {
            if (n.status === "excluida") {
                return false;
            }
            if (aba !== "todas" && n.status !== aba) {
                return false;
            }
            const dataRef = campoData === "entrada" ? n.dataEntrada : n.dataEmissao;
            if (!dentroDoPeriodo(dataRef, periodo)) {
                return false;
            }
            if (filtros.uf && n.uf !== filtros.uf) {
                return false;
            }
            if (filtros.marcador && !(n.marcadores || []).some((m) => m.toLowerCase().includes(filtros.marcador.toLowerCase()))) {
                return false;
            }
            if (!termo) {
                return true;
            }
            const itensTxt = (n.itens || []).map((item) => `${item.sku || ""} ${item.nome || item.descricao || ""} ${item.gtin || item.codigoBarras || ""}`).join(" ");
            return [n.numero, n.remetente, n.cnpj, n.chave, String(n.valor), itensTxt].join(" ").toLowerCase().includes(termo);
        }).sort((a, b) => String(b.dataEmissao || "").localeCompare(String(a.dataEmissao || "")));
    }, [lista, busca, aba, periodo, campoData, filtros]);

    const contagens = useMemo(() => {
        const base = lista.filter((n) => n.status !== "excluida" && dentroDoPeriodo(campoData === "entrada" ? n.dataEntrada : n.dataEmissao, periodo));
        const por = (id) => base.filter((n) => n.status === id).length;
        return {
            todas: base.length,
            pendente: por("pendente"),
            registrada: por("registrada"),
            emitida: por("emitida"),
            cancelada: por("cancelada")
        };
    }, [lista, periodo, campoData]);

    const total = visiveis.reduce((s, n) => s + Number(n.valor || 0), 0);

    function toast(texto, warn) {
        setAviso(warn ? `warn:${texto}` : texto);
        window.setTimeout(() => setAviso(""), 3200);
    }

    function limparFiltros() {
        setBusca("");
        setAba("todas");
        setPeriodo("30");
        setCampoData("emissao");
        setFiltros({ uf: "", marcador: "" });
        setAberto(null);
    }

    function toggleMarca(id) {
        setMarcados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
    }

    function marcarPagina() {
        const ids = visiveis.map((n) => n.id);
        const todos = ids.length && ids.every((id) => marcados.includes(id));
        setMarcados(todos ? marcados.filter((id) => !ids.includes(id)) : [...new Set([...marcados, ...ids])]);
    }

    function abrirXml(tipo) {
        setTipoXml(tipo);
        setArquivo(null);
        setMarcadoresXml("");
        setPainel("xml");
        setAberto(null);
    }

    function abrirTerceiros() {
        setModoTerceiros("sefaz");
        setPainel("terceiros");
        setAberto(null);
    }

    async function importarArquivo() {
        if (!arquivo) {
            toast("Selecione um arquivo XML.", true);
            return;
        }
        if (arquivo.size > TAMANHO_MAX) {
            toast("O tamanho do arquivo não deve ultrapassar 2Mb.", true);
            return;
        }
        const texto = await arquivo.text();
        const tags = marcadoresXml.split(/[,|\t]+/).map((t) => t.trim()).filter(Boolean);
        const parsed = parseXmlNota(texto, arquivo.name);
        if (parsed.chave && lista.some((n) => n.chave === parsed.chave)) {
            toast("Esta NF-e já foi importada.", true);
            return;
        }
        if (parsed.itens?.length) {
            aplicarProdutosNfe(agregarItensNfe(parsed.itens));
        }
        setLista((atual) => [{
            ...parsed,
            id: proximoId(atual),
            marcadores: tags.length ? tags : (parsed.marcadores || []),
            natureza: tipoXml === "cte" ? "Importação XML CT-e" : parsed.natureza
        }, ...atual]);
        setPainel(null);
        setArquivo(null);
        const qtd = parsed.itens?.length || 0;
        toast(qtd ? `XML importado. ${qtd} produto(s) no catálogo.` : "XML importado.");
    }

    function continuarTerceiros() {
        if (modoTerceiros === "arquivo") {
            abrirXml("terceiros");
            return;
        }
        if (!sefazAtivo) {
            toast("A importação via SEFAZ está desativada.", true);
            return;
        }
        setXmlMarcados(xmls.map((x) => x.id));
        setPainel("sefaz");
    }

    function manifestarXmls() {
        const escolhidos = xmls.filter((x) => xmlMarcados.includes(x.id));
        if (!escolhidos.length) {
            toast("Selecione ao menos um XML.", true);
            return;
        }
        setLista((atual) => {
            let id = proximoId(atual);
            const novas = escolhidos.map((x) => {
                const item = {
                    id,
                    numero: x.chave.slice(-9),
                    serie: "1",
                    dataEmissao: x.dataEmissao,
                    dataEntrada: x.dataEmissao,
                    remetente: x.nome,
                    cnpj: x.cnpj,
                    uf: x.uf,
                    valor: x.valor,
                    chave: x.chave,
                    status: "registrada",
                    xml: true,
                    marcadores: [],
                    integracoes: ["E"],
                    natureza: "NF-e de terceiros"
                };
                id += 1;
                return item;
            });
            return [...novas, ...atual];
        });
        setXmls((atual) => atual.filter((x) => !xmlMarcados.includes(x.id)));
        setXmlMarcados([]);
        setPainel(null);
        toast("XMLs manifestados e importados.");
    }

    function importarPorChave() {
        const chave = chaveAcesso.replace(/\D/g, "");
        if (chave.length !== 44) {
            toast("Informe uma chave de acesso com 44 dígitos.", true);
            return;
        }
        setLista((atual) => [{
            id: proximoId(atual),
            numero: chave.slice(-8),
            serie: chave.slice(22, 25).replace(/^0+/, "") || "1",
            dataEmissao: new Date().toISOString().slice(0, 10),
            dataEntrada: new Date().toISOString().slice(0, 10),
            remetente: "NF-e consultada na SEFAZ",
            cnpj: "",
            uf: "",
            valor: 0,
            chave,
            status: "pendente",
            xml: true,
            marcadores: [],
            integracoes: [],
            natureza: "Importação por chave"
        }, ...atual]);
        setChaveAcesso("");
        setPainel(null);
        toast("Chave enviada para consulta.");
    }

    function enviarPendentes() {
        const qtd = lista.filter((n) => n.status === "pendente").length;
        if (!qtd) {
            toast("Não há notas pendentes.", true);
            setAberto(null);
            return;
        }
        setLista((atual) => atual.map((n) => (n.status === "pendente" ? { ...n, status: "registrada" } : n)));
        setAberto(null);
        toast(`${qtd} nota(s) enviada(s).`);
    }

    function imprimirDanfes() {
        const alvo = marcados.length ? lista.filter((n) => marcados.includes(n.id)) : visiveis;
        const html = `<table><thead><tr><th>Nº</th><th>Remetente</th><th>Valor</th></tr></thead><tbody>${
            alvo.map((n) => `<tr><td>${n.numero}</td><td>${n.remetente}</td><td>R$ ${formatarMoeda(n.valor)}</td></tr>`).join("")
        }</tbody></table>`;
        imprimirLista("DANFEs autorizadas", html);
        setAberto(null);
    }

    function imprimirRelatorio() {
        const html = `<table><thead><tr><th>Nº</th><th>Emissão</th><th>Remetente</th><th>UF</th><th>Valor</th></tr></thead><tbody>${
            visiveis.map((n) => `<tr><td>${n.numero}</td><td>${formatarData(n.dataEmissao)}</td><td>${n.remetente}</td><td>${n.uf}</td><td>R$ ${formatarMoeda(n.valor)}</td></tr>`).join("")
        }</tbody></table><p>Total: R$ ${formatarMoeda(total)}</p>`;
        imprimirLista("Relatório de notas de entrada", html);
        setAberto(null);
    }

    function alternarContingencia() {
        const proximo = !contingencia;
        setContingencia(proximo);
        gravarContingencia(proximo);
        setAberto(null);
        toast(proximo ? "Modo de contingência NF-e ativado." : "Modo de contingência NF-e desativado.", proximo);
    }

    function cancelarNota(n) {
        setLista((atual) => atual.map((item) => (item.id === n.id ? { ...item, status: "cancelada" } : item)));
        setMenuLinha(null);
    }

    function excluirNota(n) {
        setLista((atual) => atual.filter((item) => item.id !== n.id));
        setMenuLinha(null);
    }

    function abrirLancamento(n) {
        setNotaEstoque(n);
        setLoteEstoque([n]);
        setMenuLinha(null);
        setAberto(null);
    }

    function abrirLancamentoSelecionadas() {
        const alvo = lista.filter((n) => marcados.includes(n.id));
        if (!alvo.length) {
            toast("Selecione ao menos uma nota.", true);
            return;
        }
        setNotaEstoque(alvo[0]);
        setLoteEstoque(alvo);
        setAberto(null);
    }

    async function confirmarDataEstoque(opcoes) {
        const alvo = loteEstoque.length ? loteEstoque : (notaEstoque ? [notaEstoque] : []);
        if (!alvo.length) {
            return;
        }
        setTrabalhandoEstoque(true);
        try {
            const atualizados = {};
            for (const nota of alvo) {
                const resultado = await lancarEstoqueNotaEntrada(nota, opcoes);
                atualizados[nota.id] = aplicarEstoqueNaNota(nota, resultado);
            }
            setLista((atual) => atual.map((n) => atualizados[n.id] || n));
            const dataUsada = Object.values(atualizados)[0]?.dataEstoque || opcoes.dataMovimento;
            toast(alvo.length > 1
                ? `Estoque de ${alvo.length} notas lançado em ${formatarData(dataUsada)}.`
                : `Estoque lançado em ${formatarData(dataUsada)}.`);
        } finally {
            setTrabalhandoEstoque(false);
            setNotaEstoque(null);
            setLoteEstoque([]);
        }
    }

    async function estornarEstoqueNota(n) {
        if (n.backendId) {
            try {
                await estornarNotaEntrada(n.backendId);
            } catch {
                /* local segue */
            }
        }
        setLista((atual) => atual.map((item) => (
            item.id === n.id ? { ...item, integracoes: [], status: "pendente" } : item
        )));
        setMenuLinha(null);
        toast("Estoque e contas estornados de uma vez.");
    }

    const avisoTexto = aviso.startsWith("warn:") ? aviso.slice(5) : aviso;
    const avisoWarn = aviso.startsWith("warn:");

    return (
        <div className={`nfe-page${painel ? " has-drawer" : ""}`} ref={raiz}>
            <div className="nfe-main">
                <nav className="dash-crumb" aria-label="Trilha">
                    <Link to={ROTAS.INDICE}>início</Link>
                    <span>›</span>
                    <span>suprimentos</span>
                    <span>›</span>
                    <span>notas de entrada</span>
                </nav>

                <div className="nfe-head">
                    <h2>Notas Fiscais de Entrada</h2>
                    <div className="nfe-acoes">
                        <button type="button" className="prd-btn" onClick={() => { setPainel("chave"); setAberto(null); }}>
                            <Search size={15} />
                            buscador de notas
                        </button>
                        <button type="button" className="prd-btn" onClick={() => abrirXml("nfe")}>
                            <CloudUpload size={15} />
                            Importar XML da NFe
                        </button>
                        <button type="button" className="prd-btn prd-btn-primary" onClick={() => navigate(`${ROTAS.NOTAS_ENTRADA}/nova`)}>
                            incluir nota fiscal
                        </button>
                        <div className="ctt-drop">
                            <button
                                type="button"
                                className={`prd-btn${aberto === "mais" ? " is-on" : ""}`}
                                onClick={() => setAberto(aberto === "mais" ? null : "mais")}
                            >
                                mais ações
                                <ChevronDown size={14} />
                            </button>
                            {aberto === "mais" ? (
                                <div className="ctt-menu">
                                    <button type="button" onClick={enviarPendentes}>enviar notas pendentes</button>
                                    <button type="button" onClick={abrirLancamentoSelecionadas}>lançar estoque das selecionadas</button>
                                    <button type="button" onClick={imprimirDanfes}>imprimir DANFEs autorizadas</button>
                                    <hr />
                                    <button type="button" onClick={() => abrirXml("nfe")}>Importar XML da NFe</button>
                                    <button type="button" onClick={() => abrirXml("cte")}>Importar XML do CTe</button>
                                    <button type="button" onClick={abrirTerceiros}>Importar XMLs emitidos por terceiros</button>
                                    <hr />
                                    <button type="button" onClick={imprimirRelatorio}>imprimir relatório</button>
                                    <button type="button" onClick={() => { setAberto(null); navigate("/ferramentas/nfe-inutilizacao"); }}>
                                        inutilizar numeração
                                    </button>
                                    <button type="button" onClick={alternarContingencia}>
                                        {contingencia ? "desativar o modo de contingência NFe" : "ativar o modo de contingência NFe"}
                                    </button>
                                    <button type="button" onClick={() => { exportarCsv(visiveis); setAberto(null); }}>
                                        exportar notas fiscais
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {avisoTexto ? <p className={`nfe-aviso${avisoWarn ? " is-warn" : ""}`}>{avisoTexto}</p> : null}

                <div className="fer-filtros">
                    <label className="fer-search">
                        <Search size={15} />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Pesquise por cliente ou número"
                        />
                    </label>

                    <div className="ctt-drop">
                        <button
                            type="button"
                            className={`fer-chip${periodo !== "sem" ? " is-active" : ""}`}
                            onClick={() => setAberto(aberto === "periodo" ? null : "periodo")}
                        >
                            {PERIODOS.find((p) => p.id === periodo)?.nome}
                            <ChevronDown size={14} />
                        </button>
                        {aberto === "periodo" ? (
                            <div className="ctt-menu">
                                {PERIODOS.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className={periodo === p.id ? "is-sel" : ""}
                                        onClick={() => { setPeriodo(p.id); setAberto(null); }}
                                    >
                                        {p.nome}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="ctt-drop">
                        <button
                            type="button"
                            className="fer-chip is-active"
                            onClick={() => setAberto(aberto === "data" ? null : "data")}
                        >
                            {CAMPOS_DATA.find((c) => c.id === campoData)?.nome}
                            <ChevronDown size={14} />
                        </button>
                        {aberto === "data" ? (
                            <div className="ctt-menu">
                                {CAMPOS_DATA.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        className={campoData === c.id ? "is-sel" : ""}
                                        onClick={() => { setCampoData(c.id); setAberto(null); }}
                                    >
                                        {c.nome}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="ctt-drop">
                        <button
                            type="button"
                            className={`fer-chip${filtros.uf || filtros.marcador ? " is-active" : ""}`}
                            onClick={() => {
                                setRascunho(filtros);
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
                                    Estado
                                    <select value={rascunho.uf} onChange={(e) => setRascunho((a) => ({ ...a, uf: e.target.value }))}>
                                        <option value="">Todos</option>
                                        {ESTADOS.map((uf) => (
                                            <option key={uf} value={uf}>{uf}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Marcador
                                    <input
                                        value={rascunho.marcador}
                                        onChange={(e) => setRascunho((a) => ({ ...a, marcador: e.target.value }))}
                                    />
                                </label>
                                <div className="ctt-menu-acoes">
                                    <button type="button" className="idx-pill int-add" onClick={() => { setFiltros(rascunho); setAberto(null); }}>
                                        aplicar
                                    </button>
                                    <button type="button" className="ctt-ghost" onClick={() => setAberto(null)}>cancelar</button>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <button type="button" className="idx-text" onClick={limparFiltros}>
                        Limpar filtros
                    </button>
                </div>

                <div className="nfe-tabs">
                    {STATUS.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            className={aba === s.id ? "is-active" : ""}
                            onClick={() => setAba(s.id)}
                        >
                            {s.cor ? <span className="nfe-dot" style={{ background: s.cor }} /> : null}
                            {s.nome}
                            {contagens[s.id] ? <em>{contagens[s.id]}</em> : null}
                        </button>
                    ))}
                </div>

                <table className="fer-table nfe-table">
                    <thead>
                        <tr>
                            <th className="ctt-check">
                                <input
                                    type="checkbox"
                                    checked={visiveis.length > 0 && visiveis.every((n) => marcados.includes(n.id))}
                                    onChange={marcarPagina}
                                    aria-label="Selecionar página"
                                />
                            </th>
                            <th>Nº</th>
                            <th>Data emissão</th>
                            <th>Remetente</th>
                            <th>UF</th>
                            <th>Valor</th>
                            <th>Marcadores</th>
                            <th>Integrações</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {visiveis.length ? visiveis.map((n) => (
                            <tr key={n.id} className={marcados.includes(n.id) ? "is-sel" : ""}>
                                <td className="ctt-check">
                                    <input
                                        type="checkbox"
                                        checked={marcados.includes(n.id)}
                                        onChange={() => toggleMarca(n.id)}
                                        aria-label={`Selecionar ${n.numero}`}
                                    />
                                </td>
                                <td>
                                    <Link className="nfe-num" to={`${ROTAS.NOTAS_ENTRADA}/${n.id}`}>
                                        {n.xml ? <FileUp size={13} /> : null}
                                        {n.numero}
                                    </Link>
                                </td>
                                <td>{formatarData(n.dataEmissao)}</td>
                                <td>
                                    <span className="nfe-remetente">{n.remetente}</span>
                                </td>
                                <td>{n.uf}</td>
                                <td>{formatarMoeda(n.valor)}</td>
                                <td>
                                    <div className="nfe-tags">
                                        {(n.marcadores || []).map((tag) => (
                                            <span key={tag} className="nfe-tag">{tag}</span>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <div className="nfe-ints">
                                        {(n.integracoes || []).map((cod) => {
                                            const info = INTEGRACOES[cod];
                                            if (!info) {
                                                return null;
                                            }
                                            return (
                                                <span key={cod} className="nfe-int" title={info.nome} style={{ background: info.cor }}>
                                                    {info.letra}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </td>
                                <td className="ctt-row-menu">
                                    <button type="button" onClick={() => setMenuLinha(menuLinha === n.id ? null : n.id)} aria-label="Ações">
                                        <ChevronDown size={16} />
                                    </button>
                                    {menuLinha === n.id ? (
                                        <div className="ctt-menu is-row is-right">
                                            <button type="button" onClick={() => navigate(`${ROTAS.NOTAS_ENTRADA}/${n.id}`)}>visualizar / editar</button>
                                            <button type="button" onClick={() => abrirLancamento(n)}>
                                                {(n.integracoes || []).includes("E") ? "corrigir data do estoque" : "lançar estoque"}
                                            </button>
                                            {(n.integracoes || []).includes("E") ? (
                                                <button type="button" onClick={() => estornarEstoqueNota(n)}>estornar estoque</button>
                                            ) : null}
                                            <button type="button" onClick={() => navigate("/entrada_de_mercadorias")}>conferir compra</button>
                                            <button type="button" onClick={() => {
                                                imprimirLista(`DANFE ${n.numero}`, `<p><strong>${n.remetente}</strong></p><p>NF-e ${n.numero} — R$ ${formatarMoeda(n.valor)}</p><p>${n.chave || ""}</p>`);
                                                setMenuLinha(null);
                                            }}>
                                                imprimir DANFE
                                            </button>
                                            <button type="button" onClick={() => cancelarNota(n)}>cancelar</button>
                                            <button type="button" onClick={() => excluirNota(n)}>excluir</button>
                                        </div>
                                    ) : null}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={9} className="ctt-vazio">Nenhuma nota fiscal encontrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="nfe-foot">
                    <span><strong>{visiveis.length}</strong> quantidade</span>
                    <span><strong>{formatarMoeda(total)}</strong> valor total (R$)</span>
                </div>
            </div>

            {painel === "xml" ? (
                <aside className="nfe-drawer" aria-label="Importar XML">
                    <header>
                        <h3>{tipoXml === "cte" ? "Integração por Arquivo XML CTe" : "Integração por Arquivo XML NFe"}</h3>
                        <button type="button" className="idx-text" onClick={() => setPainel(null)}>fechar x</button>
                    </header>
                    <label className="idx-pill int-add nfe-upload">
                        <Upload size={15} />
                        procurar arquivo
                        <input
                            type="file"
                            accept=".xml,text/xml,application/xml"
                            hidden
                            onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                        />
                    </label>
                    {arquivo ? <p className="nfe-file">{arquivo.name}</p> : null}
                    <p className="nfe-hint">O tamanho do arquivo não deve ultrapassar 2Mb</p>
                    <label>
                        Marcadores
                        <input
                            value={marcadoresXml}
                            onChange={(e) => setMarcadoresXml(e.target.value)}
                        />
                    </label>
                    <p className="nfe-hint">Separados por vírgula ou tab</p>
                    <div className="idx-drawer-actions">
                        <button type="button" className="idx-pill int-add" onClick={importarArquivo}>importar</button>
                        <button type="button" className="ctt-ghost" onClick={() => setPainel(null)}>cancelar</button>
                        <button type="button" className="idx-text" onClick={() => setPainel("regras")}>
                            <Link2 size={13} /> regras de relacionamento
                        </button>
                    </div>
                </aside>
            ) : null}

            {painel === "terceiros" ? (
                <aside className="nfe-drawer" aria-label="Importar XMLs de terceiros">
                    <header>
                        <h3>Importar XMLs emitidos por terceiros</h3>
                        <button type="button" className="idx-text" onClick={() => setPainel(null)}>fechar x</button>
                    </header>
                    <div className="nfe-radios">
                        <label className={`nfe-radio${modoTerceiros === "arquivo" ? " is-on" : ""}`}>
                            <input
                                type="radio"
                                name="modo-xml"
                                checked={modoTerceiros === "arquivo"}
                                onChange={() => setModoTerceiros("arquivo")}
                            />
                            <FileUp size={18} />
                            Importação via upload de arquivo
                        </label>
                        <label className={`nfe-radio${modoTerceiros === "sefaz" ? " is-on" : ""}`}>
                            <input
                                type="radio"
                                name="modo-xml"
                                checked={modoTerceiros === "sefaz"}
                                onChange={() => setModoTerceiros("sefaz")}
                            />
                            <RefreshCw size={18} />
                            Importação via serviço do SEFAZ
                        </label>
                    </div>
                    <div className="idx-drawer-actions">
                        <button type="button" className="idx-pill int-add" onClick={continuarTerceiros}>continuar</button>
                        <button type="button" className="idx-text" onClick={() => setPainel(null)}>cancelar</button>
                    </div>
                </aside>
            ) : null}

            {painel === "sefaz" ? (
                <aside className="nfe-drawer is-wide" aria-label="XMLs da SEFAZ">
                    <header>
                        <div>
                            <h3>Importação de XMLs emitidos por terceiros</h3>
                            <small>Última consulta realizada em {consultaEm}</small>
                        </div>
                        <button type="button" className="idx-text" onClick={() => setPainel(null)}>fechar x</button>
                    </header>
                    <div className="nfe-drawer-links">
                        <button type="button" className="idx-text" onClick={() => setPainel("chave")}>
                            Importar via chave de acesso
                        </button>
                        <button type="button" className="idx-text" onClick={() => setPainel("regras")}>
                            <Link2 size={13} /> regras de relacionamento
                        </button>
                        <button
                            type="button"
                            className="nfe-danger"
                            onClick={() => {
                                setSefazAtivo(false);
                                setPainel(null);
                                toast("Importação via SEFAZ desativada.", true);
                            }}
                        >
                            desativar importação
                        </button>
                    </div>
                    {xmls.length ? (
                        <table className="fer-table">
                            <thead>
                                <tr>
                                    <th className="ctt-check">
                                        <input
                                            type="checkbox"
                                            checked={xmls.length > 0 && xmls.every((x) => xmlMarcados.includes(x.id))}
                                            onChange={() => setXmlMarcados(xmls.every((x) => xmlMarcados.includes(x.id)) ? [] : xmls.map((x) => x.id))}
                                            aria-label="Selecionar XMLs"
                                        />
                                    </th>
                                    <th>Identificação</th>
                                    <th>CNPJ</th>
                                    <th>Data de emissão</th>
                                    <th>Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {xmls.map((x) => (
                                    <tr key={x.id} className={xmlMarcados.includes(x.id) ? "is-sel" : ""}>
                                        <td className="ctt-check">
                                            <input
                                                type="checkbox"
                                                checked={xmlMarcados.includes(x.id)}
                                                onChange={() => setXmlMarcados((atual) => (
                                                    atual.includes(x.id) ? atual.filter((id) => id !== x.id) : [...atual, x.id]
                                                ))}
                                            />
                                        </td>
                                        <td className="nfe-xml-id">
                                            {x.nome}
                                            <small>{x.chave}</small>
                                        </td>
                                        <td>{x.cnpj}</td>
                                        <td>{formatarData(x.dataEmissao)}</td>
                                        <td>{formatarMoeda(x.valor)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="nfe-hint">Nenhum XML pendente na SEFAZ.</p>
                    )}
                    <div className="nfe-drawer-foot">
                        <span><strong>{String(xmls.length).padStart(2, "0")}</strong></span>
                        <button type="button" className="idx-pill int-add" onClick={manifestarXmls}>
                            manifestar e importar XMLs
                        </button>
                    </div>
                </aside>
            ) : null}

            {painel === "chave" ? (
                <aside className="nfe-drawer" aria-label="Importar via chave">
                    <header>
                        <h3>Importar via chave de acesso</h3>
                        <button type="button" className="idx-text" onClick={() => setPainel(null)}>fechar x</button>
                    </header>
                    <div className="nfe-chave-form">
                        <label>
                            Chave de acesso (44 dígitos)
                            <input
                                value={chaveAcesso}
                                onChange={(e) => setChaveAcesso(e.target.value)}
                                maxLength={54}
                                placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                            />
                        </label>
                    </div>
                    <div className="idx-drawer-actions">
                        <button type="button" className="idx-pill int-add" onClick={importarPorChave}>consultar</button>
                        <button type="button" className="ctt-ghost" onClick={() => setPainel(null)}>cancelar</button>
                    </div>
                </aside>
            ) : null}

            {painel === "regras" ? (
                <aside className="nfe-drawer" aria-label="Regras de relacionamento">
                    <header>
                        <h3>Regras de relacionamento</h3>
                        <button type="button" className="idx-text" onClick={() => setPainel(null)}>
                            fechar <X size={14} />
                        </button>
                    </header>
                    <div className="nfe-regras">
                        <p>O ERP associa o XML ao cadastro de fornecedor pelo CNPJ ou CPF do emitente.</p>
                        <p>Se houver mais de um cadastro com o mesmo documento, a nota fica pendente para conferência manual.</p>
                        <p>Produtos são relacionados pelo código do fornecedor, EAN ou descrição. Itens sem vínculo entram na conferência de compra.</p>
                    </div>
                    <div className="idx-drawer-actions">
                        <button type="button" className="idx-pill int-add" onClick={() => setPainel(null)}>ok</button>
                    </div>
                </aside>
            ) : null}

            {notaEstoque ? (
                <ModalDataEstoqueNf
                    nota={notaEstoque}
                    trabalhando={trabalhandoEstoque}
                    onCancel={() => { setNotaEstoque(null); setLoteEstoque([]); }}
                    onConfirm={confirmarDataEstoque}
                />
            ) : null}
        </div>
    );
}
