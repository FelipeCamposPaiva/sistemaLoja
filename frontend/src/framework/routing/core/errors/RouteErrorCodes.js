/**
 * =============================================================================
 * TDFE - Tem de Tudo Frontend Enterprise
 * -----------------------------------------------------------------------------
 * Framework......: Routing
 * Módulo.........: Core
 * Submódulo......: Errors
 * Arquivo........: RouteErrorCodes.js
 *
 * Versão.........: 1.0.0
 * Release........: Foundation
 * Sprint.........: Sprint 1
 *
 * Autor..........: Felipe Campos
 *
 * Descrição:
 * -----------------------------------------------------------------------------
 * Centraliza todos os códigos de erro utilizados pelo Framework de Rotas.
 *
 * Estes códigos são estáveis e independentes do idioma das mensagens.
 * As mensagens correspondentes ficam em RouteErrors.js.
 *
 * Exemplo:
 *
 * throw new RouteException(RouteErrorCodes.ROUTE_NOT_FOUND);
 *
 * =============================================================================
 */

/**
 * Prefixos dos módulos.
 */
const PREFIX = Object.freeze({

    ROUTE: "ROUTE",

    BUILDER: "BUILDER",

    REGISTRY: "REGISTRY",

    GUARD: "GUARD",

    LAYOUT: "LAYOUT",

    MIDDLEWARE: "MIDDLEWARE",

    VALIDATOR: "VALIDATOR",

    FACTORY: "FACTORY",

    PIPELINE: "PIPELINE",

    RENDERER: "RENDERER",

    CACHE: "CACHE",

    CONFIG: "CONFIG"

});

/**
 * Códigos oficiais do Framework.
 */
const RouteErrorCodes = Object.freeze({

    /**
     * ==========================================================
     * ROUTES
     * ==========================================================
     */

    ROUTE_NOT_FOUND: `${PREFIX.ROUTE}_001`,

    ROUTE_ALREADY_EXISTS: `${PREFIX.ROUTE}_002`,

    ROUTE_INVALID_PATH: `${PREFIX.ROUTE}_003`,

    ROUTE_INVALID_NAME: `${PREFIX.ROUTE}_004`,

    ROUTE_DISABLED: `${PREFIX.ROUTE}_005`,

    ROUTE_HIDDEN: `${PREFIX.ROUTE}_006`,

    /**
     * ==========================================================
     * BUILDER
     * ==========================================================
     */

    BUILDER_INVALID_COMPONENT: `${PREFIX.BUILDER}_001`,

    BUILDER_INVALID_LAYOUT: `${PREFIX.BUILDER}_002`,

    BUILDER_BUILD_FAILED: `${PREFIX.BUILDER}_003`,

    /**
     * ==========================================================
     * REGISTRY
     * ==========================================================
     */

    REGISTRY_DUPLICATED_ROUTE: `${PREFIX.REGISTRY}_001`,

    REGISTRY_ROUTE_NOT_FOUND: `${PREFIX.REGISTRY}_002`,

    REGISTRY_FROZEN: `${PREFIX.REGISTRY}_003`,

    /**
     * ==========================================================
     * GUARDS
     * ==========================================================
     */

    AUTH_REQUIRED: `${PREFIX.GUARD}_001`,

    ACCESS_DENIED: `${PREFIX.GUARD}_002`,

    PERMISSION_DENIED: `${PREFIX.GUARD}_003`,

    ROLE_DENIED: `${PREFIX.GUARD}_004`,

    COMPANY_DENIED: `${PREFIX.GUARD}_005`,

    MODULE_DENIED: `${PREFIX.GUARD}_006`,

    LICENSE_DENIED: `${PREFIX.GUARD}_007`,

    /**
     * ==========================================================
     * VALIDATOR
     * ==========================================================
     */

    VALIDATION_FAILED: `${PREFIX.VALIDATOR}_001`,

    INVALID_CONFIGURATION: `${PREFIX.VALIDATOR}_002`,

    REQUIRED_FIELD: `${PREFIX.VALIDATOR}_003`,

    INVALID_TYPE: `${PREFIX.VALIDATOR}_004`,

    /**
     * ==========================================================
     * LAYOUT
     * ==========================================================
     */

    LAYOUT_NOT_FOUND: `${PREFIX.LAYOUT}_001`,

    INVALID_LAYOUT: `${PREFIX.LAYOUT}_002`,

    /**
     * ==========================================================
     * MIDDLEWARE
     * ==========================================================
     */

    MIDDLEWARE_NOT_FOUND: `${PREFIX.MIDDLEWARE}_001`,

    MIDDLEWARE_FAILED: `${PREFIX.MIDDLEWARE}_002`,

    /**
     * ==========================================================
     * FACTORY
     * ==========================================================
     */

    FACTORY_FAILED: `${PREFIX.FACTORY}_001`,

    /**
     * ==========================================================
     * PIPELINE
     * ==========================================================
     */

    PIPELINE_FAILED: `${PREFIX.PIPELINE}_001`,

    /**
     * ==========================================================
     * RENDERER
     * ==========================================================
     */

    RENDERER_FAILED: `${PREFIX.RENDERER}_001`,

    /**
     * ==========================================================
     * CACHE
     * ==========================================================
     */

    CACHE_DISABLED: `${PREFIX.CACHE}_001`,

    CACHE_WRITE_FAILED: `${PREFIX.CACHE}_002`,

    CACHE_READ_FAILED: `${PREFIX.CACHE}_003`,

    /**
     * ==========================================================
     * CONFIG
     * ==========================================================
     */

    CONFIG_NOT_FOUND: `${PREFIX.CONFIG}_001`,

    CONFIG_INVALID: `${PREFIX.CONFIG}_002`

});

export {

    PREFIX,

    RouteErrorCodes

};

export default RouteErrorCodes;