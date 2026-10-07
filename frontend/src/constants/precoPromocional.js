export function moedaPreco(valor) {
    const n = Number(valor);
    if (!Number.isFinite(n)) {
        return "R$ 0,00";
    }
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function round2(valor) {
    return Math.round((Number(valor) || 0) * 100) / 100;
}

export function emPromocao(produto) {
    const preco = Number(produto?.preco) || 0;
    const promo = Number(produto?.precoPromocional) || 0;
    return promo > 0 && preco > 0 && promo < preco;
}

export function precoVigente(produto) {
    return emPromocao(produto) ? Number(produto.precoPromocional) : Number(produto?.preco) || 0;
}

export const EVENTO_PRECOS = "erp-precos-atualizados";

export function avisarPrecosAtualizados(detalhe) {
    const init = detalhe ? { detail: detalhe } : undefined;
    window.dispatchEvent(new CustomEvent(EVENTO_PRECOS, init));
    window.dispatchEvent(new CustomEvent("erp-promocoes-atualizadas", init));
}

export function ouvirPrecos(fn) {
    window.addEventListener(EVENTO_PRECOS, fn);
    return () => window.removeEventListener(EVENTO_PRECOS, fn);
}

export function pctOff(preco, promo) {
    const n = Number(preco) || 0;
    const p = Number(promo) || 0;
    if (n <= 0 || p <= 0 || p >= n) {
        return 0;
    }
    return round2((1 - p / n) * 100);
}

export function rotuloOff(produto) {
    const preco = Number(produto?.preco) || 0;
    const promo = Number(produto?.precoPromocional) || 0;
    const pct = Number(produto?.descontoPercentual) || pctOff(preco, promo);
    if (!emPromocao(produto)) {
        return "";
    }
    return `De ${moedaPreco(preco)} por ${moedaPreco(promo)} — ${pct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% OFF`;
}

export function alinharPrecos(entrada, origem = "promocional") {
    const preco = round2(entrada?.preco);
    let promo = round2(entrada?.precoPromocional);
    let pct = round2(entrada?.descontoPercentual);
    if (preco <= 0) {
        return { preco, precoPromocional: 0, descontoPercentual: 0, rotulo: "" };
    }
    if (origem === "desconto") {
        pct = Math.min(100, Math.max(0, pct));
        promo = round2(preco * (1 - pct / 100));
    } else if (origem === "preco" && pct > 0) {
        pct = Math.min(100, Math.max(0, pct));
        promo = round2(preco * (1 - pct / 100));
    } else if (promo > 0 && promo < preco) {
        pct = pctOff(preco, promo);
    } else {
        promo = 0;
        pct = 0;
    }
    if (promo <= 0 || promo >= preco) {
        promo = 0;
        pct = 0;
    }
    const alinhado = { preco, precoPromocional: promo, descontoPercentual: pct };
    return { ...alinhado, rotulo: rotuloOff(alinhado) };
}

function margemSobre(preco, custo) {
    if (preco <= 0 || custo <= 0) {
        return null;
    }
    return round2((1 - custo / preco) * 100);
}

export function simularReajuste(produto, percentual, opcoes = {}) {
    const venda = opcoes.venda !== false;
    const atacado = opcoes.atacado !== false;
    const pct = Number(percentual);
    const fator = Number.isFinite(pct) ? 1 + pct / 100 : 1;
    const precoAtual = round2(produto?.preco);
    const atacadoAtual = round2(produto?.precoAtacado);
    const preco = venda ? round2(precoAtual * fator) : precoAtual;
    const precoAtacado = atacado && atacadoAtual > 0 ? round2(atacadoAtual * fator) : atacadoAtual;
    const desconto = round2(produto?.descontoPercentual);
    const alinhado = alinharPrecos({
        preco,
        precoPromocional: produto?.precoPromocional,
        descontoPercentual: desconto
    }, desconto > 0 ? "preco" : "promocional");
    const custo = round2(produto?.custo || produto?.custoCompra);
    return {
        precoAtual,
        preco,
        delta: round2(preco - precoAtual),
        precoAtacadoAtual: atacadoAtual,
        precoAtacado,
        deltaAtacado: round2(precoAtacado - atacadoAtual),
        precoPromocionalAtual: emPromocao(produto) ? round2(produto.precoPromocional) : 0,
        precoPromocional: alinhado.precoPromocional,
        descontoPercentual: alinhado.descontoPercentual,
        custo,
        margemAtual: margemSobre(precoAtual, custo),
        margemNova: margemSobre(preco, custo)
    };
}
