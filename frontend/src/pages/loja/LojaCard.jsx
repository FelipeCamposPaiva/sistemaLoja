import { Link } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import { Heart, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import {
    addCarrinho,
    brl,
    lerDesejos,
    linkWhatsAppProduto,
    precoPix,
    precoVenda,
    toggleDesejo,
    urlProduto,
    visualProdutoLoja
} from "../../constants/loja";

export default function LojaCard({ produto, cfg, compacto }) {
    const [qtd, setQtd] = useState(1);
    const [fav, setFav] = useState(() => lerDesejos().includes(String(produto.id)));
    const visual = visualProdutoLoja(produto);
    const preco = precoVenda(produto);
    const pix = precoPix(produto, cfg);
    const t = cfg.textos || {};

    useEffect(() => {
        function sync() {
            setFav(lerDesejos().includes(String(produto.id)));
        }
        window.addEventListener("erp-loja-desejos", sync);
        return () => window.removeEventListener("erp-loja-desejos", sync);
    }, [produto.id]);

    return (
        <article className={`lj-card${compacto ? " is-compact" : ""}`}>
            <Link to={urlProduto(produto)} className="lj-card-foto" style={{ background: visual.bg }}>
                {visual.img ? <img src={visual.img} alt="" /> : <span>{visual.emoji}</span>}
                <button
                    type="button"
                    className={`lj-heart${fav ? " is-on" : ""}`}
                    aria-label={t.desejos || "Desejos"}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleDesejo(produto.id);
                    }}
                >
                    <Heart size={16} fill={fav ? "currentColor" : "none"} />
                </button>
            </Link>
            <Link to={urlProduto(produto)} className="lj-card-nome" title={produto.nome}>
                {produto.nome}
            </Link>
            <div className="lj-card-preco">
                <strong>{brl(preco)}</strong>
                {cfg.pix?.ativo ? (
                    <small>{brl(pix)} {t.pixTxt || "no pix"}</small>
                ) : null}
            </div>
            {compacto ? null : (
                <>
                    <div className="lj-card-acoes">
                        <div className="lj-qty">
                            <button type="button" onClick={() => setQtd((n) => Math.max(1, n - 1))} aria-label="Menos">
                                <Minus size={12} />
                            </button>
                            <span>{qtd}</span>
                            <button type="button" onClick={() => setQtd((n) => n + 1)} aria-label="Mais">
                                <Plus size={12} />
                            </button>
                        </div>
                        <button type="button" className="lj-add" onClick={() => addCarrinho(produto, qtd)}>
                            {t.adicionar || "Adicionar"}
                        </button>
                    </div>
                    <a className="lj-wa" href={linkWhatsAppProduto(produto, cfg)} target="_blank" rel="noopener noreferrer">
                        {t.comprarWhatsapp || "Comprar pelo whatsapp"} <FaWhatsapp />
                    </a>
                </>
            )}
        </article>
    );
}
