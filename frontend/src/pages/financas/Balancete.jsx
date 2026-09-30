import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Printer } from "lucide-react";

import ROTAS from "../../constants/rotas";
import { buscarBalancete } from "../../services/balancete.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/os.css";
import "../../styles/pages/pedidos-venda.css";
import "../../styles/pages/financeiro.css";

const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function brl(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function sinal(valor) {
    const n = Number(valor || 0);
    if (n > 0) {
        return `${brl(n)} C`;
    }
    if (n < 0) {
        return `${brl(Math.abs(n))} D`;
    }
    return brl(0);
}

function TabelaContas({ titulo, linhas, vazio }) {
    return (
        <section className="blc-bloco">
            <h3>{titulo}</h3>
            <div className="os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Conta</th>
                            <th className="is-num">Débito</th>
                            <th className="is-num">Crédito</th>
                            <th className="is-num">Saldo</th>
                            <th className="is-num">Lanç.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.length === 0 ? (
                            <tr><td colSpan={6} className="ctt-vazio">{vazio}</td></tr>
                        ) : linhas.map((linha) => (
                            <tr key={linha.codigo}>
                                <td className="prd-mono">{linha.codigo}</td>
                                <td>{linha.nome}</td>
                                <td className="is-num">{brl(linha.debito)}</td>
                                <td className="is-num">{brl(linha.credito)}</td>
                                <td className="is-num">{sinal(linha.saldo)}</td>
                                <td className="is-num">{linha.lancamentos || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default function Balancete() {
    const hoje = new Date();
    const [ano, setAno] = useState(hoje.getFullYear());
    const [mes, setMes] = useState(hoje.getMonth() + 1);
    const [regime, setRegime] = useState("competencia");
    const [dados, setDados] = useState(null);
    const [aviso, setAviso] = useState("");
    const [carregando, setCarregando] = useState(true);

    async function carregar(a = ano, m = mes, r = regime) {
        setCarregando(true);
        try {
            setDados(await buscarBalancete(a, m, r));
            setAviso("");
        } catch {
            setDados(null);
            setAviso("Não foi possível montar o balancete deste mês.");
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregar();
    }, [ano, mes, regime]);

    const linhas = useMemo(() => [...(dados?.receitas || []), ...(dados?.despesas || [])], [dados]);

    function imprimir() {
        window.print();
    }

    return (
        <div className="os-page pv-page blc-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>financeiro</span>
                <span>›</span>
                <span>balancete</span>
            </nav>

            <div className="fer-head">
                <div>
                    <h2>Balancete de verificação</h2>
                    <p className="prd-sub">
                        Relatório mensal por categorias de receitas e despesas, no mesmo formato de um DRE.
                        Competência usa o vencimento das contas; regime de caixa usa os movimentos do caixa.
                        {" "}
                        <Link to="/balanco-patrimonial">ver balanço patrimonial</Link>
                    </p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    <button type="button" className="os-ghost" onClick={imprimir}>
                        <Printer size={14} /> imprimir
                    </button>
                </div>
            </div>

            <div className="blc-filtros">
                <label>
                    Mês
                    <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                        {MESES.map((nome, i) => (
                            <option key={nome} value={i + 1}>{nome}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Ano
                    <input type="number" min="2000" max="2100" value={ano} onChange={(e) => setAno(Number(e.target.value))} />
                </label>
                <label>
                    Regime
                    <select value={regime} onChange={(e) => setRegime(e.target.value)}>
                        <option value="competencia">Competência</option>
                        <option value="caixa">Caixa</option>
                    </select>
                </label>
            </div>

            {carregando ? <p>Montando balancete...</p> : null}

            {dados ? (
                <>
                    <div className="dash-kpis blc-kpis">
                        <article className="dash-kpi">
                            <small>Receitas (crédito)</small>
                            <strong>{brl(dados.totalCredito)}</strong>
                        </article>
                        <article className="dash-kpi">
                            <small>Despesas (débito)</small>
                            <strong>{brl(dados.totalDebito)}</strong>
                        </article>
                        <article className="dash-kpi">
                            <small>Resultado do período</small>
                            <strong className={dados.resultado >= 0 ? "positivo" : "negativo"}>{sinal(dados.resultado)}</strong>
                            <em>{dados.lancamentos} lançamentos · {dados.competencia}</em>
                        </article>
                    </div>

                    <section className="blc-dre">
                        <h3>DRE do mês</h3>
                        <ul>
                            {(dados.dre || []).map((item) => (
                                <li key={item.grupo} className={item.grupo.startsWith("Resultado") ? "is-tot" : ""}>
                                    <span>{item.grupo}</span>
                                    <strong className={Number(item.valor) < 0 ? "negativo" : ""}>{brl(item.valor)}</strong>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <TabelaContas titulo="Receitas" linhas={dados.receitas || []} vazio="Nenhuma receita neste mês." />
                    <TabelaContas titulo="Despesas" linhas={dados.despesas || []} vazio="Nenhuma despesa neste mês." />

                    <div className="blc-totais">
                        <span>{linhas.length} contas · {regime === "caixa" ? "regime de caixa" : "competência"}</span>
                        <strong>Débito {brl(dados.totalDebito)} · Crédito {brl(dados.totalCredito)}</strong>
                    </div>
                </>
            ) : null}
        </div>
    );
}
