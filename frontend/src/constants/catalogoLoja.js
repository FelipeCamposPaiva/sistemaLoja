import { CONTATOS_INICIAIS, gravarContatos, lerContatos } from "./contatos";
import { avisarPrecosAtualizados } from "./precoPromocional";

export const GESTOR_META_KEY = "erp-gestor-meta-v1";
export const PRODUTOS_LOJA_KEY = "erp-produtos-loja-v1";

let cacheProdutos = null;

export function metaGestor() {
    try {
        return JSON.parse(localStorage.getItem(GESTOR_META_KEY) || "null");
    } catch {
        return null;
    }
}

export function gravarMetaGestor(meta) {
    localStorage.setItem(GESTOR_META_KEY, JSON.stringify(meta));
}

export function produtosLoja() {
    if (cacheProdutos?.length) {
        return cacheProdutos;
    }
    try {
        const bruto = localStorage.getItem(PRODUTOS_LOJA_KEY);
        if (bruto) {
            cacheProdutos = JSON.parse(bruto);
            if (Array.isArray(cacheProdutos) && cacheProdutos.length) {
                return cacheProdutos;
            }
        }
    } catch {
        /* ignore */
    }
    return [];
}

export function definirProdutosLoja(lista) {
    cacheProdutos = lista;
    try {
        localStorage.setItem(PRODUTOS_LOJA_KEY, JSON.stringify(lista));
    } catch {
        /* quota: keep in memory only */
    }
}

export function invalidarCacheProdutosLoja() {
    cacheProdutos = null;
}

if (typeof window !== "undefined" && !window.__erpPontePrecosLoja) {
    window.__erpPontePrecosLoja = true;
    window.addEventListener("storage", (ev) => {
        if (ev.key && ev.key !== PRODUTOS_LOJA_KEY) {
            return;
        }
        cacheProdutos = null;
        avisarPrecosAtualizados();
    });
}

async function jsonDe(nome) {
    const resp = await fetch(`/data/gestor/${nome}.json`);
    if (!resp.ok) {
        throw new Error(`Falha ao ler ${nome}`);
    }
    return resp.json();
}

function contatoBase(parcial, tipos) {
    return {
        fantasia: parcial.fantasia || "",
        tipoPessoa: parcial.tipoPessoa || "fisica",
        cpfCnpj: parcial.cpfCnpj || "",
        rg: "",
        ie: parcial.ie || "",
        contribuinte: "9",
        tipos,
        cep: parcial.cep || "",
        municipio: parcial.municipio || "Volta Redonda",
        uf: parcial.uf || "RJ",
        endereco: parcial.endereco || "",
        bairro: parcial.bairro || "",
        numero: "",
        complemento: parcial.complemento || "",
        telefone: parcial.telefone || "",
        telefone2: "",
        celular: parcial.celular || "",
        website: "",
        email: parcial.email || "",
        emailNfe: "",
        observacoes: "",
        nascimento: parcial.nascimento || "",
        limiteCredito: parcial.limiteCredito || "0",
        ativo: parcial.ativo !== false,
        excluido: false,
        id: parcial.id,
        nome: parcial.nome
    };
}

