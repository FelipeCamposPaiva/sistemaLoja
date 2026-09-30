export const PCT_COMISSAO_PADRAO = 5;

export const PAPEIS_VENDA = [
    { id: "vendedor", label: "Vendedor" },
    { id: "externo", label: "Externo" },
    { id: "gerente", label: "Gerente" },
    { id: "suporte", label: "Suporte" }
];

export const MODOS_COMISSAO = [
    { id: "percentual", label: "% da venda" },
    { id: "rateio", label: "Rateio do pool" },
    { id: "valor", label: "Valor fixo" }
];

export function linhaVendedor(parcial = {}) {
    return {
        funcId: parcial.funcId ?? parcial.id,
        nome: parcial.nome || "",
        papel: parcial.papel || "vendedor",
        modo: parcial.modo || "percentual",
        pct: Number(parcial.pct ?? PCT_COMISSAO_PADRAO),
        peso: Number(parcial.peso || 1),
        valorFixo: Number(parcial.valorFixo || 0)
    };
}

export function calcularComissoes(equipe, valorVenda, poolPct = PCT_COMISSAO_PADRAO) {
    const total = Number(valorVenda || 0);
    const lista = (equipe || []).map(linhaVendedor);
    const rateio = lista.filter((v) => v.modo === "rateio");
    const pesoTotal = rateio.reduce((s, v) => s + Math.max(0, Number(v.peso || 0)), 0);
    const pool = total * (Number(poolPct || 0) / 100);
    return lista.map((v) => {
        let valor = 0;
        if (v.modo === "valor") {
            valor = Number(v.valorFixo || 0);
        } else if (v.modo === "rateio") {
            valor = pesoTotal > 0 ? pool * (Number(v.peso || 0) / pesoTotal) : 0;
        } else {
            valor = total * (Number(v.pct || 0) / 100);
        }
        return { ...v, base: total, valor: Number(valor.toFixed(2)) };
    });
}

export function rotuloEquipe(equipe) {
    const lista = (equipe || []).filter((v) => v.nome);
    if (!lista.length) {
        return "Sem vendedor";
    }
    if (lista.length === 1) {
        return lista[0].nome;
    }
    if (lista.length === 2) {
        return `${lista[0].nome} + ${lista[1].nome.split(" ")[0]}`;
    }
    return `${lista[0].nome} + ${lista.length - 1}`;
}

export function rotuloPapel(papel) {
    return PAPEIS_VENDA.find((p) => p.id === papel)?.label || "Vendedor";
}

export function nomesEquipe(equipe) {
    return (equipe || []).map((v) => v.nome).filter(Boolean).join(", ");
}

export function equipeDePedido(pedido) {
    if (Array.isArray(pedido?.vendedores) && pedido.vendedores.length) {
        return pedido.vendedores.map(linhaVendedor);
    }
    if (pedido?.vendedor) {
        return [linhaVendedor({ nome: pedido.vendedor, funcId: pedido.vendedorId })];
    }
    return [];
}
