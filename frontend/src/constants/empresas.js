import { EMPRESA_CONTA } from "./conta";

export const UNIDADES = [
    {
        id: "agua-limpa",
        nome: "Tem de Tudo – Água Limpa",
        cnpj: "40.424.076/0001-69",
        razao: "Tem de Tudo Papelaria, Presentes e Personalizados LTDA"
    },
    {
        id: "santo-agostinho",
        nome: "Tem de Tudo – Santo Agostinho",
        cnpj: "49.635.218/0001-01",
        razao: "49.635.218 FELIPE CAMPOS PAIVA"
    },
    {
        id: "deposito",
        nome: "Tem de Tudo – Depósito Central",
        cnpj: "",
        razao: "Unidade operacional"
    },
    {
        id: "grafica",
        nome: "Tem de Tudo – Gráfica",
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

export function unidadeAtual() {
    const cnpj = digitos(EMPRESA_CONTA.cnpj);
    return UNIDADES.find((unidade) => cnpj && digitos(unidade.cnpj) === cnpj) || UNIDADES[0];
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
