import { useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Heart, Minus, Plus } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import {
    addCarrinho,
    brl,
    catalogoVitrine,
    ehMetroQuadrado,
    ehPersonalizado,
    lerDesejos,
    linkWhatsAppProduto,
    precoPix,
    precoVenda,
    produtoPorId,
    toggleDesejo,
    visualProdutoLoja
} from "../../constants/loja";
import LojaCard from "./LojaCard";

export default function LojaProduto() {
    const { cfg } = useOutletContext();
    const { id } = useParams();
    const navigate = useNavigate();
    const produto = produtoPorId(id);
    const [qtd, setQtd] = useState(1);
    const [fav, setFav] = useState(() => lerDesejos().includes(String(id)));
    const [altura, setAltura] = useState(Number(cfg.calculadoraM2?.altura || 1));
    const [largura, setLargura] = useState(Number(cfg.calculadoraM2?.largura || 1));
    const [frase, setFrase] = useState("");
    const [fotoNome, setFotoNome] = useState("");
    const visual = visualProdutoLoja(produto || {});
    const t = cfg.textos || {};
    const relacionados = useMemo(() => {
        if (!produto) {
            return [];
        }
        return catalogoVitrine()
            .filter((p) => p.id !== produto.id && p.grupo === produto.grupo)
            .slice(0, 5);
    }, [produto]);

    if (!produto) {
        return (
            <section className="lj-sec">
                <h1>Produto não encontrado</h1>
                <Link to="/">Voltar à loja</Link>
            </section>
        );
    }

    const preco = precoVenda(produto);
    const pix = precoPix(produto, cfg);
    const m2 = cfg.calculadoraM2?.ativo && ehMetroQuadrado(produto);
    const perso = cfg.personalizador?.ativo && ehPersonalizado(produto);
    const area = Math.max(0.01, Number(altura || 0) * Number(largura || 0));
    const qtdFinal = m2 ? Number(area.toFixed(2)) : qtd;
    const total = preco * qtdFinal;

    function adicionar() {
        if (perso && !frase.trim()) {
            return;
        }
        addCarrinho(produto, qtdFinal, {
            personalizacao: perso ? frase.trim() : "",
            medidas: m2 ? `${altura}m x ${largura}m = ${qtdFinal} m²` : ""
        });
        navigate("/carrinho");
    }

    return (
        <section className="lj-sec lj-produto">
            <div className="lj-produto-grid">
                <div className="lj-produto-foto" style={{ background: visual.bg }}>
                    {visual.img ? <img src={visual.img} alt="" /> : <span>{visual.emoji}</span>}
                </div>
                <div>
                    <p className="lj-muted">
                        Cód {produto.sku || produto.id} · {produto.grupo}
                        {produto.marca ? ` · ${produto.marca}` : ""}
                    </p>
                    <h1>{produto.nome}</h1>
                    <p className="lj-produto-preco">{brl(preco)}</p>
                    {cfg.pix?.ativo ? (
                        <p className="lj-pix">{brl(pix)} {t.pixTxt || "no pix"} ({cfg.pix.desconto}%)</p>
                    ) : null}
                    {cfg.gerais.mostrarEstoque ? (
                        <p className="lj-muted">{t.disponivel || "Disponível"} · Estoque: {produto.estoque}</p>
                    ) : (
                        <p className="lj-muted">{t.disponivel || "Disponível"}</p>
                    )}

                    {m2 ? (
                        <div className="lj-box lj-calc">
                            <h3>Calculadora m²</h3>
                            <p>Informe as medidas em metros. Ex.: 1,50 x 0,70</p>
                            <div className="lj-calc-grid">
                                <label>
                                    Altura (m)
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={altura}
                                        onChange={(e) => setAltura(Number(e.target.value))}
                                    />
                                </label>
                                <label>
                                    Largura (m)
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={largura}
                                        onChange={(e) => setLargura(Number(e.target.value))}
                                    />
                                </label>
                            </div>
                            <p className="lj-calc-result">{qtdFinal} m² · {brl(total)}</p>
                        </div>
                    ) : (
                        <div className="lj-card-acoes">
                            <div className="lj-qty">
                                <button type="button" onClick={() => setQtd((n) => Math.max(1, n - 1))}><Minus size={12} /></button>
                                <span>{qtd}</span>
                                <button type="button" onClick={() => setQtd((n) => n + 1)}><Plus size={12} /></button>
                            </div>
                            <button type="button" className="lj-add" onClick={adicionar}>{t.adicionar || "Adicionar"}</button>
                        </div>
                    )}

                    {perso ? (
                        <div className="lj-box lj-perso">
                            <h3>📝 {cfg.personalizador.titulo}</h3>
                            <p>{cfg.personalizador.ajuda}</p>
                            <label>
                                Nome | WhatsApp | Frase
                                <input
                                    value={frase}
                                    onChange={(e) => setFrase(e.target.value)}
                                    placeholder="Ex.: Felipe | (24) 99999-9999 | Amo Você"
                                    maxLength={300}
                                />
                            </label>
                            <label>
                                📸 Envie sua Foto ou Arte
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(e) => setFotoNome(e.target.files?.[0]?.name || "")}
                                />
                            </label>
                            {fotoNome ? <small>{fotoNome} (JPG, PNG ou PDF)</small> : <small>(JPG, PNG ou PDF)</small>}
                        </div>
                    ) : null}

                    {m2 || perso ? (
                        <button type="button" className="lj-add" onClick={adicionar} disabled={perso && !frase.trim()}>
                            {t.adicionar || "Adicionar"}
                        </button>
                    ) : null}

                    <div className="lj-produto-extra">
                        <button
                            type="button"
                            className={`lj-wish${fav ? " is-on" : ""}`}
                            onClick={() => {
                                toggleDesejo(produto.id);
                                setFav(lerDesejos().includes(String(produto.id)));
                            }}
                        >
                            <Heart size={16} fill={fav ? "currentColor" : "none"} /> {t.desejosAdd || "Adicionar aos desejos"}
                        </button>
                    </div>
                    <a className="lj-wa" href={linkWhatsAppProduto(produto, cfg)} target="_blank" rel="noopener noreferrer">
                        {t.comprarWhatsapp || "Comprar pelo whatsapp"} <FaWhatsapp />
                    </a>
                    {produto.descricao ? (
                        <div className="lj-desc">
                            <h2>Descrição do Produto</h2>
                            <p>{produto.descricao}</p>
                        </div>
                    ) : null}
                </div>
            </div>
            {relacionados.length ? (
                <div className="lj-rel">
                    <h2>{t.relacionados || "Aproveite e compre também"}</h2>
                    <div className="lj-track">
                        {relacionados.map((p) => <LojaCard key={p.id} produto={p} cfg={cfg} />)}
                    </div>
                </div>
            ) : null}
        </section>
    );
}
