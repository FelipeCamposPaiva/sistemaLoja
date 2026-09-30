import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ROTAS from "../../constants/rotas";
import {
    brl,
    listarFuncionarios,
    movimentosPorTipo,
    salvarMovimento
} from "../../constants/rh";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/rh.css";

const ACOES = {
    solicitacao: {
        titulo: "Solicitação Geral",
        campos: ["assunto", "detalhe"]
    },
    "ferias-aviso": {
        titulo: "Aviso Prévio de Férias",
        campos: ["inicio", "fim", "dias"]
    },
    "ferias-calculo": {
        titulo: "Cálculo de Férias",
        campos: ["inicio", "fim", "dias", "valor"]
    },
    "rescisao-aviso": {
        titulo: "Aviso Prévio de Rescisão",
        campos: ["data", "termino", "detalhe"]
    },
    "rescisao-calculo": {
        titulo: "Cálculo de Rescisão",
        campos: ["data", "valor", "detalhe"]
    },
    afastamento: {
        titulo: "Afastamento de Empregado",
        campos: ["inicio", "fim", "detalhe"]
    },
    rubricas: {
        titulo: "Lançamento de Rubricas",
        campos: ["competencia", "rubrica", "valor"]
    }
};

const ROTULOS = {
    assunto: "Assunto",
    detalhe: "Detalhe",
    inicio: "Início",
    fim: "Fim",
    dias: "Dias",
    valor: "Valor",
    data: "Data",
    termino: "Término",
    competencia: "Competência",
    rubrica: "Rubrica"
};

export default function RhMovimento() {
    const { acao } = useParams();
    const meta = ACOES[acao];
    const equipe = listarFuncionarios();
    const [funcId, setFuncId] = useState(String(equipe[0]?.id || ""));
    const [form, setForm] = useState({});
    const [tick, setTick] = useState(0);
    const lista = useMemo(() => movimentosPorTipo(acao), [acao, tick]);

    if (!meta) {
        return (
            <div className="rh-page">
                <p>Ação não encontrada.</p>
                <Link to="/rh">Voltar ao RH</Link>
            </div>
        );
    }

    function salvar(ev) {
        ev.preventDefault();
        const pessoa = equipe.find((f) => String(f.id) === String(funcId));
        salvarMovimento({
            id: Date.now(),
            tipo: acao,
            funcId: Number(funcId),
            nome: pessoa?.nome || "",
            ...form,
            quando: new Date().toISOString()
        });
        setForm({});
        setTick((n) => n + 1);
    }

    return (
        <div className="rh-page">
            <nav className="rh-crumb">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <Link to="/rh">RH</Link>
                <span>›</span>
                <span>{meta.titulo}</span>
            </nav>
            <header className="rh-head">
                <div>
                    <h2>{meta.titulo}</h2>
                    <p>Lançamento na folha da Tem de Tudo.</p>
                </div>
            </header>
            <form className="rh-ficha rh-form" onSubmit={salvar}>
                <label>
                    <span>Empregado</span>
                    <select value={funcId} onChange={(e) => setFuncId(e.target.value)}>
                        {equipe.map((f) => (
                            <option key={f.id} value={f.id}>{f.matricula} — {f.nome}</option>
                        ))}
                    </select>
                </label>
                <div className="rh-grid">
                    {meta.campos.map((campo) => (
                        <label key={campo}>
                            <span>{ROTULOS[campo]}</span>
                            <input
                                type={["inicio", "fim", "data", "termino"].includes(campo) ? "date" : "text"}
                                value={form[campo] || ""}
                                onChange={(e) => setForm((atual) => ({ ...atual, [campo]: e.target.value }))}
                                required
                            />
                        </label>
                    ))}
                </div>
                <div className="rh-form-acoes">
                    <button type="submit" className="rh-btn">salvar</button>
                    <Link to="/rh">voltar</Link>
                </div>
            </form>
            <div className="rh-table-wrap">
                <table className="rh-table">
                    <thead>
                        <tr>
                            <th>Quando</th>
                            <th>Empregado</th>
                            <th>Dados</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.length === 0 ? (
                            <tr><td colSpan={3}>Nenhum lançamento ainda.</td></tr>
                        ) : lista.map((m) => (
                            <tr key={m.id}>
                                <td>{new Date(m.quando).toLocaleString("pt-BR")}</td>
                                <td><Link to={`/funcionarios/${m.funcId}`}>{m.nome}</Link></td>
                                <td>
                                    {meta.campos.map((c) => `${ROTULOS[c]}: ${c === "valor" && m[c] ? brl(m[c]) : (m[c] || "—")}`).join(" · ")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
