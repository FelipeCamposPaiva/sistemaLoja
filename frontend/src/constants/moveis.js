export const MOVEIS_KEY = "erp-moveis-v1";

export const TIPOS_MOVEL = ["Prateleira", "Nicho", "Organizador", "Balcão", "Gôndola"];

export const SETORES_LOJA = ["Brinquedos", "Papelaria", "Mochilas", "Atendimento", "Geral"];

export const STATUS_MOVEL = [
    { id: "uso", label: "Em Uso", cor: "#22c55e" },
    { id: "montagem", label: "Em Montagem", cor: "#f59e0b" },
    { id: "inativo", label: "Inativo", cor: "#ef4444" }
];

export const LOJAS_MOVEL = [
    "Loja Água Limpa (AL)",
    "Loja Santo Agostinho (STG)"
];

export const ABAS_MOVEL = [
    { id: "geral", label: "Geral" },
    { id: "dimensoes", label: "Dimensões" },
    { id: "prateleiras", label: "Prateleiras" },
    { id: "divisorias", label: "Divisórias" },
    { id: "materiais", label: "Materiais" },
    { id: "imagens", label: "Imagens" },
    { id: "localizacao", label: "Localização" },
    { id: "historico", label: "Histórico" }
];

function movel(parcial) {
    return {
        loja: "Loja Água Limpa (AL)",
        status: "uso",
        setor: "Geral",
        tipo: "Prateleira",
        largura: 180,
        altura: 220,
        profundidade: 35,
        colunas: 4,
        prateleiras: 5,
        cor: "Branco TX",
        borda: "Amadeirado Clv",
        material: "MDF",
        tags: [],
        observacao: "",
        capacidadeKg: 120,
        itens: 0,
        atualizadoEm: "2026-09-15T14:32:00",
        historico: [{ quando: "2026-09-15T14:32:00", texto: "Cadastro inicial" }],
        ...parcial
    };
}

export const MOVEIS_INICIAIS = [
    movel({
        id: 1,
        nome: "Móvel 01",
        detalhe: "Prateleira Expositora",
        descricao: "Prateleira Expositora de Brinquedos e Papelaria",
        tipo: "Prateleira",
        setor: "Brinquedos",
        largura: 300,
        altura: 240,
        profundidade: 35,
        colunas: 5,
        prateleiras: 6,
        tags: ["Expositor", "Brinquedos", "Papelaria", "Parede Lateral"],
        observacao: "Móvel principal da parede lateral esquerda. Utilizado para exibição de brinquedos, mochilas e itens de papelaria.",
        foto: "/images/moveis/movel-01-hero.jpg",
        galeria: ["/images/moveis/movel-01-hero.jpg", "/images/moveis/movel-01.jpg", "/images/moveis/movel-04.jpg"],
        capacidadeKg: 180,
        itens: 124
    }),
    movel({
        id: 2,
        nome: "Móvel 02",
        detalhe: "Nicho Superior",
        descricao: "Nicho superior para exposição de bonecas e kits",
        tipo: "Nicho",
        setor: "Brinquedos",
        largura: 250,
        altura: 60,
        profundidade: 35,
        colunas: 4,
        prateleiras: 1,
        foto: "/images/moveis/movel-02.jpg",
        galeria: ["/images/moveis/movel-02.jpg"],
        itens: 18
    }),
    movel({
        id: 3,
        nome: "Móvel 03",
        detalhe: "Nicho para Mochilas",
        descricao: "Nicho para mochilas e bolsas escolares",
        tipo: "Nicho",
        setor: "Mochilas",
        largura: 120,
        altura: 80,
        profundidade: 40,
        colunas: 3,
        prateleiras: 2,
        foto: "/images/moveis/movel-03.jpg",
        galeria: ["/images/moveis/movel-03.jpg"],
        itens: 9
    }),
    movel({
        id: 4,
        nome: "Móvel 04",
        detalhe: "Prateleira de Papelaria",
        descricao: "Prateleira de papelaria na parede da loja",
        tipo: "Prateleira",
        setor: "Papelaria",
        largura: 180,
        altura: 220,
        profundidade: 35,
        colunas: 4,
        prateleiras: 5,
        foto: "/images/moveis/movel-04.jpg",
        galeria: ["/images/moveis/movel-04.jpg"],
        itens: 86
    }),
    movel({
        id: 5,
        nome: "Móvel 05",
        detalhe: "Organizador de Papéis",
        descricao: "Organizador vertical de papéis e cartolinas",
        tipo: "Organizador",
        setor: "Papelaria",
        largura: 80,
        altura: 220,
        profundidade: 60,
        colunas: 1,
        prateleiras: 12,
        foto: "/images/moveis/movel-05.jpg",
        galeria: ["/images/moveis/movel-05.jpg"],
        itens: 42
    }),
    movel({
        id: 6,
        nome: "Móvel 06",
        detalhe: "Prateleira Modular",
        descricao: "Prateleira modular em montagem no depósito",
        tipo: "Prateleira",
        setor: "Geral",
        status: "montagem",
        largura: 400,
        altura: 240,
        profundidade: 40,
        colunas: 6,
        prateleiras: 6,
        foto: "/images/moveis/movel-06.jpg",
        galeria: ["/images/moveis/movel-06.jpg"],
        itens: 0,
        capacidadeKg: 200
    }),
    movel({
        id: 7,
        nome: "Móvel 07",
        detalhe: "Prateleira Lateral",
        descricao: "Prateleira lateral branca junto à alvenaria",
        tipo: "Prateleira",
        setor: "Papelaria",
        largura: 180,
        altura: 240,
        profundidade: 35,
        colunas: 3,
        prateleiras: 6,
        foto: "/images/moveis/movel-07.jpg",
        galeria: ["/images/moveis/movel-07.jpg"],
        itens: 31
    }),
    movel({
        id: 8,
        nome: "Móvel 08",
        detalhe: "Balcão de Atendimento",
        descricao: "Balcão de atendimento com tampo de vidro",
        tipo: "Balcão",
        setor: "Atendimento",
        largura: 180,
        altura: 100,
        profundidade: 60,
        colunas: 2,
        prateleiras: 2,
        foto: "/images/moveis/movel-08.jpg",
        galeria: ["/images/moveis/movel-08.jpg"],
        itens: 12,
        capacidadeKg: 80
    }),
    movel({
        id: 9,
        nome: "Móvel 09",
        detalhe: "Gôndola Central",
        descricao: "Gôndola central de ofertas",
        tipo: "Gôndola",
        setor: "Geral",
        largura: 160,
        altura: 140,
        profundidade: 80,
        colunas: 2,
        prateleiras: 4,
        foto: "/images/moveis/movel-09.jpg",
        galeria: ["/images/moveis/movel-09.jpg"],
        itens: 54
    }),
    movel({
        id: 10,
        nome: "Móvel 10",
        detalhe: "Expositor de Canecas",
        descricao: "Expositor de canecas e personalizados",
        tipo: "Nicho",
        setor: "Papelaria",
        largura: 120,
        altura: 180,
        profundidade: 35,
        foto: "/images/moveis/movel-10.jpg",
        galeria: ["/images/moveis/movel-10.jpg"],
        itens: 28
    }),
    movel({
        id: 11,
        nome: "Móvel 11",
        detalhe: "Prateleira de Fundo",
        descricao: "Prateleira de fundo da loja",
        tipo: "Prateleira",
        setor: "Brinquedos",
        largura: 220,
        altura: 240,
        profundidade: 35,
        foto: "/images/moveis/movel-11.jpg",
        galeria: ["/images/moveis/movel-11.jpg"],
        itens: 47
    }),
    movel({
        id: 12,
        nome: "Móvel 12",
        detalhe: "Balcão Caixa",
        descricao: "Balcão auxiliar do caixa",
        tipo: "Balcão",
        setor: "Atendimento",
        largura: 140,
        altura: 100,
        profundidade: 55,
        foto: "/images/moveis/movel-12.jpg",
        galeria: ["/images/moveis/movel-12.jpg"],
        itens: 6,
        capacidadeKg: 70
    })
];

