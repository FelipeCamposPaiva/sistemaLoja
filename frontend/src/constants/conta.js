export const CONTA_KEY = "erp-minha-conta-v2";
export const CONTA_KEY_ANTIGA = "erp-minha-conta-v1";
export const CONTA_PREFS_EVT = "erp-conta-prefs";

export const CORES_SISTEMA = [
    { id: "rosa", hex: "#ff2f92" },
    { id: "azul", hex: "#38bdf8" },
    { id: "verde", hex: "#22c55e" },
    { id: "amarelo", hex: "#f59e0b" }
];

export const CARGOS_CONTA = [
    "ADMIN",
    "GERENTE",
    "FUNCIONARIO",
    "Operador de Produção",
    "Vendedor"
];

export const EMPRESA_CONTA = {
    razao: "Tem de Tudo Papelaria, Presentes e Personalizados LTDA",
    cnpj: "40.424.076/0001-69",
    endereco: "Av. Visconde do Rio Branco, 392 — Água Limpa",
    cidade: "Volta Redonda - RJ",
    cep: "27250-250",
    telefone: "(24) 3343-1575",
    email: "contato@temdetudovr.com.br",
    loja: "Volta Redonda - RJ",
    filiais: 3
};

export function corDe(id) {
    return CORES_SISTEMA.find((c) => c.id === id)?.hex || CORES_SISTEMA[0].hex;
}

export function dispositivoAtual() {
    const ua = navigator.userAgent || "";
    const os = /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "macOS" : /Android/i.test(ua) ? "Android" : /Linux/i.test(ua) ? "Linux" : "Sistema";
    const br = /Edg/i.test(ua) ? "Edge" : /Chrome/i.test(ua) && !/Edg/i.test(ua) ? "Chrome" : /Firefox/i.test(ua) ? "Firefox" : /Safari/i.test(ua) ? "Safari" : "Navegador";
    return `${os} / ${br}`;
}

export function dataHoraBr(valor) {
    const d = valor instanceof Date ? valor : new Date(valor || Date.now());
    if (Number.isNaN(d.getTime())) {
        return { data: "—", hora: "" };
    }
    return {
        data: d.toLocaleDateString("pt-BR"),
        hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
}

function padrao(usuario) {
    return {
        nome: usuario?.nome || "Administrador",
        email: usuario?.email || "admin@temdetudovr.com.br",
        telefone: "",
        empresa: "Tem de Tudo — Volta Redonda",
        cargo: usuario?.perfil || "ADMIN",
        foto: "",
        ativo: true,
        doisFatores: false,
        tema: "claro",
        cor: "rosa",
        notificacoes: true,
        menu: "expandido",
        ultimoAcesso: new Date().toISOString()
    };
}

export function lerConta(usuario) {
    const base = padrao(usuario);
    try {
        const atual = JSON.parse(localStorage.getItem(CONTA_KEY) || "null");
        const antiga = JSON.parse(localStorage.getItem(CONTA_KEY_ANTIGA) || "null");
        const bruto = atual || antiga || {};
        return {
            ...base,
            ...bruto,
            nome: bruto.nome || usuario?.nome || base.nome,
            email: bruto.email || usuario?.email || base.email,
            cargo: bruto.cargo || usuario?.perfil || base.cargo
        };
    } catch {
        return base;
    }
}

export function gravarConta(dados) {
    localStorage.setItem(CONTA_KEY, JSON.stringify(dados));
    window.dispatchEvent(new Event(CONTA_PREFS_EVT));
    return dados;
}

export function temaEscuroAtivo(tema) {
    if (tema === "escuro") {
        return true;
    }
    if (tema === "claro") {
        return false;
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches === true;
}
