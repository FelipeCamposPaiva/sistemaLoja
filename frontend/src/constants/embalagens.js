export const EMBALAGENS_KEY = "erp-embalagens-v2";

export const TIPOS_EMBALAGEM = [
    "Pacote / Caixa",
    "Envelope",
    "Rolo / Cilindro"
];

export const FORMATOS_EMBALAGEM = [
    { id: "Envelope", nome: "Envelope" },
    { id: "Pacote / Caixa", nome: "Pacote / Caixa" },
    { id: "Rolo / Cilindro", nome: "Rolo / Cilindro" }
];

export const ORIGENS_EMBALAGEM = ["Correios", "Própria"];

export const STATUS_EMBALAGEM = [
    { id: "ativa", label: "Ativo" },
    { id: "inativa", label: "Inativa" }
];

function item(parcial) {
    return {
        tipo: "Pacote / Caixa",
        origem: "Correios",
        status: "ativa",
        peso: 0,
        comprimento: 0,
        largura: 0,
        altura: 0,
        quando: "2026-09-01T12:00:00.000Z",
        ...parcial
    };
}

export const EMBALAGENS_CORREIOS = [
    item({ id: 1, codigo: "CX-001", nome: "Caixa de Encomenda Flex", comprimento: 26, largura: 21, altura: 1, peso: 0.09 }),
    item({ id: 2, codigo: "CX-002", nome: "Caixa de Encomenda Flex", comprimento: 26, largura: 21, altura: 2, peso: 0.18 }),
    item({ id: 3, codigo: "CX-003", nome: "Caixa de Encomenda Flex", comprimento: 26, largura: 21, altura: 3, peso: 0.27 }),
    item({ id: 4, codigo: "CX-004", nome: "Caixa de Encomenda Flex", comprimento: 26, largura: 21, altura: 4, peso: 0.36 }),
    item({ id: 5, codigo: "CX-005", nome: "Caixa de Encomenda Flex", comprimento: 26, largura: 21, altura: 5, peso: 0.46 }),
    item({ id: 6, codigo: "CX-006", nome: "Caixa de Encomenda Flex", comprimento: 26, largura: 21, altura: 6, peso: 0.55 }),
    item({ id: 7, codigo: "CE-01", nome: "Caixa de Encomenda CE - 01", comprimento: 18, largura: 13.5, altura: 9, peso: 0.36 }),
    item({ id: 8, codigo: "CE-02", nome: "Caixa de Encomenda CE - 02", comprimento: 27, largura: 18, altura: 9, peso: 0.73 }),
    item({ id: 9, codigo: "CE-03", nome: "Caixa de Encomenda CE - 03", comprimento: 27, largura: 22.5, altura: 13.5, peso: 1.37 }),
    item({ id: 10, codigo: "CE-07", nome: "Caixa de Encomenda CE - 07", comprimento: 36, largura: 28, altura: 4, peso: 0.67 }),
    item({ id: 11, codigo: "5B", nome: "Caixa de Encomenda 5B", comprimento: 54, largura: 36, altura: 27, peso: 8.75 }),
    item({ id: 12, codigo: "6B", nome: "Caixa de Encomenda 6B", comprimento: 27, largura: 27, altura: 36, peso: 4.37 }),
    item({ id: 13, codigo: "VV-01", nome: "Caixa de Encomenda Vai e Vem", comprimento: 18, largura: 13.5, altura: 9, peso: 0.36 }),
    item({ id: 14, codigo: "B", nome: "Caixa de Encomenda B", comprimento: 16, largura: 11, altura: 6, peso: 0.18 }),
    item({ id: 15, codigo: "2B", nome: "Caixa de Encomenda 2B", comprimento: 27, largura: 18, altura: 9, peso: 0.73 }),
    item({ id: 16, codigo: "4B", nome: "Caixa de Encomenda 4B", comprimento: 27, largura: 27, altura: 18, peso: 2.19 }),
    item({ id: 17, codigo: "TEM-01", nome: "Caixa de Encomenda Temática 01", comprimento: 18, largura: 13.5, altura: 9, peso: 0.36 }),
    item({ id: 18, codigo: "TEM-02", nome: "Caixa de Encomenda Temática 02", comprimento: 27, largura: 18, altura: 9, peso: 0.73 }),
    item({ id: 19, codigo: "TEM-03", nome: "Caixa de Encomenda Temática 03", comprimento: 27, largura: 22.5, altura: 13.5, peso: 1.37 }),
    item({ id: 20, codigo: "ENV-001", nome: "Envelope Básico RPC (Papel)", tipo: "Envelope", comprimento: 16.2, largura: 11.4, peso: 0.03 }),
    item({ id: 21, codigo: "ENV-002", nome: "Envelope Básico Médio (Plástico)", tipo: "Envelope", comprimento: 35.3, largura: 25, peso: 0.15 }),
    item({ id: 22, codigo: "ENV-003", nome: "Envelope Básico Grande (Plástico)", tipo: "Envelope", comprimento: 40, largura: 28, peso: 0.19 }),
    item({ id: 23, codigo: "ENV-004", nome: "Envelope Convencional Médio (Plástico)", tipo: "Envelope", comprimento: 35.3, largura: 25, peso: 0.15 }),
    item({ id: 24, codigo: "ENV-005", nome: "Envelope Convencional Grande (Plástico)", tipo: "Envelope", comprimento: 40, largura: 28, peso: 0.19 }),
    item({ id: 25, codigo: "ENV-006", nome: "Envelope Convencional CD (Plástico)", tipo: "Envelope", comprimento: 21, largura: 18, peso: 0.06 }),
    item({ id: 26, codigo: "ENV-007", nome: "Envelope Convencional DVD (Plástico)", tipo: "Envelope", comprimento: 21, largura: 18, peso: 0.06 }),
    item({ id: 27, codigo: "ENV-008", nome: "Envelope Convencional Tipo Saco II (Papel)", tipo: "Envelope", comprimento: 25, largura: 35.3, peso: 0.15 }),
    item({ id: 28, codigo: "ENV-009", nome: "Envelope Temático Tipo Saco I (Papel)", tipo: "Envelope", comprimento: 16, largura: 23, peso: 0.06 }),
    item({ id: 29, codigo: "ENV-010", nome: "Envelope Temático Tipo Saco II (Papel)", tipo: "Envelope", comprimento: 25, largura: 35.3, peso: 0.15 }),
    item({ id: 30, codigo: "ENV-011", nome: "Envelope Temático Ofício (Papel)", tipo: "Envelope", comprimento: 22.9, largura: 11.4, peso: 0.04 }),
    item({ id: 31, codigo: "ENV-012", nome: "Envelope Temático Médio (Cartão)", tipo: "Envelope", comprimento: 35.3, largura: 25, peso: 0.15 }),
    item({ id: 32, codigo: "ENV-013", nome: "Envelope Temático Grande (Cartão)", tipo: "Envelope", comprimento: 40, largura: 28, peso: 0.19 }),
    item({ id: 33, codigo: "ENV-014", nome: "Envelope Tipo Saco I", tipo: "Envelope", comprimento: 16, largura: 23, peso: 0.06 }),
    item({ id: 34, codigo: "ENV-015", nome: "Envelope Tipo Saco II", tipo: "Envelope", comprimento: 25, largura: 35.3, peso: 0.15 }),
    item({ id: 35, codigo: "ENV-016", nome: "Envelope Ofício", tipo: "Envelope", comprimento: 22.9, largura: 11.4, peso: 0.04 }),
    item({ id: 36, codigo: "ENV-017", nome: "Envelope Cartonado Médio", tipo: "Envelope", comprimento: 35.3, largura: 25, peso: 0.15 }),
    item({ id: 37, codigo: "ENV-018", nome: "Envelope Cartonado Grande", tipo: "Envelope", comprimento: 40, largura: 28, peso: 0.19 })
];

