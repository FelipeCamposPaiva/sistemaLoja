import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import { catalogoVitrine, lerDesejos } from "../../constants/loja";
import LojaCard from "./LojaCard";

export default function LojaDesejos() {
    const { cfg, pronto } = useOutletContext();
    const [ids, setIds] = useState(lerDesejos);

    useEffect(() => {
        function sync() {
            setIds(lerDesejos());
        }
        window.addEventListener("erp-loja-desejos", sync);
        return () => window.removeEventListener("erp-loja-desejos", sync);
    }, []);

    const produtos = pronto
        ? catalogoVitrine().filter((p) => ids.includes(String(p.id)))
        : [];

    return (
        <section className="lj-sec">
            <h1>{cfg.textos?.desejos || "Desejos"}</h1>
            {produtos.length ? (
                <div className="lj-grid">
                    {produtos.map((p) => <LojaCard key={p.id} produto={p} cfg={cfg} />)}
                </div>
            ) : (
                <div className="lj-center">
                    <p className="lj-muted">Sua lista ainda está vazia.</p>
                    <Link to="/" className="lj-add" style={{ display: "inline-flex", marginTop: 16 }}>Continuar comprando</Link>
                </div>
            )}
        </section>
    );
}
