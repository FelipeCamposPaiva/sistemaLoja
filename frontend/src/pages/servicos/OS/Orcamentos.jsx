import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import CardResumo from "../../components/cards/CardResumo";

import "../../styles/pages/ordens-compra.css";

export default function Orcamentos() {

    const [busca, setBusca] = useState("");

    return (

        <div className="ordens-page">

            <PageHeader
                modulo="Serviços"
                titulo="Orçamentos"
                subtitulo="Gerencie os orçamentos da gráfica."
                botao="+ Novo Orçamento"
                onClick={() => {}}
            />

            <div className="produtos-busca">

                <input
                    type="text"
                    placeholder="Pesquisar cliente, orçamento ou descrição..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(e.target.value)
                    }
                />

            </div>

            <div className="produtos-resumo">

                <CardResumo
                    titulo="Orçamentos"
                    valor={0}
                />

                <CardResumo
                    titulo="Aprovados"
                    valor={0}
                />

                <CardResumo
                    titulo="Pendentes"
                    valor={0}
                />

                <CardResumo
                    titulo="Recusados"
                    valor={0}
                />

            </div>

            <div className="ordens-card">

                <table>

                    <thead>

                        <tr>

                            <th>Nº</th>

                            <th>Cliente</th>

                            <th>Descrição</th>

                            <th>Valor</th>

                            <th>Validade</th>

                            <th>Status</th>

                            <th width="220">

                                Ações

                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        <tr>

                            <td
                                colSpan={7}
                                style={{
                                    textAlign: "center",
                                    padding: "40px"
                                }}
                            >

                                Nenhum orçamento encontrado.

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </div>

    );

}