import { produtosLoja } from "./catalogoLoja";
import { urlMidia } from "../services/produtoMidia.service";

export const LOJA_CFG_KEY = "erp-loja-cfg-v2";
export const LOJA_CARRINHO_KEY = "erp-loja-carrinho-v1";
export const LOJA_CLIENTES_KEY = "erp-loja-clientes-v1";
export const LOJA_CLIENTE_KEY = "erp-loja-cliente-v1";
export const LOJA_ARQUIVOS_KEY = "erp-loja-arquivos-v1";
export const LOJA_DESEJOS_KEY = "erp-loja-desejos-v1";
export const LOJA_PEDIDOS_EVT = "erp-loja-pedido";

export const LOJA_SECOES = {
    personalize: [
        { id: "logo", nome: "Logo" },
        { id: "visual", nome: "Visual da loja" },
        { id: "banners", nome: "Banners" },
        { id: "html", nome: "Incluir código HTML" },
        { id: "css", nome: "Editar CSS" },
        { id: "redes", nome: "Redes Sociais" },
        { id: "selos", nome: "Selos" },
        { id: "paginas", nome: "Páginas de conteúdo" },
        { id: "email", nome: "Editor de e-mail" },
        { id: "video", nome: "Vídeo em destaque" }
    ],
    configuracoes: [
        { id: "gerais", nome: "Gerais" },
        { id: "dados", nome: "Dados da loja" },
        { id: "atendimento", nome: "Atendimento e WhatsApp" },
        { id: "usuarios", nome: "Usuários" },
        { id: "pagamentos", nome: "Formas de pagamento" },
        { id: "envios", nome: "Formas de envio" },
        { id: "dominio", nome: "Domínio próprio" },
        { id: "api", nome: "Chave para API" },
        { id: "arquivos", nome: "Gerenciador de arquivos" }
    ]
};

