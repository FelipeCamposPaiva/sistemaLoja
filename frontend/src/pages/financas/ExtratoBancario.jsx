import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import CardResumo from "../../components/cards/CardResumo";

import "../../styles/pages/ordens-compra.css";

export default function ExtratoBancario() {

    const [busca, setBusca] = useState("");

    return (

        <div className="ordens-page">

            <PageHeader
                modulo="Financeiro"
                titulo="Extrato Bancário"
                subtitulo="Consulte e concilie os lançamentos bancários."
                botao="+ Importar OFX"
                onClick={() => {}}
            />

            <div className="produtos-busca">

                <input
                    type="text"
                    placeholder="Pesquisar descrição, documento ou valor..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(e.target.value)
                    }
                />

            </div>

            <div className="produtos-resumo">

                <CardResumo
                    titulo="Lançamentos"
                    valor={0}
                />

                <CardResumo
                    titulo="Entradas"
                    valor={0}
                />

                <CardResumo
                    titulo="Saídas"
                    valor={0}
                />

                <CardResumo
                    titulo="Saldo"
                    valor="R$ 0,00"
                />

            </div>

            <div className="ordens-card">

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>Data</th>

                            <th>Documento</th>

                            <th>Descrição</th>

                            <th>Tipo</th>

                            <th>Valor</th>

                            <th>Saldo</th>

                            <th>Status</th>

                            <th width="180">

                                Ações

                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        <tr>

                            <td
                                colSpan={9}
                                style={{
                                    textAlign: "center",
                                    padding: "40px"
                                }}
                            >

                                Nenhum lançamento bancário encontrado.

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </div>

    );

}