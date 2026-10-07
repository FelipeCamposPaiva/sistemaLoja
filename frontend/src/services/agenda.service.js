import api, { resource } from "./api";
import { normalizarEmpresas, unidadeAtual } from "../constants/empresas";

const agenda = resource("/agenda");

function extrasDe(texto) {
    try {
        const parsed = JSON.parse(texto || "");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed;
        }
    } catch {
        /* texto livre */
    }
    return { texto: texto || "" };
}

export function eventoDaApi(raw) {
    const extra = extrasDe(raw?.descricao);
    return {
        id: raw?.id,
        data: raw?.dataEvento || extra.data || new Date().toISOString().slice(0, 10),
        hora: extra.hora || "09",
        min: extra.min || "00",
        descricao: extra.texto || raw?.titulo || "",
        usuarios: extra.usuarios || [],
        status: raw?.tipo || extra.status || "pendente",
        empresas: extra.empresas ? normalizarEmpresas(extra.empresas) : [unidadeAtual().id],
        criadoPor: extra.criadoPor || "",
        google: Boolean(extra.google),
        origem: extra.origem || "",
        origemId: extra.origemId || null,
        href: extra.href || ""
    };
}

export function eventoParaApi(evento) {
    return {
        id: typeof evento.id === "number" ? evento.id : null,
        titulo: evento.descricao,
        tipo: evento.status || "pendente",
        dataEvento: evento.data,
        descricao: JSON.stringify({
            texto: evento.descricao,
            hora: evento.hora,
            min: evento.min,
            usuarios: evento.usuarios || [],
            empresas: evento.empresas || [],
            criadoPor: evento.criadoPor || "",
            google: Boolean(evento.google),
            origem: evento.origem || "",
            origemId: evento.origemId || null,
            href: evento.href || ""
        }),
        cor: "#3b82f6"
    };
}

export async function listarAgenda() {
    const dados = await agenda.list();
    return Array.isArray(dados) ? dados.map(eventoDaApi) : [];
}

export async function salvarAgenda(evento) {
    const payload = eventoParaApi(evento);
    if (typeof evento.id === "number") {
        return eventoDaApi(await agenda.update(evento.id, payload));
    }
    return eventoDaApi(await agenda.create(payload));
}

export async function excluirAgenda(id) {
    await agenda.remove(id);
}

export async function pingApi() {
    const { data } = await api.get("/teste");
    return data;
}
