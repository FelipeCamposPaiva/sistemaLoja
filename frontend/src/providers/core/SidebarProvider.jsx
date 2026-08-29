import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer
} from "react";

import storage from "../core/storage/storage";
import eventBus from "../core/events/eventBus";
import logger from "../core/logger/logger";

/* ==========================================================
 * Constantes
 * ========================================================== */

const STORAGE_KEY = "sidebar";

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 72;

const initialState = {

    initialized: false,

    collapsed: false,

    mobileOpen: false,

    hoverExpanded: false,

    pinned: true,

    width: SIDEBAR_WIDTH,

    activeGroup: null,

    favorites: [],

    recentMenus: []

};

/* ==========================================================
 * Actions
 * ========================================================== */

const ACTIONS = {

    INITIALIZE: "INITIALIZE",

    TOGGLE: "TOGGLE",

    COLLAPSE: "COLLAPSE",

    EXPAND: "EXPAND",

    OPEN_MOBILE: "OPEN_MOBILE",

    CLOSE_MOBILE: "CLOSE_MOBILE",

    TOGGLE_MOBILE: "TOGGLE_MOBILE",

    SET_WIDTH: "SET_WIDTH",

    PIN: "PIN",

    UNPIN: "UNPIN",

    SET_ACTIVE_GROUP: "SET_ACTIVE_GROUP",

    ADD_FAVORITE: "ADD_FAVORITE",

    REMOVE_FAVORITE: "REMOVE_FAVORITE",

    ADD_RECENT: "ADD_RECENT",

    CLEAR_RECENT: "CLEAR_RECENT",

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

        case ACTIONS.TOGGLE:

            return {

                ...state,

                collapsed: !state.collapsed,

                width: state.collapsed

                    ? SIDEBAR_WIDTH

                    : SIDEBAR_COLLAPSED_WIDTH

            };

        case ACTIONS.COLLAPSE:

            return {

                ...state,

                collapsed: true,

                width: SIDEBAR_COLLAPSED_WIDTH

            };

        case ACTIONS.EXPAND:

            return {

                ...state,

                collapsed: false,

                width: SIDEBAR_WIDTH

            };

        case ACTIONS.OPEN_MOBILE:

            return {

                ...state,

                mobileOpen: true

            };

        case ACTIONS.CLOSE_MOBILE:

            return {

                ...state,

                mobileOpen: false

            };

        case ACTIONS.TOGGLE_MOBILE:

            return {

                ...state,

                mobileOpen: !state.mobileOpen

            };

        case ACTIONS.SET_WIDTH:

            return {

                ...state,

                width: action.payload

            };

        case ACTIONS.PIN:

            return {

                ...state,

                pinned: true

            };

        case ACTIONS.UNPIN:

            return {

                ...state,

                pinned: false

            };

        case ACTIONS.SET_ACTIVE_GROUP:

            return {

                ...state,

                activeGroup: action.payload

            };

        case ACTIONS.ADD_FAVORITE:

            return {

                ...state,

                favorites: [

                    ...state.favorites,

                    action.payload

                ]

            };

        case ACTIONS.REMOVE_FAVORITE:

            return {

                ...state,

                favorites: state.favorites.filter(

                    item => item !== action.payload

                )

            };

        case ACTIONS.ADD_RECENT:

            return {

                ...state,

                recentMenus: [

                    action.payload,

                    ...state.recentMenus.filter(

                        item => item !== action.payload

                    )

                ].slice(0, 15)

            };

        case ACTIONS.CLEAR_RECENT:

            return {

                ...state,

                recentMenus: []

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

const SidebarContext = createContext(null);

/* ==========================================================
 * Provider
 * ========================================================== */

export function SidebarProvider({ children }) {

    const [state, dispatch] = useReducer(
        reducer,
        initialState
    );

    /* ======================================================
     * Persistência
     * ====================================================== */

    const persist = useCallback((sidebar) => {

        storage.set(STORAGE_KEY, {

            collapsed: sidebar.collapsed,

            pinned: sidebar.pinned,

            width: sidebar.width,

            favorites: sidebar.favorites,

            recentMenus: sidebar.recentMenus,

            activeGroup: sidebar.activeGroup

        });

    }, []);

    /* ======================================================
     * Inicialização
     * ====================================================== */

    const initialize = useCallback(() => {

        try {

            const saved = storage.get(
                STORAGE_KEY,
                {}
            );

            dispatch({

                type: ACTIONS.INITIALIZE,

                payload: {

                    ...initialState,

                    ...saved

                }

            });

            logger.info(
                "Sidebar inicializada."
            );

            eventBus.emit(
                "sidebar:initialized",
                saved
            );

        }

        catch (error) {

            logger.error(error);

        }

    }, []);

    /* ======================================================
     * Toggle Sidebar
     * ====================================================== */

    const toggleSidebar = useCallback(() => {

        dispatch({

            type: ACTIONS.TOGGLE

        });

    }, []);

    /* ======================================================
     * Collapse
     * ====================================================== */

    const collapse = useCallback(() => {

        dispatch({

            type: ACTIONS.COLLAPSE

        });

    }, []);

    /* ======================================================
     * Expand
     * ====================================================== */

    const expand = useCallback(() => {

        dispatch({

            type: ACTIONS.EXPAND

        });

    }, []);

    /* ======================================================
     * Mobile
     * ====================================================== */

    const openMobile = useCallback(() => {

        dispatch({

            type: ACTIONS.OPEN_MOBILE

        });

    }, []);

    const closeMobile = useCallback(() => {

        dispatch({

            type: ACTIONS.CLOSE_MOBILE

        });

    }, []);

    const toggleMobile = useCallback(() => {

        dispatch({

            type: ACTIONS.TOGGLE_MOBILE

        });

    }, []);

    /* ======================================================
     * Width
     * ====================================================== */

    const setWidth = useCallback((width) => {

        dispatch({

            type: ACTIONS.SET_WIDTH,

            payload: width

        });

    }, []);

    /* ======================================================
     * Pin
     * ====================================================== */

    const pin = useCallback(() => {

        dispatch({

            type: ACTIONS.PIN

        });

    }, []);

    const unpin = useCallback(() => {

        dispatch({

            type: ACTIONS.UNPIN

        });

    }, []);

        /* ======================================================
     * Grupo Ativo
     * ====================================================== */

    const setActiveGroup = useCallback((group) => {

        dispatch({

            type: ACTIONS.SET_ACTIVE_GROUP,

            payload: group

        });

    }, []);

    /* ======================================================
     * Favoritos
     * ====================================================== */

    const addFavorite = useCallback((menu) => {

        if (state.favorites.includes(menu)) {

            return;

        }

        dispatch({

            type: ACTIONS.ADD_FAVORITE,

            payload: menu

        });

    }, [

        state.favorites

    ]);

    const removeFavorite = useCallback((menu) => {

        dispatch({

            type: ACTIONS.REMOVE_FAVORITE,

            payload: menu

        });

    }, []);

    /* ======================================================
     * Menus Recentes
     * ====================================================== */

    const addRecent = useCallback((menu) => {

        dispatch({

            type: ACTIONS.ADD_RECENT,

            payload: menu

        });

    }, []);

    const clearRecent = useCallback(() => {

        dispatch({

            type: ACTIONS.CLEAR_RECENT

        });

    }, []);

    /* ======================================================
     * Reset
     * ====================================================== */

    const resetSidebar = useCallback(() => {

        storage.remove(STORAGE_KEY);

        dispatch({

            type: ACTIONS.RESET

        });

        logger.info(

            "Sidebar restaurada."

        );

        eventBus.emit(

            "sidebar:reset"

        );

    }, []);

    /* ======================================================
     * Persistência Automática
     * ====================================================== */

    useEffect(() => {

        if (!state.initialized) {

            return;

        }

        persist(state);

    }, [

        state,

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

            "sidebar:changed",

            state

        );

    }, [

        state

    ]);

    /* ======================================================
     * Responsividade
     * ====================================================== */

    useEffect(() => {

        if (typeof window === "undefined") {

            return;

        }

        const handleResize = () => {

            if (window.innerWidth <= 992) {

                dispatch({

                    type: ACTIONS.CLOSE_MOBILE

                });

            }

        };

        window.addEventListener(

            "resize",

            handleResize

        );

        handleResize();

        return () => {

            window.removeEventListener(

                "resize",

                handleResize

            );

        };

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

        collapsed: state.collapsed,

        mobileOpen: state.mobileOpen,

        hoverExpanded: state.hoverExpanded,

        pinned: state.pinned,

        width: state.width,

        activeGroup: state.activeGroup,

        favorites: state.favorites,

        recentMenus: state.recentMenus,

        /* Ações */

        initialize,

        toggleSidebar,

        collapse,

        expand,

        openMobile,

        closeMobile,

        toggleMobile,

        setWidth,

        pin,

        unpin,

        setActiveGroup,

        addFavorite,

        removeFavorite,

        addRecent,

        clearRecent,

        resetSidebar

    }), [

        state,

        initialize,

        toggleSidebar,

        collapse,

        expand,

        openMobile,

        closeMobile,

        toggleMobile,

        setWidth,

        pin,

        unpin,

        setActiveGroup,

        addFavorite,

        removeFavorite,

        addRecent,

        clearRecent,

        resetSidebar

    ]);

    /* ======================================================
     * Render
     * ====================================================== */

    return (

        <SidebarContext.Provider value={value}>

            {children}

        </SidebarContext.Provider>

    );

}

/* ==========================================================
 * Hook
 * ========================================================== */

export function useSidebar() {

    const context = useContext(

        SidebarContext

    );

    if (!context) {

        throw new Error(

            "useSidebar deve ser utilizado dentro do SidebarProvider."

        );

    }

    return context;

}

/* ==========================================================
 * Exportações
 * ========================================================== */

export {

    SidebarContext

};

export default SidebarProvider;