import { useMemo } from "react";

import { useEstoque as useEstoqueContext } from "../contexts/EstoqueContext";

/*
|--------------------------------------------------------------------------
| useEstoque
|--------------------------------------------------------------------------
|
| Hook para gerenciamento do Estoque.
|
| Recursos:
| ✔ Estoque
| ✔ Pesquisa
| ✔ Buscar Produto
| ✔ Estoque Baixo
| ✔ Sem Estoque
| ✔ Inventário
| ✔ Atualização
| ✔ React 19
|
*/

export default function useEstoque() {

    const {

        estoque,

        loading,

        carregar

    } = useEstoqueContext();

    /*
    |--------------------------------------------------------------------------
    | Buscar por ID
    |--------------------------------------------------------------------------
    */

    function buscarPorId(id) {

        return estoque.find(

            item => item.id === id

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Buscar Produto
    |--------------------------------------------------------------------------
    */

    function buscarProduto(produtoId) {

        return estoque.find(

            item =>

                item.produtoId === produtoId

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Pesquisa
    |--------------------------------------------------------------------------
    */

    function pesquisar(texto = "") {

        if (!texto.trim()) {

            return estoque;

        }

        const termo = texto.toLowerCase();

        return estoque.filter(item =>

            item.nome?.toLowerCase().includes(termo)

            ||

            item.codigo?.toLowerCase().includes(termo)

            ||

            item.codigoBarras?.toLowerCase().includes(termo)

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Sem Estoque
    |--------------------------------------------------------------------------
    */

    function semEstoque() {

        return estoque.filter(item =>

            Number(item.quantidade || 0) <= 0

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Estoque Baixo
    |--------------------------------------------------------------------------
    */

    function estoqueBaixo() {

        return estoque.filter(item =>

            Number(item.quantidade || 0)

            <=

            Number(item.estoqueMinimo || 0)

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Estoque Positivo
    |--------------------------------------------------------------------------
    */

    function estoquePositivo() {

        return estoque.filter(item =>

            Number(item.quantidade || 0) > 0

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Valor Total
    |--------------------------------------------------------------------------
    */

    function valorTotal() {

        return estoque.reduce(

            (total, item) =>

                total +

                (

                    Number(item.quantidade || 0)

                    *

                    Number(item.custo || 0)

                ),

            0

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Quantidade Total
    |--------------------------------------------------------------------------
    */

    function quantidadeTotal() {

        return estoque.reduce(

            (total, item) =>

                total +

                Number(item.quantidade || 0),

            0

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Memo
    |--------------------------------------------------------------------------
    */

    return useMemo(() => ({

        estoque,

        loading,

        atualizarLista: carregar,

        buscarPorId,

        buscarProduto,

        pesquisar,

        semEstoque,

        estoqueBaixo,

        estoquePositivo,

        valorTotal,

        quantidadeTotal

    }), [

        estoque,

        loading,

        carregar

    ]);

}