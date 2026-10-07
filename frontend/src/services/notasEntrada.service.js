import { resource } from "./api";
import { notaVazia } from "../constants/notasEntrada";

const notas = resource("/notas-entrada");

function extrasDe(texto) {
    try {
        const parsed = JSON.parse(texto || "");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed;
        }
    } catch {
        /* texto livre */
    }
    return { observacao: texto || "" };
}

function statusDaApi(status) {
    const valor = String(status || "").toUpperCase();
    if (valor === "RECEBIDA") {
        return "emitida";
    }
    if (valor === "CANCELADA") {
        return "cancelada";
    }
    return "registrada";
}

function statusParaApi(status) {
    if (status === "emitida") {
        return "RECEBIDA";
    }
    if (status === "cancelada") {
        return "CANCELADA";
    }
    return "LANÇADA";
}

function dataIso(valor) {
    if (!valor) {
        return null;
    }
    return String(valor).length <= 10 ? `${valor}T12:00:00` : String(valor).slice(0, 19);
}

export function notaDaApi(raw) {
    const extra = extrasDe(raw?.observacao);
    const base = notaVazia();
    return {
        ...base,
        id: raw?.id,
        numero: raw?.numeroNf || extra.numero || "",
        serie: extra.serie || "1",
        dataEmissao: String(raw?.dataEmissao || extra.dataEmissao || "").slice(0, 10),
        dataEntrada: String(raw?.dataEntrada || extra.dataEntrada || "").slice(0, 10),
        dataEstoque: extra.dataEstoque || String(raw?.dataEntrada || "").slice(0, 10),
        modoDataEstoque: extra.modoDataEstoque || "",
        remetente: extra.remetente || (raw?.fornecedorId ? `Fornecedor #${raw.fornecedorId}` : ""),
        cnpj: extra.cnpj || "",
        uf: extra.uf || "",
        valor: Number(raw?.valorTotal ?? extra.valor ?? 0) || 0,
        chave: extra.chave || "",
        natureza: extra.natureza || "Compra de mercadorias",
        marcadores: extra.marcadores || [],
        observacao: extra.observacao || extra.texto || "",
        status: statusDaApi(raw?.status),
        integracoes: extra.integracoes || ["E"],
        xml: Boolean(extra.xml),
        fornecedorId: raw?.fornecedorId || null
    };
}

export function notaParaApi(nota) {
    const valor = Number(String(nota.valor ?? "0").replace(",", ".")) || 0;
    return {
        id: nota.id || null,
        numeroNf: nota.numero,
        fornecedorId: nota.fornecedorId || null,
        dataEmissao: dataIso(nota.dataEmissao),
        dataEntrada: dataIso(nota.dataEntrada),
        valorProdutos: valor,
        valorFrete: 0,
        valorDesconto: 0,
        valorTotal: valor,
        status: statusParaApi(nota.status),
        observacao: JSON.stringify({
            remetente: nota.remetente,
            uf: nota.uf,
            cnpj: nota.cnpj,
            chave: nota.chave,
            serie: nota.serie,
            natureza: nota.natureza,
            marcadores: nota.marcadores || [],
            integracoes: nota.integracoes || [],
            xml: Boolean(nota.xml),
            dataEstoque: nota.dataEstoque || nota.dataEntrada || "",
            modoDataEstoque: nota.modoDataEstoque || "",
            observacao: nota.observacao || ""
        })
    };
}

export async function listarNotasEntrada() {
    const dados = await notas.list();
    return Array.isArray(dados) ? dados.map(notaDaApi) : [];
}

export async function buscarNotaEntrada(id) {
    return notaDaApi(await notas.get(id));
}

export async function salvarNotaEntrada(nota) {
    return notaDaApi(await notas.create(notaParaApi(nota)));
}

export async function excluirNotaEntrada(id) {
    await notas.remove(id);
}

export async function atualizarNotaEntrada(id, nota) {
    const { default: api } = await import("./api");
    const { data } = await api.put(`/notas-entrada/${id}`, notaParaApi({ ...nota, id }));
    return notaDaApi(data);
}

export async function confirmarNotaEntrada(id, opcoes = {}) {
    const { default: api } = await import("./api");
    const { data } = await api.put(`/notas-entrada/${id}/confirmar`, {
        modoData: opcoes.modoData || "ENTRADA",
        dataMovimento: opcoes.dataMovimento || null
    });
    return notaDaApi(data);
}

export async function estornarNotaEntrada(id) {
    const { default: api } = await import("./api");
    const { data } = await api.put(`/notas-entrada/${id}/estornar`);
    return notaDaApi(data);
}

function dataEstoqueDe(nota, opcoes = {}) {
    const modo = String(opcoes.modoData || "ENTRADA").toUpperCase();
    if (modo === "ATUAL" || modo === "HOJE") {
        return new Date().toISOString().slice(0, 10);
    }
    if (modo === "MANUAL") {
        return String(opcoes.dataMovimento || nota.dataEntrada || "").slice(0, 10);
    }
    return String(nota.dataEntrada || nota.dataEmissao || new Date().toISOString()).slice(0, 10);
}

export async function sincronizarItensNotaEntrada(notaId, itens = []) {
    const { listarItensNota, salvarItemNota } = await import("./notaEntradaItem.service");
    const existentes = await listarItensNota(notaId);
    if (Array.isArray(existentes) && existentes.length) {
        return;
    }
    for (const item of itens) {
        const produtoId = item.produtoId || item.produto_id;
        const quantidade = item.quantidade ?? item.qtd;
        if (!produtoId || quantidade == null) {
            continue;
        }
        await salvarItemNota({
            notaEntradaId: notaId,
            produtoId,
            quantidade,
            valorUnitario: item.valorUnitario ?? (item.preco || item.custo || 0),
            valorTotal: item.valorTotal ?? (item.total || 0)
        });
    }
}

export function aplicarEstoqueNaNota(nota, resultado) {
    return {
        ...nota,
        backendId: resultado.backendId || nota.backendId,
        dataEstoque: resultado.dataEstoque,
        modoDataEstoque: resultado.modoDataEstoque,
        dataEntrada: resultado.modoDataEstoque === "MANUAL" ? resultado.dataEstoque : nota.dataEntrada,
        status: "emitida",
        integracoes: [...new Set([...(nota.integracoes || []), "E", "CC"])]
    };
}

export async function lancarEstoqueNotaEntrada(nota, opcoes = {}) {
    const modoData = opcoes.modoData || "ENTRADA";
    const dataMovimento = dataEstoqueDe(nota, { ...opcoes, modoData });
    let backendId = nota.backendId || null;
    try {
        if (backendId && (nota.integracoes || []).includes("E")) {
            await estornarNotaEntrada(backendId);
        }
        if (backendId) {
            await atualizarNotaEntrada(backendId, { ...nota, id: backendId, dataEstoque: dataMovimento, modoDataEstoque: modoData });
        } else {
            const salvo = await salvarNotaEntrada({ ...nota, dataEstoque: dataMovimento, modoDataEstoque: modoData });
            backendId = salvo.id;
        }
        await sincronizarItensNotaEntrada(backendId, nota.itens || []);
        await confirmarNotaEntrada(backendId, { modoData, dataMovimento });
    } catch {
        /* localStorage segue mesmo se a API não estiver no ar */
    }
    return {
        backendId,
        dataEstoque: dataMovimento,
        modoDataEstoque: modoData
    };
}
