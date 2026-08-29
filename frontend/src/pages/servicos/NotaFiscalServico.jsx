import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import CardResumo from "../../components/cards/CardResumo";

import "../../styles/pages/ordens-compra.css";

export default function NotaFiscalServico() {

    const [busca, setBusca] = useState("");

    return (

        <div className="ordens-page">

            <PageHeader
                modulo="Serviços"
                titulo="Nota Fiscal de Serviço"
                subtitulo="Gerencie as Notas Fiscais de Serviço (NFS-e)."
                botao="+ Emitir NFS-e"
                onClick={() => {}}
            />

            <div className="produtos-busca">

                <input
                    type="text"
                    placeholder="Pesquisar cliente, número da NFS-e..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(e.target.value)
                    }
                />

            </div>

            <div className="produtos-resumo">

                <CardResumo
                    titulo="Notas Emitidas"
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

                <CardResumo
                    titulo="Faturamento"
                    valor="R$ 0,00"
                />

            </div>

            <div className="ordens-card">

                <table>

                    <thead>

                        <tr>

                            <th>Nº NFS-e</th>

                            <th>OS</th>

                            <th>Cliente</th>

                            <th>Emissão</th>

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

                                Nenhuma Nota Fiscal de Serviço encontrada.

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </div>

    );

}