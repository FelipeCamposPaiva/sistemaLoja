import { resource } from "./api";

const marcas = resource("/marcas");

export async function listarMarcas() {
    const dados = await marcas.list();
    return Array.isArray(dados) ? dados : [];
}

export async function salvarMarca(marca) {
    return marcas.create(marca);
}

export async function atualizarMarca(id, marca) {
    return marcas.update(id, { ...marca, id });
}

export async function excluirMarca(id) {
    await marcas.remove(id);
}

export async function importarMarcas(nomes) {
    const { default: api } = await import("./api");
    const payload = (Array.isArray(nomes) ? nomes : [])
        .map((item) => (typeof item === "string" ? { nome: item, ativo: true } : { ...item, ativo: item?.ativo !== false }))
        .filter((item) => String(item.nome || "").trim());
    const { data } = await api.post("/marcas/importar", payload, { timeout: 180000 });
    return data || { novos: 0, ignorados: 0, total: 0 };
}

export async function enviarLogoMarca(id, arquivo) {
    const { default: api } = await import("./api");
    const corpo = new FormData();
    corpo.append("arquivo", arquivo);
    const { data } = await api.post(`/marcas/${id}/logo`, corpo, {
        timeout: 120000,
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

export async function removerLogoMarca(id) {
    const { default: api } = await import("./api");
    const { data } = await api.delete(`/marcas/${id}/logo`);
    return data;
}

export async function buscarLogosNaWeb() {
    const { default: api } = await import("./api");
    const { data } = await api.post("/marcas/logos-web", {}, { timeout: 300000 });
    return data || { baixados: 0, gerados: 0, produtos: 0, marcas: 0 };
}
