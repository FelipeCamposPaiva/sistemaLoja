import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import CardResumo from "../../components/cards/CardResumo";

import "../../styles/pages/produtos.css";

export default function Localizacoes() {

    const [busca, setBusca] = useState("");

    return (

        <div className="produtos-page">

            <PageHeader
                modulo="Cadastros"
                titulo="Localizações"
                subtitulo="Cadastre as localizações físicas do estoque."
                botao="+ Nova Localização"
                onClick={() => {}}
            />

            <div className="produtos-busca">

                <input
                    type="text"
                    placeholder="Pesquisar localização..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(e.target.value)
                    }
                />

            </div>

            <div className="produtos-resumo">

                <CardResumo
                    titulo="Total"
                    valor={0}
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
                            <th>Código</th>
                            <th>Descrição</th>
                            <th>Depósito</th>
                            <th>Status</th>
                            <th width="180">
                                Ações
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        <tr>

                            <td
                                colSpan={6}
                                style={{
                                    textAlign: "center",
                                    padding: "40px"
                                }}
                            >

                                Nenhuma localização cadastrada.

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </div>

    );

}