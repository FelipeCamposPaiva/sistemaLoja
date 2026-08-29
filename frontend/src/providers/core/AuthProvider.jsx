import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer
} from "react";

import api from "../../services/api";

import storage from "../../core/storage/storage";
import cache from "../../core/cache/cache";
import eventBus from "../../core/events/eventBus";
import logger from "../../core/logger/logger";

/* ==========================================================
 * Constantes
 * ========================================================== */

const STORAGE_KEY = "auth";

const initialState = {

    initialized: false,

    loading: false,

    authenticated: false,

    token: null,

    refreshToken: null,

    usuario: null,

    permissoes: [],

    error: null

};

/* ==========================================================
 * Actions
 * ========================================================== */

const ACTIONS = {

    INITIALIZE: "INITIALIZE",

    LOGIN_START: "LOGIN_START",

    LOGIN_SUCCESS: "LOGIN_SUCCESS",

    LOGIN_ERROR: "LOGIN_ERROR",

    LOGOUT: "LOGOUT",

    UPDATE_USER: "UPDATE_USER",

    UPDATE_PERMISSIONS: "UPDATE_PERMISSIONS",

    CLEAR_ERROR: "CLEAR_ERROR"

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

                authenticated: !!action.payload?.token,

                ...action.payload

            };

        case ACTIONS.LOGIN_START:

            return {

                ...state,

                loading: true,

                error: null

            };

        case ACTIONS.LOGIN_SUCCESS:

            return {

                ...state,

                loading: false,

                authenticated: true,

                token: action.payload.token,

                refreshToken: action.payload.refreshToken,

                usuario: action.payload.usuario,

                permissoes:

                    action.payload.permissoes ||

                    [],

                error: null

            };

        case ACTIONS.LOGIN_ERROR:

            return {

                ...state,

                loading: false,

                authenticated: false,

                error: action.payload

            };

        case ACTIONS.UPDATE_USER:

            return {

                ...state,

                usuario: action.payload

            };

        case ACTIONS.UPDATE_PERMISSIONS:

            return {

                ...state,

                permissoes: action.payload

            };

        case ACTIONS.CLEAR_ERROR:

            return {

                ...state,

                error: null

            };

        case ACTIONS.LOGOUT:

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

const AuthContext = createContext(null);

/* ==========================================================
 * Provider
 * ========================================================== */

