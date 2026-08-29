/**
 * =============================================================================
 * TDFE - Tem de Tudo Frontend Enterprise
 * ERP Tem de Tudo
 * =============================================================================
 *
 * Framework......: Registry
 * Módulo.........: Core
 * Arquivo........: createRegistryEngine.js
 *
 * Versão.........: 1.0.0
 * Release........: Registry
 * Sprint.........: Sprint 2
 *
 * Autor..........: Felipe Campos
 *
 * Criado em......: 01/08/2026
 * Atualizado em..: 01/08/2026
 * Hora...........: 19:10 (GMT-3)
 *
 * Status.........: Em Desenvolvimento
 * =============================================================================
 */

import RegistryException from "./RegistryException";

/**
 * Cria um novo mecanismo de Registry.
 *
 * @param {Object} options
 * @returns {Object}
 */
export default function createRegistryEngine(options = {}) {

    const config = Object.freeze({

        name: options.name ?? "registry",

        allowReplace: options.allowReplace ?? false,

        caseSensitive: options.caseSensitive ?? true

    });

    /**
     * Armazenamento interno.
     */

    const storage = new Map();

    /**
     * Estado.
     */

    let frozen = false;

    /**
     * Normaliza chave.
     */

    function normalizeKey(key) {

        if (typeof key !== "string") {

            throw new RegistryException(
                "INVALID_KEY",
                {
                    key
                }
            );

        }

        return config.caseSensitive
            ? key
            : key.toLowerCase();

    }

    /**
     * Verifica congelamento.
     */

    function ensureWritable() {

        if (frozen) {

            throw new RegistryException(
                "REGISTRY_FROZEN",
                {
                    registry: config.name
                }
            );

        }

    }

    /**
     * Registra item.
     */

    function register(key, value) {

        ensureWritable();

        key = normalizeKey(key);

        if (!config.allowReplace && storage.has(key)) {

            throw new RegistryException(
                "DUPLICATED_KEY",
                {
                    key
                }
            );

        }

        storage.set(key, value);

        return api;

    }

    /**
     * Registra vários.
     */

    function registerMany(items = {}) {

        ensureWritable();

        Object.entries(items).forEach(

            ([key, value]) => {

                register(key, value);

            }

        );

        return api;

    }

    /**
     * Obtém item.
     */

    function get(key) {

        key = normalizeKey(key);

        return storage.get(key);

    }

    /**
     * Existe?
     */

    function has(key) {

        key = normalizeKey(key);

        return storage.has(key);

    }

    /**
     * Remove.
     */

    function remove(key) {

        ensureWritable();

        key = normalizeKey(key);

        storage.delete(key);

        return api;

    }

    /**
     * Atualiza.
     */

    function update(key, callback) {

        ensureWritable();

        key = normalizeKey(key);

        if (!storage.has(key)) {

            throw new RegistryException(
                "KEY_NOT_FOUND",
                {
                    key
                }
            );

        }

        storage.set(

            key,

            callback(storage.get(key))

        );

        return api;

    }

    /**
     * Substitui.
     */

    function replace(key, value) {

        ensureWritable();

        key = normalizeKey(key);

        storage.set(key, value);

        return api;

    }

    /**
     * Limpa.
     */

    function clear() {

        ensureWritable();

        storage.clear();

        return api;

    }

    /**
     * Congela.
     */

    function freeze() {

        frozen = true;

        return api;

    }

    /**
     * Descongela.
     */

    function unfreeze() {

        frozen = false;

        return api;

    }

    /**
     * Está congelado?
     */

    function isFrozen() {

        return frozen;

    }

    /**
     * Quantidade.
     */

    function count() {

        return storage.size;

    }

    /**
     * Está vazio?
     */

    function isEmpty() {

        return storage.size === 0;

    }

    /**
     * Chaves.
     */

    function keys() {

        return [...storage.keys()];

    }

    /**
     * Valores.
     */

    function values() {

        return [...storage.values()];

    }

    /**
     * Entradas.
     */

    function entries() {

        return [...storage.entries()];

    }

    /**
     * JSON.
     */

    function toJSON() {

        return Object.fromEntries(storage);

    }

    /**
     * Clone.
     */

    function clone() {

        const registry = createRegistryEngine(config);

        registry.registerMany(

            Object.fromEntries(storage)

        );

        return registry;

    }

    /**
     * API Pública.
     */

    const api = Object.freeze({

        register,

        registerMany,

        get,

        has,

        remove,

        replace,

        update,

        clear,

        freeze,

        unfreeze,

        isFrozen,

        count,

        isEmpty,

        keys,

        values,

        entries,

        toJSON,

        clone

    });

    return api;

}