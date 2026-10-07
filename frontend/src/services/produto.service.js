import api, { resource } from "./api";
import { gravarMetaKit, lerMetaKit } from "./kitComposicao";
import { parseMidia } from "./produtoMidia.service";

const produtos = resource("/produtos");

export function produtoDaApi(raw) {
    const meta = lerMetaKit(raw?.observacoes);
    return {
        id: raw?.id,
        sku: raw?.sku || "",
        gtin: raw?.codigoBarras || raw?.gtin || "",
        codigoBarras: raw?.codigoBarras || raw?.gtin || "",
        nome: raw?.nome || "",
        categoria: raw?.categoria || "",
        grupo: raw?.categoria || raw?.grupo || "",
        unidade: raw?.unidade || "UN",
        preco: Number(raw?.preco || 0),
        precoAtacado: Number(raw?.precoAtacado || 0),
        precoPromocional: Number(raw?.precoPromocional || 0),
        descontoPercentual: Number(raw?.descontoPercentual || 0),
        custo: Number(raw?.custo || 0),
        custoCompra: Number(raw?.custoCompra || 0),
        estoque: Number(raw?.estoque || 0),
        estoqueMinimo: Number(raw?.estoqueMinimo || 0),
        estoqueMaximo: Number(raw?.estoqueMaximo || 0),
        ativo: raw?.ativo !== false,
        fornecedor: raw?.fornecedorId ? String(raw.fornecedorId) : (raw?.fornecedor || ""),
        codigoFornecedor: raw?.codigoFornecedor || "",
        marca: raw?.marca || "",
        marcaId: raw?.marcaId || "",
        ncm: raw?.ncm || "",
        localizacao: raw?.localizacao || "",
        imagem: raw?.imagem || parseMidia(raw).fotos[0]?.url || "",
        fotos: parseMidia(raw).fotos,
        videos: parseMidia(raw).videos,
        anuncios: parseMidia(raw).anuncios,
        produtoProducao: Boolean(raw?.produtoProducao),
        consomeEstoque: raw?.consomeEstoque !== false,
        observacoes: meta.texto,
        tipoCadastro: meta.tipo || raw?.tipoCadastro || "",
        componentes: meta.componentes,
        atalho: false
    };
}

function texto(valor, max) {
    const s = String(valor || "").trim();
    if (!s || /^SEM\s*GTIN$/i.test(s)) {
        return null;
    }
    return max && s.length > max ? s.slice(0, max) : s;
}

function paraApi(produto) {
    return {
        sku: texto(produto.sku, 50),
        codigoBarras: texto(produto.codigoBarras || produto.gtin, 50),
        nome: texto(produto.nome, 255) || "",
        categoria: texto(produto.categoria || produto.grupo, 100),
        unidade: texto(produto.unidade, 10) || "UN",
        custo: Number(produto.custo || 0),
        custoCompra: Number(produto.custoCompra || produto.custo || 0),
        preco: Number(produto.preco || 0),
        precoAtacado: Number(produto.precoAtacado || 0),
        precoPromocional: Number(produto.precoPromocional || 0) || null,
        descontoPercentual: Number(produto.descontoPercentual || 0) || null,
        estoque: Number(produto.estoque || 0),
        estoqueMinimo: Number(produto.estoqueMinimo || 0),
        estoqueMaximo: Number(produto.estoqueMaximo || 0),
        peso: Number(produto.peso || 0),
        localizacao: texto(produto.localizacao, 255),
        ncm: texto(produto.ncm, 20),
        cest: texto(produto.cest, 20),
        produtoProducao: Boolean(produto.produtoProducao) || produto.tipoCadastro === "fabricado" || produto.tipo === "fabricado",
        consomeEstoque: produto.consomeEstoque !== false,
        ativo: produto.ativo !== false,
        observacoes: gravarMetaKit(produto.observacoes, {
            tipo: produto.tipoCadastro || (produto.tipo && produto.tipo !== "todos" && produto.tipo !== "contem" ? produto.tipo : ""),
            componentes: produto.componentes
        })
    };
}

export async function listarProdutos() {
    const dados = await produtos.list();
    return Array.isArray(dados) ? dados.map(produtoDaApi) : [];
}

export async function buscarProdutos(texto) {
    const termo = String(texto || "").trim();
    if (!termo) {
        return listarProdutos();
    }
    try {
        const { data } = await api.get("/produtos/buscar", { params: { texto: termo } });
        return Array.isArray(data) ? data.map(produtoDaApi) : [];
    } catch {
        const todos = await listarProdutos();
        const t = termo.toLowerCase();
        return todos.filter((p) => [p.nome, p.sku, p.gtin, p.grupo, p.marca, p.localizacao].join(" ").toLowerCase().includes(t));
    }
}

export async function buscarProduto(id) {
    return produtoDaApi(await produtos.get(id));
}

export async function salvarProduto(produto) {
    return produtoDaApi(await produtos.create(paraApi(produto)));
}

export async function atualizarProduto(id, produto) {
    return produtoDaApi(await produtos.update(id, { ...paraApi(produto), id }));
}

export async function excluirProduto(id) {
    await produtos.remove(id);
}

export async function reajustarPrecos(ids, percentualReajuste, opcoes = {}) {
    const { data } = await api.post("/produtos/reajustar", {
        ids,
        percentualReajuste,
        reajustarVenda: opcoes.reajustarVenda !== false,
        reajustarAtacado: opcoes.reajustarAtacado !== false
    });
    return data;
}

export async function aplicarPromocao(ids, corpo = {}) {
    const { data } = await api.post("/produtos/promocao", { ids, ...corpo });
    return data;
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
        const { data } = await api.post("/produtos/importar", payload, { timeout: 180000 });
        return resumoImportacao(data, payload.length);
    } catch (erro) {
        const status = erro?.response?.status;
        if (status && status !== 404 && status !== 405) {
            throw erro;
        }
        const atuais = await listarProdutos();
        let novos = 0;
        let atualizados = 0;
        let erros = 0;
        for (const item of payload) {
            const existe = atuais.find((p) =>
                (item.sku && p.sku && p.sku.toLowerCase() === item.sku.toLowerCase())
                || (item.codigoBarras && (p.gtin === item.codigoBarras || p.codigoBarras === item.codigoBarras))
            );
            try {
                if (existe) {
                    const salvo = await atualizarProduto(existe.id, { ...existe, ...item });
                    Object.assign(existe, salvo);
                    atualizados++;
                } else {
                    const criado = await salvarProduto(item);
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

export async function importarProdutosLote(lista, onProgress) {
    const payload = (Array.isArray(lista) ? lista : []).map(paraApi).filter((p) => p.nome);
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

export { produtos };
