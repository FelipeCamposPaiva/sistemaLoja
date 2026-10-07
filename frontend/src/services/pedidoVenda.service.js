import api, { resource } from "./api";
import { pedidoDaApi, pedidoParaApi, pedidosSemente } from "../constants/pedidosVenda";
import { listarClientes } from "./clientes.service";

const pedidos = resource("/pedidos-venda");
const LOCAL_KEY = "erp-pedidos-venda-v1";
const SEED_KEY = "erp-pedidos-venda-seeded";

async function enriquecerItens(itens) {
    try {
        const { data } = await api.get("/produtos");
        const catalogo = Array.isArray(data) ? data : [];
        if (!catalogo.length) {
            return itens;
        }
        return (itens || []).map((item) => {
            const sku = String(item.sku || "").toLowerCase();
            const gtin = String(item.gtin || item.codigoBarras || "").replace(/\D/g, "");
            const prod = catalogo.find((p) => String(p.sku || "").toLowerCase() === sku)
                || catalogo.find((p) => {
                    const pg = String(p.gtin || p.codigoBarras || "").replace(/\D/g, "");
                    return gtin && pg && pg === gtin;
                });
            if (!prod) {
                return item;
            }
            return {
                ...item,
                produtoId: item.produtoId || prod.id,
                sku: item.sku || prod.sku,
                descricao: item.descricao || prod.nome,
                gtin: item.gtin || prod.gtin || prod.codigoBarras,
                codigoFornecedor: item.codigoFornecedor || prod.codigoFornecedor,
                localizacao: item.localizacao || prod.localizacao
            };
        });
    } catch {
        return itens;
    }
}

function lerLocal() {
    try {
        const bruto = JSON.parse(localStorage.getItem(LOCAL_KEY) || "null");
        return Array.isArray(bruto) ? bruto : null;
    } catch {
        return null;
    }
}

function gravarLocal(lista) {
    try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(lista));
    } catch {
        try {
            localStorage.removeItem(LOCAL_KEY);
        } catch {
            /* ignore */
        }
    }
    return lista;
}

function lembrarLista(lista) {
    try {
        localStorage.setItem(SEED_KEY, "1");
        if (lista.length > 400) {
            localStorage.removeItem(LOCAL_KEY);
            return;
        }
        gravarLocal(lista);
    } catch {
        /* a lista da API segue valendo mesmo sem cache local */
    }
}

export async function listarPedidosVenda() {
    try {
        const dados = await pedidos.list();
        const lista = Array.isArray(dados) ? dados.map(pedidoDaApi) : [];
        if (lista.length) {
            lembrarLista(lista);
            return lista;
        }
        const local = lerLocal();
        if (local?.length) {
            return local;
        }
        let jaSemeou = false;
        try {
            jaSemeou = localStorage.getItem(SEED_KEY) === "1";
        } catch {
            jaSemeou = false;
        }
        if (jaSemeou) {
            return [];
        }
        const semente = [];
        for (const item of pedidosSemente()) {
            semente.push({ ...item, itens: await enriquecerItens(item.itens) });
        }
        try {
            const gravados = [];
            for (const item of semente) {
                gravados.push(pedidoDaApi(await pedidos.create(pedidoParaApi(item))));
            }
            localStorage.setItem(SEED_KEY, "1");
            gravarLocal(gravados);
            return gravados;
        } catch {
            const fallback = semente.map((p, i) => ({ ...p, id: i + 1 }));
            try {
                localStorage.setItem(SEED_KEY, "1");
            } catch {
                /* ignore */
            }
            return gravarLocal(fallback);
        }
    } catch {
        return lerLocal() || gravarLocal(pedidosSemente().map((p, i) => ({ ...p, id: i + 1 })));
    }
}

export async function salvarPedidoVenda(pedido) {
    try {
        const salvo = pedidoDaApi(await pedidos.create(pedidoParaApi(pedido)));
        const lista = (lerLocal() || []).filter((p) => p.numero !== salvo.numero);
        gravarLocal([salvo, ...lista]);
        return salvo;
    } catch {
        const lista = lerLocal() || [];
        const item = { ...pedido, id: Date.now() };
        gravarLocal([item, ...lista]);
        return item;
    }
}

export async function atualizarPedidoVenda(id, pedido) {
    try {
        const salvo = pedidoDaApi(await pedidos.update(id, pedidoParaApi({ ...pedido, id })));
        gravarLocal((lerLocal() || []).map((p) => (String(p.id) === String(id) ? salvo : p)));
        return salvo;
    } catch {
        const salvo = { ...pedido, id };
        gravarLocal((lerLocal() || []).map((p) => (String(p.id) === String(id) ? salvo : p)));
        return salvo;
    }
}

export async function lancarEstoquePedido(id) {
    try {
        const { data } = await api.post(`/pedidos-venda/${id}/lancar-estoque`);
        if (data?.pedido) {
            const salvo = pedidoDaApi(data.pedido);
            gravarLocal((lerLocal() || []).map((p) => (String(p.id) === String(id) ? salvo : p)));
            return { ok: data.ok !== false, pedido: salvo, mensagem: data.mensagem };
        }
    } catch {
        /* fallback local */
    }
    const lista = lerLocal() || [];
    const atual = lista.find((p) => String(p.id) === String(id));
    if (!atual) {
        return { ok: false, mensagem: "Pedido não encontrado." };
    }
    const salvo = { ...atual, estoqueLancado: true };
    gravarLocal(lista.map((p) => (String(p.id) === String(id) ? salvo : p)));
    return { ok: true, pedido: salvo };
}

