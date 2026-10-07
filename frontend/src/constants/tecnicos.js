import { emPromocao, precoVigente } from "./precoPromocional";

const KEY = "erp-tecnicos-v1";

export const SETORES_OS = [
    { id: "ORCAMENTO", label: "Orçamento", status: "ORCAMENTO" },
    { id: "APROVADO", label: "Aprovado", status: "APROVADO" },
    { id: "ARTE", label: "Arte", status: "ARTE" },
    { id: "AJUSTE_ARTE", label: "Ajuste de arte", status: "AJUSTE_ARTE" },
    { id: "PRODUCAO", label: "Produção", status: "PRODUCAO" },
    { id: "ACABAMENTO", label: "Acabamento", status: "ACABAMENTO" },
    { id: "PRONTO", label: "Pronto", status: "PRONTO" },
    { id: "ENTREGUE", label: "Entregue", status: "ENTREGUE" }
];

export const FAIXAS_COMISSAO_TECNICO = [
    { id: "cheia", min: 0, max: 0.01, pct: 8, label: "Sem desconto" },
    { id: "leve", min: 0.01, max: 5, pct: 6, label: "Até 5% de desconto" },
    { id: "media", min: 5, max: 10, pct: 4, label: "5% a 10% de desconto" },
    { id: "alta", min: 10, max: 1000, pct: 2, label: "Acima de 10% de desconto" }
];

export const DESCONTO_FORMA = {
    Pix: 5,
    Dinheiro: 3,
    "Cartão de débito": 0,
    "Cartão de crédito": 0,
    Boleto: 0,
    Crediário: 0,
    Transferência: 2
};

export const FATOR_LISTA = {
    Padrão: 1,
    Atacado: 0.92,
    Promocional: 0.85
};

export const TECNICOS_INICIAIS = [
    { id: 104, nome: "GABRIEL IVAN CAMPOS DIAS", cargo: "Auxiliar designer", setor: "ARTE", ativo: true, comissaoPct: 8, celular: "" },
    { id: 501, nome: "MÁRCIO SILVA", cargo: "Técnico de produção", setor: "PRODUCAO", ativo: true, comissaoPct: 8, celular: "(24) 98811-2201" },
    { id: 502, nome: "ANA PAULA FERREIRA", cargo: "Designer gráfico", setor: "ARTE", ativo: true, comissaoPct: 8, celular: "(24) 98811-2202" },
    { id: 503, nome: "PAULA MENDES", cargo: "Acabamento", setor: "ACABAMENTO", ativo: true, comissaoPct: 7, celular: "(24) 98811-2203" },
    { id: 504, nome: "JOÃO HENRIQUE COSTA", cargo: "Técnico de instalação", setor: "PRODUCAO", ativo: true, comissaoPct: 8, celular: "(24) 98811-2204" }
];

function extraVazio() {
    return { tecnicos: [] };
}

function lerExtra() {
    try {
        const bruto = JSON.parse(localStorage.getItem(KEY) || "null");
        if (bruto && Array.isArray(bruto.tecnicos)) {
            return bruto;
        }
    } catch {
        /* ignore */
    }
    return extraVazio();
}

function gravarExtra(dados) {
    localStorage.setItem(KEY, JSON.stringify(dados));
}

export function listarTecnicos() {
    const extras = lerExtra().tecnicos;
    const mapa = new Map(TECNICOS_INICIAIS.map((t) => [String(t.id), { ...t }]));
    extras.forEach((t) => {
        if (t.excluido) {
            mapa.delete(String(t.id));
            return;
        }
        mapa.set(String(t.id), { ...(mapa.get(String(t.id)) || {}), ...t });
    });
    return [...mapa.values()].sort((a, b) => String(a.nome).localeCompare(b.nome, "pt-BR"));
}

export function tecnicosAtivos() {
    return listarTecnicos().filter((t) => t.ativo !== false);
}

export function salvarTecnico(ficha) {
    const extra = lerExtra();
    const id = ficha.id || Date.now();
    const item = {
        id,
        nome: String(ficha.nome || "").trim(),
        cargo: ficha.cargo || "Técnico",
        setor: ficha.setor || "PRODUCAO",
        ativo: ficha.ativo !== false,
        comissaoPct: Number(String(ficha.comissaoPct ?? 8).replace(",", ".")) || 0,
        celular: ficha.celular || ""
    };
    const idx = extra.tecnicos.findIndex((t) => String(t.id) === String(id));
    if (idx >= 0) {
        extra.tecnicos[idx] = item;
    } else {
        extra.tecnicos.push(item);
    }
    gravarExtra(extra);
    return item;
}

export function excluirTecnico(id) {
    const extra = lerExtra();
    const idx = extra.tecnicos.findIndex((t) => String(t.id) === String(id));
    if (idx >= 0) {
        extra.tecnicos[idx] = { ...extra.tecnicos[idx], id, excluido: true };
    } else {
        extra.tecnicos.push({ id, excluido: true });
    }
    gravarExtra(extra);
}

export function faixaComissaoPorDesconto(pctDesconto) {
    const pct = Math.max(0, Number(pctDesconto) || 0);
    return FAIXAS_COMISSAO_TECNICO.find((f) => pct >= f.min && pct < f.max) || FAIXAS_COMISSAO_TECNICO[0];
}

export function descontoDaForma(forma) {
    return Number(DESCONTO_FORMA[forma] || 0);
}

export function precoPelaLista(produto, lista) {
    if (lista === "Atacado" && Number(produto?.precoAtacado) > 0) {
        return Number(produto.precoAtacado);
    }
    if (lista !== "Atacado" && emPromocao(produto)) {
        return precoVigente(produto);
    }
    const preco = Number(produto?.preco || 0);
    const fator = FATOR_LISTA[lista] || 1;
    return Math.round(preco * fator * 100) / 100;
}

export function setorPorStatus(status) {
    const codigo = String(status || "ORCAMENTO")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");
    const mapa = {
        EM_ABERTO: "ORCAMENTO",
        ABERTA: "ORCAMENTO",
        ABERTO: "ORCAMENTO",
        EM_ANDAMENTO: "PRODUCAO",
        SERVICO_CONCLUIDO: "PRONTO",
        FINALIZADA: "ENTREGUE"
    };
    const id = mapa[codigo] || codigo;
    return SETORES_OS.find((s) => s.status === id || s.id === id) || SETORES_OS[0];
}
