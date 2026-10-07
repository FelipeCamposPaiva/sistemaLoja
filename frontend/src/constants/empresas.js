import { EMPRESA_CONTA } from "./conta";

export const UNIDADE_KEY = "erp-unidade-atual";
export const UNIDADE_EVT = "erp-unidade-atual";
export const UNIDADE_PRINCIPAL = "agua-limpa";

export const UNIDADES = [
    {
        id: "agua-limpa",
        sigla: "AL",
        nome: "Tem de Tudo — Água Limpa",
        cnpj: "40.424.076/0001-69",
        razao: "Tem de Tudo Papelaria, Presentes e Personalizados LTDA"
    },
    {
        id: "santo-agostinho",
        sigla: "STG",
        nome: "Tem de Tudo — Santo Agostinho",
        cnpj: "49.635.218/0001-01",
        razao: "49.635.218 FELIPE CAMPOS PAIVA"
    },
    {
        id: "grafica",
        sigla: "Gráfica",
        nome: "Tem de Tudo — Gráfica",
        cnpj: "",
        razao: "Unidade operacional"
    },
    {
        id: "deposito",
        sigla: "Depósito Geral",
        nome: "Tem de Tudo — Depósito Geral",
        cnpj: "",
        razao: "Unidade operacional"
    }
];

const LEGADO = {
    matriz: "agua-limpa"
};

function digitos(valor) {
    return String(valor || "").replace(/\D/g, "");
}

export function empresasDaConta() {
    return UNIDADES;
}

export function unidadePronta(id = unidadeAtual().id) {
    return id === UNIDADE_PRINCIPAL;
}

export function unidadeAtual() {
    try {
        const id = localStorage.getItem(UNIDADE_KEY);
        const salva = UNIDADES.find((unidade) => unidade.id === id);
        if (salva) {
            return salva;
        }
    } catch {
        /* ignore */
    }
    const cnpj = digitos(EMPRESA_CONTA.cnpj);
    return UNIDADES.find((unidade) => cnpj && digitos(unidade.cnpj) === cnpj) || UNIDADES[0];
}

export function definirUnidade(id) {
    const unidade = UNIDADES.find((item) => item.id === id);
    if (!unidade) {
        return null;
    }
    try {
        localStorage.setItem(UNIDADE_KEY, unidade.id);
    } catch {
        /* ignore */
    }
    window.dispatchEvent(new Event(UNIDADE_EVT));
    return unidade;
}

export function unidadesDestino() {
    const atual = unidadeAtual().id;
    return UNIDADES.filter((unidade) => unidade.id !== atual);
}

export function normalizarUnidade(id) {
    if (UNIDADES.some((unidade) => unidade.id === id)) {
        return id;
    }
    return LEGADO[id] || null;
}

export function normalizarEmpresas(ids, { incluirAtual = false } = {}) {
    const vistos = new Set();
    (ids || []).forEach((id) => {
        const unidade = normalizarUnidade(id);
        if (unidade) {
            vistos.add(unidade);
        }
    });
    if (incluirAtual || !vistos.size) {
        vistos.add(unidadeAtual().id);
    }
    return [...vistos];
}
