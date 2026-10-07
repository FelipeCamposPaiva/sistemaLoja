import api, { resource } from "./api";
import { contatoVazio, normalizarTipoPessoa } from "../constants/contatos";
import { formatarLimite } from "../constants/mascarasContato";

const clientes = resource("/clientes");

export function contatoDaApi(raw) {
    const base = contatoVazio();
    const tipos = String(raw?.tipo || "cliente")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
    return {
        ...base,
        id: raw?.id,
        nome: raw?.nome || "",
        fantasia: raw?.nomeFantasia || "",
        cpfCnpj: raw?.cpfCnpj || "",
        telefone: raw?.telefone || "",
        celular: raw?.telefone || "",
        email: raw?.email || "",
        endereco: raw?.endereco || "",
        municipio: raw?.cidade || "",
        uf: raw?.estado || "",
        cep: raw?.cep || "",
        limiteCredito: formatarLimite(raw?.limiteCredito),
        inscricaoSuframa: raw?.inscricaoSuframa || "",
        observacoes: raw?.observacoes || "",
        ativo: raw?.ativo !== false,
        excluido: false,
        tipos: tipos.length ? tipos : ["cliente"],
        tipoPessoa: normalizarTipoPessoa(raw?.tipoPessoa) || (String(raw?.cpfCnpj || "").replace(/\D/g, "").length > 11 ? "PJ" : "PF"),
        contribuinte: raw?.contribuinte || "9",
        ie: raw?.ie || "",
        inscricaoMunicipal: raw?.inscricaoMunicipal || "",
        consumidorFinal: raw?.consumidorFinal !== false && raw?.consumidorFinal !== 0,
        finalidade: raw?.finalidade || (String(raw?.contribuinte) === "1" ? "REVENDA" : "CONSUMO"),
        regimeTributario: raw?.regimeTributario || "",
        naturezaOperacaoId: raw?.naturezaOperacaoId || "",
        vendedor: raw?.vendedor || "",
        vendedorId: raw?.vendedorId || "",
        condicaoPagamento: raw?.condicaoPagamento || "",
        diaPagamento: raw?.diaPagamento ? String(raw.diaPagamento) : "",
        listaPreco: raw?.listaPreco || "",
        fundacao: raw?.fundacao || "",
        foto: raw?.foto || "",
        anexos: lerAnexos(raw?.anexos),
        ...dadosPessoaisDe(raw?.dadosPessoais),
        dataCadastro: raw?.dataCadastro || new Date().toISOString(),
        tinyId: raw?.tinyId || null
    };
}

function dadosPessoaisDe(valor) {
    const vazio = {
        estadoCivil: "",
        profissao: "",
        sexo: "",
        nascimento: "",
        naturalidade: "",
        nomePai: "",
        cpfPai: "",
        nomeMae: "",
        cpfMae: "",
        rg: "",
        bairro: "",
        numero: "",
        complemento: "",
        telefone2: "",
        website: "",
        emailNfe: "",
        cobrancaDif: false,
        cepCobranca: "",
        municipioCobranca: "",
        ufCobranca: "",
        enderecoCobranca: "",
        bairroCobranca: "",
        numeroCobranca: "",
        complementoCobranca: "",
        pessoasContato: []
    };
    if (!valor) {
        return vazio;
    }
    try {
        const dados = typeof valor === "string" ? JSON.parse(valor) : valor;
        return {
            ...vazio,
            ...dados,
            cobrancaDif: Boolean(dados?.cobrancaDif),
            pessoasContato: Array.isArray(dados?.pessoasContato) ? dados.pessoasContato : []
        };
    } catch {
        return vazio;
    }
}

