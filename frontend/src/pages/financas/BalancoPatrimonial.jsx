import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { Printer, Search } from "lucide-react";

import {
    MESES_BALANCO,
    moedaBalanco,
    rotuloTipoBem,
    TIPOS_BEM,
    variacaoPct
} from "../../constants/balanco";
import {
    baixarBemPatrimonial,
    buscarBalanco,
    excluirBemPatrimonial,
    listarBensPatrimoniais,
    salvarBemPatrimonial
} from "../../services/balanco.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/os.css";
import "../../styles/pages/pedidos-venda.css";
import "../../styles/pages/financeiro.css";

function mensagemErro(erro, padrao) {
    return erro?.response?.data?.mensagem || padrao;
}

function deltaDe(linha) {
    return Number(linha?.valor || 0) - Number(linha?.anterior || 0);
}

export default function BalancoPatrimonial() {
    const hoje = new Date();
    const [params, setParams] = useSearchParams();
    const [aba, setAba] = useState(params.get("aba") === "bens" ? "bens" : "balanco");
    const [ano, setAno] = useState(Number(params.get("ano")) || hoje.getFullYear());
    const [mes, setMes] = useState(Number(params.get("mes")) || hoje.getMonth() + 1);
    const [dados, setDados] = useState(null);
    const [bens, setBens] = useState([]);
    const [buscaBem, setBuscaBem] = useState("");
    const [aviso, setAviso] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [trabalhando, setTrabalhando] = useState(false);
    const [formAberto, setFormAberto] = useState(false);
    const [form, setForm] = useState({
        tipo: "EQUIPAMENTO",
        nome: "",
        valorAquisicao: "",
        dataAquisicao: "",
        localizacao: "",
        observacao: ""
    });

    async function carregar(anoAlvo = ano, mesAlvo = mes) {
        setCarregando(true);
        try {
            const [balanco, lista] = await Promise.all([
                buscarBalanco(anoAlvo, mesAlvo),
                listarBensPatrimoniais()
            ]);
            setDados(balanco);
            setBens(Array.isArray(lista) ? lista : []);
            setAviso("");
        } catch (erro) {
            setAviso(mensagemErro(erro, "Não foi possível montar o balanço patrimonial."));
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    function aplicarCompetencia(proximoAno, proximoMes, proximaAba = aba) {
        setAno(proximoAno);
        setMes(proximoMes);
        setAba(proximaAba);
        const next = new URLSearchParams(params);
        next.set("ano", String(proximoAno));
        next.set("mes", String(proximoMes));
        if (proximaAba === "bens") {
            next.set("aba", "bens");
        } else {
            next.delete("aba");
        }
        setParams(next, { replace: true });
        carregar(proximoAno, proximoMes);
    }

    const competencia = dados?.competencia || {};
    const destino = dados?.destino || {};
    const serie = dados?.serie || [];
    const bensVisiveis = useMemo(() => {
        const termo = buscaBem.trim().toLowerCase();
        return bens.filter((bem) => {
            if (!termo) {
                return true;
            }
            return [bem.nome, bem.tipo, bem.localizacao, bem.status].join(" ").toLowerCase().includes(termo);
        });
    }, [bens, buscaBem]);
    const imobilizadoAtivo = bensVisiveis.filter((bem) => String(bem.status || "ATIVO").toUpperCase() !== "BAIXADO")
        .reduce((acc, bem) => acc + Number(bem.valorAquisicao || 0), 0);

    function imprimir() {
        const linhasAtivo = (dados?.ativo || []).map((l) => `<tr><td>${l.nome}</td><td>${moedaBalanco(l.valor)}</td></tr>`).join("");
        const linhasPassivo = (dados?.passivo || []).map((l) => `<tr><td>${l.nome}</td><td>${moedaBalanco(l.valor)}</td></tr>`).join("");
        const linhasPl = (dados?.patrimonio || []).map((l) => `<tr><td>${l.nome}</td><td>${moedaBalanco(l.valor)}</td></tr>`).join("");
        const janela = window.open("", "_blank");
        if (!janela) {
            return;
        }
        janela.document.write(`<!doctype html><html><head><title>Balanço patrimonial</title>
            <style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ddd;padding:6px;font-size:12px}th{text-align:left}</style>
            </head><body>
            <h2>Balanço patrimonial — ${MESES_BALANCO[mes - 1] || mes}/${ano}</h2>
            <p>${destino.resumo || ""}</p>
            <h3>Ativo ${moedaBalanco(competencia.ativo)}</h3>
            <table>${linhasAtivo}</table>
            <h3>Passivo ${moedaBalanco(competencia.passivo)}</h3>
            <table>${linhasPassivo}</table>
            <h3>Patrimônio líquido ${moedaBalanco(competencia.patrimonioLiquido)}</h3>
            <table>${linhasPl}</table>
            </body></html>`);
        janela.document.close();
        janela.focus();
        janela.print();
    }

    async function salvarBem() {
        if (!form.nome.trim() || !form.valorAquisicao) {
            setAviso("Informe nome e valor de aquisição.");
            return;
        }
        setTrabalhando(true);
        try {
            await salvarBemPatrimonial({
                tipo: form.tipo,
                nome: form.nome.trim(),
                valorAquisicao: Number(form.valorAquisicao),
                dataAquisicao: form.dataAquisicao || null,
                localizacao: form.localizacao.trim(),
                observacao: form.observacao.trim(),
                status: "ATIVO"
            });
            setFormAberto(false);
            setForm({ tipo: "EQUIPAMENTO", nome: "", valorAquisicao: "", dataAquisicao: "", localizacao: "", observacao: "" });
            await carregar();
            setAviso("Bem patrimonial incluído no imobilizado.");
        } catch (erro) {
            setAviso(mensagemErro(erro, "Não foi possível salvar o bem."));
        } finally {
            setTrabalhando(false);
        }
    }

    if (carregando && !dados) {
        return (
            <div className="os-page">
                <p>Montando o balanço patrimonial...</p>
            </div>
        );
    }

    return (
        <div className="os-page pv-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>financeiro</span>
                <span>›</span>
                <span>balanço patrimonial</span>
            </nav>

            <div className="fer-head">
                <div>
                    <h2>Balanço patrimonial</h2>
                    <p className="prd-sub">
                        Ativo, passivo e patrimônio líquido mês a mês, a partir de caixa, contas, estoque, imobilizado, balancete e DRE.
                        {" "}
                        <Link to="/balancete">balancete</Link>
                        {" · "}
                        <Link to="/financeiro">caixa</Link>
                        {" · "}
                        <Link to="/contas-receber">receber</Link>
                        {" · "}
                        <Link to="/contas-pagar">pagar</Link>
                        {" · "}
                        <Link to="/estoque">estoque</Link>
                    </p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    <select value={ano} onChange={(e) => aplicarCompetencia(Number(e.target.value), mes)}>
                        {[hoje.getFullYear() - 2, hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1, ano]
                            .filter((item, i, arr) => arr.indexOf(item) === i)
                            .sort((a, b) => a - b)
                            .map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                    </select>
                    <button type="button" className="os-ghost" onClick={imprimir}>
                        <Printer size={14} /> relatório
                    </button>
                    <button type="button" className="prd-btn prd-btn-primary" onClick={() => { setAba("bens"); setFormAberto(true); }}>
                        incluir bem
                    </button>
                </div>
            </div>

            <div className="os-tabs">
                <button type="button" className={aba === "balanco" ? "is-active" : ""} onClick={() => aplicarCompetencia(ano, mes, "balanco")}>
                    <span>Balanço</span>
                </button>
                <button type="button" className={aba === "bens" ? "is-active" : ""} onClick={() => aplicarCompetencia(ano, mes, "bens")}>
                    <span>Equipamentos e ferramentas</span>
                    <strong>{String(bens.length).padStart(2, "0")}</strong>
                </button>
            </div>

            {aba === "balanco" ? (
                <>
                    <div className="os-toolbar" style={{ flexWrap: "wrap", gap: 8 }}>
                        {MESES_BALANCO.map((nome, idx) => (
                            <button
                                key={nome}
                                type="button"
                                className={mes === idx + 1 ? "prd-btn prd-btn-primary" : "os-ghost"}
                                onClick={() => aplicarCompetencia(ano, idx + 1)}
                            >
                                {nome.slice(0, 3)}
                            </button>
                        ))}
                    </div>

                    <div className="dash-overview">
                        <div><b>{moedaBalanco(competencia.ativo)}</b><span>ativo</span></div>
                        <div><b>{moedaBalanco(competencia.passivo)}</b><span>passivo</span></div>
                        <div><b>{moedaBalanco(competencia.patrimonioLiquido)}</b><span>patrimônio líquido</span></div>
                        <div><b>{moedaBalanco(competencia.dreMes)}</b><span>resultado do mês (DRE)</span></div>
                    </div>

                    <p className="prd-sub">{destino.resumo}</p>

                    <div className="dash-overview">
                        <div><b>{moedaBalanco(destino.caixa)}</b><span>variação caixa</span></div>
                        <div><b>{moedaBalanco(destino.estoque)}</b><span>variação estoque</span></div>
                        <div><b>{moedaBalanco(destino.imobilizado)}</b><span>variação imobilizado</span></div>
                        <div><b>{moedaBalanco(destino.contasReceber)}</b><span>variação a receber</span></div>
                        <div><b>{moedaBalanco(destino.contasPagar)}</b><span>variação a pagar</span></div>
                    </div>

                    <div className="os-scroll" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <table className="fer-table os-table">
                            <thead>
                                <tr>
                                    <th>Ativo</th>
                                    <th className="is-num">Mês</th>
                                    <th className="is-num">Anterior</th>
                                    <th className="is-num">Δ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(dados?.ativo || []).map((linha) => (
                                    <tr key={linha.id}>
                                        <td>{linha.nome}</td>
                                        <td className="is-num">{moedaBalanco(linha.valor)}</td>
                                        <td className="is-num">{moedaBalanco(linha.anterior)}</td>
                                        <td className="is-num">{moedaBalanco(deltaDe(linha))}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td><strong>Total do ativo</strong></td>
                                    <td className="is-num"><strong>{moedaBalanco(competencia.ativo)}</strong></td>
                                    <td className="is-num">{moedaBalanco(dados?.anterior?.ativo)}</td>
                                    <td className="is-num">{moedaBalanco(Number(competencia.ativo || 0) - Number(dados?.anterior?.ativo || 0))}</td>
                                </tr>
                            </tbody>
                        </table>
                        <table className="fer-table os-table">
                            <thead>
                                <tr>
                                    <th>Passivo e PL</th>
                                    <th className="is-num">Mês</th>
                                    <th className="is-num">Anterior</th>
                                    <th className="is-num">Δ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(dados?.passivo || []).map((linha) => (
                                    <tr key={linha.id}>
                                        <td>{linha.nome}</td>
                                        <td className="is-num">{moedaBalanco(linha.valor)}</td>
                                        <td className="is-num">{moedaBalanco(linha.anterior)}</td>
                                        <td className="is-num">{moedaBalanco(deltaDe(linha))}</td>
                                    </tr>
                                ))}
                                {(dados?.patrimonio || []).map((linha) => (
                                    <tr key={linha.id}>
                                        <td>{linha.nome}</td>
                                        <td className="is-num">{moedaBalanco(linha.valor)}</td>
                                        <td className="is-num">{moedaBalanco(linha.anterior)}</td>
                                        <td className="is-num">{moedaBalanco(deltaDe(linha))}{linha.id === "pl" ? ` (${variacaoPct(linha.valor, linha.anterior)}%)` : ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ height: 280, marginTop: 16 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={serie}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="rotulo" />
                                <YAxis />
                                <Tooltip formatter={(valor) => moedaBalanco(valor)} />
                                <Bar dataKey="ativo" name="Ativo" fill="#3b82f6" />
                                <Bar dataKey="passivo" name="Passivo" fill="#f59e0b" />
                                <Bar dataKey="patrimonioLiquido" name="PL" fill="#22c55e" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            ) : (
                <>
                    <div className="dash-overview">
                        <div><b>{bens.filter((b) => String(b.status || "ATIVO").toUpperCase() !== "BAIXADO").length}</b><span>bens ativos</span></div>
                        <div><b>{moedaBalanco(imobilizadoAtivo)}</b><span>imobilizado ativo</span></div>
                        <div><b>{moedaBalanco(competencia.imobilizado)}</b><span>no balanço do mês</span></div>
                    </div>
                    <div className="os-toolbar">
                        <label className="fer-search">
                            <Search size={15} />
                            <input
                                value={buscaBem}
                                onChange={(e) => setBuscaBem(e.target.value)}
                                placeholder="Pesquise equipamento, ferramenta ou local"
                            />
                        </label>
                    </div>
                    <div className="os-scroll">
                        <table className="fer-table os-table">
                            <thead>
                                <tr>
                                    <th>Bem</th>
                                    <th>Tipo</th>
                                    <th>Local</th>
                                    <th>Aquisição</th>
                                    <th className="is-num">Valor</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bensVisiveis.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="ctt-vazio">Nenhum equipamento ou ferramenta cadastrado. Inclua para o imobilizado entrar no balanço.</td>
                                    </tr>
                                ) : bensVisiveis.map((bem) => (
                                    <tr key={bem.id}>
                                        <td>{bem.nome}</td>
                                        <td>{rotuloTipoBem(bem.tipo)}</td>
                                        <td>{bem.localizacao || "—"}</td>
                                        <td>{bem.dataAquisicao ? String(bem.dataAquisicao).slice(0, 10).split("-").reverse().join("/") : "—"}</td>
                                        <td className="is-num">{moedaBalanco(bem.valorAquisicao)}</td>
                                        <td>{String(bem.status || "ATIVO").toUpperCase() === "BAIXADO" ? "Baixado" : "Ativo"}</td>
                                        <td>
                                            {String(bem.status || "ATIVO").toUpperCase() !== "BAIXADO" ? (
                                                <button
                                                    type="button"
                                                    className="prd-btn"
                                                    disabled={trabalhando}
                                                    onClick={async () => {
                                                        await baixarBemPatrimonial(bem.id);
                                                        await carregar();
                                                    }}
                                                >
                                                    baixar
                                                </button>
                                            ) : null}
                                            <button
                                                type="button"
                                                className="idx-text"
                                                onClick={async () => {
                                                    if (window.confirm("Excluir este bem?")) {
                                                        await excluirBemPatrimonial(bem.id);
                                                        await carregar();
                                                    }
                                                }}
                                            >
                                                excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {formAberto ? (
                <div className="pv-modal-bg" onClick={() => setFormAberto(false)}>
                    <div className="pv-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Incluir bem patrimonial</h3>
                        <label>
                            Tipo
                            <select value={form.tipo} onChange={(e) => setForm((a) => ({ ...a, tipo: e.target.value }))}>
                                {TIPOS_BEM.map((tipo) => (
                                    <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Nome
                            <input value={form.nome} onChange={(e) => setForm((a) => ({ ...a, nome: e.target.value }))} />
                        </label>
                        <label>
                            Valor de aquisição
                            <input type="number" step="0.01" value={form.valorAquisicao} onChange={(e) => setForm((a) => ({ ...a, valorAquisicao: e.target.value }))} />
                        </label>
                        <label>
                            Data de aquisição
                            <input type="date" value={form.dataAquisicao} onChange={(e) => setForm((a) => ({ ...a, dataAquisicao: e.target.value }))} />
                        </label>
                        <label>
                            Localização
                            <input value={form.localizacao} onChange={(e) => setForm((a) => ({ ...a, localizacao: e.target.value }))} />
                        </label>
                        <label>
                            Observação
                            <input value={form.observacao} onChange={(e) => setForm((a) => ({ ...a, observacao: e.target.value }))} />
                        </label>
                        <div className="ctt-menu-acoes">
                            <button type="button" className="prd-btn prd-btn-primary" disabled={trabalhando} onClick={salvarBem}>salvar</button>
                            <button type="button" className="prd-btn" onClick={() => setFormAberto(false)}>cancelar</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
