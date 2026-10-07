import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Printer, Search } from "lucide-react";

import {
    DESTINOS_DEVOLUCAO,
    MOTIVOS_DEVOLUCAO,
    REEMBOLSOS_DEVOLUCAO,
    aplicarQtdDevolvida,
    cfopDevolucao,
    ehDevolucao,
    estornarComissaoDevolucao,
    itensDevolvidos,
    montarLinhas,
    noMes,
    proximoNumeroDevolucao,
    qtdItem,
    registrarComissaoDevolucao,
    rotuloDestino,
    rotuloMotivo,
    rotuloReembolso,
    rotuloSituacaoDevolucao,
    situacaoDevolucao,
    totalLinhas,
    vendaPodeDevolver
} from "../../constants/devolucoes";
import { dataPedidoBr, moedaPedido } from "../../constants/pedidosVenda";
import { gravarPdv, lerPdv } from "../../constants/pdv";
import ROTAS from "../../constants/rotas";
import { salvarContaPagar, excluirContaPagar } from "../../services/contaPagar.service";
import { excluirContaReceber, salvarContaReceber } from "../../services/contaReceber.service";
import { estornarMovimentacao, salvarMovimentacao } from "../../services/movimentacao.service";
import { atualizarPedidoVenda, listarPedidosVenda, salvarPedidoVenda } from "../../services/pedidoVenda.service";
import { listarProdutos } from "../../services/produto.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/os.css";
import "../../styles/pages/devolucoes.css";

const ABAS = [
    { id: "todas", label: "Todas", cor: "#94a3b8" },
    { id: "ABERTA", label: "Abertas", cor: "#f59e0b" },
    { id: "CONFERIDA", label: "Conferidas", cor: "#38bdf8" },
    { id: "CONCLUIDA", label: "Concluídas", cor: "#22c55e" },
    { id: "CANCELADA", label: "Canceladas", cor: "#64748b" }
];

function hojeIso() {
    return new Date().toISOString().slice(0, 10);
}

function mensagemErro(erro) {
    const data = erro?.response?.data;
    if (typeof data === "string" && data.trim()) {
        return data.trim();
    }
    if (data?.message) {
        return String(data.message);
    }
    return erro?.message || "Não foi possível concluir a operação.";
}

function registrarNoCaixa(doc) {
    const store = lerPdv();
    if (!store?.caixa) {
        return;
    }
    const item = {
        id: doc.id,
        numero: doc.numero,
        valor: doc.valor,
        cliente: doc.cliente,
        reembolso: doc.devolucao?.reembolso,
        em: new Date().toISOString()
    };
    const atuais = (store.caixa.devolucoes || []).filter((d) => String(d.numero) !== String(doc.numero));
    gravarPdv({
        ...store,
        caixa: { ...store.caixa, devolucoes: [item, ...atuais] }
    });
}

function tirarDoCaixa(numero) {
    const store = lerPdv();
    if (!store?.caixa?.devolucoes?.length) {
        return;
    }
    gravarPdv({
        ...store,
        caixa: {
            ...store.caixa,
            devolucoes: store.caixa.devolucoes.filter((d) => String(d.numero) !== String(numero))
        }
    });
}

