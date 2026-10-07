import { calcularComissoes } from "./vendaVendedores";
import { gravarExtras, lerExtras } from "./comissoes";

export const UF_EMITENTE = "RJ";

export const MOTIVOS_DEVOLUCAO = [
    { id: "ARREPENDIMENTO", label: "Arrependimento" },
    { id: "DEFEITO", label: "Defeito ou avaria" },
    { id: "DIVERGENTE", label: "Produto divergente" },
    { id: "ATRASO", label: "Atraso na entrega" },
    { id: "GARANTIA", label: "Garantia" },
    { id: "TROCA", label: "Troca" },
    { id: "OUTRO", label: "Outro" }
];

export const DESTINOS_DEVOLUCAO = [
    { id: "ESTOQUE", label: "Volta ao estoque", detalhe: "A quantidade entra de novo para venda." },
    { id: "GARANTIA", label: "Garantia", detalhe: "Entra no estoque com observação de conferência." },
    { id: "DESCARTE", label: "Descarte", detalhe: "Não volta para o estoque vendável." }
];

export const REEMBOLSOS_DEVOLUCAO = [
    { id: "CREDITO", label: "Crédito na loja", detalhe: "Gera um crédito em contas a receber, sem entrar no saldo em aberto." },
    { id: "DINHEIRO", label: "Dinheiro", detalhe: "Gera uma conta a pagar e baixa o dinheiro do caixa do PDV, se estiver aberto." },
    { id: "ESTORNO", label: "Estorno no pagamento", detalhe: "Gera uma conta a pagar para devolver o valor recebido." },
    { id: "TROCA", label: "Troca", detalhe: "Não gera título. A saída da troca fica numa venda nova." },
    { id: "NENHUM", label: "Sem financeiro", detalhe: "Só registra a mercadoria." }
];

