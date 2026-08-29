import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import CardResumo from "../../components/cards/CardResumo";
import ModalMarca from "../../components/modals/marcas/ModalMarca";

import {
    listarMarcas,
    salvarMarca,
    atualizarMarca,
    excluirMarca
} from "../../services/marca.service";

import "../../styles/pages/marcas.css";

export default function Marcas() {

    const [marcas, setMarcas] = useState([]);
    const [loading, setLoading] = useState(true);

    const [busca, setBusca] = useState("");

    const [modalAberto, setModalAberto] = useState(false);
    const [marcaEditando, setMarcaEditando] = useState(null);

    useEffect(() => {

        carregarMarcas();

    }, []);

    async function carregarMarcas() {

        try {

            setLoading(true);

            const dados = await listarMarcas();

            setMarcas(dados || []);

        } catch (erro) {

            console.error("Erro ao carregar marcas:", erro);

        } finally {

            setLoading(false);

        }

    }

    async function salvar(dados) {

        try {

            if (marcaEditando) {

                await atualizarMarca(
                    marcaEditando.id,
                    dados
                );

            } else {

                await salvarMarca(dados);

            }

            fecharModal();

            carregarMarcas();

        } catch (erro) {

            console.error("Erro ao salvar:", erro);

        }

    }

    async function remover(id) {

        if (!window.confirm("Deseja excluir esta marca?"))
            return;

        try {

            await excluirMarca(id);

            carregarMarcas();

        } catch (erro) {

            console.error("Erro ao excluir:", erro);

        }

    }

    function abrirNovo() {

        setMarcaEditando(null);

        setModalAberto(true);

    }

    function editar(marca) {

        setMarcaEditando(marca);

        setModalAberto(true);

    }

    function fecharModal() {

        setMarcaEditando(null);

        setModalAberto(false);

    }

    const lista = useMemo(() => {

        return marcas.filter(marca =>

            (marca.nome || "")
                .toLowerCase()
                .includes(busca.toLowerCase())

            ||

            (marca.fabricante || "")
                .toLowerCase()
                .includes(busca.toLowerCase())

        );

    }, [marcas, busca]);

    const total = marcas.length;

    const ativas = marcas.filter(
        marca => marca.ativo
    ).length;

    const inativas = total - ativas;

    if (loading)
        return <Loading />;

    return (

        <div className="produtos-page">

            <PageHeader
                modulo="Cadastros"
                titulo="Marcas"
                subtitulo="Gerencie as marcas cadastradas."
                botao="+ Nova Marca"
                onClick={abrirNovo}
            />

            <div className="produtos-busca">

                <input
                    type="text"
                    placeholder="Pesquisar marca..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(e.target.value)
                    }
                />

            </div>

            <div className="produtos-resumo">

                <CardResumo
                    titulo="Total"
                    valor={total}
                />

                <CardResumo
                    titulo="Ativas"
                    valor={ativas}
                />

                <CardResumo
                    titulo="Inativas"
                    valor={inativas}
                />

            </div>

            <div className="produtos-card">

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Logo</th>
                            <th>Nome</th>
                            <th>Fabricante</th>
                            <th>Telefone</th>
                            <th>Status</th>
                            <th width="170">
                                Ações
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            lista.length === 0 ?

                                (

                                    <tr>

                                        <td
                                            colSpan={7}
                                            style={{
                                                textAlign: "center",
                                                padding: "30px"
                                            }}
                                        >

                                            Nenhuma marca encontrada.

                                        </td>

                                    </tr>

                                )

                                :

                                lista.map(marca => (

                                    <tr key={marca.id}>

                                        <td>

                                            {marca.id}

                                        </td>

                                        <td>

                                            {

                                                marca.logo ?

                                                    <img
                                                        src={marca.logo}
                                                        alt={marca.nome}
                                                        style={{
                                                            width: 50,
                                                            height: 50,
                                                            objectFit: "contain",
                                                            borderRadius: 8
                                                        }}
                                                    />

                                                    :

                                                    "—"

                                            }

                                        </td>

                                        <td>

                                            {marca.nome}

                                        </td>

                                        <td>

                                            {marca.fabricante}

                                        </td>

                                        <td>

                                            {marca.telefone || "-"}

                                        </td>

                                        <td>

                                            {

                                                marca.ativo ?

                                                    <span className="status-verde">

                                                        Ativa

                                                    </span>

                                                    :

                                                    <span className="status-vermelho">

                                                        Inativa

                                                    </span>

                                            }

                                        </td>

                                        <td>

                                            <button
                                                className="btn-tabela"
                                                onClick={() =>
                                                    editar(marca)
                                                }
                                            >

                                                Editar

                                            </button>

                                            <button
                                                className="btn-tabela excluir"
                                                onClick={() =>
                                                    remover(marca.id)
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

            <ModalMarca
                aberto={modalAberto}
                fechar={fecharModal}
                salvar={salvar}
                marcaEditando={marcaEditando}
            />

        </div>

    );

}