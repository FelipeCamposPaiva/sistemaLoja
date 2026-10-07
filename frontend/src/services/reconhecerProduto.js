const CACHE = new Map();

function carregarImagem(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("imagem"));
        img.src = src;
    });
}

function pixelsDe(fonte, w, h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(fonte, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h).data;
}

export async function assinaturaVisual(fonte) {
    const chave = typeof fonte === "string" ? fonte : "";
    if (chave && CACHE.has(chave)) {
        return CACHE.get(chave);
    }
    const img = typeof fonte === "string" ? await carregarImagem(fonte) : fonte;
    const data = pixelsDe(img, 9, 8);
    const cinza = [];
    for (let i = 0; i < 72; i += 1) {
        const o = i * 4;
        cinza.push(data[o] * 0.299 + data[o + 1] * 0.587 + data[o + 2] * 0.114);
    }
    const bits = [];
    for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
            bits.push(cinza[y * 9 + x] > cinza[y * 9 + x + 1] ? 1 : 0);
        }
    }
    const histData = pixelsDe(img, 16, 16);
    const hist = new Array(64).fill(0);
    for (let i = 0; i < 256; i += 1) {
        const o = i * 4;
        const r = histData[o] >> 6;
        const g = histData[o + 1] >> 6;
        const b = histData[o + 2] >> 6;
        hist[(r << 4) | (g << 2) | b] += 1;
    }
    const assinatura = { bits, hist };
    if (chave) {
        CACHE.set(chave, assinatura);
    }
    return assinatura;
}

function distancia(a, b) {
    let diff = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i += 1) {
        if (a[i] !== b[i]) {
            diff += 1;
        }
    }
    return n ? diff / n : 1;
}

function cosseno(a, b) {
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i += 1) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    if (!na || !nb) {
        return 0;
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function similaridadeVisual(a, b) {
    if (!a || !b) {
        return 0;
    }
    return (1 - distancia(a.bits, b.bits)) * 0.42 + cosseno(a.hist, b.hist) * 0.58;
}

export function codigosBatem(a, b) {
    const sa = String(a || "").trim();
    const sb = String(b || "").trim();
    if (!sa || !sb) {
        return false;
    }
    if (sa.toLowerCase() === sb.toLowerCase()) {
        return true;
    }
    const da = sa.replace(/\D/g, "");
    const db = sb.replace(/\D/g, "");
    if (da.length < 8 || db.length < 8) {
        return false;
    }
    if (da === db) {
        return true;
    }
    if (da.length === 13 && db.length === 12 && da.endsWith(db)) {
        return true;
    }
    if (db.length === 13 && da.length === 12 && db.endsWith(da)) {
        return true;
    }
    return false;
}

export function acharPorCodigo(produtos, codigo) {
    return (produtos || []).filter((produto) => [produto.sku, produto.gtin, produto.codigoBarras, produto.codigoFornecedor]
        .some((campo) => codigosBatem(campo, codigo)));
}

export async function ranquearPorFoto(produtos, fonte, urlDe, onProgresso) {
    const alvo = await assinaturaVisual(fonte);
    const comFoto = (produtos || [])
        .map((produto) => ({ produto, url: urlDe(produto) }))
        .filter((item) => item.url);
    const ranking = [];
    let feitos = 0;
    const fila = [...comFoto];
    async function worker() {
        while (fila.length) {
            const item = fila.shift();
            if (!item) {
                return;
            }
            try {
                const ass = await assinaturaVisual(item.url);
                const score = similaridadeVisual(alvo, ass);
                if (score >= 0.62) {
                    ranking.push({ produto: item.produto, score });
                }
            } catch {
                /* foto fora do alcance do navegador */
            }
            feitos += 1;
            if (feitos % 8 === 0 || feitos === comFoto.length) {
                onProgresso?.(feitos, comFoto.length);
            }
        }
    }
    await Promise.all(Array.from({ length: 4 }, () => worker()));
    ranking.sort((a, b) => b.score - a.score);
    return { ranking: ranking.slice(0, 6), totalFotos: comFoto.length };
}

const FORMATOS = ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code", "itf", "codabar"];

export async function lerCodigoNaImagem(fonte) {
    if ("BarcodeDetector" in window) {
        try {
            const detector = new window.BarcodeDetector({ formats: FORMATOS });
            const codes = await detector.detect(fonte);
            if (codes[0]?.rawValue) {
                return String(codes[0].rawValue).trim();
            }
        } catch {
            /* tenta o leitor alternativo */
        }
    }
    try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const canvas = document.createElement("canvas");
        const w = fonte.videoWidth || fonte.naturalWidth || fonte.width || 640;
        const h = fonte.videoHeight || fonte.naturalHeight || fonte.height || 480;
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(fonte, 0, 0, w, h);
        const url = await new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : ""), "image/jpeg", 0.92);
        });
        if (!url) {
            return "";
        }
        try {
            const result = await reader.decodeFromImageUrl(url);
            return String(result?.getText?.() || "").trim();
        } finally {
            URL.revokeObjectURL(url);
        }
    } catch {
        return "";
    }
}
