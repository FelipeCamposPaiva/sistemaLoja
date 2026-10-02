export const CONTATOS_KEY = "erp-contatos-v2";

export const TIPOS = [
    { id: "cliente", nome: "cliente" },
    { id: "fornecedor", nome: "fornecedor" },
    { id: "transportador", nome: "transportador" },
    { id: "funcionario", nome: "funcionário" },
    { id: "outro", nome: "outro" }
];

export const TIPOS_PESSOA = [
    { id: "juridica", nome: "Pessoa Jurídica" },
    { id: "fisica", nome: "Pessoa Física" },
    { id: "estrangeiro", nome: "Estrangeiro" },
    { id: "estrangeiro_br", nome: "Estrangeiro no Brasil" }
];

export const CONTRIBUINTES = [
    { id: "1", nome: "1 - Contribuinte ICMS" },
    { id: "2", nome: "2 - Contribuinte isento de Inscrição no cadastro de Contribuintes do ICMS" },
    { id: "9", nome: "9 - Não Contribuinte, que pode ou não possuir Inscrição Estadual no Cadastro de Contribuintes do ICMS" }
];

export const ESTADOS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO"
];

const VR = { cidade: "Volta Redonda", uf: "RJ" };

function item(parcial) {
    return {
        fantasia: "",
        tipoPessoa: "fisica",
        cpfCnpj: "",
        rg: "",
        ie: "",
        contribuinte: "9",
        tipos: ["cliente"],
        cep: "",
        municipio: VR.cidade,
        uf: VR.uf,
        endereco: "",
        bairro: "",
        numero: "",
        complemento: "",
        telefone: "",
        telefone2: "",
        celular: "",
        website: "",
        email: "",
        emailNfe: "",
        observacoes: "",
        estadoCivil: "",
        profissao: "",
        sexo: "",
        nascimento: "",
        naturalidade: "",
        nomePai: "",
        cpfPai: "",
        nomeMae: "",
        cpfMae: "",
        statusCrm: "Cliente",
        vendedor: "",
        condicaoPagamento: "",
        listaPreco: "",
        limiteCredito: "0",
        consumidorFinal: true,
        finalidade: "CONSUMO",
        regimeTributario: "",
        naturezaOperacaoId: "",
        dataCadastro: "2024-03-12T12:00:00.000Z",
        ativo: true,
        excluido: false,
        pessoasContato: [],
        anexos: [],
        ...parcial
    };
}

