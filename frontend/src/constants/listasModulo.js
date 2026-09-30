function item(codigo, nome, status = "Ativo") {
    return { codigo, nome, status, quando: "2026-08-20T12:00:00.000Z" };
}

const EXTRAS = {
    "/produtos": {
        incluir: "Incluir produto",
        empty: "Nenhum produto cadastrado. Inclua o primeiro item do catálogo.",
        seed: [
            item("001", "Caderno 96 folhas"),
            item("002", "Caneta esferográfica azul"),
            item("003", "Papel A4 500 folhas"),
            item("004", "Envelope branco carta")
        ]
    },
    "/estoque": {
        incluir: "Incluir movimentação",
        empty: "Nenhuma movimentação de estoque.",
        seed: [
            item("001", "Entrada — Caderno 96 folhas"),
            item("002", "Saída PDV — Caneta azul")
        ]
    },
    "/vendas": {
        incluir: "Incluir pedido",
        empty: "Nenhum pedido de venda.",
        seed: [
            item("PV-332", "Pedido loja centro", "Aprovado"),
            item("PV-331", "Pedido balcão", "Faturado")
        ]
    },
    "/contas-pagar": {
        incluir: "Incluir conta",
        empty: "Nenhuma conta a pagar.",
        seed: [
            item("CP-88", "Energia — Enel", "Em aberto"),
            item("CP-87", "Aluguel loja", "Pago")
        ]
    },
    "/contas-receber": {
        incluir: "Incluir conta",
        empty: "Nenhuma conta a receber.",
        seed: [
            item("CR-12", "Pedido PV-332", "Em aberto"),
            item("CR-11", "Venda PDV 02/09", "Recebido")
        ]
    },
    "/ordem_servicos": {
        incluir: "Nova OS",
        empty: "Nenhuma ordem de serviço.",
        seed: [
            item("OS-441", "Banner 2x1 — gráfica", "Produção"),
            item("OS-440", "Cartão de visita", "Concluída")
        ]
    },
    "/orcamentos": {
        incluir: "Incluir orçamento",
        empty: "Nenhum orçamento.",
        seed: [item("ORC-90", "Kit escolar 40 unidades", "Aberto")]
    },
    "/inventario": {
        incluir: "Incluir inventário",
        empty: "Nenhum inventário em andamento."
    },
    "/produto_categorias": {
        incluir: "Incluir categoria",
        seed: [
            item("CAT-1", "Papelaria"),
            item("CAT-2", "Personalizados"),
            item("CAT-3", "Presentes"),
            item("CAT-4", "Artesanato"),
            item("CAT-5", "Brinquedo"),
            item("CAT-6", "Natal"),
            item("CAT-7", "Eletrônico"),
            item("CAT-8", "Utilidades")
        ]
    },
    "/marcas": {
        incluir: "Incluir marca",
        seed: [item("M-1", "Tilibra"), item("M-2", "BIC")]
    },
    "/vendedores": {
        incluir: "Incluir vendedor",
        seed: [item("V-1", "Felipe Campos"), item("V-2", "Gabriela Souza")]
    }
};

export function configLista(pathname, titulo) {
    const extra = EXTRAS[pathname] || {};
    return {
        titulo,
        incluir: extra.incluir || "Incluir registro",
        empty: extra.empty || `Nenhum registro em ${titulo}. Clique em ${extra.incluir || "Incluir registro"} para começar.`,
        key: `erp-lista${pathname.replace(/\W+/g, "-")}-v1`,
        seed: (extra.seed || []).map((s, i) => ({ id: i + 1, ...s }))
    };
}
