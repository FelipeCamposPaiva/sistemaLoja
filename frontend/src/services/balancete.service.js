import api from "./api";

function num(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
}

export async function buscarBalancete(ano, mes, regime = "competencia") {
    const { data } = await api.get("/balancete", { params: { ano, mes, regime } });
    return {
        ano: num(data?.ano),
        mes: num(data?.mes),
        competencia: data?.competencia || "",
        regime: data?.regime || "competencia",
        receitas: Array.isArray(data?.receitas) ? data.receitas : [],
        despesas: Array.isArray(data?.despesas) ? data.despesas : [],
        dre: Array.isArray(data?.dre) ? data.dre : [],
        totalDebito: num(data?.totalDebito),
        totalCredito: num(data?.totalCredito),
        resultado: num(data?.resultado),
        lancamentos: num(data?.lancamentos)
    };
}

export async function listarCategoriasFinanceiras() {
    const { data } = await api.get("/balancete/categorias");
    return Array.isArray(data) ? data : [];
}
