/**
 * =============================================================================
 * TDFE - Tem de Tudo Frontend Enterprise
 * ERP Tem de Tudo
 * =============================================================================
 *
 * Framework......: Kernel
 * Módulo.........: Errors
 * Arquivo........: BaseException.js
 *
 * Versão.........: 1.0.0
 * Release........: Kernel
 * Sprint.........: Sprint 2
 *
 * Autor..........: Felipe Campos
 *
 * Criado em......: 04/08/2026
 * Atualizado em..: 04/08/2026
 * Hora...........: 21:01 (GMT-3)
 *
 * Status.........: Estável
 *
 * Licença........: Proprietário - Tem de Tudo
 * Copyright......: © 2026 Felipe Campos
 * =============================================================================
 */

/**
 * Exceção base utilizada por todo o Framework TDFE.
 *
 * Todas as exceções especializadas deverão utilizar esta classe.
 *
 * Exemplo:
 *
 * throw new BaseException({
 *     code: "ROUTE_001",
 *     message: "Route not found."
 * });
 *
 * ou
 *
 * class RouteException extends BaseException {}
 */

export default class BaseException extends Error {

    /**
     * @param {Object} options
     * @param {String} options.code
     * @param {String} options.message
     * @param {Object} [options.context]
     * @param {Error|null} [options.cause]
     */
    constructor({

        code,

        message,

        context = {},

        cause = null

    }) {

        super(message);

        this.name = this.constructor.name;

        this.code = code;

        this.context = Object.freeze({

            ...context

        });

        this.cause = cause;

        this.timestamp = new Date().toISOString();

        Error.captureStackTrace?.(

            this,

            this.constructor

        );

        Object.freeze(this);

    }

    /**
     * Retorna se o erro possui determinado código.
     *
     * @param {String} code
     * @returns {Boolean}
     */
    is(code) {

        return this.code === code;

    }

    /**
     * Retorna representação simples.
     *
     * @returns {Object}
     */
    toObject() {

        return {

            name: this.name,

            code: this.code,

            message: this.message,

            context: this.context,

            timestamp: this.timestamp

        };

    }

    /**
     * Serialização JSON.
     *
     * @returns {Object}
     */
    toJSON() {

        return this.toObject();

    }

    /**
     * Representação textual.
     *
     * @returns {String}
     */
    toString() {

        return `[${this.code}] ${this.message}`;

    }

}