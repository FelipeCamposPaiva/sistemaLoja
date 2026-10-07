import ROTAS from "./rotas";

function comConsulta(caminho, consulta) {
    const params = new URLSearchParams();
    Object.entries(consulta || {}).forEach(([chave, valor]) => {
        const texto = String(valor || "").trim();
        if (texto) {
            params.set(chave, texto);
        }
    });
    const qs = params.toString();
    return qs ? `${caminho}?${qs}` : caminho;
}

export function termoProduto(produto) {
    return String(produto?.sku || produto?.gtin || produto?.codigoBarras || produto?.nome || "").trim();
}

export function ligacoesProduto(produto) {
    const termo = termoProduto(produto);
    const local = String(produto?.localizacao || "").split(",")[0].trim();
    const marca = String(produto?.marca || "").trim();
    const grupo = String(produto?.grupo || produto?.categoria || "").trim();
    const links = [
        { id: "estoque", label: "Estoque deste item", to: comConsulta(ROTAS.ESTOQUE, { q: termo }) },
        { id: "pdv", label: "Vender no PDV", to: comConsulta(ROTAS.PDV, { sku: termo }) },
        { id: "pedidos", label: "Pedidos de venda", to: `${comConsulta(ROTAS.PEDIDO_VENDA, { q: termo })}#list` },
        { id: "promocoes", label: "Promoções", to: comConsulta(ROTAS.PROMOCOES, { q: termo }) },
        { id: "reajuste", label: "Reajuste de preços", to: comConsulta(ROTAS.REAJUSTE_PRECOS, { q: termo }) },
        { id: "inventario", label: "Inventário", to: comConsulta(ROTAS.INVENTARIO, { localizacao: local }) },
        { id: "local", label: "Mapa de localização", to: comConsulta(ROTAS.LOCALIZACOES, { localizacao: local }) },
        { id: "marca", label: marca ? `Marca ${marca}` : "Marcas", to: `${comConsulta("/marcas", { q: marca })}#list` },
        { id: "categoria", label: grupo ? `Categoria ${grupo}` : "Categorias", to: comConsulta("/produto_categorias", { q: grupo }) },
        { id: "nfe", label: "Notas de entrada", to: `${comConsulta(ROTAS.NOTAS_ENTRADA, { q: termo })}#list` },
        { id: "compras", label: "Ordens de compra", to: `${ROTAS.ORDENS_COMPRA}#list` },
        { id: "loja", label: "Ver na loja", to: produto?.id ? `/produto/${produto.id}` : comConsulta("/busca", { q: termo }) },
        { id: "auditoria", label: "Auditoria de estoque", to: ROTAS.AUDITORIA_ESTOQUE },
        { id: "producao", label: "Ordens deste produto", to: comConsulta(ROTAS.PRODUCAO, { produto: produto?.nome || termo }) },
        {
            id: "producao-nova",
            label: "Nova ordem de produção",
            to: `${comConsulta(ROTAS.PRODUCAO, {
                produto: produto?.nome || termo,
                sku: produto?.sku || "",
                unidade: produto?.unidade || "",
                quantidade: "1"
            })}#add`
        }
    ];
    return links;
}

export function atalhosCatalogo({ busca = "", marca = "", grupo = "", localizacao = "" } = {}) {
    const termo = String(busca || "").trim();
    return [
        { id: "estoque", label: "Estoque", to: comConsulta(ROTAS.ESTOQUE, { q: termo }) },
        { id: "pdv", label: "PDV", to: comConsulta(ROTAS.PDV, { sku: termo }) },
        { id: "pedidos", label: "Pedidos", to: `${comConsulta(ROTAS.PEDIDO_VENDA, { q: termo })}#list` },
        { id: "separacao", label: "Separação", to: ROTAS.SEPARACAO },
        { id: "promocoes", label: "Promoções", to: comConsulta(ROTAS.PROMOCOES, { q: termo }) },
        { id: "reajuste", label: "Reajuste", to: comConsulta(ROTAS.REAJUSTE_PRECOS, { q: termo }) },
        { id: "inventario", label: "Inventário", to: comConsulta(ROTAS.INVENTARIO, { localizacao }) },
        { id: "local", label: "Localizações", to: comConsulta(ROTAS.LOCALIZACOES, { localizacao }) },
        { id: "marcas", label: "Marcas", to: `${comConsulta("/marcas", { q: marca || termo })}#list` },
        { id: "categorias", label: "Categorias", to: comConsulta("/produto_categorias", { q: grupo || termo }) },
        { id: "nfe", label: "Notas de entrada", to: `${comConsulta(ROTAS.NOTAS_ENTRADA, { q: termo })}#list` },
        { id: "compras", label: "Compras", to: `${ROTAS.ORDENS_COMPRA}#list` },
        { id: "embalagens", label: "Embalagens", to: ROTAS.EMBALAGENS },
        { id: "loja", label: "Loja", to: termo ? comConsulta("/busca", { q: termo }) : ROTAS.LOJA },
        { id: "integracoes", label: "E-commerce", to: ROTAS.INTEGRACOES },
        { id: "producao", label: "Ordens de produção", to: comConsulta(ROTAS.PRODUCAO, { produto: termo }) }
    ];
}
