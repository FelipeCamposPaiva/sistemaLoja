import { useEffect, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import CardResumo from "../../components/cards/CardResumo";

import {
    obterDashboardGeral
} from "../../services/dashboardGeral.service";

import "../../styles/pages/dashboard.css";

export default function Dashboard() {

    const [dados, setDados] = useState({});

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        carregarDashboard();

    }, []);

    async function carregarDashboard() {

        try {

            setLoading(true);

            const response =
                await obterDashboardGeral();

            setDados(response || {});

        } catch (erro) {

            console.error(
                "Erro ao carregar dashboard:",
                erro
            );

        } finally {

            setLoading(false);

        }

    }

    if (loading)
        return <Loading />;

    return (

        <div className="dashboard-page">

            <PageHeader
                modulo="Início"
                titulo="Dashboard ERP"
                subtitulo="Visão geral do sistema."
            />

            <div className="dashboard-cards">

                <CardResumo
                    titulo="Clientes"
                    valor={dados.totalClientes || 0}
                />

                <CardResumo
                    titulo="Produtos"
                    valor={dados.totalProdutos || 0}
                />

                <CardResumo
                    titulo="Ordens de Serviço"
                    valor={dados.totalOS || 0}
                />

                <CardResumo
                    titulo="Em Produção"
                    valor={dados.osProducao || 0}
                />

                <CardResumo
                    titulo="Orçamentos"
                    valor={dados.totalOrcamentos || 0}
                />

                <CardResumo
                    titulo="Vendas Hoje"
                    valor={
                        Number(
                            dados.vendasHoje || 0
                        ).toLocaleString(
                            "pt-BR",
                            {
                                style: "currency",
                                currency: "BRL"
                            }
                        )
                    }
                />

                <CardResumo
                    titulo="Faturamento do Mês"
                    valor={
                        Number(
                            dados.faturamentoMes || 0
                        ).toLocaleString(
                            "pt-BR",
                            {
                                style: "currency",
                                currency: "BRL"
                            }
                        )
                    }
                />

                <CardResumo
                    titulo="Clientes Novos"
                    valor={dados.clientesNovos || 0}
                />

            </div>

            <div className="dashboard-grid">

                <div className="dashboard-box">

                    <h3>

                        Atividades Recentes

                    </h3>

                    <p
                        style={{
                            marginTop: 20,
                            color: "#94a3b8"
                        }}
                    >

                        Em breve serão exibidas aqui as últimas movimentações
                        do sistema.

                    </p>

                </div>

                <div className="dashboard-box">

                    <h3>

                        Indicadores

                    </h3>

                    <ul
                        style={{
                            marginTop: 20,
                            marginLeft: 20,
                            lineHeight: "32px"
                        }}
                    >

                        <li>Ordens em atraso</li>

                        <li>Produção do dia</li>

                        <li>Financeiro</li>

                        <li>Vendas</li>

                        <li>Estoque baixo</li>

                        <li>Entregas de hoje</li>

                    </ul>

                </div>

            </div>

        </div>

    );

}