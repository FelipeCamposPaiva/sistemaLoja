import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import CardResumo from "../../components/cards/CardResumo";
import ModalCategoria from "../../components/modals/categorias/ModalCategoria";

import {
    listarCategorias,
    salvarCategoria,
    atualizarCategoria,
    excluirCategoria
} from "../../services/categoria.service";

import "../../styles/pages/produtos.css";

export default function Categorias() {

    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);

    const [busca, setBusca] = useState("");

    const [modalAberto, setModalAberto] = useState(false);
    const [categoriaEditando, setCategoriaEditando] = useState(null);

    useEffect(() => {
        carregarCategorias();
    }, []);

    async function carregarCategorias() {

        try {

            setLoading(true);

            const dados = await listarCategorias();

            setCategorias(dados || []);

        } catch (erro) {

            console.error("Erro ao carregar categorias:", erro);

        } finally {

            setLoading(false);

        }

    }

    async function salvar(dados) {

        try {

            if (categoriaEditando) {

                await atualizarCategoria(
                    categoriaEditando.id,
                    dados
                );

            } else {

                await salvarCategoria(dados);

            }

            fecharModal();

            carregarCategorias();

        } catch (erro) {

            console.error("Erro ao salvar categoria:", erro);

        }

    }

    async function remover(id) {

        const confirmar = window.confirm(
            "Deseja realmente excluir esta categoria?"
        );

        if (!confirmar)
            return;

        try {

            await excluirCategoria(id);

            carregarCategorias();

        } catch (erro) {

            console.error("Erro ao excluir:", erro);

        }

    }

    function abrirNovo() {

        setCategoriaEditando(null);

        setModalAberto(true);

    }

    function editar(categoria) {

        setCategoriaEditando(categoria);

        setModalAberto(true);

    }

    function fecharModal() {

        setCategoriaEditando(null);

        setModalAberto(false);

    }

    const categoriasFiltradas = useMemo(() => {

        return categorias.filter(categoria =>

            (categoria.nome || "")
                .toLowerCase()
                .includes(busca.toLowerCase())

        );

    }, [categorias, busca]);

    const totalCategorias = categorias.length;

    const totalAtivas = categorias.filter(
        categoria => categoria.ativo
    ).length;

    const totalInativas =
        totalCategorias - totalAtivas;

    if (loading) {

        return <Loading />;

    }

    return (

        <div className="produtos-page">

            <PageHeader
                modulo="Cadastros"
                titulo="Categorias"
                subtitulo="Gerenciamento de categorias de produtos"
                botao="+ Nova Categoria"
                onClick={abrirNovo}
            />

            <div className="produtos-busca">

                <input
                    type="text"
                    placeholder="Pesquisar categoria..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(e.target.value)
                    }
                />

            </div>

            <div className="produtos-resumo">

                <CardResumo
                    titulo="Total"
                    valor={totalCategorias}
                />

                <CardResumo
                    titulo="Ativas"
                    valor={totalAtivas}
                />

                <CardResumo
                    titulo="Inativas"
                    valor={totalInativas}
                />

            </div>

            <div className="produtos-card">

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Nome</th>
                            <th>Descrição</th>
                            <th>Status</th>
                            <th width="180">
                                Ações
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            categoriasFiltradas.length === 0 ?

                                (

                                    <tr>

                                        <td
                                            colSpan={5}
                                            style={{
                                                textAlign: "center",
                                                padding: "30px"
                                            }}
                                        >

                                            Nenhuma categoria encontrada.

                                        </td>

                                    </tr>

                                )

                                :

                                categoriasFiltradas.map(categoria => (

                                    <tr key={categoria.id}>

                                        <td>

                                            {categoria.id}

                                        </td>

                                        <td>

                                            {categoria.nome}

                                        </td>

                                        <td>

                                            {categoria.descricao || "-"}

                                        </td>

                                        <td>

                                            {

                                                categoria.ativo ?

                                                    <span className="status-verde">

                                                        Ativo

                                                    </span>

                                                    :

                                                    <span className="status-vermelho">

                                                        Inativo

                                                    </span>

                                            }

                                        </td>

                                        <td>

                                            <button
                                                className="btn-tabela"
                                                onClick={() =>
                                                    editar(categoria)
                                                }
                                            >

                                                Editar

                                            </button>

                                            <button
                                                className="btn-tabela excluir"
                                                onClick={() =>
                                                    remover(categoria.id)
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

            <ModalCategoria
                aberto={modalAberto}
                fechar={fecharModal}
                salvar={salvar}
                categoriaEditando={categoriaEditando}
            />

        </div>

    );

}