/**
 * =============================================================================
 * ERP TEM DE TUDO
 * =============================================================================
 *
 * Arquivo.....: RouteValidator.js
 * Local.......: src/routes/core/
 *
 * Responsável.: Validação das rotas do Framework V4.
 *
 * =============================================================================
 */

import { RouteValidationError } from "./RouteErrors";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function isString(value) {

    return typeof value === "string";

}

function isFunction(value) {

    return typeof value === "function";

}

function isObject(value) {

    return value !== null

        && typeof value === "object"

        && !Array.isArray(value);

}

function isArray(value) {

    return Array.isArray(value);

}

function ensureArray(name, value) {

    if (!isArray(value)) {

        throw new RouteValidationError(

            `"${name}" deve ser um Array.`

        );

    }

}

function ensureObject(name, value) {

    if (!isObject(value)) {

        throw new RouteValidationError(

            `"${name}" deve ser um Objeto.`

        );

    }

}

function ensureString(name, value) {

    if (!isString(value)) {

        throw new RouteValidationError(

            `"${name}" deve ser uma String.`

        );

    }

}

function ensureNumber(name, value) {

    if (typeof value !== "number") {

        throw new RouteValidationError(

            `"${name}" deve ser Number.`

        );

    }

}

/*
|--------------------------------------------------------------------------
| Recursive Validation
|--------------------------------------------------------------------------
*/

function validateChildren(children) {

    children.forEach(validateRoute);

}

/*
|--------------------------------------------------------------------------
| Main Validator
|--------------------------------------------------------------------------
*/

export function validateRoute(route) {

    /*
    |--------------------------------------------------------------------------
    | ID
    |--------------------------------------------------------------------------
    */

    ensureString("id", route.id);

    if (!route.id.trim()) {

        throw new RouteValidationError(

            "Route id é obrigatório."

        );

    }

    if (route.id.includes(" ")) {

        throw new RouteValidationError(

            `Route "${route.id}" possui espaços.`

        );

    }

    /*
    |--------------------------------------------------------------------------
    | TITLE
    |--------------------------------------------------------------------------
    */

    ensureString("title", route.title);

    /*
    |--------------------------------------------------------------------------
    | PATH
    |--------------------------------------------------------------------------
    */

    ensureString("path", route.path);

    if (

        route.path

        &&

        !route.path.startsWith("/")

    ) {

        throw new RouteValidationError(

            `"${route.path}" deve iniciar com "/".`

        );

    }

    /*
    |--------------------------------------------------------------------------
    | COMPONENT / REDIRECT
    |--------------------------------------------------------------------------
    */

    if (

        route.component

        &&

        route.redirect

    ) {

        throw new RouteValidationError(

            "A rota não pode possuir component e redirect."

        );

    }

    if (

        !route.component

        &&

        !route.redirect

    ) {

        throw new RouteValidationError(

            "Informe component ou redirect."

        );

    }

    /*
    |--------------------------------------------------------------------------
    | ARRAYS
    |--------------------------------------------------------------------------
    */

    ensureArray("guards", route.guards);

    ensureArray("permissions", route.permissions);

    ensureArray("roles", route.roles);

    ensureArray("modules", route.modules);

    ensureArray("companies", route.companies);

    ensureArray("licenses", route.licenses);

    ensureArray("middlewares", route.middlewares);

    ensureArray("keywords", route.keywords);

    ensureArray("children", route.children);

    /*
    |--------------------------------------------------------------------------
    | META
    |--------------------------------------------------------------------------
    */

    ensureObject("meta", route.meta);

    /*
    |--------------------------------------------------------------------------
    | ACTIONS
    |--------------------------------------------------------------------------
    */

    ensureObject("actions", route.actions);

    /*
    |--------------------------------------------------------------------------
    | ORDER
    |--------------------------------------------------------------------------
    */

    ensureNumber("order", route.order);

    /*
    |--------------------------------------------------------------------------
    | CHILDREN
    |--------------------------------------------------------------------------
    */

    validateChildren(route.children);

    return route;

}

export default validateRoute;