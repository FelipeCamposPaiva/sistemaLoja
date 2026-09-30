import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

import AgruparParcelarModal from "../../components/AgruparParcelarModal";
import {
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
    agruparParcelarPagar,
    baixarContaPagar,
    excluirContaPagar,
    listarContasPagar,
    salvarContaPagar
} from "../../services/contaPagar.service";
import { listarCategoriasFinanceiras } from "../../services/balancete.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/os.css";
import "../../styles/pages/pedidos-venda.css";

const ABAS = [
    { id: "todas", label: "Todas", cor: "#94a3b8" },
    { id: "aberto", label: "Em aberto", cor: "#ef4444" },
    { id: "parcial", label: "Parciais", cor: "#38bdf8" },
    { id: "pago", label: "Pagas", cor: "#22c55e" },
    { id: "agrupado", label: "Agrupadas", cor: "#a855f7" }
];

function statusConta(conta) {
    return String(conta?.status || "ABERTO").toUpperCase();
}

export default function ContasPagar() {
    const [params, setParams] = useSearchParams();
    const filtroInicial = params.get("filtro");
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState("");
    const [aba, setAba] = useState(["pago", "todas", "parcial", "agrupado"].includes(filtroInicial) ? filtroInicial : "aberto");
    const [marcados, setMarcados] = useState([]);
    const [aviso, setAviso] = useState("");
    const [trabalhando, setTrabalhando] = useState(false);
    const [form, setForm] = useState({ fornecedorId: "", valor: "", vencimento: "", observacao: "", categoria: "4.02" });
    const [categorias, setCategorias] = useState([]);
    const [novoAberto, setNovoAberto] = useState(false);
    const [confirma, setConfirma] = useState(null);
    const [valorBaixa, setValorBaixa] = useState("");
    const [parcelarAberto, setParcelarAberto] = useState(false);

    async function carregar() {
        setLoading(true);
        try {
            const dados = await listarContasPagar();
            setContas(Array.isArray(dados) ? dados : []);
            setAviso("");
        } catch (erro) {
            console.error(erro);
            setContas([]);
            setAviso("Não foi possível ler as contas a pagar.");
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
            if (aba === "aberto" && !contaAberta(c, "pagar")) {
                return false;
            }
            if (aba === "pago" && status !== "PAGO") {
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
            return [c.id, c.fornecedorId, c.observacao, c.status].join(" ").toLowerCase().includes(termo);
        });
    }, [contas, busca, aba]);

    const contagens = useMemo(() => ({
        todas: contas.length,
        aberto: contas.filter((c) => contaAberta(c, "pagar")).length,
        parcial: contas.filter((c) => statusConta(c) === "PARCIAL").length,
        pago: contas.filter((c) => statusConta(c) === "PAGO").length,
        agrupado: contas.filter((c) => statusConta(c) === "AGRUPADO").length
    }), [contas]);

    const totais = useMemo(() => filtradas.reduce((acc, c) => ({
        original: acc.original + Number(c.valor || 0),
        pago: acc.pago + Number(c.valorPago || 0),
        saldo: acc.saldo + saldoConta(c)
    }), { original: 0, pago: 0, saldo: 0 }), [filtradas]);

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

    function pedirBaixa(conta) {
        setConfirma(conta);
        setValorBaixa(String(saldoConta(conta)));
    }

    async function confirmarBaixa() {
        if (!confirma) {
            return;
        }
        setTrabalhando(true);
        try {
            const valor = Number(valorBaixa);
            await baixarContaPagar(confirma.id, Number.isFinite(valor) ? valor : undefined);
            setConfirma(null);
            await carregar();
            setAviso(valor > 0 && valor < saldoConta(confirma) ? "Baixa parcial registrada." : "Conta paga.");
        } catch (erro) {
            setAviso(mensagemErroApi(erro));
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
        if (!mesmoParceiro(sel, "fornecedorId")) {
            setAviso("Agrupe só contas do mesmo fornecedor.");
            return;
        }
        setParcelarAberto(true);
    }

    async function confirmarParcelar(pedido) {
        setTrabalhando(true);
        try {
            const resumo = await agruparParcelarPagar(pedido);
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

    async function salvar() {
        if (!form.valor) {
            setAviso("Informe o valor.");
            return;
        }
        setTrabalhando(true);
        try {
            await salvarContaPagar({
                fornecedorId: form.fornecedorId ? Number(form.fornecedorId) : null,
                valor: Number(form.valor),
                vencimento: form.vencimento || null,
                observacao: form.observacao.trim(),
                categoria: form.categoria || "4.02",
                status: "ABERTO",
                valorPago: 0
            });
            setForm({ fornecedorId: "", valor: "", vencimento: "", observacao: "", categoria: "4.02" });
            setNovoAberto(false);
            await carregar();
            escolherAba("aberto");
            setAviso("Conta incluída em aberto.");
        } catch (erro) {
            setAviso(mensagemErroApi(erro));
        } finally {
            setTrabalhando(false);
        }
    }

    const abertasSel = filtradas.filter((c) => marcados.includes(c.id) && contaAberta(c, "pagar"));

    if (loading) {
        return (
            <div className="os-page">
                <p>Carregando contas a pagar...</p>
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
                <span>contas a pagar</span>
            </nav>

            <div className="fer-head">
                <div>
                    <h2>Contas a pagar</h2>
                    <p className="prd-sub">
                        Agrupe notas do mesmo fornecedor e parcele o total, no mesmo fluxo das contas a receber.
                    </p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    <Link className="os-ghost" to="/contas-receber">contas a receber</Link>
                    <button type="button" className="prd-btn prd-btn-primary" onClick={() => setNovoAberto(true)}>
                        incluir conta
                    </button>
                </div>
            </div>

            <div className="dash-overview">
                <div><b>{moedaConta(totais.original)}</b><span>valor original</span></div>
                <div><b>{moedaConta(totais.pago)}</b><span>já pago</span></div>
                <div><b>{moedaConta(totais.saldo)}</b><span>saldo em aberto</span></div>
            </div>

            <div className="os-toolbar">
                <label className="fer-search">
                    <Search size={15} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Pesquise por observação, fornecedor ou status"
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
                            <th>Fornecedor</th>
                            <th>Observação</th>
                            <th>Categoria</th>
                            <th>Parcela</th>
                            <th className="is-num">Original</th>
                            <th className="is-num">Pago</th>
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
                                <td>{c.fornecedorId || "—"}</td>
                                <td>{c.observacao || "—"}</td>
                                <td>{c.categoria || "—"}</td>
                                <td>{c.parcela && c.parcelas ? `${c.parcela}/${c.parcelas}` : "—"}</td>
                                <td className="is-num">{moedaConta(c.valor)}</td>
                                <td className="is-num">{moedaConta(c.valorPago)}</td>
                                <td className="is-num">{moedaConta(saldoConta(c))}</td>
                                <td>{dataBr(c.vencimento)}</td>
                                <td>
                                    <span className={`pv-flag${statusConta(c) === "PAGO" ? " is-ok" : statusConta(c) === "AGRUPADO" ? " is-off" : ""}`}>
                                        {rotuloStatusConta(c.status, "pagar")}
                                    </span>
                                </td>
                                <td>
                                    {contaAberta(c, "pagar") ? (
                                        <button type="button" className="prd-btn" disabled={trabalhando} onClick={() => pedirBaixa(c)}>
                                            baixar
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="idx-text"
                                        onClick={async () => {
                                            if (window.confirm("Excluir esta conta?")) {
                                                await excluirContaPagar(c.id);
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

            {marcados.length > 0 && abertasSel.length > 0 ? (
                <div className="os-bulk">
                    <span className="os-bulk-n">{String(marcados.length).padStart(2, "0")}</span>
                    <button type="button" className="os-bulk-pri" disabled={trabalhando} onClick={abrirParcelar}>
                        agrupar e parcelar ({abertasSel.length}) · {moedaConta(somarSaldos(abertasSel))}
                    </button>
                </div>
            ) : null}

            {novoAberto ? (
                <div className="pv-modal-bg" onClick={() => setNovoAberto(false)}>
                    <div className="pv-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Incluir conta a pagar</h3>
                        <label>
                            Fornecedor (ID)
                            <input value={form.fornecedorId} onChange={(e) => setForm((a) => ({ ...a, fornecedorId: e.target.value }))} />
                        </label>
                        <label>
                            Observação
                            <input value={form.observacao} onChange={(e) => setForm((a) => ({ ...a, observacao: e.target.value }))} />
                        </label>
                        <label>
                            Categoria
                            <select value={form.categoria} onChange={(e) => setForm((a) => ({ ...a, categoria: e.target.value }))}>
                                {(categorias.filter((c) => c.tipo === "DESPESA").length ? categorias.filter((c) => c.tipo === "DESPESA") : categorias).map((c) => (
                                    <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nome}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Valor
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
                        <h3>Baixar título #{confirma.id}</h3>
                        <p className="prd-sub">{confirma.observacao || "Conta a pagar"}</p>
                        <ul className="fer-table" style={{ listStyle: "none", padding: 0 }}>
                            <li style={{ display: "flex", justifyContent: "space-between" }}><span>Original</span><strong>{moedaConta(confirma.valor)}</strong></li>
                            <li style={{ display: "flex", justifyContent: "space-between" }}><span>Já pago</span><strong>{moedaConta(confirma.valorPago)}</strong></li>
                            <li style={{ display: "flex", justifyContent: "space-between" }}><span>Saldo</span><strong>{moedaConta(saldoConta(confirma))}</strong></li>
                        </ul>
                        <label>
                            Valor desta baixa (menor que o saldo = parcial)
                            <input type="number" step="0.01" min="0.01" value={valorBaixa} onChange={(e) => setValorBaixa(e.target.value)} />
                        </label>
                        <div className="ctt-menu-acoes">
                            <button type="button" className="prd-btn prd-btn-primary" disabled={trabalhando} onClick={confirmarBaixa}>
                                confirmar baixa
                            </button>
                            <button type="button" className="prd-btn" onClick={() => setConfirma(null)}>cancelar</button>
                        </div>
                    </div>
                </div>
            ) : null}

            <AgruparParcelarModal
                aberto={parcelarAberto}
                contas={abertasSel}
                tipo="pagar"
                trabalhando={trabalhando}
                onFechar={() => setParcelarAberto(false)}
                onConfirmar={confirmarParcelar}
            />
        </div>
    );
}
