/**
 * =============================================================================
 * ERP TEM DE TUDO
 * =============================================================================
 *
 * Arquivo.....: RouteRenderer.jsx
 * Local.......: src/routes/core/
 *
 * Responsável.: Renderização das rotas do Framework V4.
 *
 * =============================================================================
 */

import React from "react";

import BaseGuard from "../guard/BaseGuard";

/*
|--------------------------------------------------------------------------
| Executar Middlewares
|--------------------------------------------------------------------------
*/

function runMiddlewares(route) {

    if (!route.middlewares?.length) {

        return;

    }

    route.middlewares.forEach((Middleware) => {

        if (typeof Middleware === "function") {

            Middleware(route);

        }

    });

}

/*
|--------------------------------------------------------------------------
| Aplicar Layout
|--------------------------------------------------------------------------
*/

function renderLayout(route, children) {

    const Layout = route.layout;

    if (!Layout) {

        return children;

    }

    return (

        <Layout route={route}>

            {children}

        </Layout>

    );

}

/*
|--------------------------------------------------------------------------
| Route Renderer
|--------------------------------------------------------------------------
*/

export default function RouteRenderer({

    route,

    children

}) {

    runMiddlewares(route);

    const content = renderLayout(

        route,

        children

    );

    return (

        <BaseGuard route={route}>

            {content}

        </BaseGuard>

    );

}