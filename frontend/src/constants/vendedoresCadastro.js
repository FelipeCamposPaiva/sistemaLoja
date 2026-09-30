import { listarFuncionarios } from "./rh";

export const VENDEDORES_KEY = "erp-vendedores-v1";

const EMAIL_EMPRESA = "temdetudovr.com.br";

function slugEmail(nome) {
    const partes = String(nome || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
    if (!partes.length) {
        return `vendedor@${EMAIL_EMPRESA}`;
    }
    return `${partes[0]}.${partes[partes.length - 1]}@${EMAIL_EMPRESA}`;
}

function statusDeRh(situacao) {
    if (situacao === "desligado") {
        return "excluido";
    }
    if (situacao === "experiencia") {
        return "pendente";
    }
    return "ativo";
}

function doRh(nome) {
    const ficha = listarFuncionarios().find((f) => String(f.nome).toUpperCase() === String(nome).toUpperCase());
    if (!ficha) {
        return {};
    }
    return {
        funcId: ficha.id,
        telefone: ficha.celular || "",
        email: ficha.email || slugEmail(ficha.nome),
        cidade: ficha.cidade || "Volta Redonda",
        uf: ficha.uf || "RJ",
        cargo: ficha.cargo || "Vendedor",
        status: statusDeRh(ficha.situacao)
    };
}

const BASE = [
    { codigo: "V-001", nome: "MARIA ANTONIA DOS SANTOS ZORGDRAGER", telefone: "(24) 98852-1146", status: "ativo" },
    { codigo: "V-002", nome: "GABRIEL IVAN CAMPOS DIAS", telefone: "(24) 98123-4455", status: "ativo" },
    { codigo: "V-003", nome: "AILEMA CAMARGO REIS", telefone: "(24) 99588-7766", status: "inativo" },
    { codigo: "V-004", nome: "ADELINE CAMPOS SILVA", telefone: "(24) 98877-3322", status: "ativo" },
    { codigo: "V-005", nome: "ARTHUR BRITO DE JESUS", telefone: "(24) 99776-8899", status: "ativo" },
    { codigo: "V-006", nome: "NADIA CRISTINA LOPES DO CARMO CORDEIRO", telefone: "(24) 99122-5566", status: "ativo" },
    { codigo: "V-007", nome: "FELIPE CAMPOS PAIVA", telefone: "(24) 98111-2233", status: "pendente" },
    { codigo: "V-008", nome: "PAMELLA CHRISTINA DE OLIVEIRA RESENDE", telefone: "(24) 98000-3344", status: "inativo" },
    { codigo: "V-009", nome: "LEONAM RAFAEL DE FREITAS BEZERRA", telefone: "(24) 98833-6655", status: "inativo" },
    { codigo: "V-010", nome: "ELEN LACERDA CLARO", telefone: "(24) 99711-9988", status: "ativo" }
];

export const CORES_AVATAR = ["#ec4899", "#8b5cf6", "#a78bfa", "#f97316", "#f43f5e", "#db2777", "#14b8a6", "#f472b6", "#eab308", "#2dd4bf"];

export function corAvatar(nome, indice = 0) {
    const soma = [...String(nome || "")].reduce((s, ch) => s + ch.charCodeAt(0), 0);
    return CORES_AVATAR[(soma + indice) % CORES_AVATAR.length];
}

export function inicialDe(nome) {
    const letra = String(nome || "?").replace(/[^A-Za-zÀ-ÿ]/g, "")[0];
    return (letra || "?").toUpperCase();
}

export function rotuloStatus(status) {
    if (status === "inativo") {
        return "Inativo";
    }
    if (status === "pendente") {
        return "Pendente";
    }
    if (status === "excluido") {
        return "Excluído";
    }
    return "Ativo";
}

export function vendedoresSemente() {
    return BASE.map((item, i) => {
        const rh = doRh(item.nome);
        return {
            id: i + 1,
            codigo: item.codigo,
            nome: item.nome,
            email: rh.email || slugEmail(item.nome),
            telefone: rh.telefone || item.telefone,
            cidade: rh.cidade || "Volta Redonda",
            uf: rh.uf || "RJ",
            cargo: rh.cargo || "Vendedor",
            comissao: 5,
            status: item.status,
            excluido: false,
            funcId: rh.funcId || null,
            ativo: item.status === "ativo",
            criadoEm: new Date().toISOString()
        };
    });
}

export function listarVendedoresCadastro() {
    try {
        const bruto = JSON.parse(localStorage.getItem(VENDEDORES_KEY) || "null");
        if (Array.isArray(bruto) && bruto.length) {
            return bruto;
        }
    } catch {
        /* seed */
    }
    const seed = vendedoresSemente();
    gravarVendedoresCadastro(seed);
    return seed;
}

export function gravarVendedoresCadastro(lista) {
    localStorage.setItem(VENDEDORES_KEY, JSON.stringify(lista));
    return lista;
}

export function salvarVendedorCadastro(vendedor) {
    const lista = listarVendedoresCadastro();
    const id = vendedor.id || Date.now();
    const item = {
        ...vendedor,
        id,
        codigo: vendedor.codigo || codigoNovo(lista),
        email: vendedor.email || slugEmail(vendedor.nome),
        cidade: vendedor.cidade || "Volta Redonda",
        uf: vendedor.uf || "RJ",
        status: vendedor.status || (vendedor.ativo === false ? "inativo" : "ativo"),
        excluido: Boolean(vendedor.excluido),
        atualizadoEm: new Date().toISOString(),
        criadoEm: vendedor.criadoEm || new Date().toISOString()
    };
    const idx = lista.findIndex((v) => String(v.id) === String(id));
    const proxima = idx >= 0
        ? lista.map((v, i) => (i === idx ? { ...v, ...item } : v))
        : [item, ...lista];
    gravarVendedoresCadastro(proxima);
    return item;
}

export function excluirVendedorCadastro(id) {
    const lista = listarVendedoresCadastro().map((v) => (
        String(v.id) === String(id)
            ? { ...v, excluido: true, status: "excluido", atualizadoEm: new Date().toISOString() }
            : v
    ));
    gravarVendedoresCadastro(lista);
}

export function restaurarVendedorCadastro(id) {
    const lista = listarVendedoresCadastro().map((v) => (
        String(v.id) === String(id)
            ? { ...v, excluido: false, status: "inativo", atualizadoEm: new Date().toISOString() }
            : v
    ));
    gravarVendedoresCadastro(lista);
}

function codigoNovo(lista) {
    const nums = lista.map((v) => Number(String(v.codigo || "").replace(/\D/g, "")) || 0);
    const proximo = Math.max(0, ...nums) + 1;
    return `V-${String(proximo).padStart(3, "0")}`;
}
