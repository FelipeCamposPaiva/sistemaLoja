import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import CardResumo from "../../components/cards/CardResumo";

import {
    listarOS
} from "../../services/os.service";

import "../../styles/pages/os.css";

export default function OrdemServico() {

    const [lista, setLista] = useState([]);

    const [loading, setLoading] = useState(true);

    const [busca, setBusca] = useState("");

    useEffect(() => {

        carregarOS();

    }, []);

    async function carregarOS() {

        try {

            setLoading(true);

            const dados = await listarOS();

            setLista(dados || []);

        } catch (erro) {

            console.error(erro);

        } finally {

            setLoading(false);

        }

    }

    const filtradas = useMemo(() => {

        return lista.filter(os =>

            (os.cliente || "")
                .toLowerCase()
                .includes(busca.toLowerCase())

            ||

            (os.descricao || "")
                .toLowerCase()
                .includes(busca.toLowerCase())

        );

    }, [lista, busca]);

    const totalOrcamentos =
        lista.filter(
            x => x.status === "ORÇAMENTO"
        ).length;

    const totalArte =
        lista.filter(
            x => x.status === "ARTE"
        ).length;

    const totalProducao =
        lista.filter(
            x => x.status === "PRODUÇÃO"
        ).length;

    const totalPronto =
        lista.filter(
            x => x.status === "PRONTO"
        ).length;

    if (loading)
        return <Loading />;

  }

    return (

        <div className="os-page">

<PageHeader
    modulo="Serviços"
    titulo="Ordens de Serviço"
    subtitulo="Gerencie todas as Ordens de Serviço da gráfica."
    botao="+ Nova OS"
    onClick={() => {}}
/>

<div className="produtos-resumo">

    <CardResumo
        titulo="Orçamentos"
        valor={totalOrcamentos}
    />

    <CardResumo
        titulo="Arte"
        valor={totalArte}
    />

    <CardResumo
        titulo="Produção"
        valor={totalProducao}
    />

    <CardResumo
        titulo="Prontas"
        valor={totalPronto}
    />

</div>

<div className="produtos-busca">

    <input
        type="text"
        placeholder="Pesquisar cliente ou serviço..."
        value={busca}
        onChange={(e) =>
            setBusca(e.target.value)
        }
    />

</div>

<div className="os-card">

    <table>

        <thead>

            <tr>

                <th>ID</th>

                <th>Cliente</th>

                <th>Descrição</th>

                <th>Status</th>

                <th>Valor</th>

                <th>Entrega</th>

                <th width="180">

                    Ações

                </th>

            </tr>

        </thead>

        <tbody>

          {

    filtradas.length === 0 ?

        (

            <tr>

                <td
                    colSpan={7}
                    style={{
                        textAlign: "center",
                        padding: "40px"
                    }}
                >

                    Nenhuma Ordem de Serviço encontrada.

                </td>

            </tr>

        )

        :

        filtradas.map((os) => (

            <tr key={os.id}>

                <td>

                    {os.id}

                </td>

                <td>

                    {os.cliente}

                </td>

                <td>

                    {os.descricao}

                </td>

                <td>

                    <StatusBadge
                        status={os.status}
                    />

                </td>

                <td>

                    {

                        Number(
                            os.valor || 0
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

                    {os.dataEntrega || "-"}

                </td>

                <td>

                    <button
                        className="btn-tabela"
                    >

                        Visualizar

                    </button>

                    <button
                        className="btn-tabela"
                    >

                        Editar

                    </button>

                    <button
                        className="btn-tabela excluir"
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

    )

    function StatusBadge({ status }) {

    const classe = {

        "ORÇAMENTO": "status-amarelo",

        "APROVADO": "status-azul",

        "ARTE": "status-roxo",

        "AJUSTE_ARTE": "status-laranja",

        "PRODUÇÃO": "status-azul",

        "ACABAMENTO": "status-cinza",

        "PRONTO": "status-verde",

        "ENTREGUE": "status-preto",

        "CANCELADA": "status-vermelho"

    };

    return (

        <span
            className={
                classe[status] ||
                "status-cinza"
            }
        >

            {status}

        </span>

    );

}