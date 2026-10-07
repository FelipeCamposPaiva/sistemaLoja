import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    Check,
    ExternalLink,
    FileText,
    Package,
    Printer,
    RefreshCw,
    ScanLine,
    Search,
    Truck,
    Warehouse
} from "lucide-react";

import ROTAS from "../../constants/rotas";
import { dataPedidoBr, moedaPedido, notaFiscalPedido } from "../../constants/pedidosVenda";
import { listarClientes } from "../../services/clientes.service";
import {
    atualizarPedidoVenda,
    lancarEstoquePedido,
    listarPedidosVenda
} from "../../services/pedidoVenda.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/os.css";
import "../../styles/pages/expedicao.css";

const FILTROS = [
    { id: "abertas", label: "Em aberto" },
    { id: "separar", label: "Separar" },
    { id: "separando", label: "Separando" },
    { id: "embalar", label: "Embalar" },
    { id: "fila", label: "Coleta" },
    { id: "despachados", label: "Transporte" }
];

const ALERTAS = [
    { id: "atrasados", label: "Atrasados" },
    { id: "sem-rastreio", label: "Sem rastreio" },
    { id: "sem-nf", label: "Sem nota" },
    { id: "estoque", label: "Estoque pendente" },
    { id: "entregues", label: "Entregues" },
    { id: "todas", label: "Todas" }
];

const ENVIOS = ["Correios", "Transportadora", "Motoboy", "Retirada"];

function hojeIso() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${dia}`;
}

function etapaExpedicao(pedido) {
    const status = String(pedido?.status || "").toUpperCase();
    const sep = String(pedido?.separacao || "PENDENTE").toUpperCase();
    const exp = String(pedido?.expedicao || "PENDENTE").toUpperCase();
    const emb = String(pedido?.embalagem || (sep === "SEPARADO" ? "AGUARDANDO" : "PENDENTE")).toUpperCase();
    if (status.includes("CANCEL")) {
        return "CANCELADO";
    }
    if (status === "ENTREGUE") {
        return "ENTREGUE";
    }
    if (exp === "DESPACHADO" || exp === "EM_TRANSPORTE" || exp === "ENVIADO") {
        return "TRANSPORTE";
    }
    if (emb === "EMBALADO" || exp === "COLETA" || exp === "AGUARDANDO_COLETA") {
        return "COLETA";
    }
    if (sep === "SEPARADO") {
        return "EMBALAR";
    }
    if (sep === "SEPARANDO") {
        return "SEPARANDO";
    }
    return "SEPARAR";
}

function rotuloEtapa(etapa) {
    if (etapa === "COLETA") return "Aguardando coleta";
    if (etapa === "EMBALAR") return "Embalar";
    if (etapa === "SEPARANDO") return "Separando";
    if (etapa === "TRANSPORTE") return "Em transporte";
    if (etapa === "ENTREGUE") return "Entregue";
    if (etapa === "CANCELADO") return "Cancelado";
    return "Separar";
}

function envioDe(pedido) {
    const nome = String(pedido?.formaEnvio || "").trim();
    return nome || "Sem transportadora";
}

function qtdItem(item) {
    const n = Number(item?.quantidade ?? item?.qtd ?? 1);
    return Number.isFinite(n) && n > 0 ? n : 1;
}

function resumoItens(pedido) {
    const itens = pedido?.itens || [];
    return {
        linhas: itens.length,
        qtd: itens.reduce((acc, item) => acc + qtdItem(item), 0)
    };
}

function prazoIso(pedido) {
    const bruto = String(pedido?.dataLimiteDespacho || "");
    return /^\d{4}-\d{2}-\d{2}/.test(bruto) ? bruto.slice(0, 10) : "";
}

function atrasado(pedido) {
    const iso = prazoIso(pedido);
    const etapa = etapaExpedicao(pedido);
    if (!iso || etapa === "TRANSPORTE" || etapa === "ENTREGUE" || etapa === "CANCELADO") {
        return false;
    }
    return iso < hojeIso();
}

function rotaPedido(pedido) {
    const chave = pedido?.numero || pedido?.id || "";
    return `${ROTAS.PEDIDO_VENDA}#edit/${encodeURIComponent(chave)}`;
}

