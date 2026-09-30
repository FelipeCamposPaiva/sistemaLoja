export const EMPRESA_UF = "RJ";

export const CONSUMIDOR_FINAL = {
    id: 0,
    nome: "Consumidor final",
    tipoPessoa: "fisica",
    contribuinte: "9",
    consumidorFinal: true,
    finalidade: "CONSUMO",
    uf: EMPRESA_UF
};

export const FINALIDADES = [
    { id: "CONSUMO", nome: "Consumo" },
    { id: "REVENDA", nome: "Revenda" }
];

export const REGIMES_TRIBUTARIOS = [
    { id: "", nome: "Não informado" },
    { id: "SIMPLES", nome: "Simples Nacional" },
    { id: "MEI", nome: "MEI" },
    { id: "LUCRO_PRESUMIDO", nome: "Lucro presumido" },
    { id: "LUCRO_REAL", nome: "Lucro real" },
    { id: "ISENTO", nome: "Isento" }
];

export const NATUREZAS_OPERACAO = [
    {
        codigo: "VENDA_CONSUMIDOR",
        nome: "Venda de mercadorias de terceiros para consumidor final",
        cfopInterno: "5102",
        cfopInterestadual: "6108",
        tipoDocumento: "AMBOS",
        paraContribuinte: false,
        paraNaoContribuinte: true,
        paraPessoaFisica: true,
        paraPessoaJuridica: true,
        finalidade: "CONSUMO",
        consumidorFinal: true,
        prioridade: 10
    },
    {
        codigo: "VENDA_CONTRIBUINTE",
        nome: "Venda de mercadorias de terceiros para contribuinte ICMS (revenda)",
        cfopInterno: "5102",
        cfopInterestadual: "6102",
        tipoDocumento: "NFE",
        paraContribuinte: true,
        paraNaoContribuinte: false,
        paraPessoaFisica: false,
        paraPessoaJuridica: true,
        finalidade: "REVENDA",
        consumidorFinal: false,
        prioridade: 20
    },
    {
        codigo: "VENDA_CONSUMO_PJ",
        nome: "Venda de mercadorias de terceiros para consumo",
        cfopInterno: "5102",
        cfopInterestadual: "6108",
        tipoDocumento: "NFE",
        paraContribuinte: false,
        paraNaoContribuinte: true,
        paraPessoaFisica: false,
        paraPessoaJuridica: true,
        finalidade: "CONSUMO",
        consumidorFinal: true,
        prioridade: 15
    },
    {
        codigo: "VENDA_PROPRIA",
        nome: "Venda de mercadoria própria / produção do estabelecimento",
        cfopInterno: "5101",
        cfopInterestadual: "6101",
        tipoDocumento: "NFE",
        paraContribuinte: true,
        paraNaoContribuinte: true,
        paraPessoaFisica: true,
        paraPessoaJuridica: true,
        finalidade: "AMBOS",
        consumidorFinal: false,
        prioridade: 40
    }
];

function soDigitos(valor) {
    return String(valor || "").replace(/\D/g, "");
}

function tipoPessoaDe(contato) {
    if (contato?.tipoPessoa) {
        return String(contato.tipoPessoa).toLowerCase();
    }
    return soDigitos(contato?.cpfCnpj).length > 11 ? "juridica" : "fisica";
}

function contribuinteIcms(contato) {
    return String(contato?.contribuinte || "9").trim() === "1";
}

function consumidorFinalDe(contato) {
    if (contato?.consumidorFinal === true || contato?.consumidorFinal === false) {
        return Boolean(contato.consumidorFinal);
    }
    const pf = tipoPessoaDe(contato) === "fisica";
    return pf || !contribuinteIcms(contato);
}

function finalidadeDe(contato) {
    if (contato?.finalidade) {
        return String(contato.finalidade).toUpperCase();
    }
    return consumidorFinalDe(contato) ? "CONSUMO" : "REVENDA";
}

function operacaoInterna(uf, empresaUf = EMPRESA_UF) {
    const destino = String(uf || empresaUf || EMPRESA_UF).toUpperCase();
    return !destino || destino === String(empresaUf || EMPRESA_UF).toUpperCase();
}

function pontos(n, contato) {
    const pf = tipoPessoaDe(contato) === "fisica";
    const icms = contribuinteIcms(contato);
    const consumidor = consumidorFinalDe(contato);
    const finalidade = finalidadeDe(contato);
    let pts = 0;
    if (pf && n.paraPessoaFisica) {
        pts += 3;
    }
    if (!pf && n.paraPessoaJuridica) {
        pts += 3;
    }
    if (icms && n.paraContribuinte) {
        pts += 4;
    }
    if (!icms && n.paraNaoContribuinte) {
        pts += 4;
    }
    if (consumidor && n.consumidorFinal) {
        pts += 5;
    }
    if (!consumidor && !n.consumidorFinal) {
        pts += 2;
    }
    if (finalidade === (n.finalidade || "AMBOS") || n.finalidade === "AMBOS") {
        pts += 3;
    }
    return pts;
}

export function rotuloNatureza(n) {
    if (!n) {
        return "—";
    }
    const cfop = n.cfop || n.cfopInterno;
    return `${cfop ? `CFOP ${cfop} · ` : ""}${n.nome || n.codigo || "Natureza"}`;
}

export function sugerirNatureza(contato, lista = NATUREZAS_OPERACAO, empresaUf = EMPRESA_UF) {
    const catalogo = (lista && lista.length ? lista : NATUREZAS_OPERACAO).filter((n) => n.ativo !== false);
    const interna = operacaoInterna(contato?.uf, empresaUf);
    const cadastrada = contato?.naturezaOperacaoId
        ? catalogo.find((n) => String(n.id) === String(contato.naturezaOperacaoId) || String(n.codigo) === String(contato.naturezaOperacaoId))
        : null;
    const escolhida = cadastrada || [...catalogo].sort((a, b) => {
        const diff = pontos(b, contato) - pontos(a, contato);
        if (diff !== 0) {
            return diff;
        }
        return (a.prioridade || 99) - (b.prioridade || 99);
    })[0] || catalogo[0];

    if (!escolhida) {
        return {
            nome: "Não definida",
            origem: "AUTOMATICA",
            motivo: "Cadastre naturezas de operação."
        };
    }

    const pf = tipoPessoaDe(contato) === "fisica";
    const icms = contribuinteIcms(contato);
    const uf = String(contato?.uf || empresaUf || EMPRESA_UF).toUpperCase();
    return {
        naturezaId: escolhida.id || null,
        codigo: escolhida.codigo,
        nome: escolhida.nome,
        cfopInterno: escolhida.cfopInterno,
        cfopInterestadual: escolhida.cfopInterestadual,
        cfop: interna ? escolhida.cfopInterno : escolhida.cfopInterestadual,
        operacao: interna ? "INTERNA" : "INTERESTADUAL",
        origem: cadastrada ? "CADASTRO" : "AUTOMATICA",
        motivo: cadastrada
            ? "Natureza padrão do cadastro do cliente."
            : `UF ${uf}${interna ? " (mesma UF da loja)" : " (interestadual)"}, ${pf ? "CPF" : "CNPJ"}, ${icms ? "contribuinte ICMS" : "não contribuinte"}, ${finalidadeDe(contato).toLowerCase()}.`
    };
}
