import api, { resource } from "./api";
import { contatoVazio } from "../constants/contatos";

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
        limiteCredito: raw?.limiteCredito == null ? "0" : String(raw.limiteCredito),
        observacoes: raw?.observacoes || "",
        ativo: raw?.ativo !== false,
        excluido: false,
        tipos: tipos.length ? tipos : ["cliente"],
        tipoPessoa: raw?.tipoPessoa || (String(raw?.cpfCnpj || "").replace(/\D/g, "").length > 11 ? "juridica" : "fisica"),
        contribuinte: raw?.contribuinte || "9",
        ie: raw?.ie || "",
        consumidorFinal: raw?.consumidorFinal !== false && raw?.consumidorFinal !== 0,
        finalidade: raw?.finalidade || (String(raw?.contribuinte) === "1" ? "REVENDA" : "CONSUMO"),
        regimeTributario: raw?.regimeTributario || "",
        naturezaOperacaoId: raw?.naturezaOperacaoId || "",
        dataCadastro: raw?.dataCadastro || new Date().toISOString(),
        tinyId: raw?.tinyId || null
    };
}

function texto(valor, max) {
    const s = String(valor || "").trim();
    if (!s) {
        return null;
    }
    return max && s.length > max ? s.slice(0, max) : s;
}

export function contatoParaApi(contato) {
    const limite = Number(String(contato.limiteCredito ?? "0").replace(",", "."));
    const tiny = Number(contato.tinyId);
    return {
        id: contato.id || null,
        nome: texto(contato.nome, 150) || "",
        cpfCnpj: texto(contato.cpfCnpj, 20),
        telefone: texto(contato.celular || contato.telefone, 20),
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
        tipoPessoa: texto(contato.tipoPessoa, 20),
        contribuinte: texto(contato.contribuinte, 2) || "9",
        ie: texto(contato.ie, 30),
        consumidorFinal: contato.consumidorFinal !== false,
        finalidade: texto(contato.finalidade, 20) || "CONSUMO",
        regimeTributario: texto(contato.regimeTributario, 30),
        naturezaOperacaoId: contato.naturezaOperacaoId ? Number(contato.naturezaOperacaoId) : null
    };
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
