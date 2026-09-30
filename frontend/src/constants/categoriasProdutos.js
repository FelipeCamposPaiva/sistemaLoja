export const CAT_KEY = "erp-categorias-produtos-v2";

export const CAT_ICONES = [
    { id: "folder", cor: "#f59e0b" },
    { id: "book", cor: "#eab308" },
    { id: "pen", cor: "#f97316" },
    { id: "pencil", cor: "#ec4899" },
    { id: "gift", cor: "#14b8a6" },
    { id: "box", cor: "#22c55e" },
    { id: "game", cor: "#8b5cf6" },
    { id: "spark", cor: "#ec4899" },
    { id: "monitor", cor: "#64748b" },
    { id: "wrench", cor: "#a855f7" }
];

function cat(parcial) {
    return {
        id: String(parcial.id),
        nome: parcial.nome,
        paiId: parcial.paiId || null,
        descricao: parcial.descricao || "",
        ativo: parcial.ativo !== false,
        ordem: Number(parcial.ordem) || 1,
        cor: parcial.cor || "#f59e0b",
        icone: parcial.icone || "folder",
        imagem: parcial.imagem || "",
        grupo: parcial.grupo || parcial.nome,
        filtro: parcial.filtro || "",
        seoTitulo: parcial.seoTitulo || "",
        seoDescricao: parcial.seoDescricao || ""
    };
}

const RAIZES = [
    { id: "50070", nome: "PAPELARIA", grupo: "PAPELARIA", cor: "#f59e0b", icone: "folder", ordem: 1, descricao: "Materiais de papelaria e escritório em geral." },
    { id: "96474", nome: "ARTESANATO", grupo: "ARTESANATO", cor: "#3b82f6", icone: "folder", ordem: 2, descricao: "Itens para artesanato e hobbies." },
    { id: "50084", nome: "BRINQUEDOS", grupo: "BRINQUEDO", cor: "#8b5cf6", icone: "game", ordem: 3, descricao: "Brinquedos e jogos." },
    { id: "50623", nome: "PRESENTES", grupo: "PRESENTE", cor: "#14b8a6", icone: "gift", ordem: 4, descricao: "Presentes e lembranças." },
    { id: "50073", nome: "PERSONALIZADOS", grupo: "PERSONALIZADO", cor: "#ec4899", icone: "spark", ordem: 5, descricao: "Produtos com personalização a laser e gráfica." },
    { id: "embalagens", nome: "EMBALAGENS", grupo: "EMBALAGEM", cor: "#22c55e", icone: "box", ordem: 6, descricao: "Sacos, caixas e embalagens para presente." },
    { id: "73953", nome: "INFORMÁTICA", grupo: "SERVIÇOS DE INFORMÁTICA", cor: "#94a3b8", icone: "monitor", ordem: 7, ativo: false, descricao: "Serviços e itens de informática." },
    { id: "50561", nome: "UTILIDADES", grupo: "UTILIDADES", cor: "#a855f7", icone: "wrench", ordem: 8, descricao: "Utilidades domésticas e do dia a dia." },
    { id: "91063", nome: "AVIAMENTO", grupo: "AVIAMENTO", cor: "#fb7185", icone: "folder", ordem: 9 },
    { id: "89217", nome: "BIJUTERIA", grupo: "BIJUTERIA", cor: "#f472b6", icone: "spark", ordem: 10 },
    { id: "155225", nome: "CHAVEIRO", grupo: "CHAVEIRO", cor: "#38bdf8", icone: "folder", ordem: 11 },
    { id: "96573", nome: "CHIP", grupo: "CHIP", cor: "#64748b", icone: "monitor", ordem: 12 },
    { id: "92838", nome: "CHUVA", grupo: "CHUVA", cor: "#60a5fa", icone: "folder", ordem: 13 },
    { id: "155184", nome: "COISAS DE CABELO", grupo: "COISAS DE CABELO", cor: "#f9a8d4", icone: "folder", ordem: 14 },
    { id: "90815", nome: "CUTELARIA", grupo: "CUTELARIA", cor: "#78716c", icone: "wrench", ordem: 15 },
    { id: "50160", nome: "ELETRÔNICO", grupo: "ELETRONICO", cor: "#64748b", icone: "monitor", ordem: 16, ativo: false },
    { id: "98898", nome: "FESTA JUNINA", grupo: "FESTA JUNINA", cor: "#facc15", icone: "folder", ordem: 17 },
    { id: "72132", nome: "INVERNO", grupo: "INVERNO", cor: "#818cf8", icone: "folder", ordem: 18 },
    { id: "155786", nome: "MAQUIAGEM", grupo: "MAQUIAGEM", cor: "#f472b6", icone: "spark", ordem: 19 },
    { id: "92197", nome: "NATAL", grupo: "NATAL", cor: "#22c55e", icone: "gift", ordem: 20 },
    { id: "138894", nome: "PIERCING", grupo: "PIERCING", cor: "#a3a3a3", icone: "folder", ordem: 21 },
    { id: "50618", nome: "RECARGA", grupo: "RECARGA", cor: "#0ea5e9", icone: "monitor", ordem: 22 },
    { id: "98897", nome: "VERÃO", grupo: "Verão", cor: "#38bdf8", icone: "folder", ordem: 23 }
];