export function movelVazio() {
    return movel({
        id: null,
        nome: "",
        detalhe: "",
        descricao: "",
        foto: "",
        galeria: []
    });
}

export function lerMoveis() {
    try {
        const bruto = localStorage.getItem(MOVEIS_KEY);
        if (bruto) {
            const lista = JSON.parse(bruto);
            if (Array.isArray(lista) && lista.length) {
                return lista;
            }
        }
    } catch {
        /* ignore */
    }
    return MOVEIS_INICIAIS.map((m) => ({ ...m, tags: [...(m.tags || [])], galeria: [...(m.galeria || [])] }));
}

export function gravarMoveis(lista) {
    localStorage.setItem(MOVEIS_KEY, JSON.stringify(lista));
}

export function proximoIdMovel(lista) {
    return lista.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

export function rotuloStatusMovel(id) {
    return STATUS_MOVEL.find((s) => s.id === id)?.label || id;
}

export function totalPrateleiras(m) {
    return Number(m.colunas || 0) * Number(m.prateleiras || 0);
}

export function upsertMovel(lista, dados) {
    const agora = new Date().toISOString();
    if (dados.id) {
        const nova = lista.map((item) => {
            if (String(item.id) !== String(dados.id)) {
                return item;
            }
            return {
                ...item,
                ...dados,
                atualizadoEm: agora,
                historico: [...(item.historico || []), { quando: agora, texto: "Cadastro atualizado" }]
            };
        });
        gravarMoveis(nova);
        return { lista: nova, item: nova.find((m) => String(m.id) === String(dados.id)) };
    }
    const id = proximoIdMovel(lista);
    const item = {
        ...dados,
        id,
        nome: dados.nome || `Móvel ${String(id).padStart(2, "0")}`,
        atualizadoEm: agora,
        historico: [{ quando: agora, texto: "Cadastro inicial" }]
    };
    const nova = [...lista, item];
    gravarMoveis(nova);
    return { lista: nova, item };
}

export function removerMovel(lista, id) {
    const nova = lista.filter((item) => String(item.id) !== String(id));
    gravarMoveis(nova);
    return nova;
}

export function duplicarMovel(lista, origem) {
    const id = proximoIdMovel(lista);
    const agora = new Date().toISOString();
    const item = {
        ...origem,
        id,
        nome: `${origem.nome} (cópia)`,
        atualizadoEm: agora,
        historico: [{ quando: agora, texto: `Duplicado de ${origem.nome}` }]
    };
    const nova = [...lista, item];
    gravarMoveis(nova);
    return { lista: nova, item };
}