function rotaRastreio(codigo) {
    const limpo = String(codigo || "").replace(/\s/g, "");
    if (limpo.length < 8) {
        return "";
    }
    return `https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(limpo)}`;
}

function passaFiltro(pedido, filtro) {
    const etapa = etapaExpedicao(pedido);
    if (filtro === "todas") {
        return etapa !== "CANCELADO";
    }
    if (filtro === "atrasados") {
        return atrasado(pedido);
    }
    if (filtro === "sem-rastreio") {
        return etapa === "TRANSPORTE" && !String(pedido.rastreio || "").trim();
    }
    if (filtro === "sem-nf") {
        return etapa !== "CANCELADO" && etapa !== "ENTREGUE" && !notaFiscalPedido(pedido);
    }
    if (filtro === "estoque") {
        return etapa !== "CANCELADO" && etapa !== "ENTREGUE" && !pedido.estoqueLancado;
    }
    if (filtro === "entregues") {
        return etapa === "ENTREGUE";
    }
    if (filtro === "abertas") {
        return etapa !== "TRANSPORTE" && etapa !== "ENTREGUE";
    }
    if (filtro === "fila") {
        return etapa === "COLETA";
    }
    if (filtro === "embalar") {
        return etapa === "EMBALAR";
    }
    if (filtro === "separando") {
        return etapa === "SEPARANDO";
    }
    if (filtro === "separar") {
        return etapa === "SEPARAR";
    }
    if (filtro === "despachados") {
        return etapa === "TRANSPORTE";
    }
    return etapa !== "TRANSPORTE" && etapa !== "ENTREGUE";
}

function clienteCadastro(pedido, clientes) {
    if (pedido?.clienteId) {
        const porId = clientes.find((item) => String(item.id) === String(pedido.clienteId));
        if (porId) {
            return porId;
        }
    }
    const nome = String(pedido?.cliente || "").trim().toLowerCase();
    if (!nome) {
        return null;
    }
    return clientes.find((item) => String(item.nome || "").trim().toLowerCase() === nome) || null;
}

function destinoDe(pedido, clientes) {
    const contato = clienteCadastro(pedido, clientes);
    const cidade = pedido.cidade || contato?.municipio || "";
    const uf = pedido.uf || contato?.uf || "";
    return [cidade, uf].filter(Boolean).join(" / ") || "—";
}

