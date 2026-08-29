import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import CardResumo from "../../components/cards/CardResumo";

import "../../styles/pages/clientes.css";

export default function Vendedores() {

    const [busca, setBusca] = useState("");

    return (

        <div className="clientes-page">

            <PageHeader
                modulo="Cadastros"
                titulo="Vendedores"
                subtitulo="Cadastre e gerencie os vendedores da empresa."
                botao="+ Novo Vendedor"
                onClick={() => {}}
            />

            <div className="barra-pesquisa">

                <input
                    type="text"
                    placeholder="Pesquisar vendedor..."
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
                    titulo="Ativos"
                    valor={0}
                />

                <CardResumo
                    titulo="Inativos"
                    valor={0}
                />

            </div>

            <div className="tabela-card">

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>Nome</th>

                            <th>CPF</th>

                            <th>Telefone</th>

                            <th>E-mail</th>

                            <th>Comissão</th>

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

                                Nenhum vendedor cadastrado.

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </div>

    );

}