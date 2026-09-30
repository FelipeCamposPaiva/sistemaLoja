export const NOTAS_ENTRADA_KEY = "erp-notas-entrada-v1";
export const XML_TERCEIROS_KEY = "erp-nfe-terceiros-v1";
export const CONTINGENCIA_KEY = "erp-nfe-contingencia";

export const STATUS = [
    { id: "todas", nome: "todas" },
    { id: "pendente", nome: "pendentes", cor: "#eab308" },
    { id: "registrada", nome: "registradas", cor: "#38bdf8" },
    { id: "emitida", nome: "emitidas", cor: "#22c55e" },
    { id: "cancelada", nome: "canceladas", cor: "#ef4444" }
];

export const PERIODOS = [
    { id: "7", nome: "últimos 7 dias" },
    { id: "30", nome: "últimos 30 dias" },
    { id: "90", nome: "últimos 90 dias" },
    { id: "sem", nome: "sem filtro de data" }
];

export const CAMPOS_DATA = [
    { id: "emissao", nome: "1ª data de emissão" },
    { id: "entrada", nome: "data de entrada" }
];

export const INTEGRACOES = {
    M: { letra: "M", nome: "Mercado Livre", cor: "#7c3aed" },
    CC: { letra: "CC", nome: "Contas a pagar", cor: "#6d28d9" },
    E: { letra: "E", nome: "Estoque", cor: "#16a34a" },
    D: { letra: "D", nome: "Devolução", cor: "#0ea5e9" },
    P: { letra: "P", nome: "Financeiro", cor: "#ea580c" },
    S: { letra: "S", nome: "Shopee", cor: "#f97316" }
};

function nota(parcial) {
    return {
        serie: "1",
        status: "registrada",
        cnpj: "",
        chave: "",
        marcadores: [],
        integracoes: ["E", "CC"],
        xml: true,
        natureza: "Compra de mercadorias",
        observacao: "",
        dataEntrada: parcial.dataEmissao,
        ...parcial
    };
}

