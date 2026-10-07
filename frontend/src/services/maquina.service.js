import api, { resource } from "./api";

const maquinas = resource("/maquinas");

function dataIso(valor) {
    if (!valor) {
        return "";
    }
    if (Array.isArray(valor) && valor.length >= 3) {
        const [ano, mes, dia] = valor;
        return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    }
    return String(valor).slice(0, 10);
}

function dataHoraIso(valor) {
    if (!valor) {
        return "";
    }
    if (Array.isArray(valor) && valor.length >= 3) {
        const [ano, mes, dia, hora = 0, min = 0] = valor;
        return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}T${String(hora).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }
    return String(valor).slice(0, 16);
}

function num(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
}

export function maquinaDaApi(raw) {
    return {
        id: raw?.id,
        nome: raw?.nome || "",
        detalhe: raw?.detalhe || "",
        tipo: raw?.tipo || "Impressora",
        modelo: raw?.modelo || "",
        marca: raw?.marca || "",
        numeroSerie: raw?.numeroSerie || "",
        localizacao: raw?.localizacao || "",
        status: raw?.status || "operacao",
        proxManutencao: dataIso(raw?.proxManutencao),
        previsaoRetorno: dataIso(raw?.previsaoRetorno),
        horasUso: Number(raw?.horasUso || 0),
        ultimaUtilizacao: dataHoraIso(raw?.ultimaUtilizacao),
        bemId: raw?.bemId || null,
        valorCompra: num(raw?.valorCompra),
        dataCompra: dataIso(raw?.dataCompra),
        fornecedor: raw?.fornecedor || "",
        fornecedorId: raw?.fornecedorId || null,
        notaEntradaId: raw?.notaEntradaId || null,
        notaFiscal: raw?.notaFiscal || "",
        garantiaAte: dataIso(raw?.garantiaAte),
        energiaKwh: num(raw?.energiaKwh),
        energiaValor: num(raw?.energiaValor),
        materialMedia: num(raw?.materialMedia),
        materialUnidade: raw?.materialUnidade || "",
        materialValor: num(raw?.materialValor),
        observacao: raw?.observacao || "",
        codigoPublico: raw?.codigoPublico || "",
        fotoCapa: raw?.fotoCapa || "",
        nivelMedio: raw?.nivelMedio == null ? null : num(raw.nivelMedio),
        qtdManutencoes: Number(raw?.qtdManutencoes || 0)
    };
}

function maquinaParaApi(maquina) {
    const uso = maquina.ultimaUtilizacao || "";
    return {
        nome: maquina.nome,
        detalhe: maquina.detalhe || "",
        tipo: maquina.tipo || "Impressora",
        modelo: maquina.modelo || "",
        marca: maquina.marca || "",
        numeroSerie: maquina.numeroSerie || "",
        localizacao: maquina.localizacao || "",
        status: maquina.status || "operacao",
        proxManutencao: maquina.proxManutencao || null,
        previsaoRetorno: maquina.previsaoRetorno || null,
        horasUso: Number(maquina.horasUso || 0),
        ultimaUtilizacao: uso ? (uso.length === 16 ? `${uso}:00` : uso) : null,
        bemId: maquina.bemId || null,
        valorCompra: num(maquina.valorCompra),
        dataCompra: maquina.dataCompra || null,
        fornecedor: maquina.fornecedor || "",
        fornecedorId: maquina.fornecedorId || null,
        notaEntradaId: maquina.notaEntradaId || null,
        notaFiscal: maquina.notaFiscal || "",
        garantiaAte: maquina.garantiaAte || null,
        energiaKwh: num(maquina.energiaKwh),
        energiaValor: num(maquina.energiaValor),
        materialMedia: num(maquina.materialMedia),
        materialUnidade: maquina.materialUnidade || "",
        materialValor: num(maquina.materialValor),
        observacao: maquina.observacao || ""
    };
}

function consumivelDaApi(raw) {
    return {
        id: raw?.id,
        nome: raw?.nome || "",
        atual: num(raw?.atual),
        capacidade: num(raw?.capacidade),
        unidade: raw?.unidade || "ml",
        cor: raw?.cor || "#6b7280"
    };
}

function manutencaoDaApi(raw) {
    return {
        id: raw?.id,
        data: dataIso(raw?.data),
        tipo: raw?.tipo || "Corretiva",
        descricao: raw?.descricao || "",
        responsavel: raw?.responsavel || "",
        custo: num(raw?.custo),
        status: raw?.status || "Em andamento",
        previsaoRetorno: dataIso(raw?.previsaoRetorno),
        peca: raw?.peca || "",
        fotos: Array.isArray(raw?.fotos) ? raw.fotos : [],
        fotosNovas: [],
        fotosRemovidas: []
    };
}

