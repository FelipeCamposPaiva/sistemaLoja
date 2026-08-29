/**
 * ============================================================================
 * ERP TEM DE TUDO
 * ============================================================================
 *
 * BaseService
 *
 * Classe base utilizada por todos os Services do ERP.
 *
 * ============================================================================
 */

import { HttpClient as http } from "../core/http";

export default class BaseService {

    constructor(resource) {

        this.resource = resource;

    }

    url(path = "") {

        return `${this.resource}${path}`;

    }

    /*
    |--------------------------------------------------------------------------
    | Métodos HTTP básicos
    |--------------------------------------------------------------------------
    */

    get(path = "", config = {}) {

        return http.get(this.url(path), config);

    }

    post(path = "", data = {}, config = {}) {

        return http.post(this.url(path), data, config);

    }

    put(path = "", data = {}, config = {}) {

        return http.put(this.url(path), data, config);

    }

    patch(path = "", data = {}, config = {}) {

        return http.patch(this.url(path), data, config);

    }

    delete(path = "", config = {}) {

        return http.delete(this.url(path), config);

    }

    upload(path = "", file, data = {}, config = {}) {

        return http.upload(this.url(path), file, data, config);

    }

    download(path = "", config = {}) {

        return http.download(this.url(path), config);

    }

}