const PAPELARIA_FILHOS = [
    { id: "cadernos", nome: "Cadernos", paiId: "50070", cor: "#eab308", icone: "book", ordem: 1, grupo: "PAPELARIA", filtro: "caderno", descricao: "Cadernos em geral." },
    { id: "cadernos-espiral", nome: "Cadernos Espiral", paiId: "cadernos", cor: "#eab308", icone: "book", ordem: 1, grupo: "PAPELARIA", filtro: "espiral" },
    { id: "cadernos-universitarios", nome: "Cadernos Universitários", paiId: "cadernos", cor: "#eab308", icone: "book", ordem: 2, grupo: "PAPELARIA", filtro: "universit" },
    { id: "cadernos-personalizados", nome: "Cadernos Personalizados", paiId: "cadernos", cor: "#eab308", icone: "book", ordem: 3, grupo: "PAPELARIA", filtro: "caderno.{0,24}personaliz|personaliz.{0,24}caderno" },
    { id: "canetas", nome: "Canetas", paiId: "50070", cor: "#f97316", icone: "pen", ordem: 2, grupo: "PAPELARIA", filtro: "caneta" },
    { id: "caneta-esferografica", nome: "Caneta Esferográfica", paiId: "canetas", cor: "#f97316", icone: "pen", ordem: 1, grupo: "PAPELARIA", filtro: "esferograf" },
    { id: "caneta-gel", nome: "Caneta Gel", paiId: "canetas", cor: "#f97316", icone: "pen", ordem: 2, grupo: "PAPELARIA", filtro: "caneta.{0,12}gel|\\bgel\\b" },
    { id: "caneta-marca-texto", nome: "Caneta Marca-Texto", paiId: "canetas", cor: "#f97316", icone: "pen", ordem: 3, grupo: "PAPELARIA", filtro: "marca.?texto|marca-texto" },
    { id: "lapis", nome: "Lápis", paiId: "50070", cor: "#ec4899", icone: "pencil", ordem: 3, grupo: "PAPELARIA", filtro: "l[aá]pis" }
];

export const CAT_PADRAO = [...RAIZES, ...PAPELARIA_FILHOS].map(cat);

export function novaCategoria(paiId = null, ordem = 1) {
    return cat({
        id: "",
        nome: "",
        paiId,
        ordem,
        descricao: "",
        ativo: true
    });
}

export function lerCategorias() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CAT_KEY) || "null");
        if (Array.isArray(bruto) && bruto.length) {
            return bruto.map((item) => cat({ ...item }));
        }
    } catch {
        /* seed */
    }
    return CAT_PADRAO.map((item) => ({ ...item }));
}

export function gravarCategorias(lista) {
    localStorage.setItem(CAT_KEY, JSON.stringify(lista));
    return lista;
}

