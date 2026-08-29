import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useReducer
} from "react";

import eventBus from "../core/events/eventBus";
import logger from "../core/logger/logger";

/* ==========================================================
 * Constantes
 * ========================================================== */

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 5000;

const initialState = {

    initialized: true,

    toasts: [],

    position: "top-right",

    maxToasts: MAX_TOASTS,

    defaultDuration: DEFAULT_DURATION,

    pauseOnHover: true,

    newestOnTop: true

};

/* ==========================================================
 * Actions
 * ========================================================== */

const ACTIONS = {

    SHOW: "SHOW",

    UPDATE: "UPDATE",

    DISMISS: "DISMISS",

    DISMISS_ALL: "DISMISS_ALL",

    SET_POSITION: "SET_POSITION",

    SET_MAX: "SET_MAX",

    SET_DURATION: "SET_DURATION"

};

/* ==========================================================
 * Reducer
 * ========================================================== */

function reducer(state, action) {

    switch (action.type) {

        case ACTIONS.SHOW: {

            const list = state.newestOnTop

                ? [

                    action.payload,

                    ...state.toasts

                ]

                : [

                    ...state.toasts,

                    action.payload

                ];

            return {

                ...state,

                toasts: list.slice(

                    0,

                    state.maxToasts

                )

            };

        }

        case ACTIONS.UPDATE:

            return {

                ...state,

                toasts: state.toasts.map(

                    toast =>

                        toast.id === action.payload.id

                            ? {

                                ...toast,

                                ...action.payload

                            }

                            : toast

                )

            };

        case ACTIONS.DISMISS:

            return {

                ...state,

                toasts: state.toasts.filter(

                    toast =>

                        toast.id !== action.payload

                )

            };

        case ACTIONS.DISMISS_ALL:

            return {

                ...state,

                toasts: []

            };

        case ACTIONS.SET_POSITION:

            return {

                ...state,

                position: action.payload

            };

        case ACTIONS.SET_MAX:

            return {

                ...state,

                maxToasts: action.payload

            };

        case ACTIONS.SET_DURATION:

            return {

                ...state,

                defaultDuration: action.payload

            };

        default:

            return state;

    }

}

/* ==========================================================
 * Context
 * ========================================================== */

const ToastContext = createContext(null);

/* ==========================================================
 * Helpers
 * ========================================================== */

function createToast({

    type = "info",

    title = "",

    message = "",

    duration = DEFAULT_DURATION,

    closable = true

}) {

    return {

        id: crypto.randomUUID(),

        type,

        title,

        message,

        duration,

        closable,

        createdAt: Date.now()

    };

}

/* ==========================================================
 * Provider
 * ========================================================== */

