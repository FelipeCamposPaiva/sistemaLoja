import { useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import CardResumo from "../../components/cards/CardResumo";

import "../../styles/pages/produtos.css";

export default function CategoriasProdutos() {

    const [busca, setBusca] = useState("");

    // Futuramente será carregado do backend
    const categorias = [];

    const lista = useMemo(() => {

        return categorias.filter(categoria =>

            (categoria.nome || "")
                .toLowerCase()
                .includes(busca.toLowerCase())

        );

    }, [categorias, busca]);

    return (

        <div className="produtos-page">

            <PageHeader
                modulo="Cadastros"
                titulo="Categorias de Produtos"
                subtitulo="Gerencie as categorias dos produtos cadastrados"
                botao="+ Nova Categoria"
                onClick={() => {}}
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
                    valor={categorias.length}
                />

                <CardResumo
                    titulo="Ativas"
                    valor={0}
                />

                <CardResumo
                    titulo="Inativas"
                    valor={0}
                />

            </div>

            <div className="produtos-card">

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Categoria</th>
                            <th>Descrição</th>
                            <th>Status</th>
                            <th width="180">
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
                                            colSpan={5}
                                            style={{
                                                textAlign: "center",
                                                padding: "30px"
                                            }}
                                        >

                                            Nenhuma categoria cadastrada.

                                        </td>

                                    </tr>

                                )

                                :

                                lista.map(categoria => (

                                    <tr key={categoria.id}>

                                        <td>{categoria.id}</td>

                                        <td>{categoria.nome}</td>

                                        <td>{categoria.descricao}</td>

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

                                            <button className="btn-tabela">

                                                Editar

                                            </button>

                                            <button className="btn-tabela excluir">

                                                Excluir

                                            </button>

                                        </td>

                                    </tr>

                                ))

                        }

                    </tbody>

                </table>

            </div>

        </div>

    );

}