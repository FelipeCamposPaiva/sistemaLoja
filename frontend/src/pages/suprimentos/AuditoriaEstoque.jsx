import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Printer } from "lucide-react";

import ROTAS from "../../constants/rotas";
import { listarProdutos } from "../../services/produto.service";
import {
    consultarAuditoria,
    estornarMovimentacao,
    filtrosAuditoria
} from "../../services/movimentacao.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/os.css";
import "../../styles/pages/estoque.css";

const ORIGEM_LABEL = {
    MANUAL: "Manual",
    NF: "Nota fiscal",
    PEDIDO: "Pedido",
    API: "API",
    OS: "Ordem de serviço",
    INVENTARIO: "Inventário",
    AJUSTE: "Ajuste",
    IMPORTACAO: "Importação",
    CADASTRO: "Cadastro"
};

const TIPO_LABEL = {
    ENTRADA: "Entrada",
    SAIDA: "Saída",
    TRANSFERENCIA: "Transferência",
    PRODUCAO: "Produção",
    PERDA: "Perda",
    AJUSTE: "Ajuste",
    BALANCO: "Balanço",
    ESTORNO: "Estorno"
};

function hojeIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function inicioMes() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function dataHora(valor) {
    if (!valor) {
        return "—";
    }
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) {
        return String(valor).replace("T", " ").slice(0, 16);
    }
    return d.toLocaleString("pt-BR");
}