export const LOJA_PADRAO = {
    dados: {
        nome: "Tem de Tudo",
        razao: "Tem de Tudo Papelaria, Presentes, Personalizados e Gráfica LTDA",
        cnpj: "",
        email: "atendimento@temdetudovr.com.br",
        telefone: "(24) 98157-7578",
        whatsapp: "5524981285708",
        whatsappVenda: "552433431575",
        whatsappLaser: "5524981352920",
        endereco: "Av. Visc. do Rio Branco, N. 392 - Água Limpa",
        cidade: "Volta Redonda",
        uf: "RJ",
        cep: "27250-250",
        horario: "Seg a Sex, das 8h30 às 18h30",
        horarioSab: "Sáb, das 8h30 às 12h30",
        dominio: "www.temdetudovr.com.br"
    },
    visual: {
        corPrimaria: "#ff2f92",
        corFundo: "#ffffff",
        corTexto: "#201f1f",
        corPreco: "#9e6d9a",
        corMenu: "#ffffff",
        corMenuTxt: "#4a4453",
        corIcone: "#7c3aed",
        corWhatsapp: "#5ed979",
        fonte: "Anek Latin"
    },
    logo: {
        url: "",
        icone: "",
        texto: "TEM DE TUDO"
    },
    gerais: {
        tituloSite: "Tem de Tudo VR",
        descricao: "Papelaria, presentes, personalizados e gráfica em Volta Redonda.",
        produtosPorPagina: 20,
        mostrarEstoque: false,
        vitrineAtiva: true
    },
    htmlExtra: "",
    cssExtra: "",
    redes: {
        facebook: "https://www.facebook.com/papelariatemdetudo",
        twitter: "",
        pinterest: "",
        instagram: "https://www.instagram.com/lojatemdetudovr",
        youtube: "https://www.youtube.com/watch?v=WdcjqZoLnrM",
        tiktok: ""
    },
    email: {
        remetente: "Tem de Tudo <atendimento@temdetudovr.com.br>",
        assuntoBoasVindas: "Bem-vindo à Tem de Tudo",
        htmlBoasVindas: "<p>Olá {{nome}},</p><p>Sua conta na Tem de Tudo foi criada. Aproveite os lançamentos e a personalização a laser.</p>"
    },
    dominioProprio: {
        host: "www.temdetudovr.com.br",
        ssl: true
    },
    apiKey: "",
    banners: [
        {
            id: "laser",
            titulo: "Personalização a LASER",
            subtitulo: "Canetas, copos e chaveiros personalizados do seu jeito!",
            estilo: "laser",
            link: "/c/PERSONALIZADO",
            ativo: true
        },
        {
            id: "copa",
            titulo: "Queridinhos 2026",
            subtitulo: "Álbum oficial da Copa do Mundo FIFA 2026",
            estilo: "copa",
            link: "/busca?q=copa",
            ativo: true
        }
    ],
    vitrines: [
        { id: "lancamentos", titulo: "Lançamentos", tipo: "preco", grupo: "", busca: "" },
        { id: "mais-vendidos", titulo: "Mais Vendidos", tipo: "estoque", grupo: "", busca: "" },
        { id: "destaques", titulo: "Destaques", tipo: "preco", grupo: "PERSONALIZADO", busca: "" },
        { id: "brinquedo", titulo: "Brinquedo", tipo: "grupo", grupo: "BRINQUEDO", busca: "" },
        { id: "copa", titulo: "Copa do Mundo 2026", tipo: "busca", grupo: "", busca: "copa do mundo|fifa|album oficial|figurin" }
    ],
    categoriasDestaque: [
        { id: "papelaria", nome: "Papelaria", grupo: "PAPELARIA", cor: "#ff2d8a", icone: "https://cdn.awsli.com.br/2821/2821873/arquivos/papelaria.png" },
        { id: "presentes", nome: "Presentes", grupo: "PRESENTE", cor: "#a855f7", icone: "https://cdn.awsli.com.br/2821/2821873/arquivos/presentes.png" },
        { id: "organizacao", nome: "Organização", grupo: "UTILIDADES", cor: "#3b82f6", icone: "https://cdn.awsli.com.br/2821/2821873/arquivos/organizacao.png" },
        { id: "personalizado", nome: "Personalizados", grupo: "PERSONALIZADO", cor: "#22c55e", icone: "" }
    ],
    selos: [
        { id: "frete", titulo: "Frete Econômico", texto: "para todo o Brasil", icone: "truck" },
        { id: "parcela", titulo: "Parcelamentos em", texto: "até 12x no cartão", icone: "card" },
        { id: "seguro", titulo: "Compra Garantida", texto: "loja 100% Segura", icone: "lock" },
        { id: "personalizado", titulo: "Produtos Personalizados", texto: "com a sua marca", icone: "gift" }
    ],
    textos: {
        todasCategorias: "Todas as categorias",
        escolhaCategorias: "Escolha por categorias",
        escolhaMarca: "Escolha pela marca",
        desejos: "Desejos",
        adicionar: "Adicionar",
        comprarWhatsapp: "Comprar pelo whatsapp",
        relacionados: "Aproveite e compre também",
        depoimentos: "Quem já comprou e recomenda",
        instagram: "Gostou? Segue a gente",
        fale: "Enviar mensagem",
        wpTitulo: "Estamos no whatsapp",
        telTitulo: "Dúvidas Sobre o Pagamento",
        mailTitulo: "Assunto: Site",
        freteGratis: "FRETE GRÁTIS",
        pixTxt: "no pix",
        desejosAdd: "Adicionar aos desejos",
        disponivel: "Disponível",
    },
    atendimento: [
        { id: "wp1", tipo: "whatsapp", numero: "+55 (24) 3343-1575", nome: "Elen/Nadia/Arthur", setor: "Venda", foto: "https://cdn.awsli.com.br/2821/2821873/arquivos/loja--gua-limpa.png" },
        { id: "wp2", tipo: "whatsapp", numero: "+55 (24) 98128-5708", nome: "Gabriela", setor: "Venda", foto: "" },
        { id: "wp3", tipo: "whatsapp", numero: "+55 (24) 98135-2920", nome: "Gabriel", setor: "Venda", foto: "" },
        { id: "tel1", tipo: "telefone", numero: "+55 (24) 98157-7578", nome: "Dept. Financeiro", setor: "Financeiro", foto: "" }
    ],
    video: {
        ativo: true,
        titulo: "Queridinhos 2026",
        link: "https://www.youtube.com/watch?v=WdcjqZoLnrM",
        produtosTxt: "Produtos no vídeo",
        busca: "copa do mundo|fifa|album|figurin"
    },
    pix: { ativo: true, desconto: 10 },
    cupons: [
        { qtd: 5, desconto: 10, codigo: "CUPOM10" },
        { qtd: 10, desconto: 15, codigo: "CUPOM20" },
        { qtd: 15, desconto: 20, codigo: "CUPOM30" }
    ],
    personalizador: {
        ativo: true,
        titulo: "Personalize seu Produto",
        ajuda: "Informe seu nome, WhatsApp, frase desejada e envie sua foto para personalização."
    },
    calculadoraM2: { ativo: true, altura: 1, largura: 1 },
    paginas: [
        {
            slug: "quem-somos",
            titulo: "Quem Somos",
            html: "<p>Na Tem de Tudo você encontra o que precisa em papelaria, presentes, personalizados e gráfica. Atendemos Volta Redonda e enviamos para todo o Brasil.</p>"
        },
        {
            slug: "privacidade",
            titulo: "Política de privacidade",
            html: "<p>Os dados informados no site são usados para processar pedidos, emitir nota e falar com você sobre a compra.</p>"
        },
        {
            slug: "trocas",
            titulo: "Política de Trocas e Devoluções",
            html: "<p>Trocas em até 7 dias para produtos com defeito de fabricação, com nota fiscal. Personalizados sob medida não têm troca por arrependimento.</p>"
        },
        {
            slug: "frete",
            titulo: "Meios de Pagamento e de Frete",
            html: "<p>Aceitamos Pix, cartão e boleto. Enviamos pelos Correios, Jadlog e Buslog, além de retirada na loja.</p>"
        }
    ],
    pagamentos: [
        { id: "pix", nome: "Pix", ativo: true },
        { id: "credito", nome: "Cartão de crédito", ativo: true },
        { id: "debito", nome: "Cartão de débito", ativo: true },
        { id: "boleto", nome: "Boleto", ativo: false },
        { id: "whatsapp", nome: "Combinar no WhatsApp", ativo: true }
    ],
    envios: [
        { id: "retirada", nome: "Retirar na loja", ativo: true },
        { id: "jadlog", nome: "Jadlog", ativo: true },
        { id: "buslog", nome: "Buslog", ativo: true },
        { id: "correios", nome: "Correios", ativo: true }
    ],
    depoimentos: [
        { nome: "Pedro Henrique", cidade: "São Paulo/SP", texto: "O produto chegou perfeitamente.", nota: 5, avatar: "https://bit.ly/3vdhy0T", link: "" },
        { nome: "Aparecida Souza", cidade: "", texto: "O nome já diz tudo, vai lá e constate, tudo o que vc precisa vc acha ☺️ Atendimento top", nota: 5, avatar: "https://cdn.awsli.com.br/2821/2821873/arquivos/unnamed.png", link: "https://maps.app.goo.gl/8JJbFC5nNMagx6yJ" },
        { nome: "ItsDeyvison", cidade: "", texto: "Ótimo atendimento 👏🏻👏🏻👏🏻", nota: 5, avatar: "https://cdn.awsli.com.br/2821/2821873/arquivos/unnamed--1-.png", link: "https://maps.app.goo.gl/vR9UPPteFjQAUQew" }
    ],
    marcasDestaque: ["ACP", "Alfacell", "TEM DE TUDO", "JOCAR OFFICE", "LETRON"]
};

