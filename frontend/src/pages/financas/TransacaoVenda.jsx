import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import CardResumo from "../../components/cards/CardResumo";

import "../../styles/pages/ordens-compra.css";

export default function TransacaoVenda() {

    const [busca, setBusca] = useState("");

    return (

        <div className="ordens-page">

            <PageHeader
                modulo="Financeiro"
                titulo="Transações de Venda"
                subtitulo="Controle das vendas realizadas e seus recebimentos."
                botao="+ Nova Transação"
                onClick={() => {}}
            />

            <div className="produtos-busca">

                <input
                    type="text"
                    placeholder="Pesquisar cliente, pedido, venda..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(e.target.value)
                    }
                />

            </div>

            <div className="produtos-resumo">

                <CardResumo
                    titulo="Transações"
                    valor={0}
                />

                <CardResumo
                    titulo="Recebidas"
                    valor={0}
                />

                <CardResumo
                    titulo="Pendentes"
                    valor={0}
                />

                <CardResumo
                    titulo="Canceladas"
                    valor={0}
                />

            </div>

            <div className="ordens-card">

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>Cliente</th>

                            <th>Pedido</th>

                            <th>Forma Pagamento</th>

                            <th>Valor</th>

                            <th>Data</th>

                            <th>Status</th>

                            <th width="180">

                                Ações

                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        <tr>

                            <td
                                colSpan={8}
                                style={{
                                    textAlign: "center",
                                    padding: "40px"
                                }}
                            >

                                Nenhuma transação encontrada.

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </div>

    );

}