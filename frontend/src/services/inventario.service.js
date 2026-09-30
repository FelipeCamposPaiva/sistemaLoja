import { resource } from "./api";

const inventario = resource("/inventario");

export async function listarInventarios() {
    const dados = await inventario.list();
    return Array.isArray(dados) ? dados : [];
}

export async function criarInventario(dados) {
    return inventario.create(dados);
}
