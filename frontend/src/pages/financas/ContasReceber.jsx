import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Printer, Search } from "lucide-react";

import AgruparParcelarModal from "../../components/AgruparParcelarModal";
import {
    abrirBoleto,
    contaAberta,
    dataBr,
    mensagemErroApi,
    mesmoParceiro,
    moedaConta,
    rotuloStatusConta,
    saldoConta,
    somarSaldos
} from "../../constants/parcelamentoContas";
import {
    agruparParcelarReceber,
    boletoContaReceber,
    excluirContaReceber,
    listarContasReceber,
    receberConta,
    receberContasLote,
    salvarContaReceber
} from "../../services/contaReceber.service";
import { listarCategoriasFinanceiras } from "../../services/balancete.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/os.css";
import "../../styles/pages/pedidos-venda.css";

const ABAS = [
    { id: "todas", label: "Todas", cor: "#94a3b8" },
    { id: "aberto", label: "Em aberto", cor: "#ef4444" },
    { id: "vencido", label: "Vencidas", cor: "#f59e0b" },
    { id: "parcial", label: "Parciais", cor: "#38bdf8" },
    { id: "recebido", label: "Recebidas", cor: "#22c55e" },
    { id: "agrupado", label: "Agrupadas", cor: "#a855f7" }
];

function statusConta(conta) {
    return String(conta?.status || "ABERTO").toUpperCase();
}

function atrasada(conta) {
    return contaAberta(conta, "receber") && Number(conta?.diasAtraso || 0) > 0;
}

function imprimirRelatorio(lista) {
    const linhas = lista.map((c) => `
        <tr>
            <td>${c.id}</td>
            <td>${c.descricao || "—"}</td>
            <td>${dataBr(c.vencimento)}</td>
            <td>${moedaConta(c.valor)}</td>
            <td>${moedaConta(c.valorPago)}</td>
            <td>${moedaConta(saldoConta(c))}</td>
            <td>${rotuloStatusConta(c.status)}</td>
        </tr>`).join("");
    const janela = window.open("", "_blank");
    if (!janela) {
        return;
    }
    janela.document.write(`<!doctype html><html><head><title>Contas a receber</title>
        <style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px;font-size:12px}th{text-align:left}</style>
        </head><body><h2>Contas a receber</h2>
        <p>Saldo em aberto em ${new Date().toLocaleString("pt-BR")}.</p>
        <table><thead><tr><th>ID</th><th>Descrição</th><th>Vencimento</th><th>Original</th><th>Recebido</th><th>Saldo</th><th>Status</th></tr></thead>
        <tbody>${linhas}</tbody></table></body></html>`);
    janela.document.close();
    janela.focus();
    janela.print();
}

