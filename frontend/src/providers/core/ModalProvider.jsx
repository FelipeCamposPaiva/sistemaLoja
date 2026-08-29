import {

    createContext,
    useReducer,
    useCallback,
    useMemo,
    useContext

} from "react";

import storage from "../core/storage/storage";
import eventBus from "../core/events/eventBus";
import logger from "../core/logger/logger";

/* ==========================================================
 * Constantes
 * ========================================================== */

const STORAGE_KEY = "erp:modal";

const ModalContext = createContext(null);

const ACTIONS = {

    INITIALIZE: "INITIALIZE",

    OPEN: "OPEN",

    CLOSE: "CLOSE",

    CLOSE_ALL: "CLOSE_ALL",

    UPDATE: "UPDATE",

    REPLACE: "REPLACE",

    SET_LOADING: "SET_LOADING",

    SET_ERROR: "SET_ERROR",

    RESET: "RESET"

};

/* ==========================================================
 * Estado Inicial
 * ========================================================== */

const initialState = {

    initialized: false,

    loading: false,

    stack: [],

    activeModal: null,

    backdrop: true,

    error: null

};

/* ==========================================================
 * Helpers
 * ========================================================== */

function createModal(options = {}) {

    return {

        id: crypto.randomUUID(),

        title: options.title || "",

        component: options.component || null,

        props: options.props || {},

        size: options.size || "md",

        fullscreen: options.fullscreen || false,

        drawer: options.drawer || false,

        backdrop: options.backdrop !== false,

        closeOnEscape:

            options.closeOnEscape !== false,

        closeOnBackdrop:

            options.closeOnBackdrop !== false,

        persistent:

            options.persistent || false,

        createdAt: new Date().toISOString()

    };

}

/* ==========================================================
 * Reducer
 * ========================================================== */

function reducer(state, action) {

    switch (action.type) {

        case ACTIONS.INITIALIZE:

            return {

                ...state,

                initialized: true,

                stack: [],

                activeModal: null

            };

        case ACTIONS.OPEN: {

            const stack = [

                ...state.stack,

                action.payload

            ];

            return {

                ...state,

                stack,

                activeModal:

                    stack[stack.length - 1]

            };

        }

        case ACTIONS.CLOSE: {

            const stack = state.stack.filter(

                modal =>

                    modal.id !== action.payload

            );

            return {

                ...state,

                stack,

                activeModal:

                    stack.length > 0

                        ? stack[stack.length - 1]

                        : null

            };

        }

        case ACTIONS.CLOSE_ALL:

            return {

                ...state,

                stack: [],

                activeModal: null

            };

        case ACTIONS.REPLACE:

            return {

                ...state,

                stack: [

                    action.payload

                ],

                activeModal:

                    action.payload

            };

        case ACTIONS.UPDATE: {

            const stack = state.stack.map(

                modal =>

                    modal.id === action.payload.id

                        ? {

                            ...modal,

                            ...action.payload

                        }

                        : modal

            );

            return {

                ...state,

                stack,

                activeModal:

                    stack.length > 0

                        ? stack[stack.length - 1]

                        : null

            };

        }

        case ACTIONS.SET_LOADING:

            return {

                ...state,

                loading: action.payload

            };

        case ACTIONS.SET_ERROR:

            return {

                ...state,

                error: action.payload

            };

        case ACTIONS.RESET:

            return {

                ...initialState,

                initialized: true

            };

        default:

            return state;

    }

}

/* ==========================================================
 * Provider
 * ========================================================== */

