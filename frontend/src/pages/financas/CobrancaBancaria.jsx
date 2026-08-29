import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import CardResumo from "../../components/cards/CardResumo";

import "../../styles/pages/ordens-compra.css";

export default function CobrancaBancaria() {

    const [busca, setBusca] = useState("");

    return (

        <div className="ordens-page">

            <PageHeader
                modulo="Financeiro"
                titulo="Cobrança Bancária"
                subtitulo="Gerencie boletos, remessas e retornos bancários."
                botao="+ Nova Cobrança"
                onClick={() => {}}
            />

            <div className="produtos-busca">

                <input
                    type="text"
                    placeholder="Pesquisar cliente, boleto ou nosso número..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(e.target.value)
                    }
                />

            </div>

            <div className="produtos-resumo">

                <CardResumo
                    titulo="Boletos"
                    valor={0}
                />

                <CardResumo
                    titulo="Pendentes"
                    valor={0}
                />

                <CardResumo
                    titulo="Recebidos"
                    valor={0}
                />

                <CardResumo
                    titulo="Vencidos"
                    valor={0}
                />

            </div>

            <div className="ordens-card">

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>Cliente</th>

                            <th>Nosso Número</th>

                            <th>Vencimento</th>

                            <th>Valor</th>

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

                                Nenhuma cobrança bancária cadastrada.

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </div>

    );

}