export async function lancarEstoquePedidos(ids) {
    try {
        const { data } = await api.post("/pedidos-venda/lancar-estoque", ids);
        await listarPedidosVenda();
        return {
            ok: Number(data?.ok || 0),
            erros: Number(data?.erros || 0),
            mensagens: data?.mensagens || []
        };
    } catch {
        let ok = 0;
        for (const id of ids) {
            const resumo = await lancarEstoquePedido(id);
            if (resumo.ok) {
                ok++;
            }
        }
        return { ok, erros: ids.length - ok, mensagens: [] };
    }
}

export async function marcarFlagsPedido(id, flags) {
    try {
        const { data } = await api.put(`/pedidos-venda/${id}/flags`, flags);
        const salvo = pedidoDaApi(data);
        gravarLocal((lerLocal() || []).map((p) => (String(p.id) === String(id) ? salvo : p)));
        return salvo;
    } catch {
        const lista = lerLocal() || [];
        const salvo = { ...(lista.find((p) => String(p.id) === String(id)) || {}), ...flags, id };
        gravarLocal(lista.map((p) => (String(p.id) === String(id) ? salvo : p)));
        return salvo;
    }
}

const TAMANHO_LOTE = 150;

function ligarClientes(lista, clientes) {
    return lista.map((pedido) => {
        const porTiny = clientes.find((c) => pedido.contatoOlistId && c.tinyId && String(c.tinyId) === String(pedido.contatoOlistId));
        const porDoc = clientes.find((c) => pedido.documento && c.cpfCnpj && String(c.cpfCnpj).replace(/\D/g, "") === String(pedido.documento).replace(/\D/g, ""));
        const c = porTiny || porDoc;
        if (!c) {
            return pedido;
        }
        return {
            ...pedido,
            clienteId: c.id,
            cliente: pedido.cliente || c.nome,
            fantasia: pedido.fantasia || c.fantasia || "",
            uf: pedido.uf || c.uf || "",
            cidade: pedido.cidade || c.municipio || ""
        };
    });
}

async function enviarLotePedidos(lista) {
    try {
        const { data } = await api.post("/pedidos-venda/importar", lista, { timeout: 180000 });
        return {
            novos: Number(data?.novos || 0),
            atualizados: Number(data?.atualizados || 0),
            erros: Number(data?.erros || 0),
            total: Number(data?.total || lista.length)
        };
    } catch (erro) {
        const status = erro?.response?.status;
        if (status !== 404 && status !== 405) {
            throw erro;
        }
        let novos = 0;
        let atualizados = 0;
        let erros = 0;
        const atuais = await listarPedidosVenda();
        for (const item of lista) {
            try {
                const existente = atuais.find((p) => String(p.numero) === String(item.numero) && item.numero);
                if (existente?.id) {
                    await pedidos.update(existente.id, { ...item, id: existente.id });
                    atualizados++;
                } else {
                    await pedidos.create({ ...item, id: null });
                    novos++;
                }
            } catch {
                erros++;
            }
        }
        return { novos, atualizados, erros, total: novos + atualizados };
    }
}

export async function importarPedidosLote(itens, onProgress) {
    let lista = Array.isArray(itens) ? itens.map((item) => ({ ...item })) : [];
    try {
        const clientes = await listarClientes();
        lista = ligarClientes(lista, clientes);
    } catch {
        /* cadastro de clientes opcional */
    }
    let catalogo = [];
    try {
        const { data } = await api.get("/produtos");
        catalogo = Array.isArray(data) ? data : [];
    } catch {
        catalogo = [];
    }
    lista = lista.map((pedido) => ({
        ...pedido,
        itens: (pedido.itens || []).map((item) => {
            const sku = String(item.sku || "").toLowerCase();
            const prod = sku ? catalogo.find((p) => String(p.sku || "").toLowerCase() === sku) : null;
            return prod ? { ...item, produtoId: prod.id, sku: item.sku || prod.sku, descricao: item.descricao || prod.nome } : item;
        })
    }));
    const payload = lista.map((p) => pedidoParaApi(p)).filter((p) => p.numero || p.clienteNome);
    if (!payload.length) {
        return { novos: 0, atualizados: 0, total: 0, erros: 0 };
    }
    const totais = { novos: 0, atualizados: 0, total: 0, erros: 0 };
    const partes = [];
    for (let i = 0; i < payload.length; i += TAMANHO_LOTE) {
        partes.push(payload.slice(i, i + TAMANHO_LOTE));
    }
    for (let i = 0; i < partes.length; i++) {
        const resumo = await enviarLotePedidos(partes[i]);
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
    try {
        await listarPedidosVenda();
    } catch {
        /* lista local já atualizada no fallback */
    }
    return totais;
}
