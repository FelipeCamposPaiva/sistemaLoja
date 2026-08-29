import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import CardResumo from "../../components/cards/CardResumo";

import "../../styles/pages/dashboard.css";

export default function Ferramentas() {

    const [busca, setBusca] = useState("");

    return (

        <div className="dashboard-page">

            <PageHeader
                modulo="Início"
                titulo="Ferramentas"
                subtitulo="Acesse ferramentas úteis para o dia a dia da empresa."
            />

            <div className="produtos-busca">

                <input
                    type="text"
                    placeholder="Pesquisar ferramenta..."
                    value={busca}
                    onChange={(e) =>
                        setBusca(e.target.value)
                    }
                />

            </div>

            <div className="dashboard-cards">

                <CardResumo
                    titulo="Ferramentas"
                    valor={12}
                />

                <CardResumo
                    titulo="Favoritas"
                    valor={0}
                />

                <CardResumo
                    titulo="Utilizadas Hoje"
                    valor={0}
                />

                <CardResumo
                    titulo="Integrações"
                    valor={0}
                />

            </div>

            <div className="dashboard-grid">

                <div className="dashboard-box">

                    <h3>Ferramentas Disponíveis</h3>

                    <table
                        style={{
                            width: "100%",
                            marginTop: 20
                        }}
                    >

                        <thead>

                            <tr>

                                <th>Ferramenta</th>

                                <th>Categoria</th>

                                <th>Status</th>

                            </tr>

                        </thead>

                        <tbody>

                            <tr>

                                <td>Calculadora</td>

                                <td>Utilitário</td>

                                <td>
                                    <span className="status-verde">
                                        Disponível
                                    </span>
                                </td>

                            </tr>

                            <tr>

                                <td>Gerador de Código de Barras</td>

                                <td>Estoque</td>

                                <td>
                                    <span className="status-verde">
                                        Disponível
                                    </span>
                                </td>

                            </tr>

                            <tr>

                                <td>Gerador de QR Code</td>

                                <td>Marketing</td>

                                <td>
                                    <span className="status-verde">
                                        Disponível
                                    </span>
                                </td>

                            </tr>

                            <tr>

                                <td>Conversor de Arquivos</td>

                                <td>Gráfica</td>

                                <td>
                                    <span className="status-amarelo">
                                        Em breve
                                    </span>
                                </td>

                            </tr>

                            <tr>

                                <td>Calculadora de Frete</td>

                                <td>Vendas</td>

                                <td>
                                    <span className="status-amarelo">
                                        Em breve
                                    </span>
                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>

                <div className="dashboard-box">

                    <h3>Próximas Ferramentas</h3>

                    <ul
                        style={{
                            marginTop: 20,
                            marginLeft: 20,
                            lineHeight: "32px"
                        }}
                    >

                        <li>✔ Gerador de Etiquetas</li>

                        <li>✔ Gerador de PIX</li>

                        <li>✔ Gerador de OS</li>

                        <li>✔ Editor de PDF</li>

                        <li>✔ Compactador de Imagens</li>

                        <li>✔ Conversor CMYK / RGB</li>

                        <li>✔ Calculadora de Papel</li>

                        <li>✔ Calculadora de Impressão</li>

                        <li>✔ Gerador de Senhas</li>

                        <li>✔ Backup do Banco de Dados</li>

                    </ul>

                </div>

            </div>

        </div>

    );

}