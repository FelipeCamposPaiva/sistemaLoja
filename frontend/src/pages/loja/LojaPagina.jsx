import { Link, useOutletContext, useParams } from "react-router-dom";

export default function LojaPagina() {
    const { cfg } = useOutletContext();
    const { slug } = useParams();
    const pagina = (cfg.paginas || []).find((p) => p.slug === slug);

    if (!pagina) {
        return (
            <section className="lj-sec">
                <h1>Página não encontrada</h1>
                <Link to="/">Voltar</Link>
            </section>
        );
    }

    return (
        <section className="lj-sec lj-pagina">
            <h1>{pagina.titulo}</h1>
            <div dangerouslySetInnerHTML={{ __html: pagina.html }} />
        </section>
    );
}
