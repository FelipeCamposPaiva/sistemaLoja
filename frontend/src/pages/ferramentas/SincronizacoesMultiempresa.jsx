import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ExternalLink } from "lucide-react";

import { MULTI_OK } from "../../constants/ferramentas";
import GatoPlug from "./GatoPlug";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";

const ABAS = [
    { id: "pendentes", nome: "pendentes" },
    { id: "andamento", nome: "em andamento" },
    { id: "sucesso", nome: "com sucesso" },
    { id: "erros", nome: "com erros" }
];

export default function SincronizacoesMultiempresa() {
    const navigate = useNavigate();
    const [aba, setAba] = useState("pendentes");

    return (
        <div className="fer-main">
            <nav className="dash-crumb" aria-label="Trilha">
                <button type="button" className="int-voltar" onClick={() => navigate("/ferramentas_geral")}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <Link to="/index">início</Link>
                <span>›</span>
                <Link to="/ferramentas_geral">ferramentas</Link>
                <span>›</span>
                <span>sincronizações multiempresa</span>
            </nav>
            <h2 className="fer-title">Sincronizações Multiempresa</h2>
            <button type="button" className="fer-chip is-active">por produto</button>
            <div className="fer-tabs" role="tablist">
                {ABAS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={aba === item.id ? `is-active${item.id === "sucesso" ? " is-ok" : ""}${item.id === "erros" ? " is-err" : ""}` : ""}
                        onClick={() => setAba(item.id)}
                    >
                        {item.nome}
                    </button>
                ))}
            </div>

            {aba === "sucesso" ? (
                <>
                    <table className="fer-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descrição</th>
                                <th>Data</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {MULTI_OK.map((item, i) => (
                                <tr key={item.codigo}>
                                    <td>{item.codigo}</td>
                                    <td>{item.desc}</td>
                                    <td>01/09/2026 18:{String(30 - i).padStart(2, "0")}:24</td>
                                    <td>
                                        <Link to="/produtos#list" className="fer-ok" aria-label="abrir produto">
                                            <ExternalLink size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="fer-foot">
                        <span>01 02 03 04 05 … 13 →</span>
                        <span>619 registros</span>
                    </div>
                </>
            ) : (
                <div className={`fer-empty${aba === "erros" ? " is-ok" : ""}`}>
                    <div>
                        <p>
                            {aba === "andamento"
                                ? "Você não tem nenhuma sincronização em andamento"
                                : aba === "erros"
                                    ? "Você não tem nenhuma sincronização com erro."
                                    : "Você não tem nenhuma sincronização pendente"}
                        </p>
                        <p>Aqui aparecerão os registros de sincronizações automáticas</p>
                    </div>
                    <GatoPlug />
                </div>
            )}
        </div>
    );
}