export async function importarGestorLoja() {
    const [produtos, clientes, fornecedores, grupos, marcas, formas, resumo] = await Promise.all([
        jsonDe("produtos"),
        jsonDe("clientes"),
        jsonDe("fornecedores"),
        jsonDe("grupos"),
        jsonDe("marcas"),
        jsonDe("formas"),
        jsonDe("resumo")
    ]);

    definirProdutosLoja(produtos.map(mapearProdutoGestor));
    try {
        await mesclarNaturaNfe(true);
    } catch {
        /* seed opcional da NF-e */
    }

    const atuais = lerContatos();
    const ids = new Set(atuais.map((c) => Number(c.id)));
    const extra = [
        ...clientes.map((c) => contatoBase(c, ["cliente"])),
        ...fornecedores.map((c) => contatoBase(c, ["fornecedor"]))
    ].filter((c) => c.id && !ids.has(Number(c.id)));

    if (!atuais.length || atuais.length <= CONTATOS_INICIAIS.length) {
        gravarContatos([
            ...clientes.map((c) => contatoBase(c, ["cliente"])),
            ...fornecedores.map((c) => contatoBase(c, ["fornecedor"]))
        ]);
    } else if (extra.length) {
        gravarContatos([...atuais, ...extra]);
    }

    const meta = {
        ...resumo,
        importadoEm: new Date().toISOString(),
        grupos: grupos.length,
        marcas: marcas.length,
        formas: formas.length,
        produtosMemoria: produtos.length
    };
    gravarMetaGestor(meta);
    localStorage.setItem("erp-formas-loja-v1", JSON.stringify(formas));
    localStorage.setItem("erp-grupos-loja-v1", JSON.stringify(grupos));
    localStorage.setItem("erp-marcas-loja-v1", JSON.stringify(marcas));
    return meta;
}

export function mapearProdutoGestor(p) {
    return {
        id: p.id,
        sku: p.sku || p.gtin || p.codigoBarras || "",
        gtin: p.gtin || p.codigoBarras || "",
        fornecedor: p.fornecedor || "",
        codigoFornecedor: p.codigoFornecedor || "",
        nome: p.nome,
        preco: Number(p.preco) || 0,
        precoAtacado: Number(p.precoAtacado) || 0,
        precoPromocional: Number(p.precoPromocional) || 0,
        descontoPercentual: Number(p.descontoPercentual) || 0,
        custo: Number(p.custo) || 0,
        unidade: p.unidade || "UN",
        grupo: p.grupo || p.categoria || "",
        categoria: p.categoria || p.grupo || "",
        marca: p.marca || "",
        ncm: p.ncm || "",
        cest: p.cest || "",
        localizacao: p.localizacao || "",
        estoque: Number(p.estoque) || 0,
        ativo: p.ativo !== false,
        imagem: p.imagem || "",
        tipo: p.tipo || "",
        produtoProducao: Boolean(p.produtoProducao),
        atalho: ["PAPELARIA", "PERSONALIZADOS", "PERSONALIZADO"].includes(p.grupo) && Number(p.preco) > 0
    };
}

export function upsertProdutoLoja(produto) {
    const lista = produtosLoja();
    const id = produto.id || `p-${Date.now()}`;
    const item = mapearProdutoGestor({ ...produto, id });
    const idx = lista.findIndex((p) => String(p.id) === String(id));
    definirProdutosLoja(idx >= 0
        ? lista.map((p, i) => (i === idx ? { ...p, ...item } : p))
        : [item, ...lista]);
    return item;
}

export function removerProdutoLoja(id) {
    definirProdutosLoja(produtosLoja().filter((p) => String(p.id) !== String(id)));
}

export function aplicarProdutosNfe(produtos, { somarEstoque = true } = {}) {
    if (!Array.isArray(produtos) || !produtos.length) {
        return { novos: 0, atualizados: 0 };
    }
    const lista = [...produtosLoja()];
    let novos = 0;
    let atualizados = 0;
    produtos.forEach((bruto) => {
        const item = mapearProdutoGestor({
            ...bruto,
            id: bruto.id || `nfe-${bruto.sku || Date.now()}`,
            estoque: Number(bruto.estoque ?? bruto.qtd ?? 0),
            custo: Number(bruto.custo || 0)
        });
        const idx = lista.findIndex((p) =>
            String(p.id) === String(item.id)
            || (item.gtin && p.gtin && p.gtin === item.gtin)
            || (item.sku && p.sku && String(p.sku) === String(item.sku))
        );
        if (idx < 0) {
            lista.unshift(item);
            novos += 1;
            return;
        }
        const atual = lista[idx];
        const estoqueAtual = Number(atual.estoque || 0);
        const estoqueNovo = Number(item.estoque || 0);
        lista[idx] = {
            ...atual,
            ...item,
            id: atual.id,
            preco: Number(atual.preco) > 0 ? atual.preco : item.preco,
            estoque: somarEstoque && String(atual.id) !== String(item.id)
                ? estoqueAtual + estoqueNovo
                : (estoqueNovo || estoqueAtual)
        };
        atualizados += 1;
    });
    if (novos || atualizados) {
        definirProdutosLoja(lista);
        const marcas = new Set(produtos.map((p) => p.marca).filter(Boolean));
        if (marcas.size) {
            try {
                const atuais = JSON.parse(localStorage.getItem("erp-marcas-loja-v1") || "[]");
                const nomes = new Set(atuais.map((m) => String(m.nome || "").toLowerCase()));
                const extra = [...marcas].filter((n) => !nomes.has(n.toLowerCase())).map((nome) => ({
                    id: `marca-${nome.toLowerCase()}`,
                    nome
                }));
                if (extra.length) {
                    localStorage.setItem("erp-marcas-loja-v1", JSON.stringify([...atuais, ...extra]));
                }
            } catch {
                /* ignore */
            }
        }
    }
    return { novos, atualizados };
}