const VISUAL_ANTIGO = {
    corPrimaria: "#f394bd",
    corMenu: "#ecd6fc",
    corMenuTxt: "#8632c1",
    corIcone: "#8632c1"
};

function visualLoja(bruto) {
    const salvo = bruto?.visual || {};
    const visual = { ...LOJA_PADRAO.visual, ...salvo };
    Object.keys(VISUAL_ANTIGO).forEach((chave) => {
        if (salvo[chave] === VISUAL_ANTIGO[chave]) {
            visual[chave] = LOJA_PADRAO.visual[chave];
        }
    });
    return visual;
}

function selosLoja(bruto) {
    const lista = Array.isArray(bruto?.selos) ? bruto.selos : LOJA_PADRAO.selos;
    const ids = new Set(lista.map((selo) => selo.id));
    return [...lista, ...LOJA_PADRAO.selos.filter((selo) => !ids.has(selo.id))];
}

function bannersLoja(bruto) {
    const lista = Array.isArray(bruto?.banners) ? bruto.banners : LOJA_PADRAO.banners;
    return lista.map((banner) => {
        if (banner.id === "laser" && banner.subtitulo === "Canetas, copos e chaveiros com a sua marca") {
            const padrao = LOJA_PADRAO.banners.find((item) => item.id === "laser");
            return { ...banner, subtitulo: padrao.subtitulo };
        }
        return banner;
    });
}