export function ModalProvider({ children }) {

    const [state, dispatch] = useReducer(
        reducer,
        initialState
    );

    /* ======================================================
     * Inicialização
     * ====================================================== */

    const initialize = useCallback(() => {

        try {

            dispatch({

                type: ACTIONS.INITIALIZE

            });

            logger.info(
                "ModalProvider inicializado."
            );

            eventBus.emit(
                "modal:initialized"
            );

        } catch (error) {

            logger.error(error);

            dispatch({

                type: ACTIONS.SET_ERROR,

                payload: error

            });

        }

    }, []);

    /* ======================================================
     * Abrir Modal
     * ====================================================== */

    const open = useCallback((options = {}) => {

        const modal = createModal(options);

        dispatch({

            type: ACTIONS.OPEN,

            payload: modal

        });

        logger.info(
            `[Modal] ${modal.title || modal.id}`
        );

        eventBus.emit(
            "modal:open",
            modal
        );

        return modal.id;

    }, []);

    /* ======================================================
     * Fechar Modal
     * ====================================================== */

    const close = useCallback((id) => {

        dispatch({

            type: ACTIONS.CLOSE,

            payload: id

        });

        eventBus.emit(
            "modal:close",
            id
        );

    }, []);

    /* ======================================================
     * Fechar Todos
     * ====================================================== */

    const closeAll = useCallback(() => {

        dispatch({

            type: ACTIONS.CLOSE_ALL

        });

        eventBus.emit(
            "modal:closeAll"
        );

    }, []);

    /* ======================================================
     * Substituir Modal
     * ====================================================== */

    const replace = useCallback((options = {}) => {

        const modal = createModal(options);

        dispatch({

            type: ACTIONS.REPLACE,

            payload: modal

        });

        eventBus.emit(
            "modal:replace",
            modal
        );

        return modal.id;

    }, []);

    /* ======================================================
     * Atualizar Modal
     * ====================================================== */

    const update = useCallback((id, options = {}) => {

        dispatch({

            type: ACTIONS.UPDATE,

            payload: {

                id,

                ...options

            }

        });

        eventBus.emit(
            "modal:update",
            {

                id,

                ...options

            }

        );

    }, []);

    /* ======================================================
     * Verificações
     * ====================================================== */

    const isOpen = useCallback((id) => {

        return state.stack.some(

            modal => modal.id === id

        );

    }, [

        state.stack

    ]);

    const top = useCallback(() => {

        if (state.stack.length === 0) {

            return null;

        }

        return state.stack[
            state.stack.length - 1
        ];

    }, [

        state.stack

    ]);

    const count = useCallback(() => {

        return state.stack.length;

    }, [

        state.stack

    ]);

        /* ======================================================
     * Persistência
     * ====================================================== */

    useEffect(() => {

        if (!state.initialized) {

            return;

        }

        storage.set(

            STORAGE_KEY,

            {

                total: state.stack.length,

                lastModal:

                    state.activeModal?.title || null

            }

        );

    }, [

        state.stack,

        state.activeModal,

        state.initialized

    ]);

    /* ======================================================
     * Eventos Globais
     * ====================================================== */

    useEffect(() => {

        if (!state.initialized) {

            return;

        }

        eventBus.emit(

            "modal:changed",

            {

                total: state.stack.length,

                activeModal: state.activeModal

            }

        );

    }, [

        state.stack,

        state.activeModal,

        state.initialized

    ]);

    /* ======================================================
     * Fechar com ESC
     * ====================================================== */

    useEffect(() => {

        const handleKeyDown = (event) => {

            if (event.key !== "Escape") {

                return;

            }

            const modal = state.activeModal;

            if (!modal) {

                return;

            }

            if (modal.closeOnEscape === false) {

                return;

            }

            close(modal.id);

        };

        window.addEventListener(

            "keydown",

            handleKeyDown

        );

        return () => {

            window.removeEventListener(

                "keydown",

                handleKeyDown

            );

        };

    }, [

        state.activeModal,

        close

    ]);

    /* ======================================================
     * Reset
     * ====================================================== */

    const reset = useCallback(() => {

        storage.remove(

            STORAGE_KEY

        );

        dispatch({

            type: ACTIONS.RESET

        });

        logger.info(

            "ModalProvider restaurado."

        );

        eventBus.emit(

            "modal:reset"

        );

    }, []);

    /* ======================================================
     * Inicialização
     * ====================================================== */

    useEffect(() => {

        initialize();

    }, [

        initialize

    ]);

        /* ======================================================
     * Context Value
     * ====================================================== */

    const value = useMemo(() => ({

        /* Estado */

        initialized: state.initialized,

        loading: state.loading,

        stack: state.stack,

        activeModal: state.activeModal,

        backdrop: state.backdrop,

        error: state.error,

        /* API */

        initialize,

        open,

        close,

        closeAll,

        replace,

        update,

        isOpen,

        top,

        count,

        reset

    }), [

        state,

        initialize,

        open,

        close,

        closeAll,

        replace,

        update,

        isOpen,

        top,

        count,

        reset

    ]);

    /* ======================================================
     * Render
     * ====================================================== */

    return (

        <ModalContext.Provider value={value}>

            {children}

        </ModalContext.Provider>

    );

}

/* ==========================================================
 * Hook
 * ========================================================== */

export function useModal() {

    const context = useContext(

        ModalContext

    );

    if (!context) {

        throw new Error(

            "useModal deve ser utilizado dentro do ModalProvider."

        );

    }

    return context;

}

/* ==========================================================
 * Exportações
 * ========================================================== */

export {

    ModalContext

};

export default ModalProvider;