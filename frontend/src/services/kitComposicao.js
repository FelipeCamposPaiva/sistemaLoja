import * as XLSX from "xlsx";

const META_RE = /\[\[ERP:([\s\S]*?)\]\]/;

export function skuChave(valor) {
    return String(valor || "").trim().toLowerCase();
}

export function skuBate(valor, termo) {
    const a = skuChave(valor);
    const b = skuChave(termo);
    if (!a || !b) {
        return false;
    }
    if (a === b) {
        return true;
    }
    return b.length >= 4 && a.includes(b);
}

export function lerMetaKit(observacoes) {
    const bruto = String(observacoes || "");
    const m = bruto.match(META_RE);
    const texto = bruto.replace(META_RE, "").trim();
    if (!m) {
        return { tipo: "", componentes: [], texto };
    }
    try {
        const json = JSON.parse(m[1]);
        const componentes = Array.isArray(json.c)
            ? json.c.map((item) => ({
                sku: String(item.s || item.sku || "").trim(),
                quantidade: Number(item.q || item.quantidade || 1) || 1,
                nome: String(item.n || item.nome || "").trim()
            })).filter((item) => item.sku)
            : [];
        return {
            tipo: String(json.tipo || "").trim(),
            componentes,
            texto
        };
    } catch {
        return { tipo: "", componentes: [], texto };
    }
}

export function gravarMetaKit(texto, meta = {}) {
    const limpo = String(texto || "").replace(META_RE, "").trim();
    const componentes = (meta.componentes || [])
        .map((item) => ({
            s: String(item.sku || item.s || "").trim(),
            q: Number(item.quantidade || item.q || 1) || 1,
            n: String(item.nome || item.n || "").trim()
        }))
        .filter((item) => item.s);
    const tipo = String(meta.tipo || "").trim();
    if (!tipo && !componentes.length) {
        return limpo;
    }
    const bloco = `[[ERP:${JSON.stringify({ tipo, c: componentes })}]]`;
    return limpo ? `${limpo}\n${bloco}` : bloco;
}

export function tipoTinyParaCadastro(tipoTiny) {
    const t = String(tipoTiny || "").trim().toUpperCase();
    if (t === "K" || t === "KIT" || t === "KITS") {
        return "kits";
    }
    if (t === "F" || t === "FABRICADO") {
        return "fabricado";
    }
    if (t === "M" || t === "MP" || t.includes("MATERIA")) {
        return "materia-prima";
    }
    if (t === "V" || t.includes("VARIAC")) {
        return "variacoes";
    }
    if (t === "S" || t === "SIMPLES") {
        return "simples";
    }
    return "";
}

