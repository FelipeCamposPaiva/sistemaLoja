import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Printer, Share2, Trash2 } from "lucide-react";

import ROTAS from "../../constants/rotas";
import {
    MES_ATUAL,
    competenciaLabel,
    emailsVendedores,
    extratoVendedor,
    gravarExtras,
    lerExtras,
    linhasDoMes,
    nomeMes,
    numBr,
    rotuloPeriodo,
    primeiroDia,
    shiftCompetencia,
    totais
} from "../../constants/comissoes";
import { funcionarioPorId } from "../../constants/rh";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/comissoes.css";

function dataBr(iso) {
    if (!iso) {
        return "—";
    }
    return iso.split("-").reverse().join("/");
}

function Cel({ valor }) {
    const n = Number(valor || 0);
    return <td className={n < 0 ? "is-neg" : undefined}>{numBr(n)}</td>;
}

function FiltroPeriodo({ competencia, de, ate, onAplicar, onLimpar }) {
    const [aberto, setAberto] = useState(false);
    const [rascunho, setRascunho] = useState({ competencia, de: de || "", ate: ate || "" });

    useEffect(() => {
        setRascunho({ competencia, de: de || "", ate: ate || "" });
    }, [competencia, de, ate]);

    return (
        <div className="com-periodo">
            <button type="button" className="fer-chip is-active" onClick={() => setAberto(!aberto)}>
                {de && ate ? rotuloPeriodo(competencia, de, ate) : nomeMes(competencia)}
            </button>
            <button type="button" className="com-limpar" onClick={onLimpar}>limpar filtros</button>
            {aberto ? (
                <div className="com-periodo-pop">
                    <span>mês de referência</span>
                    <div className="com-periodo-nav">
                        <button type="button" aria-label="Mês anterior" onClick={() => setRascunho((a) => ({ ...a, competencia: shiftCompetencia(a.competencia, -1) }))}>
                            <ChevronLeft size={16} />
                        </button>
                        <strong>{competenciaLabel(rascunho.competencia)}</strong>
                        <button type="button" aria-label="Próximo mês" onClick={() => setRascunho((a) => ({ ...a, competencia: shiftCompetencia(a.competencia, 1) }))}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <label className="com-periodo-data">
                        de
                        <input type="date" value={rascunho.de} onChange={(e) => setRascunho((a) => ({ ...a, de: e.target.value }))} />
                    </label>
                    <label className="com-periodo-data">
                        até
                        <input type="date" value={rascunho.ate} onChange={(e) => setRascunho((a) => ({ ...a, ate: e.target.value }))} />
                    </label>
                    <p className="com-periodo-hint">Use as datas para um relatório por período, não só pelo mês.</p>
                    <div className="com-periodo-acoes">
                        <button
                            type="button"
                            className="idx-pill"
                            onClick={() => {
                                onAplicar(rascunho);
                                setAberto(false);
                            }}
                        >
                            aplicar
                        </button>
                        <button type="button" className="com-limpar" onClick={() => setAberto(false)}>cancelar</button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default function Comissoes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [competencia, setCompetencia] = useState(MES_ATUAL);
    const [de, setDe] = useState("");
    const [ate, setAte] = useState("");
    const [extras, setExtras] = useState(lerExtras);
    const [aberto, setAberto] = useState(null);
    const [pendentesAbertos, setPendentesAbertos] = useState(true);
    const [aviso, setAviso] = useState("");
    const [pagar, setPagar] = useState({
        valor: "0,00",
        data: "2026-09-02",
        categoria: "Receita",
        conta: "Caixa",
        descricao: "Pagamento de comissões"
    });
    const [lancar, setLancar] = useState({
        valor: "0,00",
        data: "2026-09-02",
        tipo: "credito",
        descricao: "Outro lançamento"
    });

    useEffect(() => {
        gravarExtras(extras);
    }, [extras]);

    const periodo = de || ate ? { de, ate } : null;
    const linhas = useMemo(() => linhasDoMes(competencia, extras, periodo), [competencia, extras, periodo]);
    const soma = useMemo(() => totais(linhas), [linhas]);
    const detalhe = id ? extratoVendedor(id, competencia, extras, periodo) : null;
    const ficha = id ? funcionarioPorId(id) : null;
    const labelPeriodo = rotuloPeriodo(competencia, de, ate);

    function aplicarPeriodo(rascunho) {
        setCompetencia(rascunho.de ? rascunho.de.slice(0, 7) : rascunho.competencia);
        setDe(rascunho.de || "");
        setAte(rascunho.ate || "");
    }

    function limparPeriodo() {
        setCompetencia(MES_ATUAL);
        setDe("");
        setAte("");
    }

    function parseValor(txt) {
        return Number(String(txt).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")) || 0;
    }

    function confirmarShare() {
        const emails = emailsVendedores();
        setAviso(emails.length
            ? `Comissões enviadas para ${emails.length} e-mail(s): ${emails.join(", ")}.`
            : "Nenhum vendedor com e-mail cadastrado.");
        setAberto(null);
    }

    function salvarPagamento() {
        const valor = parseValor(pagar.valor);
        setExtras((atual) => ({
            ...atual,
            pagamentos: [...atual.pagamentos, {
                id: `pg-${Date.now()}`,
                funcId: Number(id),
                competencia,
                ...pagar,
                valor
            }]
        }));
        setAberto(null);
        setAviso("Pagamento lançado.");
    }

    function salvarLancamento() {
        const valor = parseValor(lancar.valor);
        setExtras((atual) => ({
            ...atual,
            lancamentos: [...atual.lancamentos, {
                id: `lc-${Date.now()}`,
                funcId: Number(id),
                competencia,
                ...lancar,
                valor
            }]
        }));
        setAberto(null);
        setAviso("Lançamento incluído.");
    }

    function removerPendente(pid) {
        setExtras((atual) => ({
            ...atual,
            pendentesRemovidos: [...atual.pendentesRemovidos, pid]
        }));
    }

    if (id && !detalhe) {
        return (
            <div className="com-page">
                <p>Vendedor não encontrado.</p>
                <Link to="/comissoes">voltar</Link>
            </div>
        );
    }

    if (detalhe) {
        return (
            <div className="com-page">
                <div className="com-top">
                    <nav className="dash-crumb" aria-label="Trilha">
                        <Link to="/comissoes" className="com-voltar"><ChevronLeft size={16} /> voltar</Link>
                        <Link to={ROTAS.INDICE}>início</Link>
                        <span>›</span>
                        <span>vendas</span>
                        <span>›</span>
                        <Link to="/comissoes">comissões</Link>
                    </nav>
                    <div className="ctt-acoes">
                        <button type="button" className="idx-pill" onClick={() => window.print()}>imprimir</button>
                        <div className="ctt-drop">
                            <button type="button" className="ctt-ghost" onClick={() => setAberto(aberto === "mais" ? null : "mais")}>
                                mais ações <ChevronDown size={14} />
                            </button>
                            {aberto === "mais" ? (
                                <div className="ctt-menu">
                                    <button type="button" onClick={() => { window.print(); setAberto(null); }}>imprimir relatório</button>
                                    <button type="button" onClick={() => setAberto("share")}>compartilhar</button>
                                    <button type="button" onClick={() => setAberto("pagar")}>realizar pagamento</button>
                                    <button type="button" onClick={() => setAberto("lancar")}>incluir lançamento</button>
                                    {ficha ? <button type="button" onClick={() => navigate(`/funcionarios/${ficha.id}`)}>ver ficha</button> : null}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <h2>comissões</h2>
                <p className="com-nome">{detalhe.nome}</p>
                <p className="idx-sub">
                    Comissão de vendedor. A de técnico sobre serviços da OS fica em{" "}
                    <Link to={ROTAS.RELATORIO_TECNICOS}>relatório por técnico</Link>.
                </p>
                <FiltroPeriodo competencia={competencia} de={de} ate={ate} onAplicar={aplicarPeriodo} onLimpar={limparPeriodo} />
                {aviso ? <p className="com-aviso">{aviso}</p> : null}

                <section className="com-bloco">
                    <header className="com-bloco-head">
                        <h3>comissões do {labelPeriodo}</h3>
                        <span>saldo antes de {primeiroDia(competencia)} {numBr(detalhe.ant)}</span>
                    </header>
                    <table className="fer-table com-detalhe">
                        <thead>
                            <tr>
                                <th>Data crédito</th>
                                <th>Descrição</th>
                                <th>Valor parcela</th>
                                <th>Base comissão</th>
                                <th>Valor comissão</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detalhe.creditos.length === 0 && detalhe.extrasMes.length === 0 ? (
                                <tr><td colSpan={5} className="com-vazio">Nenhuma comissão neste período.</td></tr>
                            ) : (
                                <>
                                    {detalhe.creditos.map((c, i) => (
                                        <tr key={`c-${i}`}>
                                            <td>{dataBr(c.data)}</td>
                                            <td>{c.descricao}</td>
                                            <Cel valor={c.parcela} />
                                            <Cel valor={c.base} />
                                            <Cel valor={c.valor} />
                                        </tr>
                                    ))}
                                    {detalhe.extrasMes.map((c) => (
                                        <tr key={c.id}>
                                            <td>{dataBr(c.data)}</td>
                                            <td>{c.descricao} ({c.tipo})</td>
                                            <Cel valor={c.valor} />
                                            <Cel valor={c.valor} />
                                            <Cel valor={c.tipo === "debito" ? -c.valor : c.valor} />
                                        </tr>
                                    ))}
                                </>
                            )}
                        </tbody>
                    </table>
                    <p className="com-total">
                        Total de comissões do período ({detalhe.creditos.length + detalhe.extrasMes.length})
                        <strong>{numBr(detalhe.mes)}</strong>
                    </p>
                </section>

                <section className="com-resumo">
                    <h3>resumo</h3>
                    <dl>
                        <div><dt>Saldo anterior</dt><dd>{numBr(detalhe.ant)}</dd></div>
                        <div><dt>(+) Comissões do mês</dt><dd>{numBr(detalhe.mes)}</dd></div>
                        {detalhe.debitos ? <div><dt>(-) Outros débitos</dt><dd>{numBr(detalhe.debitos)}</dd></div> : null}
                        {detalhe.pago ? <div><dt>(-) Pagamentos</dt><dd>{numBr(detalhe.pago)}</dd></div> : null}
                        <div><dt>(=) Saldo</dt><dd className={detalhe.saldo < 0 ? "is-neg" : undefined}>{numBr(detalhe.saldo)}</dd></div>
                    </dl>
                </section>

                <section className="com-bloco">
                    <header className="com-bloco-head">
                        <h3>comissões ainda pendentes</h3>
                        <button type="button" className="com-limpar" onClick={() => setPendentesAbertos(!pendentesAbertos)}>
                            {pendentesAbertos ? "ocultar" : "exibir"}
                        </button>
                    </header>
                    {pendentesAbertos ? (
                        <table className="fer-table com-detalhe">
                            <thead>
                                <tr>
                                    <th>Data venc.</th>
                                    <th>Descrição</th>
                                    <th>Valor parcela</th>
                                    <th>Base comissão</th>
                                    <th>Valor comissão</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {detalhe.pendentes.length === 0 ? (
                                    <tr><td colSpan={6} className="com-vazio">Nenhuma comissão pendente.</td></tr>
                                ) : detalhe.pendentes.map((p) => (
                                    <tr key={p.id}>
                                        <td>{dataBr(p.venc)}</td>
                                        <td>{p.descricao}</td>
                                        <Cel valor={p.parcela} />
                                        <Cel valor={p.base} />
                                        <Cel valor={p.valor} />
                                        <td className="com-row-acoes">
                                            <span className="com-dot" />
                                            <button type="button" aria-label="Excluir" onClick={() => removerPendente(p.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : null}
                </section>

                {aberto === "share" ? (
                    <div className="ctt-modal-bg" onClick={() => setAberto(null)}>
                        <div className="ctt-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>Compartilhar comissões</h3>
                            <p>Enviar comissões para os e-mails dos vendedores?</p>
                            <div className="com-periodo-acoes">
                                <button type="button" className="idx-pill" onClick={confirmarShare}>confirmar</button>
                                <button type="button" className="com-limpar" onClick={() => setAberto(null)}>cancelar</button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {aberto === "pagar" ? (
                    <aside className="ctt-drawer ctt-sheet">
                        <header>
                            <h3>Pagamento</h3>
                            <button type="button" className="com-limpar" onClick={() => setAberto(null)}>fechar ×</button>
                        </header>
                        <label>Referente ao mês
                            <input value={competenciaLabel(competencia)} readOnly />
                        </label>
                        <label>Data operação
                            <input type="date" value={pagar.data} onChange={(e) => setPagar({ ...pagar, data: e.target.value })} />
                        </label>
                        <label>Valor
                            <input value={pagar.valor} onChange={(e) => setPagar({ ...pagar, valor: e.target.value })} />
                        </label>
                        <label>Categoria
                            <select value={pagar.categoria} onChange={(e) => setPagar({ ...pagar, categoria: e.target.value })}>
                                <option>Receita</option>
                                <option>Despesa</option>
                            </select>
                            <small>Categoria de receita / despesa</small>
                        </label>
                        <label>Conta origem
                            <select value={pagar.conta} onChange={(e) => setPagar({ ...pagar, conta: e.target.value })}>
                                <option>Caixa</option>
                                <option>Banco</option>
                            </select>
                        </label>
                        <label>Descrição
                            <input value={pagar.descricao} onChange={(e) => setPagar({ ...pagar, descricao: e.target.value })} />
                        </label>
                        <div className="com-periodo-acoes">
                            <button type="button" className="idx-pill" onClick={salvarPagamento}>salvar</button>
                            <button type="button" className="com-limpar" onClick={() => setAberto(null)}>cancelar</button>
                        </div>
                    </aside>
                ) : null}

                {aberto === "lancar" ? (
                    <aside className="ctt-drawer ctt-sheet">
                        <header>
                            <h3>Outro lançamento</h3>
                            <button type="button" className="com-limpar" onClick={() => setAberto(null)}>fechar ×</button>
                        </header>
                        <label>Referente ao mês
                            <input value={competenciaLabel(competencia)} readOnly />
                        </label>
                        <label>Data operação
                            <input type="date" value={lancar.data} onChange={(e) => setLancar({ ...lancar, data: e.target.value })} />
                        </label>
                        <label>Valor
                            <input value={lancar.valor} onChange={(e) => setLancar({ ...lancar, valor: e.target.value })} />
                        </label>
                        <label>Tipo
                            <select value={lancar.tipo} onChange={(e) => setLancar({ ...lancar, tipo: e.target.value })}>
                                <option value="credito">Crédito</option>
                                <option value="debito">Débito</option>
                            </select>
                        </label>
                        <label>Descrição
                            <input value={lancar.descricao} onChange={(e) => setLancar({ ...lancar, descricao: e.target.value })} />
                        </label>
                        <div className="com-periodo-acoes">
                            <button type="button" className="idx-pill" onClick={salvarLancamento}>salvar</button>
                            <button type="button" className="com-limpar" onClick={() => setAberto(null)}>cancelar</button>
                        </div>
                    </aside>
                ) : null}
            </div>
        );
    }

    return (
        <div className="com-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <span>vendas</span>
                <span>›</span>
                <span>comissões</span>
            </nav>
            <div className="fer-head">
                <h2>comissões</h2>
                <div className="ctt-acoes">
                    <Link className="ctt-ghost" to={ROTAS.RELATORIO_TECNICOS}>técnicos da OS</Link>
                    <Link className="ctt-ghost" to={ROTAS.DEVOLUCOES}>devoluções</Link>
                    <button type="button" className="ctt-ghost" onClick={() => setAberto("share")}>
                        <Share2 size={15} />
                        compartilhar
                    </button>
                    <button type="button" className="ctt-ghost" onClick={() => window.print()}>
                        <Printer size={15} />
                        imprimir
                    </button>
                </div>
            </div>

            <FiltroPeriodo competencia={competencia} de={de} ate={ate} onAplicar={aplicarPeriodo} onLimpar={limparPeriodo} />
            {aviso ? <p className="com-aviso">{aviso}</p> : null}

            <div className="com-table-wrap">
                <table className="fer-table com-table">
                    <thead>
                        <tr>
                            <th>Vendedor</th>
                            <th>Saldo ant.</th>
                            <th>(+) Comis. período</th>
                            <th>(-) Comis. vencidas</th>
                            <th>(-) Dév. devoluções</th>
                            <th>(+) Out. créditos</th>
                            <th>(-) Out. débitos</th>
                            <th>(-) Pgtos</th>
                            <th>Comis. pend.</th>
                            <th>(=) Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.map((l) => (
                            <tr key={l.funcId} onClick={() => navigate(`/comissoes/${l.funcId}`)}>
                                <td>
                                    <Link to={`/comissoes/${l.funcId}`} onClick={(e) => e.stopPropagation()}>{l.nome}</Link>
                                </td>
                                <Cel valor={l.ant} />
                                <Cel valor={l.mes} />
                                <Cel valor={l.vencidas} />
                                <Cel valor={l.devolucoes} />
                                <Cel valor={l.creditos} />
                                <Cel valor={l.debitos} />
                                <Cel valor={l.pagamentos} />
                                <Cel valor={l.pend} />
                                <Cel valor={l.saldo} />
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="com-foot">
                <span>{linhas.length} vendedores</span>
                <span>{numBr(soma.ant)} saldo anterior</span>
                <span>{numBr(soma.mes)} comissões do período</span>
                <span>{numBr(soma.pend)} comissões pendentes</span>
                <span>{numBr(soma.saldo)} saldo</span>
            </footer>

            {aberto === "share" ? (
                <div className="ctt-modal-bg" onClick={() => setAberto(null)}>
                    <div className="ctt-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Compartilhar comissões</h3>
                        <p>Enviar comissões para os e-mails dos vendedores?</p>
                        <div className="com-periodo-acoes">
                            <button type="button" className="idx-pill" onClick={confirmarShare}>confirmar</button>
                            <button type="button" className="com-limpar" onClick={() => setAberto(null)}>cancelar</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
