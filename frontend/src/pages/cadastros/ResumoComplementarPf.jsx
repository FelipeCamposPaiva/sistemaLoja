import { useEffect, useMemo, useState } from "react";
import { Clock, FileText, ShoppingCart, Star, TrendingDown, TrendingUp } from "lucide-react";

import { listarContasReceber } from "../../services/contaReceber.service";
import { listarPedidosVenda } from "../../services/pedidoVenda.service";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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

function numeroLimite(texto) {
    const limpo = String(texto || "0").trim().replace(/\./g, "").replace(",", ".");
    const valor = Number(limpo);
    return Number.isFinite(valor) ? valor : 0;
}

function paga(conta) {
    const status = String(conta?.status || "").toUpperCase();
    return status === "RECEBIDO" || status === "PAGO";
}

function variacao(atual, anterior) {
    if (anterior > 0) {
        return Math.round(((atual - anterior) / anterior) * 100);
    }
    return atual > 0 ? 100 : 0;
}

function haDias(data) {
    if (!data) {
        return "Sem compras";
    }
    const dias = Math.max(0, Math.round((Date.now() - data.getTime()) / 86400000));
    if (dias === 0) {
        return "Hoje";
    }
    if (dias === 1) {
        return "Há 1 dia";
    }
    return `Há ${dias} dias`;
}

function Seta({ valor }) {
    if (!valor) {
        return <em>0%</em>;
    }
    const Icon = valor > 0 ? TrendingUp : TrendingDown;
    return (
        <em className={valor < 0 ? "is-baixa" : ""}>
            <Icon size={12} />
            {valor > 0 ? "+" : ""}{valor}%
        </em>
    );
}

export default function ResumoComplementarPf({ contatoId, nome, limite }) {
    const [pedidos, setPedidos] = useState([]);
    const [contas, setContas] = useState([]);

    useEffect(() => {
        if (!contatoId) {
            setPedidos([]);
            setContas([]);
            return undefined;
        }
        let vivo = true;
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
        });
        return () => {
            vivo = false;
        };
    }, [contatoId, nome]);

    const resumo = useMemo(() => {
        const agora = new Date();
        const inicio = new Date(agora);
        inicio.setMonth(inicio.getMonth() - 12);
        const inicioAntes = new Date(agora);
        inicioAntes.setMonth(inicioAntes.getMonth() - 24);

        const naFaixa = (pedido, de, ate) => {
            const data = comoData(pedido.data);
            return Boolean(data && data >= de && data < ate);
        };
        const soma = (lista) => lista.reduce((total, pedido) => total + Number(pedido.valor || 0), 0);
        const atuais = pedidos.filter((pedido) => naFaixa(pedido, inicio, agora));
        const anteriores = pedidos.filter((pedido) => naFaixa(pedido, inicioAntes, inicio));

        const base = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const barras = [];
        for (let i = 5; i >= 0; i -= 1) {
            const mes = new Date(base.getFullYear(), base.getMonth() - i, 1);
            const fim = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);
            const valor = soma(pedidos.filter((pedido) => naFaixa(pedido, mes, fim)));
            barras.push({ rotulo: MESES[mes.getMonth()], valor });
        }
        const pico = Math.max(...barras.map((barra) => barra.valor), 0);
        const ultima = pedidos
            .map((pedido) => comoData(pedido.data))
            .filter(Boolean)
            .sort((a, b) => b - a)[0] || null;
        const limiteNum = numeroLimite(limite);
        const emAberto = contas.filter((conta) => !paga(conta)).reduce((total, conta) => (
            total + Number(conta.valorAtualizado ?? conta.valor ?? 0)
        ), 0);

        return {
            compras: soma(atuais),
            comprasVar: variacao(soma(atuais), soma(anteriores)),
            pedidos: atuais.length,
            pedidosVar: variacao(atuais.length, anteriores.length),
            ultima,
            limite: limiteNum,
            disponivel: limiteNum > 0 ? Math.max(0, limiteNum - emAberto) : null,
            barras,
            pico,
            totalBarras: soma(barras.map((barra) => ({ valor: barra.valor })))
        };
    }, [pedidos, contas, limite]);

    return (
        <div className="nct-comp-kpis">
            <article>
                <header>
                    <span className="nct-ico is-verde"><ShoppingCart size={15} /></span>
                    Total de compras
                </header>
                <strong>{reais(resumo.compras)}</strong>
                <p><Seta valor={resumo.comprasVar} /> <small>Últimos 12 meses</small></p>
            </article>
            <article>
                <header>
                    <span className="nct-ico is-rosa"><FileText size={15} /></span>
                    Pedidos realizados
                </header>
                <strong>{resumo.pedidos}</strong>
                <p><Seta valor={resumo.pedidosVar} /> <small>Últimos 12 meses</small></p>
            </article>
            <article>
                <header>
                    <span className="nct-ico is-rosa"><Clock size={15} /></span>
                    Última compra
                </header>
                <strong>{resumo.ultima ? resumo.ultima.toLocaleDateString("pt-BR") : "—"}</strong>
                <p><small>{haDias(resumo.ultima)}</small></p>
            </article>
            <article>
                <header>
                    <span className="nct-ico is-amarelo"><Star size={15} /></span>
                    Limite de crédito
                </header>
                <strong>{reais(resumo.limite)}</strong>
                <p>
                    <small>
                        {resumo.disponivel == null ? "Sem limite" : `Disponível: ${reais(resumo.disponivel)}`}
                    </small>
                </p>
            </article>
            <article className="nct-comp-chart">
                <header>
                    <span>Compras nos últimos 6 meses</span>
                    <strong>{reais(resumo.totalBarras)}</strong>
                </header>
                <div className="nct-comp-barras">
                    {resumo.barras.map((barra) => (
                        <span key={barra.rotulo}>
                            <i style={{ height: `${Math.max(8, resumo.pico ? (barra.valor / resumo.pico) * 100 : 8)}%` }} />
                            {barra.rotulo}
                        </span>
                    ))}
                </div>
            </article>
        </div>
    );
}
