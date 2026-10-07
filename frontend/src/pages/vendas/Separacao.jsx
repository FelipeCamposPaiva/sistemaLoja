import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Camera, Check, MapPin, Package, ScanLine } from "lucide-react";

import { ListaPedidos } from "./PedidoVenda";
import ROTAS from "../../constants/rotas";
import {
    agruparPorLocal,
    biparPedido,
    enriquecerItensSeparacao,
    itemCompleto,
    progressoSeparacao,
    qtdPedida,
    qtdSeparada,
    sinalBipagem
} from "../../constants/separacaoBipagem";
import { atualizarPedidoVenda, listarPedidosVenda } from "../../services/pedidoVenda.service";
import { listarProdutos } from "../../services/produto.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/os.css";
import "../../styles/pages/pedidos-venda.css";
import "../../styles/pages/separacao.css";

const ETAPAS = [
    { id: "PENDENTE", label: "Aguardando" },
    { id: "SEPARANDO", label: "Separando" },
    { id: "SEPARADO", label: "Separado" },
    { id: "EMBALAGEM", label: "Embalagem" }
];

function etapaAtiva(pedido) {
    if (pedido?.embalagem === "EMBALADO") {
        return 4;
    }
    if (pedido?.separacao === "SEPARADO") {
        return 3;
    }
    if (pedido?.separacao === "SEPARANDO") {
        return 1;
    }
    return 0;
}

