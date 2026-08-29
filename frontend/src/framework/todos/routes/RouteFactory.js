/**
 * =============================================================================
 * ERP TEM DE TUDO
 * =============================================================================
 *
 * Arquivo.....: RouteFactory.js
 * Local.......: src/routes/core/
 *
 * Responsável.: Conversão das rotas do Framework para React Router.
 *
 * =============================================================================
 */

import React, { Suspense } from "react";
import { Navigate } from "react-router-dom";

import RouteRenderer from "./RouteRenderer";

/*
|--------------------------------------------------------------------------
| Lazy Loader
|--------------------------------------------------------------------------
*/

function createElement(route) {

    /*
    |--------------------------------------------------------------------------
    | Redirect
    |--------------------------------------------------------------------------
    */

    if (route.redirect) {

        return <Navigate to={route.redirect} replace />;

    }

    /*
    |--------------------------------------------------------------------------
    | Component
    |--------------------------------------------------------------------------
    */

    let Component = route.component;

    if (!Component) {

        return null;

    }

    /*
    |--------------------------------------------------------------------------
    | Lazy
    |--------------------------------------------------------------------------
    */

    if (route.lazy) {

        return (

            <Suspense fallback={<div>Carregando...</div>}>

                <Component/>

            </Suspense>

        );

    }

    return <Component/>;

}

/*
|--------------------------------------------------------------------------
| Converter Children
|--------------------------------------------------------------------------
*/

function createChildren(children = []) {

    return children.map(createRoute);

}

/*
|--------------------------------------------------------------------------
| Criar Rota
|--------------------------------------------------------------------------
*/

export function createRoute(route) {

    return {

        id: route.id,

        path: route.path,

        element: (

            <RouteRenderer route={route}>

                {createElement(route)}

            </RouteRenderer>

        ),

        children: createChildren(route.children)

    };

}

/*
|--------------------------------------------------------------------------
| Criar várias rotas
|--------------------------------------------------------------------------
*/

export function createRoutes(routes = []) {

    return routes.map(createRoute);

}

export default {

    createRoute,

    createRoutes

};