function chaveColuna(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

function numeroQtd(valor) {
    if (typeof valor === "number" && Number.isFinite(valor)) {
        return valor;
    }
    const s = String(valor || "").trim();
    if (!s) {
        return 1;
    }
    if (s.includes(",") && s.includes(".")) {
        return Number(s.replace(/\./g, "").replace(",", ".")) || 1;
    }
    if (s.includes(",")) {
        return Number(s.replace(",", ".")) || 1;
    }
    return Number(s) || 1;
}

export function produtoTemSku(produto, termo) {
    return skuBate(produto?.sku, termo)
        || skuBate(produto?.gtin, termo)
        || skuBate(produto?.codigoBarras, termo)
        || skuBate(produto?.codigoFornecedor, termo);
}

export function componentesDoProduto(produto) {
    if (Array.isArray(produto?.componentes) && produto.componentes.length) {
        return produto.componentes;
    }
    return lerMetaKit(produto?.observacoes).componentes;
}

function tipoComposto(produto) {
    const tipo = String(produto?.tipoCadastro || produto?.tipo || "").toLowerCase();
    if (tipo === "fabricado") {
        return "fabricado";
    }
    if (tipo === "kits" || tipo === "kit") {
        return "kits";
    }
    if (produto?.produtoProducao) {
        return "fabricado";
    }
    if (componentesDoProduto(produto).length) {
        return "kits";
    }
    return "";
}

export function termoDoProduto(alvo) {
    if (alvo == null) {
        return "";
    }
    if (typeof alvo === "string" || typeof alvo === "number") {
        return String(alvo).trim();
    }
    return String(alvo.sku || alvo.gtin || alvo.codigoBarras || alvo.codigoFornecedor || "").trim();
}

function componenteBate(comp, busca, alvos) {
    if (skuBate(comp.sku, busca) || skuBate(comp.nome, busca)) {
        return true;
    }
    return alvos.some((a) => skuBate(comp.sku, a.sku) || skuBate(comp.sku, a.gtin) || skuBate(comp.sku, a.codigoFornecedor));
}

export function usosDoComponente(produtos, alvo) {
    const busca = termoDoProduto(alvo);
    const nomeAlvo = typeof alvo === "object" && alvo
        ? String(alvo.nome || "").trim().toLowerCase()
        : "";
    if (!busca && nomeAlvo.length < 8) {
        return [];
    }
    const lista = Array.isArray(produtos) ? produtos : [];
    const alvos = busca
        ? lista.filter((p) => produtoTemSku(p, busca))
        : [];
    if (typeof alvo === "object" && alvo?.id && !alvos.some((p) => String(p.id) === String(alvo.id))) {
        alvos.push(alvo);
    }
    const nomesAlvo = [...new Set(
        [
            nomeAlvo,
            ...alvos.map((p) => String(p.nome || "").trim().toLowerCase())
        ].filter((nome) => nome.length >= 8)
    )];
    const idAlvo = typeof alvo === "object" ? String(alvo?.id || "") : "";

    const usos = [];
    lista.forEach((pai) => {
        if (idAlvo && String(pai.id) === idAlvo) {
            return;
        }
        if (busca && produtoTemSku(pai, busca) && !componentesDoProduto(pai).length && !tipoComposto(pai)) {
            return;
        }
        const comps = componentesDoProduto(pai);
        const achados = comps.filter((c) => componenteBate(c, busca, alvos));
        const composto = tipoComposto(pai);
        if (achados.length) {
            usos.push({
                produto: pai,
                tipo: composto || "kits",
                quantidade: achados.reduce((acc, c) => acc + (Number(c.quantidade) || 1), 0),
                componentes: achados
            });
            return;
        }
        if (!composto) {
            return;
        }
        if (busca && produtoTemSku(pai, busca) && !comps.length) {
            return;
        }
        const blob = `${pai.nome || ""} ${pai.observacoes || ""}`.toLowerCase();
        const porSku = busca && skuChave(busca).length >= 4 && blob.includes(skuChave(busca)) && !produtoTemSku(pai, busca);
        const porNome = nomesAlvo.some((nome) => blob.includes(nome));
        if (porSku || porNome) {
            usos.push({
                produto: pai,
                tipo: composto,
                quantidade: 0,
                componentes: []
            });
        }
    });
    return usos;
}

export function kitsQueContemSku(produtos, termo) {
    return usosDoComponente(produtos, termo).map((uso) => ({
        ...uso.produto,
        usoQuantidade: uso.quantidade,
        usoTipo: uso.tipo,
        usoComponentes: uso.componentes
    }));
}

export function resumoUsos(usos) {
    const kits = usos.filter((u) => u.tipo === "kits").length;
    const fabricados = usos.filter((u) => u.tipo === "fabricado").length;
    return { kits, fabricados, total: usos.length };
}

export function mesclarComponentes(atuais = [], novos = []) {
    const mapa = new Map();
    [...atuais, ...novos].forEach((item) => {
        const sku = String(item.sku || item.s || "").trim();
        if (!sku) {
            return;
        }
        const chave = skuChave(sku);
        const prev = mapa.get(chave);
        mapa.set(chave, {
            sku,
            quantidade: Number(item.quantidade || item.q || prev?.quantidade || 1) || 1,
            nome: String(item.nome || item.n || prev?.nome || "").trim()
        });
    });
    return [...mapa.values()];
}

export async function lerPlanilhaKits(arquivo) {
    const buffer = await arquivo.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const nomeFolha = (wb.SheetNames || []).find((n) => /kit/i.test(n)) || wb.SheetNames[0];
    const linhas = XLSX.utils.sheet_to_json(wb.Sheets[nomeFolha], { defval: "" });
    if (!linhas.length) {
        return { itens: [], origem: "kits" };
    }
    const cols = Object.keys(linhas[0] || {});
    const colKit = cols.find((c) => ["skukit", "codigokit", "kit"].includes(chaveColuna(c))) || cols[0];
    const colNome = cols.find((c) => ["descricao", "nome", "descricaokit", "produto"].includes(chaveColuna(c)));
    const colComp = cols.find((c) => ["skucomponente", "componente", "skufilho", "codigointerno"].includes(chaveColuna(c)));
    const colQtd = cols.find((c) => ["quantidade", "qtd", "qtde"].includes(chaveColuna(c)));
    const agrupados = new Map();
    linhas.forEach((linha) => {
        const sku = String(linha[colKit] || "").trim();
        const comp = colComp ? String(linha[colComp] || "").trim() : "";
        if (!sku) {
            return;
        }
        const atual = agrupados.get(skuChave(sku)) || {
            sku,
            nome: colNome ? String(linha[colNome] || "").trim() : "",
            componentes: []
        };
        if (colNome && !atual.nome) {
            atual.nome = String(linha[colNome] || "").trim();
        }
        if (comp && !skuBate(comp, sku)) {
            atual.componentes.push({
                sku: comp,
                quantidade: numeroQtd(colQtd ? linha[colQtd] : 1),
                nome: ""
            });
        }
        agrupados.set(skuChave(sku), atual);
    });
    const itens = [...agrupados.values()].map((kit) => ({
        ...kit,
        componentes: mesclarComponentes([], kit.componentes),
        tipoCadastro: /fabric/i.test(kit.nome || "") ? "fabricado" : "kits"
    }));
    return { itens, origem: "kits" };
}
