import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    BarChart3,
    CalendarDays,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    CircleX,
    ClipboardList,
    Clock,
    Columns3,
    CreditCard,
    DollarSign,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    MapPin,
    MoreHorizontal,
    MoreVertical,
    Package,
    Plus,
    Printer,
    RefreshCw,
    ScanLine,
    Search,
    ShoppingCart,
    SlidersHorizontal,
    Store,
    Trash2,
    Upload,
    UserRound,
    Warehouse,
    X
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
    abaSituacaoPedido,
    corSituacaoPedido,
    dataPedidoBr,
    formaPagamentoPedido,
    moedaPedido,
    notaFiscalPedido,
    passaAbaPedido,
    rotuloStatusPedido
} from "../../constants/pedidosVenda";
import { ehDevolucao } from "../../constants/devolucoes";
import { MESES, isoDate, osVazia } from "../../constants/ordensServico";
import ROTAS from "../../constants/rotas";
import EquipeVenda from "../../components/EquipeVenda";
import { registrarComissaoVenda } from "../../constants/comissoes";
import { rotuloNatureza, sugerirNatureza } from "../../constants/naturezasOperacao";
import { linhaVendedor, nomesEquipe, PCT_COMISSAO_PADRAO } from "../../constants/vendaVendedores";
import { listarClientes } from "../../services/clientes.service";
import { listarNaturezasOperacao } from "../../services/naturezaOperacao.service";
import { salvarOS } from "../../services/os.service";
import { rotaOrdemDoPedido } from "../../services/producao.service";
import { listarProdutos } from "../../services/produto.service";
import { ouvirPrecos } from "../../constants/precoPromocional";
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

const COLUNAS_KEY = "erp-pv-colunas-v3";
const HOJE = new Date();
const POR_PAGINA = 50;
const FORMAS_PAGAMENTO = ["Cartão de crédito", "PIX", "Boleto", "Transferência"];
const ORDEM_CHIPS = ["todas", "em-aberto", "aprovado", "preparando", "faturado", "pronto", "enviado", "entregue", "nao-entregue", "cancelado", "dados-incompletos"];

function tituloAba(label) {
    const texto = String(label || "");
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function janelaPaginas(atual, total) {
    if (total <= 6) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (atual <= 3) {
        return [1, 2, 3, 4, 5, "…", total];
    }
    if (atual >= total - 2) {
        return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, "…", atual - 1, atual, atual + 1, "…", total];
}

function seriePedidos(pedidos, modo) {
    const mapa = new Map();
    pedidos.forEach((pedido) => {
        const iso = String(pedido.data || "").slice(0, 10);
        if (!iso) {
            return;
        }
        const atual = mapa.get(iso) || 0;
        mapa.set(iso, atual + (modo === "valor" ? Number(pedido.valor || 0) : 1));
    });
    const vals = [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, valor]) => valor);
    if (!vals.length) {
        return [0, 0, 0, 0];
    }
    if (vals.length === 1) {
        return [vals[0], vals[0], vals[0], vals[0]];
    }
    return vals.slice(-8);
}

function variacaoPct(atual, anterior) {
    if (!anterior) {
        return atual ? 100 : 0;
    }
    return Math.round(((atual - anterior) / anterior) * 100);
}

