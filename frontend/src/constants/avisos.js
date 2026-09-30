const AVISOS_KEY = "erp-avisos-lidos";

export const AVISOS = [
    {
        id: "nfe-xml",
        titulo: "XMLs de terceiros na SEFAZ",
        texto: "Há notas emitidas contra o CNPJ da loja prontas para manifestar.",
        quando: "há 12 min",
        rota: "/notas_entrada#list",
    },
    {
        id: "pdv-caixa",
        titulo: "Caixa do PDV",
        texto: "Abra o caixa para registrar as vendas do dia na loja.",
        quando: "há 1 h",
        rota: "/pdv"
    },
    {
        id: "rh-ponto",
        titulo: "Espelho de ponto",
        texto: "Confira os registros da equipe antes de fechar a folha.",
        quando: "ontem",
        rota: "/ponto/espelho"
    },
    {
        id: "novidades",
        titulo: "Novidades da versão",
        texto: "Notas de entrada, integrações e PDV foram atualizados.",
        quando: "há 2 dias",
        rota: "/detalhes_versao"
    }
];

export function lerAvisosLidos() {
    try {
        const bruto = localStorage.getItem(AVISOS_KEY);
        const lista = bruto ? JSON.parse(bruto) : [];
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

export function gravarAvisosLidos(ids) {
    localStorage.setItem(AVISOS_KEY, JSON.stringify(ids));
}
