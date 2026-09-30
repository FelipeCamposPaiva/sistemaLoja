export function normalizarCodigo(valor) {
    return String(valor || "").trim().toLowerCase().replace(/\s+/g, "");
}

export function soDigitos(valor) {
    return String(valor || "").replace(/\D/g, "");
}

export function camposCodigo(alvo) {
    return [
        alvo?.sku,
        alvo?.gtin,
        alvo?.codigoBarras,
        alvo?.ean,
        alvo?.ean13,
        alvo?.codigoFornecedor,
        alvo?.codigo_fornecedor
    ].map((c) => String(c || "").trim()).filter(Boolean);
}

export function codigoConfere(alvo, lido) {
    const c = normalizarCodigo(lido);
    if (!c) {
        return false;
    }
    const d = soDigitos(lido);
    return camposCodigo(alvo).some((campo) => {
        const n = normalizarCodigo(campo);
        if (n && n === c) {
            return true;
        }
        const cd = soDigitos(campo);
        return d.length >= 8 && cd.length >= 8 && cd === d;
    });
}

export function encontrarProduto(catalogo, codigo) {
    return (catalogo || []).find((p) => codigoConfere(p, codigo)) || null;
}

export function encontrarItem(itens, codigo, catalogo) {
    const lista = itens || [];
    const idxDireto = lista.findIndex((item) => codigoConfere(item, codigo));
    if (idxDireto >= 0) {
        return idxDireto;
    }
    const prod = encontrarProduto(catalogo, codigo);
    if (!prod) {
        return -1;
    }
    return lista.findIndex((item) =>
        codigoConfere(item, prod.sku)
        || codigoConfere(item, prod.gtin || prod.codigoBarras)
        || String(item.produtoId || "") === String(prod.id || "")
    );
}

export function qtdPedida(item) {
    return Math.max(1, Number(item?.quantidade || item?.qtd || 1));
}

export function qtdSeparada(item) {
    return Number(item?.qtdSeparada || 0);
}

export function itemCompleto(item) {
    return qtdSeparada(item) >= qtdPedida(item);
}

export function pedidoSeparado(itens) {
    const lista = itens || [];
    return lista.length > 0 && lista.every(itemCompleto);
}

export function progressoSeparacao(itens) {
    const lista = itens || [];
    const pedida = lista.reduce((s, i) => s + qtdPedida(i), 0);
    const feita = lista.reduce((s, i) => s + Math.min(qtdSeparada(i), qtdPedida(i)), 0);
    return { pedida, feita, pct: pedida ? Math.round((feita / pedida) * 100) : 0 };
}

export function localizacaoItem(item) {
    return String(item?.localizacao || "").trim();
}

export function ordenarPorLocal(itens) {
    return [...(itens || [])].sort((a, b) => {
        const la = localizacaoItem(a);
        const lb = localizacaoItem(b);
        if (!la && lb) {
            return 1;
        }
        if (la && !lb) {
            return -1;
        }
        const loc = la.localeCompare(lb, "pt-BR", { numeric: true });
        if (loc) {
            return loc;
        }
        return String(a.descricao || a.sku || "").localeCompare(String(b.descricao || b.sku || ""), "pt-BR");
    });
}

export function agruparPorLocal(itens) {
    const grupos = [];
    for (const item of ordenarPorLocal(itens)) {
        const local = localizacaoItem(item) || "Sem localização";
        const ultimo = grupos[grupos.length - 1];
        if (ultimo && ultimo.local === local) {
            ultimo.itens.push(item);
        } else {
            grupos.push({ local, itens: [item] });
        }
    }
    return grupos;
}

export function enriquecerItensSeparacao(itens, catalogo) {
    return (itens || []).map((item) => {
        const prod = encontrarProduto(catalogo, item.sku)
            || encontrarProduto(catalogo, item.gtin || item.codigoBarras)
            || (catalogo || []).find((p) => String(p.id) === String(item.produtoId || ""));
        if (!prod) {
            return item;
        }
        return {
            ...item,
            produtoId: item.produtoId || prod.id,
            sku: item.sku || prod.sku,
            gtin: item.gtin || prod.gtin || prod.codigoBarras,
            codigoFornecedor: item.codigoFornecedor || prod.codigoFornecedor,
            localizacao: item.localizacao || prod.localizacao,
            descricao: item.descricao || prod.nome
        };
    });
}

export function biparPedido(pedido, codigo, catalogo) {
    const lido = String(codigo || "").trim();
    if (!lido) {
        return { ok: false, tipo: "vazio", mensagem: "Bipe o GTIN, SKU ou código do fornecedor." };
    }
    const itens = pedido.itens || [];
    if (!itens.length) {
        return { ok: false, tipo: "vazio", mensagem: "Este pedido não tem itens para separar." };
    }
    const idx = encontrarItem(itens, lido, catalogo);
    if (idx < 0) {
        return { ok: false, tipo: "errado", mensagem: `“${lido}” não pertence a este pedido.` };
    }
    const item = itens[idx];
    const pedida = qtdPedida(item);
    const atual = qtdSeparada(item);
    if (atual >= pedida) {
        return {
            ok: false,
            tipo: "completo",
            item,
            mensagem: `${item.sku || item.descricao} já está conferido (${pedida}).`
        };
    }
    const itensNovos = itens.map((linha, i) => (i === idx ? { ...linha, qtdSeparada: atual + 1 } : linha));
    const novo = { ...pedido, itens: itensNovos };
    if (pedido.separacao === "PENDENTE" || !pedido.separacao) {
        novo.separacao = "SEPARANDO";
    }
    const todos = pedidoSeparado(itensNovos);
    if (todos) {
        novo.separacao = "SEPARADO";
        novo.embalagem = "AGUARDANDO";
    }
    const conferido = atual + 1;
    return {
        ok: true,
        tipo: todos ? "pedido" : "item",
        item: itensNovos[idx],
        pedido: novo,
        mensagem: todos
            ? `${item.sku || item.descricao} ${conferido}/${pedida}. Pedido separado — siga para embalagem.`
            : `${item.sku || item.descricao} ${conferido}/${pedida}`
    };
}

export function sinalBipagem(ok) {
    try {
        navigator.vibrate?.(ok ? 30 : [90, 40, 90]);
    } catch {
        /* ignore */
    }
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const ganho = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = ok ? 880 : 196;
        ganho.gain.value = 0.05;
        osc.connect(ganho);
        ganho.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + (ok ? 0.08 : 0.18));
    } catch {
        /* ignore */
    }
}
