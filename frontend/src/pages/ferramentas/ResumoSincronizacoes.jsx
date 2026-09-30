import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { SYNC_FALHAS } from "../../constants/ferramentas";
import GatoPlug from "./GatoPlug";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";

export default function ResumoSincronizacoes() {
    const navigate = useNavigate();
    const [aba, setAba] = useState("pendentes");
    const [mes, setMes] = useState("Agosto");

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
                <span>resumo de sincronizações</span>
            </nav>
            <h2 className="fer-title">Resumo de sincronizações</h2>
            <div className="fer-filtros">
                <button type="button" className="fer-chip is-active">{mes}</button>
                <button type="button" className="idx-text" onClick={() => setMes("Todos")}>Limpar filtros</button>
            </div>
            <div className="fer-tabs" role="tablist">
                <button type="button" className={aba === "pendentes" ? "is-active" : ""} onClick={() => setAba("pendentes")}>
                    pendentes
                </button>
                <button type="button" className={aba === "finalizadas" ? "is-active" : ""} onClick={() => setAba("finalizadas")}>
                    finalizadas
                </button>
            </div>
            {aba === "pendentes" ? (
                <div className="fer-empty is-warn">
                    <div>
                        <p><strong>Nenhum registro encontrado</strong></p>
                        <p>Tente alterar os filtros e pesquisar novamente</p>
                    </div>
                    <GatoPlug lupa />
                </div>
            ) : (
                <>
                    <table className="fer-table">
                        <thead>
                            <tr>
                                <th>Descrição da sincronização</th>
                                <th>Data de finalização</th>
                                <th>Situação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SYNC_FALHAS.map((nome, i) => (
                                <tr key={nome}>
                                    <td>Atualização de estoque do produto {nome} no e-commerce Loja Integrada</td>
                                    <td>24/08/2026 {17 + (i % 2)}:{String(2 + i).padStart(2, "0")}</td>
                                    <td><i className="fer-fail" aria-label="falhou" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="fer-foot">
                        <span>01 02 →</span>
                        <span>{SYNC_FALHAS.length} registros</span>
                    </div>
                </>
            )}
        </div>
    );
}