export const NOTAS_INICIAIS = [
    nota({ id: 21, numero: "000203", dataEmissao: "2026-08-21", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 71.93, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000002031234567890", integracoes: ["M", "CC", "E"] }),
    nota({ id: 20, numero: "000202", dataEmissao: "2026-08-21", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 18.94, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000002021234567891", integracoes: ["CC", "E"] }),
    nota({ id: 19, numero: "023878", dataEmissao: "2026-08-20", remetente: "PASCO COMERCIO E SERVICOS LTDA", uf: "SP", valor: 636.48, cnpj: "11.222.333/0001-44", chave: "35260811222333000144550010000238781234567892", integracoes: ["E", "P"] }),
    nota({ id: 18, numero: "000204", dataEmissao: "2026-08-20", remetente: "MSK ARMARINHOS LTDA", uf: "PR", valor: 8.1, cnpj: "08.765.432/0001-11", chave: "41260808765432000111550010000002041234567893", integracoes: ["E"] }),
    nota({ id: 17, numero: "000198", dataEmissao: "2026-08-20", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 16.95, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001981234567894", integracoes: ["M", "E"] }),
    nota({ id: 16, numero: "000197", dataEmissao: "2026-08-20", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 47.9, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001971234567895", integracoes: ["CC", "E"] }),
    nota({ id: 15, numero: "000196", dataEmissao: "2026-08-20", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 23.9, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001961234567896", integracoes: ["E"] }),
    nota({ id: 14, numero: "49241967", dataEmissao: "2026-08-20", remetente: "MSK ARMARINHOS LTDA", uf: "PR", valor: 12.2, cnpj: "08.765.432/0001-11", chave: "41260808765432000111550014924196711234567897", integracoes: ["E", "S"] }),
    nota({ id: 13, numero: "000193", dataEmissao: "2026-08-19", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 35.8, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001931234567898", integracoes: ["CC", "E"] }),
    nota({ id: 12, numero: "000191", dataEmissao: "2026-08-19", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 71.7, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001911234567899", integracoes: ["M", "E"] }),
    nota({ id: 11, numero: "000190", dataEmissao: "2026-08-19", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 47.8, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001901234567900", integracoes: ["E"] }),
    nota({ id: 10, numero: "000188", dataEmissao: "2026-08-18", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 71.7, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001881234567901", integracoes: ["CC", "E", "P"] }),
    nota({ id: 9, numero: "000186", dataEmissao: "2026-08-18", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 23.9, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001861234567902", integracoes: ["E"] }),
    nota({ id: 8, numero: "000185", dataEmissao: "2026-08-18", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 59.7, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001851234567903", integracoes: ["E"] }),
    nota({ id: 7, numero: "49241580", dataEmissao: "2026-08-18", remetente: "MSK ARMARINHOS LTDA", uf: "PR", valor: 32.8, cnpj: "08.765.432/0001-11", chave: "41260808765432000111550014924158011234567904", integracoes: ["E"] }),
    nota({ id: 6, numero: "000181", dataEmissao: "2026-08-17", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 47.8, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001811234567905", integracoes: ["CC", "E"] }),
    nota({ id: 5, numero: "000179", dataEmissao: "2026-08-17", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 35.8, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001791234567906", integracoes: ["E"] }),
    nota({ id: 4, numero: "000176", dataEmissao: "2026-08-14", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 83.6, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001761234567907", integracoes: ["M", "E"] }),
    nota({ id: 3, numero: "000174", dataEmissao: "2026-08-14", remetente: "OFICINA DA ARTE COMERCIO DE ARTESANATO LTDA", uf: "RJ", valor: 23.9, cnpj: "12.345.678/0001-90", chave: "33260812345678000190550010000001741234567908", integracoes: ["E"] }),
    nota({ id: 2, numero: "49242091", dataEmissao: "2026-08-08", remetente: "Natura Cosméticos S/A", uf: "MG", valor: 1697.64, cnpj: "71.673.990/0019-04", chave: "31260871673990001904550010492420911208598360", integracoes: ["E", "CC", "P"], marcadores: ["Natura"], natureza: "Venda merc terc ST" }),
    nota({ id: 1, numero: "110204", dataEmissao: "2026-08-09", remetente: "CAMOL COMERCIO E DISTRIBUIDORA LIMITADA", uf: "MG", valor: 3900.8, cnpj: "04.321.098/0001-55", chave: "31260804321098000155550010001102041234567910", integracoes: ["E", "CC"] })
];

export const XML_TERCEIROS_INICIAIS = [
    {
        id: "xml-1",
        nome: "ESPUMAO PLASTICOS E DERIVADOS LTDA-ME",
        chave: "33260805490416000169550000000001251016664015",
        cnpj: "05.490.416/0001-59",
        dataEmissao: "2026-08-27",
        valor: 26.49,
        uf: "RJ"
    },
    {
        id: "xml-2",
        nome: "CW SP - VOLTA REDONDA",
        chave: "33260809427151002497550010000540581711104375",
        cnpj: "09.427.151/0024-97",
        dataEmissao: "2026-08-24",
        valor: 423,
        uf: "RJ"
    }
];

export function notaVazia() {
    const hoje = new Date().toISOString().slice(0, 10);
    return {
        numero: "",
        serie: "1",
        dataEmissao: hoje,
        dataEntrada: hoje,
        remetente: "",
        cnpj: "",
        uf: "RJ",
        valor: "",
        chave: "",
        natureza: "Compra de mercadorias",
        marcadores: [],
        observacao: "",
        status: "pendente",
        integracoes: [],
        xml: false
    };
}

export function lerNotas() {
    try {
        const bruto = localStorage.getItem(NOTAS_ENTRADA_KEY);
        if (bruto) {
            const lista = JSON.parse(bruto);
            if (Array.isArray(lista) && lista.length) {
                return lista;
            }
        }
    } catch {
        /* ignore */
    }
    return NOTAS_INICIAIS.map((item) => ({ ...item, marcadores: [...(item.marcadores || [])], integracoes: [...(item.integracoes || [])] }));
}

export function gravarNotas(lista) {
    localStorage.setItem(NOTAS_ENTRADA_KEY, JSON.stringify(lista));
}

export function lerXmlTerceiros() {
    try {
        const bruto = localStorage.getItem(XML_TERCEIROS_KEY);
        if (bruto) {
            const lista = JSON.parse(bruto);
            if (Array.isArray(lista)) {
                return lista;
            }
        }
    } catch {
        /* ignore */
    }
    return XML_TERCEIROS_INICIAIS.map((item) => ({ ...item }));
}

export function gravarXmlTerceiros(lista) {
    localStorage.setItem(XML_TERCEIROS_KEY, JSON.stringify(lista));
}

export function proximoId(lista) {
    return lista.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

export function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatarData(iso) {
    if (!iso) {
        return "—";
    }
    const [ano, mes, dia] = String(iso).slice(0, 10).split("-");
    if (!dia) {
        return iso;
    }
    return `${dia}/${mes}/${ano}`;
}

export function lerContingencia() {
    try {
        return localStorage.getItem(CONTINGENCIA_KEY) === "1";
    } catch {
        return false;
    }
}

export function gravarContingencia(ativo) {
    localStorage.setItem(CONTINGENCIA_KEY, ativo ? "1" : "0");
}

function xmlSemPrefixo(texto) {
    return String(texto || "").replace(/<\/?([\w.-]+):/g, (m) => (m.startsWith("</") ? "</" : "<"));
}

function nomeTag(nome) {
    return String(nome || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tagXml(texto, nome) {
    const n = nomeTag(nome);
    const bloco = String(texto || "").match(new RegExp(`<(?:[\\w.-]+:)?${n}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?${n}>`, "i"));
    if (!bloco) {
        return "";
    }
    return bloco[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
        .replace(/<[^>]+>/g, "")
        .trim();
}

function blocoXml(texto, nome) {
    const n = nomeTag(nome);
    const bloco = String(texto || "").match(new RegExp(`<(?:[\\w.-]+:)?${n}(?:\\s[^>]*)?>[\\s\\S]*?</(?:[\\w.-]+:)?${n}>`, "i"));
    return bloco ? bloco[0] : "";
}

function numeroXml(valor) {
    return Number(String(valor || "0").replace(",", ".")) || 0;
}

export function formatarDocumento(valor) {
    const d = String(valor || "").replace(/\D/g, "");
    if (d.length === 14) {
        return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
    }
    if (d.length === 11) {
        return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    }
    return valor || "";
}

export function formatarCep(valor) {
    const d = String(valor || "").replace(/\D/g, "");
    if (d.length === 8) {
        return `${d.slice(0, 5)}-${d.slice(5)}`;
    }
    return valor || "";
}

export function formatarHora(iso) {
    const t = String(iso || "");
    if (t.includes("T") && t.length >= 19) {
        return t.slice(11, 19);
    }
    if (/^\d{2}:\d{2}/.test(t)) {
        return t.length >= 8 ? t.slice(0, 8) : `${t}:00`;
    }
    return t || "00:00:00";
}

export function formatarQtd(valor, casas = 4) {
    return Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function formatarPreco(valor, casas = 5) {
    return Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

const MEIOS_PAG = {
    "01": "Dinheiro",
    "02": "Cheque",
    "03": "Cartão de Crédito",
    "04": "Cartão de Débito",
    "05": "Crédito Loja",
    "15": "Boleto Bancário",
    "17": "PIX",
    "90": "Sem pagamento"
};

const FRETES = {
    "0": "Contratação do Frete por conta do Remetente (CIF)",
    "1": "Contratação do Frete por conta do Destinatário (FOB)",
    "2": "Contratação do Frete por conta de Terceiros",
    "3": "Transporte Próprio por conta do Remetente",
    "4": "Transporte Próprio por conta do Destinatário",
    "9": "Sem Ocorrência de Transporte"
};

const FINALIDADES = { "1": "NF-e normal", "2": "NF-e complementar", "3": "NF-e de ajuste", "4": "Devolução de mercadoria" };
const REGIMES = { "1": "Simples Nacional", "2": "Simples Nacional — excesso de sublimite", "3": "Regime normal" };

export function grupoProdutoNfe(nome, ncm) {
    const n = String(nome || "").toUpperCase();
    const c = String(ncm || "");
    if (/REVISTA|REV ESP|GUIA |CARTA /.test(n)) {
        return "PAPELARIA";
    }
    if (/SACOLA|CAIXA DE PRESENTE/.test(n)) {
        return "PRESENTE";
    }
    if (/SAB |SABBAR/.test(n) || c.startsWith("3401")) {
        return "UTILIDADES";
    }
    return "MAQUIAGEM";
}

function linhasXmlNota(texto, emitente) {
    const marca = /natura/i.test(emitente) ? "Natura" : (emitente || "");
    return [...String(texto || "").matchAll(/<(?:[\w.-]+:)?det\b[^>]*>[\s\S]*?<\/(?:[\w.-]+:)?det>/gi)].map((m, i) => {
        const bloco = m[0];
        const prod = blocoXml(bloco, "prod") || bloco;
        const icms = blocoXml(bloco, "ICMS") || bloco;
        const ipi = blocoXml(bloco, "IPI") || bloco;
        const cofins = blocoXml(bloco, "COFINS") || bloco;
        const pis = blocoXml(bloco, "PIS") || bloco;
        const nome = tagXml(prod, "xProd");
        const ncm = tagXml(prod, "NCM");
        const ean = tagXml(prod, "cEAN");
        const cProd = (tagXml(prod, "cProd") || "").replace(/^0+/, "") || tagXml(prod, "cProd");
        const qtd = numeroXml(tagXml(prod, "qCom"));
        const vUn = numeroXml(tagXml(prod, "vUnCom"));
        const vProd = numeroXml(tagXml(prod, "vProd"));
        const vItem = numeroXml(tagXml(bloco, "vItem")) || vProd;
        const grupo = grupoProdutoNfe(nome, ncm);
        return {
            nItem: Number(tagXml(bloco, "nItem") || i + 1),
            sku: cProd,
            gtin: ean && !/^SEM\s*GTIN$/i.test(ean) ? ean.replace(/\D/g, "") : "",
            codigoFornecedor: cProd,
            nome,
            unidade: tagXml(prod, "uCom") || "UN",
            ncm,
            cest: tagXml(prod, "CEST"),
            cfop: tagXml(prod, "CFOP"),
            grupo,
            categoria: grupo,
            marca,
            fornecedor: emitente,
            qtd,
            preco: vUn,
            total: vProd,
            custo: qtd ? Math.round((vItem / qtd) * 100) / 100 : 0,
            estoque: qtd,
            ativo: true,
            tipo: "simples",
            cst: tagXml(icms, "CST"),
            pIcms: numeroXml(tagXml(icms, "pICMS")),
            vIcms: numeroXml(tagXml(icms, "vICMS")),
            pIpi: numeroXml(tagXml(ipi, "pIPI")),
            vIpi: numeroXml(tagXml(ipi, "vIPI")),
            vCofins: numeroXml(tagXml(cofins, "vCOFINS")),
            vPis: numeroXml(tagXml(pis, "vPIS")),
            id: cProd ? `nfe-${cProd}-${i + 1}` : `nfe-item-${i + 1}`
        };
    });
}

export function agregarItensNfe(linhas) {
    const mapa = new Map();
    (linhas || []).forEach((item) => {
        const key = item.gtin || item.sku || item.nome;
        const atual = mapa.get(key);
        if (!atual) {
            mapa.set(key, { ...item, id: item.sku ? `nfe-${item.sku}` : item.id });
            return;
        }
        const total = atual.custo * atual.qtd + item.custo * item.qtd;
        atual.qtd += item.qtd;
        atual.estoque = atual.qtd;
        atual.total = Number(atual.total || 0) + Number(item.total || 0);
        atual.custo = atual.qtd ? Math.round((total / atual.qtd) * 100) / 100 : 0;
    });
    return [...mapa.values()];
}

export function parseXmlNota(texto, nomeArquivo) {
    texto = xmlSemPrefixo(texto);
    const emit = blocoXml(texto, "emit");
    const dest = blocoXml(texto, "dest");
    const ide = blocoXml(texto, "ide");
    const total = blocoXml(texto, "ICMSTot") || blocoXml(texto, "total");
    const prot = blocoXml(texto, "infProt");
    const endereco = blocoXml(emit, "enderEmit") || emit;
    const destEnd = blocoXml(dest, "enderDest") || dest;
    const transp = blocoXml(texto, "transp");
    const transporta = blocoXml(transp, "transporta");
    const vol = blocoXml(transp, "vol");
    const cobr = blocoXml(texto, "cobr");
    const pag = blocoXml(texto, "pag");
    const infAdic = blocoXml(texto, "infAdic");
    const chave =
        (texto.match(/Id=["']NFe(\d{44})["']/i) || [])[1] ||
        tagXml(prot, "chNFe") ||
        tagXml(texto, "chNFe") ||
        "";
    const numero = tagXml(ide, "nNF") || tagXml(texto, "nCT") || String(nomeArquivo || "").replace(/\.[^.]+$/, "");
    const dataBruta = tagXml(ide, "dhEmi") || tagXml(texto, "dEmi");
    const dataEmissao = dataBruta ? dataBruta.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const horaEmissao = formatarHora(dataBruta);
    const remetente = tagXml(emit, "xNome") || nomeArquivo || "XML importado";
    const itens = linhasXmlNota(texto, remetente);
    const duplicatas = [...(cobr || "").matchAll(/<dup\b[^>]*>[\s\S]*?<\/dup>/gi)].map((m) => {
        const bloco = m[0];
        const venc = tagXml(bloco, "dVenc");
        const dias = dataEmissao && venc
            ? Math.round((new Date(`${venc}T12:00:00`) - new Date(`${dataEmissao}T12:00:00`)) / 86400000)
            : 0;
        return {
            numero: tagXml(bloco, "nDup"),
            vencimento: venc,
            valor: numeroXml(tagXml(bloco, "vDup")),
            dias: Number.isFinite(dias) ? dias : 0
        };
    });
    const tPag = tagXml(pag, "tPag");
    return {
        numero: numero || "s/n",
        serie: tagXml(ide, "serie") || "1",
        dataEmissao,
        dataEntrada: dataEmissao,
        horaEmissao,
        horaEntrada: horaEmissao,
        remetente,
        cnpj: formatarDocumento(tagXml(emit, "CNPJ") || tagXml(emit, "CPF")),
        uf: tagXml(endereco, "UF") || "",
        valor: numeroXml(tagXml(total, "vNF") || tagXml(texto, "vTPrest")),
        chave,
        natureza: tagXml(ide, "natOp") || "Importação XML",
        xml: true,
        status: "registrada",
        integracoes: ["E", "CC"],
        tipoEntrada: "XML de NFe",
        finalidade: FINALIDADES[tagXml(ide, "finNFe")] || "NF-e normal",
        regime: REGIMES[tagXml(emit, "CRT")] || "Regime normal",
        consumidorFinal: tagXml(ide, "indFinal") === "1" ? "Sim" : "Não",
        intermediador: tagXml(ide, "indIntermed") === "1" ? "Operação em site ou plataforma" : "Sem intermediador",
        emitente: {
            nome: remetente,
            fantasia: tagXml(emit, "xFant"),
            tipoPessoa: tagXml(emit, "CNPJ") ? "Jurídica" : "Física",
            contribuinte: tagXml(emit, "IE") ? "Contribuinte" : "Não informado",
            cnpj: formatarDocumento(tagXml(emit, "CNPJ") || tagXml(emit, "CPF")),
            ie: tagXml(emit, "IE"),
            cep: formatarCep(tagXml(endereco, "CEP")),
            cidade: tagXml(endereco, "xMun"),
            uf: tagXml(endereco, "UF"),
            endereco: tagXml(endereco, "xLgr"),
            bairro: tagXml(endereco, "xBairro"),
            numero: tagXml(endereco, "nro"),
            complemento: tagXml(endereco, "xCpl"),
            fone: tagXml(endereco, "fone")
        },
        destinatario: {
            nome: tagXml(dest, "xNome"),
            cnpj: formatarDocumento(tagXml(dest, "CNPJ") || tagXml(dest, "CPF")),
            cidade: tagXml(destEnd, "xMun"),
            uf: tagXml(destEnd, "UF")
        },
        itens,
        totais: {
            vProd: numeroXml(tagXml(total, "vProd")),
            vFrete: numeroXml(tagXml(total, "vFrete")),
            vSeg: numeroXml(tagXml(total, "vSeg")),
            vBC: numeroXml(tagXml(total, "vBC")),
            vICMS: numeroXml(tagXml(total, "vICMS")),
            vBCST: numeroXml(tagXml(total, "vBCST")),
            vST: numeroXml(tagXml(total, "vST")),
            vIPI: numeroXml(tagXml(total, "vIPI")),
            vDesc: numeroXml(tagXml(total, "vDesc")),
            vOutro: numeroXml(tagXml(total, "vOutro")),
            vFCP: numeroXml(tagXml(total, "vFCP")),
            vFCPST: numeroXml(tagXml(total, "vFCPST")),
            vFCPSTRet: numeroXml(tagXml(total, "vFCPSTRet")),
            vNF: numeroXml(tagXml(total, "vNF")),
            nItens: itens.length
        },
        transporte: {
            frete: FRETES[tagXml(transp, "modFrete")] || FRETES["9"],
            nome: tagXml(transporta, "xNome"),
            cnpj: formatarDocumento(tagXml(transporta, "CNPJ") || tagXml(transporta, "CPF")),
            ie: tagXml(transporta, "IE"),
            endereco: tagXml(transporta, "xEnder"),
            municipio: tagXml(transporta, "xMun"),
            uf: tagXml(transporta, "UF"),
            qVol: tagXml(vol, "qVol") || "0",
            especie: tagXml(vol, "esp") || "VOLUMES",
            nVol: tagXml(vol, "nVol") || "1/1",
            pesoB: numeroXml(tagXml(vol, "pesoB")),
            pesoL: numeroXml(tagXml(vol, "pesoL"))
        },
        pagamento: {
            condicao: duplicatas.map((d) => d.dias).filter((d) => d > 0).join(" ") || "À vista",
            categoria: "Compras",
            meio: MEIOS_PAG[tPag] || "Boleto Bancário",
            destino: "Contas a Pagar"
        },
        duplicatas,
        observacao: tagXml(infAdic, "infCpl").replace(/\s+/g, " ").trim(),
        infFisco: tagXml(infAdic, "infAdFisco")
    };
}

export function garantirNotaImportada(parsed, listaAtual) {
    const atual = Array.isArray(listaAtual) ? listaAtual : lerNotas();
    if (parsed.chave && atual.some((n) => n.chave === parsed.chave)) {
        return { lista: atual, nova: false };
    }
    const nova = {
        ...parsed,
        id: proximoId(atual),
        marcadores: parsed.marcadores?.length ? parsed.marcadores : (parsed.remetente ? [parsed.remetente.split(" ")[0]] : [])
    };
    const lista = [nova, ...atual];
    gravarNotas(lista);
    return { lista, nova: true };
}
