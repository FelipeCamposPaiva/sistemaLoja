import api from "./api";

function num(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
}

export async function dashboardGeral() {
    const { data } = await api.get("/dashboard-geral");
    return {
        totalClientes: num(data?.totalClientes),
        clientesNovos: num(data?.clientesNovos),
        totalProdutos: num(data?.totalProdutos),
        totalOS: num(data?.totalOS),
        osProducao: num(data?.osProducao),
        totalOrcamentos: num(data?.totalOrcamentos),
        estoqueBaixo: num(data?.estoqueBaixo),
        vendasHoje: num(data?.vendasHoje),
        faturamentoMes: num(data?.faturamentoMes),
        saldoCaixa: num(data?.saldoCaixa),
        contasReceber: num(data?.contasReceber),
        contasPagar: num(data?.contasPagar)
    };
}

export async function dashboardFinanceiro() {
    const { data } = await api.get("/dashboard-financeiro");
    return {
        saldoCaixa: num(data?.saldoCaixa),
        contasReceber: num(data?.contasReceber),
        contasPagar: num(data?.contasPagar),
        entradasMes: num(data?.entradasMes),
        saidasMes: num(data?.saidasMes),
        resultado: num(data?.resultado)
    };
}

export async function dashboardSuprimentos() {
    const { data } = await api.get("/dashboard-suprimentos");
    return data || {};
}

export async function gerarPedidosCompra(ids) {
    const { data } = await api.post("/dashboard-suprimentos/pedidos-compra", { ids: ids || [] });
    return data || {};
}

export async function dashboardExpedicao() {
    const { data } = await api.get("/dashboard-expedicao");
    return data || {};
}