export function ToastProvider({ children }) {

    const [state, dispatch] = useReducer(
        reducer,
        initialState
    );

    /* ======================================================
     * Show
     * ====================================================== */

    const show = useCallback((options = {}) => {

        const toast = createToast(options);

        dispatch({

            type: ACTIONS.SHOW,

            payload: toast

        });

        logger.info(

            `[Toast] ${toast.type}: ${toast.message}`

        );

        eventBus.emit(

            "toast:show",

            toast

        );

        return toast.id;

    }, []);

    /* ======================================================
     * Success
     * ====================================================== */

    const success = useCallback((

        message,

        options = {}

    ) => {

        return show({

            ...options,

            type: "success",

            message

        });

    }, [

        show

    ]);

    /* ======================================================
     * Error
     * ====================================================== */

    const error = useCallback((

        message,

        options = {}

    ) => {

        return show({

            ...options,

            type: "error",

            message

        });

    }, [

        show

    ]);

    /* ======================================================
     * Warning
     * ====================================================== */

    const warning = useCallback((

        message,

        options = {}

    ) => {

        return show({

            ...options,

            type: "warning",

            message

        });

    }, [

        show

    ]);

    /* ======================================================
     * Info
     * ====================================================== */

    const info = useCallback((

        message,

        options = {}

    ) => {

        return show({

            ...options,

            type: "info",

            message

        });

    }, [

        show

    ]);

    /* ======================================================
     * Loading
     * ====================================================== */

    const loading = useCallback((

        message,

        options = {}

    ) => {

        return show({

            ...options,

            type: "loading",

            duration: 0,

            closable: false,

            message

        });

    }, [

        show

    ]);

    /* ======================================================
     * Update
     * ====================================================== */

    const update = useCallback((

        id,

        options = {}

    ) => {

        dispatch({

            type: ACTIONS.UPDATE,

            payload: {

                id,

                ...options

            }

        });

        eventBus.emit(

            "toast:update",

            {

                id,

                ...options

            }

        );

    }, []);

    /* ======================================================
     * Dismiss
     * ====================================================== */

    const dismiss = useCallback((id) => {

        dispatch({

            type: ACTIONS.DISMISS,

            payload: id

        });

        eventBus.emit(

            "toast:dismiss",

            id

        );

    }, []);

    /* ======================================================
     * Dismiss All
     * ====================================================== */

    const dismissAll = useCallback(() => {

        dispatch({

            type: ACTIONS.DISMISS_ALL

        });

        eventBus.emit(

            "toast:dismissAll"

        );

    }, []);

    /* ======================================================
     * Promise
     * ====================================================== */

    const promise = useCallback(async (

        promiseFn,

        messages = {}

    ) => {

        const id = loading(

            messages.loading ||

            "Processando..."

        );

        try {

            const result = await promiseFn;

            update(id, {

                type: "success",

                message:

                    messages.success ||

                    "Operação realizada com sucesso.",

                duration:

                    state.defaultDuration,

                closable: true

            });

            return result;

        }

        catch (err) {

            update(id, {

                type: "error",

                message:

                    messages.error ||

                    "Ocorreu um erro.",

                duration:

                    state.defaultDuration,

                closable: true

            });

            throw err;

        }

    }, [

        loading,

        update,

        state.defaultDuration

    ]);

        /* ======================================================
     * Configurações
     * ====================================================== */

    const setPosition = useCallback((position) => {

        dispatch({

            type: ACTIONS.SET_POSITION,

            payload: position

        });

    }, []);

    const setMaxToasts = useCallback((max) => {

        dispatch({

            type: ACTIONS.SET_MAX,

            payload: max

        });

    }, []);

    const setDefaultDuration = useCallback((duration) => {

        dispatch({

            type: ACTIONS.SET_DURATION,

            payload: duration

        });

    }, []);

    /* ======================================================
     * Inicialização
     * ====================================================== */

    const initialize = useCallback(() => {

        logger.info(

            "ToastProvider inicializado."

        );

        eventBus.emit(

            "toast:initialized"

        );

    }, []);

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

        toasts: state.toasts,

        position: state.position,

        maxToasts: state.maxToasts,

        defaultDuration: state.defaultDuration,

        pauseOnHover: state.pauseOnHover,

        newestOnTop: state.newestOnTop,

        /* Configuração */

        setPosition,

        setMaxToasts,

        setDefaultDuration,

        /* API */

        show,

        success,

        error,

        warning,

        info,

        loading,

        update,

        dismiss,

        dismissAll,

        promise

    }), [

        state,

        setPosition,

        setMaxToasts,

        setDefaultDuration,

        show,

        success,

        error,

        warning,

        info,

        loading,

        update,

        dismiss,

        dismissAll,

        promise

    ]);

    /* ======================================================
     * Render
     * ====================================================== */

    return (

        <ToastContext.Provider

            value={value}

        >

            {children}

        </ToastContext.Provider>

    );

}

/* ==========================================================
 * Hook
 * ========================================================== */

export function useToast() {

    const context = useContext(

        ToastContext

    );

    if (!context) {

        throw new Error(

            "useToast deve ser utilizado dentro do ToastProvider."

        );

    }

    return context;

}

/* ==========================================================
 * Exportações
 * ========================================================== */

export {

    ToastContext

};

export default ToastProvider;