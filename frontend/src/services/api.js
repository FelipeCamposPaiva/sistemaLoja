import axios from "axios";

import { avisarErroSeAcao, avisarSucessoSeAcao } from "../components/avisoErro";

export const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "/api" : "http://localhost:8080/api");

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
    }
});

function tokenAtual() {
    try {
        return localStorage.getItem("token");
    } catch {
        return null;
    }
}

export function setAuthorization(token) {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        return;
    }
    delete api.defaults.headers.common.Authorization;
}

export function clearAuthorization() {
    delete api.defaults.headers.common.Authorization;
}

function encerrarSessao() {
    try {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        sessionStorage.removeItem("erp-sessao-ok");
        document.cookie = "erp-sessao-ok=; Path=/; Max-Age=0; SameSite=Lax";
    } catch {
        /* ignore */
    }
    clearAuthorization();
    if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
    }
}

api.interceptors.request.use((config) => {
    const token = tokenAtual();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        avisarSucessoSeAcao(response);
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const url = String(error.config?.url || "");
        const ehAuthPublica = /\/auth\/(login|verificar-2fa|recuperar|redefinir|senha|2fa)/.test(url);
        const path = window.location.pathname;
        const vitrine = path === "/" || /^\/(loja|c|produto|carrinho|checkout|conta|desejos|p|busca)(\/|$)/.test(path) || path.startsWith("/m/");
        const encerrouSessao = status === 401 && !ehAuthPublica && tokenAtual() && !vitrine;
        const silencioso = error.config?.aviso === false || error.config?.headers?.["X-Silencioso"];
        if (encerrouSessao) {
            encerrarSessao();
        } else if (!ehAuthPublica && !silencioso) {
            avisarErroSeAcao(error);
        }
        return Promise.reject(error);
    }
);

export function resource(path) {
    return {
        list: (config) => api.get(path, config).then((res) => res.data),
        get: (id, config) => api.get(`${path}/${id}`, config).then((res) => res.data),
        create: (data, config) => api.post(path, data, config).then((res) => res.data),
        update: (id, data, config) => api.put(`${path}/${id}`, data, config).then((res) => res.data),
        patch: (id, data, config) => api.patch(`${path}/${id}`, data, config).then((res) => res.data),
        remove: (id, config) => api.delete(`${path}/${id}`, config).then((res) => res.data)
    };
}

export const get = (url, config) => api.get(url, config);
export const post = (url, data, config) => api.post(url, data, config);
export const put = (url, data, config) => api.put(url, data, config);
export const patch = (url, data, config) => api.patch(url, data, config);
export const remove = (url, config) => api.delete(url, config);

export default api;
