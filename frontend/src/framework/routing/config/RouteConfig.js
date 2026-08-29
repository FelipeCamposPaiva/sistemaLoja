/**
 * =============================================================================
 * TDFE - Tem de Tudo Frontend Enterprise
 * -----------------------------------------------------------------------------
 * Framework......: Routing
 * Arquivo........: RouteConfig.js
 * Versão.........: 1.0.0
 * Sprint.........: Sprint 1 - Foundation
 *
 * Autor..........: Felipe Campos
 * Criado em......: 23/07/2026
 * Atualizado em..: 23/07/2026
 * Hora...........: 12:00 (GMT-3)
 *
 * Descrição:
 * Configuração global do Framework de Rotas.
 * Todas as opções padrão do sistema são centralizadas neste arquivo.
 * =============================================================================
 */

const RouteConfig = Object.freeze({

    /**
     * Informações do Framework
     */
    framework: {

        name: "TDFE Routing",

        version: "1.0.0",

        author: "Felipe Campos"

    },

    /**
     * Configurações Gerais
     */
    app: {

        debug: false,

        environment: "development",

        strictMode: true

    },

    /**
     * Configurações do React Router
     */
    router: {

        basename: "/",

        hashRouting: false,

        lazyLoading: true,

        preloadRoutes: false

    },

    /**
     * Configurações dos Guards
     */
    guards: {

        enabled: true,

        stopOnFail: true,

        redirectUnauthorized: "/login",

        redirectForbidden: "/403",

        redirectNotFound: "/404"

    },

    /**
     * Layout
     */
    layout: {

        default: "DefaultLayout",

        loading: "LoadingLayout",

        error: "ErrorLayout"

    },

    /**
     * Cache
     */
    cache: {

        enabled: true,

        ttl: 300,

        maxEntries: 500

    },

    /**
     * Navegação
     */
    navigation: {

        generateMenu: true,

        generateBreadcrumb: true,

        generateSearchIndex: true,

        sortByOrder: true

    },

    /**
     * Renderização
     */
    renderer: {

        suspense: true,

        fallback: null

    },

    /**
     * Middleware
     */
    middleware: {

        enabled: true,

        executeSequentially: true

    },

    /**
     * Logs
     */
    logging: {

        enabled: true,

        level: "info"

    }

});

export default RouteConfig;