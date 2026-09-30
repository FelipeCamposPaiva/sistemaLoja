import { calcularComissoes } from "./vendaVendedores";

export const MES_ATUAL = "2026-09";

const NOMES_MES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

export function numBr(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export function competenciaLabel(id) {
    const [ano, mes] = String(id).split("-");
    return `${mes}/${ano}`;
}

export function nomeMes(id) {
    const [, mes] = String(id).split("-");
    return NOMES_MES[Number(mes) - 1] || id;
}

export function primeiroDia(id) {
    const [ano, mes] = String(id).split("-");
    return `01/${mes}/${ano}`;
}

export function shiftCompetencia(id, delta) {
    const [ano, mes] = String(id).split("-").map(Number);
    const d = new Date(ano, mes - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function item(parcial) {
    return {
        parcela: parcial.valor,
        base: parcial.valor,
        ...parcial
    };
}

export const COMISSOES_MES = {
    1: [
        item({ data: "2026-09-01", descricao: "JOELMA TULLER CARDOSO DE PAULO - Pedido 23726 (1/3)", parcela: 59.96, base: 59.96, valor: 3 }),
        item({ data: "2026-09-01", descricao: "JOELMA TULLER CARDOSO DE PAULO - Pedido 23726 (2/3)", parcela: 59.97, base: 59.97, valor: 3 }),
        item({ data: "2026-09-07", descricao: "ELEN LACERDA CLARO - Pedido 17707 (5/5)", parcela: 7.74, base: 7.74, valor: 0.38 })
    ],
    23: [
        item({ data: "2026-09-03", descricao: "ESCOLA HORIZONTE - Pedido 23801 (1/2)", parcela: 111.6, base: 111.6, valor: 5.58 }),
        item({ data: "2026-09-10", descricao: "ESCOLA HORIZONTE - Pedido 23801 (2/2)", parcela: 111.6, base: 111.6, valor: 5.58 })
    ],
    32: [
        item({ data: "2026-09-02", descricao: "MARIA DAS GRACAS OLIVEIRA - Pedido 23610 (1/3)", parcela: 382.8, base: 382.8, valor: 19.14 }),
        item({ data: "2026-09-08", descricao: "JOAO PEDRO ALVES - Pedido 23688 (1/2)", parcela: 382.8, base: 382.8, valor: 19.14 }),
        item({ data: "2026-09-15", descricao: "LIVRARIA PONTO FINAL - Pedido 23740 (1/1)", parcela: 382.8, base: 382.8, valor: 19.14 })
    ],
    2194: [
        item({ data: "2026-09-04", descricao: "Consumidor Final - Pedido 23790 (1/2)", parcela: 316.3, base: 316.3, valor: 15.82 }),
        item({ data: "2026-09-12", descricao: "Consumidor Final - Pedido 23790 (2/2)", parcela: 316.2, base: 316.2, valor: 15.81 })
    ],
    216: [
        item({ data: "2026-09-01", descricao: "PAPELARIA CENTRAL LTDA - Pedido 23650 (1/3)", parcela: 284.8, base: 284.8, valor: 14.24 }),
        item({ data: "2026-09-05", descricao: "PAPELARIA CENTRAL LTDA - Pedido 23650 (2/3)", parcela: 284.8, base: 284.8, valor: 14.24 }),
        item({ data: "2026-09-18", descricao: "PAPELARIA CENTRAL LTDA - Pedido 23650 (3/3)", parcela: 284.8, base: 284.8, valor: 14.24 })
    ]
};

export const PENDENTES = {
    1: [
        { id: "a-14", venc: "2025-03-01", descricao: "Consumidor Final - Pedido 14 (1/1)", parcela: 5.2, base: 5.2, valor: 0.26 },
        { id: "a-11", venc: "2025-03-01", descricao: "Consumidor Final - Pedido 11 (1/1)", parcela: 37.6, base: 37.6, valor: 1.88 },
        { id: "a-7", venc: "2025-03-01", descricao: "Consumidor Final - Pedido 7 (1/1)", parcela: 35, base: 35, valor: 1.75 },
        { id: "a-8", venc: "2025-03-01", descricao: "Consumidor Final - Pedido 8 (1/1)", parcela: 12.4, base: 12.4, valor: 0.62 },
        { id: "a-5", venc: "2025-03-01", descricao: "Consumidor Final - Pedido 5 (1/1)", parcela: 2.6, base: 2.6, valor: 0.13 },
        { id: "a-19", venc: "2025-03-01", descricao: "Consumidor Final - Pedido 19 (1/1)", parcela: 18.2, base: 18.2, valor: 0.91 },
        { id: "a-20", venc: "2025-03-01", descricao: "Consumidor Final - Pedido 20 (1/1)", parcela: 9.8, base: 9.8, valor: 0.49 }
    ]
};

export const VENDEDORES = [
    { funcId: 1, nome: "ADELINE CAMPOS SILVA", email: "adeline@temdetudovr.com.br", ant: 224.45 },
    { funcId: 2401, nome: "AILEMA CAMARGO REIS", email: "", ant: 0 },
    { funcId: 23, nome: "ARTHUR BRITO DE JESUS", email: "", ant: 711.51 },
    { funcId: 32, nome: "ELEN LACERDA CLARO", email: "", ant: 1823.94 },
    { funcId: 90, nome: "FELIPE CAMPOS PAIVA", email: "felipe@temdetudovr.com.br", ant: 249.41 },
    { funcId: 104, nome: "GABRIEL IVAN CAMPOS DIAS", email: "", ant: -6.57 },
    { funcId: 3, nome: "LEONAM RAFAEL DE FREITAS BEZERRA", email: "", ant: 0 },
    { funcId: 2194, nome: "MARIA ANTONIA DOS SANTOS ZORGDRAGER", email: "maria.antonia@temdetudovr.com.br", ant: 536.67 },
    { funcId: 216, nome: "NADIA CRISTINA LOPES DO CARMO CORDEIRO", email: "", ant: 891.46 },
    { funcId: 2402, nome: "PAMELLA CHRISTINA DE OLIVEIRA RESENDE", email: "", ant: 0 }
];

const EXTRA_KEY = "erp-comissoes-extras-v1";

export function lerExtras() {
    try {
        const bruto = localStorage.getItem(EXTRA_KEY);
        if (!bruto) {
            return { pagamentos: [], lancamentos: [], pendentesRemovidos: [] };
        }
        const dados = JSON.parse(bruto);
        return {
            pagamentos: dados.pagamentos || [],
            lancamentos: dados.lancamentos || [],
            pendentesRemovidos: dados.pendentesRemovidos || []
        };
    } catch {
        return { pagamentos: [], lancamentos: [], pendentesRemovidos: [] };
    }
}

export function gravarExtras(dados) {
    localStorage.setItem(EXTRA_KEY, JSON.stringify(dados));
}

export function noIntervalo(iso, de, ate) {
    if (!iso) {
        return !de && !ate;
    }
    const d = String(iso).slice(0, 10);
    if (de && d < de) {
        return false;
    }
    if (ate && d > ate) {
        return false;
    }
    return true;
}

export function competenciaDeData(iso) {
    return String(iso || "").slice(0, 7);
}

export function rotuloPeriodo(competencia, de, ate) {
    if (de && ate) {
        const fmt = (iso) => String(iso).split("-").reverse().join("/");
        return de === ate ? fmt(de) : `${fmt(de)} a ${fmt(ate)}`;
    }
    return `mês ${competenciaLabel(competencia)}`;
}

export function lancamentosDoMes(funcId, competencia) {
    if (competencia !== MES_ATUAL) {
        return [];
    }
    return COMISSOES_MES[funcId] || [];
}

export function pendentesDe(funcId, extras) {
    return (PENDENTES[funcId] || []).filter((p) => !extras.pendentesRemovidos.includes(p.id));
}

function somaCampo(itens, campo) {
    return Number(itens.reduce((s, x) => s + Number(x[campo] || 0), 0).toFixed(2));
}

export function vendedorPorId(funcId) {
    return VENDEDORES.find((x) => String(x.funcId) === String(funcId)) || {
        funcId,
        nome: `Vendedor #${funcId}`,
        email: "",
        ant: 0
    };
}

function noPeriodo(item, competencia, periodo) {
    const de = periodo?.de;
    const ate = periodo?.ate;
    if (de || ate) {
        return noIntervalo(item.data, de, ate);
    }
    return item.competencia === competencia || competenciaDeData(item.data) === competencia;
}

export function extratoVendedor(funcId, competencia, extras, periodo = null) {
    const v = vendedorPorId(funcId);
    const creditos = lancamentosDoMes(v.funcId, competencia).filter((x) => noPeriodo(x, competencia, periodo));
    const mesBase = somaCampo(creditos, "valor");
    const extrasMes = extras.lancamentos.filter((x) => String(x.funcId) === String(v.funcId) && noPeriodo(x, competencia, periodo));
    const creditosExtra = somaCampo(extrasMes.filter((x) => x.tipo === "credito"), "valor");
    const debitosExtra = somaCampo(extrasMes.filter((x) => x.tipo === "debito"), "valor");
    const pagamentos = extras.pagamentos.filter((x) => String(x.funcId) === String(v.funcId) && noPeriodo(x, competencia, periodo));
    const pago = somaCampo(pagamentos, "valor");
    const mes = Number((mesBase + creditosExtra).toFixed(2));
    const pendentes = pendentesDe(v.funcId, extras);
    const pend = somaCampo(pendentes, "valor");
    const saldo = Number((v.ant + mes - debitosExtra - pago).toFixed(2));
    return {
        ...v,
        competencia,
        periodo,
        creditos,
        extrasMes,
        pagamentos,
        pendentes,
        ant: v.ant,
        mes,
        vencidas: 0,
        devolucoes: 0,
        creditosExtra,
        debitos: debitosExtra,
        pago,
        pend,
        saldo
    };
}

export function linhasDoMes(competencia, extras, periodo = null) {
    const ids = new Set(VENDEDORES.map((v) => String(v.funcId)));
    extras.lancamentos.forEach((x) => {
        if (noPeriodo(x, competencia, periodo)) {
            ids.add(String(x.funcId));
        }
    });
    return [...ids].map((funcId) => {
        const e = extratoVendedor(funcId, competencia, extras, periodo);
        return {
            funcId: e.funcId,
            nome: e.nome,
            ant: e.ant,
            mes: e.mes,
            vencidas: 0,
            devolucoes: 0,
            creditos: e.creditosExtra,
            debitos: e.debitos,
            pagamentos: e.pago,
            pend: Number((e.ant + e.mes - e.debitos).toFixed(2)),
            saldo: e.saldo
        };
    }).sort((a, b) => String(a.nome).localeCompare(b.nome, "pt-BR"));
}

export function totais(linhas) {
    return linhas.reduce((acc, l) => ({
        ant: acc.ant + l.ant,
        mes: acc.mes + l.mes,
        pend: acc.pend + l.pend,
        saldo: acc.saldo + l.saldo
    }), { ant: 0, mes: 0, pend: 0, saldo: 0 });
}

export function emailsVendedores() {
    return VENDEDORES.filter((v) => v.email).map((v) => v.email);
}

export function registrarComissaoVenda({
    equipe,
    pedido,
    cliente,
    valorVenda,
    origem = "PDV",
    poolPct = 5
}) {
    const lista = calcularComissoes(equipe || [], valorVenda, poolPct);
    if (!lista.length || !valorVenda) {
        return;
    }
    const extras = lerExtras();
    const data = new Date().toISOString().slice(0, 10);
    const competencia = competenciaDeData(data) || MES_ATUAL;
    const prefixo = String(origem || "venda").toLowerCase().replace(/\s+/g, "-");
    for (const v of lista) {
        if (!v.funcId || !v.valor) {
            continue;
        }
        const id = `${prefixo}-${pedido}-${v.funcId}`;
        extras.lancamentos = extras.lancamentos.filter((x) => x.id !== id);
        extras.lancamentos.push({
            id,
            funcId: v.funcId,
            competencia,
            tipo: "credito",
            data,
            descricao: `${cliente || "Consumidor Final"} - Pedido ${pedido} (${origem} · ${v.papel || "vendedor"}${lista.length > 1 ? " compartilhada" : ""} 1/1)`,
            parcela: valorVenda,
            base: valorVenda,
            valor: v.valor,
            compartilhada: lista.length > 1
        });
    }
    gravarExtras(extras);
}

export function registrarComissaoPdv({ funcId, pedido, cliente, valorVenda, equipe, poolPct }) {
    registrarComissaoVenda({
        equipe: equipe?.length ? equipe : [{ funcId, modo: "percentual", pct: 5 }],
        pedido,
        cliente,
        valorVenda,
        origem: "PDV",
        poolPct
    });
}
