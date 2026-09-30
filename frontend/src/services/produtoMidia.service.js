import api from "./api";

export function parseMidia(raw) {
    try {
        const parsed = typeof raw?.midia === "string" ? JSON.parse(raw.midia || "{}") : (raw?.midia || {});
        return {
            fotos: Array.isArray(parsed.fotos) ? parsed.fotos : [],
            videos: Array.isArray(parsed.videos) ? parsed.videos : [],
            anuncios: Array.isArray(parsed.anuncios) ? parsed.anuncios : []
        };
    } catch {
        return { fotos: [], videos: [], anuncios: [] };
    }
}

export function urlMidia(url) {
    if (!url) {
        return "";
    }
    if (/^(https?:|blob:|data:)/i.test(url)) {
        return url;
    }
    if (import.meta.env.DEV) {
        return url.startsWith("/") ? url : `/${url}`;
    }
    const base = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
    const origem = String(base).replace(/\/api\/?$/, "");
    return `${origem}${url.startsWith("/") ? url : `/${url}`}`;
}

export function canaisMidiaAtivos() {
    try {
        const bruto = JSON.parse(localStorage.getItem("erp-integracoes-v1") || "null");
        const lista = Array.isArray(bruto) ? bruto : [
            { id: "shopee", ativa: true },
            { id: "mercado-livre", ativa: true }
        ];
        return lista
            .filter((item) => item.ativa && (item.id === "mercado-livre" || item.id === "shopee"))
            .map((item) => item.id);
    } catch {
        return ["mercado-livre", "shopee"];
    }
}

export function enviarVideoAtivo(canal) {
    try {
        const all = JSON.parse(localStorage.getItem("erp-integracao-cfg-v1") || "{}");
        return (all[canal] || {}).enviarVideo !== false;
    } catch {
        return true;
    }
}

export function canaisAutoPublicar() {
    return canaisMidiaAtivos().filter(enviarVideoAtivo);
}

export async function enviarMidiaProduto(produtoId, tipo, arquivo) {
    const dados = new FormData();
    dados.append("arquivo", arquivo);
    const { data } = await api.post(`/produtos/${produtoId}/midia`, dados, {
        params: { tipo },
        timeout: 180000,
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

export async function enviarUrlVideo(produtoId, url, nome) {
    const { data } = await api.post(`/produtos/${produtoId}/midia/url`, { tipo: "VIDEO", url, nome });
    return data;
}

export async function excluirMidiaProduto(produtoId, midiaId) {
    await api.delete(`/produtos/${produtoId}/midia/${midiaId}`);
}

export async function publicarAnunciosProduto(produtoId, canais) {
    const destinos = (canais && canais.length) ? canais : canaisMidiaAtivos();
    const { data } = await api.post(`/produtos/${produtoId}/anuncios`, { canais: destinos });
    return Array.isArray(data) ? data : [];
}

export async function excluirAnunciosCanal(canal) {
    const { data } = await api.delete("/anuncios", { params: { canal } });
    return data;
}