export const CONTATOS_INICIAIS = [
    item({ id: 1, nome: "ADELINE CAMPOS SILVA", tipos: ["funcionario"], celular: "(24) 99872-1402", cpfCnpj: "091.044.527-39", dataCadastro: "2018-01-10T12:00:00.000Z" }),
    item({ id: 2372, nome: "MATHEUS REIS DE COUTO", tipos: ["outro"], municipio: "Osasco", uf: "SP", celular: "(11) 97635-8348", ativo: false, dataCadastro: "2025-06-01T12:00:00.000Z" }),
    item({ id: 23, nome: "ARTHUR BRITO DE JESUS", tipos: ["funcionario"], celular: "(24) 99335-2313" }),
    item({
        id: 32,
        nome: "ELEN LACERDA CLARO",
        tipos: ["funcionario"],
        celular: "(24) 99984-6374",
        profissao: "Vendedora",
        matricula: "001",
        ctps: "12063091/722",
        depto: "001 - GERAL"
    }),
    item({ id: 90, nome: "FELIPE CAMPOS PAIVA", tipos: ["funcionario", "cliente"], celular: "(24) 99863-0400", email: "felipe@temdetudovr.com.br" }),
    item({ id: 2401, nome: "AILEMA CAMARGO REIS", tipos: ["funcionario"], profissao: "Vendedora", matricula: "010" }),
    item({ id: 2402, nome: "PAMELLA CHRISTINA DE OLIVEIRA RESENDE", tipos: ["funcionario"], profissao: "Vendedora", matricula: "011" }),
    item({ id: 104, nome: "GABRIEL IVAN CAMPOS DIAS", tipos: ["funcionario"], cpfCnpj: "211.061.607-54", profissao: "Auxiliar designer", matricula: "007", nascimento: "2008-07-02" }),
    item({ id: 105, nome: "GABRIELA FERREIRA DE PAULA", tipos: ["funcionario"], email: "gabriela@temdetudovr.com.br", celular: "(24) 98812-4410", profissao: "Vendedora", matricula: "005", cpfCnpj: "101.670.357-03", nascimento: "1999-09-23" }),
    item({ id: 2194, nome: "MARIA ANTONIA DOS SANTOS ZORGDRAGER", tipos: ["funcionario"], email: "maria.antonia@temdetudovr.com.br", celular: "(24) 99210-7788", cpfCnpj: "143.875.117-61", profissao: "Vendedora", matricula: "006", nascimento: "2007-02-19" }),
    item({ id: 216, nome: "NADIA CRISTINA LOPES DO CARMO CORDEIRO", tipos: ["funcionario"], celular: "(24) 99966-6519", cpfCnpj: "184.970.437-66", profissao: "Vendedora", matricula: "002", ativo: false }),
    item({ id: 3, nome: "LEONAM RAFAEL DE FREITAS BEZERRA", tipos: ["funcionario"], cpfCnpj: "120.757.807-06", profissao: "Designer gráfico", matricula: "003", endereco: "Av. Visconde do Rio Branco, 241", bairro: "Água Limpa", ativo: false, nascimento: "1995-08-10" }),
    item({ id: 2505, nome: "ANDJARA", tipos: ["funcionario"], profissao: "Colaborador", matricula: "016", ativo: false }),
    item({ id: 2506, nome: "JOELMA TULLER", tipos: ["funcionario"], profissao: "Colaborador", matricula: "017", ativo: false }),
    item({ id: 2508, nome: "LAISA AMARAL", tipos: ["funcionario"], profissao: "Colaborador", matricula: "019", ativo: false }),
    item({ id: 2509, nome: "CARMEM BEATRIZ", tipos: ["funcionario"], profissao: "Colaborador", matricula: "020", ativo: false }),
    item({ id: 2510, nome: "ANA JULIA DE SOUZA OLIVEIRA", tipos: ["funcionario"], profissao: "Colaborador", matricula: "021" }),
    item({ id: 2513, nome: "GABRIELA RIBEIRO MELLO DE LIMA", tipos: ["funcionario"], profissao: "Colaborador", matricula: "024", ativo: false }),
    item({ id: 2502, nome: "SABRINA", tipos: ["funcionario"], profissao: "Colaborador", matricula: "013", ativo: false }),
    item({ id: 2503, nome: "MEIRIELE", tipos: ["funcionario"], profissao: "Colaborador", matricula: "014", ativo: false }),
    item({ id: 2507, nome: "MARINA", tipos: ["funcionario"], profissao: "Colaborador", matricula: "018", ativo: false }),
    item({ id: 2305, nome: "CAIO CLEMENTE DOS SANTOS", tipos: ["outro"], municipio: "Suzano", uf: "SP", celular: "(11) 96540-2211", ativo: false }),
    item({ id: 2381, nome: "AROMA DAS AGUAS PERFUMARIA E COSMETICOS LTDA", fantasia: "Aroma das Águas", tipos: ["outro", "fornecedor"], tipoPessoa: "juridica", cpfCnpj: "28.441.902/0001-10", municipio: "São Paulo", uf: "SP" }),
    item({ id: 2101, nome: "COMPRECANECAS LTDA", tipos: ["outro", "cliente"], tipoPessoa: "juridica", municipio: "São Paulo", uf: "SP" }),
    item({ id: 2102, nome: "COMPROU CHEGOU BRASIL", tipos: ["outro"], tipoPessoa: "juridica", municipio: "Barra Mansa", uf: "RJ", celular: "(24) 98145-4186" }),
    item({ id: 88, nome: "ACCO BRANDS BRASIL LTDA", tipos: ["fornecedor"], tipoPessoa: "juridica", cpfCnpj: "54.115.777/0001-07", municipio: "São Paulo", uf: "SP" }),
    item({ id: 44, nome: "JESSICA POLI SUGIMOTO SHIRABE", tipos: ["cliente"], municipio: "São Paulo", uf: "SP", celular: "(11) 98765-4321" }),
    item({ id: 12, nome: "PAPELARIA CENTRAL LTDA", fantasia: "Papelaria Central", tipos: ["cliente", "fornecedor"], tipoPessoa: "juridica", cpfCnpj: "12.345.678/0001-90", celular: "(24) 3342-1100" }),
    item({ id: 15, nome: "ESCOLA HORIZONTE", tipos: ["cliente"], tipoPessoa: "juridica", celular: "(24) 3348-9000", email: "compras@escolahorizonte.com.br" }),
    item({ id: 18, nome: "GRAFICA RIO SUL", tipos: ["fornecedor"], tipoPessoa: "juridica", municipio: "Barra Mansa", uf: "RJ", celular: "(24) 3322-4455" }),
    item({ id: 19, nome: "DISTRIBUIDORA SUL FLUMINENSE", tipos: ["fornecedor"], tipoPessoa: "juridica", municipio: "Resende", uf: "RJ" }),
    item({ id: 21, nome: "TRANSPORTADORA VR LOG", tipos: ["transportador"], tipoPessoa: "juridica", celular: "(24) 3333-8080" }),
    item({ id: 22, nome: "RAPIDO SERRA EXPRESS", tipos: ["transportador"], tipoPessoa: "juridica", municipio: "Barra Mansa", uf: "RJ", celular: "(24) 3321-7000" }),
    item({ id: 25, nome: "CANCELLA & SANTOS CONTABILIDADE LTDA", tipos: ["fornecedor"], tipoPessoa: "juridica", celular: "(24) 3342-5500" }),
    item({ id: 30, nome: "PREFEITURA MUNICIPAL DE VOLTA REDONDA", tipos: ["cliente"], tipoPessoa: "juridica" }),
    item({ id: 41, nome: "MARIA DAS GRACAS OLIVEIRA", tipos: ["cliente"], celular: "(24) 98877-1122" }),
    item({ id: 50, nome: "JOAO PEDRO ALVES", tipos: ["cliente"], celular: "(24) 99911-2233" }),
    item({ id: 55, nome: "LIVRARIA PONTO FINAL", tipos: ["cliente"], tipoPessoa: "juridica", fantasia: "Ponto Final" }),
    item({ id: 60, nome: "FORNECEDORA ABC EMBALAGENS", tipos: ["fornecedor"], tipoPessoa: "juridica", municipio: "São Paulo", uf: "SP" }),
    item({ id: 70, nome: "CORREIOS SEDEX PARCEIRO", tipos: ["transportador"], tipoPessoa: "juridica" }),
    item({ id: 80, nome: "ASSOCIACAO COMERCIAL DE VR", tipos: ["outro"], tipoPessoa: "juridica" }),
    item({ id: 81, nome: "SINDICATO DO COMERCIO", tipos: ["outro"], tipoPessoa: "juridica" })
];

export function contatoVazio() {
    return item({
        id: null,
        nome: "",
        municipio: "",
        uf: "",
        tipos: ["cliente"],
        dataCadastro: new Date().toISOString()
    });
}

export function lerContatos() {
    try {
        const bruto = localStorage.getItem(CONTATOS_KEY);
        if (bruto) {
            const lista = JSON.parse(bruto);
            if (Array.isArray(lista) && lista.length) {
                return lista;
            }
        }
    } catch {
        /* ignore */
    }
    return CONTATOS_INICIAIS.map((c) => ({ ...c }));
}

export function gravarContatos(lista) {
    localStorage.setItem(CONTATOS_KEY, JSON.stringify(lista));
}

export function proximoId(lista) {
    return lista.reduce((max, itemAtual) => Math.max(max, Number(itemAtual.id) || 0), 0) + 1;
}

export function rotuloTipo(id) {
    return TIPOS.find((t) => t.id === id)?.nome || id;
}
