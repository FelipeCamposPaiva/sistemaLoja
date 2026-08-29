import {

    createContext,
    useReducer,
    useCallback,
    useContext,
    useMemo

} from "react";

import eventBus from "../core/events/eventBus";
import logger from "../core/logger/logger";

/* ==========================================================
 * Context
 * ========================================================== */

const LoadingContext = createContext(null);

/* ==========================================================
 * Actions
 * ========================================================== */

const ACTIONS = {

    INITIALIZE: "INITIALIZE",

    SHOW: "SHOW",

    HIDE: "HIDE",

    START: "START",

    FINISH: "FINISH",

    SET_PROGRESS: "SET_PROGRESS",

    SET_MESSAGE: "SET_MESSAGE",

    SET_ERROR: "SET_ERROR",

    RESET: "RESET"

};

/* ==========================================================
 * Estado Inicial
 * ========================================================== */

const initialState = {

    initialized: false,

    visible: false,

    loading: false,

    counter: 0,

    progress: null,

    message: "",

    operations: {},

    error: null

};

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

        case ACTIONS.SHOW:

            return {

                ...state,

                visible: true,

                loading: true,

                counter: state.counter + 1

            };

        case ACTIONS.HIDE: {

            const counter = Math.max(

                state.counter - 1,

                0

            );

            return {

                ...state,

                counter,

                loading: counter > 0,

                visible: counter > 0,

                progress:

                    counter > 0

                        ? state.progress

                        : null,

                message:

                    counter > 0

                        ? state.message

                        : ""

            };

        }

        case ACTIONS.START:

            return {

                ...state,

                loading: true,

                visible: true,

                counter: state.counter + 1,

                operations: {

                    ...state.operations,

                    [action.payload.id]:

                        action.payload

                }

            };

        case ACTIONS.FINISH: {

            const operations = {

                ...state.operations

            };

            delete operations[

                action.payload

            ];

            const counter = Math.max(

                Object.keys(

                    operations

                ).length,

                0

            );

            return {

                ...state,

                operations,

                counter,

                loading:

                    counter > 0,

                visible:

                    counter > 0

            };

        }

        case ACTIONS.SET_PROGRESS:

            return {

                ...state,

                progress:

                    action.payload

            };

        case ACTIONS.SET_MESSAGE:

            return {

                ...state,

                message:

                    action.payload

            };

        case ACTIONS.SET_ERROR:

            return {

                ...state,

                error:

                    action.payload

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
 * Helper
 * ========================================================== */

function createOperation(options = {}) {

    return {

        id:

            options.id ||

            crypto.randomUUID(),

        name:

            options.name ||

            "Operação",

        module:

            options.module ||

            "global",

        progress:

            options.progress ??

            null,

        startedAt:

            new Date().toISOString()

    };

}

/* ==========================================================
 * Provider
 * ========================================================== */

export function LoadingProvider({ children }) {

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

                "LoadingProvider inicializado."

            );

            eventBus.emit(

                "loading:initialized"

            );

        }

        catch (error) {

            logger.error(error);

        }

    }, []);

    /* ======================================================
     * Show
     * ====================================================== */

    const show = useCallback((message = "") => {

        dispatch({

            type: ACTIONS.SHOW

        });

        if (message) {

            dispatch({

                type: ACTIONS.SET_MESSAGE,

                payload: message

            });

        }

        eventBus.emit(

            "loading:show",

            {

                message

            }

        );

    }, []);

    /* ======================================================
     * Hide
     * ====================================================== */

    const hide = useCallback(() => {

        dispatch({

            type: ACTIONS.HIDE

        });

        eventBus.emit(

            "loading:hide"

        );

    }, []);

    /* ======================================================
     * Start Operation
     * ====================================================== */

    const start = useCallback((options = {}) => {

        const operation = createOperation(options);

        dispatch({

            type: ACTIONS.START,

            payload: operation

        });

        logger.info(

            `[Loading] ${operation.name}`

        );

        eventBus.emit(

            "loading:start",

            operation

        );

        return operation.id;

    }, []);

    /* ======================================================
     * Finish Operation
     * ====================================================== */

    const finish = useCallback((id) => {

        dispatch({

            type: ACTIONS.FINISH,

            payload: id

        });

        eventBus.emit(

            "loading:finish",

            id

        );

    }, []);

    /* ======================================================
     * Progress
     * ====================================================== */

    const setProgress = useCallback((progress) => {

        dispatch({

            type: ACTIONS.SET_PROGRESS,

            payload: progress

        });

        eventBus.emit(

            "loading:progress",

            progress

        );

    }, []);

    /* ======================================================
     * Message
     * ====================================================== */

    const setMessage = useCallback((message) => {

        dispatch({

            type: ACTIONS.SET_MESSAGE,

            payload: message

        });

        eventBus.emit(

            "loading:message",

            message

        );

    }, []);

        /* ======================================================
     * Wrap Async
     * ====================================================== */

    const wrap = useCallback(async (

        callback,

        options = {}

    ) => {

        const id = start(options);

        try {

            const result = await callback();

            return result;

        }

        catch (error) {

            logger.error(error);

            dispatch({

                type: ACTIONS.SET_ERROR,

                payload: error

            });

            throw error;

        }

        finally {

            finish(id);

        }

    }, [

        start,

        finish

    ]);

        /* ======================================================
     * Reset
     * ====================================================== */

    const reset = useCallback(() => {

        dispatch({

            type: ACTIONS.RESET

        });

        logger.info(

            "LoadingProvider restaurado."

        );

        eventBus.emit(

            "loading:reset"

        );

    }, []);

    /* ======================================================
     * Eventos Globais
     * ====================================================== */

    useEffect(() => {

        if (!state.initialized) {

            return;

        }

        eventBus.emit(

            "loading:changed",

            {

                loading: state.loading,

                visible: state.visible,

                counter: state.counter,

                progress: state.progress,

                message: state.message,

                operations:

                    Object.values(

                        state.operations

                    )

            }

        );

    }, [

        state.loading,

        state.visible,

        state.counter,

        state.progress,

        state.message,

        state.operations,

        state.initialized

    ]);

    /* ======================================================
     * Auto Progress (Opcional)
     * ====================================================== */

    useEffect(() => {

        if (

            !state.loading ||

            state.progress !== null

        ) {

            return;

        }

        eventBus.emit(

            "loading:auto"

        );

    }, [

        state.loading,

        state.progress

    ]);

    /* ======================================================
     * Integração com API
     * ====================================================== */

    useEffect(() => {

        const unsubscribeStart = eventBus.on(

            "api:request:start",

            payload => {

                start({

                    id:

                        payload.id,

                    name:

                        payload.name ||

                        "Requisição",

                    module:

                        payload.module ||

                        "api"

                });

            }

        );

        const unsubscribeFinish = eventBus.on(

            "api:request:finish",

            payload => {

                finish(

                    payload.id

                );

            }

        );

        return () => {

            if (

                typeof unsubscribeStart === "function"

            ) {

                unsubscribeStart();

            }

            if (

                typeof unsubscribeFinish === "function"

            ) {

                unsubscribeFinish();

            }

        };

    }, [

        start,

        finish

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

        visible: state.visible,

        loading: state.loading,

        counter: state.counter,

        progress: state.progress,

        message: state.message,

        operations: state.operations,

        error: state.error,

        /* API */

        initialize,

        show,

        hide,

        start,

        finish,

        wrap,

        setProgress,

        setMessage,

        reset

    }), [

        state,

        initialize,

        show,

        hide,

        start,

        finish,

        wrap,

        setProgress,

        setMessage,

        reset

    ]);

    /* ======================================================
     * Render
     * ====================================================== */

    return (

        <LoadingContext.Provider value={value}>

            {children}

        </LoadingContext.Provider>

    );

}

/* ==========================================================
 * Hook
 * ========================================================== */

export function useLoading() {

    const context = useContext(

        LoadingContext

    );

    if (!context) {

        throw new Error(

            "useLoading deve ser utilizado dentro do LoadingProvider."

        );

    }

    return context;

}

/* ==========================================================
 * Exportações
 * ========================================================== */

export {

    LoadingContext

};

export default LoadingProvider;