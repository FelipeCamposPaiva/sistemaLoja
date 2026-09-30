import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Printer } from "lucide-react";

import {
    calcularComissoes,
    isoDate,
    moeda,
    nomesTecnicos
} from "../../../constants/ordensServico";
import { faixaComissaoPorDesconto, listarTecnicos } from "../../../constants/tecnicos";
import { listarOS } from "../../../services/os.service";
import ROTAS from "../../../constants/rotas";

import "../../../styles/layout/app-shell.css";
import "../../../styles/pages/indice.css";
import "../../../styles/pages/ferramentas.css";
import "../../../styles/pages/os.css";

function hojeIso() {
    return isoDate(new Date());
}

function inicioMes() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function RelatorioTecnicos() {
    const [lista, setLista] = useState([]);
    const [de, setDe] = useState(inicioMes);
    const [ate, setAte] = useState(hojeIso);
    const [tecnicoId, setTecnicoId] = useState("");
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        listarOS()
            .then(setLista)
            .catch(() => {
                setLista([]);
                setAviso("Não foi possível ler as ordens de serviço.");
            });
    }, []);

    const tecnicos = listarTecnicos();

    const linhas = useMemo(() => {
        const noPeriodo = lista.filter((os) => {
            const data = isoDate(os.dataAbertura || os.dataConclusao);
            if (de && data && data < de) {
                return false;
            }
            if (ate && data && data > ate) {
                return false;
            }
            return true;
        });
        const mapa = new Map();
        noPeriodo.forEach((os) => {
            const calc = calcularComissoes(os, faixaComissaoPorDesconto);
            const equipe = calc.tecnicos.length ? calc.tecnicos : [];
            equipe.forEach((t) => {
                if (tecnicoId && String(t.id) !== String(tecnicoId)) {
                    return;
                }
                const atual = mapa.get(String(t.id)) || {
                    id: t.id,
                    nome: t.nome,
                    qtd: 0,
                    servicos: 0,
                    pecas: 0,
                    total: 0,
                    comissao: 0
                };
                atual.qtd += 1;
                atual.servicos += calc.servicos;
                atual.pecas += calc.pecas;
                atual.total += calc.liquido;
                atual.comissao += t.valor;
                mapa.set(String(t.id), atual);
            });
        });
        return [...mapa.values()].sort((a, b) => b.comissao - a.comissao);
    }, [lista, de, ate, tecnicoId]);

    const totais = linhas.reduce(
        (acc, l) => ({
            qtd: acc.qtd + l.qtd,
            servicos: acc.servicos + l.servicos,
            pecas: acc.pecas + l.pecas,
            total: acc.total + l.total,
            comissao: acc.comissao + l.comissao
        }),
        { qtd: 0, servicos: 0, pecas: 0, total: 0, comissao: 0 }
    );

    const osPeriodo = lista.filter((os) => {
        const data = isoDate(os.dataAbertura || os.dataConclusao);
        if (de && data && data < de) {
            return false;
        }
        if (ate && data && data > ate) {
            return false;
        }
        if (tecnicoId && !(os.tecnicos || []).some((t) => String(t.id) === String(tecnicoId))) {
            return false;
        }
        return true;
    });

    return (
        <div className="os-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>serviços</span>
                <span>›</span>
                <span>relatório por técnico</span>
            </nav>
            <div className="fer-head">
                <div>
                    <h2>Relatório por técnico</h2>
                    <p className="idx-sub">Quantidade e valor dos serviços no período, com comissão separada da do vendedor e das peças.</p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    <button type="button" className="os-ghost" onClick={() => window.print()}>
                        <Printer size={15} /> imprimir
                    </button>
                    <Link className="prd-btn" to={ROTAS.COMISSOES}>comissões de vendedores</Link>
                </div>
            </div>

            <section className="os-card">
                <div className="os-grid-4">
                    <label>
                        De
                        <input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
                    </label>
                    <label>
                        Até
                        <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
                    </label>
                    <label>
                        Técnico
                        <select value={tecnicoId} onChange={(e) => setTecnicoId(e.target.value)}>
                            <option value="">Todos</option>
                            {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                        </select>
                    </label>
                </div>
            </section>

            <div className="os-kpis">
                <article>
                    <small>OS no período</small>
                    <strong>{osPeriodo.length}</strong>
                </article>
                <article>
                    <small>Serviços</small>
                    <strong>R$ {moeda(totais.servicos)}</strong>
                </article>
                <article>
                    <small>Peças</small>
                    <strong>R$ {moeda(totais.pecas)}</strong>
                </article>
                <article>
                    <small>Comissão técnicos</small>
                    <strong>R$ {moeda(totais.comissao)}</strong>
                </article>
            </div>

            <div className="os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th>Técnico</th>
                            <th>OS</th>
                            <th className="is-num">Serviços</th>
                            <th className="is-num">Peças (sem comissão técnica)</th>
                            <th className="is-num">Total OS</th>
                            <th className="is-num">Comissão</th>
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="ctt-vazio">Nenhum serviço com técnico no período.</td>
                            </tr>
                        ) : linhas.map((l) => (
                            <tr key={l.id}>
                                <td>{l.nome}</td>
                                <td>{l.qtd}</td>
                                <td className="is-num">{moeda(l.servicos)}</td>
                                <td className="is-num">{moeda(l.pecas)}</td>
                                <td className="is-num">{moeda(l.total)}</td>
                                <td className="is-num">{moeda(l.comissao)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h3 className="os-sub">Ordens do período</h3>
            <div className="os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th>OS</th>
                            <th>Data</th>
                            <th>Cliente</th>
                            <th>Técnicos</th>
                            <th>Setor</th>
                            <th className="is-num">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {osPeriodo.map((os) => (
                            <tr key={os.id}>
                                <td>
                                    <Link className="os-num" to={`${ROTAS.ORDEM_SERVICO}#edit/${os.id}`}>{os.numero || os.id}</Link>
                                </td>
                                <td>{isoDate(os.dataAbertura)}</td>
                                <td>{os.cliente}</td>
                                <td>{nomesTecnicos(os) || "—"}</td>
                                <td>{os.setorAtual || os.status}</td>
                                <td className="is-num">{moeda(os.valor)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
