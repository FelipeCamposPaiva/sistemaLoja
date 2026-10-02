export const EMPRESA_RH = {
    nome: "TEM DE TUDO PAPELARIA, PRESENTES E PERSONALIZADOS LTDA",
    nomeCurto: "TEM DE TUDO PAPELARIA, PRESENTES E PERSO",
    cnpj: "40.424.076/0001-69",
    endereco: "Av. Visconde do Rio Branco, 394, 392 Cond. D E, Água Limpa",
    cidade: "Volta Redonda",
    uf: "RJ",
    cep: "27250-250",
    cnae: "4755-5/02",
    cnaes: ["4755-5/02", "1813-0/99", "4713-0/02", "4789-0/01"],
    atividade: "Comércio varejista de artigos de armarinho",
    abertura: "2021-01-16",
    natureza: "ME",
    simplesDesde: "2025-01-01",
    ieDesde: "2024-01-24",
    enderecoIE: "Rua Jaime Martins, 383, Santo Agostinho",
    codigoFolha: "895"
};

export function brl(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const PARTICULAS_NOME = new Set(["de", "da", "do", "dos", "das", "e"]);

export function nomePessoa(nome) {
    if (!nome) {
        return "—";
    }
    return String(nome)
        .toLowerCase()
        .split(/\s+/)
        .map((parte, i) => {
            if (i > 0 && PARTICULAS_NOME.has(parte)) {
                return parte;
            }
            return parte.charAt(0).toUpperCase() + parte.slice(1);
        })
        .join(" ");
}

export function setorDoFuncionario(func) {
    const cargo = String(func?.cargo || "").toLowerCase();
    if (/produ|gr[áa]fic|design|colabor/.test(cargo)) {
        return "Produção";
    }
    if (/admin|pr[oó]-labore|s[oó]cia|s[oó]cio/.test(cargo)) {
        return "Administração";
    }
    if (/vended|atend/.test(cargo)) {
        return "Vendas";
    }
    return "Geral";
}

export function competenciaBr(comp) {
    if (!comp) {
        return "—";
    }
    if (comp.includes(".")) {
        const [mes, ano] = comp.split(".");
        return `${mes}/${ano}`;
    }
    const [ano, mes] = comp.split("-");
    if (mes === "13") {
        return `13º/${ano}`;
    }
    return `${mes}/${ano}`;
}

export const TIPO_HOLERITE = {
    mensal: "Mensal",
    retificado: "Retificado",
    individual: "Individual",
    "13-adiantamento": "1ª parcela 13º",
    "13-salario": "13º salário",
    "pro-labore": "Pró-labore"
};

export const FUNCIONARIOS_RH = [
    {
        id: 32,
        matricula: "001",
        eSocial: "000001",
        nome: "ELEN LACERDA CLARO",
        situacao: "ativo",
        cargo: "Vendedora",
        cbo: "521110",
        salario: 1780.8,
        salarioPor: "Mês",
        admissao: "2025-08-01",
        nascimento: "1985-12-16",
        sexo: "Feminino",
        cor: "Preta",
        estadoCivil: "Casado",
        nacionalidade: "Brasileira",
        naturalidade: "Volta Redonda - RJ",
        instrucao: "Ensino Médio Completo",
        cpf: "120.630.917-22",
        rg: "21040356-4",
        rgEmissao: "17/06/2002",
        rgOrgao: "047 / RJ",
        ctps: "12063091",
        ctpsSerie: "722",
        ctpsUf: "RJ",
        pis: "130.59260.62-0",
        titulo: "125539950396",
        cnh: "DETRAN/RJ",
        celular: "(24) 99984-6374",
        pai: "ERNANI MOURA CLARO",
        mae: "MARIA DO CARMO LACERDA CLARO",
        endereco: "Rua Eloy Pereira Pimentel, 705, Casa 1, Água Limpa",
        cidade: "Volta Redonda",
        uf: "RJ",
        cep: "27250-005",
        expediente: "08:30 às 18:30",
        intervalo: "12:00 às 14:00",
        sabado: "08:30 às 12:30",
        fgtsOpcao: "01/08/2025",
        depto: "001 - GERAL",
        dependentes: [
            { nome: "MIGUEL LACERDA BOTELHO", cpf: "187.282.497-80", nascimento: "19/12/2007", parentesco: "Filho(a) até 21 anos" }
        ]
    },
    {
        id: 216,
        matricula: "002",
        eSocial: "000002",
        nome: "NADIA CRISTINA LOPES DO CARMO CORDEIRO",
        situacao: "desligado",
        cargo: "Vendedora",
        cbo: "521110",
        salario: 1155,
        salarioPor: "Mês",
        admissao: "2025-08-01",
        desligamento: "2026-04-22",
        avisoPrevio: "2026-03-23",
        nascimento: "1997-04-03",
        sexo: "Feminino",
        cor: "Parda",
        estadoCivil: "Casado",
        nacionalidade: "Brasileira",
        naturalidade: "Volta Redonda - RJ",
        instrucao: "Superior incompleto",
        cpf: "184.970.437-66",
        rg: "315703165",
        rgEmissao: "26/06/2024",
        rgOrgao: "090 / 0408",
        ctps: "18497043",
        ctpsSerie: "766",
        ctpsUf: "RJ",
        pis: "210.50445.71-8",
        titulo: "161336090302",
        cnh: "DETRAN/RJ",
        celular: "(24) 99966-6519",
        mae: "Cristina Faria Lopes",
        endereco: "Rua Cabo Clodoaldo Ursulano, 51, Morro da Conquista",
        cidade: "Volta Redonda",
        uf: "RJ",
        cep: "27211-025",
        expediente: "08:00 às 13:00",
        intervalo: "Não possui",
        sabado: "08:30 às 12:30",
        horasSemana: 29,
        fgtsOpcao: "01/08/2025",
        depto: "001 - GERAL",
        dependentes: [
            { nome: "THEO CARMO CORDEIRO", parentesco: "Filho(a)" }
        ]
    },
    {
        id: 3,
        matricula: "003",
        eSocial: "000003",
        nome: "LEONAM RAFAEL DE FREITAS BEZERRA",
        situacao: "desligado",
        cargo: "Designer gráfico",
        salario: 2000,
        salarioPor: "Mês",
        admissao: "2025-08-12",
        experienciaFim: "2025-11-09",
        desligamento: "2025-10-15",
        avisoPrevio: "2025-10-15",
        nascimento: "1995-08-10",
        sexo: "Masculino",
        estadoCivil: "Solteiro",
        cpf: "120.757.807-06",
        ctps: "94419",
        ctpsSerie: "176",
        ctpsUf: "RJ",
        mae: "VILMA APARECIDA SANTOS DE FREITAS",
        endereco: "Av. Visconde do Rio Branco, 241 - Alameda 07, Água Limpa",
        cidade: "Volta Redonda",
        uf: "RJ",
        cep: "27250-250",
        expediente: "08:30 às 18:30",
        intervalo: "12:00 às 14:00",
        sabado: "08:30 às 12:30",
        contrato: "Experiência 90 dias (12/08/2025 a 09/11/2025)",
        causaAfastamento: "Rescisão antecipada pelo empregado (RA1)",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 1,
        matricula: "004",
        eSocial: "000004",
        nome: "ADELINE CAMPOS SILVA",
        situacao: "prolabore",
        cargo: "Sócia / pró-labore",
        salario: 1621,
        cpf: "091.044.527-39",
        celular: "(24) 99872-1402",
        admissao: "2018-01-10",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 105,
        matricula: "005",
        eSocial: "000005",
        nome: "GABRIELA FERREIRA DE PAULA",
        situacao: "experiencia",
        cargo: "Vendedora",
        salario: 1780.8,
        nascimento: "1999-09-23",
        estadoCivil: "Solteiro",
        cpf: "101.670.357-03",
        celular: "(24) 98812-4410",
        email: "gabriela@temdetudovr.com.br",
        endereco: "Rua Porto Velho, 65, Santo Agostinho",
        cidade: "Volta Redonda",
        uf: "RJ",
        cep: "27210-510",
        admissao: "2026-06-01",
        experienciaFim: "2026-07-15",
        experienciaProrrogacao: "2026-08-29",
        expediente: "08:30 às 18:30",
        intervalo: "12:00 às 14:00",
        sabado: "08:30 às 12:30",
        horasSemana: 44,
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2194,
        matricula: "006",
        eSocial: "000006",
        nome: "MARIA ANTONIA DOS SANTOS ZORGDRAGER",
        situacao: "experiencia",
        cargo: "Vendedora",
        salario: 1224.3,
        nascimento: "2007-02-19",
        estadoCivil: "Solteiro",
        cpf: "143.875.117-61",
        email: "maria.antonia@temdetudovr.com.br",
        celular: "(24) 99210-7788",
        endereco: "Rua Eloy Pereira Pimentel, 705, Água Limpa",
        cidade: "Volta Redonda",
        uf: "RJ",
        cep: "27250-005",
        admissao: "2026-06-02",
        experienciaFim: "2026-07-16",
        experienciaProrrogacao: "2026-08-30",
        expediente: "08:00 às 13:00",
        intervalo: "Não possui",
        sabado: "08:30 às 12:30",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 104,
        matricula: "007",
        eSocial: "000007",
        nome: "GABRIEL IVAN CAMPOS DIAS",
        situacao: "experiencia",
        cargo: "Auxiliar designer",
        salario: 1224.3,
        nascimento: "2008-07-02",
        estadoCivil: "Solteiro",
        cpf: "211.061.607-54",
        endereco: "Rua Belém, 222, Santo Agostinho",
        cidade: "Valença",
        uf: "RJ",
        cep: "27210-350",
        admissao: "2026-07-11",
        experienciaFim: "2026-08-24",
        expediente: "08:30 às 18:30",
        intervalo: "12:00 às 14:00",
        sabado: "08:30 às 12:30",
        horasSemana: 36,
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 23,
        matricula: "008",
        nome: "ARTHUR BRITO DE JESUS",
        situacao: "ativo",
        cargo: "Colaborador",
        celular: "(24) 99335-2313",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 90,
        matricula: "009",
        nome: "FELIPE CAMPOS PAIVA",
        situacao: "ativo",
        cargo: "Colaborador",
        celular: "(24) 99863-0400",
        email: "felipe@temdetudovr.com.br",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2401,
        matricula: "010",
        nome: "AILEMA CAMARGO REIS",
        situacao: "ativo",
        cargo: "Vendedora",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2402,
        matricula: "011",
        nome: "PAMELLA CHRISTINA DE OLIVEIRA RESENDE",
        situacao: "ativo",
        cargo: "Vendedora",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2501,
        matricula: "012",
        nome: "IVANA",
        situacao: "desligado",
        cargo: "Colaborador",
        admissao: "2014",
        desligamento: "2018",
        observacao: "Planilha só com o ano.",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2502,
        matricula: "013",
        nome: "SABRINA",
        situacao: "desligado",
        cargo: "Colaborador",
        desligamento: "2024-04-30",
        observacao: "Planilha sem entrada. Saída 31/04/2024 ajustada para 30/04/2024.",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2503,
        matricula: "014",
        nome: "MEIRIELE",
        situacao: "desligado",
        cargo: "Colaborador",
        admissao: "2021-11-30",
        desligamento: "2024-03-31",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2504,
        matricula: "015",
        nome: "MONALIZA",
        situacao: "ativo",
        cargo: "Colaborador",
        observacao: "Planilha sem entrada nem saída.",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2505,
        matricula: "016",
        nome: "ANDJARA",
        situacao: "desligado",
        cargo: "Colaborador",
        admissao: "2022-05-19",
        desligamento: "2022-07-30",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2506,
        matricula: "017",
        nome: "JOELMA TULLER",
        situacao: "desligado",
        cargo: "Colaborador",
        admissao: "2022-08-01",
        desligamento: "2023-11-30",
        observacao: "Saída 31/11/2023 ajustada para 30/11/2023.",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2507,
        matricula: "018",
        nome: "MARINA",
        situacao: "desligado",
        cargo: "Colaborador",
        admissao: "2022-08-22",
        desligamento: "2022-09-30",
        observacao: "Primeira Marina da planilha (2022).",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2508,
        matricula: "019",
        nome: "LAISA AMARAL",
        situacao: "desligado",
        cargo: "Colaborador",
        admissao: "2023-11-27",
        desligamento: "2024-04-30",
        observacao: "Saída 31/04/2024 ajustada para 30/04/2024.",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2509,
        matricula: "020",
        nome: "CARMEM BEATRIZ",
        situacao: "desligado",
        cargo: "Colaborador",
        admissao: "2023-12-04",
        desligamento: "2024-11-30",
        observacao: "Saída 31/11/2024 ajustada para 30/11/2024.",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2510,
        matricula: "021",
        nome: "ANA JULIA DE SOUZA OLIVEIRA",
        situacao: "ativo",
        cargo: "Colaborador",
        admissao: "2024-11-25",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2511,
        matricula: "022",
        nome: "ANA LIVIA",
        situacao: "desligado",
        cargo: "Colaborador",
        admissao: "2025-01-27",
        desligamento: "2025-01-31",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2512,
        matricula: "023",
        nome: "MARINA",
        situacao: "desligado",
        cargo: "Colaborador",
        admissao: "2025-02-07",
        desligamento: "2025-02-12",
        observacao: "Segunda Marina da planilha (2025).",
        depto: "001 - GERAL",
        dependentes: []
    },
    {
        id: 2513,
        matricula: "024",
        nome: "GABRIELA RIBEIRO MELLO DE LIMA",
        situacao: "desligado",
        cargo: "Colaborador",
        observacao: "Planilha Ponto Gabi — Atualizar (recibos, sem marcação diária).",
        depto: "001 - GERAL",
        dependentes: []
    }
];

export const DOCUMENTOS_RH = [
    { id: "adm-elen", funcId: 32, tipo: "admissional", titulo: "Kit admissional", data: "2025-08-01", arquivo: "895 Admissionais ELEN LACERDA.pdf", itens: ["Contrato de experiência", "Uso de imagem e voz", "Consentimento LGPD", "Vale-transporte", "Salário-família", "Autodeclaração étnico-racial", "Dependentes IR"] },
    { id: "ficha-elen", funcId: 32, tipo: "ficha", titulo: "Ficha / registro de empregado", data: "2025-08-01", arquivo: "895 Ficha de Empregado ELEN LACERDA CLARO.pdf" },
    { id: "ferias-elen", funcId: 32, tipo: "ferias", titulo: "Aviso e recibo de férias", data: "2026-09-01", arquivo: "895 FERIAS ELEN 01 09 2026.pdf" },
    { id: "prog-ferias", funcId: null, tipo: "ferias", titulo: "Programação de férias — data-base 31/12/2026", data: "2026-01-16", arquivo: "31_12_2026.pdf" },
    { id: "aviso-nadia", funcId: 216, tipo: "rescisao", titulo: "Aviso prévio do empregador", data: "2026-03-23", arquivo: "895 AVISO NADIA.pdf" },
    { id: "grrf-nadia", funcId: 216, tipo: "fgts", titulo: "GFD / GRRF — guia FGTS Digital", data: "2026-04-29", arquivo: "895 GRRF GUIA NADIA.pdf" },
    { id: "sd-nadia", funcId: 216, tipo: "rescisao", titulo: "Seguro-desemprego", data: "2026-04-22", arquivo: "895 SEGURO DESEMP NADIA.pdf", observacao: "Documento digitalizado (imagem)." },
    { id: "trct-leonam", funcId: 3, tipo: "rescisao", titulo: "TRCT — termo de rescisão", data: "2025-10-15", arquivo: "895 TRCT LEONAM.pdf" },
    { id: "fgts-leonam", funcId: 3, tipo: "fgts", titulo: "Extrato FGTS", data: "2025-10-15", arquivo: "895 EXTRATO FGTS LEONAM.pdf", observacao: "Documento digitalizado (imagem)." },
    { id: "avisos-exp", funcId: 105, tipo: "aviso", titulo: "Vencimentos 08/07 a 15/07/2026", data: "2026-07-07", arquivo: "Avisos de 08•07•2026 até 15•07•2026.pdf" },
    { id: "avisos-exp-2", funcId: 2194, tipo: "aviso", titulo: "Vencimentos 15/07 a 22/07/2026", data: "2026-07-15", arquivo: "Avisos de 15•07•2026 até 22•07•2026.pdf" },
    { id: "avisos-exp-3", funcId: 104, tipo: "aviso", titulo: "Vencimentos 19/08 a 26/08/2026", data: "2026-08-19", arquivo: "Avisos de 19•08•2026 até 26•08•2026.pdf" },
    { id: "avisos-exp-4", funcId: 105, tipo: "aviso", titulo: "Prorrogações 26/08 a 02/09/2026", data: "2026-08-26", arquivo: "Avisos de 26•08•2026 até 02•09•2026.pdf" },
    { id: "informe-2025", funcId: null, tipo: "informe", titulo: "Informes de rendimentos 2025 (exercício 2026)", data: "2026-02-24", arquivo: "Informes de Rendimentos 2025.pdf" },
    { id: "adm-leonam", funcId: 3, tipo: "admissional", titulo: "Kit admissional", data: "2025-08-12", arquivo: "895 ADMISSIONAIS LEONAM RAFAEL DE FREITAS BEZERRA.pdf" },
    { id: "adm-nadia", funcId: 216, tipo: "admissional", titulo: "Kit admissional", data: "2025-08-01", arquivo: "895 Admissionais NADIA CRISTINA.pdf" },
    { id: "adm-gabriel", funcId: 104, tipo: "admissional", titulo: "Contrato de experiência", data: "2026-07-11", arquivo: "895 - GABRIEL IVAN CAMPOS DIAS - 11.07.26.pdf" },
    { id: "adm-gabriela", funcId: 105, tipo: "admissional", titulo: "Contrato de experiência", data: "2026-06-01", arquivo: "895 - GABRIELA FERREIRA DE PAULA - 01.06.26.pdf" },
    { id: "adm-maria", funcId: 2194, tipo: "admissional", titulo: "Contrato de experiência", data: "2026-06-02", arquivo: "895 - MARIA ANTONIA DOS SANTOS ZORGDRAGER - 02.06.26.pdf" },
    { id: "ficha-nadia", funcId: 216, tipo: "ficha", titulo: "Ficha / registro de empregado", data: "2025-08-01", arquivo: "895 Ficha de Empregado NADIA CRISTINA LOPES DO CARMO CORDEIRO.pdf" },
    { id: "trct-nadia", funcId: 216, tipo: "rescisao", titulo: "TRCT", data: "2026-04-22", arquivo: "895 TRCT NADIA.pdf" },
    { id: "grrf-relat", funcId: 216, tipo: "fgts", titulo: "GRRF relatório detalhado", data: "2026-04-29", arquivo: "895 GRRF RELAT NADIA.pdf" },
    { id: "fgts-nadia", funcId: 216, tipo: "fgts", titulo: "Extrato FGTS", data: "2026-04-22", arquivo: "895 EXTRATO FGTS NADIA.pdf", observacao: "Documento digitalizado (imagem)." },
    { id: "prog-ferias-2", funcId: null, tipo: "ferias", titulo: "Programação de férias atualizada", data: "2026-07-23", arquivo: "Atualizado em 23.07.2026.pdf" },
    { id: "cnpj", funcId: null, tipo: "empresa", titulo: "CNPJ atualizado", data: "2021-01-16", arquivo: "CNPJ ATUALIZADO.pdf" },
    { id: "ie", funcId: null, tipo: "empresa", titulo: "Inscrição estadual", data: "2024-01-24", arquivo: "IE.pdf" },
    { id: "alt-contratual", funcId: null, tipo: "empresa", titulo: "1ª alteração contratual (chancelado)", arquivo: "1ª ALTERAÇÃO CONTRATUAL - CHANCELADO.pdf" },
    { id: "ponto-elen", funcId: 32, tipo: "ponto", titulo: "Folha de ponto individual", arquivo: "Folha de Ponto - ELEN LACERDA CLARO.pdf" },
    { id: "ponto-nadia", funcId: 216, tipo: "ponto", titulo: "Folha de ponto individual", arquivo: "Folha de Ponto - NADIA CRISTINA LOPES DO CARMO CORDEIRO.pdf" },
    { id: "ponto-leonam", funcId: 3, tipo: "ponto", titulo: "Folha de ponto individual", arquivo: "Folha de Ponto - LEONAM RAFAEL DE FREITAS BEZERRA.pdf" }
];

export const FERIAS = [
    {
        funcId: 32,
        aquisitivoIni: "2025-08-01",
        aquisitivoFim: "2026-07-31",
        vencidas: 30,
        abono: 0,
        gozo: 30,
        limite: "2027-07-02",
        gozoIni: "2026-09-01",
        gozoFim: "2026-09-30",
        salarioBase: 1780.8,
        ferias: 1780.8,
        terco: 593.6,
        inss: 189.37,
        proventos: 2374.4,
        liquido: 2185.03,
        status: "programado"
    },
    {
        funcId: 32,
        aquisitivoIni: "2026-08-01",
        aquisitivoFim: "2027-07-31",
        vencidas: 12.5,
        abono: 0,
        gozo: 30,
        limite: "2028-07-02",
        status: "aquisitivo"
    },
    {
        funcId: 216,
        cargo: "Atendente",
        aquisitivoIni: "2026-08-01",
        aquisitivoFim: "2027-07-31",
        vencidas: 12.5,
        abono: 0,
        gozo: 0,
        limite: "2027-07-02",
        status: "aquisitivo"
    },
    {
        funcId: 216,
        aquisitivoIni: "2025-08-01",
        aquisitivoFim: "2026-07-31",
        vencidas: 30,
        abono: 0,
        gozo: 30,
        limite: "2027-07-02",
        status: "encerrado"
    },
    {
        funcId: 104,
        cargo: "Produção",
        aquisitivoIni: "2026-07-12",
        aquisitivoFim: "2027-07-11",
        vencidas: 15,
        abono: 0,
        gozo: 15,
        limite: "2028-06-12",
        gozoIni: "2026-12-20",
        gozoFim: "2027-01-03",
        status: "programado"
    },
    {
        funcId: 105,
        cargo: "Atendente",
        aquisitivoIni: "2026-06-01",
        aquisitivoFim: "2027-05-31",
        vencidas: 17.5,
        abono: 0,
        gozo: 15,
        limite: "2028-05-02",
        gozoIni: "2026-09-15",
        gozoFim: "2026-09-29",
        status: "aquisitivo"
    },
    {
        funcId: 2194,
        cargo: "Produção",
        aquisitivoIni: "2026-06-02",
        aquisitivoFim: "2027-06-01",
        vencidas: 17.5,
        abono: 0,
        gozo: 15,
        limite: "2028-05-03",
        gozoIni: "2026-10-05",
        gozoFim: "2026-10-19",
        status: "programado"
    },
    {
        funcId: 23,
        cargo: "Produção",
        admissao: "2026-03-10",
        aquisitivoIni: "2026-03-10",
        aquisitivoFim: "2027-03-09",
        vencidas: 15,
        abono: 0,
        gozo: 15,
        limite: "2027-03-09",
        gozoIni: "2026-08-10",
        gozoFim: "2026-08-24",
        salarioBase: 1654.2,
        ferias: 1240.65,
        terco: 413.55,
        inss: 0,
        proventos: 1654.2,
        liquido: 1654.2,
        status: "encerrado"
    },
    {
        funcId: 801,
        nome: "MARIA VITÓRIA",
        cargo: "Administração",
        admissao: "2026-01-12",
        aquisitivoIni: "2026-01-12",
        aquisitivoFim: "2027-01-11",
        vencidas: 0,
        abono: 0,
        gozo: 0,
        limite: "2027-01-11",
        status: "proporcional-rescisao"
    },
    {
        funcId: 802,
        nome: "RICARDO SOUZA",
        cargo: "Produção",
        admissao: "2025-01-20",
        aquisitivoIni: "2025-01-20",
        aquisitivoFim: "2026-01-19",
        vencidas: 22.5,
        abono: 0,
        gozo: 0,
        limite: "2026-08-19",
        status: "aquisitivo"
    }
];

export const RESCISOES = [
    {
        funcId: 216,
        tipo: "aviso-empregador",
        data: "2026-03-23",
        termino: "2026-04-22",
        diasAviso: 30,
        opcoes: ["Redução de 2 horas diárias", "Ausência por 7 dias corridos"],
        guiaFgts: {
            competencia: "04/2026",
            vencimento: "2026-04-30",
            identificador: "0126042934770845-6",
            mensal: 0,
            rescisório: 373.37,
            indenizacao: 0,
            encargos: 103.68,
            total: 477.05
        }
    },
    {
        funcId: 3,
        tipo: "trct",
        data: "2025-10-15",
        codigo: "RA1",
        causa: "Rescisão antecipada, pelo empregado, de contrato a prazo determinado",
        verbas: [
            { codigo: "50", nome: "Saldo de 15 dias", valor: 1052 },
            { codigo: "56.1", nome: "Horas extras 04:15 a 50%", valor: 60.97 },
            { codigo: "56.2", nome: "Horas extras 04:20 a 100%", valor: 82.82 },
            { codigo: "60", nome: "Multa art. 477 §8º CLT", valor: 21.3 },
            { codigo: "61", nome: "Multa art. 479 CLT", valor: 526 },
            { codigo: "63", nome: "13º proporcional 3/12", valor: 350.67 },
            { codigo: "65", nome: "Férias proporcionais 2/12", valor: 0 },
            { codigo: "68", nome: "1/3 constitucional de férias", valor: 116.89 },
            { codigo: "95", nome: "Diferença de salários", valor: 216.35 }
        ],
        bruto: 2427,
        descontos: [
            { codigo: "103", nome: "Aviso-prévio indenizado (desconto)", valor: 107.5 },
            { codigo: "104", nome: "Indenização art. 480 CLT", valor: 876.67 },
            { codigo: "112.2", nome: "Previdência sobre 13º", valor: 39.45 }
        ],
        deducoes: 1023.62,
        liquido: 1403.38
    },
    {
        funcId: 216,
        tipo: "trct",
        data: "2026-04-22",
        codigo: "SJ2",
        causa: "Despedida sem justa causa, pelo empregador",
        verbas: [
            { codigo: "50", nome: "Saldo de 22 dias", valor: 891.04 },
            { codigo: "62", nome: "Salário-família", valor: 49.53 },
            { codigo: "63", nome: "13º proporcional 4/12", valor: 405.02 },
            { codigo: "65", nome: "Férias proporcionais 9/12", valor: 911.3 },
            { codigo: "68", nome: "1/3 constitucional de férias", valor: 303.77 }
        ],
        bruto: 2560.66,
        descontos: [
            { codigo: "103", nome: "INSS / aviso", valor: 30.37 },
            { codigo: "112", nome: "Previdência", valor: 66.82 }
        ],
        deducoes: 97.19,
        liquido: 2463.47
    }
];

export const INFORMES = [
    { funcId: 32, eSocial: "000001", calendario: 2025, exercicio: 2026, tributaveis: 7590, inss: 834.9, irrf: 0, decimo: 0, indenizacao: 0, data: "2026-02-24", responsavel: "LEVI CARVALHO CANELLA", status: "disponivel" },
    { funcId: 216, eSocial: "000002", calendario: 2025, exercicio: 2026, tributaveis: 8904, inss: 687.5, irrf: 0, decimo: 496.76, indenizacao: 0, data: "2026-02-24", responsavel: "LEVI CARVALHO CANELLA", status: "disponivel" },
    { funcId: 104, eSocial: "000007", calendario: 2025, exercicio: 2026, tributaveis: 4723.76, inss: 361.5, irrf: 0, decimo: 486.55, indenizacao: 0, data: "2026-02-24", responsavel: "LEVI CARVALHO CANELLA", status: "disponivel" },
    { funcId: 105, eSocial: "000005", calendario: 2025, exercicio: 2026, tributaveis: 6375.3, inss: 455.62, irrf: 0, decimo: 278.72, indenizacao: 0, data: "2026-02-24", responsavel: "LEVI CARVALHO CANELLA", status: "disponivel" },
    { funcId: 2194, eSocial: "000006", calendario: 2025, exercicio: 2026, tributaveis: 5648.12, inss: 423.61, irrf: 0, decimo: 345.1, indenizacao: 0, data: "2026-02-24", responsavel: "LEVI CARVALHO CANELLA", status: "disponivel" },
    { funcId: 23, eSocial: "000008", calendario: 2025, exercicio: 2026, tributaveis: 6214.9, inss: 482.3, irrf: 0, decimo: 412.55, indenizacao: 0, data: "2026-02-24", responsavel: "LEVI CARVALHO CANELLA", status: "disponivel" },
    { funcId: 2401, eSocial: "000010", calendario: 2025, exercicio: 2026, tributaveis: 5902.45, inss: 438.77, irrf: 0, decimo: 389.21, indenizacao: 0, data: "2026-02-24", responsavel: "LEVI CARVALHO CANELLA", status: "disponivel" },
    { funcId: 90, eSocial: "000009", calendario: 2025, exercicio: 2026, tributaveis: 6483.8, inss: 512.4, irrf: 0, decimo: 403.66, indenizacao: 0, data: "2026-02-24", responsavel: "LEVI CARVALHO CANELLA", status: "disponivel" },
    { funcId: 3, eSocial: "000003", calendario: 2025, exercicio: 2026, tributaveis: 4723.76, inss: 361.5, irrf: 0, decimo: 486.55, indenizacao: 467.56, data: "2026-02-24", responsavel: "LEVI CARVALHO CANELLA", status: "disponivel" },
    { funcId: 1, eSocial: "000004", calendario: 2025, exercicio: 2026, tributaveis: 19452, inss: 0, irrf: 0, decimo: 0, indenizacao: 0, data: "2026-02-24", responsavel: "LEVI CARVALHO CANELLA", status: "disponivel" }
];

export function informesDoExercicio(ano) {
    const alvo = Number(ano);
    return INFORMES.filter((item) => item.exercicio === alvo || item.calendario === alvo);
}

export const AVISOS_RH = [
    { id: 1, tipo: "experiencia", funcId: 105, titulo: "1º vencimento da experiência", detalhe: "Gabriela — 15/07/2026", inicio: "2026-07-08", fim: "2026-07-15", gravidade: "alta" },
    { id: 2, tipo: "experiencia", funcId: 2194, titulo: "1º vencimento da experiência", detalhe: "Maria Antonia — 16/07/2026", inicio: "2026-07-15", fim: "2026-07-22", gravidade: "alta" },
    { id: 3, tipo: "experiencia", funcId: 104, titulo: "1º vencimento da experiência", detalhe: "Gabriel Ivan — 24/08/2026", inicio: "2026-08-19", fim: "2026-08-26", gravidade: "alta" },
    { id: 4, tipo: "experiencia", funcId: 105, titulo: "Prorrogação da experiência", detalhe: "Gabriela — 29/08/2026", inicio: "2026-08-26", fim: "2026-09-02", gravidade: "info" },
    { id: 5, tipo: "experiencia", funcId: 2194, titulo: "Prorrogação da experiência", detalhe: "Maria Antonia — 30/08/2026", inicio: "2026-08-26", fim: "2026-09-02", gravidade: "info" },
    { id: 6, tipo: "ferias", funcId: 32, titulo: "Gozo de férias", detalhe: "Elen — 01/09/2026 a 30/09/2026", inicio: "2026-09-01", fim: "2026-09-30", gravidade: "info" },
    { id: 7, tipo: "aviso-previo", funcId: 216, titulo: "Aviso prévio (histórico)", detalhe: "Nadia — até 22/04/2026", inicio: "2026-03-23", fim: "2026-04-22", gravidade: "alta" }
];

export const GUIAS_INSS = [
    { competencia: "2025-08", valor: 413.8, arquivo: "279169-895-082025-Guia.pdf" },
    { competencia: "2025-09", valor: 474.26, arquivo: "310971-895-092025-Guia.pdf" },
    { competencia: "2025-10", valor: 491.13, arquivo: "329035-895-102025-Guia.pdf" },
    { competencia: "2025-11", valor: 344.18, vencimento: "2025-12-19", arquivo: "895 DARF PREV 11 2025.pdf" },
    { competencia: "2025-12", valor: 330.6, vencimento: "2026-01-20", arquivo: "895 DARF PREVIDENCIARIO 12-2025.pdf" },
    { competencia: "2025-13", valor: 93.62, arquivo: "895 132025 guia.pdf", obs: "13º salário" },
    { competencia: "2026-01", valor: 337.84, arquivo: "402942-895-012026-Guia.pdf" },
    { competencia: "2026-02", valor: 337.84, arquivo: "425910-895-022026-Guia.pdf" },
    { competencia: "2026-03", valor: 337.84, arquivo: "446008-895-032026-Guia.pdf" },
    { competencia: "2026-04", valor: 361.92, arquivo: "470043-895-042026-Guia.pdf" },
    { competencia: "2026-05", valor: 314.26, arquivo: "1011281-895-052026-Guia.pdf" },
    { competencia: "2026-06", valor: 471.43, arquivo: "1036451-895-062026-Guia.pdf" },
    { competencia: "2026-07", valor: 535.7, vencimento: "2026-08-20", arquivo: "1073448-895-072026-Guia.pdf" }
];

export const GUIAS_FGTS = [
    { competencia: "2025-08", valor: 330.02, arquivo: "286601-895-082025-GuiaFgts.pdf" },
    { competencia: "2025-09", valor: 386.8, arquivo: "311072-895-092025-GuiaFgts.pdf" },
    { competencia: "2025-10", valor: 409.27, arquivo: "338986-895-102025-GuiaFgts.pdf" },
    { competencia: "2025-11", valor: 302.45, arquivo: "369603-895-112025-GuiaFgts.pdf" },
    { competencia: "2025-12", valor: 289.59, arquivo: "895 GUIA FGTS 12 2025.pdf" },
    { competencia: "2026-01", valor: 239.66, arquivo: "411928-895-012026-GuiaFGTS.pdf" },
    { competencia: "2026-02", valor: 239.66, arquivo: "895 GUIA FGTS 02 2026.pdf" },
    { competencia: "2026-03", valor: 239.66, arquivo: "449848-895-032026-GuiaFGTS.pdf" },
    { competencia: "2026-04", valor: 142.46, arquivo: "895 GUIA FGTS 04 2026.pdf" },
    { competencia: "2026-05", valor: 142.46, arquivo: "1012142-895-052026-GuiaFGTS.pdf" },
    { competencia: "2026-06", valor: 379.59, arquivo: "1040028-895-062026-GuiaFGTS.pdf" },
    { competencia: "2026-07", valor: 448.15, vencimento: "2026-08-20", arquivo: "1073447-895-072026-GuiaFGTS.pdf" }
];

export const HOLERITES = [
    { competencia: "2025-08", arquivo: "Recibo - 08•2025.pdf", tipo: "mensal" },
    { competencia: "2025-09", arquivo: "895 Recibo - 09•2025.pdf", tipo: "mensal" },
    { competencia: "2025-09", arquivo: "895 Recibo - 09•2025 RETIFICADOS.pdf", tipo: "retificado" },
    { competencia: "2025-10", arquivo: "895 Recibo - 10•2025.pdf", tipo: "mensal" },
    { competencia: "2025-10", funcId: 32, arquivo: "895 RECIBO ELEN 10•2025-10-2025-1.pdf", tipo: "individual" },
    { competencia: "2025-11", arquivo: "895 Recibo - 11•2025.pdf", tipo: "mensal" },
    { competencia: "2025-11", funcId: 32, liquido: 371, bruto: 371, tipo: "13-adiantamento", arquivo: "895 Recibo 1ª parc 13 2025.pdf" },
    { competencia: "2025-12", arquivo: "895 Recibo - 12•2025.pdf", tipo: "mensal" },
    { competencia: "2025-13", arquivo: "895 Recibo - 13•2025.pdf", tipo: "13-salario" },
    { competencia: "2026-01", arquivo: "895 Recibo - 01•2026.pdf", tipo: "mensal" },
    { competencia: "2026-02", arquivo: "895 Recibo - 02•2026.pdf", tipo: "mensal" },
    { competencia: "2026-03", arquivo: "895 Recibo - 03•2026.pdf", tipo: "mensal" },
    { competencia: "2026-04", arquivo: "895 Recibo - 04•2026.pdf", tipo: "mensal" },
    { competencia: "2026-05", arquivo: "895 Recibo - 05•2026.pdf", tipo: "mensal" },
    { competencia: "2026-06", arquivo: "895 Recibo - 06•2026.pdf", tipo: "mensal" },
    { competencia: "2026-07", arquivo: "895 Recibo - 07•2026.pdf", tipo: "mensal" },
    { competencia: "2026-07", funcId: 1, bruto: 1621, inss: 178.31, liquido: 1442.69, tipo: "pro-labore" },
    { competencia: "2026-07", funcId: 32, bruto: 1780.8, vale: 705.5, inss: 135.95, liquido: 939.35, tipo: "mensal", arquivo: "07•2026 Elen Retificado-07-2026-1.pdf" }
];

export const FOLHAS_PONTO = [
    "09.2025", "10.2025", "11.2025", "12.2025",
    "01.2026", "02.2026", "03.2026", "04.2026", "05.2026", "06.2026", "07.2026", "08.2026", "09.2026"
].map((comp) => ({ competencia: comp, arquivo: `895 Folha de Ponto ${comp}.pdf` }));

export function funcionarioPorId(id) {
    return listarFuncionarios().find((f) => String(f.id) === String(id));
}

const RH_EXTRA_KEY = "erp-rh-extra-v1";

function extraVazio() {
    return { funcionarios: [], movimentos: [], ferias: [] };
}

export function lerRhExtra() {
    try {
        const bruto = localStorage.getItem(RH_EXTRA_KEY);
        if (!bruto) {
            return extraVazio();
        }
        return { ...extraVazio(), ...JSON.parse(bruto) };
    } catch {
        return extraVazio();
    }
}

export function gravarRhExtra(dados) {
    localStorage.setItem(RH_EXTRA_KEY, JSON.stringify(dados));
}

export function listarFuncionarios() {
    return [...FUNCIONARIOS_RH, ...lerRhExtra().funcionarios];
}

export function proximaMatricula() {
    const nums = listarFuncionarios().map((f) => Number(f.matricula) || 0);
    return String(Math.max(0, ...nums) + 1).padStart(3, "0");
}

export function salvarFuncionario(ficha) {
    const extra = lerRhExtra();
    extra.funcionarios = extra.funcionarios.filter((f) => f.id !== ficha.id).concat(ficha);
    gravarRhExtra(extra);
    return ficha;
}

export function salvarMovimento(item) {
    const extra = lerRhExtra();
    extra.movimentos = [item, ...(extra.movimentos || [])];
    gravarRhExtra(extra);
    return item;
}

export function movimentosPorTipo(tipo) {
    return (lerRhExtra().movimentos || []).filter((m) => m.tipo === tipo);
}

export function listarFerias() {
    return [...FERIAS, ...(lerRhExtra().ferias || [])];
}

export function salvarFerias(item) {
    const extra = lerRhExtra();
    extra.ferias = [item, ...(extra.ferias || [])];
    gravarRhExtra(extra);
    return item;
}

export function documentosDe(funcId) {
    return DOCUMENTOS_RH.filter((d) => String(d.funcId) === String(funcId));
}

export function documentosEmpresa() {
    return DOCUMENTOS_RH.filter((d) => d.funcId == null);
}

export function holeritesDe(funcId) {
    return HOLERITES.filter((h) => String(h.funcId) === String(funcId));
}

export const SITUACAO = {
    ativo: { nome: "Ativo", classe: "ok" },
    experiencia: { nome: "Experiência", classe: "exp" },
    prolabore: { nome: "Pró-labore", classe: "exp" },
    aviso: { nome: "Aviso prévio", classe: "warn" },
    desligado: { nome: "Desligado", classe: "off" },
    estagiario: { nome: "Estagiário", classe: "exp" }
};
