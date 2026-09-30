import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import CardResumo from "../../components/cards/CardResumo";

import {
    listarCaixa,
    salvarMovimento,
    excluirMovimento
} from "../../services/caixa.service";

import "../../styles/pages/ordens-compra.css";

export default function Caixa() {

    const [movimentos, setMovimentos] = useState([]);

    const [loading, setLoading] = useState(true);

    const [tipo, setTipo] = useState("ENTRADA");

    const [descricao, setDescricao] = useState("");

    const [valor, setValor] = useState("");

    useEffect(() => {

        carregarCaixa();

    }, []);

    async function carregarCaixa() {

        try {

            setLoading(true);

            const dados = await listarCaixa();

            setMovimentos(dados || []);

        } catch (erro) {

            console.error("Erro ao carregar caixa:", erro);

        } finally {

            setLoading(false);

        }

    }

    async function salvar() {

        try {

            await salvarMovimento({

                tipo,

                descricao,

                valor: Number(valor)

            });

            setDescricao("");

            setValor("");

            setTipo("ENTRADA");

            carregarCaixa();

        } catch (erro) {

            console.error("Erro ao salvar:", erro);

        }

    }

    async function remover(id) {

        if (!window.confirm("Deseja excluir esta movimentação?"))
            return;

        try {

            await excluirMovimento(id);

            carregarCaixa();

        } catch (erro) {

            console.error("Erro ao excluir:", erro);

        }

    }

    const totalEntradas = useMemo(() => {

        return movimentos
            .filter(m => m.tipo === "ENTRADA")
            .reduce(
                (total, item) =>
                    total + Number(item.valor || 0),
                0
            );

    }, [movimentos]);

    const totalSaidas = useMemo(() => {

        return movimentos
            .filter(m => m.tipo === "SAIDA")
            .reduce(
                (total, item) =>
                    total + Number(item.valor || 0),
                0
            );

    }, [movimentos]);

    const saldo = totalEntradas - totalSaidas;

    if (loading)
        return <Loading />;

    return (

        <div className="ordens-page">

        <PageHeader
    modulo="Financeiro"
    titulo="Caixa"
    subtitulo="Controle de entradas e saídas do caixa."
/>

<div className="produtos-resumo">

    <CardResumo
        titulo="Entradas"
        valor={totalEntradas.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        )}
    />

    <CardResumo
        titulo="Saídas"
        valor={totalSaidas.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        )}
    />

    <CardResumo
        titulo="Saldo"
        valor={saldo.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        )}
    />

</div>

<div className="ordens-card">

    <div
        className="grid-4"
        style={{ marginBottom: 20 }}
    >

        <select
            value={tipo}
            onChange={(e) =>
                setTipo(e.target.value)
            }
        >

            <option value="ENTRADA">
                Entrada
            </option>

            <option value="SAIDA">
                Saída
            </option>

        </select>

        <input
            type="text"
            placeholder="Descrição"
            value={descricao}
            onChange={(e) =>
                setDescricao(
                    e.target.value
                )
            }
        />

        <input
            type="number"
            step="0.01"
            placeholder="Valor"
            value={valor}
            onChange={(e) =>
                setValor(
                    e.target.value
                )
            }
        />

        <button
            className="btn-primary"
            onClick={salvar}
        >

            Salvar Movimentação

        </button>

    </div>

</div>

<div className="ordens-card">

    <table>

        <thead>

            <tr>

                <th>ID</th>

                <th>Tipo</th>

                <th>Origem</th>

                <th>Descrição</th>

                <th>Valor</th>

                <th>Data</th>

                <th width="140">

                    Ações

                </th>

            </tr>

        </thead>

        <tbody>

          {

    movimentos.length === 0 ?

        (

            <tr>

                <td
                    colSpan={7}
                    style={{
                        textAlign: "center",
                        padding: "30px"
                    }}
                >

                    Nenhuma movimentação encontrada.

                </td>

            </tr>

        )

        :

        movimentos.map((movimento) => (

            <tr key={movimento.id}>

                <td>

                    {movimento.id}

                </td>

                <td>

                    {

                        movimento.tipo === "ENTRADA"

                            ?

                            <span className="status-verde">

                                Entrada

                            </span>

                            :

                            <span className="status-vermelho">

                                Saída

                            </span>

                    }

                </td>

                <td>

                    {movimento.origem || "—"}

                </td>

                <td>

                    {movimento.descricao}

                </td>

                <td>

                    {

                        Number(
                            movimento.valor || 0
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

                    {

                        movimento.dataMovimento

                            ?

                            new Date(
                                movimento.dataMovimento
                            ).toLocaleString("pt-BR")

                            :

                            "-"

                    }

                </td>

                <td>

                    <button
                        className="btn-tabela excluir"
                        onClick={() =>
                            remover(movimento.id)
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