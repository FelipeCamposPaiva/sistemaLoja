import api, { resource } from "./api";
import { osDaApi, osParaApi } from "../constants/ordensServico";
import { listarClientes } from "./clientes.service";

const os = resource("/os");

export async function listarOS() {
    const dados = await os.list();
    return Array.isArray(dados) ? dados.map(osDaApi) : [];
}

export async function buscarOS(id) {
    return osDaApi(await os.get(id));
}

export async function salvarOS(ordem) {
    return osDaApi(await os.create(osParaApi(ordem)));
}

export async function atualizarOS(id, ordem) {
    return osDaApi(await os.update(id, osParaApi({ ...ordem, id })));
}

export async function excluirOS(id) {
    return os.remove(id);
}

export async function atualizarStatusOS(id, status) {
    const { data } = await api.put(`/os/${id}/status`, { status });
    return osDaApi(data);
}

export async function importarOSLote(itens, onProgress) {
    let lista = (itens || []).map((item) => ({ ...item }));
    try {
        const clientes = await listarClientes();
        lista = lista.map((osItem) => {
            const c = clientes.find((item) => item.tinyId && String(item.tinyId) === String(osItem.contatoOlistId));
            if (!c) {
                return osItem;
            }
            return {
                ...osItem,
                clienteId: c.id,
                fantasia: osItem.fantasia || c.fantasia || ""
            };
        });
    } catch {
        /* cadastro de clientes opcional */
    }
    lista = lista.map(osParaApi);
    onProgress?.({ parte: 1, partes: 1, novos: 0, atualizados: 0, erros: 0 });
    try {
        const { data } = await api.post("/os/importar", lista);
        return {
            novos: Number(data?.novos || 0),
            atualizados: Number(data?.atualizados || 0),
            erros: Number(data?.erros || 0),
            total: Number(data?.total || lista.length)
        };
    } catch (erro) {
        const status = erro?.response?.status;
        if (status !== 404 && status !== 405) {
            throw erro;
        }
        let novos = 0;
        let atualizados = 0;
        let erros = 0;
        const atuais = await listarOS();
        for (const item of lista) {
            try {
                const existente = atuais.find((o) => Number(o.numero) === Number(item.numero) && item.numero);
                if (existente?.id) {
                    await os.update(existente.id, { ...item, id: existente.id });
                    atualizados++;
                } else {
                    await os.create(item);
                    novos++;
                }
            } catch {
                erros++;
            }
        }
        return { novos, atualizados, erros, total: novos + atualizados };
    }
}
