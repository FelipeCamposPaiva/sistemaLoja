import {

    createContext,

    useContext,

    useEffect,

    useState,

    useMemo,

    useCallback

} from "react";

import clienteService from "../services/cliente.service";

/*
|--------------------------------------------------------------------------
| CONTEXT
|--------------------------------------------------------------------------
*/

const ClienteContext = createContext(null);

/*
|--------------------------------------------------------------------------
| PROVIDER
|--------------------------------------------------------------------------
*/

export function ClienteProvider({

    children

}) {

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [loading, setLoading] = useState(false);

    const [saving, setSaving] = useState(false);

    const [removing, setRemoving] = useState(false);

    const [clienteAtual, setClienteAtual] = useState(null);

    const [clientes, setClientes] = useState([]);

    const [selecionados, setSelecionados] = useState([]);

    const [filtros, setFiltros] = useState({

        texto: "",

        tipo: "TODOS",

        cidade: "",

        ativo: true

    });

    /*
    |--------------------------------------------------------------------------
    | RESUMO
    |--------------------------------------------------------------------------
    */

    const resumo = useMemo(() => {

        return {

            total:

                clientes.length,

            clientes:

                clientes.filter(

                    x => x.tipo === "CLIENTE"

                ).length,

            fornecedores:

                clientes.filter(

                    x => x.tipo === "FORNECEDOR"

                ).length,

            funcionarios:

                clientes.filter(

                    x => x.tipo === "FUNCIONARIO"

                ).length,

            transportadoras:

                clientes.filter(

                    x =>

                        x.tipo ===

                        "TRANSPORTADORA"

                ).length,

            outros:

                clientes.filter(

                    x =>

                        x.tipo ===

                        "OUTROS"

                ).length

        };

    }, [

        clientes

    ]);

    /*
    |--------------------------------------------------------------------------
    | INICIALIZA
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        carregarClientes();

    }, []);

        /*
    |--------------------------------------------------------------------------
    | CARREGAR CLIENTES
    |--------------------------------------------------------------------------
    */

    const carregarClientes = useCallback(async () => {

        setLoading(true);

        try {

            const dados = await clienteService.listar();

            setClientes(

                Array.isArray(dados)

                    ? dados

                    : []

            );

        }

        catch (erro) {

            console.error(

                "Erro ao carregar clientes:",

                erro

            );

            setClientes([]);

        }

        finally {

            setLoading(false);

        }

    }, []);

    /*
    |--------------------------------------------------------------------------
    | RECARREGAR
    |--------------------------------------------------------------------------
    */

    async function recarregar() {

        await carregarClientes();

    }

    /*
    |--------------------------------------------------------------------------
    | BUSCAR POR ID
    |--------------------------------------------------------------------------
    */

    async function buscarPorId(id) {

        try {

            const cliente =

                await clienteService.buscar(id);

            setClienteAtual(cliente);

            return cliente;

        }

        catch (erro) {

            console.error(

                erro

            );

            return null;

        }

    }

    /*
    |--------------------------------------------------------------------------
    | DEFINE CLIENTE ATUAL
    |--------------------------------------------------------------------------
    */

    function selecionarCliente(cliente) {

        setClienteAtual(cliente);

    }

    /*
    |--------------------------------------------------------------------------
    | LIMPA CLIENTE ATUAL
    |--------------------------------------------------------------------------
    */

    function limparClienteAtual() {

        setClienteAtual(null);

    }

    /*
    |--------------------------------------------------------------------------
    | ATUALIZA UM CLIENTE NA LISTA
    |--------------------------------------------------------------------------
    */

    function atualizarLista(clienteAtualizado) {

        setClientes(lista =>

            lista.map(item =>

                item.id === clienteAtualizado.id

                    ? clienteAtualizado

                    : item

            )

        );

    }

    /*
    |--------------------------------------------------------------------------
    | ADICIONA UM CLIENTE
    |--------------------------------------------------------------------------
    */

    function adicionarLista(clienteNovo) {

        setClientes(lista => [

            clienteNovo,

            ...lista

        ]);

    }

    /*
    |--------------------------------------------------------------------------
    | REMOVE UM CLIENTE
    |--------------------------------------------------------------------------
    */

    function removerLista(id) {

        setClientes(lista =>

            lista.filter(

                item =>

                    item.id !== id

            )

        );

    }

        /*
    |--------------------------------------------------------------------------
    | SALVAR
    |--------------------------------------------------------------------------
    */

    async function salvar(cliente) {

        setSaving(true);

        try {

            const novoCliente =

                await clienteService.salvar(cliente);

            adicionarLista(

                novoCliente

            );

            return {

                sucesso: true,

                dados: novoCliente

            };

        }

        catch (erro) {

            console.error(

                erro

            );

            return {

                sucesso: false,

                mensagem:

                    erro.response?.data?.message ||

                    "Erro ao salvar cliente."

            };

        }

        finally {

            setSaving(false);

        }

    }

    /*
    |--------------------------------------------------------------------------
    | ATUALIZAR
    |--------------------------------------------------------------------------
    */

    async function atualizar(id, dados) {

        setSaving(true);

        try {

            const clienteAtualizado =

                await clienteService.atualizar(

                    id,

                    dados

                );

            atualizarLista(

                clienteAtualizado

            );

            if (

                clienteAtual?.id === id

            ) {

                setClienteAtual(

                    clienteAtualizado

                );

            }

            return {

                sucesso: true,

                dados: clienteAtualizado

            };

        }

        catch (erro) {

            console.error(

                erro

            );

            return {

                sucesso: false,

                mensagem:

                    erro.response?.data?.message ||

                    "Erro ao atualizar cliente."

            };

        }

        finally {

            setSaving(false);

        }

    }

    /*
    |--------------------------------------------------------------------------
    | EXCLUIR
    |--------------------------------------------------------------------------
    */

    async function excluir(id) {

        setRemoving(true);

        try {

            await clienteService.excluir(id);

            removerLista(id);

            if (

                clienteAtual?.id === id

            ) {

                setClienteAtual(null);

            }

            return {

                sucesso: true

            };

        }

        catch (erro) {

            console.error(

                erro

            );

            return {

                sucesso: false,

                mensagem:

                    erro.response?.data?.message ||

                    "Erro ao excluir cliente."

            };

        }

        finally {

            setRemoving(false);

        }

    }

    /*
    |--------------------------------------------------------------------------
    | DUPLICAR
    |--------------------------------------------------------------------------
    */

    async function duplicar(id) {

        const cliente =

            await buscarPorId(id);

        if (!cliente) {

            return null;

        }

        const copia = {

            ...cliente

        };

        delete copia.id;

        copia.nome =

            `${cliente.nome} (Cópia)`;

        return salvar(

            copia

        );

    }

    /*
    |--------------------------------------------------------------------------
    | ATIVAR / DESATIVAR
    |--------------------------------------------------------------------------
    */

    async function alterarStatus(id, ativo) {

        return atualizar(

            id,

            {

                ativo

            }

        );

    }

        /*
    |--------------------------------------------------------------------------
    | PESQUISA LOCAL
    |--------------------------------------------------------------------------
    */

    function pesquisar(texto = "") {

        if (!texto) {

            return clientes;

        }

        const busca =

            texto.toLowerCase();

        return clientes.filter(cliente =>

            (cliente.nome || "")
                .toLowerCase()
                .includes(busca)

            ||

            (cliente.cpfCnpj || "")
                .toLowerCase()
                .includes(busca)

            ||

            (cliente.email || "")
                .toLowerCase()
                .includes(busca)

            ||

            (cliente.telefone || "")
                .toLowerCase()
                .includes(busca)

            ||

            (cliente.cidade || "")
                .toLowerCase()
                .includes(busca)

        );

    }

    /*
    |--------------------------------------------------------------------------
    | FILTRAR
    |--------------------------------------------------------------------------
    */

    function filtrar(opcoes = {}) {

        return clientes.filter(cliente => {

            if (

                opcoes.tipo &&

                opcoes.tipo !== "TODOS" &&

                cliente.tipo !== opcoes.tipo

            ) {

                return false;

            }

            if (

                opcoes.cidade &&

                cliente.cidade !== opcoes.cidade

            ) {

                return false;

            }

            if (

                opcoes.ativo !== undefined &&

                cliente.ativo !== opcoes.ativo

            ) {

                return false;

            }

            return true;

        });

    }

    /*
    |--------------------------------------------------------------------------
    | FILTROS
    |--------------------------------------------------------------------------
    */

    function atualizarFiltros(novosFiltros) {

        setFiltros({

            ...filtros,

            ...novosFiltros

        });

    }

    function limparFiltros() {

        setFiltros({

            texto: "",

            tipo: "TODOS",

            cidade: "",

            ativo: true

        });

    }

    /*
    |--------------------------------------------------------------------------
    | SELEÇÃO
    |--------------------------------------------------------------------------
    */

    function selecionar(id) {

        setSelecionados(lista => {

            if (

                lista.includes(id)

            ) {

                return lista.filter(

                    item => item !== id

                );

            }

            return [

                ...lista,

                id

            ];

        });

    }

    /*
    |--------------------------------------------------------------------------
    | SELECIONAR TODOS
    |--------------------------------------------------------------------------
    */

    function selecionarTodos() {

        setSelecionados(

            clientes.map(

                item => item.id

            )

        );

    }

    /*
    |--------------------------------------------------------------------------
    | LIMPAR SELEÇÃO
    |--------------------------------------------------------------------------
    */

    function limparSelecao() {

        setSelecionados([]);

    }

    /*
    |--------------------------------------------------------------------------
    | CLIENTE SELECIONADO
    |--------------------------------------------------------------------------
    */

    function estaSelecionado(id) {

        return selecionados.includes(id);

    }

    /*
    |--------------------------------------------------------------------------
    | ORDENAÇÃO
    |--------------------------------------------------------------------------
    */

    function ordenar(campo = "nome", crescente = true) {

        return [...clientes].sort((a, b) => {

            const valorA =

                (a[campo] ?? "")
                    .toString()
                    .toLowerCase();

            const valorB =

                (b[campo] ?? "")
                    .toString()
                    .toLowerCase();

            if (valorA < valorB) {

                return crescente ? -1 : 1;

            }

            if (valorA > valorB) {

                return crescente ? 1 : -1;

            }

            return 0;

        });

    }

        /*
    |--------------------------------------------------------------------------
    | CONTEXT
    |--------------------------------------------------------------------------
    */

    const value = useMemo(

        () => ({

            /*
            --------------------------------------------------------------
            | Estados
            --------------------------------------------------------------
            */

            clientes,

            clienteAtual,

            selecionados,

            filtros,

            resumo,

            loading,

            saving,

            removing,

            /*
            --------------------------------------------------------------
            | Carregamento
            --------------------------------------------------------------
            */

            carregarClientes,

            recarregar,

            buscarPorId,

            /*
            --------------------------------------------------------------
            | CRUD
            --------------------------------------------------------------
            */

            salvar,

            atualizar,

            excluir,

            duplicar,

            alterarStatus,

            /*
            --------------------------------------------------------------
            | Cliente Atual
            --------------------------------------------------------------
            */

            selecionarCliente,

            limparClienteAtual,

            /*
            --------------------------------------------------------------
            | Pesquisa
            --------------------------------------------------------------
            */

            pesquisar,

            filtrar,

            ordenar,

            /*
            --------------------------------------------------------------
            | Filtros
            --------------------------------------------------------------
            */

            atualizarFiltros,

            limparFiltros,

            /*
            --------------------------------------------------------------
            | Seleção
            --------------------------------------------------------------
            */

            selecionar,

            selecionarTodos,

            limparSelecao,

            estaSelecionado

        }),

        [

            clientes,

            clienteAtual,

            selecionados,

            filtros,

            resumo,

            loading,

            saving,

            removing

        ]

    );

    /*
    |--------------------------------------------------------------------------
    | PROVIDER
    |--------------------------------------------------------------------------
    */

    return (

        <ClienteContext.Provider

            value={value}

        >

            {children}

        </ClienteContext.Provider>

    );

}

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export function useClientes() {

    const context =

        useContext(

            ClienteContext

        );

    if (!context) {

        throw new Error(

            "useClientes deve ser utilizado dentro do ClienteProvider."

        );

    }

    return context;

}

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default ClienteContext;