export const EMBALAGENS_INICIAIS = EMBALAGENS_CORREIOS.map((emb) => ({ ...emb }));

export function cmBr(valor) {
    return `${Number(valor || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} cm`;
}

export function dimensoesDe(emb) {
    const tipo = String(emb.tipo || "").toLowerCase();
    if (tipo.includes("rolo") || tipo.includes("cilindro")) {
        return `Ø ${cmBr(emb.largura)} x ${cmBr(emb.comprimento)}`;
    }
    const base = `${cmBr(emb.comprimento)} x ${cmBr(emb.largura)}`;
    if (tipo.includes("envelope") || !Number(emb.altura)) {
        return base;
    }
    return `${base} x ${cmBr(emb.altura)}`;
}

export function pesoBr(valor) {
    return `${Number(valor || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} Kg`;
}

export function rotuloStatus(status) {
    return STATUS_EMBALAGEM.find((s) => s.id === status)?.label || "Ativo";
}

export function rotuloTipoProduto(tipo) {
    if (tipo === "materia-prima") {
        return "Matéria-prima";
    }
    if (tipo === "simples") {
        return "Simples";
    }
    return tipo || "";
}

export function textoVinculo(emb) {
    if (!emb?.produtoId && !emb?.produtoSku && !emb?.produtoNome) {
        return "";
    }
    const tipo = rotuloTipoProduto(emb.produtoTipo);
    const sku = String(emb.produtoSku || "").trim();
    const nome = String(emb.produtoNome || "").trim();
    return [sku, nome, tipo].filter(Boolean).join(" · ");
}