function ConsoleBipagem({ pedidoId }) {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const videoRef = useRef(null);
    const ultimoLido = useRef({ codigo: "", em: 0 });
    const [pedido, setPedido] = useState(null);
    const [catalogo, setCatalogo] = useState([]);
    const [codigo, setCodigo] = useState("");
    const [aviso, setAviso] = useState(null);
    const [destaque, setDestaque] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [camera, setCamera] = useState(false);
    const pedidoRef = useRef(pedido);
    const catalogoRef = useRef(catalogo);
    const salvandoRef = useRef(salvando);
    pedidoRef.current = pedido;
    catalogoRef.current = catalogo;
    salvandoRef.current = salvando;

    async function carregar() {
        setCarregando(true);
        try {
            const [lista, produtos] = await Promise.all([
                listarPedidosVenda(),
                listarProdutos().catch(() => [])
            ]);
            const encontrado = (lista || []).find((p) => String(p.id) === String(pedidoId));
            setCatalogo(Array.isArray(produtos) ? produtos : []);
            if (encontrado) {
                setPedido({
                    ...encontrado,
                    itens: enriquecerItensSeparacao(encontrado.itens, produtos)
                });
            } else {
                setPedido(null);
            }
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregar();
    }, [pedidoId]);

    useEffect(() => {
        if (!carregando) {
            inputRef.current?.focus();
        }
    }, [carregando, pedido?.id]);

    async function aplicarLeitura(bruto) {
        const atual = pedidoRef.current;
        const cat = catalogoRef.current;
        const lido = String(bruto || "").trim();
        if (!lido || !atual || salvandoRef.current || atual.embalagem === "EMBALADO") {
            return;
        }
        const agora = Date.now();
        if (ultimoLido.current.codigo === lido && agora - ultimoLido.current.em < 900) {
            return;
        }
        ultimoLido.current = { codigo: lido, em: agora };
        const resultado = biparPedido(atual, lido, cat);
        sinalBipagem(resultado.ok);
        setAviso(resultado);
        setCodigo("");
        if (resultado.item) {
            setDestaque(resultado.item.sku || resultado.item.descricao);
        }
        if (!resultado.ok || !resultado.pedido) {
            inputRef.current?.focus();
            return;
        }
        setSalvando(true);
        try {
            const salvo = await atualizarPedidoVenda(atual.id, resultado.pedido);
            setPedido({
                ...salvo,
                itens: enriquecerItensSeparacao(salvo.itens, cat)
            });
        } catch {
            setPedido(resultado.pedido);
            setAviso({ ok: false, tipo: "vazio", mensagem: "Não foi possível gravar a bipagem. Tente de novo." });
        } finally {
            setSalvando(false);
            inputRef.current?.focus();
        }
    }

    async function marcarEmbalado() {
        if (!pedido) {
            return;
        }
        setSalvando(true);
        try {
            const salvo = await atualizarPedidoVenda(pedido.id, {
                ...pedido,
                separacao: "SEPARADO",
                embalagem: "EMBALADO",
                expedicao: pedido.expedicao === "DESPACHADO" ? "DESPACHADO" : "PENDENTE"
            });
            setPedido({
                ...salvo,
                itens: enriquecerItensSeparacao(salvo.itens, catalogo)
            });
            setAviso({ ok: true, tipo: "pedido", mensagem: "Pedido embalado. Siga para a expedição." });
        } finally {
            setSalvando(false);
        }
    }

    useEffect(() => {
        if (!camera) {
            return undefined;
        }
        let stop = false;
        let stream;
        (async () => {
            const video = videoRef.current;
            if (!video) {
                return;
            }
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                if (stop) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                video.srcObject = stream;
                await video.play();
                if (!("BarcodeDetector" in window)) {
                    setAviso({ ok: false, tipo: "vazio", mensagem: "Este aparelho não lê código pela câmera. Use o leitor USB ou o campo de bipagem." });
                    return;
                }
                const detector = new window.BarcodeDetector({
                    formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"]
                });
                const tick = async () => {
                    if (stop) {
                        return;
                    }
                    try {
                        const codes = await detector.detect(video);
                        if (codes[0]?.rawValue) {
                            aplicarLeitura(codes[0].rawValue);
                        }
                    } catch {
                        /* ignore */
                    }
                    requestAnimationFrame(tick);
                };
                tick();
            } catch {
                setAviso({ ok: false, tipo: "vazio", mensagem: "Não foi possível abrir a câmera." });
                setCamera(false);
            }
        })();
        return () => {
            stop = true;
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, [camera]);

    const grupos = useMemo(() => agruparPorLocal(pedido?.itens || []), [pedido]);
    const progresso = progressoSeparacao(pedido?.itens || []);
    const etapa = etapaAtiva(pedido);
    const separado = pedido?.separacao === "SEPARADO";
    const embalado = pedido?.embalagem === "EMBALADO";

    if (carregando) {
        return (
            <div className="os-page sep-page">
                <p>Carregando separação...</p>
            </div>
        );
    }

    if (!pedido) {
        return (
            <div className="os-page sep-page">
                <p>Pedido não encontrado.</p>
                <Link to={ROTAS.SEPARACAO}>voltar à lista</Link>
            </div>
        );
    }

    return (
        <div className="os-page sep-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>vendas</span>
                <span>›</span>
                <Link to={ROTAS.SEPARACAO}>separação</Link>
                <span>›</span>
                <span>{pedido.numero}</span>
            </nav>

            <header className="sep-head">
                <div>
                    <h2>Bipagem · {pedido.numero}</h2>
                    <p>{pedido.cliente} · {pedido.origem}</p>
                </div>
                <ol className="sep-etapas">
                    {ETAPAS.map((etapaItem, idx) => (
                        <li key={etapaItem.id} className={idx < etapa ? "is-on" : idx === etapa ? "is-now" : ""}>
                            {etapaItem.label}
                        </li>
                    ))}
                </ol>
            </header>

            <form
                className="sep-scan"
                onSubmit={(ev) => {
                    ev.preventDefault();
                    aplicarLeitura(codigo);
                }}
            >
                <ScanLine size={22} />
                <input
                    ref={inputRef}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Bipe GTIN, SKU ou código do fornecedor"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    inputMode="text"
                    disabled={embalado}
                />
                <button type="submit" className="prd-btn prd-btn-primary" disabled={salvando || embalado}>
                    conferir
                </button>
                <button
                    type="button"
                    className={`prd-btn${camera ? " is-on" : ""}`}
                    onClick={() => setCamera((v) => !v)}
                    title="Câmera do celular ou tablet"
                >
                    <Camera size={16} /> câmera
                </button>
            </form>

            {camera ? <video ref={videoRef} className="sep-cam" playsInline muted /> : null}

            {aviso ? (
                <p className={`sep-aviso is-${aviso.ok ? "ok" : aviso.tipo === "errado" ? "err" : "warn"}`}>
                    {aviso.mensagem}
                </p>
            ) : (
                <p className="sep-dica">Cada leitura soma 1 unidade. Produto que não está no pedido é recusado.</p>
            )}

            <div className="sep-prog" aria-label="Progresso da separação">
                <span>{progresso.feita}/{progresso.pedida} conferidos</span>
                <div className="sep-barra"><i style={{ width: `${progresso.pct}%` }} /></div>
                <strong>{progresso.pct}%</strong>
            </div>

            {grupos.map((grupo) => (
                <section key={grupo.local} className="sep-grupo">
                    <h3><MapPin size={14} /> {grupo.local}</h3>
                    <ul>
                        {grupo.itens.map((item, idx) => {
                            const chave = item.sku || item.descricao || String(idx);
                            const feito = itemCompleto(item);
                            const ativo = destaque && (item.sku === destaque || item.descricao === destaque);
                            return (
                                <li key={`${chave}-${idx}`} className={`${feito ? "is-ok" : ""} ${ativo ? "is-hit" : ""}`}>
                                    <div>
                                        <strong>{item.descricao || item.sku}</strong>
                                        <small>
                                            SKU {item.sku || "—"}
                                            {item.gtin ? ` · GTIN ${item.gtin}` : ""}
                                            {item.codigoFornecedor ? ` · Forn. ${item.codigoFornecedor}` : ""}
                                        </small>
                                    </div>
                                    <em>{qtdSeparada(item)}/{qtdPedida(item)}</em>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}

            {separado ? (
                <div className="sep-pack">
                    <Package size={18} />
                    <div>
                        <h3>{embalado ? "Pedido embalado" : "Pronto para embalagem"}</h3>
                        <p>{embalado ? "Volumes conferidos. Pode despachar na expedição." : "Conferiu todos os itens. Embale e marque o pedido."}</p>
                    </div>
                    {embalado ? (
                        <button type="button" className="prd-btn prd-btn-primary" onClick={() => navigate(`${ROTAS.EXPEDICAO}?filtro=fila&q=${encodeURIComponent(pedido.numero || "")}`)}>
                            ir para expedição
                        </button>
                    ) : (
                        <button type="button" className="prd-btn prd-btn-primary" disabled={salvando} onClick={marcarEmbalado}>
                            <Check size={14} /> marcar embalado
                        </button>
                    )}
                </div>
            ) : null}
        </div>
    );
}

export default function Separacao() {
    const { id } = useParams();
    if (id) {
        return <ConsoleBipagem pedidoId={id} />;
    }
    return <ListaPedidos vista="separacao" />;
}
