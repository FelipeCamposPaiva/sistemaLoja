import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import CardResumo from "../../components/cards/CardResumo";

import "../../styles/pages/produtos.css";

export default function Embalagens() {

    const [busca, setBusca] = useState("");

    return (

        <div className="produtos-page">

            <PageHeader
                modulo="Cadastros"
                titulo="Embalagens"
                subtitulo="Cadastre e gerencie os tipos de embalagens utilizados na empresa."
                botao="+ Nova Embalagem"
                onClick={() => {}}
            />

            <div className="produtos-busca">

                <input
                    type="text"
                    placeholder="Pesquisar embalagem..."
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

            </div>

            <div className="produtos-card">

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Nome</th>
                            <th>Descrição</th>
                            <th>Status</th>
                            <th width="170">Ações</th>

                        </tr>

                    </thead>

                    <tbody>

                        <tr>

                            <td
                                colSpan={5}
                                style={{
                                    textAlign: "center",
                                    padding: "40px"
                                }}
                            >

                                Nenhuma embalagem cadastrada.

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </div>

    );

}