export default function DevolucoesVenda() {
    const [params, setParams] = useSearchParams();
    const [pedidos, setPedidos] = useState([]);
    const [catalogo, setCatalogo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trabalhando, setTrabalhando] = useState(false);
    const [aviso, setAviso] = useState("");
    const [busca, setBusca] = useState(params.get("q") || "");
    const [aba, setAba] = useState("todas");
    const [buscaVenda, setBuscaVenda] = useState("");
    const [vendaId, setVendaId] = useState(params.get("pedido") || "");
    const [motivo, setMotivo] = useState("ARREPENDIMENTO");
    const [destino, setDestino] = useState("ESTOQUE");
    const [reembolso, setReembolso] = useState("CREDITO");
    const [obs, setObs] = useState("");
    const [linhas, setLinhas] = useState([]);

    const pedidoParam = params.get("pedido") || "";
    const idParam = params.get("id") || "";
    const nova = params.get("nova") === "1" || Boolean(pedidoParam);

    async function carregar(silencioso = false) {
        if (!silencioso) {
            setLoading(true);
        }
        try {
            const [lista, produtos] = await Promise.all([
                listarPedidosVenda(),
                listarProdutos().catch(() => [])
            ]);
            setPedidos(Array.isArray(lista) ? lista : []);
            setCatalogo(Array.isArray(produtos) ? produtos : []);
        } finally {
            if (!silencioso) {
                setLoading(false);
            }
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    const devolucoes = useMemo(() => pedidos.filter(ehDevolucao), [pedidos]);
    const vendas = useMemo(() => pedidos.filter((p) => !ehDevolucao(p)), [pedidos]);
    const aberta = devolucoes.find((d) => String(d.id) === String(idParam)) || null;
    const venda = vendas.find((p) => String(p.id) === String(vendaId)) || null;

    useEffect(() => {
        if (!pedidos.length) {
            return;
        }
        if (idParam && aberta?.devolucao?.pedidoOrigemId) {
            setVendaId(String(aberta.devolucao.pedidoOrigemId));
            setMotivo(aberta.devolucao.motivo || "OUTRO");
            setDestino(aberta.devolucao.destino || "ESTOQUE");
            setReembolso(aberta.devolucao.reembolso || "NENHUM");
            setObs(aberta.observacoes || "");
        } else if (pedidoParam) {
            setVendaId(String(pedidoParam));
        }
    }, [pedidos, idParam, pedidoParam, aberta]);

    useEffect(() => {
        if (aberta && (situacaoDevolucao(aberta) === "CONCLUIDA" || situacaoDevolucao(aberta) === "CANCELADA")) {
            const origem = vendas.find((p) => String(p.id) === String(aberta.devolucao?.pedidoOrigemId));
            setLinhas((aberta.itens || []).map((item, index) => {
                const vendido = (origem?.itens || []).find((i) => String(i.sku || i.descricao) === String(item.sku || item.descricao));
                return {
                    key: `${item.sku || index}-${index}`,
                    produtoId: item.produtoId || null,
                    sku: item.sku || "",
                    descricao: item.descricao || "Item",
                    valorUnitario: Number(item.valorUnitario || 0),
                    pedida: vendido ? Number(vendido.quantidade || vendido.qtd || 0) : qtdItem(item),
                    ja: vendido ? Number(vendido.qtdDevolvida || 0) : qtdItem(item),
                    disponivel: qtdItem(item),
                    qtdDevolver: qtdItem(item)
                };
            }));
            return;
        }
        if (!venda) {
            setLinhas([]);
            return;
        }
        setLinhas(montarLinhas(venda, devolucoes, catalogo, aberta));
    }, [venda, vendas, devolucoes, catalogo, aberta]);

    const filtradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return devolucoes.filter((doc) => {
            const situacao = situacaoDevolucao(doc);
            if (aba !== "todas" && situacao !== aba) {
                return false;
            }
            if (!termo) {
                return true;
            }
            const itens = (doc.itens || []).map((i) => `${i.sku || ""} ${i.descricao || ""}`).join(" ");
            return [doc.numero, doc.cliente, doc.vendedor, doc.devolucao?.pedidoOrigemNumero, doc.devolucao?.motivo, itens]
                .join(" ")
                .toLowerCase()
                .includes(termo);
        });
    }, [devolucoes, busca, aba]);

    const contagens = useMemo(() => {
        const mapa = { todas: devolucoes.length };
        ABAS.forEach((item) => {
            if (item.id !== "todas") {
                mapa[item.id] = devolucoes.filter((d) => situacaoDevolucao(d) === item.id).length;
            }
        });
        return mapa;
    }, [devolucoes]);

    const mes = devolucoes.filter((d) => situacaoDevolucao(d) === "CONCLUIDA" && noMes(d.data));
    const valorMes = mes.reduce((s, d) => s + Number(d.valor || 0), 0);
    const itensEstoque = mes
        .filter((d) => d.devolucao?.destino === "ESTOQUE" || d.devolucao?.destino === "GARANTIA")
        .reduce((s, d) => s + (d.itens || []).reduce((a, i) => a + qtdItem(i), 0), 0);

    const vendasBusca = useMemo(() => {
        const termo = buscaVenda.trim().toLowerCase();
        const lista = vendas
            .filter((p) => {
                if (venda && String(p.id) === String(venda.id)) {
                    return true;
                }
                if (!termo) {
                    return vendaPodeDevolver(p);
                }
                return [p.numero, p.cliente, p.notaFiscal, p.vendedor].join(" ").toLowerCase().includes(termo);
            })
            .slice(0, 8);
        if (venda && !lista.some((p) => String(p.id) === String(venda.id))) {
            return [venda, ...lista].slice(0, 8);
        }
        return lista;
    }, [vendas, buscaVenda, venda]);

    const total = totalLinhas(linhas);
    const somenteLeitura = aberta && situacaoDevolucao(aberta) !== "ABERTA" && situacaoDevolucao(aberta) !== "CONFERIDA";
    const cfop = cfopDevolucao(venda?.uf);

    function abrirLista() {
        setParams({});
        setAviso("");
    }

    function abrirNova() {
        setVendaId("");
        setMotivo("ARREPENDIMENTO");
        setDestino("ESTOQUE");
        setReembolso("CREDITO");
        setObs("");
        setParams({ nova: "1" });
    }

    function escolherVenda(id) {
        setVendaId(String(id));
        setParams({ pedido: String(id) });
    }

    function mudarQtd(key, valor) {
        const qtd = Number(String(valor).replace(",", "."));
        setLinhas((atual) => atual.map((linha) => {
            if (linha.key !== key) {
                return linha;
            }
            const limite = Number(linha.disponivel || 0);
            const proxima = Number.isFinite(qtd) ? Math.min(Math.max(0, qtd), limite) : 0;
            return { ...linha, qtdDevolver: proxima };
        }));
    }

    function documentoBase(numero, situacao, extra = {}) {
        const itens = itensDevolvidos(linhas);
        return {
            id: aberta?.id,
            numero,
            clienteId: venda.clienteId || null,
            cliente: venda.cliente,
            data: aberta?.data || new Date().toISOString(),
            valor: total,
            status: situacao === "CONCLUIDA" ? "DEVOLVIDO" : "RASCUNHO",
            origem: "Devolução",
            vendedor: venda.vendedor || "",
            vendedores: venda.vendedores || [],
            poolPct: venda.poolPct,
            estoqueLancado: false,
            contasLancadas: false,
            separacao: "PENDENTE",
            expedicao: "PENDENTE",
            observacoes: obs,
            naturezaOperacao: "Devolução de venda de mercadoria",
            cfop,
            uf: venda.uf || "",
            cidade: venda.cidade || "",
            notaFiscal: venda.notaFiscal || "",
            itens,
            devolucao: {
                ...(aberta?.devolucao || {}),
                ...extra,
                pedidoOrigemId: venda.id,
                pedidoOrigemNumero: venda.numero,
                notaFiscal: venda.notaFiscal || "",
                cfop,
                motivo,
                destino,
                reembolso,
                situacao
            }
        };
    }

    async function salvarRascunho(situacao = "ABERTA") {
        if (!venda) {
            setAviso("Escolha a venda de origem.");
            return null;
        }
        if (total <= 0) {
            setAviso("Informe a quantidade devolvida de ao menos um item.");
            return null;
        }
        setTrabalhando(true);
        try {
            const numero = aberta?.numero || proximoNumeroDevolucao(devolucoes);
            const corpo = documentoBase(numero, situacao);
            const salvo = aberta?.id
                ? await atualizarPedidoVenda(aberta.id, corpo)
                : await salvarPedidoVenda(corpo);
            await carregar(true);
            setParams({ id: String(salvo.id) });
            setAviso(situacao === "CONFERIDA" ? `${salvo.numero} conferida. Ainda não lançou estoque nem financeiro.` : `${salvo.numero} salva em aberto.`);
            return salvo;
        } catch (erro) {
            setAviso(mensagemErro(erro));
            return null;
        } finally {
            setTrabalhando(false);
        }
    }

    async function concluir() {
        if (!venda) {
            setAviso("Escolha a venda de origem.");
            return;
        }
        const itens = itensDevolvidos(linhas);
        if (!itens.length) {
            setAviso("Informe a quantidade devolvida de ao menos um item.");
            return;
        }
        const acima = linhas.some((linha) => Number(linha.qtdDevolver) - Number(linha.disponivel) > 0.0001);
        if (acima) {
            setAviso("A quantidade passa do que ainda pode ser devolvido nesta venda.");
            return;
        }
        setTrabalhando(true);
        const falhas = [];
        try {
            const numero = aberta?.numero || proximoNumeroDevolucao(devolucoes);
            let salvo = aberta?.id
                ? await atualizarPedidoVenda(aberta.id, documentoBase(numero, "CONCLUIDA"))
                : await salvarPedidoVenda(documentoBase(numero, "CONCLUIDA"));

            const origemAtual = pedidos.find((p) => String(p.id) === String(venda.id)) || venda;
            const historico = (origemAtual.devolucoes || []).filter((d) => String(d.numero) !== String(salvo.numero));
            await atualizarPedidoVenda(venda.id, {
                ...origemAtual,
                itens: aplicarQtdDevolvida(origemAtual.itens, itens, 1),
                devolucoes: [...historico, { id: salvo.id, numero: salvo.numero, valor: total, data: salvo.data }]
            });

            const movimentos = [];
            if (destino === "ESTOQUE" || destino === "GARANTIA") {
                for (const item of itens) {
                    if (!item.produtoId) {
                        falhas.push(`${item.descricao} ficou sem produto no cadastro, então o estoque não entrou.`);
                        continue;
                    }
                    try {
                        const mov = await salvarMovimentacao({
                            produtoId: Number(item.produtoId),
                            tipo: "ENTRADA",
                            quantidade: item.quantidade,
                            origem: "PEDIDO",
                            origemId: Number(salvo.id) || null,
                            origemRef: salvo.numero,
                            observacao: destino === "GARANTIA"
                                ? `Garantia ${salvo.numero} · conferir antes de vender · pedido ${venda.numero}`
                                : `Devolução ${salvo.numero} · pedido ${venda.numero}`
                        });
                        if (mov?.id) {
                            movimentos.push(mov.id);
                        }
                    } catch (erro) {
                        falhas.push(mensagemErro(erro));
                    }
                }
            }

            let contaReceberId = null;
            let contaPagarId = null;
            try {
                if (reembolso === "CREDITO") {
                    const conta = await salvarContaReceber({
                        clienteId: venda.clienteId ? Number(venda.clienteId) : null,
                        descricao: `Crédito de devolução ${salvo.numero} · pedido ${venda.numero} · ${venda.cliente}`,
                        valor: total,
                        vencimento: hojeIso(),
                        status: "CREDITO",
                        categoria: "Devolução",
                        valorPago: 0
                    });
                    contaReceberId = conta?.id || null;
                } else if (reembolso === "DINHEIRO" || reembolso === "ESTORNO") {
                    const conta = await salvarContaPagar({
                        valor: total,
                        vencimento: hojeIso(),
                        status: "ABERTO",
                        categoria: "Devolução",
                        valorPago: 0,
                        observacao: `${reembolso === "DINHEIRO" ? "Reembolso em dinheiro" : "Estorno"} da devolução ${salvo.numero} · pedido ${venda.numero} · ${venda.cliente}`
                    });
                    contaPagarId = conta?.id || null;
                }
            } catch (erro) {
                falhas.push(mensagemErro(erro));
            }

            const comissao = registrarComissaoDevolucao({
                equipe: venda.vendedores || [],
                numero: salvo.numero,
                cliente: venda.cliente,
                valor: total,
                poolPct: venda.poolPct
            });
            if (!(venda.vendedores || []).length) {
                falhas.push("Comissão não foi estornada: a venda não tem vendedor vinculado.");
            }

            salvo = await atualizarPedidoVenda(salvo.id, {
                ...salvo,
                estoqueLancado: movimentos.length > 0,
                contasLancadas: Boolean(contaReceberId || contaPagarId),
                devolucao: {
                    ...salvo.devolucao,
                    situacao: "CONCLUIDA",
                    movimentos,
                    contaReceberId,
                    contaPagarId,
                    comissao
                }
            });
            registrarNoCaixa({ ...salvo, valor: total, cliente: venda.cliente });
            await carregar(true);
            setParams({ id: String(salvo.id) });
            setAviso(falhas.length
                ? `${salvo.numero} concluída, com pendência: ${falhas.join(" ")}`
                : `${salvo.numero} concluída. Pedido, estoque, financeiro e comissão foram atualizados.`);
        } catch (erro) {
            setAviso(mensagemErro(erro));
        } finally {
            setTrabalhando(false);
        }
    }

    async function estornar() {
        if (!aberta || situacaoDevolucao(aberta) !== "CONCLUIDA") {
            return;
        }
        if (!window.confirm(`Estornar ${aberta.numero}? O estoque, o título e a comissão desta devolução voltam atrás.`)) {
            return;
        }
        setTrabalhando(true);
        const falhas = [];
        try {
            for (const id of aberta.devolucao?.movimentos || []) {
                try {
                    await estornarMovimentacao(id);
                } catch (erro) {
                    falhas.push(mensagemErro(erro));
                }
            }
            if (aberta.devolucao?.contaReceberId) {
                try {
                    await excluirContaReceber(aberta.devolucao.contaReceberId);
                } catch (erro) {
                    falhas.push(mensagemErro(erro));
                }
            }
            if (aberta.devolucao?.contaPagarId) {
                try {
                    await excluirContaPagar(aberta.devolucao.contaPagarId);
                } catch (erro) {
                    falhas.push(mensagemErro(erro));
                }
            }
            estornarComissaoDevolucao(aberta.numero);
            tirarDoCaixa(aberta.numero);
            const origem = vendas.find((p) => String(p.id) === String(aberta.devolucao?.pedidoOrigemId));
            if (origem) {
                await atualizarPedidoVenda(origem.id, {
                    ...origem,
                    itens: aplicarQtdDevolvida(origem.itens, aberta.itens, -1),
                    devolucoes: (origem.devolucoes || []).filter((d) => String(d.numero) !== String(aberta.numero))
                });
            }
            await atualizarPedidoVenda(aberta.id, {
                ...aberta,
                status: "CANCELADO",
                estoqueLancado: false,
                contasLancadas: false,
                devolucao: { ...aberta.devolucao, situacao: "CANCELADA" }
            });
            await carregar(true);
            setAviso(falhas.length ? `${aberta.numero} cancelada, com pendência: ${falhas.join(" ")}` : `${aberta.numero} estornada.`);
        } catch (erro) {
            setAviso(mensagemErro(erro));
        } finally {
            setTrabalhando(false);
        }
    }

    async function cancelarAberta() {
        if (!aberta) {
            abrirLista();
            return;
        }
        setTrabalhando(true);
        try {
            await atualizarPedidoVenda(aberta.id, {
                ...aberta,
                status: "CANCELADO",
                devolucao: { ...aberta.devolucao, situacao: "CANCELADA" }
            });
            await carregar(true);
            abrirLista();
            setAviso(`${aberta.numero} cancelada.`);
        } catch (erro) {
            setAviso(mensagemErro(erro));
        } finally {
            setTrabalhando(false);
        }
    }

    if (loading) {
        return (
            <div className="os-page dev-page">
                <p>Carregando devoluções...</p>
            </div>
        );
    }

    const mostrandoForm = nova || Boolean(idParam);

    return (
        <div className="os-page dev-page">
            <nav className="dash-crumb">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <Link to={ROTAS.PEDIDO_VENDA}>vendas</Link>
                <span>›</span>
                <span>devoluções</span>
            </nav>

            <div className="fer-head">
                <div>
                    <h2>Devoluções de venda</h2>
                    <p className="prd-sub">
                        Registra a mercadoria que volta, repõe o estoque, gera crédito ou reembolso e abate a comissão do vendedor.
                        O pedido original permanece na lista de vendas, com a quantidade já devolvida.
                    </p>
                    <p className="dev-links">
                        <Link to={`${ROTAS.PEDIDO_VENDA}#list`}>pedidos de venda</Link>
                        <Link to={ROTAS.PDV}>PDV</Link>
                        <Link to={ROTAS.ESTOQUE}>estoque</Link>
                        <Link to={ROTAS.AUDITORIA_ESTOQUE}>auditoria de estoque</Link>
                        <Link to={ROTAS.CONTAS_RECEBER}>contas a receber</Link>
                        <Link to={ROTAS.CONTAS_PAGAR}>contas a pagar</Link>
                        <Link to={ROTAS.COMISSOES}>comissões</Link>
                        <Link to="/nota-fiscal">nota fiscal</Link>
                        <Link to={`${ROTAS.DASHBOARD}#/vendas`}>dashboard de vendas</Link>
                    </p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="os-topo-acoes">
                    {mostrandoForm ? (
                        <button type="button" className="os-ghost" onClick={abrirLista}>voltar à lista</button>
                    ) : (
                        <button type="button" className="os-ghost" onClick={() => window.print()}>
                            <Printer size={14} /> imprimir
                        </button>
                    )}
                    <button type="button" className="prd-btn prd-btn-primary" onClick={abrirNova}>nova devolução</button>
                </div>
            </div>

            {!mostrandoForm ? (
                <>
                    <div className="dash-overview">
                        <div><b>{String(contagens.ABERTA || 0).padStart(2, "0")}</b><span>em aberto</span></div>
                        <div><b>{mes.length}</b><span>concluídas no mês</span></div>
                        <div><b>{moedaPedido(valorMes)}</b><span>valor devolvido no mês</span></div>
                        <div><b>{itensEstoque}</b><span>unidades repostas no estoque</span></div>
                    </div>

                    <div className="os-toolbar">
                        <label className="fer-search">
                            <Search size={15} />
                            <input
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Cliente, nº da devolução, pedido, NF ou produto"
                            />
                        </label>
                        <button type="button" className="idx-text" disabled={!busca && aba === "todas"} onClick={() => { setBusca(""); setAba("todas"); }}>
                            limpar filtros
                        </button>
                    </div>

                    <div className="os-tabs">
                        {ABAS.map((item) => (
                            <button key={item.id} type="button" className={aba === item.id ? "is-active" : ""} onClick={() => setAba(item.id)}>
                                <span><i style={{ background: item.cor }} />{item.label}</span>
                                <strong>{String(contagens[item.id] || 0).padStart(2, "0")}</strong>
                            </button>
                        ))}
                    </div>

                    <div className="dev-card">
                        <table className="os-table">
                            <thead>
                                <tr>
                                    <th>Devolução</th>
                                    <th>Data</th>
                                    <th>Cliente</th>
                                    <th>Pedido</th>
                                    <th>Motivo</th>
                                    <th>Destino</th>
                                    <th>Reembolso</th>
                                    <th>Valor</th>
                                    <th>Situação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtradas.length === 0 ? (
                                    <tr>
                                        <td colSpan={9}>
                                            <p className="dev-vazio">Nenhuma devolução nesta visão. Abra uma venda faturada e informe o que voltou.</p>
                                        </td>
                                    </tr>
                                ) : filtradas.map((doc) => {
                                    const situacao = situacaoDevolucao(doc);
                                    return (
                                        <tr key={doc.id || doc.numero} onClick={() => setParams({ id: String(doc.id) })} style={{ cursor: "pointer" }}>
                                            <td><Link to={`/devolucoes?id=${doc.id}`} onClick={(e) => e.stopPropagation()}>{doc.numero}</Link></td>
                                            <td>{dataPedidoBr(doc.data)}</td>
                                            <td>{doc.cliente}</td>
                                            <td>
                                                {doc.devolucao?.pedidoOrigemNumero ? (
                                                    <Link to={`${ROTAS.PEDIDO_VENDA}#edit/${encodeURIComponent(doc.devolucao.pedidoOrigemNumero)}`} onClick={(e) => e.stopPropagation()}>
                                                        {doc.devolucao.pedidoOrigemNumero}
                                                    </Link>
                                                ) : "—"}
                                            </td>
                                            <td>{rotuloMotivo(doc.devolucao?.motivo)}</td>
                                            <td>{rotuloDestino(doc.devolucao?.destino)}</td>
                                            <td>{rotuloReembolso(doc.devolucao?.reembolso)}</td>
                                            <td>{moedaPedido(doc.valor)}</td>
                                            <td>
                                                <span className={`dev-pill ${situacao === "CONCLUIDA" ? "is-ok" : situacao === "CANCELADA" ? "is-off" : "is-wait"}`}>
                                                    {rotuloSituacaoDevolucao(situacao)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <Formulario
                    aberta={aberta}
                    venda={venda}
                    vendasBusca={vendasBusca}
                    buscaVenda={buscaVenda}
                    setBuscaVenda={setBuscaVenda}
                    escolherVenda={escolherVenda}
                    linhas={linhas}
                    mudarQtd={mudarQtd}
                    motivo={motivo}
                    setMotivo={setMotivo}
                    destino={destino}
                    setDestino={setDestino}
                    reembolso={reembolso}
                    setReembolso={setReembolso}
                    obs={obs}
                    setObs={setObs}
                    total={total}
                    cfop={cfop}
                    somenteLeitura={somenteLeitura}
                    trabalhando={trabalhando}
                    onRascunho={() => salvarRascunho("ABERTA")}
                    onConferir={() => salvarRascunho("CONFERIDA")}
                    onConcluir={concluir}
                    onEstornar={estornar}
                    onCancelar={cancelarAberta}
                />
            )}
        </div>
    );
}

function Formulario({
    aberta,
    venda,
    vendasBusca,
    buscaVenda,
    setBuscaVenda,
    escolherVenda,
    linhas,
    mudarQtd,
    motivo,
    setMotivo,
    destino,
    setDestino,
    reembolso,
    setReembolso,
    obs,
    setObs,
    total,
    cfop,
    somenteLeitura,
    trabalhando,
    onRascunho,
    onConferir,
    onConcluir,
    onEstornar,
    onCancelar
}) {
    const situacao = aberta ? situacaoDevolucao(aberta) : "NOVA";
    const itensQtd = linhas.reduce((s, l) => s + Number(l.qtdDevolver || 0), 0);

    return (
        <div className="dev-form">
            <section className="dev-card">
                <h3>{aberta ? aberta.numero : "Nova devolução"}</h3>
                {somenteLeitura ? (
                    <p className="dev-muted">
                        {venda ? (
                            <>
                                Venda <Link to={`${ROTAS.PEDIDO_VENDA}#edit/${encodeURIComponent(venda.numero)}`}>{venda.numero}</Link>
                                {" · "}{venda.cliente}
                                {venda.notaFiscal ? ` · NF ${venda.notaFiscal}` : ""}
                            </>
                        ) : "Venda de origem não encontrada."}
                    </p>
                ) : (
                    <div className="dev-busca-venda">
                        <input
                            value={buscaVenda}
                            onChange={(e) => setBuscaVenda(e.target.value)}
                            placeholder="Busque a venda por cliente, número ou nota"
                        />
                        <div className="dev-vendas">
                            {vendasBusca.length === 0 ? <p className="dev-muted">Nenhuma venda encontrada.</p> : vendasBusca.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={venda && String(venda.id) === String(item.id) ? "is-on" : ""}
                                    onClick={() => escolherVenda(item.id)}
                                >
                                    <span>
                                        <strong>{item.numero}</strong> · {item.cliente}
                                        <br />
                                        <small>{dataPedidoBr(item.data)} · {item.notaFiscal || "sem NF"}</small>
                                    </span>
                                    <small>{vendaPodeDevolver(item) ? moedaPedido(item.valor) : "sem saldo"}</small>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <table className="dev-itens">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Vendido</th>
                            <th>Já devolvido</th>
                            <th>Disponível</th>
                            <th>Devolver</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.length === 0 ? (
                            <tr><td colSpan={6}><p className="dev-vazio">Escolha uma venda para ver os itens.</p></td></tr>
                        ) : linhas.map((linha) => (
                            <tr key={linha.key}>
                                <td>
                                    <strong>{linha.descricao}</strong>
                                    <br />
                                    <small className="dev-muted">{linha.sku || "sem SKU"}{linha.produtoId ? "" : " · sem cadastro de estoque"}</small>
                                </td>
                                <td>{linha.pedida}</td>
                                <td>{linha.ja}</td>
                                <td>{linha.disponivel}</td>
                                <td>
                                    {somenteLeitura ? linha.qtdDevolver : (
                                        <input
                                            className="dev-qtd"
                                            type="number"
                                            min="0"
                                            max={linha.disponivel}
                                            step="1"
                                            value={linha.qtdDevolver}
                                            disabled={linha.disponivel <= 0}
                                            onChange={(e) => mudarQtd(linha.key, e.target.value)}
                                        />
                                    )}
                                </td>
                                <td>{moedaPedido(Number(linha.qtdDevolver || 0) * Number(linha.valorUnitario || 0))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <aside className="dev-card">
                <h3>O que esta devolução faz</h3>
                <p className="dev-total"><span>Total</span><strong>{moedaPedido(total)}</strong></p>
                <label className="dev-muted">
                    Motivo
                    <select value={motivo} disabled={somenteLeitura} onChange={(e) => setMotivo(e.target.value)}>
                        {MOTIVOS_DEVOLUCAO.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                </label>
                <div className="dev-opcoes">
                    {DESTINOS_DEVOLUCAO.map((item) => (
                        <label key={item.id} className={destino === item.id ? "is-on" : ""}>
                            <input type="radio" name="destino" checked={destino === item.id} disabled={somenteLeitura} onChange={() => setDestino(item.id)} />
                            <span><strong>{item.label}</strong>{item.detalhe}</span>
                        </label>
                    ))}
                </div>
                <div className="dev-opcoes">
                    {REEMBOLSOS_DEVOLUCAO.map((item) => (
                        <label key={item.id} className={reembolso === item.id ? "is-on" : ""}>
                            <input type="radio" name="reembolso" checked={reembolso === item.id} disabled={somenteLeitura} onChange={() => setReembolso(item.id)} />
                            <span><strong>{item.label}</strong>{item.detalhe}</span>
                        </label>
                    ))}
                </div>
                <label className="dev-muted">
                    Observação
                    <textarea rows={3} value={obs} disabled={somenteLeitura} onChange={(e) => setObs(e.target.value)} placeholder="Estado da embalagem, quem recebeu, autorização" />
                </label>
                <ul className="dev-check">
                    <li><strong>Pedido {venda?.numero || "—"}</strong> marca {itensQtd} un. como devolvidas e segue na lista de vendas.</li>
                    <li><strong>Estoque</strong> {destino === "DESCARTE" ? "não recebe estas unidades." : "recebe uma entrada ligada a esta devolução."}</li>
                    <li><strong>Financeiro</strong> {rotuloReembolso(reembolso).toLowerCase()}.</li>
                    <li><strong>Comissão</strong> abate a parte do vendedor sobre {moedaPedido(total)}.</li>
                    <li><strong>Fiscal</strong> CFOP {cfop} · devolução de venda {cfop === "1202" ? "interna" : "interestadual"}. A nota sai em <Link to="/nota-fiscal">nota fiscal</Link>.</li>
                </ul>
                <div className="dev-acoes">
                    {situacao === "CONCLUIDA" ? (
                        <>
                            <button type="button" className="prd-btn prd-btn-primary" disabled={trabalhando} onClick={onEstornar}>estornar devolução</button>
                            {aberta?.devolucao?.contaReceberId ? <Link className="os-ghost" to={`${ROTAS.CONTAS_RECEBER}?filtro=todas`}>ver crédito</Link> : null}
                            {aberta?.devolucao?.contaPagarId ? <Link className="os-ghost" to={ROTAS.CONTAS_PAGAR}>ver reembolso</Link> : null}
                            <Link className="os-ghost" to={ROTAS.AUDITORIA_ESTOQUE}>ver estoque</Link>
                        </>
                    ) : situacao === "CANCELADA" ? (
                        <span className="dev-pill is-off">Cancelada</span>
                    ) : (
                        <>
                            <button type="button" className="prd-btn prd-btn-primary" disabled={trabalhando || total <= 0} onClick={onConcluir}>concluir devolução</button>
                            <button type="button" className="os-ghost" disabled={trabalhando || total <= 0} onClick={onConferir}>marcar conferida</button>
                            <button type="button" className="os-ghost" disabled={trabalhando || total <= 0} onClick={onRascunho}>salvar em aberto</button>
                            <button type="button" className="os-ghost" disabled={trabalhando} onClick={onCancelar}>cancelar</button>
                        </>
                    )}
                </div>
                {aberta ? (
                    <p className="dev-links">
                        <span className={`dev-pill ${situacao === "CONCLUIDA" ? "is-ok" : situacao === "CANCELADA" ? "is-off" : "is-wait"}`}>
                            {rotuloSituacaoDevolucao(situacao)}
                        </span>
                        {venda ? <Link to={`${ROTAS.PEDIDO_VENDA}#edit/${encodeURIComponent(venda.numero)}`}>abrir pedido {venda.numero}</Link> : null}
                        <Link to={ROTAS.PDV}>abrir no PDV</Link>
                    </p>
                ) : null}
            </aside>
        </div>
    );
}
