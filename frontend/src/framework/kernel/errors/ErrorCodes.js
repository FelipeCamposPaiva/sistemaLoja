/**
 * =============================================================================
 * TDFE - Tem de Tudo Frontend Enterprise
 * ERP Tem de Tudo
 * =============================================================================
 *
 * Framework......: Kernel
 * Módulo.........: Errors
 * Arquivo........: ErrorCodes.js
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
 * Prefixos oficiais do Framework.
 */
export const ErrorPrefix = Object.freeze({

    CORE: "CORE",

    REGISTRY: "REGISTRY",

    ROUTING: "ROUTE",

    AUTH: "AUTH",

    CACHE: "CACHE",

    API: "API",

    STORAGE: "STORAGE",

    EVENT: "EVENT",

    LOGGER: "LOGGER",

    PROVIDER: "PROVIDER",

    PLUGIN: "PLUGIN",

    VALIDATOR: "VALIDATOR",

    BUILDER: "BUILDER",

    FACTORY: "FACTORY",

    MIDDLEWARE: "MIDDLEWARE",

    LAYOUT: "LAYOUT"

});

/**
 * Códigos oficiais de erro.
 *
 * Nunca utilizar strings mágicas no Framework.
 */
const ErrorCodes = Object.freeze({

    /*
    |--------------------------------------------------------------------------
    | CORE
    |--------------------------------------------------------------------------
    */

    CORE_UNKNOWN: "CORE_000",

    CORE_INVALID_ARGUMENT: "CORE_001",

    CORE_NULL_ARGUMENT: "CORE_002",

    CORE_INVALID_TYPE: "CORE_003",

    CORE_NOT_IMPLEMENTED: "CORE_004",

    CORE_TIMEOUT: "CORE_005",

    CORE_UNSUPPORTED: "CORE_006",

    /*
    |--------------------------------------------------------------------------
    | REGISTRY
    |--------------------------------------------------------------------------
    */

    REGISTRY_INVALID_KEY: "REGISTRY_001",

    REGISTRY_DUPLICATED_KEY: "REGISTRY_002",

    REGISTRY_KEY_NOT_FOUND: "REGISTRY_003",

    REGISTRY_FROZEN: "REGISTRY_004",

    REGISTRY_ALREADY_EXISTS: "REGISTRY_005",

    REGISTRY_EMPTY: "REGISTRY_006",

    /*
    |--------------------------------------------------------------------------
    | ROUTING
    |--------------------------------------------------------------------------
    */

    ROUTE_NOT_FOUND: "ROUTE_001",

    ROUTE_ALREADY_EXISTS: "ROUTE_002",

    ROUTE_INVALID_PATH: "ROUTE_003",

    ROUTE_INVALID_COMPONENT: "ROUTE_004",

    ROUTE_INVALID_LAYOUT: "ROUTE_005",

    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    AUTH_REQUIRED: "AUTH_001",

    AUTH_INVALID_TOKEN: "AUTH_002",

    AUTH_EXPIRED_TOKEN: "AUTH_003",

    AUTH_FORBIDDEN: "AUTH_004",

    /*
    |--------------------------------------------------------------------------
    | CACHE
    |--------------------------------------------------------------------------
    */

    CACHE_DISABLED: "CACHE_001",

    CACHE_NOT_FOUND: "CACHE_002",

    CACHE_WRITE_FAILED: "CACHE_003",

    CACHE_READ_FAILED: "CACHE_004",

    /*
    |--------------------------------------------------------------------------
    | LOGGER
    |--------------------------------------------------------------------------
    */

    LOGGER_TRANSPORT_FAILED: "LOGGER_001",

    LOGGER_INVALID_LEVEL: "LOGGER_002",

    /*
    |--------------------------------------------------------------------------
    | EVENTS
    |--------------------------------------------------------------------------
    */

    EVENT_NOT_FOUND: "EVENT_001",

    EVENT_LISTENER_FAILED: "EVENT_002",

    EVENT_DISPATCH_FAILED: "EVENT_003"

});

export default ErrorCodes;