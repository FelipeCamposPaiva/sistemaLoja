const DURACAO_MS = 8000;
const REPETE_MS = 20000;

let ultimoClique = null;
let avisos = [];
let ouvintesInstalados = false;

const ouvintes = new Set();
const timers = new Map();
const vistos = new Map();

function publicar() {
    ouvintes.forEach((ouvinte) => ouvinte(avisos));
}

export function motivoErro(erro) {
    if (!erro) {
        return "Erro desconhecido";
    }
    if (typeof erro === "string") {
        return erro;
    }
    const data = erro.response?.data ?? erro.data;
    if (typeof data === "string" && data.trim() && !data.trim().startsWith("<")) {
        return data.trim();
    }
    if (data?.mensagem) {
        return String(data.mensagem);
    }
    if (data?.message && data.message !== "No message available") {
        return String(data.message);
    }
    if (typeof data?.error === "string" && data.error !== "No message available") {
        return data.status ? `${data.status} ${data.error}` : String(data.error);
    }
    if (erro.code === "ECONNABORTED") {
        return "A operação demorou demais e foi interrompida.";
    }
    if (erro.message === "Network Error") {
        return "Sem ligação com o servidor.";
    }
    const status = erro.response?.status;
    if (status && (!erro.message || /^Request failed with status code \d+$/.test(erro.message))) {
        if (status === 400 || status === 409 || status === 422) {
            return "Os dados enviados não puderam ser aceitos.";
        }
        if (status === 403) {
            return "Sem permissão para esta operação.";
        }
        if (status === 404) {
            return "Não foi possível encontrar o que foi pedido.";
        }
        if (status >= 500) {
            return "O servidor encontrou um erro.";
        }
        return `O servidor respondeu com erro ${status}.`;
    }
    if (erro.message) {
        return String(erro.message);
    }
    return "Erro desconhecido";
}

function descreverClique(ev) {
    const bruto = ev.target;
    const alvo = bruto?.closest?.("button, a, input, textarea, select, label, [role='button']") || bruto;
    const tag = String(alvo?.tagName || "área").toLowerCase();
    const classe = typeof alvo?.className === "string"
        ? alvo.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".")
        : "";
    const texto = String(
        alvo?.getAttribute?.("aria-label")
        || alvo?.getAttribute?.("title")
        || (["button", "a", "input", "textarea", "select", "label"].includes(tag) ? alvo?.innerText || alvo?.placeholder : "")
        || ""
    ).replace(/\s+/g, " ").trim().slice(0, 72);
    const onde = texto ? `${tag} “${texto}”` : (classe ? `${tag}.${classe}` : tag);
    return {
        x: Math.round(ev.clientX),
        y: Math.round(ev.clientY),
        quando: Date.now(),
        onde
    };
}

function registrarPonteiro(ev) {
    if (ev.clientX == null || ev.clientY == null) {
        return;
    }
    ultimoClique = descreverClique(ev);
}

export function marcarTela() {
    ultimoClique = null;
    vistos.clear();
}

export function fecharErro(id) {
    window.clearTimeout(timers.get(id));
    timers.delete(id);
    avisos = avisos.filter((aviso) => aviso.id !== id);
    publicar();
}

export function fecharAvisos() {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
    avisos = [];
    publicar();
}

function textoLimpo(motivo) {
    return String(motivo || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 420);
}

function linhaClique(clique) {
    const ondeClique = clique || ultimoClique;
    if (!ondeClique || ondeClique.x == null) {
        return "";
    }
    return `Clique em ${ondeClique.onde} · ${ondeClique.x}×${ondeClique.y} px`;
}

function publicarAviso(tipo, motivo, clique) {
    const texto = textoLimpo(motivo);
    if (!texto || /resizeobserver/i.test(texto) || texto === "Script error.") {
        return;
    }
    const agora = Date.now();
    const chave = `${tipo}:${texto}`;
    const anterior = vistos.get(chave);
    const cliqueNovo = ultimoClique && (!anterior || ultimoClique.quando > anterior.clique);
    if (anterior && !cliqueNovo && agora - anterior.quando < REPETE_MS) {
        return;
    }
    vistos.set(chave, { quando: agora, clique: ultimoClique?.quando || 0 });
    const aviso = {
        id: `${agora}-${Math.random().toString(16).slice(2)}`,
        tipo,
        motivo: texto,
        onde: linhaClique(clique)
    };
    avisos = [...avisos.filter((item) => item.tipo !== tipo || item.motivo !== texto).slice(-2), aviso];
    publicar();
    timers.set(aviso.id, window.setTimeout(() => fecharErro(aviso.id), DURACAO_MS));
}

export function mostrarErro(motivo, clique) {
    publicarAviso("erro", typeof motivo === "string" ? motivo : motivoErro(motivo) || "Erro desconhecido", clique);
}

export function mostrarAlerta(motivo, clique) {
    publicarAviso("alerta", typeof motivo === "string" ? motivo : motivoErro(motivo) || "Atenção.", clique);
}

export function mostrarSucesso(motivo, clique) {
    publicarAviso("ok", motivo || "Concluído com sucesso.", clique);
}

export function avisarErroSeAcao(erro) {
    if (!erro || erro.code === "ERR_CANCELED" || erro.name === "CanceledError") {
        return;
    }
    const status = erro.response?.status;
    if (status === 400 || status === 409 || status === 422) {
        mostrarAlerta(erro, ultimoClique);
        return;
    }
    mostrarErro(erro, ultimoClique);
}

function mensagemResposta(data, padrao) {
    if (typeof data === "string" && data.trim() && !data.trim().startsWith("<")) {
        return data.trim().slice(0, 180);
    }
    if (data?.mensagem) {
        return String(data.mensagem);
    }
    if (data?.message && data.message !== "No message available") {
        return String(data.message);
    }
    return padrao;
}

export function avisarSucessoSeAcao(response) {
    const config = response?.config || {};
    if (config.aviso === false || config.headers?.["X-Silencioso"]) {
        return;
    }
    const method = String(config.method || "get").toLowerCase();
    if (!["post", "put", "patch", "delete"].includes(method)) {
        return;
    }
    const url = String(config.url || "").toLowerCase();
    if (/\/auth\/|dashboard|listar|buscar|filtro|relatorio|consulta/.test(url)) {
        return;
    }
    if (!ultimoClique || Date.now() - ultimoClique.quando > 8000) {
        return;
    }
    const padrao = method === "delete"
        ? "Registro excluído."
        : method === "post"
            ? "Registro salvo."
            : "Alteração salva.";
    mostrarSucesso(mensagemResposta(response.data, padrao), ultimoClique);
}

export function inscreverAvisos(ouvinte) {
    ouvintes.add(ouvinte);
    ouvinte(avisos);
    return () => ouvintes.delete(ouvinte);
}

export function instalarAvisos() {
    if (ouvintesInstalados || typeof window === "undefined") {
        return;
    }
    ouvintesInstalados = true;
    document.addEventListener("pointerdown", registrarPonteiro, true);
    document.addEventListener("click", registrarPonteiro, true);
    window.addEventListener("error", (ev) => {
        if (ev.target && ev.target !== window) {
            return;
        }
        mostrarErro(ev.error || ev.message, ultimoClique);
    });
    window.addEventListener("unhandledrejection", (ev) => {
        mostrarErro(ev.reason, ultimoClique);
    });
}