function qtd(valor) {
    const n = Number(valor);
    if (Number.isNaN(n)) {
        return "—";
    }
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

function csvCell(valor) {
    const texto = valor == null ? "" : String(valor);
    if (/[;"\n]/.test(texto)) {
        return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
}

export default function AuditoriaEstoque() {
    const [lista, setLista] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [de, setDe] = useState(inicioMes);
    const [ate, setAte] = useState(hojeIso);
    const [usuarioId, setUsuarioId] = useState("");
    const [produtoId, setProdutoId] = useState("");
    const [tipo, setTipo] = useState("");
    const [origem, setOrigem] = useState("");
    const [status, setStatus] = useState("");
    const [aviso, setAviso] = useState("");
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        filtrosAuditoria()
            .then((dados) => setUsuarios(dados.usuarios || []))
            .catch(() => setUsuarios([]));
        listarProdutos()
            .then((dados) => setProdutos(Array.isArray(dados) ? dados : []))
            .catch(() => setProdutos([]));
    }, []);

    useEffect(() => {
        let vivo = true;
        setCarregando(true);
        consultarAuditoria({
            de,
            ate,
            usuarioId,
            produtoId,
            tipo,
            origem,
            status
        })
            .then((dados) => {
                if (vivo) {
                    setLista(dados);
                    setAviso("");
                }
            })
            .catch(() => {
                if (vivo) {
                    setLista([]);
                    setAviso("Não foi possível ler o log de estoque. Confirme se o backend está no ar.");
                }
            })
            .finally(() => {
                if (vivo) {
                    setCarregando(false);
                }
            });
        return () => {
            vivo = false;
        };
    }, [de, ate, usuarioId, produtoId, tipo, origem, status]);

    const totais = useMemo(() => {
        return lista.reduce((acc, item) => {
            const t = String(item.tipo || "").toUpperCase();
            const efeito = Number(item.efeito || 0);
            acc.total += 1;
            if (t === "ENTRADA" || t === "PRODUCAO") {
                acc.entradas += 1;
            }
            if (t === "SAIDA" || t === "PERDA") {
                acc.saidas += 1;
            }
            if (t === "AJUSTE" || t === "BALANCO") {
                acc.ajustes += 1;
            }
            if (t === "ESTORNO" || String(item.status).toUpperCase() === "ESTORNADO") {
                acc.estornos += 1;
            }
            acc.efeito += efeito;
            return acc;
        }, { total: 0, entradas: 0, saidas: 0, ajustes: 0, estornos: 0, efeito: 0 });
    }, [lista]);

    async function estornar(item) {
        if (String(item.status).toUpperCase() !== "ATIVO" || String(item.tipo).toUpperCase() === "ESTORNO") {
            return;
        }
        if (!window.confirm(`Estornar a movimentação #${item.id}? O histórico original permanece no relatório.`)) {
            return;
        }
        try {
            await estornarMovimentacao(item.id);
            const dados = await consultarAuditoria({ de, ate, usuarioId, produtoId, tipo, origem, status });
            setLista(dados);
            setAviso("Estorno lançado. O movimento original permanece no histórico.");
        } catch (error) {
            setAviso(error.response?.data?.mensagem || "Não foi possível estornar esta movimentação.");
        }
    }

    function exportarCsv() {
        const cab = ["Data", "Usuario", "Produto", "SKU", "Tipo", "Origem", "Documento", "Quantidade", "Efeito", "Saldo anterior", "Saldo posterior", "Status", "Observacao"];
        const linhas = lista.map((item) => [
            dataHora(item.dataMovimento),
            item.usuarioNome,
            item.produtoNome,
            item.produtoSku,
            TIPO_LABEL[item.tipo] || item.tipo,
            ORIGEM_LABEL[item.origem] || item.origem,
            item.origemRef,
            qtd(item.quantidade),
            qtd(item.efeito),
            qtd(item.saldoAnterior),
            qtd(item.saldoPosterior),
            item.status,
            item.observacao
        ].map(csvCell).join(";"));
        const blob = new Blob(["\uFEFF" + [cab.join(";"), ...linhas].join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `auditoria-estoque-${de}-a-${ate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="os-page estoque-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>suprimentos</span>
                <span>›</span>
                <Link to={ROTAS.ESTOQUE}>estoque</Link>
                <span>›</span>
                <span>auditoria</span>
            </nav>
            <div className="fer-head">
                <div>
                    <h2>Auditoria de estoque</h2>
                    <p className="idx-sub">
                        Quem alterou o estoque, o que fez, quando fez e por qual origem (NF, pedido, API ou manual).
                        Cancelamentos e estornos permanecem no histórico.
                    </p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    <button type="button" className="os-ghost" onClick={exportarCsv}>exportar CSV</button>
                    <button type="button" className="os-ghost" onClick={() => window.print()}>
                        <Printer size={15} /> imprimir
                    </button>
                    <Link className="prd-btn" to={ROTAS.ESTOQUE}>nova movimentação</Link>
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
                        Usuário
                        <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
                            <option value="">Todos</option>
                            {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>{u.nome || u.usuario}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Produto
                        <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
                            <option value="">Todos</option>
                            {produtos.map((p) => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Tipo
                        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                            <option value="">Todos</option>
                            {Object.entries(TIPO_LABEL).map(([id, nome]) => (
                                <option key={id} value={id}>{nome}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Origem
                        <select value={origem} onChange={(e) => setOrigem(e.target.value)}>
                            <option value="">Todas</option>
                            {Object.entries(ORIGEM_LABEL).map(([id, nome]) => (
                                <option key={id} value={id}>{nome}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Situação
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="">Todas</option>
                            <option value="ATIVO">Ativo</option>
                            <option value="ESTORNADO">Estornado</option>
                            <option value="CANCELADO">Cancelado</option>
                        </select>
                    </label>
                </div>
            </section>

            <div className="os-kpis">
                <article>
                    <small>Movimentações</small>
                    <strong>{totais.total}</strong>
                </article>
                <article>
                    <small>Entradas</small>
                    <strong>{totais.entradas}</strong>
                </article>
                <article>
                    <small>Saídas</small>
                    <strong>{totais.saidas}</strong>
                </article>
                <article>
                    <small>Ajustes / balanços</small>
                    <strong>{totais.ajustes}</strong>
                </article>
                <article>
                    <small>Estornos no período</small>
                    <strong>{totais.estornos}</strong>
                </article>
            </div>

            <div className="os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th>Data e hora</th>
                            <th>Usuário</th>
                            <th>Produto</th>
                            <th>Tipo</th>
                            <th>Origem</th>
                            <th className="is-num">Qtd</th>
                            <th className="is-num">Saldo</th>
                            <th>Situação</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {carregando ? (
                            <tr>
                                <td colSpan={9} className="ctt-vazio">Carregando log de estoque…</td>
                            </tr>
                        ) : lista.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="ctt-vazio">Nenhuma movimentação no filtro. Lance uma entrada, NF, pedido ou ajuste para gerar o primeiro registro.</td>
                            </tr>
                        ) : lista.map((item) => (
                            <tr key={item.id} className={String(item.status).toUpperCase() !== "ATIVO" ? "estq-linha-estorno" : undefined}>
                                <td>{dataHora(item.dataMovimento)}</td>
                                <td>{item.usuarioNome || "—"}</td>
                                <td>
                                    <strong>{item.produtoNome || `#${item.produtoId}`}</strong>
                                    <small className="estq-sku">{item.produtoSku || ""}</small>
                                    {item.observacao ? <small className="estq-sku">{item.observacao}</small> : null}
                                </td>
                                <td>
                                    <span className={`estq-badge is-${String(item.tipo || "").toLowerCase()}`}>
                                        {TIPO_LABEL[item.tipo] || item.tipo}
                                    </span>
                                </td>
                                <td>
                                    {ORIGEM_LABEL[item.origem] || item.origem || "Manual"}
                                    {item.origemRef ? <small className="estq-sku">{item.origemRef}</small> : null}
                                </td>
                                <td className="is-num">{qtd(item.efeito ?? item.quantidade)}</td>
                                <td className="is-num">{qtd(item.saldoAnterior)} → {qtd(item.saldoPosterior)}</td>
                                <td>
                                    <span className={`estq-badge is-${String(item.status || "ATIVO").toLowerCase()}`}>
                                        {item.status || "ATIVO"}
                                    </span>
                                </td>
                                <td>
                                    {String(item.status).toUpperCase() === "ATIVO" && String(item.tipo).toUpperCase() !== "ESTORNO" ? (
                                        <button type="button" className="idx-text" onClick={() => estornar(item)}>estornar</button>
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
