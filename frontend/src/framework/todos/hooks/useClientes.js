import { useMemo } from "react";

import { useCliente } from "../contexts/ClienteContext";

/*
|--------------------------------------------------------------------------
| useClientes
|--------------------------------------------------------------------------
|
| Hook para gerenciamento de Clientes e Fornecedores.
|
| Recursos
| ✔ Listagem
| ✔ CRUD
| ✔ Pesquisa
| ✔ Refresh
| ✔ Loading
| ✔ React 19
|
*/

export default function useClientes() {

    const {

        clientes,

        loading,

        carregarClientes,

        adicionarCliente,

        atualizarCliente,

        removerCliente

    } = useCliente();

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    function buscarPorId(id) {

        return clientes.find(

            cliente => cliente.id === id

        );

    }

    function pesquisar(texto = "") {

        if (!texto.trim()) {

            return clientes;

        }

        const termo = texto.toLowerCase();

        return clientes.filter(cliente =>

            cliente.nome?.toLowerCase().includes(termo)

            ||

            cliente.razaoSocial?.toLowerCase().includes(termo)

            ||

            cliente.cpfCnpj?.toLowerCase().includes(termo)

            ||

            cliente.email?.toLowerCase().includes(termo)

            ||

            cliente.telefone?.toLowerCase().includes(termo)

        );

    }

    function clientesAtivos() {

        return clientes.filter(

            cliente =>

                cliente.ativo !== false

        );

    }

    function fornecedores() {

        return clientes.filter(

            cliente =>

                cliente.tipo === "FORNECEDOR"

        );

    }

    function consumidores() {

        return clientes.filter(

            cliente =>

                cliente.tipo === "CLIENTE"

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Memo
    |--------------------------------------------------------------------------
    */

    return useMemo(() => ({

        clientes,

        loading,

        atualizarLista:

            carregarClientes,

        adicionarCliente,

        atualizarCliente,

        removerCliente,

        buscarPorId,

        pesquisar,

        clientesAtivos,

        fornecedores,

        consumidores

    }), [

        clientes,

        loading,

        carregarClientes,

        adicionarCliente,

        atualizarCliente,

        removerCliente

    ]);

}