export function chaveEmbalagem(emb) {
    return [
        String(emb.nome || "").trim().toLowerCase(),
        Number(emb.comprimento || 0),
        Number(emb.largura || 0),
        Number(emb.altura || 0)
    ].join("|");
}

export function lerEmbalagens() {
    try {
        const bruto = JSON.parse(localStorage.getItem(EMBALAGENS_KEY) || "null");
        if (Array.isArray(bruto) && bruto.length) {
            return bruto;
        }
    } catch {
        /* ignore */
    }
    return EMBALAGENS_INICIAIS.map((emb) => ({ ...emb }));
}

export function gravarEmbalagens(lista) {
    localStorage.setItem(EMBALAGENS_KEY, JSON.stringify(lista));
    return lista;
}

export function upsertEmbalagem(lista, embalagem) {
    const id = embalagem.id || Math.max(0, ...lista.map((emb) => Number(emb.id) || 0)) + 1;
    const itemNovo = {
        ...embalagem,
        id,
        codigo: String(embalagem.codigo || `EMB-${String(id).padStart(3, "0")}`).trim(),
        comprimento: Number(embalagem.comprimento || 0),
        largura: Number(embalagem.largura || 0),
        altura: Number(embalagem.altura || 0),
        peso: Number(embalagem.peso || 0),
        quando: embalagem.quando || new Date().toISOString()
    };
    const idx = lista.findIndex((atual) => String(atual.id) === String(id));
    const nova = idx >= 0
        ? lista.map((atual, i) => (i === idx ? { ...atual, ...itemNovo } : atual))
        : [itemNovo, ...lista];
    return { lista: gravarEmbalagens(nova), item: itemNovo };
}

export function removerEmbalagem(lista, id) {
    return gravarEmbalagens(lista.filter((emb) => String(emb.id) !== String(id)));
}

export function importarEmbalagensCorreios(lista) {
    const existentes = new Set(lista.map(chaveEmbalagem));
    const proximo = Math.max(0, ...lista.map((emb) => Number(emb.id) || 0)) + 1;
    const novas = EMBALAGENS_CORREIOS
        .filter((emb) => !existentes.has(chaveEmbalagem(emb)))
        .map((emb, i) => ({
            ...emb,
            id: proximo + i,
            quando: new Date().toISOString()
        }));
    if (!novas.length) {
        return { lista, incluidas: 0 };
    }
    return { lista: gravarEmbalagens([...lista, ...novas]), incluidas: novas.length };
}
