import { useEffect, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import CardResumo from "../../components/cards/CardResumo";
import ModalCliente from "../../components/modals/clientes/ModalCliente";

import ClienteService from "../../services/cliente.service";

import "../../styles/pages/clientes.css";

export default function ClientesFornecedores() {

    const [clientes, setClientes] = useState([]);

    const [loading, setLoading] = useState(true);

    const [busca, setBusca] = useState("");

    const [filtro, setFiltro] = useState("TODOS");

    const [modalAberto, setModalAberto] = useState(false);

    const [clienteEditando, setClienteEditando] = useState(null);

    useEffect(() => {

        carregarClientes();

    }, []);

    async function carregarClientes() {

        try {

            setLoading(true);

            const dados = await ClienteService.listar();

            setClientes(dados || []);

        } catch (erro) {

            console.error(

                "Erro ao carregar clientes:",

                erro

            );

        } finally {

            setLoading(false);

        }

    }

        /*
    |--------------------------------------------------------------------------
    | SALVAR
    |--------------------------------------------------------------------------
    */

    async function salvar(dados) {

        try {

            if (clienteEditando) {

                await ClienteService.atualizar(

                    clienteEditando.id,

                    dados

                );

            } else {

                await ClienteService.salvar(

                    dados

                );

            }

            fecharModal();

            await carregarClientes();

        }

        catch (erro) {

            console.error(

                "Erro ao salvar cliente:",

                erro

            );

        }

    }

    /*
    |--------------------------------------------------------------------------
    | EXCLUIR
    |--------------------------------------------------------------------------
    */

    async function remover(id) {

        const confirmar = window.confirm(

            "Deseja realmente excluir este cadastro?"

        );

        if (!confirmar) {

            return;

        }

        try {

            await ClienteService.excluir(id);

            await carregarClientes();

        }

        catch (erro) {

            console.error(

                "Erro ao excluir cliente:",

                erro

            );

        }

    }

    /*
    |--------------------------------------------------------------------------
    | NOVO
    |--------------------------------------------------------------------------
    */

    function abrirNovo() {

        setClienteEditando(null);

        setModalAberto(true);

    }

    /*
    |--------------------------------------------------------------------------
    | EDITAR
    |--------------------------------------------------------------------------
    */

    function editar(cliente) {

        setClienteEditando(cliente);

        setModalAberto(true);

    }

    /*
    |--------------------------------------------------------------------------
    | FECHAR MODAL
    |--------------------------------------------------------------------------
    */

    function fecharModal() {

        setModalAberto(false);

        setClienteEditando(null);

    }

        /*
    |--------------------------------------------------------------------------
    | FILTROS
    |--------------------------------------------------------------------------
    */

    const dadosFiltrados = clientes.filter((item) => {

        const texto = busca.toLowerCase().trim();

        const encontrado =

            (item.nome || "")
                .toLowerCase()
                .includes(texto)

            ||

            (item.cpfCnpj || "")
                .toLowerCase()
                .includes(texto)

            ||

            (item.cidade || "")
                .toLowerCase()
                .includes(texto)

            ||

            (item.telefone || "")
                .toLowerCase()
                .includes(texto)

            ||

            (item.email || "")
                .toLowerCase()
                .includes(texto);

        if (filtro === "TODOS") {

            return encontrado;

        }

        return encontrado && item.tipo === filtro;

    });

    /*
    |--------------------------------------------------------------------------
    | RESUMOS
    |--------------------------------------------------------------------------
    */

    const totalClientes = clientes.filter(

        cliente => cliente.tipo === "CLIENTE"

    ).length;

    const totalFornecedores = clientes.filter(

        cliente => cliente.tipo === "FORNECEDOR"

    ).length;

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {

        return <Loading />;

    }

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (

        <div className="clientes-page">

            <PageHeader

                modulo="Cadastros"

                titulo="Clientes e Fornecedores"

                subtitulo="Gerencie clientes e fornecedores cadastrados."

                botao="+ Novo Cadastro"

                onClick={abrirNovo}

            />

            <div className="barra-pesquisa">

                <input

                    type="text"

                    placeholder="Pesquisar nome, CPF/CNPJ, cidade, telefone ou e-mail..."

                    value={busca}

                    onChange={(e) =>

                        setBusca(e.target.value)

                    }

                />

            </div>

            <div className="produtos-resumo">

                <CardResumo

                    titulo="Total"

                    valor={clientes.length}

                />

                <CardResumo

                    titulo="Clientes"

                    valor={totalClientes}

                />

                <CardResumo

                    titulo="Fornecedores"

                    valor={totalFornecedores}

                />

            </div>

            <div className="abas">

                <button

                    className={`aba ${

                        filtro === "TODOS"

                            ? "ativa"

                            : ""

                    }`}

                    onClick={() =>

                        setFiltro("TODOS")

                    }

                >

                    Todos

                    <span>

                        {clientes.length}

                    </span>

                </button>

                <button

                    className={`aba ${

                        filtro === "CLIENTE"

                            ? "ativa"

                            : ""

                    }`}

                    onClick={() =>

                        setFiltro("CLIENTE")

                    }

                >

                    Clientes

                    <span>

                        {totalClientes}

                    </span>

                </button>

                <button

                    className={`aba ${

                        filtro === "FORNECEDOR"

                            ? "ativa"

                            : ""

                    }`}

                    onClick={() =>

                        setFiltro("FORNECEDOR")

                    }

                >

                    Fornecedores

                    <span>

                        {totalFornecedores}

                    </span>

                </button>

            </div>

                        {/*====================================================*/}
            {/* TABELA */}
            {/*====================================================*/}

            <div className="tabela-card">

                <table className="tabela-clientes">

                    <thead>

                        <tr>

                            <th width="70">

                                ID

                            </th>

                            <th>

                                Nome

                            </th>

                            <th>

                                CPF/CNPJ

                            </th>

                            <th>

                                Cidade

                            </th>

                            <th>

                                Telefone

                            </th>

                            <th>

                                E-mail

                            </th>

                            <th width="140">

                                Tipo

                            </th>

                            <th width="190">

                                Ações

                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            dadosFiltrados.length === 0

                                ?

                                (

                                    <tr>

                                        <td

                                            colSpan={8}

                                            style={{

                                                textAlign: "center",

                                                padding: "40px"

                                            }}

                                        >

                                            Nenhum cadastro encontrado.

                                        </td>

                                    </tr>

                                )

                                :

                                dadosFiltrados.map((cliente) => (

                                    <tr

                                        key={cliente.id}

                                    >

                                        <td>

                                            {cliente.id}

                                        </td>

                                        <td>

                                            {cliente.nome}

                                        </td>

                                        <td>

                                            {cliente.cpfCnpj}

                                        </td>

                                        <td>

                                            {cliente.cidade}

                                        </td>

                                        <td>

                                            {cliente.telefone}

                                        </td>

                                        <td>

                                            {cliente.email}

                                        </td>

                                        <td>

                                            <span

                                                className={

                                                    cliente.tipo === "CLIENTE"

                                                        ?

                                                        "badge-cliente"

                                                        :

                                                        "badge-fornecedor"

                                                }

                                            >

                                                {

                                                    cliente.tipo

                                                }

                                            </span>

                                        </td>

                                        <td>

                                            <div className="acoes-tabela">

                                                <button

                                                    className="btn-tabela editar"

                                                    onClick={() =>

                                                        editar(cliente)

                                                    }

                                                >

                                                    Editar

                                                </button>

                                                <button

                                                    className="btn-tabela excluir"

                                                    onClick={() =>

                                                        remover(cliente.id)

                                                    }

                                                >

                                                    Excluir

                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))

                        }

                    </tbody>

                </table>

            </div>

                        {/*====================================================*/}
            {/* MODAL */}
            {/*====================================================*/}

            <ModalCliente

                aberto={modalAberto}

                fechar={fecharModal}

                salvar={salvar}

                clienteEditando={clienteEditando}

            />

        </div>

    );

}