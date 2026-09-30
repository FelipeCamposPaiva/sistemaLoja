import { useMemo } from "react";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";

import { buscarProdutosLoja } from "../../constants/loja";
import LojaCard from "./LojaCard";

export default function LojaCatalogo() {
    const { cfg, pronto } = useOutletContext();
    const { grupo } = useParams();
    const [params] = useSearchParams();
    const q = params.get("q") || "";
    const categoria = grupo ? decodeURIComponent(grupo) : "";

    const produtos = useMemo(
        () => (pronto ? buscarProdutosLoja(q, categoria) : []),
        [pronto, q, categoria]
    );

    const titulo = categoria || (q ? `Resultados para “${q}”` : "Todos os produtos");

    return (
        <section className="lj-sec lj-catalogo">
            <h1>{titulo}</h1>
            <p className="lj-muted">{produtos.length} produto(s)</p>
            <div className="lj-grid">
                {produtos.slice(0, cfg.gerais.produtosPorPagina || 20).map((p) => (
                    <LojaCard key={p.id} produto={p} cfg={cfg} />
                ))}
            </div>
            {!produtos.length && pronto ? <p className="lj-empty">Nenhum produto encontrado nesta busca.</p> : null}
        </section>
    );
}