export function chaveGrupo(nome) {
    return String(nome || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/S\s*$/g, "")
        .trim();
}

export function produtoNaCategoria(produto, categoria) {
    const grupoProd = chaveGrupo(produto?.grupo || produto?.categoria);
    const grupoCat = chaveGrupo(categoria?.grupo || categoria?.nome);
    const noGrupo = grupoProd === grupoCat
        || (grupoCat && grupoProd.includes(grupoCat))
        || (grupoProd && grupoCat.includes(grupoProd));
    if (categoria?.filtro) {
        try {
            return noGrupo && new RegExp(categoria.filtro, "i").test(produto?.nome || "");
        } catch {
            return noGrupo;
        }
    }
    return noGrupo;
}

export function filhosDe(lista, paiId) {
    const chave = paiId || null;
    return lista
        .filter((item) => String(item.paiId || "") === String(chave || ""))
        .sort((a, b) => (a.ordem - b.ordem) || a.nome.localeCompare(b.nome, "pt"));
}

export function mapaContagem(lista, produtos) {
    const memo = {};
    function qtd(categoria) {
        if (memo[categoria.id] != null) {
            return memo[categoria.id];
        }
        const filhos = filhosDe(lista, categoria.id);
        if (categoria.filtro) {
            memo[categoria.id] = produtos.filter((p) => produtoNaCategoria(p, categoria)).length;
            return memo[categoria.id];
        }
        if (filhos.length) {
            memo[categoria.id] = filhos.reduce((soma, filho) => soma + qtd(filho), 0);
            return memo[categoria.id];
        }
        memo[categoria.id] = produtos.filter((p) => produtoNaCategoria(p, categoria)).length;
        return memo[categoria.id];
    }
    lista.forEach(qtd);
    return memo;
}

export function ehRaiz(categoria) {
    return !categoria?.paiId;
}

export function resumoCategorias(lista, produtos) {
    const raizes = lista.filter(ehRaiz);
    const subs = lista.filter((c) => !ehRaiz(c));
    const counts = mapaContagem(lista, produtos);
    const vinculados = raizes.reduce((soma, c) => soma + (counts[c.id] || 0), 0);
    return {
        total: raizes.length,
        subcategorias: subs.length,
        vinculados,
        ativas: raizes.filter((c) => c.ativo !== false).length,
        inativas: raizes.filter((c) => c.ativo === false).length,
        counts
    };
}

export function caminhoDa(lista, id) {
    const porId = new Map(lista.map((c) => [String(c.id), c]));
    const nomes = [];
    let atual = porId.get(String(id));
    const visto = new Set();
    while (atual && !visto.has(atual.id)) {
        visto.add(atual.id);
        nomes.unshift(atual.nome);
        atual = atual.paiId ? porId.get(String(atual.paiId)) : null;
    }
    return nomes;
}

export function importarLinhas(texto, atuais) {
    const linhas = String(texto || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const saida = atuais.map((c) => ({ ...c }));
    const porNome = new Map(saida.map((c) => [c.nome.toUpperCase(), c]));
    linhas.forEach((linha, idx) => {
        if (idx === 0 && /nome/i.test(linha) && /pai|status/i.test(linha)) {
            return;
        }
        const partes = linha.split(/[;,\t]/).map((p) => p.trim());
        const nome = partes[0];
        if (!nome) {
            return;
        }
        const paiNome = partes[1] || "";
        const ativo = !/inativ/i.test(partes[2] || "ativo");
        if (porNome.has(nome.toUpperCase())) {
            return;
        }
        const pai = paiNome ? porNome.get(paiNome.toUpperCase()) : null;
        const nova = cat({
            id: `imp-${Date.now()}-${idx}`,
            nome,
            paiId: pai?.id || null,
            ativo,
            ordem: saida.length + 1,
            grupo: pai?.grupo || nome
        });
        saida.push(nova);
        porNome.set(nome.toUpperCase(), nova);
    });
    return saida;
}
