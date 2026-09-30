import api from "./api";

export async function buscarParametrosFinanceiro() {
    const { data } = await api.get("/financeiro-parametros");
    return {
        multaPercentual: Number(data?.multaPercentual ?? 2),
        jurosMesPercentual: Number(data?.jurosMesPercentual ?? 1),
        carenciaDias: Number(data?.carenciaDias || 0)
    };
}

export async function salvarParametrosFinanceiro(parametros) {
    const { data } = await api.put("/financeiro-parametros", parametros);
    return data;
}
