/**
 * =============================================================================
 * ERP TEM DE TUDO
 * =============================================================================
 *
 * Arquivo.....: RouteBuilder.js
 * Local.......: src/routes/config/
 *
 * Responsável.: Fluent Builder das Rotas V4.
 *
 * =============================================================================
 */

import DEFAULT_ROUTE from "../core/RouteDefaults";
import normalizeRoute from "../core/RouteNormalizer";
import validateRoute from "../core/RouteValidator";

import { RouteBuilderError } from "../core/RouteErrors";

export default class RouteBuilder {

    #route;

    #built = false;

    constructor(id) {

        this.#route = {

            ...DEFAULT_ROUTE,

            id

        };

    }

    /*
    |--------------------------------------------------------------------------
    | Internal
    |--------------------------------------------------------------------------
    */

    #ensureNotBuilt() {

        if (this.#built) {

            throw new RouteBuilderError(

                "Esta rota já foi construída."

            );

        }

    }

    #push(field, value) {

        this.#ensureNotBuilt();

        if (value === undefined || value === null) {

            return this;

        }

        this.#route[field] = [

            ...this.#route[field],

            value

        ];

        return this;

    }

    #set(field, value) {

        this.#ensureNotBuilt();

        this.#route[field] = value;

        return this;

    }

    /*
    |--------------------------------------------------------------------------
    | Básico
    |--------------------------------------------------------------------------
    */

    title(value) {

        return this.#set("title", value);

    }

    subtitle(value) {

        return this.#set("subtitle", value);

    }

    description(value) {

        return this.#set("description", value);

    }

    path(value) {

        return this.#set("path", value);

    }

    component(value) {

        return this.#set("component", value);

    }

    redirect(value) {

        return this.#set("redirect", value);

    }

    layout(value) {

        return this.#set("layout", value);

    }

    /*
    |--------------------------------------------------------------------------
    | Guards
    |--------------------------------------------------------------------------
    */

    guard(value) {

        return this.#push("guards", value);

    }

    permission(value) {

        return this.#push("permissions", value);

    }

    role(value) {

        return this.#push("roles", value);

    }

    module(value) {

        return this.#push("modules", value);

    }

    company(value) {

        return this.#push("companies", value);

    }

    license(value) {

        return this.#push("licenses", value);

    }

    /*
    |--------------------------------------------------------------------------
    | Navegação
    |--------------------------------------------------------------------------
    */

    menu(value = true) {

        return this.#set("menu", value);

    }

    favorite(value = true) {

        return this.#set("favorite", value);

    }

    visible(value = true) {

        return this.#set("visible", value);

    }

    searchable(value = true) {

        return this.#set("searchable", value);

    }

    breadcrumb(value = true) {

        return this.#set("breadcrumb", value);

    }

    icon(value) {

        return this.#set("icon", value);

    }

    order(value) {

        return this.#set("order", value);

    }

    /*
    |--------------------------------------------------------------------------
    | Lazy
    |--------------------------------------------------------------------------
    */

    lazy(value = true) {

        return this.#set("lazy", value);

    }

    /*
    |--------------------------------------------------------------------------
    | Meta
    |--------------------------------------------------------------------------
    */

    meta(value = {}) {

        return this.#set("meta", value);

    }

    /*
    |--------------------------------------------------------------------------
    | Actions
    |--------------------------------------------------------------------------
    */

    actions(value = {}) {

        return this.#set("actions", value);

    }

    /*
    |--------------------------------------------------------------------------
    | Keywords
    |--------------------------------------------------------------------------
    */

    keyword(value) {

        return this.#push("keywords", value);

    }

    keywords(values = []) {

        this.#ensureNotBuilt();

        this.#route.keywords = [

            ...this.#route.keywords,

            ...values

        ];

        return this;

    }

    /*
    |--------------------------------------------------------------------------
    | Middlewares
    |--------------------------------------------------------------------------
    */

    middleware(value) {

        return this.#push("middlewares", value);

    }

    /*
    |--------------------------------------------------------------------------
    | Children
    |--------------------------------------------------------------------------
    */

    child(route) {

        return this.#push("children", route);

    }

    /*
    |--------------------------------------------------------------------------
    | Clone
    |--------------------------------------------------------------------------
    */

    clone() {

        const builder = new RouteBuilder(this.#route.id);

        builder.#route = structuredClone

            ? structuredClone(this.#route)

            : JSON.parse(JSON.stringify(this.#route));

        return builder;

    }

    /*
    |--------------------------------------------------------------------------
    | Build
    |--------------------------------------------------------------------------
    */

    build() {

        this.#ensureNotBuilt();

        const route = normalizeRoute(this.#route);

        validateRoute(route);

        this.#built = true;

        return Object.freeze(route);

    }

}