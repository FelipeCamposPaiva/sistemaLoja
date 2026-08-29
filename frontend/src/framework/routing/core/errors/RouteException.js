/**
 * =============================================================================
 * TDFE - Tem de Tudo Frontend Enterprise
 * -----------------------------------------------------------------------------
 * Framework......: Routing
 * Módulo.........: Core
 * Submódulo......: Errors
 * Arquivo........: RouteException.js
 *
 * Versão.........: 1.0.0
 * Release........: Foundation
 * Sprint.........: Sprint 1
 *
 * Autor..........: Felipe Campos
 *
 * Descrição:
 * -----------------------------------------------------------------------------
 * Exceção base utilizada por todo o Framework de Rotas.
 *
 * Esta classe padroniza o lançamento de erros, incluindo:
 *
 * • Código do erro
 * • Mensagem
 * • Contexto
 * • Timestamp
 * • Causa
 * • Serialização
 * =============================================================================
 */

import RouteErrorCodes from "./RouteErrorCodes";
import RouteErrors, { getRouteErrorMessage } from "./RouteErrors";

class RouteException extends Error {

    /**
     * @param {string} code
     * @param {Object} options
     */
    constructor(
        code = RouteErrorCodes.VALIDATION_FAILED,
        options = {}
    ) {

        const {
            message,
            context = {},
            cause = null
        } = options;

        super(
            message ??
            getRouteErrorMessage(code)
        );

        this.name = "RouteException";

        this.code = code;

        this.context = context;

        this.cause = cause;

        this.timestamp = new Date().toISOString();

        Error.captureStackTrace?.(
            this,
            RouteException
        );

        Object.freeze(this.context);

    }

    /**
     * Serializa o erro.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            name: this.name,

            code: this.code,

            message: this.message,

            context: this.context,

            timestamp: this.timestamp

        };

    }

    /**
     * Retorna um objeto simples.
     *
     * @returns {Object}
     */
    toObject() {

        return this.toJSON();

    }

    /**
     * Converte para String.
     *
     * @returns {string}
     */
    toString() {

        return `[${this.code}] ${this.message}`;

    }

    /**
     * Verifica o código.
     *
     * @param {string} code
     * @returns {boolean}
     */
    is(code) {

        return this.code === code;

    }

    /**
     * Obtém mensagem oficial.
     *
     * @returns {string}
     */
    getOfficialMessage() {

        return RouteErrors[this.code];

    }

}

export default RouteException;