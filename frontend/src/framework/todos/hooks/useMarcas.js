import { useMemo } from "react";

import { useMarcas as useMarcasContext } from "../contexts/MarcaContext";

/*
|--------------------------------------------------------------------------
| useMarcas
|--------------------------------------------------------------------------
|
| Hook para gerenciamento de Marcas.
|
| Recursos:
| ✔ CRUD
| ✔ Pesquisa
| ✔ Buscar por ID
| ✔ Buscar por Nome
| ✔ Marcas Ativas
| ✔ Atualizar Lista
| ✔ React 19
|
*/

export default function useMarcas() {

    const {

        marcas,

        loading,

        carregarMarcas,

        adicionarMarca,

        atualizarMarca,

        removerMarca

    } = useMarcasContext();

    /*
    |--------------------------------------------------------------------------
    | Buscar por ID
    |--------------------------------------------------------------------------
    */

    function buscarPorId(id) {

        return marcas.find(

            marca => marca.id === id

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Buscar por Nome
    |--------------------------------------------------------------------------
    */

    function buscarPorNome(nome) {

        return marcas.find(

            marca =>

                marca.nome?.toLowerCase() ===

                nome.toLowerCase()

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Pesquisa
    |--------------------------------------------------------------------------
    */

    function pesquisar(texto = "") {

        if (!texto.trim()) {

            return marcas;

        }

        const termo = texto.toLowerCase();

        return marcas.filter(marca =>

            marca.nome?.toLowerCase().includes(termo)

            ||

            marca.descricao?.toLowerCase().includes(termo)

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Marcas Ativas
    |--------------------------------------------------------------------------
    */

    function ativas() {

        return marcas.filter(

            marca =>

                marca.ativo !== false

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Marcas Inativas
    |--------------------------------------------------------------------------
    */

    function inativas() {

        return marcas.filter(

            marca =>

                marca.ativo === false

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Quantidade
    |--------------------------------------------------------------------------
    */

    function total() {

        return marcas.length;

    }

    /*
    |--------------------------------------------------------------------------
    | Memo
    |--------------------------------------------------------------------------
    */

    return useMemo(() => ({

        marcas,

        loading,

        atualizarLista:

            carregarMarcas,

        adicionarMarca,

        atualizarMarca,

        removerMarca,

        buscarPorId,

        buscarPorNome,

        pesquisar,

        ativas,

        inativas,

        total

    }), [

        marcas,

        loading,

        carregarMarcas,

        adicionarMarca,

        atualizarMarca,

        removerMarca

    ]);

}