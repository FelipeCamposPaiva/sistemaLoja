import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer
} from "react";

/*
import storage from "../../core/storage/storage";
import eventBus from "../../core/events/eventBus";
import logger from "../../core/logger/logger";
*/

/* ==========================================================
 * Constantes
 * ========================================================== */

const STORAGE_KEY = "app";

const VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

const initialState = {

    initialized: false,

    loading: false,

    offline: !navigator.onLine,

    maintenance: false,

    version: VERSION,

    environment:

        import.meta.env.MODE ||

        "production",

    settings: {

        language: "pt-BR",

        currency: "BRL",

        dateFormat: "DD/MM/YYYY",

        compactMode: false,

        animations: true

    },

    error: null

};

/* ==========================================================
 * Actions
 * ========================================================== */

const ACTIONS = {

    INITIALIZE: "INITIALIZE",

    SET_LOADING: "SET_LOADING",

    SET_OFFLINE: "SET_OFFLINE",

    SET_MAINTENANCE: "SET_MAINTENANCE",

    UPDATE_SETTINGS: "UPDATE_SETTINGS",

    SET_ERROR: "SET_ERROR",

    CLEAR_ERROR: "CLEAR_ERROR",

    RESET: "RESET"

};

/* ==========================================================
 * Reducer
 * ========================================================== */

function reducer(state, action) {

    switch (action.type) {

        case ACTIONS.INITIALIZE:

            return {

                ...state,

                initialized: true,

                ...action.payload

            };

        case ACTIONS.SET_LOADING:

            return {

                ...state,

                loading: action.payload

            };

        case ACTIONS.SET_OFFLINE:

            return {

                ...state,

                offline: action.payload

            };

        case ACTIONS.SET_MAINTENANCE:

            return {

                ...state,

                maintenance: action.payload

            };

        case ACTIONS.UPDATE_SETTINGS:

            return {

                ...state,

                settings: {

                    ...state.settings,

                    ...action.payload

                }

            };

        case ACTIONS.SET_ERROR:

            return {

                ...state,

                error: action.payload

            };

        case ACTIONS.CLEAR_ERROR:

            return {

                ...state,

                error: null

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
 * Context
 * ========================================================== */

const AppContext = createContext(null);

/* ==========================================================
 * Provider
 * ========================================================== */

export function AppProvider({ children }) {

    const [state, dispatch] = useReducer(

        reducer,

        initialState

    );

    /* ======================================================
     * Persistência
     * ====================================================== */

    const persist = useCallback((settings) => {

        storage.set(

            STORAGE_KEY,

            settings

        );

    }, []);

    /* ======================================================
     * Inicialização
     * ====================================================== */

    const initialize = useCallback(() => {

        try {

            const saved = storage.get(STORAGE_KEY);

            dispatch({

                type: ACTIONS.INITIALIZE,

                payload: {

                    settings: {

                        ...initialState.settings,

                        ...(saved || {})

                    }

                }

            });

            logger.info(

                "App inicializado."

            );

            eventBus.emit(

                "app:initialized"

            );

        }

        catch (error) {

            logger.error(error);

            dispatch({

                type: ACTIONS.SET_ERROR,

                payload: error.message

            });

        }

    }, []);

    /* ======================================================
     * Loading Global
     * ====================================================== */

    const setLoading = useCallback(

        (loading = true) => {

            dispatch({

                type: ACTIONS.SET_LOADING,

                payload: loading

            });

        },

        []

    );

    /* ======================================================
     * Offline
     * ====================================================== */

    const setOffline = useCallback(

        (offline) => {

            dispatch({

                type: ACTIONS.SET_OFFLINE,

                payload: offline

            });

            eventBus.emit(

                offline

                    ? "app:offline"

                    : "app:online"

            );

        },

        []

    );

    /* ======================================================
     * Manutenção
     * ====================================================== */

    const setMaintenance = useCallback(

        (maintenance) => {

            dispatch({

                type: ACTIONS.SET_MAINTENANCE,

                payload: maintenance

            });

        },

        []

    );

    /* ======================================================
     * Configurações
     * ====================================================== */

    const updateSettings = useCallback(

        (settings) => {

            const nextSettings = {

                ...state.settings,

                ...settings

            };

            persist(

                nextSettings

            );

            dispatch({

                type:

                    ACTIONS.UPDATE_SETTINGS,

                payload:

                    settings

            });

            logger.info(

                "Configurações atualizadas."

            );

            eventBus.emit(

                "app:settings",

                nextSettings

            );

        },

        [

            state.settings,

            persist

        ]

    );

    /* ======================================================
     * Erros
     * ====================================================== */

    const clearError = useCallback(() => {

        dispatch({

            type:

                ACTIONS.CLEAR_ERROR

        });

    }, []);

    /* ======================================================
     * Reset
     * ====================================================== */

    const resetApp = useCallback(() => {

        storage.remove(

            STORAGE_KEY

        );

        dispatch({

            type:

                ACTIONS.RESET

        });

        logger.info(

            "Aplicação reiniciada."

        );

        eventBus.emit(

            "app:reset"

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
     * Eventos Online / Offline
     * ====================================================== */

    useEffect(() => {

        const handleOnline = () => {

            setOffline(false);

        };

        const handleOffline = () => {

            setOffline(true);

        };

        window.addEventListener(

            "online",

            handleOnline

        );

        window.addEventListener(

            "offline",

            handleOffline

        );

        return () => {

            window.removeEventListener(

                "online",

                handleOnline

            );

            window.removeEventListener(

                "offline",

                handleOffline

            );

        };

    }, [

        setOffline

    ]);

    /* ======================================================
     * Context Value
     * ====================================================== */

    const value = useMemo(() => ({

        initialized:

            state.initialized,

        loading:

            state.loading,

        offline:

            state.offline,

        maintenance:

            state.maintenance,

        version:

            state.version,

        environment:

            state.environment,

        settings:

            state.settings,

        error:

            state.error,

        initialize,

        setLoading,

        setOffline,

        setMaintenance,

        updateSettings,

        clearError,

        resetApp

    }), [

        state,

        initialize,

        setLoading,

        setOffline,

        setMaintenance,

        updateSettings,

        clearError,

        resetApp

    ]);

    return (

        <AppContext.Provider

            value={value}

        >

            {children}

        </AppContext.Provider>

    );

}

/* ==========================================================
 * Hook
 * ========================================================== */

export function useApp() {

    const context = useContext(

        AppContext

    );

    if (!context) {

        throw new Error(

            "useApp deve ser utilizado dentro de AppProvider."

        );

    }

    return context;

}

/* ==========================================================
 * Exportações
 * ========================================================== */

export default AppProvider;