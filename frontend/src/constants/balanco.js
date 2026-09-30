export const TIPOS_BEM = [
    { id: "EQUIPAMENTO", label: "Equipamento" },
    { id: "FERRAMENTA", label: "Ferramenta" },
    { id: "MOVEL", label: "Móvel" },
    { id: "OUTRO", label: "Outro" }
];

export const MESES_BALANCO = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function moedaBalanco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function rotuloTipoBem(tipo) {
    return TIPOS_BEM.find((item) => item.id === String(tipo || "").toUpperCase())?.label || tipo || "—";
}

export function variacaoPct(atual, anterior) {
    const a = Number(atual || 0);
    const b = Number(anterior || 0);
    if (b === 0) {
        return a === 0 ? 0 : 100;
    }
    return Math.round(((a - b) / Math.abs(b)) * 1000) / 10;
}