export function lerLoja() {
    try {
        const bruto = JSON.parse(localStorage.getItem(LOJA_CFG_KEY) || "null");
        if (!bruto || typeof bruto !== "object") {
            return structuredClone(LOJA_PADRAO);
        }
        return {
            ...structuredClone(LOJA_PADRAO),
            ...bruto,
            dados: { ...LOJA_PADRAO.dados, ...(bruto.dados || {}) },
            visual: visualLoja(bruto),
            logo: { ...LOJA_PADRAO.logo, ...(bruto.logo || {}) },
            gerais: { ...LOJA_PADRAO.gerais, ...(bruto.gerais || {}) },
            redes: { ...LOJA_PADRAO.redes, ...(bruto.redes || {}) },
            email: { ...LOJA_PADRAO.email, ...(bruto.email || {}) },
            dominioProprio: { ...LOJA_PADRAO.dominioProprio, ...(bruto.dominioProprio || {}) },
            textos: { ...LOJA_PADRAO.textos, ...(bruto.textos || {}) },
            video: { ...LOJA_PADRAO.video, ...(bruto.video || {}) },
            pix: { ...LOJA_PADRAO.pix, ...(bruto.pix || {}) },
            personalizador: { ...LOJA_PADRAO.personalizador, ...(bruto.personalizador || {}) },
            calculadoraM2: { ...LOJA_PADRAO.calculadoraM2, ...(bruto.calculadoraM2 || {}) },
            banners: bannersLoja(bruto),
            vitrines: Array.isArray(bruto.vitrines) ? bruto.vitrines : LOJA_PADRAO.vitrines,
            categoriasDestaque: Array.isArray(bruto.categoriasDestaque) ? bruto.categoriasDestaque : LOJA_PADRAO.categoriasDestaque,
            selos: selosLoja(bruto),
            paginas: Array.isArray(bruto.paginas) ? bruto.paginas : LOJA_PADRAO.paginas,
            pagamentos: Array.isArray(bruto.pagamentos) ? bruto.pagamentos : LOJA_PADRAO.pagamentos,
            envios: Array.isArray(bruto.envios) ? bruto.envios : LOJA_PADRAO.envios,
            depoimentos: Array.isArray(bruto.depoimentos) ? bruto.depoimentos : LOJA_PADRAO.depoimentos,
            marcasDestaque: Array.isArray(bruto.marcasDestaque) ? bruto.marcasDestaque : LOJA_PADRAO.marcasDestaque,
            atendimento: Array.isArray(bruto.atendimento) ? bruto.atendimento : LOJA_PADRAO.atendimento,
            cupons: Array.isArray(bruto.cupons) ? bruto.cupons : LOJA_PADRAO.cupons
        };
    } catch {
        return structuredClone(LOJA_PADRAO);
    }
}

export function gravarLoja(cfg) {
    localStorage.setItem(LOJA_CFG_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new Event("erp-loja-cfg"));
    return cfg;
}

