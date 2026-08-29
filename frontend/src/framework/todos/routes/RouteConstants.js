/**
 * =============================================================================
 * ERP TEM DE TUDO
 * =============================================================================
 *
 * Arquivo.....: RouteErrors.js
 * Local.......: src/routes/core/
 *
 * Responsável.: Hierarquia de erros do Framework de Rotas V4.
 *
 * =============================================================================
 */

export class RouteError extends Error {

    constructor(message, details = null) {

        super(message);

        this.name = this.constructor.name;

        this.details = details;

        Error.captureStackTrace?.(this, this.constructor);

    }

}

/*
|--------------------------------------------------------------------------
| Erro de Builder
|--------------------------------------------------------------------------
*/

export class RouteBuilderError extends RouteError {

    constructor(message, details = null) {

        super(message, details);

    }

}

/*
|--------------------------------------------------------------------------
| Erro de Validação
|--------------------------------------------------------------------------
*/

export class RouteValidationError extends RouteError {

    constructor(message, details = null) {

        super(message, details);

    }

}

/*
|--------------------------------------------------------------------------
| Erro de Registro
|--------------------------------------------------------------------------
*/

export class RouteRegistryError extends RouteError {

    constructor(message, details = null) {

        super(message, details);

    }

}

/*
|--------------------------------------------------------------------------
| Erro de Guard
|--------------------------------------------------------------------------
*/

export class RouteGuardError extends RouteError {

    constructor(message, details = null) {

        super(message, details);

    }

}

/*
|--------------------------------------------------------------------------
| Erro de Navegação
|--------------------------------------------------------------------------
*/

export class RouteNavigationError extends RouteError {

    constructor(message, details = null) {

        super(message, details);

    }

}

/*
|--------------------------------------------------------------------------
| Erro de Middleware
|--------------------------------------------------------------------------
*/

export class RouteMiddlewareError extends RouteError {

    constructor(message, details = null) {

        super(message, details);

    }

}