function lerAnexos(valor) {
    if (Array.isArray(valor)) {
        return valor;
    }
    if (!valor) {
        return [];
    }
    try {
        const lista = JSON.parse(valor);
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

function texto(valor, max) {
    const s = String(valor || "").trim();
    if (!s) {
        return null;
    }
    return max && s.length > max ? s.slice(0, max) : s;
}

function numeroMoeda(valor) {
    const texto = String(valor ?? "0").trim();
    const normalizado = texto.includes(",")
        ? texto.replace(/\./g, "").replace(",", ".")
        : texto;
    const numero = Number(normalizado.replace(/[^\d.-]/g, ""));
    return Number.isFinite(numero) ? numero : 0;
}

export function contatoParaApi(contato) {
    const limite = numeroMoeda(contato.limiteCredito);
    const tiny = Number(contato.tinyId);
    return {
        id: contato.id || null,
        nome: texto(contato.nome, 150) || "",
        cpfCnpj: texto(contato.cpfCnpj, 20),
        telefone: texto(contato.celular || contato.telefone || contato.telefone2, 20),
        email: texto(contato.email, 150),
        endereco: contato.endereco || null,
        tipo: (contato.tipos || ["cliente"]).join(","),
        nomeFantasia: texto(contato.fantasia, 255),
        cidade: texto(contato.municipio, 100),
        estado: texto(contato.uf, 2),
        cep: texto(contato.cep, 10),
        limiteCredito: Number.isFinite(limite) ? limite : 0,
        observacoes: contato.observacoes || null,
        ativo: contato.ativo !== false,
        tinyId: Number.isInteger(tiny) && tiny > 0 ? tiny : null,
        tipoPessoa: texto(normalizarTipoPessoa(contato.tipoPessoa) || "PF", 20),
        contribuinte: texto(contato.contribuinte, 2) || "9",
        ie: texto(contato.ie, 30),
        inscricaoMunicipal: texto(contato.inscricaoMunicipal, 30),
        inscricaoSuframa: texto(contato.inscricaoSuframa, 20),
        consumidorFinal: contato.consumidorFinal !== false,
        finalidade: texto(contato.finalidade, 20) || "CONSUMO",
        regimeTributario: texto(contato.regimeTributario, 30),
        naturezaOperacaoId: contato.naturezaOperacaoId ? Number(contato.naturezaOperacaoId) : null,
        vendedor: texto(contato.vendedor, 150),
        vendedorId: contato.vendedorId ? Number(contato.vendedorId) : null,
        condicaoPagamento: texto(contato.condicaoPagamento, 80),
        diaPagamento: diaValido(contato.diaPagamento),
        listaPreco: texto(contato.listaPreco, 80),
        fundacao: texto(contato.fundacao, 10),
        foto: contato.foto || null,
        anexos: (contato.anexos || []).length ? JSON.stringify(contato.anexos) : null,
        dadosPessoais: JSON.stringify({
            estadoCivil: contato.estadoCivil || "",
            profissao: contato.profissao || "",
            sexo: contato.sexo || "",
            nascimento: contato.nascimento || "",
            naturalidade: contato.naturalidade || "",
            nomePai: contato.nomePai || "",
            cpfPai: contato.cpfPai || "",
            nomeMae: contato.nomeMae || "",
            cpfMae: contato.cpfMae || "",
            rg: contato.rg || "",
            bairro: contato.bairro || "",
            numero: contato.numero || "",
            complemento: contato.complemento || "",
            telefone: contato.telefone || "",
            telefone2: contato.telefone2 || "",
            celular: contato.celular || "",
            website: contato.website || "",
            emailNfe: contato.emailNfe || "",
            cobrancaDif: Boolean(contato.cobrancaDif),
            cepCobranca: contato.cepCobranca || "",
            municipioCobranca: contato.municipioCobranca || "",
            ufCobranca: contato.ufCobranca || "",
            enderecoCobranca: contato.enderecoCobranca || "",
            bairroCobranca: contato.bairroCobranca || "",
            numeroCobranca: contato.numeroCobranca || "",
            complementoCobranca: contato.complementoCobranca || "",
            pessoasContato: Array.isArray(contato.pessoasContato) ? contato.pessoasContato : []
        })
    };
}

function diaValido(valor) {
    const dia = Number(valor);
    return Number.isInteger(dia) && dia >= 1 && dia <= 31 ? dia : null;
}

export async function listarClientes() {
    const dados = await clientes.list();
    return Array.isArray(dados) ? dados.map(contatoDaApi) : [];
}

export async function buscarCliente(id) {
    return contatoDaApi(await clientes.get(id));
}

export async function salvarCliente(contato) {
    return contatoDaApi(await clientes.create(contatoParaApi(contato)));
}

export async function atualizarCliente(id, contato) {
    return contatoDaApi(await clientes.update(id, contatoParaApi({ ...contato, id })));
}

export async function excluirCliente(id) {
    await clientes.remove(id);
}

function resumoImportacao(corpo, total) {
    const dados = corpo?.data && typeof corpo.data === "object" && "novos" in corpo.data ? corpo.data : corpo;
    return {
        novos: Number(dados?.novos || 0),
        atualizados: Number(dados?.atualizados || 0),
        total: Number(dados?.total ?? total),
        erros: Number(dados?.erros || 0)
    };
}

const TAMANHO_LOTE = 300;

async function enviarLote(payload) {
    try {
        const { data } = await api.post("/clientes/importar", payload, { timeout: 180000 });
        return resumoImportacao(data, payload.length);
    } catch (erro) {
        const status = erro?.response?.status;
        if (status && status !== 404 && status !== 405) {
            throw erro;
        }
        const atuais = await listarClientes();
        let novos = 0;
        let atualizados = 0;
        let erros = 0;
        for (const item of payload) {
            const existe = atuais.find((c) =>
                (item.tinyId && Number(c.tinyId) === Number(item.tinyId))
                || (item.cpfCnpj && c.cpfCnpj && c.cpfCnpj === item.cpfCnpj)
            );
            try {
                if (existe) {
                    const salvo = contatoDaApi(await clientes.update(existe.id, { ...item, id: existe.id }));
                    Object.assign(existe, salvo);
                    atualizados++;
                } else {
                    const criado = contatoDaApi(await clientes.create(item));
                    atuais.push(criado);
                    novos++;
                }
            } catch {
                erros++;
            }
        }
        return { novos, atualizados, total: novos + atualizados, erros };
    }
}

export async function importarClientesLote(lista, onProgress) {
    const payload = (Array.isArray(lista) ? lista : []).map(contatoParaApi).filter((c) => c.nome);
    if (!payload.length) {
        return { novos: 0, atualizados: 0, total: 0, erros: 0 };
    }
    const totais = { novos: 0, atualizados: 0, total: 0, erros: 0 };
    const partes = [];
    for (let i = 0; i < payload.length; i += TAMANHO_LOTE) {
        partes.push(payload.slice(i, i + TAMANHO_LOTE));
    }
    for (let i = 0; i < partes.length; i++) {
        const resumo = await enviarLote(partes[i]);
        totais.novos += resumo.novos;
        totais.atualizados += resumo.atualizados;
        totais.total += resumo.total;
        totais.erros += resumo.erros;
        onProgress?.({
            parte: i + 1,
            partes: partes.length,
            ...totais
        });
    }
    return totais;
}