export function AuthProvider({ children }) {

    const [state, dispatch] = useReducer(

        reducer,

        initialState

    );

    /* ======================================================
     * Persistência
     * ====================================================== */

    const persist = useCallback((dados) => {

        storage.set(STORAGE_KEY, dados);

        cache.set(STORAGE_KEY, dados);

    }, []);

    const clearPersist = useCallback(() => {

        storage.remove(STORAGE_KEY);

        cache.remove(STORAGE_KEY);

    }, []);

    /* ======================================================
     * Inicialização
     * ====================================================== */

    const initialize = useCallback(async () => {

        try {

            let dados = cache.get(STORAGE_KEY);

            if (!dados) {

                dados = storage.get(STORAGE_KEY);

            }

            if (!dados?.token) {

                dispatch({

                    type: ACTIONS.INITIALIZE,

                    payload: {}

                });

                return;

            }

            api.defaults.headers.Authorization =

                `Bearer ${dados.token}`;

            dispatch({

                type: ACTIONS.INITIALIZE,

                payload: dados

            });

            logger.info(

                "Auth inicializado."

            );

            eventBus.emit(

                "auth:initialized",

                dados

            );

        }

        catch (error) {

            logger.error(error);

            clearPersist();

            dispatch({

                type: ACTIONS.LOGOUT

            });

        }

    }, [

        clearPersist,

        persist

    ]);

    /* ======================================================
     * Login
     * ====================================================== */

    const login = useCallback(

        async (

            usuario,

            senha

        ) => {

            dispatch({

                type:

                    ACTIONS.LOGIN_START

            });

            try {

                const { data } = await api.post(

                    "/auth/login",

                    {

                        usuario,

                        senha

                    }

                );

                const auth = {

                    token:

                        data.token,

                    refreshToken:

                        data.refreshToken,

                    usuario:

                        data.usuario,

                    permissoes:

                        data.permissoes ||

                        []

                };

                api.defaults.headers.Authorization =

                    `Bearer ${auth.token}`;

                persist(auth);

                dispatch({

                    type:

                        ACTIONS.LOGIN_SUCCESS,

                    payload: auth

                });

                logger.info(

                    "Login realizado."

                );

                eventBus.emit(

                    "auth:login",

                    auth.usuario

                );

                return auth;

            }

            catch (error) {

                logger.error(error);

                dispatch({

                    type:

                        ACTIONS.LOGIN_ERROR,

                    payload:

                        error?.response?.data?.message ||

                        error.message

                });

                throw error;

            }

        },

        [persist]

    );

    /* ======================================================
     * Logout
     * ====================================================== */

    const logout = useCallback(() => {

        clearPersist();

        delete api.defaults.headers.Authorization;

        dispatch({

            type: ACTIONS.LOGOUT

        });

        logger.info(

            "Logout realizado."

        );

        eventBus.emit(

            "auth:logout"

        );

    }, [

        clearPersist

    ]);

        /* ======================================================
     * Atualizar Usuário
     * ====================================================== */

    const refreshUser = useCallback(async () => {

        try {

            const { data } = await api.get("/auth/me");

            persist({

                ...state,

                usuario: data

            });

            dispatch({

                type: ACTIONS.UPDATE_USER,

                payload: data

            });

            eventBus.emit(

                "auth:userUpdated",

                data

            );

            return data;

        }

        catch (error) {

            logger.error(error);

            throw error;

        }

    }, [

        state,

        persist

    ]);

    /* ======================================================
     * Atualizar Perfil
     * ====================================================== */

    const updateProfile = useCallback(

        async (dados) => {

            try {

                const { data } = await api.put(

                    "/usuarios/perfil",

                    dados

                );

                persist({

                    ...state,

                    usuario: data

                });

                dispatch({

                    type: ACTIONS.UPDATE_USER,

                    payload: data

                });

                logger.info(

                    "Perfil atualizado."

                );

                eventBus.emit(

                    "auth:profileUpdated",

                    data

                );

                return data;

            }

            catch (error) {

                logger.error(error);

                throw error;

            }

        },

        [

            state,

            persist

        ]

    );

    /* ======================================================
     * Alterar Senha
     * ====================================================== */

    const changePassword = useCallback(

        async (

            senhaAtual,

            novaSenha

        ) => {

            try {

                await api.post(

                    "/auth/change-password",

                    {

                        senhaAtual,

                        novaSenha

                    }

                );

                logger.info(

                    "Senha alterada."

                );

                eventBus.emit(

                    "auth:passwordChanged"

                );

            }

            catch (error) {

                logger.error(error);

                throw error;

            }

        },

        []

    );

    /* ======================================================
     * Renovar Sessão
     * ====================================================== */

    const refreshSession = useCallback(

        async () => {

            if (!state.refreshToken) {

                return false;

            }

            try {

                const { data } = await api.post(

                    "/auth/refresh",

                    {

                        refreshToken:

                            state.refreshToken

                    }

                );

                const auth = {

                    ...state,

                    token:

                        data.token,

                    refreshToken:

                        data.refreshToken

                };

                api.defaults.headers.Authorization =

                    `Bearer ${auth.token}`;

                persist(auth);

                dispatch({

                    type:

                        ACTIONS.LOGIN_SUCCESS,

                    payload: auth

                });

                logger.info(

                    "Token renovado."

                );

                eventBus.emit(

                    "auth:refresh"

                );

                return true;

            }

            catch (error) {

                logger.error(error);

                logout();

                return false;

            }

        },

        [

            state,

            persist,

            logout

        ]

    );

    /* ======================================================
     * Permissões
     * ====================================================== */

    const hasPermission = useCallback(

        (permission) => {

            return state.permissoes.includes(

                permission

            );

        },

        [

            state.permissoes

        ]

    );

    const hasRole = useCallback(

        (role) => {

            return (

                state.usuario?.role ===

                role

            );

        },

        [

            state.usuario

        ]

    );

    const isAdmin = useMemo(

        () =>

            state.usuario?.role ===

            "ADMIN",

        [

            state.usuario

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
     * Helpers
     * ====================================================== */

    const buildAuthData = useCallback((overrides = {}) => ({

        token: overrides.token ?? state.token,

        refreshToken:
            overrides.refreshToken ??
            state.refreshToken,

        usuario:
            overrides.usuario ??
            state.usuario,

        permissoes:
            overrides.permissoes ??
            state.permissoes

    }), [

        state.token,

        state.refreshToken,

        state.usuario,

        state.permissoes

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
     * Renovação automática
     * ====================================================== */

    useEffect(() => {

        if (

            !state.authenticated ||

            !state.refreshToken

        ) {

            return;

        }

        const interval = setInterval(() => {

            refreshSession();

        }, 1000 * 60 * 10);

        return () => clearInterval(interval);

    }, [

        state.authenticated,

        state.refreshToken,

        refreshSession

    ]);

    /* ======================================================
     * Atualização automática do usuário
     * ====================================================== */

    useEffect(() => {

        if (!state.authenticated) {

            return;

        }

        const interval = setInterval(() => {

            refreshUser();

        }, 1000 * 60 * 5);

        return () => clearInterval(interval);

    }, [

        state.authenticated,

        refreshUser

    ]);

    /* ======================================================
     * Context Value
     * ====================================================== */

    const value = useMemo(() => ({

        initialized:

            state.initialized,

        loading:

            state.loading,

        authenticated:

            state.authenticated,

        token:

            state.token,

        refreshToken:

            state.refreshToken,

        usuario:

            state.usuario,

        permissoes:

            state.permissoes,

        error:

            state.error,

        login,

        logout,

        refreshSession,

        refreshUser,

        updateProfile,

        changePassword,

        clearError,

        hasPermission,

        hasRole,

        isAdmin,

        buildAuthData

    }), [

        state,

        login,

        logout,

        refreshSession,

        refreshUser,

        updateProfile,

        changePassword,

        clearError,

        hasPermission,

        hasRole,

        isAdmin,

        buildAuthData

    ]);

    return (

        <AuthContext.Provider

            value={value}

        >

            {children}

        </AuthContext.Provider>

    );

}

/* ======================================================
 * Correção do refreshUser()
 * ====================================================== */

// Dentro do refreshUser(), substitua:
//
// persist({
//     ...state,
//     usuario: data
// });
//
// por:

persist(

    buildAuthData({

        usuario: data

    })

);

/* ======================================================
 * Correção do updateProfile()
 * ====================================================== */

// Dentro do updateProfile(), substitua:
//
// persist({
//     ...state,
//     usuario: data
// });
//
// por:

persist(

    buildAuthData({

        usuario: data

    })

);

/* ======================================================
 * Hook
 * ====================================================== */

export function useAuth() {

    const context = useContext(

        AuthContext

    );

    if (!context) {

        throw new Error(

            "useAuth deve ser utilizado dentro de AuthProvider."

        );

    }

    return context;

}

/* ======================================================
 * Export
 * ====================================================== */

export default AuthProvider;