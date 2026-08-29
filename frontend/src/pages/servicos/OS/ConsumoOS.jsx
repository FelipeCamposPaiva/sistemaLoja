import { useEffect, useState } from "react";

import Loading from "../../components/common/Loading";
import CardResumo from "../../components/cards/CardResumo";

import {
    listarConsumos,
    salvarConsumo,
    excluirConsumo,
    consumirOS
} from "../../services/osConsumo.service";

import "../../styles/pages/produtos.css";

export default function ConsumoOS({ osId }) {

    const [itens, setItens] = useState([]);

    const [loading, setLoading] = useState(true);

    const [produtoId, setProdutoId] = useState("");

    const [quantidade, setQuantidade] = useState("");

    useEffect(() => {

        if (osId) {

            carregarConsumos();

        }

    }, [osId]);

    async function carregarConsumos() {

        try {

            setLoading(true);

            const dados = await listarConsumos(osId);

            setItens(dados || []);

        } catch (erro) {

            console.error(erro);

        } finally {

            setLoading(false);

        }

    }

    async function adicionar() {

        try {

            await salvarConsumo({

                osId,

                produtoId: Number(produtoId),

                quantidade: Number(quantidade)

            });

            setProdutoId("");

            setQuantidade("");

            carregarConsumos();

        } catch (erro) {

            console.error(erro);

        }

    }

    async function remover(id) {

        if (!window.confirm("Excluir item de consumo?"))
            return;

        try {

            await excluirConsumo(id);

            carregarConsumos();

        } catch (erro) {

            console.error(erro);

        }

    }

    async function consumir() {

        if (!window.confirm("Consumir estoque desta Ordem de Serviço?"))
            return;

        try {

            await consumirOS(osId);

            carregarConsumos();

        } catch (erro) {

            console.error(erro);

        }

    }

    if (loading)
        return <Loading />;

    return (

        <div>

            <div className="produtos-resumo">

                <CardResumo
                    titulo="Itens"
                    valor={itens.length}
                />

                <CardResumo
                    titulo="Quantidade Total"
                    valor={
                        itens.reduce(
                            (total, item) =>
                                total +
                                Number(item.quantidade || 0),
                            0
                        )
                    }
                />

            </div>

            <div className="produtos-card">

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr auto auto",
                        gap: 15,
                        padding: 20
                    }}
                >

                    <input
                        type="number"
                        placeholder="ID do Produto"
                        value={produtoId}
                        onChange={(e) =>
                            setProdutoId(e.target.value)
                        }
                    />

                    <input
                        type="number"
                        placeholder="Quantidade"
                        value={quantidade}
                        onChange={(e) =>
                            setQuantidade(e.target.value)
                        }
                    />

                    <button
                        className="btn-primary"
                        onClick={adicionar}
                    >

                        Adicionar

                    </button>

                    <button
                        className="btn-outline"
                        onClick={consumir}
                    >

                        Consumir Estoque

                    </button>

                </div>

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>Produto</th>

                            <th>Quantidade</th>

                            <th width="140">

                                Ações

                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            itens.length === 0 ?

                                (

                                    <tr>

                                        <td
                                            colSpan={4}
                                            style={{
                                                textAlign: "center",
                                                padding: "40px"
                                            }}
                                        >

                                            Nenhum item adicionado.

                                        </td>

                                    </tr>

                                )

                                :

                                itens.map(item => (

                                    <tr key={item.id}>

                                        <td>

                                            {item.id}

                                        </td>

                                        <td>

                                            {item.produtoId}

                                        </td>

                                        <td>

                                            {item.quantidade}

                                        </td>

                                        <td>

                                            <button
                                                className="btn-tabela excluir"
                                                onClick={() =>
                                                    remover(item.id)
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

        </div>

    );

}