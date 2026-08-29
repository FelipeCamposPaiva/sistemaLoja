import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useReducer
} from "react";

import storage from "../core/storage/storage";
import eventBus from "../core/events/eventBus";
import logger from "../core/logger/logger";

/* ==========================================================
 * Constantes
 * ========================================================== */

const STORAGE_KEY = "notifications";

const initialState = {

    initialized: false,

    loading: false,

    notifications: [],

    unreadCount: 0,

    filter: "all",

    error: null

};

/* ==========================================================
 * Actions
 * ========================================================== */

const ACTIONS = {

    INITIALIZE: "INITIALIZE",

    SET_LOADING: "SET_LOADING",

    ADD: "ADD",

    UPDATE: "UPDATE",

    REMOVE: "REMOVE",

    MARK_READ: "MARK_READ",

    MARK_ALL_READ: "MARK_ALL_READ",

    CLEAR_ALL: "CLEAR_ALL",

    SET_FILTER: "SET_FILTER",

    SET_ERROR: "SET_ERROR",

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

                notifications: action.payload,

                unreadCount: action.payload.filter(

                    item => !item.read

                ).length

            };

        case ACTIONS.SET_LOADING:

            return {

                ...state,

                loading: action.payload

            };

        case ACTIONS.ADD: {

            const notifications = [

                action.payload,

                ...state.notifications

            ];

            return {

                ...state,

                notifications,

                unreadCount: notifications.filter(

                    item => !item.read

                ).length

            };

        }

        case ACTIONS.UPDATE: {

            const notifications = state.notifications.map(

                item =>

                    item.id === action.payload.id

                        ? {

                            ...item,

                            ...action.payload

                        }

                        : item

            );

            return {

                ...state,

                notifications,

                unreadCount: notifications.filter(

                    item => !item.read

                ).length

            };

        }

        case ACTIONS.REMOVE: {

            const notifications = state.notifications.filter(

                item => item.id !== action.payload

            );

            return {

                ...state,

                notifications,

                unreadCount: notifications.filter(

                    item => !item.read

                ).length

            };

        }

        case ACTIONS.MARK_READ: {

            const notifications = state.notifications.map(

                item =>

                    item.id === action.payload

                        ? {

                            ...item,

                            read: true,

                            readAt: Date.now()

                        }

                        : item

            );

            return {

                ...state,

                notifications,

                unreadCount: notifications.filter(

                    item => !item.read

                ).length

            };

        }

        case ACTIONS.MARK_ALL_READ: {

            const notifications = state.notifications.map(

                item => ({

                    ...item,

                    read: true,

                    readAt: Date.now()

                })

            );

            return {

                ...state,

                notifications,

                unreadCount: 0

            };

        }

        case ACTIONS.CLEAR_ALL:

            return {

                ...state,

                notifications: [],

                unreadCount: 0

            };

        case ACTIONS.SET_FILTER:

            return {

                ...state,

                filter: action.payload

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
 * Context
 * ========================================================== */

const NotificationContext = createContext(null);

/* ==========================================================
 * Helper
 * ========================================================== */

function createNotification({

    type = "info",

    title = "",

    message = "",

    data = null,

    priority = "normal"

}) {

    return {

        id: crypto.randomUUID(),

        type,

        title,

        message,

        data,

        priority,

        read: false,

        createdAt: Date.now(),

        readAt: null

    };

}

/* ==========================================================
 * Provider
 * ========================================================== */

export function NotificationProvider({ children }) {

    const [state, dispatch] = useReducer(
        reducer,
        initialState
    );

    /* ======================================================
     * Persistência
     * ====================================================== */

    const persist = useCallback((notifications) => {

        storage.set(

            STORAGE_KEY,

            notifications

        );

    }, []);

    /* ======================================================
     * Inicialização
     * ====================================================== */

    const initialize = useCallback(() => {

        try {

            const saved = storage.get(

                STORAGE_KEY,

                []

            );

            dispatch({

                type: ACTIONS.INITIALIZE,

                payload: saved

            });

            logger.info(

                "NotificationProvider inicializado."

            );

            eventBus.emit(

                "notification:initialized",

                saved

            );

        }

        catch (error) {

            logger.error(error);

        }

    }, []);

    /* ======================================================
     * Adicionar
     * ====================================================== */

    const addNotification = useCallback((options = {}) => {

        const notification = createNotification(
            options
        );

        dispatch({

            type: ACTIONS.ADD,

            payload: notification

        });

        logger.info(

            `[Notification] ${notification.title}`

        );

        eventBus.emit(

            "notification:add",

            notification

        );

        return notification.id;

    }, []);

    /* ======================================================
     * Atualizar
     * ====================================================== */

    const updateNotification = useCallback((

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

            "notification:update",

            {

                id,

                ...options

            }

        );

    }, []);

    /* ======================================================
     * Remover
     * ====================================================== */

    const removeNotification = useCallback((id) => {

        dispatch({

            type: ACTIONS.REMOVE,

            payload: id

        });

        eventBus.emit(

            "notification:remove",

            id

        );

    }, []);

    /* ======================================================
     * Marcar como Lida
     * ====================================================== */

    const markAsRead = useCallback((id) => {

        dispatch({

            type: ACTIONS.MARK_READ,

            payload: id

        });

        eventBus.emit(

            "notification:read",

            id

        );

    }, []);

    /* ======================================================
     * Marcar Todas como Lidas
     * ====================================================== */

    const markAllAsRead = useCallback(() => {

        dispatch({

            type: ACTIONS.MARK_ALL_READ

        });

        eventBus.emit(

            "notification:readAll"

        );

    }, []);

    /* ======================================================
     * Limpar Todas
     * ====================================================== */

    const clearAll = useCallback(() => {

        dispatch({

            type: ACTIONS.CLEAR_ALL

        });

        eventBus.emit(

            "notification:clearAll"

        );

    }, []);

    /* ======================================================
     * Filtro
     * ====================================================== */

    const setFilter = useCallback((filter) => {

        dispatch({

            type: ACTIONS.SET_FILTER,

            payload: filter

        });

    }, []);

    /* ======================================================
     * Limpar Erro
     * ====================================================== */

    const clearError = useCallback(() => {

        dispatch({

            type: ACTIONS.SET_ERROR,

            payload: null

        });

    }, []);

        /* ======================================================
     * Reset
     * ====================================================== */

    const resetNotifications = useCallback(() => {

        storage.remove(STORAGE_KEY);

        dispatch({

            type: ACTIONS.RESET

        });

        logger.info(

            "Notificações restauradas."

        );

        eventBus.emit(

            "notification:reset"

        );

    }, []);

    /* ======================================================
     * Persistência Automática
     * ====================================================== */

    useEffect(() => {

        if (!state.initialized) {

            return;

        }

        persist(

            state.notifications

        );

    }, [

        state.notifications,

        state.initialized,

        persist

    ]);

    /* ======================================================
     * Eventos
     * ====================================================== */

    useEffect(() => {

        if (!state.initialized) {

            return;

        }

        eventBus.emit(

            "notification:changed",

            {

                notifications:

                    state.notifications,

                unreadCount:

                    state.unreadCount,

                filter:

                    state.filter

            }

        );

    }, [

        state.notifications,

        state.unreadCount,

        state.filter,

        state.initialized

    ]);

    /* ======================================================
     * Integração WebSocket
     * ====================================================== */

    useEffect(() => {

        const unsubscribe = eventBus.on(

            "websocket:notification",

            (payload) => {

                addNotification({

                    type:

                        payload.type ||

                        "info",

                    title:

                        payload.title ||

                        "Nova notificação",

                    message:

                        payload.message ||

                        "",

                    data:

                        payload.data ||

                        null,

                    priority:

                        payload.priority ||

                        "normal"

                });

            }

        );

        return () => {

            if (

                typeof unsubscribe === "function"

            ) {

                unsubscribe();

            }

        };

    }, [

        addNotification

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

        notifications: state.notifications,

        unreadCount: state.unreadCount,

        filter: state.filter,

        error: state.error,

        /* Configuração */

        setFilter,

        clearError,

        /* API */

        initialize,

        addNotification,

        updateNotification,

        removeNotification,

        markAsRead,

        markAllAsRead,

        clearAll,

        resetNotifications

    }), [

        state,

        initialize,

        addNotification,

        updateNotification,

        removeNotification,

        markAsRead,

        markAllAsRead,

        clearAll,

        setFilter,

        clearError,

        resetNotifications

    ]);

    /* ======================================================
     * Render
     * ====================================================== */

    return (

        <NotificationContext.Provider value={value}>

            {children}

        </NotificationContext.Provider>

    );

}

/* ==========================================================
 * Hook
 * ========================================================== */

export function useNotification() {

    const context = useContext(

        NotificationContext

    );

    if (!context) {

        throw new Error(

            "useNotification deve ser utilizado dentro do NotificationProvider."

        );

    }

    return context;

}

/* ==========================================================
 * Exportações
 * ========================================================== */

export {

    NotificationContext

};

export default NotificationProvider;