export default function Expedicao() {
    const [params, setParams] = useSearchParams();
    const filtro = FILTROS.some((f) => f.id === params.get("filtro")) || ALERTAS.some((f) => f.id === params.get("filtro"))
        ? params.get("filtro")
        : "abertas";
    const envio = params.get("envio") || "";
    const [lista, setLista] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [busca, setBusca] = useState(params.get("q") || "");
    const qUrl = params.get("q") || "";
    const [loading, setLoading] = useState(true);
    const [aviso, setAviso] = useState("");
    const [trabalhando, setTrabalhando] = useState(false);
    const [marcados, setMarcados] = useState([]);
    const [focoId, setFocoId] = useState(params.get("pedido") || "");
    const [form, setForm] = useState({ formaEnvio: "", rastreio: "", volumes: "1" });
    const [limite, setLimite] = useState(40);

    async function carregar() {
        setLoading(true);
        try {
            const dados = await listarPedidosVenda();
            setLista(Array.isArray(dados) ? dados : []);
            setAviso("");
        } catch {
            setLista([]);
            setAviso("Não foi possível ler os pedidos de venda.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
        listarClientes().then((dados) => setClientes(Array.isArray(dados) ? dados : [])).catch(() => setClientes([]));
    }, []);

    useEffect(() => {
        setBusca(qUrl);
    }, [qUrl]);

    function definirConsulta(parcial) {
        const next = new URLSearchParams(params);
        Object.entries(parcial).forEach(([chave, valor]) => {
            if (!valor) {
                next.delete(chave);
            } else {
                next.set(chave, valor);
            }
        });
        setParams(next, { replace: true });
    }

    const ativos = useMemo(
        () => lista.filter((pedido) => etapaExpedicao(pedido) !== "CANCELADO"),
        [lista]
    );

    const envios = useMemo(() => {
        const set = new Set(ativos.map(envioDe));
        return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [ativos]);

    const porEnvio = useMemo(
        () => ativos.filter((pedido) => !envio || envioDe(pedido) === envio),
        [ativos, envio]
    );

    const porBusca = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) {
            return porEnvio;
        }
        return porEnvio.filter((pedido) => {
            const itens = (pedido.itens || []).map((item) => `${item.sku || ""} ${item.descricao || ""}`).join(" ");
            return [pedido.numero, pedido.cliente, pedido.origem, envioDe(pedido), pedido.rastreio, notaFiscalPedido(pedido), destinoDe(pedido, clientes), itens]
                .join(" ")
                .toLowerCase()
                .includes(termo);
        });
    }, [porEnvio, busca, clientes]);

    const contagens = useMemo(() => {
        const mapa = {};
        [...FILTROS, ...ALERTAS].forEach((item) => {
            mapa[item.id] = porBusca.filter((pedido) => passaFiltro(pedido, item.id)).length;
        });
        return mapa;
    }, [porBusca]);

    const visiveis = useMemo(
        () => porBusca.filter((pedido) => passaFiltro(pedido, filtro)),
        [porBusca, filtro]
    );

    const pagina = visiveis.slice(0, limite);
    const foco = lista.find((pedido) => String(pedido.id) === String(focoId)) || null;
    const selecionados = visiveis.filter((pedido) => marcados.includes(pedido.id));
    const totalValor = visiveis.reduce((acc, pedido) => acc + Number(pedido.valor || 0), 0);

    useEffect(() => {
        if (!foco) {
            return;
        }
        setForm({
            formaEnvio: foco.formaEnvio || "",
            rastreio: foco.rastreio || "",
            volumes: foco.volumes || "1"
        });
    }, [foco?.id]);

    function abrir(pedido) {
        setFocoId(String(pedido.id));
        definirConsulta({ pedido: String(pedido.id) });
    }

    function fecharPainel() {
        setFocoId("");
        definirConsulta({ pedido: "" });
    }

    function substituir(salvo) {
        if (!salvo?.id) {
            return;
        }
        setLista((atual) => atual.map((pedido) => (String(pedido.id) === String(salvo.id) ? { ...pedido, ...salvo } : pedido)));
    }

    async function gravar(pedido, patch, mensagem) {
        setTrabalhando(true);
        setAviso("");
        try {
            const salvo = await atualizarPedidoVenda(pedido.id, { ...pedido, ...patch });
            substituir(salvo);
            setAviso(mensagem);
            return salvo;
        } catch {
            setAviso("Não foi possível gravar o pedido.");
            return null;
        } finally {
            setTrabalhando(false);
        }
    }

    async function salvarEnvio(pedido) {
        await gravar(pedido, {
            formaEnvio: form.formaEnvio,
            rastreio: form.rastreio.trim(),
            volumes: form.volumes || "1"
        }, `Envio de ${pedido.numero} atualizado.`);
    }

    async function embalar(pedido) {
        await gravar(pedido, {
            separacao: "SEPARADO",
            embalagem: "EMBALADO",
            expedicao: pedido.expedicao === "DESPACHADO" ? "DESPACHADO" : "PENDENTE",
            formaEnvio: form.formaEnvio || pedido.formaEnvio,
            volumes: form.volumes || pedido.volumes || "1"
        }, `${pedido.numero} embalado e na fila de coleta.`);
    }

    async function despachar(pedido) {
        await gravar(pedido, {
            separacao: "SEPARADO",
            embalagem: "EMBALADO",
            expedicao: "DESPACHADO",
            formaEnvio: form.formaEnvio || pedido.formaEnvio,
            rastreio: (form.rastreio || pedido.rastreio || "").trim(),
            volumes: form.volumes || pedido.volumes || "1"
        }, `${pedido.numero} despachado.`);
    }

    async function entregar(pedido) {
        await gravar(pedido, { status: "ENTREGUE", expedicao: "DESPACHADO" }, `${pedido.numero} marcado como entregue.`);
    }

    async function lancarEstoque(pedido) {
        setTrabalhando(true);
        setAviso("");
        try {
            const resumo = await lancarEstoquePedido(pedido.id);
            if (resumo?.pedido) {
                substituir(resumo.pedido);
            } else {
                await carregar();
            }
            setAviso(resumo?.ok === false ? (resumo.mensagem || "Estoque não lançado.") : `Estoque lançado em ${pedido.numero}.`);
        } finally {
            setTrabalhando(false);
        }
    }

    async function despacharSelecionados() {
        if (!selecionados.length) {
            return;
        }
        setTrabalhando(true);
        setAviso("");
        try {
            for (const pedido of selecionados) {
                const salvo = await atualizarPedidoVenda(pedido.id, {
                    ...pedido,
                    separacao: "SEPARADO",
                    embalagem: "EMBALADO",
                    expedicao: "DESPACHADO",
                    volumes: pedido.volumes || "1"
                });
                substituir(salvo);
            }
            setMarcados([]);
            setAviso(`${selecionados.length} pedido(s) despachado(s).`);
        } catch {
            setAviso("Não foi possível despachar a seleção.");
        } finally {
            setTrabalhando(false);
        }
    }

    const contato = foco ? clienteCadastro(foco, clientes) : null;
    const contatoRota = contato?.id ? `/contatos/${encodeURIComponent(contato.id)}` : "";
    const rastreioUrl = rotaRastreio(form.rastreio || foco?.rastreio);

    return (
        <div className={`os-page exp-page${foco ? " has-painel" : ""}`}>
            <nav className="dash-crumb">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <span>vendas</span>
                <span>›</span>
                <span>expedição</span>
            </nav>

            <header className="fer-head">
                <div>
                    <h2>Expedição</h2>
                    <p className="prd-sub">Fila de coleta, embalagem e despacho ligada aos pedidos de venda.</p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    <Link className="os-ghost" to={ROTAS.DASHBOARD_EXPEDICAO}>painel</Link>
                    <Link className="os-ghost" to={ROTAS.SEPARACAO}>separação</Link>
                    <Link className="os-ghost" to={`${ROTAS.PEDIDO_VENDA}#list`}>pedidos</Link>
                    <Link className="os-ghost" to={ROTAS.ESTOQUE}>estoque</Link>
                    <Link className="os-ghost" to={ROTAS.CONTAS_RECEBER}>contas</Link>
                    <Link className="os-ghost" to="/embalagens">embalagens</Link>
                    <button type="button" className="os-ghost" onClick={carregar} disabled={loading}>
                        <RefreshCw size={14} /> atualizar
                    </button>
                </div>
            </header>

            <div className="exp-fluxo" role="tablist" aria-label="Andamento da expedição">
                {FILTROS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={filtro === item.id}
                        className={`exp-etapa is-${item.id}${filtro === item.id ? " is-on" : ""}`}
                        onClick={() => {
                            setLimite(40);
                            definirConsulta({ filtro: item.id === "abertas" ? "" : item.id });
                        }}
                    >
                        <small>{item.label}</small>
                        <strong>{String(contagens[item.id] || 0).padStart(2, "0")}</strong>
                    </button>
                ))}
            </div>

            <div className="exp-alertas">
                {ALERTAS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={filtro === item.id ? "is-on" : ""}
                        onClick={() => {
                            setLimite(40);
                            definirConsulta({ filtro: item.id });
                        }}
                    >
                        {item.label}
                        <b>{contagens[item.id] || 0}</b>
                    </button>
                ))}
            </div>

            <div className="os-toolbar">
                <label className="fer-search">
                    <Search size={15} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Pedido, cliente, cidade, rastreio ou SKU"
                    />
                </label>
                <select
                    className="exp-envio"
                    value={envio}
                    onChange={(e) => definirConsulta({ envio: e.target.value })}
                >
                    <option value="">todas as transportadoras</option>
                    {envios.map((nome) => (
                        <option key={nome} value={nome}>{nome}</option>
                    ))}
                </select>
            </div>

            <div className={`exp-corpo${foco ? " has-painel" : ""}`}>
                <div className="os-scroll">
                    <table className="fer-table os-table exp-table">
                        <thead>
                            <tr>
                                <th className="ctt-check">
                                    <input
                                        type="checkbox"
                                        checked={pagina.length > 0 && pagina.every((pedido) => marcados.includes(pedido.id))}
                                        onChange={(e) => {
                                            const ids = pagina.map((pedido) => pedido.id);
                                            setMarcados((atual) => (
                                                e.target.checked
                                                    ? [...new Set([...atual, ...ids])]
                                                    : atual.filter((id) => !ids.includes(id))
                                            ));
                                        }}
                                        aria-label="Selecionar página"
                                    />
                                </th>
                                <th>Pedido</th>
                                <th>Etapa</th>
                                <th>Cliente</th>
                                <th>Destino</th>
                                <th>Envio</th>
                                <th>Itens</th>
                                <th>Prazo</th>
                                <th>NF</th>
                                <th>Rastreio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={10} className="ctt-vazio">Carregando expedição...</td></tr>
                            ) : pagina.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="ctt-vazio">
                                        Nenhum pedido nesta fila. Separe e embale em <Link to={ROTAS.SEPARACAO}>separação</Link> ou libere o pedido em <Link to={`${ROTAS.PEDIDO_VENDA}#list`}>pedidos de venda</Link>.
                                    </td>
                                </tr>
                            ) : pagina.map((pedido) => {
                                const etapa = etapaExpedicao(pedido);
                                const itens = resumoItens(pedido);
                                const url = rotaRastreio(pedido.rastreio);
                                const nf = notaFiscalPedido(pedido);
                                const tarde = atrasado(pedido);
                                return (
                                    <tr key={pedido.id} className={`${marcados.includes(pedido.id) ? "is-sel" : ""} ${tarde ? "is-late" : ""} ${String(focoId) === String(pedido.id) ? "is-open" : ""}`}>
                                        <td className="ctt-check">
                                            <input
                                                type="checkbox"
                                                checked={marcados.includes(pedido.id)}
                                                onChange={() => setMarcados((atual) => (
                                                    atual.includes(pedido.id) ? atual.filter((id) => id !== pedido.id) : [...atual, pedido.id]
                                                ))}
                                            />
                                        </td>
                                        <td>
                                            <div className="exp-pedido">
                                                <Link className="os-num" to={rotaPedido(pedido)}>{pedido.numero}</Link>
                                                <button type="button" className="exp-abrir" onClick={() => abrir(pedido)}>abrir</button>
                                            </div>
                                            <small className="exp-origem">{pedido.origem || "Loja"}</small>
                                        </td>
                                        <td><span className={`exp-badge is-${etapa.toLowerCase()}`}>{rotuloEtapa(etapa)}</span></td>
                                        <td>
                                            {contatoRotaPedido(pedido, clientes) ? (
                                                <Link className="os-cli" to={contatoRotaPedido(pedido, clientes)}>{pedido.cliente}</Link>
                                            ) : pedido.cliente}
                                        </td>
                                        <td>{destinoDe(pedido, clientes)}</td>
                                        <td>{envioDe(pedido)}</td>
                                        <td>{itens.linhas ? `${itens.qtd} un · ${itens.linhas}` : "—"}</td>
                                        <td className={tarde ? "exp-tarde" : ""}>{pedido.dataLimiteDespacho ? dataPedidoBr(pedido.dataLimiteDespacho) : "—"}</td>
                                        <td>{nf || "—"}</td>
                                        <td>
                                            {pedido.rastreio && url ? (
                                                <a href={url} target="_blank" rel="noreferrer">{pedido.rastreio}</a>
                                            ) : (pedido.rastreio || "—")}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {visiveis.length > limite ? (
                        <button type="button" className="prd-btn exp-mais" onClick={() => setLimite((n) => n + 40)}>
                            mostrar mais {visiveis.length - limite}
                        </button>
                    ) : null}
                    <div className="exp-foot">
                        <span>{visiveis.length} pedido(s)</span>
                        <strong>{moedaPedido(totalValor)}</strong>
                    </div>
                </div>

                {foco ? (
                    <aside className="exp-painel">
                        <header>
                            <div>
                                <p>Pedido</p>
                                <h3>{foco.numero}</h3>
                            </div>
                            <button type="button" className="os-ghost" onClick={fecharPainel}>fechar</button>
                        </header>
                        <p className="exp-painel-cli">
                            {contatoRota ? <Link to={contatoRota}>{foco.cliente}</Link> : foco.cliente}
                            <span>{destinoDe(foco, clientes)} · {moedaPedido(foco.valor)}</span>
                        </p>
                        <span className={`exp-badge is-${etapaExpedicao(foco).toLowerCase()}`}>{rotuloEtapa(etapaExpedicao(foco))}</span>
                        {!foco.estoqueLancado ? (
                            <p className="exp-alerta">Estoque ainda não lançado neste pedido.</p>
                        ) : null}
                        {!notaFiscalPedido(foco) ? (
                            <p className="exp-alerta">Sem número de nota fiscal.</p>
                        ) : (
                            <p className="prd-sub">Nota {notaFiscalPedido(foco)}</p>
                        )}

                        <ul className="exp-itens">
                            {(foco.itens || []).length ? (foco.itens || []).map((item, idx) => (
                                <li key={`${item.sku || item.descricao}-${idx}`}>
                                    <div>
                                        <strong>{item.descricao || item.sku || "Item"}</strong>
                                        <small>
                                            {item.sku ? `SKU ${item.sku}` : "sem SKU"}
                                            {item.localizacao ? ` · ${item.localizacao}` : ""}
                                        </small>
                                    </div>
                                    <em>{qtdItem(item)}</em>
                                </li>
                            )) : <li><span>Pedido sem itens detalhados.</span></li>}
                        </ul>

                        <label>
                            Forma de envio
                            <select value={form.formaEnvio} onChange={(e) => setForm((atual) => ({ ...atual, formaEnvio: e.target.value }))}>
                                <option value="">Sem transportadora</option>
                                {[...new Set([...ENVIOS, foco.formaEnvio].filter(Boolean))].map((nome) => (
                                    <option key={nome} value={nome}>{nome}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Volumes
                            <input value={form.volumes} onChange={(e) => setForm((atual) => ({ ...atual, volumes: e.target.value }))} inputMode="numeric" />
                        </label>
                        <label>
                            Rastreio
                            <input value={form.rastreio} onChange={(e) => setForm((atual) => ({ ...atual, rastreio: e.target.value }))} placeholder="Código de rastreamento" />
                        </label>

                        <div className="exp-painel-acoes">
                            <button type="button" className="prd-btn" disabled={trabalhando} onClick={() => salvarEnvio(foco)}>salvar envio</button>
                            {etapaExpedicao(foco) !== "COLETA" && etapaExpedicao(foco) !== "TRANSPORTE" && etapaExpedicao(foco) !== "ENTREGUE" ? (
                                <button type="button" className="prd-btn" disabled={trabalhando} onClick={() => embalar(foco)}>
                                    <Package size={14} /> embalar
                                </button>
                            ) : null}
                            {etapaExpedicao(foco) !== "TRANSPORTE" && etapaExpedicao(foco) !== "ENTREGUE" ? (
                                <button type="button" className="prd-btn prd-btn-primary" disabled={trabalhando} onClick={() => despachar(foco)}>
                                    <Truck size={14} /> despachar
                                </button>
                            ) : null}
                            {etapaExpedicao(foco) === "TRANSPORTE" ? (
                                <button type="button" className="prd-btn prd-btn-primary" disabled={trabalhando} onClick={() => entregar(foco)}>
                                    <Check size={14} /> marcar entregue
                                </button>
                            ) : null}
                            <Link className="prd-btn" to={`${ROTAS.SEPARACAO}/${foco.id}`}><ScanLine size={14} /> bipar</Link>
                            <Link className="prd-btn" to={rotaPedido(foco)}><FileText size={14} /> pedido</Link>
                            {!foco.estoqueLancado ? (
                                <button type="button" className="prd-btn" disabled={trabalhando} onClick={() => lancarEstoque(foco)}>
                                    <Warehouse size={14} /> lançar estoque
                                </button>
                            ) : (
                                <Link className="prd-btn" to={ROTAS.ESTOQUE}>estoque</Link>
                            )}
                            {foco.contasLancadas ? (
                                <Link className="prd-btn" to={ROTAS.CONTAS_RECEBER}>contas lançadas</Link>
                            ) : (
                                <Link className="prd-btn" to={rotaPedido(foco)}>lançar contas no pedido</Link>
                            )}
                            {rastreioUrl ? (
                                <a className="prd-btn" href={rastreioUrl} target="_blank" rel="noreferrer">
                                    <ExternalLink size={14} /> rastrear
                                </a>
                            ) : null}
                        </div>
                    </aside>
                ) : null}
            </div>

            {marcados.length ? (
                <div className="os-bulk">
                    <span className="os-bulk-n">{String(marcados.length).padStart(2, "0")}</span>
                    <button type="button" disabled={trabalhando} onClick={despacharSelecionados}>
                        <Truck size={14} /> despachar selecionados
                    </button>
                    <button type="button" onClick={() => window.print()}>
                        <Printer size={14} /> romaneio
                    </button>
                    <span className="os-bulk-tot">{moedaPedido(selecionados.reduce((acc, pedido) => acc + Number(pedido.valor || 0), 0))}</span>
                </div>
            ) : null}

            <section className="exp-romaneio" aria-hidden="true">
                <h2>Romaneio de expedição</h2>
                <p>{new Date().toLocaleString("pt-BR")} · {envio || "todas as transportadoras"}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Pedido</th>
                            <th>Cliente</th>
                            <th>Destino</th>
                            <th>Envio</th>
                            <th>Volumes</th>
                            <th>Rastreio</th>
                            <th>Itens</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(selecionados.length ? selecionados : visiveis).map((pedido) => {
                            const itens = resumoItens(pedido);
                            return (
                                <tr key={pedido.id}>
                                    <td>{pedido.numero}</td>
                                    <td>{pedido.cliente}</td>
                                    <td>{destinoDe(pedido, clientes)}</td>
                                    <td>{envioDe(pedido)}</td>
                                    <td>{pedido.volumes || "1"}</td>
                                    <td>{pedido.rastreio || ""}</td>
                                    <td>{itens.qtd}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

function contatoRotaPedido(pedido, clientes) {
    const contato = clienteCadastro(pedido, clientes);
    return contato?.id ? `/contatos/${encodeURIComponent(contato.id)}` : "";
}