export async function mesclarNaturaNfe(forcar = false) {
    const ja = produtosLoja();
    if (!forcar && ja.some((p) => String(p.id).startsWith("nfe-") || p.marca === "Natura")) {
        return { novos: 0, atualizados: 0, pulou: true };
    }
    const dados = await jsonDe("natura-nfe");
    return aplicarProdutosNfe(dados.produtos || [], { somarEstoque: false });
}

function nomeRaiz(nome) {
    const texto = String(nome || "");
    const corte = texto.indexOf(">");
    return (corte >= 0 ? texto.slice(0, corte) : texto).trim();
}

function gruposRaiz(grupos, produtos) {
    const vistos = new Set();
    const saida = [];
    const fontes = [
        ...(Array.isArray(grupos) ? grupos.map((g) => g?.nome || g) : []),
        ...produtos.map((p) => p.grupo || p.categoria)
    ];
    fontes.forEach((nome) => {
        const raiz = nomeRaiz(nome);
        const chave = raiz.toLocaleLowerCase("pt-BR");
        if (!raiz || vistos.has(chave)) {
            return;
        }
        vistos.add(chave);
        saida.push({ id: saida.length + 1, nome: raiz });
    });
    saida.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return saida;
}

async function puxarVitrineErp() {
    const resp = await fetch("/api/publico/vitrine", { headers: { Accept: "application/json" } });
    if (!resp.ok) {
        throw new Error("vitrine");
    }
    const data = await resp.json();
    const produtos = Array.isArray(data?.produtos) ? data.produtos : [];
    if (!produtos.length) {
        return false;
    }
    const mapeados = produtos.map((item) => mapearProdutoGestor({
        ...item,
        custo: 0
    }));
    definirProdutosLoja(mapeados);
    const grupos = gruposRaiz(data.grupos, mapeados);
    localStorage.setItem("erp-grupos-loja-v1", JSON.stringify(grupos));
    localStorage.setItem("erp-marcas-loja-v1", JSON.stringify(Array.isArray(data.marcas) ? data.marcas : []));
    gravarMetaGestor({
        ...(metaGestor() || {}),
        origem: "erp",
        importadoEm: new Date().toISOString(),
        produtosMemoria: produtos.length,
        grupos: grupos.length,
        marcas: (data.marcas || []).length
    });
    avisarPrecosAtualizados();
    return true;
}

export async function garantirCatalogoLoja() {
    try {
        if (await puxarVitrineErp()) {
            return metaGestor();
        }
    } catch {
        /* o ERP ainda não respondeu: segue o arquivo local */
    }
    const ja = produtosLoja();
    if (!(ja.length > 20 && Object.prototype.hasOwnProperty.call(ja[0], "custo"))) {
        try {
            await importarGestorLoja();
        } catch {
            /* catálogo local */
        }
    }
    try {
        await mesclarNaturaNfe();
    } catch {
        /* seed opcional da NF-e */
    }
    return metaGestor();
}
