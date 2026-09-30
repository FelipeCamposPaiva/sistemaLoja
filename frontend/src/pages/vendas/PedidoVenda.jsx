import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    CalendarDays,
    Check,
    ChevronDown,
    Columns3,
    Download,
    FileSpreadsheet,
    FileText,
    MoreHorizontal,
    Package,
    Printer,
    RefreshCw,
    ScanLine,
    Search,
    SlidersHorizontal,
    Upload,
    Warehouse
} from "lucide-react";

import {
    ABAS_EXPEDICAO,
    ABAS_PEDIDO,
    ABAS_PEDIDO_MAIS,
    ABAS_SEPARACAO,
    COLUNAS_PEDIDO,
    COLUNAS_PEDIDO_PADRAO,
    ORIGENS_PEDIDO,
    STATUS_PEDIDO_VENDA,
    corSituacaoPedido,
    dataPedidoBr,
    moedaPedido,
    passaAbaPedido,
    rotuloStatusPedido
} from "../../constants/pedidosVenda";
import { MESES, isoDate, osVazia } from "../../constants/ordensServico";
import ROTAS from "../../constants/rotas";
import EquipeVenda from "../../components/EquipeVenda";
import { registrarComissaoVenda } from "../../constants/comissoes";
import { rotuloNatureza, sugerirNatureza } from "../../constants/naturezasOperacao";
import { nomesEquipe, PCT_COMISSAO_PADRAO } from "../../constants/vendaVendedores";
import { listarClientes } from "../../services/clientes.service";
import { listarNaturezasOperacao } from "../../services/naturezaOperacao.service";
import { salvarOS } from "../../services/os.service";
import { listarProdutos } from "../../services/produto.service";
import ImportadorMassa from "../cadastros/ImportadorMassa";
import {
    lancarEstoquePedido,
    lancarEstoquePedidos,
    listarPedidosVenda,
    marcarFlagsPedido,
    salvarPedidoVenda,
    atualizarPedidoVenda,
    importarPedidosLote
} from "../../services/pedidoVenda.service";
import {
    exportarPlanilhaPedidos,
    lerArquivoPedido,
    lerPlanilhaPedidos,
    mesclarLeiturasPedidos
} from "../../services/pedidoVendaImport.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/os.css";
import "../../styles/pages/pedidos-venda.css";

const COLUNAS_KEY = "erp-pv-colunas-v2";
const HOJE = new Date();
const POR_PAGINA = 50;

const VISTAS = {
    pedidos: {
        titulo: "Pedidos de venda",
        crumb: "pedidos de venda",
        abas: ABAS_PEDIDO,
        extra: ABAS_PEDIDO_MAIS,
        abaPadrao: "todas"
    },
    separacao: {
        titulo: "Separação",
        crumb: "separação",
        abas: ABAS_SEPARACAO,
        abaPadrao: "sep-pendente"
    },
    expedicao: {
        titulo: "Expedição",
        crumb: "expedição",
        abas: ABAS_EXPEDICAO,
        abaPadrao: "exp-pendente"
    }
};

function periodoPadrao() {
    return {
        modo: "mes",
        campo: "venda",
        mes: HOJE.getMonth(),
        ano: HOJE.getFullYear(),
        dia: isoDate(HOJE),
        de: isoDate(HOJE),
        ate: isoDate(HOJE)
    };
}

function dataCampoPedido(pedido, campo) {
    if (campo === "faturamento" && (pedido.status === "FATURADO" || pedido.status === "ENTREGUE")) {
        return pedido.data;
    }
    return pedido.data;
}

function passaPeriodo(pedido, periodo) {
    if (periodo.modo === "nenhum") {
        return true;
    }
    const iso = isoDate(dataCampoPedido(pedido, periodo.campo));
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
        const [y, m, d] = (periodo.dia || "").split("-");
        return d && m && y ? `${d}/${m}/${y}` : "do dia";
    }
    if (periodo.modo === "intervalo") {
        return "intervalo";
    }
    return MESES[periodo.mes] || "mês";
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
    return COLUNAS_PEDIDO_PADRAO;
}

function rotuloSeparacao(valor) {
    if (valor === "SEPARANDO") {
        return "Separando";
    }
    if (valor === "SEPARADO") {
        return "Separado";
    }
    return "Aguardando";
}

function rotuloEmbalagem(valor, separacao) {
    if (valor === "EMBALADO") {
        return "Embalado";
    }
    if (separacao === "SEPARADO" || valor === "AGUARDANDO") {
        return "Aguardando";
    }
    return "—";
}

function rotuloExpedicao(valor) {
    return valor === "DESPACHADO" ? "Despachado" : "Pendente";
}

function clienteDoPedido(pedido, clientes) {
    return clientes.find((item) => String(item.id) === String(pedido.clienteId)) || null;
}

function documentoCliente(pedido, clientes) {
    return clienteDoPedido(pedido, clientes)?.cpfCnpj || "";
}

function fantasiaPedido(pedido, clientes) {
    return pedido.fantasia || clienteDoPedido(pedido, clientes)?.fantasia || "";
}

function ufPedido(pedido, clientes) {
    return pedido.uf || clienteDoPedido(pedido, clientes)?.uf || "";
}

function cidadePedido(pedido, clientes) {
    return pedido.cidade || clienteDoPedido(pedido, clientes)?.municipio || "";
}

function pedidoIncompleto(pedido, clientes) {
    return !pedido.clienteId || !documentoCliente(pedido, clientes) || !ufPedido(pedido, clientes) || !cidadePedido(pedido, clientes) || !(pedido.itens || []).length;
}

function marcarIncompleto(pedido, clientes) {
    return { ...pedido, dadosIncompletos: pedidoIncompleto(pedido, clientes) };
}

function statusPagamento(pedido) {
    if (pedido.pagamento) {
        return pedido.pagamento;
    }
    return pedido.contasLancadas ? "recebido" : "aguardando recebimento";
}

function origemEcommerce(origem) {
    return origem && origem !== "Loja" && origem !== "PDV";
}

function fotoItem(pedido, produtos) {
    const item = (pedido.itens || [])[0];
    if (item?.foto || item?.imagem) {
        return { src: item.foto || item.imagem, emoji: "", bg: "" };
    }
    const sku = String(item?.sku || "").toLowerCase();
    const produto = sku ? produtos.find((p) => String(p.sku || "").toLowerCase() === sku) : null;
    const nome = produto?.nome || item?.descricao || item?.sku || pedido.numero || "?";
    const t = `${nome} ${produto?.grupo || ""}`.toUpperCase();
    if (/CADERN|CANETA|LAPI|PAPELARIA|BORRACHA|COLA/.test(t)) {
        return { src: "", emoji: "📒", bg: "#e8ddd0" };
    }
    return {
        src: "",
        emoji: String(nome).charAt(0).toUpperCase(),
        bg: ["#dbeafe", "#fce7f3", "#dcfce7", "#fef3c7", "#e0e7ff"][Math.abs(Number(pedido.id) || 0) % 5]
    };
}

function filtrosVazios() {
    return {
        origem: "",
        estoque: "",
        contas: "",
        vendedor: "",
        marcador: "",
        envio: "",
        sku: "",
        cidade: "",
        pagamento: ""
    };
}

function abasDaVista(meta) {
    return [...(meta.abas || []), ...(meta.extra || [])];
}

