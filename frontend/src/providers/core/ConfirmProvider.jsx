import {

    createContext,
    useReducer,
    useCallback,
    useContext,
    useMemo

} from "react";

import { useModal } from "./ModalProvider";

import eventBus from "../core/events/eventBus";
import logger from "../core/logger/logger";

/* ==========================================================
 * Context
 * ========================================================== */

const ConfirmContext = createContext(null);

/* ==========================================================
 * Actions
 * ========================================================== */

const ACTIONS = {

    INITIALIZE: "INITIALIZE",

    OPEN: "OPEN",

    RESOLVE: "RESOLVE",

    REJECT: "REJECT",

    CLOSE: "CLOSE",

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

    current: null,

    queue: [],

    error: null

};

/* ==========================================================
 * Helper
 * ========================================================== */

function createDialog(options = {}) {

    return {

        id: crypto.randomUUID(),

        type: options.type || "confirm",

        title: options.title || "Confirmação",

        message: options.message || "",

        label: options.label || "",

        placeholder: options.placeholder || "",

        defaultValue: options.defaultValue || "",

        confirmText:

            options.confirmText ||

            "Confirmar",

        cancelText:

            options.cancelText ||

            "Cancelar",

        icon:

            options.icon ||

            "question",

        severity:

            options.severity ||

            "primary",

        persistent:

            options.persistent ||

            false,

        createdAt:

            new Date().toISOString()

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

                initialized: true

            };

        case ACTIONS.OPEN:

            return {

                ...state,

                current: action.payload

            };

        case ACTIONS.CLOSE:

            return {

                ...state,

                current: null

            };

        case ACTIONS.RESOLVE:

            return {

                ...state,

                current: null

            };

        case ACTIONS.REJECT:

            return {

                ...state,

                current: null

            };

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

export function ConfirmProvider({ children }) {

    const modal = useModal();

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

                "ConfirmProvider inicializado."

            );

            eventBus.emit(

                "confirm:initialized"

            );

        }

        catch (error) {

            logger.error(error);

        }

    }, []);

    /* ======================================================
     * Resolve
     * ====================================================== */

    const resolveDialog = useCallback((

        dialog,

        value

    ) => {

        if (

            dialog?.resolve

        ) {

            dialog.resolve(value);

        }

        dispatch({

            type: ACTIONS.RESOLVE

        });

        modal.close(

            dialog.modalId

        );

        eventBus.emit(

            "confirm:resolved",

            value

        );

    }, [

        modal

    ]);

    /* ======================================================
     * Reject
     * ====================================================== */

    const rejectDialog = useCallback((

        dialog,

        value = null

    ) => {

        if (

            dialog?.reject

        ) {

            dialog.reject(value);

        }

        dispatch({

            type: ACTIONS.REJECT

        });

        modal.close(

            dialog.modalId

        );

        eventBus.emit(

            "confirm:rejected"

        );

    }, [

        modal

    ]);

    /* ======================================================
     * Confirm
     * ====================================================== */

    const confirm = useCallback((

        options = {}

    ) => {

        return new Promise((

            resolve,

            reject

        ) => {

            const dialog = createDialog({

                ...options,

                type: "confirm"

            });

            dialog.resolve = resolve;

            dialog.reject = reject;

            dialog.modalId = modal.open({

                title:

                    dialog.title,

                component:

                    "ConfirmDialog",

                props: {

                    dialog,

                    onConfirm: () =>

                        resolveDialog(

                            dialog,

                            true

                        ),

                    onCancel: () =>

                        rejectDialog(

                            dialog,

                            false

                        )

                }

            });

            dispatch({

                type: ACTIONS.OPEN,

                payload: dialog

            });

            logger.info(

                "Confirm aberto."

            );

        });

    }, [

        modal,

        resolveDialog,

        rejectDialog

    ]);

        /* ======================================================
     * Alert
     * ====================================================== */

    const alert = useCallback((

        options = {}

    ) => {

        return new Promise((

            resolve

        ) => {

            const dialog = createDialog({

                ...options,

                type: "alert"

            });

            dialog.resolve = resolve;

            dialog.modalId = modal.open({

                title:

                    dialog.title,

                component:

                    "AlertDialog",

                props: {

                    dialog,

                    onConfirm: () =>

                        resolveDialog(

                            dialog,

                            true

                        )

                }

            });

            dispatch({

                type: ACTIONS.OPEN,

                payload: dialog

            });

        });

    }, [

        modal,

        resolveDialog

    ]);

        /* ======================================================
     * Prompt
     * ====================================================== */

    const prompt = useCallback((

        options = {}

    ) => {

        return new Promise((

            resolve,

            reject

        ) => {

            const dialog = createDialog({

                ...options,

                type: "prompt"

            });

            dialog.resolve = resolve;

            dialog.reject = reject;

            dialog.modalId = modal.open({

                title:

                    dialog.title,

                component:

                    "PromptDialog",

                props: {

                    dialog,

                    onConfirm: value =>

                        resolveDialog(

                            dialog,

                            value

                        ),

                    onCancel: () =>

                        rejectDialog(

                            dialog,

                            null

                        )

                }

            });

            dispatch({

                type: ACTIONS.OPEN,

                payload: dialog

            });

        });

    }, [

        modal,

        resolveDialog,

        rejectDialog

    ]);

        /* ======================================================
     * Reset
     * ====================================================== */

    const reset = useCallback(() => {

        dispatch({

            type: ACTIONS.RESET

        });

        logger.info(

            "ConfirmProvider restaurado."

        );

        eventBus.emit(

            "confirm:reset"

        );

    }, []);

    /* ======================================================
     * Eventos
     * ====================================================== */

    useEffect(() => {

        if (!state.initialized) {

            return;

        }

        eventBus.emit(

            "confirm:changed",

            {

                current: state.current,

                loading: state.loading,

                queue: state.queue.length

            }

        );

    }, [

        state.current,

        state.loading,

        state.queue,

        state.initialized

    ]);

    /* ======================================================
     * Atalho ESC
     * ====================================================== */

    useEffect(() => {

        const handleKeyDown = (event) => {

            if (event.key !== "Escape") {

                return;

            }

            const dialog = state.current;

            if (!dialog) {

                return;

            }

            if (dialog.persistent) {

                return;

            }

            rejectDialog(

                dialog,

                false

            );

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

        state.current,

        rejectDialog

    ]);

    /* ======================================================
     * Atalho ENTER
     * ====================================================== */

    useEffect(() => {

        const handleKeyDown = (event) => {

            if (event.key !== "Enter") {

                return;

            }

            const dialog = state.current;

            if (!dialog) {

                return;

            }

            if (dialog.type === "alert") {

                resolveDialog(

                    dialog,

                    true

                );

                return;

            }

            if (dialog.type === "confirm") {

                resolveDialog(

                    dialog,

                    true

                );

            }

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

        state.current,

        resolveDialog

    ]);

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

        current: state.current,

        queue: state.queue,

        error: state.error,

        /* API */

        initialize,

        confirm,

        alert,

        prompt,

        resolveDialog,

        rejectDialog,

        reset

    }), [

        state,

        initialize,

        confirm,

        alert,

        prompt,

        resolveDialog,

        rejectDialog,

        reset

    ]);

    /* ======================================================
     * Render
     * ====================================================== */

    return (

        <ConfirmContext.Provider value={value}>

            {children}

        </ConfirmContext.Provider>

    );

}

/* ==========================================================
 * Hook
 * ========================================================== */

export function useConfirm() {

    const context = useContext(

        ConfirmContext

    );

    if (!context) {

        throw new Error(

            "useConfirm deve ser utilizado dentro do ConfirmProvider."

        );

    }

    return context;

}

/* ==========================================================
 * Exportações
 * ========================================================== */

export {

    ConfirmContext

};

export default ConfirmProvider;