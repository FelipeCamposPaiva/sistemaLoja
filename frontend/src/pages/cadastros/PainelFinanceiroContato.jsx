import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Lightbulb, ShoppingBag, ShoppingCart, Wallet } from "lucide-react";

import { formatarLimite } from "../../constants/mascarasContato";
import ROTAS from "../../constants/rotas";
import { listarContasReceber } from "../../services/contaReceber.service";
import { listarPedidosVenda } from "../../services/pedidoVenda.service";

const PERIODOS = [
    { id: 3, nome: "Últimos 3 meses" },
    { id: 6, nome: "Últimos 6 meses" },
    { id: 12, nome: "Últimos 12 meses" }
];

const FECHADOS = new Set(["CANCELADO", "ENTREGUE", "CONCLUIDO", "FATURADO", "ENVIADO"]);

function comoData(valor) {
    if (!valor) {
        return null;
    }
    if (Array.isArray(valor)) {
        const [ano, mes = 1, dia = 1] = valor;
        return new Date(ano, mes - 1, dia);
    }
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
}

function reais(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataCurta(data) {
    if (!data) {
        return "—";
    }
    return data.toLocaleDateString("pt-BR");
}

function haDias(data) {
    if (!data) {
        return "";
    }
    const dias = Math.max(0, Math.round((Date.now() - data.getTime()) / 86400000));
    if (dias === 0) {
        return "hoje";
    }
    if (dias === 1) {
        return "há 1 dia";
    }
    return `há ${dias} dias`;
}

function mesAno(data) {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${meses[data.getMonth()]}/${String(data.getFullYear()).slice(2)}`;
}

function inicioMes(data) {
    return new Date(data.getFullYear(), data.getMonth(), 1);
}

function dentroDe(data, meses) {
    if (!data) {
        return false;
    }
    const limite = new Date();
    limite.setMonth(limite.getMonth() - meses);
    limite.setHours(0, 0, 0, 0);
    return data >= limite;
}

function statusConta(conta) {
    return String(conta?.status || "ABERTO").toUpperCase();
}

function paga(conta) {
    const status = statusConta(conta);
    return status === "RECEBIDO" || status === "PAGO";
}

function atrasada(conta, hoje) {
    if (paga(conta)) {
        return false;
    }
    const vencimento = comoData(conta?.vencimento);
    return Boolean(vencimento && vencimento < hoje);
}

function valorConta(conta) {
    return Number(conta?.valorAtualizado ?? conta?.valor ?? 0);
}

export default function PainelFinanceiroContato({ contatoId, nome, limite, onLimite }) {
    const [pedidos, setPedidos] = useState([]);
    const [contas, setContas] = useState([]);
    const [mesesCompras, setMesesCompras] = useState(6);
    const [mesesPagamentos, setMesesPagamentos] = useState(6);
    const [carregando, setCarregando] = useState(Boolean(contatoId));

    useEffect(() => {
        if (!contatoId) {
            setPedidos([]);
            setContas([]);
            setCarregando(false);
            return undefined;
        }
        let vivo = true;
        setCarregando(true);
        Promise.all([
            listarPedidosVenda().catch(() => []),
            listarContasReceber().catch(() => [])
        ]).then(([listaPedidos, listaContas]) => {
            if (!vivo) {
                return;
            }
            const id = String(contatoId);
            const nomeNormal = String(nome || "").trim().toLowerCase();
            setPedidos((listaPedidos || []).filter((pedido) => (
                String(pedido.clienteId || "") === id
                || (nomeNormal && String(pedido.cliente || "").trim().toLowerCase() === nomeNormal)
            )));
            setContas((listaContas || []).filter((conta) => String(conta.clienteId || conta.cliente_id || "") === id));
        }).finally(() => {
            if (vivo) {
                setCarregando(false);
            }
        });
        return () => {
            vivo = false;
        };
    }, [contatoId, nome]);

    const painel = useMemo(() => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const trinta = new Date(hoje);
        trinta.setDate(trinta.getDate() - 30);
        const sessenta = new Date(hoje);
        sessenta.setDate(sessenta.getDate() - 60);

        const compras30 = pedidos.filter((pedido) => {
            const data = comoData(pedido.data);
            return data && data >= trinta;
        });
        const comprasAntes = pedidos.filter((pedido) => {
            const data = comoData(pedido.data);
            return data && data >= sessenta && data < trinta;
        });
        const soma = (lista) => lista.reduce((total, pedido) => total + Number(pedido.valor || 0), 0);
        const atual = soma(compras30);
        const anterior = soma(comprasAntes);
        const variacao = anterior > 0 ? Math.round(((atual - anterior) / anterior) * 100) : (atual > 0 ? 100 : 0);

        const abertos = pedidos.filter((pedido) => !FECHADOS.has(String(pedido.status || "").toUpperCase()));
        const atrasados = contas.filter((conta) => atrasada(conta, hoje));
        const ultima = pedidos
            .map((pedido) => comoData(pedido.data))
            .filter(Boolean)
            .sort((a, b) => b - a)[0] || null;

        const barras = [];
        const base = inicioMes(new Date());
        for (let i = mesesCompras - 1; i >= 0; i -= 1) {
            const mes = new Date(base.getFullYear(), base.getMonth() - i, 1);
            const fim = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);
            const valor = pedidos
                .filter((pedido) => {
                    const data = comoData(pedido.data);
                    return data && data >= mes && data < fim;
                })
                .reduce((total, pedido) => total + Number(pedido.valor || 0), 0);
            barras.push({ rotulo: mesAno(mes), valor });
        }

        const janela = contas.filter((conta) => (
            dentroDe(comoData(conta.dataRecebimento) || comoData(conta.vencimento), mesesPagamentos)
        ));
        const pagos = janela.filter(paga).reduce((total, conta) => total + valorConta(conta), 0);
        const atrasoValor = janela.filter((conta) => atrasada(conta, hoje)).reduce((total, conta) => total + valorConta(conta), 0);
        const abertoValor = janela
            .filter((conta) => !paga(conta) && !atrasada(conta, hoje))
            .reduce((total, conta) => total + valorConta(conta), 0);
        const totalSituacao = pagos + atrasoValor + abertoValor;

        const vendas = pedidos.map((pedido) => {
            const numero = String(pedido.numero || pedido.id || "");
            const ligadas = contas.filter((conta) => String(conta.descricao || "").includes(numero));
            let status = "Em aberto";
            if (ligadas.some((conta) => atrasada(conta, hoje))) {
                status = "Atrasado";
            } else if (ligadas.length && ligadas.every(paga)) {
                status = "Pago";
            } else if (FECHADOS.has(String(pedido.status || "").toUpperCase())) {
                status = "Pago";
            }
            return {
                id: `ped-${pedido.id}`,
                data: comoData(pedido.data),
                tipo: "Venda",
                documento: numero,
                descricao: "Pedido de venda",
                valor: Number(pedido.valor || 0),
                status
            };
        });
        const pagamentos = contas.filter(paga).map((conta) => ({
            id: `rec-${conta.id}`,
            data: comoData(conta.dataRecebimento) || comoData(conta.vencimento),
            tipo: "Pagamento",
            documento: `REC-${String(conta.id || "").padStart(6, "0")}`,
            descricao: conta.descricao || "Recebimento",
            valor: Number(conta.valorPago || conta.valor || 0),
            status: "Pago"
        }));
        const movimentos = [...vendas, ...pagamentos]
            .sort((a, b) => (b.data?.getTime() || 0) - (a.data?.getTime() || 0))
            .slice(0, 6);

        return {
            atual,
            variacao,
            abertos: abertos.length,
            abertosValor: soma(abertos),
            atrasados: atrasados.length,
            atrasadosValor: atrasados.reduce((total, conta) => total + valorConta(conta), 0),
            ultima,
            barras,
            pagos,
            atrasoValor,
            abertoValor,
            totalSituacao,
            movimentos
        };
    }, [pedidos, contas, mesesCompras, mesesPagamentos]);

    const topo = Math.max(...painel.barras.map((item) => item.valor), 1);
    const total = painel.totalSituacao || 1;
    const pct = (valor) => Math.round((valor / total) * 100);
    const pagosPct = painel.totalSituacao ? pct(painel.pagos) : 0;
    const abertoPct = painel.totalSituacao ? pct(painel.abertoValor) : 0;
    const atrasoPct = painel.totalSituacao ? Math.max(0, 100 - pagosPct - abertoPct) : 0;

    return (
        <div className="nct-fin">
            <div className="nct-fin-kpis">
                <article>
                    <span className="nct-fin-ico is-rosa"><Wallet size={16} /></span>
                    <small>Limite de crédito</small>
                    <strong>{reais(Number(String(limite || "0").replace(/\./g, "").replace(",", ".")) || 0)}</strong>
                </article>
                <article>
                    <span className="nct-fin-ico is-verde"><ShoppingCart size={16} /></span>
                    <small>Total de compras (30 dias)</small>
                    <strong>{reais(painel.atual)}</strong>
                    <em className={painel.variacao < 0 ? "is-baixa" : ""}>
                        {painel.variacao > 0 ? "+" : ""}{painel.variacao}% vs. 30 dias anteriores
                    </em>
                </article>
                <article>
                    <span className="nct-fin-ico is-roxo"><ShoppingBag size={16} /></span>
                    <small>Pedidos em aberto</small>
                    <strong>{painel.abertos}</strong>
                    <em>{reais(painel.abertosValor)}</em>
                </article>
                <article>
                    <span className="nct-fin-ico is-laranja"><Clock size={16} /></span>
                    <small>Atrasados</small>
                    <strong>{painel.atrasados}</strong>
                    <em>{reais(painel.atrasadosValor)}</em>
                </article>
                <article>
                    <span className="nct-fin-ico is-azul"><Calendar size={16} /></span>
                    <small>Última compra</small>
                    <strong>{dataCurta(painel.ultima)}</strong>
                    <em>{haDias(painel.ultima) || "Sem compras"}</em>
                </article>
            </div>

            <div className="nct-fin-graficos">
                <section className="nct-card">
                    <header>
                        <h3>Compras nos últimos {mesesCompras} meses</h3>
                        <select value={mesesCompras} onChange={(e) => setMesesCompras(Number(e.target.value))}>
                            {PERIODOS.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                        </select>
                    </header>
                    <div className="nct-fin-barras" style={{ gridTemplateColumns: `repeat(${painel.barras.length}, 1fr)` }}>
                        {painel.barras.map((item) => (
                            <div key={item.rotulo}>
                                <i style={{ height: `${Math.max(4, (item.valor / topo) * 100)}%` }} title={reais(item.valor)} />
                                <span>{item.rotulo}</span>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="nct-card">
                    <header>
                        <h3>Situação de pagamentos</h3>
                        <select value={mesesPagamentos} onChange={(e) => setMesesPagamentos(Number(e.target.value))}>
                            {PERIODOS.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                        </select>
                    </header>
                    <div className="nct-fin-dona">
                        <div
                            className="nct-fin-anel"
                            style={{
                                background: painel.totalSituacao
                                    ? `conic-gradient(#22c55e 0 ${pagosPct}%, #eab308 ${pagosPct}% ${pagosPct + abertoPct}%, #f43f5e ${pagosPct + abertoPct}% 100%)`
                                    : "#f6d7e6"
                            }}
                        >
                            <span>
                                <strong>{reais(painel.totalSituacao)}</strong>
                                <small>Total</small>
                            </span>
                        </div>
                        <ul>
                            <li><i className="is-pago" /> Pagos <b>{pagosPct}%</b> <span>{reais(painel.pagos)}</span></li>
                            <li><i className="is-aberto" /> Em aberto <b>{abertoPct}%</b> <span>{reais(painel.abertoValor)}</span></li>
                            <li><i className="is-atraso" /> Atrasados <b>{atrasoPct}%</b> <span>{reais(painel.atrasoValor)}</span></li>
                        </ul>
                    </div>
                </section>
            </div>

            <section className="nct-card nct-fin-limite">
                <header>
                    <span className="nct-fin-ico is-rosa"><Wallet size={16} /></span>
                    <div>
                        <h3>Limite de crédito</h3>
                        <p>Defina o limite de crédito deste cliente. Para não limitar o crédito, deixe o campo zerado.</p>
                    </div>
                </header>
                <div>
                    <label>
                        Limite de crédito
                        <span className="nct-fin-moeda">
                            <em>R$</em>
                            <input
                                value={limite ?? "0,00"}
                                onChange={(e) => onLimite(e.target.value)}
                                onBlur={(e) => onLimite(formatarLimite(e.target.value))}
                            />
                        </span>
                    </label>
                    <p className="nct-fin-dica">
                        <Lightbulb size={16} />
                        Esse limite será utilizado para controle de pedidos, vendas e condições de pagamento.
                    </p>
                </div>
            </section>

            <section className="nct-card">
                <header>
                    <h3>Últimas movimentações financeiras</h3>
                    <Link to={ROTAS.CONTAS_RECEBER}>Ver todas</Link>
                </header>
                {carregando ? <p className="nct-vazio">Carregando movimentações...</p> : null}
                {!carregando && !painel.movimentos.length ? (
                    <p className="nct-vazio">
                        {contatoId ? "Nenhuma compra ou cobrança deste contato ainda." : "As movimentações aparecem depois que o contato for salvo."}
                    </p>
                ) : null}
                {painel.movimentos.length ? (
                    <table className="nct-fin-tabela">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Tipo</th>
                                <th>Documento</th>
                                <th>Descrição</th>
                                <th>Valor</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {painel.movimentos.map((item) => (
                                <tr key={item.id}>
                                    <td>{dataCurta(item.data)}</td>
                                    <td>{item.tipo}</td>
                                    <td>{item.documento}</td>
                                    <td>{item.descricao}</td>
                                    <td>{reais(item.valor)}</td>
                                    <td><span className={`nct-fin-status is-${item.status === "Pago" ? "pago" : item.status === "Atrasado" ? "atraso" : "aberto"}`}>{item.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : null}
            </section>
        </div>
    );
}