function Spark({ valores, cor }) {
    const vals = valores?.length ? valores : [1, 2, 1.4, 2.2];
    const w = 92;
    const h = 34;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const pontos = vals.map((valor, i) => {
        const x = vals.length === 1 ? w / 2 : (i / (vals.length - 1)) * w;
        const y = h - ((valor - min) / span) * (h - 6) - 3;
        return `${x},${y}`;
    }).join(" ");
    return (
        <svg className="pv2-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
            <polyline fill="none" stroke={cor} strokeWidth="2.2" points={pontos} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function Tendencia({ valor }) {
    if (valor == null || Number.isNaN(valor)) {
        return null;
    }
    const alta = valor >= 0;
    return <em className={alta ? "is-up" : "is-down"}>{alta ? "↑ +" : "↓ "}{Math.abs(valor)}%</em>;
}

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

function periodoParaRascunho(periodo) {
    if (periodo.modo === "mes") {
        const inicio = new Date(periodo.ano, periodo.mes, 1);
        const fim = new Date(periodo.ano, periodo.mes + 1, 0);
        return { ...periodo, de: isoDate(inicio), ate: isoDate(fim) };
    }
    if (periodo.modo === "dia") {
        return { ...periodo, de: periodo.dia || "", ate: periodo.dia || "" };
    }
    return { ...periodo };
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
    if (pedido?.clienteId) {
        const porId = clientes.find((item) => String(item.id) === String(pedido.clienteId));
        if (porId) {
            return porId;
        }
    }
    const nome = String(pedido?.cliente || "").trim().toLowerCase();
    if (!nome || nome === "consumidor final") {
        return null;
    }
    return clientes.find((item) => String(item.nome || "").trim().toLowerCase() === nome) || null;
}

function documentoCliente(pedido, clientes) {
    return pedido.documento || clienteDoPedido(pedido, clientes)?.cpfCnpj || "";
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

function dataHoraPedido(valor) {
    if (!valor) {
        return { curto: "", cheio: "" };
    }
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) {
        const data = dataPedidoBr(valor);
        const cheio = data === "—" ? "" : data;
        return { curto: cheio.replace(/\/\d{4}$/, ""), cheio };
    }
    const data = d.toLocaleDateString("pt-BR");
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return {
        curto: `${data.slice(0, 5)} ${hora}`,
        cheio: `${data} ${hora}`
    };
}

function dataCurta(valor) {
    const cheio = valor ? dataPedidoBr(valor) : "";
    if (!cheio || cheio === "—") {
        return { curto: "", cheio: "" };
    }
    return { curto: cheio.replace(/\/\d{4}$/, ""), cheio };
}

const ROTULO_CURTO = {
    numero: "Venda",
    ecommerce: "E-comm.",
    nf: "NF",
    data: "Data",
    previsto: "Previsto",
    despacho: "Despacho",
    cliente: "Cliente",
    fantasia: "Fantasia",
    uf: "UF",
    cidade: "Cidade",
    vendedor: "Vendedor",
    documento: "Doc.",
    pagamento: "Pag.",
    envio: "Envio",
    rastreio: "Rastreio",
    marcadores: "Marc.",
    integracoes: "Int.",
    andamento: "Sit."
};

function numeroEcommercePedido(pedido) {
    const venda = String(pedido?.numero || "").trim();
    const olist = String(pedido?.olistId || "").trim();
    if (olist && olist !== venda) {
        return olist;
    }
    const extra = String(pedido?.numeroPedido || "").trim();
    if (extra && extra !== venda) {
        return extra;
    }
    return "";
}

function rotuloAndamentoPedido(pedido) {
    const aba = abaSituacaoPedido(pedido);
    const item = ABAS_PEDIDO.find((a) => a.id === aba);
    return item ? tituloAba(item.label) : rotuloStatusPedido(pedido.status);
}

function corAndamentoPedido(pedido) {
    const aba = abaSituacaoPedido(pedido);
    const item = ABAS_PEDIDO.find((a) => a.id === aba);
    return item?.cor || "#eab308";
}

function textoCelula(valor) {
    const texto = String(valor || "").trim();
    return texto || "—";
}

function produtoDoPedido(pedido, produtos) {
    const item = (pedido.itens || [])[0];
    if (!item) {
        return null;
    }
    const sku = String(item.sku || "").toLowerCase();
    const desc = String(item.descricao || "").trim().toLowerCase();
    return (sku && produtos.find((p) => String(p.sku || "").toLowerCase() === sku))
        || (desc && produtos.find((p) => String(p.nome || "").trim().toLowerCase() === desc))
        || null;
}

function rotaProdutoPedido(pedido, produtos) {
    const produto = produtoDoPedido(pedido, produtos);
    return produto?.id ? `${ROTAS.PRODUTOS}#edit/${encodeURIComponent(produto.id)}` : "";
}

function rotaContatoPedido(pedido, clientes) {
    const contato = clienteDoPedido(pedido, clientes);
    return contato?.id ? `/contatos/${encodeURIComponent(contato.id)}` : "";
}

function rotaAndamentoPedido(pedido) {
    const aba = abaSituacaoPedido(pedido);
    if (aba === "preparando") {
        return `${ROTAS.SEPARACAO}/${pedido.id}`;
    }
    if (aba === "pronto") {
        return `${ROTAS.EXPEDICAO}?filtro=fila&q=${encodeURIComponent(pedido.numero || "")}`;
    }
    if (aba === "enviado" || aba === "entregue" || aba === "nao-entregue") {
        return `${ROTAS.EXPEDICAO}?q=${encodeURIComponent(pedido.numero || "")}`;
    }
    return rotaEditarPedido(pedido);
}

function rotaRastreio(codigo) {
    const limpo = String(codigo || "").replace(/\s/g, "");
    if (limpo.length < 8) {
        return "";
    }
    return `https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(limpo)}`;
}

function fotoItem(pedido, produtos) {
    const item = (pedido.itens || [])[0];
    if (item?.foto || item?.imagem) {
        return { src: item.foto || item.imagem, emoji: "", bg: "" };
    }
    const produto = produtoDoPedido(pedido, produtos);
    const src = produto?.imagem || produto?.fotos?.[0]?.url || "";
    if (src) {
        return { src, emoji: "", bg: "" };
    }
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
    const { hash, pathname, search } = useLocation();
    if (pathname === "/vendas" && (!hash || hash === "#")) {
        return <Navigate to={{ pathname: "/vendas", search, hash: "list" }} replace />;
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
    const { search, pathname, hash } = useLocation();
    const [params] = useSearchParams();
    const abaUrl = params.get("filtro") || new URLSearchParams(search).get("filtro");
    const abasTodas = abasDaVista(meta);
    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState(() => params.get("q") || "");

    useEffect(() => {
        const q = params.get("q");
        if (q) {
            setBusca(q);
        }
    }, [params]);
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
    const [rascunhoAba, setRascunhoAba] = useState(aba);
    const [colunas, setColunas] = useState(colunasSalvas);
    const [rascunhoColunas, setRascunhoColunas] = useState(colunasSalvas);
    const [pagina, setPagina] = useState(1);
    const [porPaginaLista, setPorPaginaLista] = useState(20);
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
        cfop: "",
        formaPagamento: ""
    };
    const [form, setForm] = useState(formVazio);
    const contatoUrl = params.get("contato");
    const [clientes, setClientes] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [naturezas, setNaturezas] = useState([]);
    const planilhaRef = useRef(null);
    const periodoInicial = useRef(false);
    const [importando, setImportando] = useState(false);
    const [importadorMassa, setImportadorMassa] = useState(false);
    const olist = vista === "pedidos";

    async function carregar() {
        setLoading(true);
        try {
            const dados = await listarPedidosVenda();
            setLista(dados);
            if (olist && !periodoInicial.current) {
                periodoInicial.current = true;
                const padrao = periodoPadrao();
                const temNoMes = dados.some((pedido) => passaPeriodo(pedido, padrao));
                if (!temNoMes && dados.length) {
                    const iso = dados.reduce((max, pedido) => {
                        const dia = isoDate(pedido.data);
                        return dia > max ? dia : max;
                    }, "");
                    if (iso) {
                        const data = new Date(`${iso}T12:00:00`);
                        setPeriodo({ ...padrao, mes: data.getMonth(), ano: data.getFullYear() });
                    }
                }
            }
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
        return ouvirPrecos(() => {
            listarProdutos().then(setProdutos).catch(() => {});
        });
    }, []);

    useEffect(() => {
        if (!contatoUrl) {
            return undefined;
        }
        let vivo = true;
        listarClientes().then((cadastro) => {
            if (!vivo) {
                return;
            }
            const contato = (Array.isArray(cadastro) ? cadastro : []).find((item) => String(item.id) === String(contatoUrl));
            if (!contato) {
                return;
            }
            setBusca(contato.nome || "");
            setNovoAberto(true);
            const sugestao = sugerirNatureza(contato, naturezas);
            const vendedorContato = contato.vendedor
                ? [linhaVendedor({ funcId: contato.vendedorId || contato.vendedor, nome: contato.vendedor })]
                : [];
            setForm((atual) => ({
                ...atual,
                clienteId: contato.id,
                cliente: contato.nome || "",
                naturezaOperacaoId: sugestao.naturezaId || "",
                naturezaOperacao: sugestao.nome || "",
                cfop: sugestao.cfop || "",
                vendedor: contato.vendedor || atual.vendedor,
                equipe: vendedorContato.length ? vendedorContato : atual.equipe
            }));
        }).catch(() => {});
        return () => {
            vivo = false;
        };
    }, [contatoUrl, naturezas]);

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
            if (ehDevolucao(pedido)) {
                return false;
            }
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
            const itensTxt = (p.itens || []).map((item) => `${item.sku || ""} ${item.descricao || ""}`).join(" ");
            return [p.numero, p.cliente, fantasiaPedido(p, clientes), p.vendedor, p.origem, p.status, p.cfop, p.naturezaOperacao, p.marcadores, p.rastreio, cidadePedido(p, clientes), doc, p.notaFiscal, notaFiscalPedido(p), formaPagamentoPedido(p), itensTxt]
                .join(" ")
                .toLowerCase()
                .includes(termo);
        });
    }, [lista, busca, aba, filtros, periodo, olist, clientes]);

    const contagens = useMemo(() => {
        const base = lista.filter((p) => {
            if (ehDevolucao(p)) {
                return false;
            }
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

    const porPagina = olist ? porPaginaLista : POR_PAGINA;
    const paginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
    const paginaAtual = Math.min(pagina, paginas);
    const visiveis = filtrados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);

    useEffect(() => {
        setPagina(1);
    }, [aba, busca, filtros, periodo, porPaginaLista]);

    function escolherAba(id) {
        setAba(id);
        setMarcados([]);
        const next = new URLSearchParams(params);
        if (id === meta.abaPadrao) {
            next.delete("filtro");
        } else {
            next.set("filtro", id);
        }
        navigate({
            pathname,
            search: next.toString() ? `?${next.toString()}` : "",
            hash: hash || "list"
        }, { replace: true });
    }

    function limparLista() {
        setFiltros(filtrosVazios());
        setRascunho(filtrosVazios());
        setBusca("");
        setPeriodo(periodoPadrao());
        setRascunhoPeriodo(periodoPadrao());
        setRascunhoAba(meta.abaPadrao);
        escolherAba(meta.abaPadrao);
        setAberto(null);
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

    function exportarPlanilha(formato = "xls", origem) {
        const base = origem || (filtrados.length ? filtrados : lista);
        exportarPlanilhaPedidos(base, formato);
        falar(formato === "csv" ? "CSV de pedidos exportado." : "Planilha de pedidos exportada.");
        setAberto(null);
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

    async function enviarParaExpedicao(pedidos, mensagem) {
        const alvos = (Array.isArray(pedidos) ? pedidos : [pedidos]).filter((pedido) => pedido?.id);
        if (!alvos.length) {
            setAviso("Selecione ao menos um pedido.");
            return;
        }
        setTrabalhando(true);
        try {
            for (const pedido of alvos) {
                await atualizarPedidoVenda(pedido.id, {
                    ...pedido,
                    separacao: "SEPARADO",
                    embalagem: "EMBALADO",
                    expedicao: "PENDENTE"
                });
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
        const vendedorContato = c.vendedor
            ? [linhaVendedor({ funcId: c.vendedorId || c.vendedor, nome: c.vendedor })]
            : [];
        setForm((a) => ({
            ...a,
            clienteId: c.id,
            cliente: c.nome,
            naturezaOperacaoId: sugestao.naturezaId || "",
            naturezaOperacao: sugestao.nome || "",
            cfop: sugestao.cfop || "",
            vendedor: c.vendedor || a.vendedor,
            equipe: vendedorContato.length ? vendedorContato : a.equipe
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
                formaPagamento: form.formaPagamento,
                pagamento: form.formaPagamento ? "aguardando recebimento" : "",
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

    const mesPadrao = periodoPadrao();
    const precisaLimpar = Boolean(
        busca
        || aba !== meta.abaPadrao
        || filtros.origem || filtros.estoque || filtros.contas || filtros.vendedor || filtros.marcador || filtros.envio || filtros.sku || filtros.cidade || filtros.pagamento
        || periodo.modo !== "mes"
        || periodo.mes !== mesPadrao.mes
        || periodo.ano !== mesPadrao.ano
    );
    const selecionados = filtrados.filter((p) => marcados.includes(p.id));
    const pendentesEstoque = selecionados.filter((p) => !p.estoqueLancado);
    const totalLista = filtrados.reduce((acc, p) => acc + Number(p.valor || 0), 0);
    const vendedores = [...new Set(lista.map((p) => p.vendedor).filter(Boolean))];
    const marcadores = [...new Set(lista.flatMap((p) => String(p.marcadores || "").split(/[,;]/).map((t) => t.trim()).filter(Boolean)))];
    const cidades = [...new Set(lista.map((p) => cidadePedido(p, clientes)).filter(Boolean))];
    const kpis = useMemo(() => {
        const noPeriodo = (pedido, ref) => !olist || passaPeriodo(pedido, ref);
        const atual = lista.filter((pedido) => noPeriodo(pedido, periodo));
        const anteriorRef = periodo.modo === "mes"
            ? (() => {
                const data = new Date(periodo.ano, periodo.mes - 1, 1);
                return { ...periodo, mes: data.getMonth(), ano: data.getFullYear() };
            })()
            : null;
        const anterior = anteriorRef ? lista.filter((pedido) => passaPeriodo(pedido, anteriorRef)) : [];
        const vivos = (arr) => arr.filter((pedido) => String(pedido.status || "").toUpperCase() !== "CANCELADO");
        const soma = (arr) => vivos(arr).reduce((acc, pedido) => acc + Number(pedido.valor || 0), 0);
        const qtd = (arr) => vivos(arr).length;
        const fatAtual = soma(atual);
        const qtdAtual = qtd(atual);
        const fatAnterior = soma(anterior);
        const qtdAnterior = qtd(anterior);
        const ticketAtual = qtdAtual ? fatAtual / qtdAtual : 0;
        const ticketAnterior = qtdAnterior ? fatAnterior / qtdAnterior : 0;
        return {
            total: atual.length,
            totalVar: anteriorRef ? variacaoPct(atual.length, anterior.length) : null,
            faturamento: fatAtual,
            fatVar: anteriorRef ? variacaoPct(fatAtual, fatAnterior) : null,
            ticket: ticketAtual,
            ticketVar: anteriorRef ? variacaoPct(ticketAtual, ticketAnterior) : null,
            abertos: atual.filter((pedido) => passaAbaPedido(marcarIncompleto(pedido, clientes), "em-aberto")).length,
            faturados: atual.filter((pedido) => passaAbaPedido(pedido, "faturado")).length,
            cancelados: atual.filter((pedido) => String(pedido.status || "").toUpperCase() === "CANCELADO").length,
            serieQtd: seriePedidos(vivos(atual), "qtd"),
            serieValor: seriePedidos(vivos(atual), "valor"),
            serieCancel: seriePedidos(atual.filter((pedido) => String(pedido.status || "").toUpperCase() === "CANCELADO"), "qtd")
        };
    }, [lista, periodo, olist, clientes]);
    const chips = ORDEM_CHIPS.map((id) => meta.abas.find((item) => item.id === id)).filter(Boolean);
    const inicioPagina = filtrados.length ? (paginaAtual - 1) * porPagina + 1 : 0;
    const fimPagina = Math.min(paginaAtual * porPagina, filtrados.length);

    function menuLinha(pedido) {
        return (
            <div className="ctt-menu is-row pv-menu-olist">
                <p className="pv-menu-tit">Nº {pedido.numero} · {pedido.cliente}</p>
                <button type="button" onClick={() => navigate(rotaEditarPedido(pedido))}>editar alguns dados</button>
                <button type="button" onClick={() => navigate("/nota-fiscal")}>gerar nota fiscal</button>
                <button type="button" onClick={() => navigate("/nfce")}>gerar NFC-e</button>
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
                <button type="button" onClick={() => navigate(ROTAS.ORDENS_COMPRA)}>gerar ordem de compra</button>
                <button type="button" onClick={() => {
                    const url = `${window.location.origin}${rotaEditarPedido(pedido)}`;
                    navigator.clipboard?.writeText(url).then(() => falar("Link do pedido copiado.")).catch(() => falar(url));
                }}>compartilhar</button>
                <button type="button" disabled={trabalhando} onClick={() => clonarPedido(pedido)}>clonar venda</button>
                <button type="button" onClick={() => navigate(`${ROTAS.DEVOLUCOES}?pedido=${pedido.id}`)}>devolver produtos</button>
                <button type="button" onClick={() => window.print()}>imprimir etiqueta com clique</button>
                <button type="button" onClick={() => window.print()}>imprimir</button>
                <button type="button" onClick={() => window.print()}>salvar em PDF</button>
                <button type="button" onClick={() => window.print()}>imprimir carnê</button>
                <button type="button" onClick={() => window.print()}>imprimir pedido para produção</button>
                <button type="button" onClick={() => navigate(rotaOrdemDoPedido(pedido))}>gerar ordem de produção</button>
                <button type="button" onClick={() => falar("Frete cortado neste pedido.")}>cortar fretes</button>
                <button type="button" onClick={() => navigate(`${ROTAS.SEPARACAO}/${pedido.id}`)}>bipar pedido</button>
                {pedido.separacao !== "SEPARADO" ? (
                    <button type="button" onClick={() => mudarFlag(pedido, { separacao: pedido.separacao === "SEPARANDO" ? "SEPARADO" : "SEPARANDO" }, `Separação atualizada em ${pedido.numero}.`)}>
                        {pedido.separacao === "SEPARANDO" ? "marcar separado" : "enviar para separação"}
                    </button>
                ) : null}
                {pedido.expedicao !== "DESPACHADO" ? (
                    <button type="button" onClick={() => enviarParaExpedicao(pedido, `Pedido ${pedido.numero} na fila de coleta.`)}>enviar para expedição</button>
                ) : null}
                <button type="button" onClick={() => {
                    const url = rotaRastreio(pedido.rastreio);
                    if (url) {
                        window.open(url, "_blank", "noopener");
                        return;
                    }
                    falar("Informe o código de rastreio no pedido.");
                }}>enviar código de rastreio</button>
                <button type="button" onClick={() => falar("Ocorrências do pedido.")}>ocorrências</button>
                <button type="button" onClick={() => mudarFlag(pedido, { status: "FATURADO" }, `Situação de ${pedido.numero} alterada.`)}>alterar situação</button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="os-page pv2">
                <p>Carregando pedidos de venda...</p>
            </div>
        );
    }

    if (olist) {
        const mesAtivo = periodo.modo === "mes";
        return (
            <div className="os-page pv-page pv2" ref={raiz}>
                <nav className="pv2-crumb">
                    <Link to="/index">Início</Link>
                    <span>›</span>
                    <Link to="/dashboard#/vendas">Vendas</Link>
                    <span>›</span>
                    <strong>Pedidos de venda</strong>
                </nav>

                <header className="pv2-head">
                    <div>
                        <h1><ShoppingCart size={26} /> Pedidos de venda</h1>
                        <p>Gerencie e acompanhe todos os pedidos de venda da sua empresa.</p>
                        {aviso ? <p className="pv2-aviso">{aviso}</p> : null}
                    </div>
                    <div className="pv2-tools">
                        <div className="pv2-actions">
                            <div className="ctt-drop pv2-split">
                                <button type="button" className="ctt-btn-incluir" onClick={() => setNovoAberto(true)}>
                                    <Plus size={16} />
                                    Incluir pedido
                                </button>
                                <button
                                    type="button"
                                    className={`ctt-btn-incluir-mais${aberto === "topo-mais" ? " is-on" : ""}`}
                                    aria-label="Mais ações do pedido"
                                    onClick={() => setAberto(aberto === "topo-mais" ? null : "topo-mais")}
                                >
                                    <ChevronDown size={16} />
                                </button>
                                {aberto === "topo-mais" ? (
                                    <div className="ctt-menu pv-topo-mais">
                                        <button type="button" onClick={() => { window.print(); setAberto(null); }}>
                                            <Printer size={16} /> Imprimir
                                        </button>
                                        <button type="button" onClick={() => exportarPlanilha("csv")}>
                                            <FileSpreadsheet size={16} /> Exportar (.csv)
                                        </button>
                                        <button type="button" onClick={() => exportarPlanilha("xls")}>
                                            <FileSpreadsheet size={16} /> Exportar (.xlsx)
                                        </button>
                                        <button type="button" disabled={importando} onClick={() => { planilhaRef.current?.click(); setAberto(null); }}>
                                            <Upload size={16} /> {importando ? "Importando planilha…" : "Importar Planilha (.xls)"}
                                        </button>
                                        <button type="button" disabled={importando} onClick={() => { setImportadorMassa(true); setAberto(null); }}>
                                            <FileSpreadsheet size={16} /> Importar Planilha em Massa (.xls)
                                        </button>
                                        <button type="button" onClick={() => { setAberto(null); navigate(ROTAS.PEDIDO_ECOMMERCE); }}>
                                            <Download size={16} /> Receber do e-commerce
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </header>

                <input
                    ref={planilhaRef}
                    type="file"
                    accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    hidden
                    onChange={(e) => importarExcel(e.target.files?.[0])}
                />

                <section className="pv2-kpis">
                    <article>
                        <div>
                            <span>Total de pedidos</span>
                            <strong>{kpis.total}</strong>
                            <Tendencia valor={kpis.totalVar} />
                        </div>
                        <Spark valores={kpis.serieQtd} cor="#fb7185" />
                        <i className="is-rosa"><ShoppingCart size={16} /></i>
                    </article>
                    <article>
                        <div>
                            <span>Faturamento (mês)</span>
                            <strong>{moedaPedido(kpis.faturamento)}</strong>
                            <Tendencia valor={kpis.fatVar} />
                        </div>
                        <Spark valores={kpis.serieValor} cor="#22c55e" />
                        <i className="is-verde"><DollarSign size={16} /></i>
                    </article>
                    <article>
                        <div>
                            <span>Ticket médio</span>
                            <strong>{moedaPedido(kpis.ticket)}</strong>
                            <Tendencia valor={kpis.ticketVar} />
                        </div>
                        <Spark valores={kpis.serieValor} cor="#a78bfa" />
                        <i className="is-roxo"><BarChart3 size={16} /></i>
                    </article>
                    <article className="is-compact is-link" onClick={() => escolherAba("em-aberto")}>
                        <div>
                            <span>Pedidos em aberto</span>
                            <strong>{kpis.abertos}</strong>
                        </div>
                        <i className="is-amarelo"><Clock size={16} /></i>
                    </article>
                    <article className="is-compact is-link" onClick={() => escolherAba("faturado")}>
                        <div>
                            <span>Pedidos faturados</span>
                            <strong>{kpis.faturados}</strong>
                        </div>
                        <i className="is-verde"><CircleCheck size={16} /></i>
                    </article>
                    <article className="is-link" onClick={() => escolherAba("cancelado")}>
                        <div>
                            <span>Cancelados</span>
                            <strong>{kpis.cancelados}</strong>
                        </div>
                        <Spark valores={kpis.serieCancel} cor="#fb7185" />
                        <i className="is-vermelho"><CircleX size={16} /></i>
                    </article>
                </section>

                <div className="pv2-barra">
                <div className="pv2-busca">
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                setBusca("");
                            }
                        }}
                        placeholder="Pesquise por cliente, nº do pedido, CPF/CNPJ ou produto..."
                        aria-label="Pesquisar pedidos"
                        autoComplete="off"
                    />
                    {busca ? (
                        <button type="button" className="pv2-busca-limpar" onClick={() => setBusca("")} aria-label="Limpar busca">
                            <X size={14} />
                        </button>
                    ) : null}
                    <Search size={16} />
                </div>
                <div className="pv2-filters">
                            <div className="ctt-drop">
                                <button
                                    type="button"
                                    className={`pv2-ghost${mesAtivo ? " is-on" : ""}`}
                                    onClick={() => {
                                        setRascunhoPeriodo(periodo);
                                        setAberto(aberto === "mes" ? null : "mes");
                                    }}
                                >
                                    <CalendarDays size={15} />
                                    {periodo.modo === "mes" ? `${MESES[periodo.mes]} ${periodo.ano}` : rotuloPeriodo(periodo)}
                                </button>
                                {aberto === "mes" ? (
                                    <div className="ctt-menu ctt-menu-form os-periodo">
                                        <div className="pv-periodo-tabs">
                                            <button type="button" className={rascunhoPeriodo.campo === "venda" ? "is-on" : ""} onClick={() => setRascunhoPeriodo((a) => ({ ...a, campo: "venda" }))}>data venda</button>
                                            <button type="button" className={rascunhoPeriodo.campo === "faturamento" ? "is-on" : ""} onClick={() => setRascunhoPeriodo((a) => ({ ...a, campo: "faturamento" }))}>data faturamento</button>
                                        </div>
                                        <div className="os-periodo-modos">
                                            {[
                                                ["nenhum", "sem filtro"],
                                                ["dia", "do dia"],
                                                ["mes", "do mês"],
                                                ["intervalo", "do intervalo"]
                                            ].map(([id, nome]) => (
                                                <button key={id} type="button" className={rascunhoPeriodo.modo === id ? "is-on" : ""} onClick={() => setRascunhoPeriodo((a) => ({ ...a, modo: id }))}>{nome}</button>
                                            ))}
                                        </div>
                                        {rascunhoPeriodo.modo === "mes" ? (
                                            <div className="os-mes-nav">
                                                <button type="button" onClick={() => setRascunhoPeriodo((a) => mudarMes(a, -1))}>‹</button>
                                                <strong>{MESES[rascunhoPeriodo.mes]} {rascunhoPeriodo.ano}</strong>
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
                                            <button type="button" className="pv2-cta" onClick={() => { setPeriodo(rascunhoPeriodo); setAberto(null); }}>aplicar</button>
                                            <button type="button" className="pv2-ghost" onClick={() => setAberto(null)}>cancelar</button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                            <div className="ctt-drop">
                                <button
                                    type="button"
                                    className={`pv2-ghost pv2-filtros-btn${aberto === "filtros" ? " is-on" : ""}`}
                                    onClick={() => {
                                        const abrindo = aberto !== "filtros";
                                        if (abrindo) {
                                            setRascunho(filtros);
                                            setRascunhoPeriodo(periodoParaRascunho(periodo));
                                            setRascunhoAba(aba);
                                        }
                                        setAberto(abrindo ? "filtros" : null);
                                    }}
                                >
                                    <SlidersHorizontal size={15} /> Filtros
                                </button>
                                {aberto === "filtros" ? (
                                    <div className="ctt-menu pv2-filtros-painel">
                                        <header className="pv2-filtros-topo">
                                            <span className="pv2-filtros-icone" aria-hidden="true"><Filter size={18} /></span>
                                            <div>
                                                <strong>Filtros de pedidos</strong>
                                                <p>Filtre e encontre os pedidos que deseja visualizar.</p>
                                            </div>
                                            <button
                                                type="button"
                                                className="pv2-filtros-limpar"
                                                onClick={() => {
                                                    setRascunho(filtrosVazios());
                                                    setRascunhoPeriodo({ ...periodoPadrao(), modo: "nenhum", de: "", ate: "" });
                                                    setRascunhoAba(meta.abaPadrao);
                                                }}
                                            >
                                                <Trash2 size={14} /> Limpar todos
                                            </button>
                                        </header>
                                        <div className="pv2-filtros-grade">
                                            <label>
                                                <span><UserRound size={15} /> Vendedor</span>
                                                <span className="pv2-filtros-caixa">
                                                    <select value={rascunho.vendedor} onChange={(e) => setRascunho((a) => ({ ...a, vendedor: e.target.value }))}>
                                                        <option value="">Nome do vendedor</option>
                                                        {vendedores.map((v) => <option key={v} value={v}>{v}</option>)}
                                                    </select>
                                                    <small>Selecione um vendedor</small>
                                                </span>
                                            </label>
                                            <label>
                                                <span><Store size={15} /> E-commerce</span>
                                                <span className="pv2-filtros-caixa">
                                                    <select value={rascunho.origem} onChange={(e) => setRascunho((a) => ({ ...a, origem: e.target.value }))}>
                                                        <option value="">Selecione</option>
                                                        {ORIGENS_PEDIDO.map((origem) => <option key={origem} value={origem}>{origem}</option>)}
                                                    </select>
                                                    <small>Todos os marketplaces</small>
                                                </span>
                                            </label>
                                            <label>
                                                <span><FileText size={15} /> Recebimento</span>
                                                <span className="pv2-filtros-caixa">
                                                    <select value={rascunho.pagamento} onChange={(e) => setRascunho((a) => ({ ...a, pagamento: e.target.value }))}>
                                                        <option value="">Todos</option>
                                                        <option value="recebido">Recebido</option>
                                                        <option value="aguardando recebimento">Aguardando recebimento</option>
                                                    </select>
                                                    <small>Status de recebimento</small>
                                                </span>
                                            </label>
                                            <label>
                                                <span><Package size={15} /> Estoque</span>
                                                <span className="pv2-filtros-caixa">
                                                    <select value={rascunho.estoque} onChange={(e) => setRascunho((a) => ({ ...a, estoque: e.target.value }))}>
                                                        <option value="">Todos</option>
                                                        <option value="nao">Estoque não lançado</option>
                                                        <option value="sim">Estoque lançado</option>
                                                    </select>
                                                    <small>Situação do estoque</small>
                                                </span>
                                            </label>
                                            <label>
                                                <span><CreditCard size={15} /> Contas a receber</span>
                                                <span className="pv2-filtros-caixa">
                                                    <select value={rascunho.contas} onChange={(e) => setRascunho((a) => ({ ...a, contas: e.target.value }))}>
                                                        <option value="">Todas</option>
                                                        <option value="nao">Contas não lançadas</option>
                                                        <option value="sim">Contas lançadas</option>
                                                    </select>
                                                    <small>Status de contas</small>
                                                </span>
                                            </label>
                                            <label>
                                                <span><MapPin size={15} /> Cidade</span>
                                                <span className="pv2-filtros-caixa">
                                                    <select value={rascunho.cidade} onChange={(e) => setRascunho((a) => ({ ...a, cidade: e.target.value }))}>
                                                        <option value="">Qualquer cidade</option>
                                                        {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                    <small>Filtrar por cidade</small>
                                                </span>
                                            </label>
                                            <label>
                                                <span><Search size={15} /> Produto</span>
                                                <span className="pv2-filtros-caixa">
                                                    <input value={rascunho.sku} onChange={(e) => setRascunho((a) => ({ ...a, sku: e.target.value }))} placeholder="Nome ou SKU" />
                                                    <small>Busque por nome, código (SKU) ou GTIN</small>
                                                </span>
                                            </label>
                                            <label>
                                                <span><CalendarDays size={15} /> Período</span>
                                                <span className="pv2-filtros-caixa pv2-filtros-periodo">
                                                    <CalendarDays size={15} />
                                                    <input
                                                        type="date"
                                                        value={rascunhoPeriodo.modo === "nenhum" ? "" : (rascunhoPeriodo.de || "")}
                                                        aria-label="Data inicial"
                                                        onChange={(e) => setRascunhoPeriodo((a) => ({ ...a, modo: "intervalo", de: e.target.value, ate: a.ate || e.target.value }))}
                                                    />
                                                    <em>–</em>
                                                    <input
                                                        type="date"
                                                        value={rascunhoPeriodo.modo === "nenhum" ? "" : (rascunhoPeriodo.ate || "")}
                                                        aria-label="Data final"
                                                        onChange={(e) => setRascunhoPeriodo((a) => ({ ...a, modo: "intervalo", ate: e.target.value, de: a.de || e.target.value }))}
                                                    />
                                                    <button
                                                        type="button"
                                                        aria-label="Limpar período"
                                                        onClick={() => setRascunhoPeriodo((a) => ({ ...a, modo: "nenhum", de: "", ate: "" }))}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    <small>Selecione o período dos pedidos</small>
                                                </span>
                                            </label>
                                            <fieldset className="pv2-filtros-status">
                                                <legend><ClipboardList size={15} /> Status do pedido</legend>
                                                <div>
                                                    {ABAS_PEDIDO.filter((item) => item.id !== "todas").map((item) => (
                                                        <label key={item.id}>
                                                            <input
                                                                type="checkbox"
                                                                checked={rascunhoAba === item.id}
                                                                onChange={() => setRascunhoAba(rascunhoAba === item.id ? meta.abaPadrao : item.id)}
                                                            />
                                                            <i style={{ background: item.cor }} />
                                                            {tituloAba(item.label)}
                                                        </label>
                                                    ))}
                                                </div>
                                            </fieldset>
                                        </div>
                                        <footer className="pv2-filtros-rodape">
                                            <button type="button" className="ctt-cancelar" onClick={() => setAberto(null)}>Cancelar</button>
                                            <button
                                                type="button"
                                                className="ctt-aplicar"
                                                onClick={() => {
                                                    setFiltros(rascunho);
                                                    setPeriodo(rascunhoPeriodo);
                                                    escolherAba(rascunhoAba || meta.abaPadrao);
                                                    setAberto(null);
                                                }}
                                            >
                                                <Search size={15} /> Aplicar filtros
                                            </button>
                                        </footer>
                                    </div>
                                ) : null}
                            </div>
                            {precisaLimpar ? (
                                <button type="button" className="pv2-limpar" onClick={limparLista}>
                                    Limpar filtros
                                </button>
                            ) : null}
                        </div>
                </div>

                <div className="pv2-chips-linha">
                    <div className="pv2-chips">
                        {chips.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={aba === item.id ? "is-on" : ""}
                                onClick={() => escolherAba(item.id)}
                            >
                                {item.cor ? <i style={{ background: item.cor }} /> : null}
                                {tituloAba(item.label)}
                                <b>{contagens[item.id] || 0}</b>
                            </button>
                        ))}
                    </div>
                    <div className="ctt-cols">
                        <button
                            type="button"
                            className={`ctt-cols-btn${aberto === "colunas" ? " is-on" : ""}`}
                            title="Configurar informações visíveis"
                            aria-label="Configurar informações visíveis"
                            onClick={() => {
                                if (aberto === "colunas") {
                                    setAberto(null);
                                    return;
                                }
                                setRascunhoColunas(colunas);
                                setAberto("colunas");
                            }}
                        >
                            <SlidersHorizontal size={16} />
                        </button>
                        {aberto === "colunas" ? (
                            <div className="ctt-cols-painel" onMouseDown={(e) => e.stopPropagation()}>
                                <header>
                                    <strong>Informações visíveis</strong>
                                    <button type="button" onClick={() => setAberto(null)}>
                                        fechar <X size={14} />
                                    </button>
                                </header>
                                <p>Selecione abaixo quais informações deseja que estejam visíveis</p>
                                <label className="ctt-cols-todas">
                                    <input
                                        type="checkbox"
                                        checked={rascunhoColunas.length === COLUNAS_PEDIDO.length}
                                        onChange={(e) => setRascunhoColunas(e.target.checked ? COLUNAS_PEDIDO.map((c) => c.id) : [])}
                                    />
                                    Colunas
                                </label>
                                <ul>
                                    {COLUNAS_PEDIDO.map((c) => {
                                        const ligada = rascunhoColunas.includes(c.id);
                                        return (
                                            <li key={c.id}>
                                                <span>{c.label}</span>
                                                <button
                                                    type="button"
                                                    className={`ctt-switch${ligada ? " is-on" : ""}`}
                                                    role="switch"
                                                    aria-checked={ligada}
                                                    aria-label={c.label}
                                                    onClick={() => setRascunhoColunas((atual) => (
                                                        ligada ? atual.filter((id) => id !== c.id) : [...atual, c.id]
                                                    ))}
                                                >
                                                    <i />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div className="ctt-menu-acoes">
                                    <button
                                        type="button"
                                        className="idx-pill int-add"
                                        onClick={() => {
                                            const ordem = COLUNAS_PEDIDO.map((c) => c.id);
                                            const next = ordem.filter((id) => rascunhoColunas.includes(id));
                                            const gravar = next.length ? next : [...COLUNAS_PEDIDO_PADRAO];
                                            setColunas(gravar);
                                            localStorage.setItem(COLUNAS_KEY, JSON.stringify(gravar));
                                            setAberto(null);
                                        }}
                                    >
                                        aplicar
                                    </button>
                                    <button type="button" className="ctt-ghost" onClick={() => setAberto(null)}>
                                        cancelar
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <section className="pv2-card">
                    <div className="pv2-scroll">
                        <table className="pv2-table">
                            <thead>
                                <tr>
                                    <th className="pv2-check pv2-c-check">
                                        <input
                                            type="checkbox"
                                            checked={visiveis.length > 0 && visiveis.every((p) => marcados.includes(p.id))}
                                            onChange={marcarPagina}
                                            aria-label="Selecionar todos"
                                        />
                                    </th>
                                    {COLUNAS_PEDIDO.filter((coluna) => visivel(coluna.id)).map((coluna) => (
                                        <th key={coluna.id} className={`pv2-c-${coluna.id}`} title={coluna.label} aria-label={coluna.label}>
                                            {coluna.id === "foto" ? "" : (ROTULO_CURTO[coluna.id] || coluna.label)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visiveis.length === 0 ? (
                                    <tr>
                                        <td colSpan={1 + COLUNAS_PEDIDO.filter((c) => visivel(c.id)).length} className="pv2-vazio">
                                            <strong>Nenhum pedido encontrado com estes filtros.</strong>
                                            {precisaLimpar ? (
                                                <button type="button" className="pv2-limpar" onClick={limparLista}>
                                                    <CircleX size={16} /> Limpar filtros
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ) : visiveis.map((pedido) => {
                                    const cidade = cidadePedido(pedido, clientes);
                                    const uf = ufPedido(pedido, clientes);
                                    const documento = documentoCliente(pedido, clientes);
                                    const fantasia = fantasiaPedido(pedido, clientes);
                                    const foto = fotoItem(pedido, produtos);
                                    const pagamento = statusPagamento(pedido);
                                    const quando = dataHoraPedido(pedido.data);
                                    const previsto = dataCurta(pedido.previsto);
                                    const despacho = dataCurta(pedido.dataLimiteDespacho);
                                    const ecommerce = numeroEcommercePedido(pedido);
                                    const nf = notaFiscalPedido(pedido);
                                    const contato = rotaContatoPedido(pedido, clientes);
                                    const produtoRota = rotaProdutoPedido(pedido, produtos);
                                    const rastreioUrl = rotaRastreio(pedido.rastreio);
                                    const nomeCliente = textoCelula(pedido.cliente);
                                    return (
                                        <tr key={pedido.id} className={marcados.includes(pedido.id) ? "is-sel" : ""}>
                                            <td className="pv2-check pv2-c-check" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={marcados.includes(pedido.id)}
                                                    onChange={() => toggleMarca(pedido.id)}
                                                    aria-label={`Selecionar ${pedido.numero}`}
                                                />
                                            </td>
                                            {visivel("foto") ? (
                                                <td className="pv2-c-foto">
                                                    {produtoRota ? (
                                                        <Link to={produtoRota} title="Abrir produto">
                                                            {foto.src ? <img className="pv-thumb" src={foto.src} alt="" /> : <span className="pv-thumb" style={{ background: foto.bg }}>{foto.emoji}</span>}
                                                        </Link>
                                                    ) : (
                                                        foto.src ? <img className="pv-thumb" src={foto.src} alt="" /> : <span className="pv-thumb" style={{ background: foto.bg }}>{foto.emoji}</span>
                                                    )}
                                                </td>
                                            ) : null}
                                            {visivel("numero") ? <td className="pv2-c-numero"><Link className="pv2-num" to={rotaEditarPedido(pedido)}>{textoCelula(pedido.numero)}</Link></td> : null}
                                            {visivel("ecommerce") ? (
                                                <td className="pv2-c-ecommerce" title={ecommerce || undefined}>
                                                    {ecommerce ? <Link to={ROTAS.PEDIDO_ECOMMERCE}>{ecommerce}</Link> : "—"}
                                                </td>
                                            ) : null}
                                            {visivel("nf") ? (
                                                <td className="pv2-c-nf" title={nf || undefined}>
                                                    {nf ? <Link to="/nota-fiscal">{nf}</Link> : "—"}
                                                </td>
                                            ) : null}
                                            {visivel("data") ? <td className="pv2-c-data" title={quando.cheio || undefined}>{quando.curto || "—"}</td> : null}
                                            {visivel("previsto") ? <td className="pv2-c-previsto" title={previsto.cheio || undefined}>{previsto.curto || "—"}</td> : null}
                                            {visivel("despacho") ? <td className="pv2-c-despacho" title={despacho.cheio || undefined}>{despacho.curto || "—"}</td> : null}
                                            {visivel("cliente") ? <td className="pv2-c-cliente">
                                                <span className="pv2-cli">
                                                    <span className="ctt-row-menu" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            aria-label={`Ações de ${pedido.numero}`}
                                                            onClick={() => setAberto(aberto === pedido.id ? null : pedido.id)}
                                                        >
                                                            <MoreVertical size={14} />
                                                        </button>
                                                        {aberto === pedido.id ? menuLinha(pedido) : null}
                                                    </span>
                                                    <Link to={contato || rotaEditarPedido(pedido)} title={contato ? "Abrir cadastro do cliente" : nomeCliente}>{nomeCliente}</Link>
                                                </span>
                                            </td> : null}
                                            {visivel("fantasia") ? (
                                                <td className="pv2-c-fantasia" title={fantasia || undefined}>
                                                    {fantasia && contato ? <Link to={contato}>{fantasia}</Link> : textoCelula(fantasia)}
                                                </td>
                                            ) : null}
                                            {visivel("uf") ? <td className="pv2-c-uf">{textoCelula(uf)}</td> : null}
                                            {visivel("cidade") ? (
                                                <td className="pv2-c-cidade">
                                                    {cidade ? (
                                                        <button type="button" className="pv2-atalho" title="Filtrar por esta cidade" onClick={() => setFiltros((atual) => ({ ...atual, cidade }))}>{cidade}</button>
                                                    ) : "—"}
                                                </td>
                                            ) : null}
                                            {visivel("vendedor") ? (
                                                <td className="pv2-c-vendedor">
                                                    {pedido.vendedor ? (
                                                        <button type="button" className="pv2-atalho" title="Filtrar por este vendedor" onClick={() => setFiltros((atual) => ({ ...atual, vendedor: pedido.vendedor }))}>{pedido.vendedor}</button>
                                                    ) : "—"}
                                                </td>
                                            ) : null}
                                            {visivel("documento") ? (
                                                <td className="pv2-c-documento" title={documento || undefined}>
                                                    {documento && contato ? <Link to={contato}>{documento}</Link> : textoCelula(documento)}
                                                </td>
                                            ) : null}
                                            {visivel("pagamento") ? (
                                                <td className="pv2-c-pagamento">
                                                    <Link to={ROTAS.CONTAS_RECEBER} title={tituloAba(pagamento)} aria-label={tituloAba(pagamento)}>
                                                        <span className="pv2-dot" style={{ background: pedido.contasLancadas ? "#22c55e" : "#facc15" }} />
                                                    </Link>
                                                </td>
                                            ) : null}
                                            {visivel("envio") ? <td className="pv2-c-envio" title={pedido.formaEnvio || undefined}>{textoCelula(pedido.formaEnvio)}</td> : null}
                                            {visivel("rastreio") ? (
                                                <td className="pv2-c-rastreio" title={pedido.rastreio || undefined}>
                                                    {pedido.rastreio && rastreioUrl ? <a href={rastreioUrl} target="_blank" rel="noreferrer">{pedido.rastreio}</a> : textoCelula(pedido.rastreio)}
                                                </td>
                                            ) : null}
                                            {visivel("marcadores") ? <td className="pv2-c-marcadores" title={pedido.marcadores || undefined}>{pedido.marcadores || "—"}</td> : null}
                                            {visivel("integracoes") ? (
                                                <td className="pv2-c-integracoes">
                                                    <span className="os-int" title="E = e-commerce · C = contas a receber">
                                                        <Link to={ROTAS.PEDIDO_ECOMMERCE} title="Pedidos do e-commerce"><em className={origemEcommerce(pedido.origem) ? "is-on pv-int-e" : "pv-int-e"}>E</em></Link>
                                                        <Link to={ROTAS.CONTAS_RECEBER} title="Contas a receber"><em className={pedido.contasLancadas ? "is-on" : ""}>C</em></Link>
                                                    </span>
                                                </td>
                                            ) : null}
                                            {visivel("andamento") ? (
                                                <td className="pv2-c-andamento">
                                                    <Link to={rotaAndamentoPedido(pedido)} title={rotuloAndamentoPedido(pedido)} aria-label={rotuloAndamentoPedido(pedido)}>
                                                        <span className="pv2-dot" style={{ background: corAndamentoPedido(pedido) }} />
                                                    </Link>
                                                </td>
                                            ) : null}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {marcados.length ? (
                        <div className="ctt-lote">
                            <div className="ctt-lote-esq">
                                <span className="ctt-lote-qtd">
                                    <strong>{String(marcados.length).padStart(2, "0")}</strong>
                                    <span>de {filtrados.length} pedidos</span>
                                    <button type="button" className="ctt-lote-limpar" aria-label="Limpar seleção" onClick={() => { setMarcados([]); setAberto(null); }}>
                                        <X size={14} />
                                    </button>
                                </span>
                                <button type="button" className="ctt-lote-primario" onClick={() => navigate("/nota-fiscal")}>
                                    <FileText size={15} /> gerar notas fiscais
                                </button>
                                <button type="button" className="ctt-lote-sec" disabled={trabalhando} onClick={() => aplicarFlagsSelecionados({ separacao: "SEPARANDO" }, "Pedidos enviados para separação.")}>
                                    <Package size={15} /> enviar para separação
                                </button>
                                <button type="button" className="ctt-lote-sec" onClick={() => window.print()}>
                                    <Printer size={15} /> imprimir
                                </button>
                            </div>
                            <div className="ctt-drop">
                                <button type="button" className={`ctt-lote-mais${aberto === "bulk-mais" ? " is-on" : ""}`} onClick={() => setAberto(aberto === "bulk-mais" ? null : "bulk-mais")}>
                                    mais ações <MoreHorizontal size={16} />
                                </button>
                                {aberto === "bulk-mais" ? (
                                    <div className="ctt-menu ctt-menu-up">
                                        <button type="button" onClick={() => navigate("/nota-fiscal")}><FileText size={15} /> gerar notas fiscais</button>
                                        <button type="button" onClick={() => window.print()}><Printer size={15} /> imprimir pedidos</button>
                                        <button type="button" disabled={trabalhando} onClick={lancarSelecionados}><Warehouse size={15} /> lançar estoque</button>
                                        <button type="button" disabled={trabalhando} onClick={() => aplicarFlagsSelecionados({ contasLancadas: true }, "Contas lançadas.")}><Check size={15} /> lançar contas</button>
                                        <button type="button" disabled={trabalhando} onClick={() => enviarParaExpedicao(selecionados, "Pedidos na fila de coleta da expedição.")}><Package size={15} /> enviar para expedição</button>
                                        <button type="button" onClick={() => exportarPlanilha("xls", selecionados)}><FileSpreadsheet size={15} /> exportar selecionados</button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                    <footer className="ctt-foot pv2-foot">
                        <p>Mostrando {inicioPagina} a {fimPagina} de {filtrados.length} registros</p>
                        <nav className="ctt-pag" aria-label="Páginas">
                            <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina(paginaAtual - 1)} aria-label="Anterior">
                                <ChevronLeft size={16} />
                            </button>
                            {janelaPaginas(paginaAtual, paginas).map((n, i) => (
                                n === "…"
                                    ? <span key={`e${i}`} className="pv2-ellipsis">…</span>
                                    : (
                                        <button key={n} type="button" className={n === paginaAtual ? "is-active" : ""} onClick={() => setPagina(n)}>
                                            {String(n).padStart(2, "0")}
                                        </button>
                                    )
                            ))}
                            <button type="button" disabled={paginaAtual >= paginas} onClick={() => setPagina(paginaAtual + 1)} aria-label="Próxima">
                                <ChevronRight size={16} />
                            </button>
                        </nav>
                        <label className="erp-pager-size">
                            <select value={porPaginaLista} onChange={(e) => setPorPaginaLista(Number(e.target.value))} aria-label="Itens por página">
                                {[10, 20, 50].map((n) => (
                                    <option key={n} value={n}>{n} por página</option>
                                ))}
                            </select>
                        </label>
                    </footer>
                </section>

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
                                {(() => {
                                    const escolhido = clientes.find((c) => String(c.id) === String(form.clienteId));
                                    if (!escolhido) {
                                        return null;
                                    }
                                    const extras = [escolhido.condicaoPagamento, escolhido.listaPreco].filter(Boolean);
                                    return extras.length ? <small>Cadastro: {extras.join(" · ")}</small> : null;
                                })()}
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
                                Pagamento
                                <select value={form.formaPagamento} onChange={(e) => setForm((a) => ({ ...a, formaPagamento: e.target.value }))}>
                                    <option value="">Selecione</option>
                                    {FORMAS_PAGAMENTO.map((forma) => (
                                        <option key={forma} value={forma}>{forma}</option>
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
                            <div className="ctt-menu-acoes">
                                <button type="button" className="pv2-cta" disabled={trabalhando} onClick={criarPedido}>salvar</button>
                                <button type="button" className="pv2-ghost" onClick={() => setNovoAberto(false)}>cancelar</button>
                            </div>
                        </div>
                    </div>
                ) : null}

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
                    disabled={!precisaLimpar}
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
                            <button type="button" disabled={trabalhando} onClick={() => enviarParaExpedicao(selecionados, "Pedidos na fila de coleta da expedição.")}>enviar para expedição</button>
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
                                        <button type="button" onClick={() => {
                                            const rotas = selecionados.map((pedido) => rotaOrdemDoPedido(pedido));
                                            if (!rotas.length) {
                                                falar("Selecione um pedido para gerar a ordem de produção.");
                                                return;
                                            }
                                            sessionStorage.setItem("erp-op-fila", JSON.stringify(rotas.slice(1)));
                                            navigate(rotas[0]);
                                        }}>gerar ordens de produção</button>
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
                            {(() => {
                                const escolhido = clientes.find((c) => String(c.id) === String(form.clienteId));
                                if (!escolhido) {
                                    return null;
                                }
                                const extras = [escolhido.condicaoPagamento, escolhido.listaPreco].filter(Boolean);
                                return extras.length ? <small>Cadastro: {extras.join(" · ")}</small> : null;
                            })()}
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
                            Pagamento
                            <select value={form.formaPagamento} onChange={(e) => setForm((a) => ({ ...a, formaPagamento: e.target.value }))}>
                                <option value="">Selecione</option>
                                {FORMAS_PAGAMENTO.map((forma) => (
                                    <option key={forma} value={forma}>{forma}</option>
                                ))}
                            </select>
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
