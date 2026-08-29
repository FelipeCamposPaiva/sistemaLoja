/**
 * =============================================================================
 * ERP TEM DE TUDO
 * =============================================================================
 *
 * Arquivo.....: RouteNormalizer.js
 * Local.......: src/routes/core/
 *
 * Responsável.: Normalização das rotas do Framework V4.
 *
 * =============================================================================
 */

import DEFAULT_ROUTE from "./RouteDefaults";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toArray(value) {

    if (value === undefined || value === null) {

        return [];

    }

    return Array.isArray(value)

        ? [...value]

        : [value];

}

function toBoolean(value, defaultValue = false) {

    if (value === undefined || value === null) {

        return defaultValue;

    }

    return Boolean(value);

}

function toObject(value) {

    if (!value || typeof value !== "object") {

        return {};

    }

    return {

        ...value

    };

}

function normalizeActions(actions = {}) {

    return {

        ...DEFAULT_ROUTE.actions,

        ...actions

    };

}

/*
|--------------------------------------------------------------------------
| Route Normalizer
|--------------------------------------------------------------------------
*/

export function normalizeRoute(route = {}) {

    return {

        ...DEFAULT_ROUTE,

        ...route,

        guards: toArray(route.guards),

        permissions: toArray(route.permissions),

        roles: toArray(route.roles),

        modules: toArray(route.modules),

        companies: toArray(route.companies),

        licenses: toArray(route.licenses),

        middlewares: toArray(route.middlewares),

        children: toArray(route.children),

        keywords: toArray(route.keywords),

        menu: toBoolean(

            route.menu,

            DEFAULT_ROUTE.menu

        ),

        favorite: toBoolean(

            route.favorite,

            DEFAULT_ROUTE.favorite

        ),

        visible: toBoolean(

            route.visible,

            DEFAULT_ROUTE.visible

        ),

        searchable: toBoolean(

            route.searchable,

            DEFAULT_ROUTE.searchable

        ),

        breadcrumb: toBoolean(

            route.breadcrumb,

            DEFAULT_ROUTE.breadcrumb

        ),

        lazy: toBoolean(

            route.lazy,

            DEFAULT_ROUTE.lazy

        ),

        meta: toObject(route.meta),

        actions: normalizeActions(route.actions)

    };

}

export default normalizeRoute;