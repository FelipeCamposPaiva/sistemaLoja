import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Printer, Search } from "lucide-react";

import ROTAS from "../../constants/rotas";
import { abrirBoleto, mensagemErroApi, saldoConta } from "../../constants/parcelamentoContas";
import { boletoContaReceber, listarContasReceber, receberConta } from "../../services/contaReceber.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/os.css";
import "../../styles/pages/pedidos-venda.css";

function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataBr(valor) {
    if (!valor) {
        return "—";
    }
    const s = String(valor);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const [y, m, d] = s.slice(0, 10).split("-");
        return `${d}/${m}/${y}`;
    }
    return s;
}

function statusConta(conta) {
    return String(conta?.status || "ABERTO").toUpperCase();
}

export default function CobrancaBancaria() {
    const [lista, setLista] = useState([]);
    const [busca, setBusca] = useState("");
    const [aviso, setAviso] = useState("");
    const [trabalhando, setTrabalhando] = useState(false);

    async function carregar() {
        try {
            const dados = await listarContasReceber();
            setLista(Array.isArray(dados) ? dados : []);
        } catch {
            setAviso("Não foi possível ler os boletos / títulos.");
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    const visiveis = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return lista.filter((c) => {
            if (!termo) {
                return true;
            }
            return [c.id, c.clienteId, c.descricao, c.status].join(" ").toLowerCase().includes(termo);
        });
    }, [lista, busca]);

    const resumo = useMemo(() => ({
        boletos: lista.length,
        pendentes: lista.filter((c) => statusConta(c) !== "RECEBIDO" && statusConta(c) !== "AGRUPADO").length,
        recebidos: lista.filter((c) => statusConta(c) === "RECEBIDO").length,
        vencidos: lista.filter((c) => statusConta(c) !== "RECEBIDO" && Number(c.diasAtraso || 0) > 0).length
    }), [lista]);

    async function receber(id) {
        setTrabalhando(true);
        try {
            await receberConta(id);
            await carregar();
            setAviso("Boleto recebido com juros e multa atualizados.");
        } finally {
            setTrabalhando(false);
        }
    }

    return (
        <div className="os-page pv-page">
            <nav className="dash-crumb">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <span>financeiro</span>
                <span>›</span>
                <span>cobrança bancária</span>
            </nav>
            <div className="fer-head">
                <div>
                    <h2>Cobrança bancária</h2>
                    <p className="prd-sub">
                        Boletos vencidos já mostram o valor atualizado (original + juros + multa), sem consulta ao banco.
                        {" "}
                        <Link to="/configuracoes/juros-multa">percentuais</Link>
                    </p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    <Link className="os-ghost" to={ROTAS.CONTAS_RECEBER}>contas a receber</Link>
                    <button type="button" className="os-ghost" onClick={() => window.print()}>
                        <Printer size={14} /> relatório
                    </button>
                </div>
            </div>
            <div className="dash-overview">
                <div><b>{resumo.boletos}</b><span>boletos</span></div>
                <div><b>{resumo.pendentes}</b><span>pendentes</span></div>
                <div><b>{resumo.recebidos}</b><span>recebidos</span></div>
                <div><b>{resumo.vencidos}</b><span>vencidos</span></div>
            </div>
            <div className="os-toolbar">
                <label className="fer-search">
                    <Search size={15} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Pesquisar cliente, boleto ou descrição"
                    />
                </label>
            </div>
            <div className="os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Descrição</th>
                            <th>Vencimento</th>
                            <th className="is-num">Original</th>
                            <th className="is-num">Recebido</th>
                            <th className="is-num">Saldo / boleto</th>
                            <th>Atraso</th>
                            <th className="is-num">Juros</th>
                            <th className="is-num">Multa</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visiveis.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="ctt-vazio">Nenhuma cobrança bancária cadastrada.</td>
                            </tr>
                        ) : visiveis.map((c) => (
                            <tr key={c.id}>
                                <td>{c.id}</td>
                                <td>{c.clienteId || "—"}</td>
                                <td>{c.descricao || "—"}</td>
                                <td>{dataBr(c.vencimento)}</td>
                                <td className="is-num">{moeda(c.valor)}</td>
                                <td className="is-num">{moeda(c.valorPago)}</td>
                                <td className="is-num">{moeda(saldoConta(c))}</td>
                                <td>{Number(c.diasAtraso || 0) ? `${c.diasAtraso} d` : "—"}</td>
                                <td className="is-num">{moeda(c.juros)}</td>
                                <td className="is-num">{moeda(c.multa)}</td>
                                <td>
                                    <span className={`pv-flag${statusConta(c) === "RECEBIDO" ? " is-ok" : Number(c.diasAtraso || 0) > 0 ? " is-off" : ""}`}>
                                        {statusConta(c) === "RECEBIDO" ? "Recebido" : statusConta(c) === "AGRUPADO" ? "Agrupada" : Number(c.diasAtraso || 0) > 0 ? "Vencido" : "Pendente"}
                                    </span>
                                </td>
                                <td>
                                    {statusConta(c) !== "RECEBIDO" && statusConta(c) !== "AGRUPADO" ? (
                                        <>
                                            <button type="button" className="prd-btn" disabled={trabalhando} onClick={() => receber(c.id)}>
                                                receber
                                            </button>
                                            <button
                                                type="button"
                                                className="os-ghost"
                                                onClick={async () => {
                                                    try {
                                                        const boleto = await boletoContaReceber(c.id);
                                                        if (!abrirBoleto({ ...c, ...boleto })) {
                                                            setAviso("Permita pop-ups para imprimir o boleto.");
                                                        }
                                                    } catch (erro) {
                                                        setAviso(mensagemErroApi(erro));
                                                    }
                                                }}
                                            >
                                                boleto
                                            </button>
                                        </>
                                    ) : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
