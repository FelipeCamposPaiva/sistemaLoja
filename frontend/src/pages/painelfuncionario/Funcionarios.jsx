import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import ROTAS from "../../constants/rotas";
import { AVISOS_RH, SITUACAO, brl, listarFuncionarios } from "../../constants/rh";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/rh.css";

export default function Funcionarios() {
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState("todos");

    const lista = useMemo(() => {
        const equipe = listarFuncionarios();
        const q = busca.trim().toLowerCase();
        return equipe.filter((f) => {
            if (filtro !== "todos" && f.situacao !== filtro) {
                return false;
            }
            if (!q) {
                return true;
            }
            return [f.nome, f.matricula, f.cpf, f.cargo, f.pis].filter(Boolean).join(" ").toLowerCase().includes(q);
        });
    }, [busca, filtro]);

    const totais = useMemo(() => {
        const equipe = listarFuncionarios();
        return {
            ativos: equipe.filter((f) => ["ativo", "experiencia", "prolabore", "estagiario"].includes(f.situacao)).length,
            desligados: equipe.filter((f) => f.situacao === "desligado").length,
            avisos: AVISOS_RH.filter((a) => a.gravidade === "alta").length
        };
    }, []);

    return (
        <div className="rh-page">
            <nav className="rh-crumb">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <span>Funcionários</span>
                <span>›</span>
                <span>Equipe</span>
            </nav>
            <header className="rh-head">
                <div>
                    <h2>Equipe</h2>
                    <p>Fichas, holerites, guias INSS/FGTS, férias, rescisões e informes da Tem de Tudo.</p>
                </div>
                <Link to="/rh" className="rh-btn">Painel RH</Link>
            </header>

            <section className="rh-kpis">
                <article><span>Na ativa</span><strong>{totais.ativos}</strong></article>
                <article><span>Desligados</span><strong>{totais.desligados}</strong></article>
                <article><span>Avisos</span><strong>{totais.avisos}</strong></article>
            </section>

            {AVISOS_RH.length > 0 && (
                <aside className="rh-alertas">
                    {AVISOS_RH.map((a) => (
                        <Link key={a.id} to="/rh-avisos" className={`rh-alerta is-${a.gravidade}`}>
                            <strong>{a.titulo}</strong>
                            <span>{a.detalhe}</span>
                        </Link>
                    ))}
                </aside>
            )}

            <div className="rh-toolbar">
                <label className="rh-busca">
                    <Search size={16} />
                    <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, matrícula, CPF..." />
                </label>
                <div className="rh-filtros">
                    {["todos", "ativo", "experiencia", "prolabore", "estagiario", "desligado"].map((id) => (
                        <button key={id} type="button" className={filtro === id ? "is-on" : ""} onClick={() => setFiltro(id)}>
                            {id === "todos" ? "Todos" : SITUACAO[id]?.nome || id}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rh-table-wrap">
                <table className="rh-table">
                    <thead>
                        <tr>
                            <th>Matrícula</th>
                            <th>Nome</th>
                            <th>Cargo</th>
                            <th>Admissão</th>
                            <th>Saída</th>
                            <th>CPF</th>
                            <th>Salário</th>
                            <th>Situação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.map((f) => {
                            const sit = SITUACAO[f.situacao] || SITUACAO.ativo;
                            return (
                                <tr key={f.id}>
                                    <td>{f.matricula}</td>
                                    <td>
                                        <Link to={`/funcionarios/${f.id}`}>{f.nome}</Link>
                                        {f.eSocial ? <small>eSocial {f.eSocial}</small> : null}
                                    </td>
                                    <td>{f.cargo || "—"}</td>
                                    <td>{f.admissao ? f.admissao.split("-").reverse().join("/") : "—"}</td>
                                    <td>{f.desligamento ? f.desligamento.split("-").reverse().join("/") : "—"}</td>
                                    <td>{f.cpf || "—"}</td>
                                    <td>{f.salario ? brl(f.salario) : "—"}</td>
                                    <td><span className={`rh-pill is-${sit.classe}`}>{sit.nome}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
