import { useMemo } from "react";

import { useDashboard as useDashboardContext } from "../contexts/DashboardContext";

/*
|--------------------------------------------------------------------------
| useDashboard
|--------------------------------------------------------------------------
|
| Hook para gerenciamento do Dashboard.
|
| Recursos:
| ✔ Dashboard Geral
| ✔ Indicadores
| ✔ Cards
| ✔ Produção
| ✔ Financeiro
| ✔ Atualização
| ✔ React 19
|
*/

export default function useDashboard() {

    const {

        dashboard,

        loading,

        atualizar

    } = useDashboardContext();

    /*
    |--------------------------------------------------------------------------
    | Cards
    |--------------------------------------------------------------------------
    */

    function card(nome) {

        return dashboard?.cards?.find(

            item =>

                item.nome === nome

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Indicadores
    |--------------------------------------------------------------------------
    */

    function indicador(nome) {

        return dashboard?.indicadores?.find(

            item =>

                item.nome === nome

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Gráficos
    |--------------------------------------------------------------------------
    */

    function grafico(nome) {

        return dashboard?.graficos?.find(

            item =>

                item.nome === nome

        );

    }

    /*
    |--------------------------------------------------------------------------
    | KPIs
    |--------------------------------------------------------------------------
    */

    function kpi(nome) {

        return dashboard?.kpis?.find(

            item =>

                item.nome === nome

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Resumo Financeiro
    |--------------------------------------------------------------------------
    */

    function financeiro() {

        return dashboard?.financeiro ??

            {};

    }

    /*
    |--------------------------------------------------------------------------
    | Produção
    |--------------------------------------------------------------------------
    */

    function producao() {

        return dashboard?.producao ??

            {};

    }

    /*
    |--------------------------------------------------------------------------
    | Estoque
    |--------------------------------------------------------------------------
    */

    function estoque() {

        return dashboard?.estoque ??

            {};

    }

    /*
    |--------------------------------------------------------------------------
    | Vendas
    |--------------------------------------------------------------------------
    */

    function vendas() {

        return dashboard?.vendas ??

            {};

    }

    /*
    |--------------------------------------------------------------------------
    | Clientes
    |--------------------------------------------------------------------------
    */

    function clientes() {

        return dashboard?.clientes ??

            {};

    }

    /*
    |--------------------------------------------------------------------------
    | OS
    |--------------------------------------------------------------------------
    */

    function ordensServico() {

        return dashboard?.ordensServico ??

            {};

    }

    /*
    |--------------------------------------------------------------------------
    | Alertas
    |--------------------------------------------------------------------------
    */

    function alertas() {

        return dashboard?.alertas ??

            [];

    }

    /*
    |--------------------------------------------------------------------------
    | Notificações
    |--------------------------------------------------------------------------
    */

    function notificacoes() {

        return dashboard?.notificacoes ??

            [];

    }

    /*
    |--------------------------------------------------------------------------
    | Memo
    |--------------------------------------------------------------------------
    */

    return useMemo(() => ({

        dashboard,

        loading,

        atualizar,

        card,

        indicador,

        grafico,

        kpi,

        financeiro,

        producao,

        estoque,

        vendas,

        clientes,

        ordensServico,

        alertas,

        notificacoes

    }), [

        dashboard,

        loading,

        atualizar

    ]);

}