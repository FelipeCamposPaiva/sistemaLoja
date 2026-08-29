/**
 * =============================================================================
 * TDFE - Tem de Tudo Frontend Enterprise
 * -----------------------------------------------------------------------------
 * Framework......: Routing
 * Módulo.........: Core
 * Submódulo......: Errors
 * Arquivo........: RouteErrors.js
 *
 * Versão.........: 1.0.0
 * Release........: Foundation
 * Sprint.........: Sprint 1
 *
 * Autor..........: Felipe Campos
 *
 * Descrição:
 * -----------------------------------------------------------------------------
 * Centraliza todas as mensagens de erro do Framework.
 *
 * As mensagens são independentes dos códigos de erro.
 * Os códigos ficam definidos em RouteErrorCodes.js.
 *
 * Este arquivo é preparado para futura internacionalização (i18n).
 * =============================================================================
 */

import RouteErrorCodes from "./RouteErrorCodes";

/**
 * Mensagens oficiais do Framework.
 */
const RouteErrors = Object.freeze({

    /**
     * ==========================================================
     * ROUTES
     * ==========================================================
     */

    [RouteErrorCodes.ROUTE_NOT_FOUND]:
        "A rota solicitada não foi encontrada.",

    [RouteErrorCodes.ROUTE_ALREADY_EXISTS]:
        "Já existe uma rota registrada com este identificador.",

    [RouteErrorCodes.ROUTE_INVALID_PATH]:
        "O caminho da rota é inválido.",

    [RouteErrorCodes.ROUTE_INVALID_NAME]:
        "O nome informado para a rota é inválido.",

    [RouteErrorCodes.ROUTE_DISABLED]:
        "A rota encontra-se desabilitada.",

    [RouteErrorCodes.ROUTE_HIDDEN]:
        "A rota está oculta.",

    /**
     * ==========================================================
     * BUILDER
     * ==========================================================
     */

    [RouteErrorCodes.BUILDER_INVALID_COMPONENT]:
        "O componente informado para a rota é inválido.",

    [RouteErrorCodes.BUILDER_INVALID_LAYOUT]:
        "O layout informado é inválido.",

    [RouteErrorCodes.BUILDER_BUILD_FAILED]:
        "Falha durante a construção da rota.",

    /**
     * ==========================================================
     * REGISTRY
     * ==========================================================
     */

    [RouteErrorCodes.REGISTRY_DUPLICATED_ROUTE]:
        "A rota já está registrada.",

    [RouteErrorCodes.REGISTRY_ROUTE_NOT_FOUND]:
        "A rota não foi encontrada no registro.",

    [RouteErrorCodes.REGISTRY_FROZEN]:
        "O registro está congelado e não aceita alterações.",

    /**
     * ==========================================================
     * GUARDS
     * ==========================================================
     */

    [RouteErrorCodes.AUTH_REQUIRED]:
        "Autenticação obrigatória.",

    [RouteErrorCodes.ACCESS_DENIED]:
        "Acesso negado.",

    [RouteErrorCodes.PERMISSION_DENIED]:
        "Permissão insuficiente para acessar esta rota.",

    [RouteErrorCodes.ROLE_DENIED]:
        "O perfil do usuário não possui acesso.",

    [RouteErrorCodes.COMPANY_DENIED]:
        "Empresa não autorizada.",

    [RouteErrorCodes.MODULE_DENIED]:
        "Módulo indisponível para o usuário.",

    [RouteErrorCodes.LICENSE_DENIED]:
        "Licença inválida ou expirada.",

    /**
     * ==========================================================
     * VALIDATOR
     * ==========================================================
     */

    [RouteErrorCodes.VALIDATION_FAILED]:
        "Falha na validação da rota.",

    [RouteErrorCodes.INVALID_CONFIGURATION]:
        "Configuração inválida.",

    [RouteErrorCodes.REQUIRED_FIELD]:
        "Campo obrigatório não informado.",

    [RouteErrorCodes.INVALID_TYPE]:
        "Tipo de dado inválido.",

    /**
     * ==========================================================
     * LAYOUT
     * ==========================================================
     */

    [RouteErrorCodes.LAYOUT_NOT_FOUND]:
        "Layout não encontrado.",

    [RouteErrorCodes.INVALID_LAYOUT]:
        "Layout inválido.",

    /**
     * ==========================================================
     * MIDDLEWARE
     * ==========================================================
     */

    [RouteErrorCodes.MIDDLEWARE_NOT_FOUND]:
        "Middleware não encontrado.",

    [RouteErrorCodes.MIDDLEWARE_FAILED]:
        "Erro durante a execução do middleware.",

    /**
     * ==========================================================
     * FACTORY
     * ==========================================================
     */

    [RouteErrorCodes.FACTORY_FAILED]:
        "Falha ao criar a rota.",

    /**
     * ==========================================================
     * PIPELINE
     * ==========================================================
     */

    [RouteErrorCodes.PIPELINE_FAILED]:
        "Erro durante a execução do pipeline.",

    /**
     * ==========================================================
     * RENDERER
     * ==========================================================
     */

    [RouteErrorCodes.RENDERER_FAILED]:
        "Erro durante a renderização da rota.",

    /**
     * ==========================================================
     * CACHE
     * ==========================================================
     */

    [RouteErrorCodes.CACHE_DISABLED]:
        "O cache encontra-se desabilitado.",

    [RouteErrorCodes.CACHE_WRITE_FAILED]:
        "Falha ao gravar no cache.",

    [RouteErrorCodes.CACHE_READ_FAILED]:
        "Falha ao ler do cache.",

    /**
     * ==========================================================
     * CONFIG
     * ==========================================================
     */

    [RouteErrorCodes.CONFIG_NOT_FOUND]:
        "Configuração não encontrada.",

    [RouteErrorCodes.CONFIG_INVALID]:
        "Configuração inválida."

});

/**
 * Obtém uma mensagem de erro a partir do código.
 *
 * @param {string} code Código do erro.
 * @param {string} fallback Mensagem padrão caso o código não exista.
 * @returns {string}
 */
export function getRouteErrorMessage(
    code,
    fallback = "Erro desconhecido."
) {
    return RouteErrors[code] ?? fallback;
}

export default RouteErrors;