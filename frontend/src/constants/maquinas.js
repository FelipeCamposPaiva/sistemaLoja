export const MAQUINAS_KEY = "erp-maquinas-v1";

export const GRUPOS_TIPO = [
    {
        grupo: "Impressão",
        itens: ["Impressora", "Impressora fotográfica", "Plotter", "Impressora 3D", "Impressora 3D FDM"]
    },
    {
        grupo: "Peças e suprimentos",
        itens: ["Peça de impressora", "Cabeça de impressão", "Sistema de tinta", "Cartucho / tanque", "Placa ou fonte", "Outra peça"]
    },
    {
        grupo: "Acabamento",
        itens: ["Laser", "Prensa", "Corte", "Plastificadora", "Encadernadora", "Dobradeira", "Laminadora"]
    },
    {
        grupo: "Apoio",
        itens: ["Scanner", "Computador / RIP", "Outro"]
    }
];

export const TIPOS_MAQUINA = GRUPOS_TIPO.flatMap((grupo) => grupo.itens);

export function perfilTipo(tipo) {
    const nome = String(tipo || "");
    if (/3d/i.test(nome) && /fdm|filamento/i.test(nome)) {
        return { consumo: true, peca: false, energia: true, unidade: "g", rotulo: "filamento", titulo: "Consumo de filamento" };
    }
    if (/3d/i.test(nome)) {
        return { consumo: true, peca: false, energia: true, unidade: "kg", rotulo: "resina", titulo: "Consumo de material (resina)" };
    }
    if (/^(impressora|plotter)/i.test(nome) || nome === "Sistema de tinta" || nome === "Cartucho / tanque") {
        return { consumo: true, peca: false, energia: true, unidade: "ml", rotulo: "tinta", titulo: "Consumo de tinta" };
    }
    if (/peça|peca|cabeça|cabeca|placa|outra peça/i.test(nome)) {
        return { consumo: false, peca: true, energia: false, unidade: "un", rotulo: "peça", titulo: "Peça de equipamento" };
    }
    return { consumo: false, peca: false, energia: true, unidade: "un", rotulo: "material", titulo: "Consumo" };
}

export const STATUS_MAQUINA = [
    { id: "operacao", label: "Em Operação" },
    { id: "manutencao", label: "Em Manutenção" },
    { id: "inativa", label: "Inativa" }
];

export const LOCAIS_MAQUINA = [
    "Produção (AL)",
    "Produção (STG)"
];

export const MAQUINAS_INICIAIS = [
    {
        id: 1,
        nome: "Epson WorkForce 5710",
        detalhe: "Impressora Jato de Tinta",
        tipo: "Impressora",
        modelo: "WorkForce 5710",
        marca: "Epson",
        localizacao: "Produção (AL)",
        status: "operacao",
        proxManutencao: "2026-10-15",
        horasUso: 1250
    },
    {
        id: 2,
        nome: "Epson L3150",
        detalhe: "Impressora Multifuncional",
        tipo: "Impressora",
        modelo: "L3150",
        marca: "Epson",
        localizacao: "Produção (STG)",
        status: "operacao",
        proxManutencao: "2026-10-20",
        horasUso: 980
    },
    {
        id: 3,
        nome: "Epson L1800",
        detalhe: "Impressora Fotográfica",
        tipo: "Impressora",
        modelo: "L1800",
        marca: "Epson",
        localizacao: "Produção (AL)",
        status: "operacao",
        proxManutencao: "2026-10-18",
        horasUso: 1430
    },
    {
        id: 4,
        nome: "Plotter T3150",
        detalhe: "Plotter de Impressão",
        tipo: "Plotter",
        modelo: "T3150",
        marca: "Epson",
        localizacao: "Produção (AL)",
        status: "operacao",
        proxManutencao: "2026-10-25",
        horasUso: 2100
    },
    {
        id: 5,
        nome: "Creality MAGE S 14K",
        detalhe: "Impressora 3D",
        tipo: "Impressora 3D",
        modelo: "MAGE S 14K",
        marca: "Creality",
        localizacao: "Produção (STG)",
        status: "manutencao",
        proxManutencao: "2026-10-05",
        horasUso: 780
    },
    {
        id: 6,
        nome: "Sonic Touch 33W",
        detalhe: "Máquina a Laser",
        tipo: "Laser",
        modelo: "ScoopFan2033OA",
        marca: "Sonic",
        localizacao: "Produção (STG)",
        status: "operacao",
        proxManutencao: "2026-10-22",
        horasUso: 1560
    },
    {
        id: 7,
        nome: "Prensa Térmica",
        detalhe: "Prensa para Sublimação",
        tipo: "Prensa",
        modelo: "38x38",
        marca: "Genérica",
        localizacao: "Produção (AL)",
        status: "operacao",
        proxManutencao: "2026-10-10",
        horasUso: 620
    },
    {
        id: 8,
        nome: "Guilhotina",
        detalhe: "Corte de Papel",
        tipo: "Corte",
        modelo: "Guilhotina 45cm",
        marca: "Excentrix",
        localizacao: "Produção (AL)",
        status: "inativa",
        proxManutencao: "",
        horasUso: 31
    }
];

export function rotuloStatus(id) {
    return STATUS_MAQUINA.find((s) => s.id === id)?.label || "Em Operação";
}

export function lerMaquinas() {
    try {
        const bruto = JSON.parse(localStorage.getItem(MAQUINAS_KEY) || "null");
        if (Array.isArray(bruto) && bruto.length) {
            return bruto;
        }
    } catch {
        /* ignore */
    }
    return MAQUINAS_INICIAIS.map((m) => ({ ...m }));
}

export function gravarMaquinas(lista) {
    localStorage.setItem(MAQUINAS_KEY, JSON.stringify(lista));
    return lista;
}

export function upsertMaquina(lista, maquina) {
    const id = maquina.id || Math.max(0, ...lista.map((m) => Number(m.id) || 0)) + 1;
    const item = { ...maquina, id, horasUso: Number(maquina.horasUso || 0) };
    const idx = lista.findIndex((m) => String(m.id) === String(id));
    const nova = idx >= 0
        ? lista.map((m, i) => (i === idx ? { ...m, ...item } : m))
        : [item, ...lista];
    return { lista: gravarMaquinas(nova), item };
}

export function removerMaquina(lista, id) {
    return gravarMaquinas(lista.filter((m) => String(m.id) !== String(id)));
}