export default function ContasReceber() {
    const [params, setParams] = useSearchParams();
    const filtroInicial = params.get("filtro");
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState("");
    const [aba, setAba] = useState(["recebido", "todas", "vencido", "parcial", "agrupado"].includes(filtroInicial) ? filtroInicial : "aberto");
    const [marcados, setMarcados] = useState([]);
    const [aviso, setAviso] = useState("");
    const [trabalhando, setTrabalhando] = useState(false);
    const [form, setForm] = useState({ descricao: "", valor: "", vencimento: "", clienteId: "", categoria: "3.01" });
    const [categorias, setCategorias] = useState([]);
    const [novoAberto, setNovoAberto] = useState(false);
    const [confirma, setConfirma] = useState(null);
    const [valorBaixa, setValorBaixa] = useState("");
    const [parcelarAberto, setParcelarAberto] = useState(false);

    async function carregar() {
        setLoading(true);
        try {
            const dados = await listarContasReceber();
            setContas(Array.isArray(dados) ? dados : []);
            setAviso("");
        } catch (erro) {
            console.error(erro);
            setContas([]);
            setAviso("Não foi possível ler as contas a receber.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar();
        listarCategoriasFinanceiras().then(setCategorias).catch(() => setCategorias([]));
    }, []);

    const filtradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return contas.filter((c) => {
            const status = statusConta(c);
            if (aba === "aberto" && !contaAberta(c, "receber")) {
                return false;
            }
            if (aba === "recebido" && status !== "RECEBIDO") {
                return false;
            }
            if (aba === "vencido" && !atrasada(c)) {
                return false;
            }
            if (aba === "parcial" && status !== "PARCIAL") {
                return false;
            }
            if (aba === "agrupado" && status !== "AGRUPADO") {
                return false;
            }
            if (!termo) {
                return true;
            }
            return [c.id, c.clienteId, c.descricao, c.status, c.parcela, c.parcelas].join(" ").toLowerCase().includes(termo);
        });
    }, [contas, busca, aba]);

    const contagens = useMemo(() => ({
        todas: contas.length,
        aberto: contas.filter((c) => contaAberta(c, "receber")).length,
        vencido: contas.filter(atrasada).length,
        parcial: contas.filter((c) => statusConta(c) === "PARCIAL").length,
        recebido: contas.filter((c) => statusConta(c) === "RECEBIDO").length,
        agrupado: contas.filter((c) => statusConta(c) === "AGRUPADO").length
    }), [contas]);

    const totais = useMemo(() => filtradas.reduce((acc, c) => ({
        original: acc.original + Number(c.valor || 0),
        recebido: acc.recebido + Number(c.valorPago || 0),
        saldo: acc.saldo + saldoConta(c)
    }), { original: 0, recebido: 0, saldo: 0 }), [filtradas]);

    function escolherAba(id) {
        setAba(id);
        setMarcados([]);
        const next = new URLSearchParams(params);
        if (id === "aberto") {
            next.delete("filtro");
        } else {
            next.set("filtro", id);
        }
        setParams(next, { replace: true });
    }

    function toggleMarca(id) {
        setMarcados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
    }

    function pedirReceber(conta) {
        setConfirma(conta);
        setValorBaixa(String(saldoConta(conta)));
    }

    async function confirmarRecebimento() {
        if (!confirma) {
            return;
        }
        setTrabalhando(true);
        try {
            const valor = Number(valorBaixa);
            await receberConta(confirma.id, Number.isFinite(valor) ? valor : undefined);
            setConfirma(null);
            await carregar();
            setAviso(valor > 0 && valor < saldoConta(confirma) ? "Baixa parcial registrada. O boleto seguinte usa só o saldo." : "Conta recebida.");
        } catch (erro) {
            setAviso(mensagemErroApi(erro));
        } finally {
            setTrabalhando(false);
        }
    }

    async function receberSelecionadas() {
        const ids = filtradas.filter((c) => marcados.includes(c.id) && contaAberta(c, "receber")).map((c) => c.id);
        if (!ids.length) {
            setAviso("Selecione contas em aberto.");
            return;
        }
        setTrabalhando(true);
        try {
            const resumo = await receberContasLote(ids);
            await carregar();
            setMarcados([]);
            setAviso(`${resumo.ok} conta(s) recebida(s)${resumo.erros ? `, ${resumo.erros} com erro.` : "."}`);
        } finally {
            setTrabalhando(false);
        }
    }

    function abrirParcelar() {
        const sel = abertasSel;
        if (sel.length < 1) {
            setAviso("Selecione contas em aberto para agrupar.");
            return;
        }
        if (!mesmoParceiro(sel, "clienteId")) {
            setAviso("Agrupe só contas do mesmo cliente.");
            return;
        }
        setParcelarAberto(true);
    }

    async function confirmarParcelar(pedido) {
        setTrabalhando(true);
        try {
            const resumo = await agruparParcelarReceber(pedido);
            setParcelarAberto(false);
            setMarcados([]);
            await carregar();
            escolherAba("aberto");
            setAviso(`${resumo.agrupadas} conta(s) agrupada(s) em ${resumo.geradas} parcela(s).`);
        } catch (erro) {
            setAviso(mensagemErroApi(erro));
        } finally {
            setTrabalhando(false);
        }
    }

    async function gerarBoleto(conta) {
        try {
            const boleto = await boletoContaReceber(conta.id);
            if (!abrirBoleto({ ...conta, ...boleto })) {
                setAviso("Permita pop-ups para imprimir o boleto.");
            }
        } catch (erro) {
            setAviso(mensagemErroApi(erro));
        }
    }

    async function salvar() {
        if (!form.descricao.trim() || !form.valor) {
            setAviso("Informe descrição e valor.");
            return;
        }
        setTrabalhando(true);
        try {
            await salvarContaReceber({
                descricao: form.descricao.trim(),
                valor: Number(form.valor),
                vencimento: form.vencimento || null,
                clienteId: form.clienteId ? Number(form.clienteId) : null,
                categoria: form.categoria || "3.01",
                status: "ABERTO",
                valorPago: 0
            });
            setForm({ descricao: "", valor: "", vencimento: "", clienteId: "", categoria: "3.01" });
            setNovoAberto(false);
            await carregar();
            escolherAba("aberto");
            setAviso("Conta incluída em aberto.");
        } finally {
            setTrabalhando(false);
        }
    }

    const abertasSel = filtradas.filter((c) => marcados.includes(c.id) && contaAberta(c, "receber"));

    if (loading) {
        return (
            <div className="os-page">
                <p>Carregando contas a receber...</p>
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
                <span>contas a receber</span>
            </nav>

            <div className="fer-head">
                <div>
                    <h2>Contas a receber</h2>
                    <p className="prd-sub">
                        Agrupe títulos do mesmo cliente e parcele o total (semanal, quinzenal ou mensal).
                        Depois de uma baixa parcial o boleto sai só com o saldo.
                        {" "}
                        <Link to="/configuracoes/juros-multa">alterar percentuais</Link>
                    </p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    <button type="button" className="os-ghost" onClick={() => imprimirRelatorio(filtradas)}>
                        <Printer size={14} /> relatório
                    </button>
                    <Link className="os-ghost" to="/contas-pagar">contas a pagar</Link>
                    <Link className="os-ghost" to="/vendas?filtro=contas-nao#list">pedidos sem contas lançadas</Link>
                    <button type="button" className="prd-btn prd-btn-primary" onClick={() => setNovoAberto(true)}>
                        incluir conta
                    </button>
                </div>
            </div>

            <div className="dash-overview">
                <div><b>{moedaConta(totais.original)}</b><span>valor original</span></div>
                <div><b>{moedaConta(totais.recebido)}</b><span>já recebido</span></div>
                <div><b>{moedaConta(totais.saldo)}</b><span>saldo em aberto</span></div>
            </div>

            <div className="os-toolbar">
                <label className="fer-search">
                    <Search size={15} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Pesquise por descrição, cliente ou status"
                    />
                </label>
                <button type="button" className="idx-text" disabled={!busca && aba === "aberto"} onClick={() => { setBusca(""); escolherAba("aberto"); }}>
                    limpar filtros
                </button>
            </div>

            <div className="os-tabs">
                {ABAS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={aba === item.id ? "is-active" : ""}
                        onClick={() => escolherAba(item.id)}
                    >
                        <span>
                            <i style={{ background: item.cor }} />
                            {item.label}
                        </span>
                        <strong>{String(contagens[item.id] || 0).padStart(2, "0")}</strong>
                    </button>
                ))}
            </div>

            <div className="os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th className="ctt-check">
                                <input
                                    type="checkbox"
                                    checked={filtradas.length > 0 && filtradas.every((c) => marcados.includes(c.id))}
                                    onChange={() => {
                                        const ids = filtradas.map((c) => c.id);
                                        const todos = ids.every((id) => marcados.includes(id));
                                        setMarcados(todos ? [] : ids);
                                    }}
                                    aria-label="Selecionar todas"
                                />
                            </th>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Parcela</th>
                            <th className="is-num">Original</th>
                            <th className="is-num">Recebido</th>
                            <th className="is-num">Saldo</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtradas.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="ctt-vazio">Nenhuma conta encontrada com este filtro.</td>
                            </tr>
                        ) : filtradas.map((c) => (
                            <tr key={c.id} className={marcados.includes(c.id) ? "is-sel" : ""}>
                                <td className="ctt-check">
                                    <input type="checkbox" checked={marcados.includes(c.id)} onChange={() => toggleMarca(c.id)} />
                                </td>
                                <td>{c.id}</td>
                                <td>{c.clienteId || "—"}</td>
                                <td>{c.descricao || "—"}</td>
                                <td>{c.categoria || "—"}</td>
                                <td>{c.parcela && c.parcelas ? `${c.parcela}/${c.parcelas}` : "—"}</td>
                                <td className="is-num">{moedaConta(c.valor)}</td>
                                <td className="is-num">{moedaConta(c.valorPago)}</td>
                                <td className="is-num">{moedaConta(saldoConta(c))}</td>
                                <td>{dataBr(c.vencimento)}</td>
                                <td>
                                    <span className={`pv-flag${statusConta(c) === "RECEBIDO" ? " is-ok" : atrasada(c) || statusConta(c) === "AGRUPADO" ? " is-off" : " is-ok"}`}>
                                        {rotuloStatusConta(c.status)}{atrasada(c) ? " · vencida" : ""}
                                    </span>
                                </td>
                                <td>
                                    {contaAberta(c, "receber") ? (
                                        <>
                                            <button type="button" className="prd-btn" disabled={trabalhando} onClick={() => pedirReceber(c)}>
                                                receber
                                            </button>
                                            <button type="button" className="os-ghost" onClick={() => gerarBoleto(c)}>
                                                boleto
                                            </button>
                                        </>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="idx-text"
                                        onClick={async () => {
                                            if (window.confirm("Excluir esta conta?")) {
                                                await excluirContaReceber(c.id);
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

            {marcados.length > 0 ? (
                <div className="os-bulk">
                    <span className="os-bulk-n">{String(marcados.length).padStart(2, "0")}</span>
                    {abertasSel.length > 0 ? (
                        <>
                            <button type="button" className="os-bulk-pri" disabled={trabalhando} onClick={abrirParcelar}>
                                agrupar e parcelar ({abertasSel.length}) · {moedaConta(somarSaldos(abertasSel))}
                            </button>
                            <button type="button" className="prd-btn" disabled={trabalhando} onClick={receberSelecionadas}>
                                <Check size={14} /> receber selecionadas
                            </button>
                        </>
                    ) : null}
                </div>
            ) : null}

            {novoAberto ? (
                <div className="pv-modal-bg" onClick={() => setNovoAberto(false)}>
                    <div className="pv-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Incluir conta a receber</h3>
                        <label>
                            Cliente (ID)
                            <input value={form.clienteId} onChange={(e) => setForm((a) => ({ ...a, clienteId: e.target.value }))} />
                        </label>
                        <label>
                            Descrição
                            <input value={form.descricao} onChange={(e) => setForm((a) => ({ ...a, descricao: e.target.value }))} />
                        </label>
                        <label>
                            Categoria
                            <select value={form.categoria} onChange={(e) => setForm((a) => ({ ...a, categoria: e.target.value }))}>
                                {(categorias.filter((c) => c.tipo === "RECEITA").length ? categorias.filter((c) => c.tipo === "RECEITA") : categorias).map((c) => (
                                    <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nome}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Valor original
                            <input type="number" step="0.01" value={form.valor} onChange={(e) => setForm((a) => ({ ...a, valor: e.target.value }))} />
                        </label>
                        <label>
                            Vencimento
                            <input type="date" value={form.vencimento} onChange={(e) => setForm((a) => ({ ...a, vencimento: e.target.value }))} />
                        </label>
                        <div className="ctt-menu-acoes">
                            <button type="button" className="prd-btn prd-btn-primary" disabled={trabalhando} onClick={salvar}>salvar</button>
                            <button type="button" className="prd-btn" onClick={() => setNovoAberto(false)}>cancelar</button>
                        </div>
                    </div>
                </div>
            ) : null}

            {confirma ? (
                <div className="pv-modal-bg" onClick={() => setConfirma(null)}>
                    <div className="pv-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Receber título #{confirma.id}</h3>
                        <p className="prd-sub">{confirma.descricao || "Conta a receber"}</p>
                        <p>Vencimento {dataBr(confirma.vencimento)}{atrasada(confirma) ? ` · ${confirma.diasAtraso} dia(s) de atraso` : ""}</p>
                        <ul className="fer-table" style={{ listStyle: "none", padding: 0 }}>
                            <li style={{ display: "flex", justifyContent: "space-between" }}><span>Original</span><strong>{moedaConta(confirma.valor)}</strong></li>
                            <li style={{ display: "flex", justifyContent: "space-between" }}><span>Já recebido</span><strong>{moedaConta(confirma.valorPago)}</strong></li>
                            <li style={{ display: "flex", justifyContent: "space-between" }}><span>Saldo</span><strong>{moedaConta(saldoConta(confirma))}</strong></li>
                        </ul>
                        <label>
                            Valor desta baixa (menor que o saldo = parcial)
                            <input type="number" step="0.01" min="0.01" value={valorBaixa} onChange={(e) => setValorBaixa(e.target.value)} />
                        </label>
                        <div className="ctt-menu-acoes">
                            <button type="button" className="prd-btn prd-btn-primary" disabled={trabalhando} onClick={confirmarRecebimento}>
                                confirmar recebimento
                            </button>
                            <button type="button" className="prd-btn" onClick={() => gerarBoleto(confirma)}>boleto do saldo</button>
                            <button type="button" className="prd-btn" onClick={() => setConfirma(null)}>cancelar</button>
                        </div>
                    </div>
                </div>
            ) : null}

            <AgruparParcelarModal
                aberto={parcelarAberto}
                contas={abertasSel}
                tipo="receber"
                trabalhando={trabalhando}
                onFechar={() => setParcelarAberto(false)}
                onConfirmar={confirmarParcelar}
            />
        </div>
    );
}
