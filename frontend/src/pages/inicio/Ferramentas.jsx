import { Link, useSearchParams } from "react-router-dom";

import {
    FERRAMENTAS_EXPORTACAO,
    FERRAMENTAS_GERAL,
    FERRAMENTAS_IMPORTACAO
} from "../../constants/ferramentas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/ferramentas.css";

const ABAS = [
    { id: "geral", nome: "geral" },
    { id: "importacoes", nome: "importações" },
    { id: "exportacoes", nome: "exportações" }
];

export default function Ferramentas() {
    const [params, setParams] = useSearchParams();
    const aba = ["geral", "importacoes", "exportacoes"].includes(params.get("aba"))
        ? params.get("aba")
        : "geral";

    return (
        <div className="fer-main">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to="/index">início</Link>
                <span>›</span>
                <Link to="/ferramentas_geral">ferramentas</Link>
            </nav>
            <h2 className="fer-title">Ferramentas</h2>
            <div className="fer-tabs" role="tablist">
                {ABAS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={aba === item.id}
                        className={aba === item.id ? "is-active" : ""}
                        onClick={() => setParams({ aba: item.id })}
                    >
                        {item.nome}
                    </button>
                ))}
            </div>

            {aba === "geral" ? (
                <div className="fer-grupos">
                    <ul>
                        {FERRAMENTAS_GERAL.map((item) => (
                            <li key={item.id}>
                                <Link to={item.rota}>{item.nome}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {aba === "importacoes" ? (
                <div className="fer-grupos">
                    {FERRAMENTAS_IMPORTACAO.map((grupo) => (
                        <section key={grupo.grupo}>
                            <h3>{grupo.grupo}</h3>
                            <ul>
                                {grupo.itens.map((item) => (
                                    <li key={item.id}>
                                        <Link to={`/ferramentas/importar/${item.id}`}>{item.nome}</Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            ) : null}

            {aba === "exportacoes" ? (
                <div className="fer-grupos">
                    <ul>
                        {FERRAMENTAS_EXPORTACAO.map((item) => (
                            <li key={item.id}>
                                <Link to={item.rota}>{item.nome}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
