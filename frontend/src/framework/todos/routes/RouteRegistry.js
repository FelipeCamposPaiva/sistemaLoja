/**
 * =============================================================================
 * ERP TEM DE TUDO
 * =============================================================================
 *
 * Arquivo.....: RouteRegistry.js
 * Local.......: src/routes/config/
 *
 * Responsável.: Registro central das rotas do sistema.
 *
 * =============================================================================
 */

import { RouteRegistryError } from "../core/RouteErrors";

class RouteRegistry {

    #routes = [];

    #idMap = new Map();

    #pathMap = new Map();

    /*
    |--------------------------------------------------------------------------
    | Registrar
    |--------------------------------------------------------------------------
    */

    register(route) {

        if (!route) {

            throw new RouteRegistryError(
                "Rota inválida."
            );

        }

        if (this.#idMap.has(route.id)) {

            throw new RouteRegistryError(
                `Já existe uma rota com id "${route.id}".`
            );

        }

        if (route.path && this.#pathMap.has(route.path)) {

            throw new RouteRegistryError(
                `Já existe uma rota utilizando o path "${route.path}".`
            );

        }

        this.#routes.push(route);

        this.#idMap.set(route.id, route);

        if (route.path) {

            this.#pathMap.set(route.path, route);

        }

        this.#registerChildren(route.children);

        return this;

    }

    /*
    |--------------------------------------------------------------------------
    | Registrar filhos
    |--------------------------------------------------------------------------
    */

    #registerChildren(children = []) {

        children.forEach(route => {

            this.register(route);

        });

    }

    /*
    |--------------------------------------------------------------------------
    | Buscar por ID
    |--------------------------------------------------------------------------
    */

    get(id) {

        return this.#idMap.get(id) ?? null;

    }

    /*
    |--------------------------------------------------------------------------
    | Buscar por Path
    |--------------------------------------------------------------------------
    */

    findByPath(path) {

        return this.#pathMap.get(path) ?? null;

    }

    /*
    |--------------------------------------------------------------------------
    | Todas
    |--------------------------------------------------------------------------
    */

    all() {

        return [...this.#routes];

    }

    /*
    |--------------------------------------------------------------------------
    | Menu
    |--------------------------------------------------------------------------
    */

    menu() {

        return this.#routes

            .filter(route => route.menu)

            .sort((a, b) => a.order - b.order);

    }

    /*
    |--------------------------------------------------------------------------
    | Favoritos
    |--------------------------------------------------------------------------
    */

    favorites() {

        return this.#routes.filter(route => route.favorite);

    }

    /*
    |--------------------------------------------------------------------------
    | Pesquisáveis
    |--------------------------------------------------------------------------
    */

    searchable() {

        return this.#routes.filter(route => route.searchable);

    }

    /*
    |--------------------------------------------------------------------------
    | Breadcrumb
    |--------------------------------------------------------------------------
    */

    breadcrumb() {

        return this.#routes.filter(route => route.breadcrumb);

    }

    /*
    |--------------------------------------------------------------------------
    | Existe ID
    |--------------------------------------------------------------------------
    */

    has(id) {

        return this.#idMap.has(id);

    }

    /*
    |--------------------------------------------------------------------------
    | Existe Path
    |--------------------------------------------------------------------------
    */

    hasPath(path) {

        return this.#pathMap.has(path);

    }

    /*
    |--------------------------------------------------------------------------
    | Quantidade
    |--------------------------------------------------------------------------
    */

    count() {

        return this.#routes.length;

    }

    /*
    |--------------------------------------------------------------------------
    | Limpar
    |--------------------------------------------------------------------------
    */

    clear() {

        this.#routes = [];

        this.#idMap.clear();

        this.#pathMap.clear();

    }

}

const registry = new RouteRegistry();

export default registry;