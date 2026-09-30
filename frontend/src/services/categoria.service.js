import { resource } from "./api";

const categorias = resource("/categorias");

export async function listarCategorias() {
    const dados = await categorias.list();
    return Array.isArray(dados) ? dados : [];
}

export async function salvarCategoria(categoria) {
    return categorias.create(categoria);
}

export async function atualizarCategoria(id, categoria) {
    return categorias.update(id, { ...categoria, id });
}

export async function excluirCategoria(id) {
    await categorias.remove(id);
}
