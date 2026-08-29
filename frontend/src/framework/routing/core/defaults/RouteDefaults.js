/**
 * =============================================================================
 * TDFE - Tem de Tudo Frontend Enterprise
 * -----------------------------------------------------------------------------
 * Framework......: Routing
 * Arquivo........: RouteDefaults.js
 * Versão.........: 1.0.0
 * Sprint.........: Sprint 1 - Foundation
 *
 * Autor..........: Felipe Campos
 * Criado em......: 23/07/2026
 * Atualizado em..: 23/07/2026
 * Hora...........: HH:MM (GMT-3)
 *
 * Descrição:
 * Define a estrutura padrão de uma rota do Framework.
 * Toda rota criada pelo RouteBuilder inicia utilizando este objeto.
 * =============================================================================
 */

/**
 * Estrutura padrão de uma rota.
 */
const RouteDefaults = Object.freeze({

    /**
     * Identificação
     */
    id: null,

    name: "",

    title: "",

    subtitle: "",

    description: "",

    /**
     * Caminho
     */
    path: "",

    alias: [],

    /**
     * Página
     */
    page: null,

    /**
     * Layout
     */
    layout: null,

    /**
     * Navegação
     */
    menu: false,

    favorite: false,

    visible: true,

    searchable: true,

    order: 0,

    icon: null,

    badge: null,

    color: null,

    /**
     * Segurança
     */
    auth: false,

    guest: false,

    permissions: [],

    roles: [],

    modules: [],

    companies: [],

    licenses: [],

    /**
     * Middleware
     */
    middleware: [],

    /**
     * Filhas
     */
    children: [],

    /**
     * Cache
     */
    cache: false,

    keepAlive: false,

    /**
     * Lazy Loading
     */
    lazy: true,

    preload: false,

    /**
     * SEO
     */
    seo: {

        title: "",

        description: "",

        keywords: []

    },

    /**
     * Metadados
     */
    meta: {},

    /**
     * Estado
     */
    enabled: true,

    hidden: false

});

export default RouteDefaults;