import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";

import {
    brl,
    lerCarrinho,
    limparCarrinho,
    resumoCarrinho,
    setQtdCarrinho,
    urlProduto
} from "../../constants/loja";

export default function LojaCarrinho() {
    const { cfg } = useOutletContext();
    const [itens, setItens] = useState(lerCarrinho);
    const t = cfg.textos || {};

    useEffect(() => {
        function sync() {
            setItens(lerCarrinho());
        }
        window.addEventListener("erp-loja-carrinho", sync);
        return () => window.removeEventListener("erp-loja-carrinho", sync);
    }, []);

    const resumo = resumoCarrinho(itens, cfg);

    if (!itens.length) {
        return (
            <section className="lj-sec lj-center">
                <h1>Seu carrinho está vazio</h1>
                <p className="lj-muted">Escolha um produto na vitrine para começar.</p>
                <Link to="/" className="lj-add" style={{ display: "inline-flex", marginTop: 16 }}>Continuar comprando</Link>
            </section>
        );
    }

    return (
        <section className="lj-sec lj-cart">
            <p className="lj-alerta">{t.freteGratis || "FRETE GRÁTIS"}</p>
            <h1>Carrinho</h1>
            <ul>
                {itens.map((item) => (
                    <li key={`${item.id}-${item.personalizacao}-${item.medidas}`}>
                        <div>
                            <Link to={urlProduto(item)}>{item.nome}</Link>
                            {item.personalizacao ? <small>Personalização: {item.personalizacao}</small> : null}
                            {item.medidas ? <small>{item.medidas}</small> : null}
                        </div>
                        <span>{brl(item.preco)}</span>
                        <div className="lj-qty">
                            <button type="button" onClick={() => setQtdCarrinho(item.id, item.qtd - 1, item.linha)}><Minus size={12} /></button>
                            <span>{item.qtd}</span>
                            <button type="button" onClick={() => setQtdCarrinho(item.id, item.qtd + 1, item.linha)}><Plus size={12} /></button>
                        </div>
                        <strong>{brl(item.preco * item.qtd)}</strong>
                        <button type="button" onClick={() => setQtdCarrinho(item.id, 0, item.linha)} aria-label="Remover">
                            <Trash2 size={16} />
                        </button>
                    </li>
                ))}
            </ul>
            <div className="lj-cupom">
                {resumo.atual ? (
                    <p>Cupom <strong>{resumo.atual.codigo}</strong> aplicado: {resumo.atual.desconto}% off</p>
                ) : null}
                {resumo.proximo ? (
                    <p>
                        Faltam {resumo.proximo.qtd - resumo.qtd} item(ns) para {resumo.proximo.codigo} ({resumo.proximo.desconto}% off)
                    </p>
                ) : null}
                {(cfg.cupons || []).map((c) => (
                    <span key={c.codigo}>{c.qtd}+ un. = {c.codigo} {c.desconto}%</span>
                ))}
            </div>
            <footer>
                <div>
                    <p>Subtotal <strong>{brl(resumo.bruto)}</strong></p>
                    {resumo.desconto ? <p>Desconto <strong>-{brl(resumo.desconto)}</strong></p> : null}
                    <p>Total <strong>{brl(resumo.subtotal)}</strong></p>
                    {cfg.pix?.ativo ? <p className="lj-pix">{brl(resumo.pix)} {t.pixTxt || "no pix"}</p> : null}
                </div>
                <div>
                    <button type="button" className="lj-linkish" onClick={() => limparCarrinho()}>Limpar</button>
                    <Link to="/checkout" className="lj-add">Finalizar compra</Link>
                </div>
            </footer>
            <p className="lj-muted">Pedido entra no ERP como venda da loja virtual · {cfg.dados.nome}</p>
        </section>
    );
}