export function gerarApiKey() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function gruposLoja() {
    try {
        const lista = JSON.parse(localStorage.getItem("erp-grupos-loja-v1") || "[]");
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

export function marcasLoja() {
    try {
        const lista = JSON.parse(localStorage.getItem("erp-marcas-loja-v1") || "[]");
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

export function slugify(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
}

export function precoVenda(produto) {
    const promo = Number(produto?.precoPromocional || 0);
    const preco = Number(produto?.preco || 0);
    if (promo > 0 && promo < preco) {
        return promo;
    }
    return preco;
}

export function brl(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function catalogoVitrine() {
    return produtosLoja().filter((p) => p.ativo !== false && Number(p.preco) > 0);
}

export function produtoPorId(id) {
    const chave = String(id || "");
    return catalogoVitrine().find((p) => String(p.id) === chave || String(p.sku) === chave) || null;
}

export function urlProduto(produto) {
    return `/produto/${encodeURIComponent(produto.id)}/${slugify(produto.nome)}`;
}

export function visualProdutoLoja(produto) {
    const capa = produto?.imagem || produto?.fotos?.[0]?.url;
    if (capa) {
        return { bg: "#f3f4f6", img: urlMidia(capa), emoji: "" };
    }
    const t = `${produto?.nome || ""} ${produto?.grupo || ""}`.toUpperCase();
    if (/COPA|FIFA|ALBUM|ENVELOPE|FIGURIN/.test(t)) {
        return { bg: "#ecfdf5", emoji: "🏆" };
    }
    if (/NATURA|PERFUM|SABONETE|MAQUIAGEM/.test(t)) {
        return { bg: "#fce7f3", emoji: "🧴" };
    }
    if (/CANECA|COPO|XICARA|GARRAFA|SQUEEZE/.test(t)) {
        return { bg: "#fce7f3", emoji: "🥤" };
    }
    if (/CADERN|CANETA|LAPI|PAPELARIA|BORRACHA/.test(t)) {
        return { bg: "#fce7f3", emoji: "📒" };
    }
    if (/BRINQUEDO|BONECA|CARRO|MASCARA/.test(t)) {
        return { bg: "#fef3c7", emoji: "🧸" };
    }
    if (/PERSONALIZ|LASER|ADESIVO|PLOTAG/.test(t)) {
        return { bg: "#fce7f3", emoji: "✨" };
    }
    if (/CHAVEIRO/.test(t)) {
        return { bg: "#fef3c7", emoji: "🔑" };
    }
    if (/PRESENTE|KIT/.test(t)) {
        return { bg: "#fce7f3", emoji: "🎁" };
    }
    return { bg: "#f3e8ff", emoji: "🛍️" };
}

export function grupoCombina(produto, grupo) {
    const pedido = String(grupo || "").trim().toUpperCase();
    if (!pedido) {
        return true;
    }
    const atual = String(produto?.grupo || produto?.categoria || "").trim().toUpperCase();
    return atual === pedido || atual.startsWith(`${pedido} >`) || atual.startsWith(`${pedido}>`);
}

export function filtrarVitrine(vitrine, lista) {
    const base = lista || catalogoVitrine();
    const busca = String(vitrine.busca || "").trim();
    let itens = base;
    if (vitrine.grupo) {
        itens = itens.filter((p) => grupoCombina(p, vitrine.grupo));
    }
    if (busca) {
        const rx = new RegExp(busca, "i");
        itens = itens.filter((p) => rx.test(`${p.nome} ${p.grupo} ${p.marca}`));
    }
    if (vitrine.tipo === "estoque") {
        itens = [...itens].sort((a, b) => Number(b.estoque || 0) - Number(a.estoque || 0));
    } else if (vitrine.tipo === "preco") {
        itens = [...itens].sort((a, b) => Number(b.preco || 0) - Number(a.preco || 0));
    }
    return itens.slice(0, 16);
}

export function buscarProdutosLoja(q, grupo) {
    const texto = String(q || "").trim().toLowerCase();
    return catalogoVitrine().filter((p) => {
        if (grupo && !grupoCombina(p, grupo)) {
            return false;
        }
        if (!texto) {
            return true;
        }
        return `${p.nome} ${p.sku} ${p.marca} ${p.grupo}`.toLowerCase().includes(texto);
    });
}

export function lerCarrinho() {
    try {
        const lista = JSON.parse(localStorage.getItem(LOJA_CARRINHO_KEY) || "[]");
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

export function gravarCarrinho(itens) {
    localStorage.setItem(LOJA_CARRINHO_KEY, JSON.stringify(itens));
    window.dispatchEvent(new Event("erp-loja-carrinho"));
    return itens;
}

export function qtdCarrinho(itens) {
    return (itens || lerCarrinho()).reduce((acc, i) => acc + Number(i.qtd || 0), 0);
}

export function totalCarrinho(itens) {
    return (itens || lerCarrinho()).reduce((acc, i) => acc + Number(i.preco || 0) * Number(i.qtd || 0), 0);
}

export function addCarrinho(produto, qtd = 1, extra = {}) {
    const itens = lerCarrinho();
    const id = String(produto.id);
    const personalizacao = String(extra.personalizacao || "").trim();
    const medidas = String(extra.medidas || "").trim();
    const idx = itens.findIndex(
        (i) => String(i.id) === id && String(i.personalizacao || "") === personalizacao && String(i.medidas || "") === medidas
    );
    const quantidade = Math.max(0.01, Number(qtd) || 1);
    if (idx >= 0) {
        itens[idx] = { ...itens[idx], qtd: Number(itens[idx].qtd) + quantidade };
    } else {
        itens.push({
            linha: `${produto.id}-${Date.now()}`,
            id: produto.id,
            sku: produto.sku,
            nome: produto.nome,
            preco: extra.preco ?? precoVenda(produto),
            qtd: quantidade,
            personalizacao,
            medidas
        });
    }
    return gravarCarrinho(itens);
}

export function setQtdCarrinho(id, qtd, linha) {
    const n = Math.max(0, Number(qtd) || 0);
    const itens = lerCarrinho()
        .map((i) => {
            const chave = linha ? String(i.linha || "") === String(linha) : String(i.id) === String(id);
            return chave ? { ...i, qtd: n } : i;
        })
        .filter((i) => i.qtd > 0);
    return gravarCarrinho(itens);
}

export function limparCarrinho() {
    return gravarCarrinho([]);
}

export function hrefRede(valor) {
    const v = String(valor || "").trim();
    if (!v) {
        return "";
    }
    if (/^https?:\/\//i.test(v)) {
        return v;
    }
    return `https://${v.replace(/^\/+/, "")}`;
}

export function foneWa(numero) {
    const d = String(numero || "").replace(/\D/g, "");
    if (d.length === 10 || d.length === 11) {
        return `55${d}`;
    }
    return d;
}

export function youtubeId(url) {
    const m = String(url || "").match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : "";
}

export function precoPix(produto, cfg = lerLoja()) {
    const base = precoVenda(produto);
    const pct = Number(cfg.pix?.desconto || 0);
    if (!cfg.pix?.ativo || pct <= 0) {
        return base;
    }
    return Math.round(base * (1 - pct / 100) * 100) / 100;
}

export function ehMetroQuadrado(produto) {
    return /m[²2]|metro/i.test(`${produto?.nome || ""} ${produto?.unidade || ""}`);
}

export function ehPersonalizado(produto) {
    return /personaliz|laser|plotag|adesivo/i.test(`${produto?.nome || ""} ${produto?.grupo || ""}`);
}

export function cupomProgressivo(qtdItens, cfg = lerLoja()) {
    const faixas = [...(cfg.cupons || [])].sort((a, b) => a.qtd - b.qtd);
    const atual = [...faixas].reverse().find((f) => qtdItens >= f.qtd) || null;
    const proximo = faixas.find((f) => qtdItens < f.qtd) || null;
    return { atual, proximo };
}

export function resumoCarrinho(itens, cfg = lerLoja()) {
    const lista = itens || lerCarrinho();
    const qtd = qtdCarrinho(lista);
    const bruto = totalCarrinho(lista);
    const { atual, proximo } = cupomProgressivo(qtd, cfg);
    const descontoPct = Number(atual?.desconto || 0);
    const desconto = Math.round(bruto * descontoPct / 100 * 100) / 100;
    const subtotal = Math.round((bruto - desconto) * 100) / 100;
    const pixPct = cfg.pix?.ativo ? Number(cfg.pix.desconto || 0) : 0;
    const pix = Math.round(subtotal * (1 - pixPct / 100) * 100) / 100;
    return { qtd, bruto, atual, proximo, desconto, subtotal, pix, pixPct };
}

export function lerDesejos() {
    try {
        const lista = JSON.parse(localStorage.getItem(LOJA_DESEJOS_KEY) || "[]");
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

export function gravarDesejos(ids) {
    localStorage.setItem(LOJA_DESEJOS_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("erp-loja-desejos"));
    return ids;
}

export function toggleDesejo(id) {
    const chave = String(id);
    const atual = lerDesejos();
    const ids = atual.includes(chave) ? atual.filter((x) => x !== chave) : [chave, ...atual];
    return gravarDesejos(ids);
}

export function linkWhatsAppProduto(produto, cfg = lerLoja()) {
    const fone = foneWa(cfg.dados.whatsapp || cfg.atendimento?.find((a) => a.tipo === "whatsapp")?.numero);
    const texto = encodeURIComponent(`Olá! Quero comprar: ${produto.nome} (${brl(precoVenda(produto))})`);
    return `https://wa.me/${fone}?text=${texto}`;
}

export function lerClientesLoja() {
    try {
        const lista = JSON.parse(localStorage.getItem(LOJA_CLIENTES_KEY) || "[]");
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

export function gravarClientesLoja(lista) {
    localStorage.setItem(LOJA_CLIENTES_KEY, JSON.stringify(lista));
    return lista;
}

export function clienteLojaAtual() {
    try {
        return JSON.parse(localStorage.getItem(LOJA_CLIENTE_KEY) || "null");
    } catch {
        return null;
    }
}

export function entrarClienteLoja(cliente) {
    localStorage.setItem(LOJA_CLIENTE_KEY, JSON.stringify(cliente));
    window.dispatchEvent(new Event("erp-loja-cliente"));
    return cliente;
}

export function sairClienteLoja() {
    localStorage.removeItem(LOJA_CLIENTE_KEY);
    window.dispatchEvent(new Event("erp-loja-cliente"));
}

export function cadastrarClienteLoja({ nome, email, senha, telefone }) {
    const lista = lerClientesLoja();
    if (lista.some((c) => String(c.email).toLowerCase() === String(email).toLowerCase())) {
        throw new Error("Já existe uma conta com este e-mail.");
    }
    const cliente = {
        id: `cli-${Date.now()}`,
        nome: String(nome || "").trim(),
        email: String(email || "").trim().toLowerCase(),
        senha: String(senha || ""),
        telefone: String(telefone || "").trim(),
        criadoEm: new Date().toISOString()
    };
    gravarClientesLoja([cliente, ...lista]);
    return entrarClienteLoja({ id: cliente.id, nome: cliente.nome, email: cliente.email, telefone: cliente.telefone });
}

export function autenticarClienteLoja(email, senha) {
    const cliente = lerClientesLoja().find(
        (c) => String(c.email).toLowerCase() === String(email).toLowerCase() && c.senha === senha
    );
    if (!cliente) {
        throw new Error("E-mail ou senha inválidos.");
    }
    return entrarClienteLoja({ id: cliente.id, nome: cliente.nome, email: cliente.email, telefone: cliente.telefone });
}

export function lerArquivosLoja() {
    try {
        const lista = JSON.parse(localStorage.getItem(LOJA_ARQUIVOS_KEY) || "[]");
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

export function gravarArquivosLoja(lista) {
    localStorage.setItem(LOJA_ARQUIVOS_KEY, JSON.stringify(lista));
    return lista;
}

export function proximoNumeroPedidoLoja() {
    const n = Number(localStorage.getItem("erp-loja-seq-pedido") || "1000") + 1;
    localStorage.setItem("erp-loja-seq-pedido", String(n));
    return `LJ-${n}`;
}
