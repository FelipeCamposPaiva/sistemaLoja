export const GRAFICA_KEY = "erp-custos-grafica-v1";

export const WIREO = [
    { passo: "3x1", diametro: "1/4\"", folhas: 20, mm: 6.5, furo: 4 },
    { passo: "3x1", diametro: "5/16\"", folhas: 50, mm: 8, furo: 4 },
    { passo: "3x1", diametro: "3/8\"", folhas: 60, mm: 9.5, furo: 4 },
    { passo: "3x1", diametro: "7/16\"", folhas: 90, mm: 11, furo: 4 },
    { passo: "3x1", diametro: "1/2\"", folhas: 100, mm: 12.8, furo: 4 },
    { passo: "3x1", diametro: "9/16\"", folhas: 110, mm: 14.5, furo: 4 },
    { passo: "2x1", diametro: "5/8\"", folhas: 120, mm: 16, furo: 5.4 },
    { passo: "2x1", diametro: "3/4\"", folhas: 140, mm: 19, furo: 5.4 },
    { passo: "2x1", diametro: "7/8\"", folhas: 180, mm: 22, furo: 5.4 },
    { passo: "2x1", diametro: "1\"", folhas: 200, mm: 25.5, furo: 5.4 },
    { passo: "2x1", diametro: "1 1/8\"", folhas: 250, mm: 28.5, furo: 5.4 },
    { passo: "2x1", diametro: "1 1/4\"", folhas: 270, mm: 31.5, furo: 5.4 }
];

export const MATERIAIS_M2 = [
    { id: "banner", nome: "Banner (lona + cordão)", precoM2: 60 },
    { id: "lona", nome: "Lona", precoM2: 60 },
    { id: "adesivo-reto", nome: "Adesivo corte reto", precoM2: 80 },
    { id: "adesivo-recorte", nome: "Adesivo recorte eletrônico", precoM2: 80 }
];

export const LASER_PB = [
    { id: "toner", nome: "Toner", preco: 120, rendimento: 40000 },
    { id: "revelador", nome: "Revelador", preco: 504, rendimento: 300000 },
    { id: "cilindro", nome: "Cilindro", preco: 728, rendimento: 300000 },
    { id: "belt", nome: "Belt de transferência", preco: 345, rendimento: 500000 },
    { id: "fusor", nome: "Rolo fusor e unhas", preco: 150, rendimento: 200000 },
    { id: "toalha", nome: "Toalha de limpeza", preco: 90, rendimento: 200000 },
    { id: "papel", nome: "Papel (resma 500)", preco: 0, rendimento: 500 }
];

export const GRUPOS_LOJA = [
    "PAPELARIA",
    "PERSONALIZADOS",
    "PRESENTES",
    "ARTESANATO",
    "AVIAMENTO",
    "BIJUTERIA",
    "BRINQUEDO",
    "CHIP E RECARGA",
    "CUTELARIA",
    "ELETRONICO",
    "FESTA JUNINA",
    "INVERNO",
    "NATAL",
    "UTILIDADES",
    "VERÃO",
    "SERVIÇOS DE INFORMÁTICA"
];

export const SERVICOS_PERSONALIZADOS = [
    "Adesivo em vinil recortado para carro (por lado)",
    "Almofada 20x30 cm",
    "Almofada personalizada 30x30",
    "Arte grande ou trabalhosa",
    "Arte p/ caderneta de vacina",
    "Arte para cardápio (1 lado)",
    "Arte simples",
    "Banner em lona com cordão",
    "Body personalizado",
    "Camisa poliéster branca personalizada — adulto",
    "Camisa poliéster personalizada branca — infantil",
    "Caneca acrílica em gel",
    "Caneca alumínio colorida",
    "Caneca cerâmica glitter",
    "Caneca cerâmica mágica",
    "Caneca de alumínio brilhante 500 ml",
    "Caneca de chopp de vidro",
    "Caneca de chopp em vidro jateada",
    "Caneca de louça branca",
    "Caneca de vidro alça coração",
    "Caneca polímero branca",
    "Caneca polímero colorida",
    "Caneca polímero fotográfico",
    "Capa de caderno vinil A4",
    "Cartela de bingo de chá de bebê",
    "Chaveiro + cartão personalizado",
    "Chaveiro personalizado acrílico",
    "Chinelo",
    "Convite digital",
    "Copo polímero sem alça",
    "Corte em vinil — até 3 cm",
    "Garrafa alumínio 500 ml",
    "Garrafa degradê personalizada",
    "Impressão e corte em papel fotográfico A4",
    "Impressão em foto glossy adesivado",
    "Impressão em papel fotográfico A4",
    "Impressão em rolo matte — metro",
    "Impressão no fotográfico A2 (40x60)",
    "Letras 3D para painel",
    "Long drink (acima de 20 un)",
    "Mouse pad",
    "Nécessaire personalizada",
    "Papel adesivo glossy 130 g A4",
    "Papel fotográfico brilhante glossy 180 g A4",
    "Papel fotográfico brilhante glossy 230 g A4",
    "Polaroide",
    "Porta copos personalizado",
    "Quadro decorativo c/ moldura A2",
    "Taxa para aplicação do vinil",
    "Toalha lavabo personalizada",
    "Topo de bolo",
    "Vinil impresso A3",
    "Vinil impresso A3 (com corte)",
    "Vinil impresso A4",
    "Vinil sublimático m²"
];

export function custosPadrao() {
    return {
        materiais: MATERIAIS_M2.map((m) => ({ ...m })),
        laserPb: LASER_PB.map((m) => ({ ...m })),
        cobertura: 5,
        margem: 50
    };
}

export function lerCustosGrafica() {
    try {
        const bruto = JSON.parse(localStorage.getItem(GRAFICA_KEY) || "null");
        if (bruto?.materiais && bruto?.laserPb) {
            return { ...custosPadrao(), ...bruto };
        }
    } catch {
        /* ignore */
    }
    return custosPadrao();
}

export function gravarCustosGrafica(cfg) {
    localStorage.setItem(GRAFICA_KEY, JSON.stringify(cfg));
}

export function folhas75g(folhas, gramatura) {
    const g = Number(gramatura) || 75;
    return (Number(folhas) || 0) * (g / 75);
}

export function sugerirWireo({ folhas, mm, gramatura }) {
    const eq = mm
        ? Number(mm)
        : null;
    const folhasEq = folhas75g(folhas, gramatura);
    const lista = WIREO;
    const achado = lista.find((row) => (eq != null ? row.mm >= eq : row.folhas >= folhasEq));
    const ultimo = lista[lista.length - 1];
    if (!achado) {
        return { ...ultimo, acima: true, folhasEq };
    }
    return { ...achado, acima: false, folhasEq };
}

export function areaM2(largura, altura, unidade) {
    const l = Number(largura) || 0;
    const a = Number(altura) || 0;
    const fat = unidade === "cm" ? 0.01 : 1;
    return l * fat * (a * fat);
}

export function custoLaserPb(consumiveis, cobertura) {
    const cob = Number(cobertura) || 5;
    return consumiveis.reduce((soma, item) => {
        const preco = Number(item.preco) || 0;
        const rend = Number(item.rendimento) || 0;
        if (!rend) {
            return soma;
        }
        return soma + (preco / rend) * (cob / 5);
    }, 0);
}

export function comMargem(custo, margem) {
    const m = Number(margem) || 0;
    if (m >= 100) {
        return custo;
    }
    return custo / (1 - m / 100);
}

export function formatarBRL(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