export function semAcento(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

export function ehDevolucao(pedido) {
    const status = String(pedido?.status || "").toUpperCase();
    if (status.includes("DEVOLU")) {
        return true;
    }
    const origem = semAcento(pedido?.origem);
    if (origem === "devolucao") {
        return true;
    }
    return Boolean(pedido?.devolucao?.pedidoOrigemId);
}

export function situacaoDevolucao(pedido) {
    const status = String(pedido?.status || "").toUpperCase();
    if (status === "CANCELADO" || pedido?.devolucao?.situacao === "CANCELADA") {
        return "CANCELADA";
    }
    if (status === "DEVOLVIDO" || pedido?.devolucao?.situacao === "CONCLUIDA") {
        return "CONCLUIDA";
    }
    if (pedido?.devolucao?.situacao === "CONFERIDA") {
        return "CONFERIDA";
    }
    return "ABERTA";
}

export function rotuloSituacaoDevolucao(situacao) {
    if (situacao === "CONCLUIDA") return "Concluída";
    if (situacao === "CONFERIDA") return "Conferida";
    if (situacao === "CANCELADA") return "Cancelada";
    return "Aberta";
}

export function rotuloMotivo(id) {
    return MOTIVOS_DEVOLUCAO.find((m) => m.id === id)?.label || id || "—";
}

export function rotuloDestino(id) {
    return DESTINOS_DEVOLUCAO.find((m) => m.id === id)?.label || id || "—";
}

export function rotuloReembolso(id) {
    return REEMBOLSOS_DEVOLUCAO.find((m) => m.id === id)?.label || id || "—";
}

export function qtdItem(item) {
    return Number(item?.quantidade ?? item?.qtd ?? 0) || 0;
}

export function unitarioItem(item) {
    return Number(item?.valorUnitario ?? item?.preco ?? 0) || 0;
}

export function qtdDevolvidaItem(item) {
    return Number(item?.qtdDevolvida || 0) || 0;
}

function arred(valor, casas) {
    const fator = 10 ** casas;
    return Math.round((Number(valor) || 0) * fator) / fator;
}

export function vendaPodeDevolver(pedido) {
    if (!pedido || ehDevolucao(pedido)) {
        return false;
    }
    const status = String(pedido.status || "").toUpperCase();
    if (["CANCELADO", "ORCAMENTO", "RASCUNHO"].includes(status)) {
        return false;
    }
    return (pedido.itens || []).some((item) => qtdItem(item) - qtdDevolvidaItem(item) > 0.0001);
}

function acharProduto(item, catalogo) {
    const lista = catalogo || [];
    if (item?.produtoId) {
        const porId = lista.find((p) => String(p.id) === String(item.produtoId));
        if (porId) {
            return porId;
        }
    }
    const sku = String(item?.sku || "").toLowerCase();
    if (!sku) {
        return null;
    }
    return lista.find((p) => String(p.sku || "").toLowerCase() === sku) || null;
}

export function montarLinhas(venda, documentos, catalogo, rascunho) {
    const outros = (documentos || []).filter((doc) => {
        if (!ehDevolucao(doc) || String(doc.id) === String(rascunho?.id)) {
            return false;
        }
        if (situacaoDevolucao(doc) === "CANCELADA" || situacaoDevolucao(doc) === "CONCLUIDA") {
            return false;
        }
        return String(doc.devolucao?.pedidoOrigemId) === String(venda?.id);
    });
    return (venda?.itens || []).map((item, index) => {
        const chave = String(item.sku || item.descricao || index);
        const pedida = qtdItem(item);
        const ja = qtdDevolvidaItem(item);
        const reservada = outros.reduce((soma, doc) => {
            const linha = (doc.itens || []).find((i) => String(i.sku || i.descricao) === String(item.sku || item.descricao));
            return soma + (linha ? qtdItem(linha) : 0);
        }, 0);
        const disponivel = Math.max(0, arred(pedida - ja - reservada, 3));
        const doRascunho = (rascunho?.itens || []).find((i) => String(i.sku || i.descricao) === String(item.sku || item.descricao));
        const produto = acharProduto(item, catalogo);
        const sugerida = doRascunho ? Math.min(disponivel, qtdItem(doRascunho)) : 0;
        return {
            key: `${chave}-${index}`,
            produtoId: item.produtoId || produto?.id || null,
            sku: item.sku || "",
            descricao: item.descricao || item.nome || "Item",
            valorUnitario: unitarioItem(item),
            pedida,
            ja,
            disponivel,
            qtdDevolver: sugerida
        };
    });
}

export function totalLinhas(linhas) {
    return arred((linhas || []).reduce((soma, linha) => soma + Number(linha.qtdDevolver || 0) * Number(linha.valorUnitario || 0), 0), 2);
}

export function cfopDevolucao(ufDestino) {
    const uf = String(ufDestino || "").trim().toUpperCase();
    if (uf && uf !== UF_EMITENTE) {
        return "2202";
    }
    return "1202";
}

export function proximoNumeroDevolucao(documentos) {
    const maior = (documentos || []).reduce((max, doc) => {
        const match = String(doc.numero || "").match(/DV-(\d+)/i);
        return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `DV-${String(maior + 1).padStart(4, "0")}`;
}

export function aplicarQtdDevolvida(itens, linhas, sinal) {
    return (itens || []).map((item) => {
        const linha = (linhas || []).find((i) => String(i.sku || i.descricao) === String(item.sku || item.descricao));
        if (!linha) {
            return item;
        }
        const qtd = Math.max(0, arred(qtdDevolvidaItem(item) + sinal * qtdItem(linha), 3));
        return { ...item, qtdDevolvida: qtd };
    });
}

export function itensDevolvidos(linhas) {
    return (linhas || [])
        .filter((linha) => Number(linha.qtdDevolver) > 0)
        .map((linha) => ({
            produtoId: linha.produtoId || null,
            sku: linha.sku,
            descricao: linha.descricao,
            quantidade: Number(linha.qtdDevolver),
            valorUnitario: Number(linha.valorUnitario || 0)
        }));
}

export function noMes(valor, referencia = new Date()) {
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) {
        return false;
    }
    return data.getFullYear() === referencia.getFullYear() && data.getMonth() === referencia.getMonth();
}

export function registrarComissaoDevolucao({ equipe, numero, cliente, valor, poolPct }) {
    const lista = calcularComissoes(equipe || [], valor, poolPct);
    if (!lista.length || !valor) {
        return false;
    }
    const extras = lerExtras();
    const data = new Date().toISOString().slice(0, 10);
    const competencia = data.slice(0, 7);
    let gravou = false;
    for (const vendedor of lista) {
        if (!vendedor.funcId || !vendedor.valor) {
            continue;
        }
        const id = `devolucao-${numero}-${vendedor.funcId}`;
        extras.lancamentos = (extras.lancamentos || []).filter((item) => item.id !== id);
        extras.lancamentos.push({
            id,
            funcId: vendedor.funcId,
            competencia,
            tipo: "devolucao",
            data,
            descricao: `Devolução ${numero} · ${cliente || "Consumidor final"}`,
            parcela: valor,
            base: valor,
            valor: vendedor.valor
        });
        gravou = true;
    }
    if (gravou) {
        gravarExtras(extras);
    }
    return gravou;
}

export function estornarComissaoDevolucao(numero) {
    const extras = lerExtras();
    const antes = (extras.lancamentos || []).length;
    extras.lancamentos = (extras.lancamentos || []).filter((item) => item.id !== `devolucao-${numero}` && !String(item.id || "").startsWith(`devolucao-${numero}-`));
    if (extras.lancamentos.length !== antes) {
        gravarExtras(extras);
    }
}