function chavePedido(pedido) {
    return String(pedido?.numero || pedido?.id || "");
}

function rotaEditarPedido(pedido) {
    return `${ROTAS.PEDIDO_VENDA}#edit/${encodeURIComponent(chavePedido(pedido))}`;
}

function acharPedido(lista, chave) {
    const k = String(chave || "");
    return (lista || []).find((p) => String(p.numero) === k)
        || (lista || []).find((p) => String(p.id) === k)
        || null;
}

function PedidoEditar({ chave }) {
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trabalhando, setTrabalhando] = useState(false);
    const [aviso, setAviso] = useState("");
    const [form, setForm] = useState({
        clienteId: "",
        cliente: "",
        origem: "Loja",
        valor: "",
        status: "EM_ABERTO",
        vendedor: ""
    });

    useEffect(() => {
        let vivo = true;
        Promise.all([listarPedidosVenda(), listarClientes().catch(() => [])]).then(([lista, cadastro]) => {
            if (!vivo) {
                return;
            }
            const achado = acharPedido(lista, chave);
            setPedido(achado);
            setClientes(Array.isArray(cadastro) ? cadastro : []);
            if (achado) {
                setForm({
                    clienteId: achado.clienteId || "",
                    cliente: achado.cliente || "",
                    origem: achado.origem || "Loja",
                    valor: achado.valor ?? "",
                    status: achado.status || "EM_ABERTO",
                    vendedor: achado.vendedor || ""
                });
            }
        }).finally(() => {
            if (vivo) {
                setLoading(false);
            }
        });
        return () => {
            vivo = false;
        };
    }, [chave]);

    async function salvar() {
        if (!pedido) {
            return;
        }
        setTrabalhando(true);
        try {
            const cliente = clientes.find((c) => String(c.id) === String(form.clienteId));
            await atualizarPedidoVenda(pedido.id, {
                ...pedido,
                clienteId: form.clienteId || pedido.clienteId,
                cliente: cliente?.nome || form.cliente,
                origem: form.origem,
                valor: Number(form.valor || 0),
                status: form.status,
                vendedor: form.vendedor
            });
            navigate(`${ROTAS.PEDIDO_VENDA}#list`);
        } catch {
            setAviso("Não foi possível salvar o pedido.");
        } finally {
            setTrabalhando(false);
        }
    }

    if (loading) {
        return (
            <div className="os-page">
                <p>Carregando pedido...</p>
            </div>
        );
    }

    if (!pedido) {
        return (
            <div className="os-page pv-page">
                <p>Pedido {chave} não encontrado.</p>
                <Link to={`${ROTAS.PEDIDO_VENDA}#list`}>voltar à lista</Link>
            </div>
        );
    }

    return (
        <div className="os-page pv-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>vendas</span>
                <span>›</span>
                <Link to={`${ROTAS.PEDIDO_VENDA}#list`}>pedidos</Link>
                <span>›</span>
                <span>{pedido.numero}</span>
            </nav>
            <div className="fer-head">
                <div>
                    <h2>Pedido {pedido.numero}</h2>
                    <p className="prd-sub">{pedido.cliente || "Sem cliente"} · {rotuloStatusPedido(pedido.status)}</p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    <Link className="os-ghost" to={`${ROTAS.PEDIDO_VENDA}#list`}>voltar à lista</Link>
                    <button type="button" className="prd-btn prd-btn-primary" disabled={trabalhando} onClick={salvar}>salvar</button>
                </div>
            </div>
            <div className="pv-modal" style={{ position: "static", maxWidth: 640, margin: "0 0 24px" }}>
                <label>
                    Cliente
                    <select value={form.clienteId || ""} onChange={(e) => {
                        const c = clientes.find((item) => String(item.id) === e.target.value);
                        setForm((a) => ({ ...a, clienteId: e.target.value, cliente: c?.nome || "" }));
                    }}
                    >
                        <option value="">{form.cliente || "Selecione o cliente"}</option>
                        {clientes.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Origem
                    <select value={form.origem} onChange={(e) => setForm((a) => ({ ...a, origem: e.target.value }))}>
                        {ORIGENS_PEDIDO.map((origem) => (
                            <option key={origem} value={origem}>{origem}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Situação
                    <select value={form.status} onChange={(e) => setForm((a) => ({ ...a, status: e.target.value }))}>
                        {STATUS_PEDIDO_VENDA.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Vendedor
                    <input value={form.vendedor} onChange={(e) => setForm((a) => ({ ...a, vendedor: e.target.value }))} />
                </label>
                <label>
                    Total
                    <input type="number" step="0.01" value={form.valor} onChange={(e) => setForm((a) => ({ ...a, valor: e.target.value }))} />
                </label>
            </div>
            <h3>Itens</h3>
            <table className="fer-table os-table">
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Descrição</th>
                        <th className="is-num">Qtd</th>
                    </tr>
                </thead>
                <tbody>
                    {(pedido.itens || []).length === 0 ? (
                        <tr><td colSpan={3} className="ctt-vazio">Nenhum item neste pedido.</td></tr>
                    ) : (pedido.itens || []).map((item, i) => (
                        <tr key={item.sku || i}>
                            <td>{item.sku || "—"}</td>
                            <td>{item.descricao || "—"}</td>
                            <td className="is-num">{item.quantidade || 1}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function PedidoVenda() {
    const { hash, pathname } = useLocation();
    if (pathname === "/vendas" && (!hash || hash === "#")) {
        return <Navigate to="/vendas#list" replace />;
    }
    const editar = String(hash).match(/^#edit\/([^/?#]+)/);
    if (editar) {
        return <PedidoEditar chave={decodeURIComponent(editar[1])} />;
    }
    return <ListaPedidos vista="pedidos" />;
}

export function ListaPedidos({ vista = "pedidos" }) {
    const meta = VISTAS[vista] || VISTAS.pedidos;
    const raiz = useRef(null);
    const navigate = useNavigate();
    const { search } = useLocation();
    const [params, setParams] = useSearchParams();
    const abaUrl = params.get("filtro") || new URLSearchParams(search).get("filtro");
    const abasTodas = abasDaVista(meta);
    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState("");
    const [aba, setAba] = useState(abaUrl && abasTodas.some((a) => a.id === abaUrl) ? abaUrl : meta.abaPadrao);
    const [aberto, setAberto] = useState(null);
    const [marcados, setMarcados] = useState([]);
    const [aviso, setAviso] = useState("");
    const [trabalhando, setTrabalhando] = useState(false);
    const [novoAberto, setNovoAberto] = useState(false);
    const [filtros, setFiltros] = useState(filtrosVazios);
    const [rascunho, setRascunho] = useState(filtrosVazios);
    const [periodo, setPeriodo] = useState(periodoPadrao);
    const [rascunhoPeriodo, setRascunhoPeriodo] = useState(periodoPadrao);
    const [colunas, setColunas] = useState(colunasSalvas);
    const [rascunhoColunas, setRascunhoColunas] = useState(colunasSalvas);
    const [pagina, setPagina] = useState(1);
    const formVazio = {
        cliente: "",
        clienteId: "",
        origem: "Loja",
        vendedor: "",
        equipe: [],
        poolPct: PCT_COMISSAO_PADRAO,
        valor: "",
        sku: "",
        naturezaOperacaoId: "",
        naturezaOperacao: "",
        cfop: ""
    };
    const [form, setForm] = useState(formVazio);
    const [clientes, setClientes] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [naturezas, setNaturezas] = useState([]);
    const planilhaRef = useRef(null);
    const [importando, setImportando] = useState(false);
    const [importadorMassa, setImportadorMassa] = useState(false);
    const olist = vista === "pedidos";

    async function carregar() {
        setLoading(true);
        try {
            setLista(await listarPedidosVenda());
            setAviso("");
        } catch (erro) {
            console.error(erro);
            setLista([]);
            setAviso("Não foi possível ler os pedidos de venda.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
        listarClientes().then(setClientes).catch(() => setClientes([]));
        listarProdutos().then(setProdutos).catch(() => setProdutos([]));
        listarNaturezasOperacao().then(setNaturezas).catch(() => setNaturezas([]));
    }, []);

    useEffect(() => {
        function fechar(ev) {
            if (raiz.current && !raiz.current.contains(ev.target)) {
                setAberto(null);
            }
        }
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, []);

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return lista.filter((pedido) => {
            const p = marcarIncompleto(pedido, clientes);
            if (!passaAbaPedido(p, aba)) {
                return false;
            }
            if (olist && !passaPeriodo(p, periodo)) {
                return false;
            }
            if (filtros.origem && p.origem !== filtros.origem) {
                return false;
            }
            if (filtros.estoque === "nao" && p.estoqueLancado) {
                return false;
            }
            if (filtros.estoque === "sim" && !p.estoqueLancado) {
                return false;
            }
            if (filtros.contas === "nao" && p.contasLancadas) {
                return false;
            }
            if (filtros.contas === "sim" && !p.contasLancadas) {
                return false;
            }
            if (filtros.vendedor && String(p.vendedor || "").toLowerCase() !== filtros.vendedor.toLowerCase()) {
                return false;
            }
            if (filtros.marcador && !String(p.marcadores || "").toLowerCase().includes(filtros.marcador.toLowerCase())) {
                return false;
            }
            if (filtros.envio && String(p.formaEnvio || "") !== filtros.envio) {
                return false;
            }
            if (filtros.cidade && cidadePedido(p, clientes).toLowerCase() !== filtros.cidade.toLowerCase()) {
                return false;
            }
            if (filtros.pagamento && statusPagamento(p) !== filtros.pagamento) {
                return false;
            }
            if (filtros.sku) {
                const sku = filtros.sku.toLowerCase();
                const hit = (p.itens || []).some((item) => String(item.sku || item.descricao || "").toLowerCase().includes(sku));
                if (!hit) {
                    return false;
                }
            }
            if (!termo) {
                return true;
            }
            const doc = documentoCliente(p, clientes);
            return [p.numero, p.cliente, fantasiaPedido(p, clientes), p.vendedor, p.origem, p.status, p.cfop, p.naturezaOperacao, p.marcadores, p.rastreio, cidadePedido(p, clientes), doc]
                .join(" ")
                .toLowerCase()
                .includes(termo);
        });
    }, [lista, busca, aba, filtros, periodo, olist, clientes]);

    const contagens = useMemo(() => {
        const base = lista.filter((p) => {
            if (olist && !passaPeriodo(p, periodo)) {
                return false;
            }
            if (filtros.origem && p.origem !== filtros.origem) {
                return false;
            }
            const termo = busca.trim().toLowerCase();
            if (!termo) {
                return true;
            }
            return [p.numero, p.cliente, p.vendedor, p.origem, p.status].join(" ").toLowerCase().includes(termo);
        });
        const mapa = {};
        abasTodas.forEach((item) => {
            mapa[item.id] = base.filter((p) => passaAbaPedido(marcarIncompleto(p, clientes), item.id)).length;
        });
        return mapa;
    }, [lista, busca, filtros.origem, periodo, olist, abasTodas, clientes]);

    const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
    const paginaAtual = Math.min(pagina, paginas);
    const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

    useEffect(() => {
        setPagina(1);
    }, [aba, busca, filtros, periodo]);

    function escolherAba(id) {
        setAba(id);
        setMarcados([]);
        const next = new URLSearchParams(params);
        if (id === meta.abaPadrao) {
            next.delete("filtro");
        } else {
            next.set("filtro", id);
        }
        setParams(next, { replace: true });
    }

    function toggleMarca(id) {
        setMarcados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
    }

    function marcarPagina() {
        const ids = visiveis.map((p) => p.id);
        const todos = ids.length > 0 && ids.every((id) => marcados.includes(id));
        setMarcados(todos ? marcados.filter((id) => !ids.includes(id)) : [...new Set([...marcados, ...ids])]);
    }

    function visivel(id) {
        return colunas.includes(id);
    }

    function falar(msg) {
        setAviso(msg);
        setAberto(null);
    }

    function exportarPlanilha() {
        exportarPlanilhaPedidos(filtrados.length ? filtrados : lista);
        falar("Planilha de pedidos exportada.");
    }

    async function importarExcel(arquivo) {
        if (!arquivo) {
            return;
        }
        setImportando(true);
        try {
            const itens = await lerPlanilhaPedidos(arquivo);
            if (!itens.length) {
                setAviso("A planilha não tem pedidos com número ou cliente.");
                return;
            }
            const resumo = await importarPedidosLote(itens);
            await carregar();
            const falhas = resumo.erros ? `, ${resumo.erros} com erro` : "";
            setAviso(`${arquivo.name}: ${resumo.novos} novos, ${resumo.atualizados} atualizados${falhas}.`);
        } catch (erro) {
            console.error(erro);
            setAviso(erro?.response?.data?.mensagem || erro?.message || "Não foi possível importar a planilha.");
        } finally {
            setImportando(false);
            setAberto(null);
            if (planilhaRef.current) {
                planilhaRef.current.value = "";
            }
        }
    }

    async function lancarSelecionados() {
        const ids = filtrados.filter((p) => marcados.includes(p.id) && !p.estoqueLancado).map((p) => p.id);
        if (!ids.length) {
            setAviso("Selecione pedidos com estoque ainda não lançado.");
            return;
        }
        setTrabalhando(true);
        try {
            const resumo = await lancarEstoquePedidos(ids);
            await carregar();
            setMarcados([]);
            const extra = (resumo.mensagens || []).slice(0, 3).join(" ");
            setAviso(`${resumo.ok} estoque(s) lançado(s)${resumo.erros ? `, ${resumo.erros} com erro.` : "."}${extra ? ` ${extra}` : ""}`);
        } finally {
            setTrabalhando(false);
        }
    }

    async function lancarUm(pedido) {
        setTrabalhando(true);
        try {
            const resumo = await lancarEstoquePedido(pedido.id);
            await carregar();
            setAviso(resumo.ok ? `Estoque lançado em ${pedido.numero}.` : resumo.mensagem || "Não foi possível lançar o estoque.");
        } finally {
            setTrabalhando(false);
            setAberto(null);
        }
    }

    async function mudarFlag(pedido, flags, mensagem) {
        setTrabalhando(true);
        try {
            await marcarFlagsPedido(pedido.id, flags);
            await carregar();
            if (mensagem) {
                setAviso(mensagem);
            }
        } finally {
            setTrabalhando(false);
            setAberto(null);
        }
    }

    async function aplicarFlagsSelecionados(flags, mensagem) {
        const ids = filtrados.filter((p) => marcados.includes(p.id)).map((p) => p.id);
        if (!ids.length) {
            setAviso("Selecione ao menos um pedido.");
            return;
        }
        setTrabalhando(true);
        try {
            for (const id of ids) {
                await marcarFlagsPedido(id, flags);
            }
            await carregar();
            setMarcados([]);
            setAviso(mensagem);
            setAberto(null);
        } finally {
            setTrabalhando(false);
        }
    }

    async function gerarOsPedido(pedido) {
        setTrabalhando(true);
        try {
            const salvo = await salvarOS({
                ...osVazia(),
                clienteId: pedido.clienteId || "",
                cliente: pedido.cliente,
                descricao: (pedido.itens || []).map((item) => `${item.quantidade || 1} × ${item.descricao || item.sku || "item"}`).join("; ") || `Pedido ${pedido.numero}`,
                valor: Number(pedido.valor || 0),
                status: "EM_ABERTO",
                vendedor: pedido.vendedor || "",
                observacoes: `Gerada a partir do pedido ${pedido.numero}`,
                itens: pedido.itens || []
            });
            setAviso(`OS ${salvo.numero || salvo.id} gerada`);
            navigate({ pathname: ROTAS.ORDEM_SERVICO, hash: `edit/${salvo.id}` });
        } catch {
            setAviso("Não foi possível gerar a OS.");
        } finally {
            setTrabalhando(false);
            setAberto(null);
        }
    }

    async function clonarPedido(pedido) {
        setTrabalhando(true);
        try {
            const salvo = await salvarPedidoVenda({
                ...pedido,
                id: undefined,
                numero: undefined,
                status: "EM_ABERTO",
                estoqueLancado: false,
                contasLancadas: false,
                separacao: "PENDENTE",
                expedicao: "PENDENTE",
                data: new Date().toISOString()
            });
            await carregar();
            setAviso(`Pedido ${salvo.numero} clonado.`);
        } catch {
            setAviso("Não foi possível clonar o pedido.");
        } finally {
            setTrabalhando(false);
            setAberto(null);
        }
    }

    function escolherClientePedido(id) {
        const c = clientes.find((item) => String(item.id) === String(id));
        if (!c) {
            setForm((a) => ({
                ...a,
                clienteId: "",
                cliente: "",
                naturezaOperacaoId: "",
                naturezaOperacao: "",
                cfop: ""
            }));
            return;
        }
        const sugestao = sugerirNatureza(c, naturezas);
        setForm((a) => ({
            ...a,
            clienteId: c.id,
            cliente: c.nome,
            naturezaOperacaoId: sugestao.naturezaId || "",
            naturezaOperacao: sugestao.nome || "",
            cfop: sugestao.cfop || ""
        }));
    }

    async function criarPedido() {
        if (!form.clienteId && !form.cliente.trim()) {
            setAviso("Informe o cliente.");
            return;
        }
        setTrabalhando(true);
        try {
            const salvo = await salvarPedidoVenda({
                clienteId: form.clienteId || null,
                cliente: form.cliente.trim(),
                origem: form.origem,
                vendedor: nomesEquipe(form.equipe) || form.vendedor.trim() || "Loja",
                vendedores: form.equipe,
                poolPct: form.poolPct,
                valor: Number(form.valor || 0),
                status: "APROVADO",
                estoqueLancado: false,
                contasLancadas: false,
                separacao: "PENDENTE",
                expedicao: "PENDENTE",
                marcadores: "1ª venda",
                naturezaOperacaoId: form.naturezaOperacaoId || null,
                naturezaOperacao: form.naturezaOperacao,
                cfop: form.cfop,
                data: new Date().toISOString(),
                itens: form.sku.trim() ? [{ sku: form.sku.trim(), descricao: form.sku.trim(), quantidade: 1 }] : []
            });
            registrarComissaoVenda({
                equipe: form.equipe,
                pedido: salvo.numero,
                cliente: form.cliente.trim(),
                valorVenda: Number(form.valor || 0),
                origem: "Pedido",
                poolPct: form.poolPct
            });
            setForm(formVazio);
            setNovoAberto(false);
            await carregar();
            escolherAba("estoque-nao");
            setAviso("Pedido incluído com estoque ainda não lançado.");
        } finally {
            setTrabalhando(false);
        }
    }

    const temFiltro = Boolean(
        filtros.origem || filtros.estoque || filtros.contas || filtros.vendedor || filtros.marcador || filtros.envio || filtros.sku || filtros.cidade || filtros.pagamento
        || busca || aba !== meta.abaPadrao || (olist && periodo.modo !== "nenhum")
    );
    const selecionados = filtrados.filter((p) => marcados.includes(p.id));
    const pendentesEstoque = selecionados.filter((p) => !p.estoqueLancado);
    const totalLista = filtrados.reduce((acc, p) => acc + Number(p.valor || 0), 0);
    const vendedores = [...new Set(lista.map((p) => p.vendedor).filter(Boolean))];
    const marcadores = [...new Set(lista.flatMap((p) => String(p.marcadores || "").split(/[,;]/).map((t) => t.trim()).filter(Boolean)))];
    const cidades = [...new Set(lista.map((p) => cidadePedido(p, clientes)).filter(Boolean))];

    function menuLinha(pedido) {
        return (
            <div className="ctt-menu is-row pv-menu-olist">
                <p className="pv-menu-tit">Nº {pedido.numero} · {pedido.cliente}</p>
                <button type="button" onClick={() => navigate(rotaEditarPedido(pedido))}>editar alguns dados</button>
                <button type="button" onClick={() => navigate(ROTAS.NFS)}>gerar nota fiscal</button>
                <button type="button" onClick={() => falar(`NFC-e do pedido ${pedido.numero} ainda não está habilitada.`)}>gerar NFC-e</button>
                <button type="button" onClick={() => navigate(ROTAS.NFS)}>gerar nota de serviço</button>
                <button type="button" disabled={trabalhando} onClick={() => gerarOsPedido(pedido)}>gerar ordem de serviço</button>
                {pedido.contasLancadas ? (
                    <button type="button" onClick={() => mudarFlag(pedido, { contasLancadas: false }, `Contas estornadas em ${pedido.numero}.`)}>estornar contas</button>
                ) : (
                    <button type="button" onClick={() => mudarFlag(pedido, { contasLancadas: true }, `Contas lançadas em ${pedido.numero}.`)}>lançar contas</button>
                )}
                {pedido.estoqueLancado ? (
                    <button type="button" onClick={() => mudarFlag(pedido, { estoqueLancado: false }, `Estoque estornado em ${pedido.numero}.`)}>estornar estoque</button>
                ) : (
                    <button type="button" disabled={trabalhando} onClick={() => lancarUm(pedido)}>lançar estoque</button>
                )}
                <button type="button" onClick={() => falar("Ordem de compra ainda não está ligada a este pedido.")}>gerar ordem de compra</button>
                <button type="button" onClick={() => falar(`Link do pedido ${pedido.numero} copiado internamente.`)}>compartilhar</button>
                <button type="button" disabled={trabalhando} onClick={() => clonarPedido(pedido)}>clonar venda</button>
                <button type="button" onClick={() => falar("Devolução registrada como ocorrência.")}>devolver produtos</button>
                <button type="button" onClick={() => window.print()}>imprimir etiqueta com clique</button>
                <button type="button" onClick={() => window.print()}>imprimir</button>
                <button type="button" onClick={() => window.print()}>salvar em PDF</button>
                <button type="button" onClick={() => window.print()}>imprimir carnê</button>
                <button type="button" onClick={() => window.print()}>imprimir pedido para produção</button>
                <button type="button" onClick={() => navigate(ROTAS.PRODUCAO)}>gerar ordem de produção</button>
                <button type="button" onClick={() => falar("Frete cortado neste pedido.")}>cortar fretes</button>
                <button type="button" onClick={() => navigate(`${ROTAS.SEPARACAO}/${pedido.id}`)}>bipar pedido</button>
                {pedido.separacao !== "SEPARADO" ? (
                    <button type="button" onClick={() => mudarFlag(pedido, { separacao: pedido.separacao === "SEPARANDO" ? "SEPARADO" : "SEPARANDO" }, `Separação atualizada em ${pedido.numero}.`)}>
                        {pedido.separacao === "SEPARANDO" ? "marcar separado" : "enviar para separação"}
                    </button>
                ) : null}
                {pedido.expedicao !== "DESPACHADO" ? (
                    <button type="button" onClick={() => mudarFlag(pedido, { expedicao: "DESPACHADO" }, `Pedido ${pedido.numero} enviado para expedição.`)}>enviar para expedição</button>
                ) : null}
                <button type="button" onClick={() => falar(pedido.rastreio ? `Rastreio ${pedido.rastreio}` : "Informe o código de rastreio no pedido.")}>enviar código de rastreio</button>
                <button type="button" onClick={() => falar("Ocorrências do pedido.")}>ocorrências</button>
                <button type="button" onClick={() => mudarFlag(pedido, { status: "FATURADO" }, `Situação de ${pedido.numero} alterada.`)}>alterar situação</button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="os-page">
                <p>Carregando pedidos de venda...</p>
            </div>
        );
    }

    return (
        <div className="os-page pv-page" ref={raiz}>
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>vendas</span>
                <span>›</span>
                <span>{meta.crumb}</span>
            </nav>

            <div className="fer-head">
                <div>
                    <h2>{meta.titulo}</h2>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    {olist ? (
                        <>
                            <button type="button" className="os-ghost" onClick={() => window.print()}>
                                <Printer size={14} /> imprimir
                            </button>
                            <button type="button" className="os-ghost" onClick={() => falar("Nenhum pedido novo recebido do e-commerce.")}>
                                receber do e-commerce
                            </button>
                        </>
                    ) : null}
                    {vista === "pedidos" ? (
                        <button type="button" className="prd-btn prd-btn-primary" onClick={() => setNovoAberto(true)}>
                            incluir pedido
                        </button>
                    ) : null}
                    {olist ? (
                        <div className="ctt-drop">
                            <button type="button" className="os-ghost" onClick={() => setAberto(aberto === "topo-mais" ? null : "topo-mais")}>
                                mais ações <ChevronDown size={14} />
                            </button>
                            {aberto === "topo-mais" ? (
                                <div className="ctt-menu pv-topo-mais">
                                    <button type="button" onClick={() => falar("Nenhum pedido novo recebido do e-commerce.")}>
                                        <Download size={14} /> receber pedidos do e-commerce
                                    </button>
                                    <button type="button" onClick={() => falar("Importe o pedido pela integração do e-commerce.")}>
                                        <Upload size={14} /> importar pedido do e-commerce
                                    </button>
                                    <button type="button" onClick={() => falar("Situação de envio atualizada com o e-commerce.")}>
                                        <RefreshCw size={14} /> atualizar situação de envio dos pedidos
                                    </button>
                                    <button type="button" onClick={() => falar("Consulta Pedidos.com / AliExpress ainda não está ligada.")}>
                                        <Search size={14} /> consultar pedidos.com/aliexpress
                                    </button>
                                    <button type="button" onClick={() => window.print()}>
                                        <Printer size={14} /> imprimir relatório
                                    </button>
                                    <button type="button" disabled={importando} onClick={() => { planilhaRef.current?.click(); setAberto(null); }}>
                                        <FileSpreadsheet size={14} /> {importando ? "importando planilha…" : "importar pedidos de uma planilha"}
                                    </button>
                                    <button type="button" disabled={importando} onClick={() => { setImportadorMassa(true); setAberto(null); }}>
                                        <FileSpreadsheet size={14} /> importar em massa (vários Excel)
                                    </button>
                                    <button type="button" onClick={exportarPlanilha}>
                                        <FileSpreadsheet size={14} /> exportar pedidos para planilha
                                    </button>
                                    <button type="button" onClick={() => { navigate("/ferramentas/importar/vendas"); setAberto(null); }}>
                                        <FileSpreadsheet size={14} /> baixar layout / ver exemplo
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    {vista !== "pedidos" ? (
                        <Link className="os-ghost" to={`${ROTAS.PEDIDO_VENDA}?filtro=estoque-nao#list`}>pedidos com estoque não lançado</Link>
                    ) : null}
                </div>
            </div>

            <input
                ref={planilhaRef}
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
                        placeholder="Pesquise por cliente ou número"
                    />
                </label>
                {olist ? (
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
                                <div className="pv-periodo-tabs">
                                    <button type="button" className={rascunhoPeriodo.campo === "venda" ? "is-on" : ""} onClick={() => setRascunhoPeriodo((a) => ({ ...a, campo: "venda" }))}>data venda</button>
                                    <button type="button" className={rascunhoPeriodo.campo === "faturamento" ? "is-on" : ""} onClick={() => setRascunhoPeriodo((a) => ({ ...a, campo: "faturamento" }))}>data faturamento</button>
                                </div>
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
                                    <button type="button" className="prd-btn prd-btn-primary" onClick={() => { setPeriodo(rascunhoPeriodo); setAberto(null); }}>aplicar</button>
                                    <button type="button" className="prd-btn" onClick={() => setAberto(null)}>cancelar</button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}
                <div className="ctt-drop">
                    <button
                        type="button"
                        className={`os-chip${Object.values(filtros).some(Boolean) ? " is-on" : ""}`}
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
                                Vendedor
                                <select value={rascunho.vendedor} onChange={(e) => setRascunho((a) => ({ ...a, vendedor: e.target.value }))}>
                                    <option value="">Nome do vendedor</option>
                                    {vendedores.map((v) => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Marcador
                                <select value={rascunho.marcador} onChange={(e) => setRascunho((a) => ({ ...a, marcador: e.target.value }))}>
                                    <option value="">Sem filtro por marcador</option>
                                    {marcadores.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                E-commerce
                                <select value={rascunho.origem} onChange={(e) => setRascunho((a) => ({ ...a, origem: e.target.value }))}>
                                    <option value="">Selecione</option>
                                    {ORIGENS_PEDIDO.map((origem) => (
                                        <option key={origem} value={origem}>{origem}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Forma de recebimento da venda
                                <select value={rascunho.pagamento} onChange={(e) => setRascunho((a) => ({ ...a, pagamento: e.target.value }))}>
                                    <option value="">Todas</option>
                                    <option value="recebido">recebido</option>
                                    <option value="aguardando recebimento">aguardando recebimento</option>
                                </select>
                            </label>
                            <label>
                                Forma de envio
                                <select value={rascunho.envio} onChange={(e) => setRascunho((a) => ({ ...a, envio: e.target.value }))}>
                                    <option value="">Todas</option>
                                    <option value="Correios">Correios</option>
                                    <option value="Transportadora">Transportadora</option>
                                    <option value="Retirada">Retirada</option>
                                </select>
                            </label>
                            <label>
                                Produto
                                <input value={rascunho.sku} onChange={(e) => setRascunho((a) => ({ ...a, sku: e.target.value }))} placeholder="Nome ou SKU" />
                            </label>
                            <label>
                                Estoque
                                <select value={rascunho.estoque} onChange={(e) => setRascunho((a) => ({ ...a, estoque: e.target.value }))}>
                                    <option value="">Todos</option>
                                    <option value="nao">Estoque não lançado</option>
                                    <option value="sim">Estoque lançado</option>
                                </select>
                            </label>
                            <label>
                                Contas a receber
                                <select value={rascunho.contas} onChange={(e) => setRascunho((a) => ({ ...a, contas: e.target.value }))}>
                                    <option value="">Todas</option>
                                    <option value="nao">Contas não lançadas</option>
                                    <option value="sim">Contas lançadas</option>
                                </select>
                            </label>
                            <label>
                                Cidade
                                <select value={rascunho.cidade} onChange={(e) => setRascunho((a) => ({ ...a, cidade: e.target.value }))}>
                                    <option value="">Qualquer cidade</option>
                                    {cidades.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="ctt-menu-acoes">
                                <button type="button" className="prd-btn prd-btn-primary" onClick={() => { setFiltros(rascunho); setAberto(null); }}>aplicar</button>
                                <button type="button" className="prd-btn" onClick={() => setAberto(null)}>cancelar</button>
                            </div>
                        </div>
                    ) : null}
                </div>
                <button
                    type="button"
                    className="idx-text"
                    disabled={!temFiltro}
                    onClick={() => {
                        setFiltros(filtrosVazios());
                        setBusca("");
                        setPeriodo({ ...periodoPadrao(), modo: "nenhum" });
                        escolherAba(meta.abaPadrao);
                    }}
                >
                    limpar filtros
                </button>
            </div>

            {olist ? (
                <div className="pv-antecipa">
                    <span>Confira os valores da sua antecipação imediata</span>
                    <button type="button" className="os-ghost" onClick={() => falar("Antecipação imediata ainda não está habilitada.")}>
                        antecipação imediata
                    </button>
                </div>
            ) : null}

            <div className="os-tabs">
                {meta.abas.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={aba === item.id ? "is-active" : ""}
                        onClick={() => escolherAba(item.id)}
                    >
                        <span>
                            {item.cor ? <i style={{ background: item.cor }} /> : null}
                            {item.label}
                        </span>
                        <strong>{String(contagens[item.id] || 0).padStart(2, "0")}</strong>
                    </button>
                ))}
                {meta.extra?.length ? (
                    <div className="ctt-drop pv-tabs-mais">
                        <button type="button" className={meta.extra.some((a) => a.id === aba) ? "is-active" : ""} onClick={() => setAberto(aberto === "mais-abas" ? null : "mais-abas")}>
                            <span>mais …</span>
                        </button>
                        {aberto === "mais-abas" ? (
                            <div className="ctt-menu">
                                {meta.extra.map((item) => (
                                    <button key={item.id} type="button" onClick={() => escolherAba(item.id)}>
                                        {item.label} ({String(contagens[item.id] || 0).padStart(2, "0")})
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : null}
                {olist ? (
                    <button
                        type="button"
                        className="os-cols-btn"
                        onClick={() => {
                            setRascunhoColunas(colunas);
                            setAberto(aberto === "colunas" ? null : "colunas");
                        }}
                    >
                        <Columns3 size={16} />
                    </button>
                ) : null}
            </div>

            {aberto === "colunas" ? (
                <div className="ctt-menu ctt-menu-form pv-colunas">
                    <label className="pv-check">
                        <input
                            type="checkbox"
                            checked={rascunhoColunas.length === COLUNAS_PEDIDO.length}
                            onChange={(e) => setRascunhoColunas(e.target.checked ? COLUNAS_PEDIDO.map((c) => c.id) : [...COLUNAS_PEDIDO_PADRAO])}
                        />
                        todas as colunas
                    </label>
                    {COLUNAS_PEDIDO.map((c) => (
                        <label key={c.id} className="pv-check">
                            <input
                                type="checkbox"
                                checked={rascunhoColunas.includes(c.id)}
                                onChange={(e) => setRascunhoColunas((atual) => (e.target.checked ? [...atual, c.id] : atual.filter((id) => id !== c.id)))}
                            />
                            {c.label}
                        </label>
                    ))}
                    <div className="ctt-menu-acoes">
                        <button
                            type="button"
                            className="prd-btn prd-btn-primary"
                            onClick={() => {
                                const next = rascunhoColunas.length ? rascunhoColunas : COLUNAS_PEDIDO_PADRAO;
                                setColunas(next);
                                localStorage.setItem(COLUNAS_KEY, JSON.stringify(next));
                                setAberto(null);
                            }}
                        >
                            aplicar
                        </button>
                        <button type="button" className="prd-btn" onClick={() => setAberto(null)}>cancelar</button>
                    </div>
                </div>
            ) : null}

            <div className="os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th className="ctt-check">
                                <input
                                    type="checkbox"
                                    checked={visiveis.length > 0 && visiveis.every((p) => marcados.includes(p.id))}
                                    onChange={marcarPagina}
                                    aria-label="Selecionar todos"
                                />
                            </th>
                            <th />
                            {olist && visivel("foto") ? <th /> : null}
                            {olist ? COLUNAS_PEDIDO.filter((c) => c.id !== "foto" && visivel(c.id)).map((c) => (
                                <th key={c.id} className={c.id === "total" ? "is-num" : ""}>{c.label}</th>
                            )) : (
                                <>
                                    <th>Nº</th>
                                    <th>Data</th>
                                    <th>Cliente</th>
                                    <th>CFOP</th>
                                    <th>Origem</th>
                                    <th>Vendedores</th>
                                    <th className="is-num">Total</th>
                                    <th>Estoque</th>
                                    <th>Contas</th>
                                    {vista !== "expedicao" ? <th>Separação</th> : null}
                                    {vista === "separacao" ? <th>Embalagem</th> : null}
                                    {vista !== "separacao" ? <th>Expedição</th> : null}
                                    {vista === "separacao" ? <th /> : null}
                                    <th>Status</th>
                                </>
                            )}
                            {olist ? <th /> : null}
                        </tr>
                    </thead>
                    <tbody>
                        {visiveis.length === 0 ? (
                            <tr>
                                <td colSpan={20} className="ctt-vazio">
                                    Nenhum pedido encontrado com este filtro.
                                </td>
                            </tr>
                        ) : visiveis.map((pedido) => (
                            <tr key={pedido.id} className={marcados.includes(pedido.id) ? "is-sel" : ""}>
                                <td className="ctt-check">
                                    <input
                                        type="checkbox"
                                        checked={marcados.includes(pedido.id)}
                                        onChange={() => toggleMarca(pedido.id)}
                                    />
                                </td>
                                <td className="os-row-menu">
                                    <button type="button" onClick={() => setAberto(aberto === pedido.id ? null : pedido.id)} aria-label="Ações">
                                        <MoreHorizontal size={16} />
                                    </button>
                                    {aberto === pedido.id ? (olist ? menuLinha(pedido) : (
                                        <div className="ctt-menu is-row">
                                            <button type="button" onClick={() => navigate(rotaEditarPedido(pedido))}>editar alguns dados</button>
                                            {!pedido.estoqueLancado ? (
                                                <button type="button" onClick={() => lancarUm(pedido)}>lançar estoque</button>
                                            ) : null}
                                            {!pedido.contasLancadas ? (
                                                <button type="button" onClick={() => mudarFlag(pedido, { contasLancadas: true }, `Contas lançadas em ${pedido.numero}.`)}>marcar contas lançadas</button>
                                            ) : null}
                                            <button type="button" onClick={() => navigate(`${ROTAS.SEPARACAO}/${pedido.id}`)}>bipar pedido</button>
                                            {pedido.separacao !== "SEPARADO" ? (
                                                <button type="button" onClick={() => mudarFlag(pedido, { separacao: pedido.separacao === "SEPARANDO" ? "SEPARADO" : "SEPARANDO" })}>
                                                    {pedido.separacao === "SEPARANDO" ? "marcar separado" : "iniciar separação"}
                                                </button>
                                            ) : null}
                                            {pedido.expedicao !== "DESPACHADO" ? (
                                                <button type="button" onClick={() => mudarFlag(pedido, { expedicao: "DESPACHADO" }, `Pedido ${pedido.numero} despachado.`)}>marcar despachado</button>
                                            ) : null}
                                        </div>
                                    )) : null}
                                </td>
                                {olist && visivel("foto") ? (
                                    <td>
                                        {(() => {
                                            const foto = fotoItem(pedido, produtos);
                                            return foto.src ? (
                                                <img className="pv-thumb" src={foto.src} alt="" />
                                            ) : (
                                                <span className="pv-thumb is-empty" style={{ background: foto.bg }}>{foto.emoji}</span>
                                            );
                                        })()}
                                    </td>
                                ) : null}
                                {olist ? (
                                    <>
                                        {visivel("numero") ? <td><Link className="os-num" to={rotaEditarPedido(pedido)}>{pedido.numero}</Link></td> : null}
                                        {visivel("data") ? <td>{dataPedidoBr(pedido.data)}</td> : null}
                                        {visivel("previsto") ? <td>{pedido.previsto ? dataPedidoBr(pedido.previsto) : ""}</td> : null}
                                        {visivel("despacho") ? <td>{pedido.dataLimiteDespacho ? dataPedidoBr(pedido.dataLimiteDespacho) : ""}</td> : null}
                                        {visivel("cliente") ? <td><Link className="os-cli" to={rotaEditarPedido(pedido)}>{pedido.cliente}</Link></td> : null}
                                        {visivel("fantasia") ? <td>{fantasiaPedido(pedido, clientes)}</td> : null}
                                        {visivel("uf") ? <td>{ufPedido(pedido, clientes)}</td> : null}
                                        {visivel("cidade") ? <td>{cidadePedido(pedido, clientes)}</td> : null}
                                        {visivel("documento") ? <td>{documentoCliente(pedido, clientes) || ""}</td> : null}
                                        {visivel("pagamento") ? (
                                            <td>
                                                <span className={`pv-pag${pedido.contasLancadas ? " is-ok" : ""}`}>
                                                    {statusPagamento(pedido)}
                                                </span>
                                            </td>
                                        ) : null}
                                        {visivel("total") ? <td className="is-num">{moedaPedido(pedido.valor)}</td> : null}
                                        {visivel("npedido") ? <td><Link className="os-num" to={rotaEditarPedido(pedido)}>{pedido.numeroPedido || pedido.numero}</Link></td> : null}
                                        {visivel("nf") ? <td>{pedido.notaFiscal || ""}</td> : null}
                                        {visivel("envio") ? <td>{pedido.formaEnvio || ""}</td> : null}
                                        {visivel("rastreio") ? <td>{pedido.rastreio || ""}</td> : null}
                                        {visivel("marcadores") ? (
                                            <td>
                                                {pedido.marcadores ? <span className="pv-tag">{pedido.marcadores}</span> : null}
                                            </td>
                                        ) : null}
                                        {visivel("integracoes") ? (
                                            <td>
                                                <span className="os-int" title="E = e-commerce · C = contas">
                                                    <em className={origemEcommerce(pedido.origem) ? "is-on pv-int-e" : "pv-int-e"}>E</em>
                                                    <em className={pedido.contasLancadas ? "is-on" : ""}>C</em>
                                                </span>
                                            </td>
                                        ) : null}
                                        <td>
                                            <span className="os-dot" style={{ background: corSituacaoPedido(pedido) }} title={rotuloStatusPedido(pedido.status)} />
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td><Link className="os-num" to={rotaEditarPedido(pedido)}>{pedido.numero}</Link></td>
                                        <td>{dataPedidoBr(pedido.data)}</td>
                                        <td><Link className="os-cli" to={rotaEditarPedido(pedido)}>{pedido.cliente}</Link></td>
                                        <td>{pedido.cfop ? `CFOP ${pedido.cfop}` : "—"}</td>
                                        <td>{pedido.origem}</td>
                                        <td title={pedido.vendedor}>{pedido.vendedor || "—"}</td>
                                        <td className="is-num">{moedaPedido(pedido.valor)}</td>
                                        <td>
                                            <span className={`pv-flag${pedido.estoqueLancado ? " is-ok" : " is-off"}`}>
                                                {pedido.estoqueLancado ? "Lançado" : "Não lançado"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="os-int" title="C = contas · V = estoque">
                                                <em className={pedido.contasLancadas ? "is-on" : ""}>C</em>
                                                <em className={pedido.estoqueLancado ? "is-on" : ""}>V</em>
                                            </span>
                                        </td>
                                        {vista !== "expedicao" ? <td>{rotuloSeparacao(pedido.separacao)}</td> : null}
                                        {vista === "separacao" ? <td>{rotuloEmbalagem(pedido.embalagem, pedido.separacao)}</td> : null}
                                        {vista !== "separacao" ? <td>{rotuloExpedicao(pedido.expedicao)}</td> : null}
                                        {vista === "separacao" ? (
                                            <td>
                                                <button type="button" className="prd-btn" onClick={() => navigate(`${ROTAS.SEPARACAO}/${pedido.id}`)}>
                                                    <ScanLine size={14} /> bipar
                                                </button>
                                            </td>
                                        ) : null}
                                        <td>{rotuloStatusPedido(pedido.status)}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {olist ? (
                <div className="pv-foot">
                    <div className="pv-pags">
                        {Array.from({ length: paginas }, (_, i) => i + 1).slice(0, 8).map((n) => (
                            <button key={n} type="button" className={n === paginaAtual ? "is-on" : ""} onClick={() => setPagina(n)}>
                                {String(n).padStart(2, "0")}
                            </button>
                        ))}
                    </div>
                    <div className="pv-totais">
                        <span>{marcados.length ? `${marcados.length} selecionados` : `${filtrados.length} quantidade`}</span>
                        <strong>{moedaPedido(marcados.length ? selecionados.reduce((acc, p) => acc + Number(p.valor || 0), 0) : totalLista)}</strong>
                    </div>
                </div>
            ) : null}

            {olist || marcados.length > 0 ? (
                <div className="os-bulk">
                    <span className="os-bulk-n">{String(marcados.length).padStart(2, "0")}</span>
                    {olist ? (
                        <>
                            <button type="button" onClick={() => navigate(ROTAS.NFS)}>
                                <FileText size={14} /> gerar notas fiscais
                            </button>
                            <button type="button" onClick={() => falar("Situação sincronizada com o e-commerce.")}>sincronizar situação</button>
                            <button type="button" onClick={() => falar("Fretes cortados nos pedidos selecionados.")}>cortar fretes</button>
                            <button type="button" onClick={() => window.print()}>imprimir etiqueta</button>
                            <button type="button" disabled={trabalhando} onClick={() => aplicarFlagsSelecionados({ separacao: "SEPARANDO" }, "Pedidos enviados para separação.")}>enviar para separação</button>
                            <button type="button" disabled={trabalhando} onClick={() => aplicarFlagsSelecionados({ expedicao: "DESPACHADO" }, "Pedidos enviados para expedição.")}>enviar para expedição</button>
                            <div className="ctt-drop">
                                <button type="button" className="os-bulk-pri" onClick={() => setAberto(aberto === "bulk-mais" ? null : "bulk-mais")}>
                                    mais ações <ChevronDown size={14} />
                                </button>
                                {aberto === "bulk-mais" ? (
                                    <div className="ctt-menu pv-bulk-mais">
                                        <button type="button" onClick={() => navigate(ROTAS.NFS)}>gerar notas fiscais em lote</button>
                                        <button type="button" onClick={() => falar("NFC-e em lote ainda não habilitada.")}>gerar notas consumidor (NFC-e)</button>
                                        <button type="button" onClick={() => navigate(ROTAS.NFS)}>gerar notas de serviço</button>
                                        <button type="button" onClick={() => falar("Situação sincronizada com o e-commerce.")}>sincronização com e-commerce</button>
                                        <button type="button" onClick={() => window.print()}>imprimir pedidos</button>
                                        <button type="button" onClick={() => window.print()}>imprimir etiquetas</button>
                                        <button type="button" disabled={trabalhando} onClick={lancarSelecionados}>lançar estoque</button>
                                        <button type="button" disabled={trabalhando} onClick={() => aplicarFlagsSelecionados({ contasLancadas: true }, "Contas lançadas.")}>lançar contas</button>
                                        <button type="button" onClick={() => navigate(ROTAS.PRODUCAO)}>gerar ordens de produção</button>
                                        <button type="button" onClick={() => falar("Marcadores atualizados.")}>alterar marcadores</button>
                                        <button type="button" onClick={() => aplicarFlagsSelecionados({ status: "FATURADO" }, "Situação alterada.")}>alterar situação</button>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    ) : null}
                    {pendentesEstoque.length > 0 && !olist ? (
                        <button type="button" className="os-bulk-pri" disabled={trabalhando} onClick={lancarSelecionados}>
                            <Warehouse size={14} /> lançar estoque ({pendentesEstoque.length})
                        </button>
                    ) : null}
                    {vista === "separacao" && marcados.length === 1 ? (
                        <button type="button" onClick={() => navigate(`${ROTAS.SEPARACAO}/${marcados[0]}`)}>
                            <ScanLine size={14} /> bipar pedido
                        </button>
                    ) : null}
                    {vista === "separacao" ? (
                        <button type="button" disabled={trabalhando} onClick={() => aplicarFlagsSelecionados({ separacao: "SEPARADO" }, "Pedidos marcados como separados.")}>
                            <Package size={14} /> marcar separados
                        </button>
                    ) : null}
                    {vista === "expedicao" ? (
                        <button type="button" disabled={trabalhando} onClick={() => aplicarFlagsSelecionados({ expedicao: "DESPACHADO" }, "Pedidos marcados como despachados.")}>
                            <Check size={14} /> marcar despachados
                        </button>
                    ) : null}
                    <span className="os-bulk-tot">{moedaPedido(selecionados.reduce((acc, p) => acc + Number(p.valor || 0), 0))}</span>
                </div>
            ) : null}

            {novoAberto ? (
                <div className="pv-modal-bg" onClick={() => setNovoAberto(false)}>
                    <div className="pv-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Incluir pedido</h3>
                        <label>
                            Cliente
                            <select value={form.clienteId || ""} onChange={(e) => escolherClientePedido(e.target.value)}>
                                <option value="">Selecione o cliente</option>
                                {clientes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                            </select>
                        </label>
                        {form.cfop || form.naturezaOperacao ? (
                            <p className="prd-sub" style={{ margin: "0 0 8px" }}>
                                {rotuloNatureza({ cfop: form.cfop, nome: form.naturezaOperacao })}
                            </p>
                        ) : (
                            <p className="prd-sub" style={{ margin: "0 0 8px" }}>
                                A natureza e o CFOP entram automaticamente pelo cadastro fiscal do cliente.
                            </p>
                        )}
                        <label>
                            Origem
                            <select value={form.origem} onChange={(e) => setForm((a) => ({ ...a, origem: e.target.value }))}>
                                {ORIGENS_PEDIDO.map((origem) => (
                                    <option key={origem} value={origem}>{origem}</option>
                                ))}
                            </select>
                        </label>
                        <EquipeVenda
                            equipe={form.equipe}
                            onChange={(equipe) => setForm((a) => ({ ...a, equipe }))}
                            valorVenda={form.valor}
                            poolPct={form.poolPct}
                            onPoolPct={(poolPct) => setForm((a) => ({ ...a, poolPct }))}
                        />
                        <label>
                            Valor
                            <input type="number" step="0.01" value={form.valor} onChange={(e) => setForm((a) => ({ ...a, valor: e.target.value }))} />
                        </label>
                        <label>
                            SKU do item (opcional)
                            <input value={form.sku} onChange={(e) => setForm((a) => ({ ...a, sku: e.target.value }))} placeholder="Para lançar estoque depois" />
                        </label>
                        <div className="ctt-menu-acoes">
                            <button type="button" className="prd-btn prd-btn-primary" disabled={trabalhando} onClick={criarPedido}>salvar</button>
                            <button type="button" className="prd-btn" onClick={() => setNovoAberto(false)}>cancelar</button>
                        </div>
                    </div>
                </div>
            ) : null}

            {olist ? (
                <ImportadorMassa
                    aberto={importadorMassa}
                    ocupado={importando}
                    onFechar={() => setImportadorMassa(false)}
                    titulo="Importar pedidos de venda"
                    descricao="Selecione várias planilhas de pedidos do Olist (.xls/.xlsx/.csv) de uma vez."
                    dica="Vários Excel: pedidos_venda_1-503.xls, pedidos_venda_504-1000.xls…"
                    aceitos=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    permitirXml={false}
                    rotuloItem="pedidos"
                    lerExcel={lerArquivoPedido}
                    mesclar={mesclarLeiturasPedidos}
                    importarLote={importarPedidosLote}
                    onConcluido={async (mensagem) => {
                        setAviso(mensagem);
                        await carregar();
                    }}
                />
            ) : null}
        </div>
    );
}