export function fichaDaApi(raw) {
    return {
        maquina: maquinaDaApi(raw?.maquina || {}),
        fotos: Array.isArray(raw?.fotos) ? raw.fotos : [],
        consumiveis: Array.isArray(raw?.consumiveis) ? raw.consumiveis.map(consumivelDaApi) : [],
        manutencoes: Array.isArray(raw?.manutencoes) ? raw.manutencoes.map(manutencaoDaApi) : [],
        documentos: Array.isArray(raw?.documentos) ? raw.documentos : [],
        checklist: Array.isArray(raw?.checklist)
            ? raw.checklist.map((item) => ({
                ...item,
                ultimaExecucao: dataIso(item?.ultimaExecucao),
                proxima: dataIso(item?.proxima)
            }))
            : [],
        cronograma: Array.isArray(raw?.cronograma)
            ? raw.cronograma.map((item) => ({ ...item, data: dataIso(item?.data) }))
            : [],
        vinculos: raw?.vinculos || { nota: null, bem: null, ordens: [] }
    };
}

export async function listarMaquinas() {
    const dados = await maquinas.list();
    return Array.isArray(dados) ? dados.map(maquinaDaApi) : [];
}

export async function salvarMaquina(maquina) {
    const corpo = maquinaParaApi(maquina);
    if (maquina?.id) {
        return maquinaDaApi(await maquinas.update(maquina.id, corpo));
    }
    return maquinaDaApi(await maquinas.create(corpo));
}

export async function excluirMaquinaApi(id) {
    await maquinas.remove(id);
}

export async function buscarFichaMaquina(id) {
    const { data } = await api.get(`/maquinas/${id}/ficha`);
    return fichaDaApi(data);
}

async function enviarArquivo(url, arquivo) {
    const corpo = new FormData();
    corpo.append("arquivo", arquivo);
    const { data } = await api.post(url, corpo, {
        timeout: 120000,
        transformRequest: [
            (body, headers) => {
                if (headers) {
                    delete headers["Content-Type"];
                    delete headers["content-type"];
                }
                return body;
            }
        ]
    });
    return data;
}

export async function persistirFichaMaquina(maquina, pacote = {}) {
    const salva = await salvarMaquina(maquina);
    const id = salva.id;
    await api.put(`/maquinas/${id}/consumiveis`, (pacote.consumiveis || []).filter((item) => String(item.nome || "").trim()).map((item) => ({
        nome: item.nome,
        atual: num(item.atual),
        capacidade: num(item.capacidade),
        unidade: item.unidade || "ml",
        cor: item.cor || "#6b7280"
    })));
    for (const fotoId of pacote.fotosRemovidas || []) {
        await api.delete(`/maquinas/${id}/fotos/${fotoId}`);
    }
    for (const arquivo of pacote.fotosNovas || []) {
        await enviarArquivo(`/maquinas/${id}/fotos`, arquivo);
    }
    for (const mid of pacote.manutencoesRemovidas || []) {
        await api.delete(`/maquinas/${id}/manutencoes/${mid}`);
    }
    for (const item of pacote.manutencoes || []) {
        const corpo = {
            data: item.data || null,
            tipo: item.tipo || "Corretiva",
            descricao: item.descricao || "",
            responsavel: item.responsavel || "",
            custo: num(item.custo),
            status: item.status || "Em andamento",
            previsaoRetorno: item.previsaoRetorno || null,
            peca: item.peca || ""
        };
        const salvo = item.id
            ? (await api.put(`/maquinas/${id}/manutencoes/${item.id}`, corpo)).data
            : (await api.post(`/maquinas/${id}/manutencoes`, corpo)).data;
        for (const fid of item.fotosRemovidas || []) {
            await api.delete(`/maquinas/${id}/manutencoes/${salvo.id}/fotos/${fid}`);
        }
        for (const arquivo of item.fotosNovas || []) {
            await enviarArquivo(`/maquinas/${id}/manutencoes/${salvo.id}/fotos`, arquivo);
        }
    }
    for (const did of pacote.documentosRemovidos || []) {
        await api.delete(`/maquinas/${id}/documentos/${did}`);
    }
    for (const arquivo of pacote.documentosNovos || []) {
        await enviarArquivo(`/maquinas/${id}/documentos`, arquivo);
    }
    return buscarFichaMaquina(id);
}
