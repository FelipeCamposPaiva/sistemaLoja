import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import CardResumo from "../../components/cards/CardResumo";
import ModalProduto from "../../components/modals/produtos/ModalProduto";

import {
    listarProdutos,
    salvarProduto,
    atualizarProduto,
    excluirProduto
} from "../../services/produto.service";

import "../../styles/pages/produtos.css";

export default function Produtos() {

    const [produtos, setProdutos] = useState([]);

    const [loading, setLoading] = useState(true);

    const [busca, setBusca] = useState("");

    const [filtro, setFiltro] = useState("TODOS");

    const [modalAberto, setModalAberto] = useState(false);

    const [produtoEditando, setProdutoEditando] = useState(null);

    useEffect(() => {

        carregarProdutos();

    }, []);

    async function carregarProdutos() {

        try {

            setLoading(true);

            const dados = await listarProdutos();

            setProdutos(dados || []);

        } catch (erro) {

            console.error("Erro ao carregar produtos:", erro);

        } finally {

            setLoading(false);

        }

    }

    async function salvar(dados) {

        try {

            if (produtoEditando) {

                await atualizarProduto(
                    produtoEditando.id,
                    dados
                );

            } else {

                await salvarProduto(dados);

            }

            fecharModal();

            carregarProdutos();

        } catch (erro) {

            console.error("Erro ao salvar:", erro);

        }

    }

    async function remover(id) {

        if (!window.confirm("Deseja excluir este produto?"))
            return;

        try {

            await excluirProduto(id);

            carregarProdutos();

        } catch (erro) {

            console.error("Erro ao excluir:", erro);

        }

    }

    function abrirNovo() {

        setProdutoEditando(null);

        setModalAberto(true);

    }

    function editar(produto) {

        setProdutoEditando(produto);

        setModalAberto(true);

    }

    function fecharModal() {

        setModalAberto(false);

        setProdutoEditando(null);

    }

    const produtosFiltrados = useMemo(() => {

        return produtos.filter((produto) => {

            const texto = busca.toLowerCase();

            const encontrado =

                (produto.nome || "")
                    .toLowerCase()
                    .includes(texto)

                ||

                (produto.sku || "")
                    .toLowerCase()
                    .includes(texto)

                ||

                (produto.codigoBarras || "")
                    .toLowerCase()
                    .includes(texto);

            if (!encontrado)
                return false;

            if (filtro === "ATIVOS")
                return produto.ativo;

            if (filtro === "ESTOQUE_BAIXO")
                return Number(produto.estoque || 0)
                    <= Number(produto.estoqueMinimo || 0);

            if (filtro === "SEM_ESTOQUE")
                return Number(produto.estoque || 0) <= 0;

            return true;

        });

    }, [produtos, busca, filtro]);

    const totalProdutos = produtos.length;

    const produtosAtivos =
        produtos.filter(p => p.ativo).length;

    const estoqueBaixo =
        produtos.filter(p =>
            Number(p.estoque || 0)
            <= Number(p.estoqueMinimo || 0)
        ).length;

    const semEstoque =
        produtos.filter(p =>
            Number(p.estoque || 0) <= 0
        ).length;

    if (loading)
        return <Loading />;

    return (

        <div className="produtos-page">

<PageHeader
    modulo="Cadastros"
    titulo="Produtos"
    subtitulo="Gerencie todos os produtos cadastrados."
    botao="+ Incluir Produto"
    onClick={abrirNovo}
/>

<div className="produtos-busca">

    <input
        type="text"
        placeholder="Pesquisar por nome, SKU ou código de barras..."
        value={busca}
        onChange={(e) =>
            setBusca(e.target.value)
        }
    />

</div>

<div className="produtos-filtros">

    <button
        className={
            filtro === "TODOS"
                ? "btn-primary"
                : ""
        }
        onClick={() =>
            setFiltro("TODOS")
        }
    >
        Todos
    </button>

    <button
        className={
            filtro === "ATIVOS"
                ? "btn-primary"
                : ""
        }
        onClick={() =>
            setFiltro("ATIVOS")
        }
    >
        Ativos
    </button>

    <button
        className={
            filtro === "ESTOQUE_BAIXO"
                ? "btn-primary"
                : ""
        }
        onClick={() =>
            setFiltro("ESTOQUE_BAIXO")
        }
    >
        Estoque Baixo
    </button>

    <button
        className={
            filtro === "SEM_ESTOQUE"
                ? "btn-primary"
                : ""
        }
        onClick={() =>
            setFiltro("SEM_ESTOQUE")
        }
    >
        Sem Estoque
    </button>

</div>

<div className="produtos-resumo">

    <CardResumo
        titulo="Total Produtos"
        valor={totalProdutos}
    />

    <CardResumo
        titulo="Produtos Ativos"
        valor={produtosAtivos}
    />

    <CardResumo
        titulo="Estoque Baixo"
        valor={estoqueBaixo}
    />

    <CardResumo
        titulo="Sem Estoque"
        valor={semEstoque}
    />

</div>

<div className="produtos-card">

    <table>

        <thead>

            <tr>

                <th>SKU</th>

                <th>Cód. Barras</th>

                <th>Produto</th>

                <th>Categoria</th>

                <th>Preço</th>

                <th>Estoque</th>

                <th>Mínimo</th>

                <th>Localização</th>

                <th>Status</th>

                <th width="180">

                    Ações

                </th>

            </tr>

        </thead>

        <tbody>{

    produtosFiltrados.length === 0 ?

        (

            <tr>

                <td
                    colSpan={10}
                    style={{
                        textAlign: "center",
                        padding: "30px"
                    }}
                >

                    Nenhum produto encontrado.

                </td>

            </tr>

        )

        :

        produtosFiltrados.map(produto => (

            <tr key={produto.id}>

                <td>

                    {produto.sku}

                </td>

                <td>

                    {produto.codigoBarras}

                </td>

                <td>

                    {produto.nome}

                </td>

                <td>

                    {produto.categoria || "-"}

                </td>

                <td>

                    {

                        Number(
                            produto.preco || 0
                        ).toLocaleString(
                            "pt-BR",
                            {
                                style: "currency",
                                currency: "BRL"
                            }
                        )

                    }

                </td>

                <td>

                    {produto.estoque}

                </td>

                <td>

                    {produto.estoqueMinimo}

                </td>

                <td>

                    {produto.localizacao || "-"}

                </td>

                <td>

                    {

                        Number(produto.estoque || 0) <= 0 ?

                            (

                                <span className="status-vermelho">

                                    Sem Estoque

                                </span>

                            )

                            :

                            Number(produto.estoque || 0)
                            <= Number(produto.estoqueMinimo || 0)

                            ?

                            (

                                <span className="status-amarelo">

                                    Estoque Baixo

                                </span>

                            )

                            :

                            (

                                <span className="status-verde">

                                    Normal

                                </span>

                            )

                    }

                </td>

                <td>

                    <button
                        className="btn-tabela"
                        onClick={() =>
                            editar(produto)
                        }
                    >

                        Editar

                    </button>

                    <button
                        className="btn-tabela excluir"
                        onClick={() =>
                            remover(produto.id)
                        }
                    >

                        Excluir

                    </button>

                </td>

            </tr>

        ))

}
        </tbody>

    </table>

</div>
            <ModalProduto
                aberto={modalAberto}
                fechar={fecharModal}
                salvar={salvar}
                produtoEditando={produtoEditando}
            />

        </div>

    );

}


      