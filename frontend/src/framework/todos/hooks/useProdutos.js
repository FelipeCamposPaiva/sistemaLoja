import { useMemo } from "react";

import { useProdutos } from "../contexts/ProdutoContext";

/*
|--------------------------------------------------------------------------
| useProdutos
|--------------------------------------------------------------------------
|
| Hook para gerenciamento de Produtos.
|
| Recursos:
| ✔ CRUD
| ✔ Pesquisa
| ✔ Estoque
| ✔ Código de Barras
| ✔ SKU
| ✔ Produtos Ativos
| ✔ Produtos Promocionais
| ✔ React 19
|
*/

export default function useProdutos() {

    const {

        produtos,

        loading,

        carregarProdutos,

        adicionarProduto,

        atualizarProduto,

        removerProduto

    } = useProdutos();

    /*
    |--------------------------------------------------------------------------
    | Buscar por ID
    |--------------------------------------------------------------------------
    */

    function buscarPorId(id) {

        return produtos.find(

            produto => produto.id === id

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Buscar Código de Barras
    |--------------------------------------------------------------------------
    */

    function buscarPorCodigoBarras(codigo) {

        return produtos.find(

            produto =>

                produto.codigoBarras === codigo

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Buscar SKU
    |--------------------------------------------------------------------------
    */

    function buscarPorSku(sku) {

        return produtos.find(

            produto =>

                produto.sku === sku

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Pesquisa
    |--------------------------------------------------------------------------
    */

    function pesquisar(texto = "") {

        if (!texto.trim()) {

            return produtos;

        }

        const termo = texto.toLowerCase();

        return produtos.filter(produto =>

            produto.nome?.toLowerCase().includes(termo)

            ||

            produto.codigoBarras?.toLowerCase().includes(termo)

            ||

            produto.sku?.toLowerCase().includes(termo)

            ||

            produto.marca?.toLowerCase().includes(termo)

            ||

            produto.categoria?.toLowerCase().includes(termo)

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Produtos Ativos
    |--------------------------------------------------------------------------
    */

    function ativos() {

        return produtos.filter(

            produto =>

                produto.ativo !== false

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Produtos Inativos
    |--------------------------------------------------------------------------
    */

    function inativos() {

        return produtos.filter(

            produto =>

                produto.ativo === false

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Produtos sem Estoque
    |--------------------------------------------------------------------------
    */

    function semEstoque() {

        return produtos.filter(

            produto =>

                Number(produto.estoque || 0) <= 0

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Estoque Baixo
    |--------------------------------------------------------------------------
    */

    function estoqueBaixo() {

        return produtos.filter(produto =>

            Number(produto.estoque || 0)

            <=

            Number(produto.estoqueMinimo || 0)

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Promoção
    |--------------------------------------------------------------------------
    */

    function promocao() {

        return produtos.filter(

            produto =>

                produto.promocao === true

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Memo
    |--------------------------------------------------------------------------
    */

    return useMemo(() => ({

        produtos,

        loading,

        atualizarLista:

            carregarProdutos,

        adicionarProduto,

        atualizarProduto,

        removerProduto,

        buscarPorId,

        buscarPorCodigoBarras,

        buscarPorSku,

        pesquisar,

        ativos,

        inativos,

        semEstoque,

        estoqueBaixo,

        promocao

    }), [

        produtos,

        loading,

        carregarProdutos,

        adicionarProduto,

        atualizarProduto,

        removerProduto

    ]);

}