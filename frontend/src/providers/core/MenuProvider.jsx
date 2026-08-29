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
import cache from "../core/cache/cache";

/* ==========================================================
 * Constantes
 * ========================================================== */

const STORAGE_KEY = "menu";

const initialState = {

    initialized: false,

    loading: false,

    menus: [],

    menuTree: [],

    flatMenus: [],

    favorites: [],

    recentMenus: [],

    breadcrumbs: [],

    currentMenu: null,

    selectedMenu: null,

    search: "",

    filteredMenus: [],

    expandedMenus: [],

    error: null

};

/* ==========================================================
 * Actions
 * ========================================================== */

const ACTIONS = {

    INITIALIZE: "INITIALIZE",

    SET_LOADING: "SET_LOADING",

    SET_MENUS: "SET_MENUS",

    SET_CURRENT_MENU: "SET_CURRENT_MENU",

    SET_SELECTED_MENU: "SET_SELECTED_MENU",

    SET_SEARCH: "SET_SEARCH",

    SET_FILTERED: "SET_FILTERED",

    SET_BREADCRUMBS: "SET_BREADCRUMBS",

    TOGGLE_EXPANDED: "TOGGLE_EXPANDED",

    EXPAND_ALL: "EXPAND_ALL",

    COLLAPSE_ALL: "COLLAPSE_ALL",

    ADD_FAVORITE: "ADD_FAVORITE",

    REMOVE_FAVORITE: "REMOVE_FAVORITE",

    ADD_RECENT: "ADD_RECENT",

    CLEAR_RECENT: "CLEAR_RECENT",

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

                ...action.payload

            };

        case ACTIONS.SET_LOADING:

            return {

                ...state,

                loading: action.payload

            };

        case ACTIONS.SET_MENUS:

            return {

                ...state,

                menus: action.payload.menus,

                menuTree: action.payload.menuTree,

                flatMenus: action.payload.flatMenus,

                filteredMenus: action.payload.flatMenus

            };

        case ACTIONS.SET_CURRENT_MENU:

            return {

                ...state,

                currentMenu: action.payload

            };

        case ACTIONS.SET_SELECTED_MENU:

            return {

                ...state,

                selectedMenu: action.payload

            };

        case ACTIONS.SET_SEARCH:

            return {

                ...state,

                search: action.payload

            };

        case ACTIONS.SET_FILTERED:

            return {

                ...state,

                filteredMenus: action.payload

            };

        case ACTIONS.SET_BREADCRUMBS:

            return {

                ...state,

                breadcrumbs: action.payload

            };

        case ACTIONS.TOGGLE_EXPANDED:

            return {

                ...state,

                expandedMenus: state.expandedMenus.includes(action.payload)

                    ? state.expandedMenus.filter(
                        id => id !== action.payload
                    )

                    : [
                        ...state.expandedMenus,
                        action.payload
                    ]

            };

        case ACTIONS.EXPAND_ALL:

            return {

                ...state,

                expandedMenus: action.payload

            };

        case ACTIONS.COLLAPSE_ALL:

            return {

                ...state,

                expandedMenus: []

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

                    item => item.id !== action.payload

                )

            };

        case ACTIONS.ADD_RECENT:

            return {

                ...state,

                recentMenus: [

                    action.payload,

                    ...state.recentMenus.filter(

                        item => item.id !== action.payload.id

                    )

                ].slice(0, 15)

            };

        case ACTIONS.CLEAR_RECENT:

            return {

                ...state,

                recentMenus: []

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

const MenuContext = createContext(null);

/* ==========================================================
 * Provider
 * ========================================================== */

export function MenuProvider({ children }) {

    const [state, dispatch] = useReducer(
        reducer,
        initialState
    );

    /* ======================================================
     * Helpers
     * ====================================================== */

    const flattenMenus = useCallback((menus = []) => {

        const result = [];

        const visit = (items = []) => {

            items.forEach(item => {

                result.push(item);

                if (
                    item.children &&
                    item.children.length
                ) {

                    visit(item.children);

                }

            });

        };

        visit(menus);

        return result;

    }, []);

    const getExpandedIds = useCallback((menus = []) => {

        const ids = [];

        const visit = (items = []) => {

            items.forEach(item => {

                if (
                    item.children &&
                    item.children.length
                ) {

                    ids.push(item.id);

                    visit(item.children);

                }

            });

        };

        visit(menus);

        return ids;

    }, []);

    /* ======================================================
     * Persistência
     * ====================================================== */

    const persist = useCallback((data) => {

        storage.set(STORAGE_KEY, {

            favorites: data.favorites,

            recentMenus: data.recentMenus,

            expandedMenus: data.expandedMenus

        });

    }, []);

    /* ======================================================
     * Carregar Menus
     * ====================================================== */

    const loadMenus = useCallback(async (
        menus = []
    ) => {

        try {

            dispatch({

                type: ACTIONS.SET_LOADING,

                payload: true

            });

            const menuTree = menus;

            const flatMenus = flattenMenus(
                menuTree
            );

            dispatch({

                type: ACTIONS.SET_MENUS,

                payload: {

                    menus,

                    menuTree,

                    flatMenus

                }

            });

            cache.set(

                "menus",

                menuTree

            );

            logger.info(

                "Menus carregados."

            );

            eventBus.emit(

                "menu:loaded",

                menuTree

            );

        }

        catch (error) {

            logger.error(error);

            dispatch({

                type: ACTIONS.SET_ERROR,

                payload: error

            });

        }

        finally {

            dispatch({

                type: ACTIONS.SET_LOADING,

                payload: false

            });

        }

    }, [

        flattenMenus

    ]);

    /* ======================================================
     * Recarregar
     * ====================================================== */

    const reloadMenus = useCallback(async (
        menus = []
    ) => {

        cache.remove("menus");

        await loadMenus(menus);

    }, [

        loadMenus

    ]);

    /* ======================================================
     * Inicialização
     * ====================================================== */

    const initialize = useCallback(async (
        menus = []
    ) => {

        try {

            const saved = storage.get(

                STORAGE_KEY,

                {}

            );

            dispatch({

                type: ACTIONS.INITIALIZE,

                payload: {

                    favorites:

                        saved.favorites || [],

                    recentMenus:

                        saved.recentMenus || [],

                    expandedMenus:

                        saved.expandedMenus || []

                }

            });

            const cachedMenus = cache.get(
                "menus"
            );

            if (

                cachedMenus &&
                cachedMenus.length

            ) {

                await loadMenus(
                    cachedMenus
                );

            }

            else {

                await loadMenus(
                    menus
                );

            }

            logger.info(

                "MenuProvider inicializado."

            );

            eventBus.emit(

                "menu:initialized"

            );

        }

        catch (error) {

            logger.error(error);

        }

    }, [

        loadMenus

    ]);

        /* ======================================================
     * Menu Atual
     * ====================================================== */

    const setCurrentMenu = useCallback((menu) => {

        dispatch({

            type: ACTIONS.SET_CURRENT_MENU,

            payload: menu

        });

        if (menu) {

            eventBus.emit(

                "menu:current",

                menu

            );

        }

    }, []);

    /* ======================================================
     * Menu Selecionado
     * ====================================================== */

    const setSelectedMenu = useCallback((menu) => {

        dispatch({

            type: ACTIONS.SET_SELECTED_MENU,

            payload: menu

        });

    }, []);

    /* ======================================================
     * Pesquisa
     * ====================================================== */

    const searchMenus = useCallback((text) => {

        const search = text.trim().toLowerCase();

        dispatch({

            type: ACTIONS.SET_SEARCH,

            payload: search

        });

        if (!search) {

            dispatch({

                type: ACTIONS.SET_FILTERED,

                payload: state.flatMenus

            });

            return;

        }

        const filtered = state.flatMenus.filter(menu => {

            return (

                menu.label?.toLowerCase().includes(search) ||

                menu.title?.toLowerCase().includes(search) ||

                menu.path?.toLowerCase().includes(search) ||

                menu.key?.toLowerCase().includes(search)

            );

        });

        dispatch({

            type: ACTIONS.SET_FILTERED,

            payload: filtered

        });

    }, [

        state.flatMenus

    ]);

    /* ======================================================
     * Limpar Pesquisa
     * ====================================================== */

    const clearSearch = useCallback(() => {

        dispatch({

            type: ACTIONS.SET_SEARCH,

            payload: ""

        });

        dispatch({

            type: ACTIONS.SET_FILTERED,

            payload: state.flatMenus

        });

    }, [

        state.flatMenus

    ]);

    /* ======================================================
     * Favoritos
     * ====================================================== */

    const addFavorite = useCallback((menu) => {

        if (!menu?.id) {

            return;

        }

        const exists = state.favorites.some(

            item => item.id === menu.id

        );

        if (exists) {

            return;

        }

        dispatch({

            type: ACTIONS.ADD_FAVORITE,

            payload: menu

        });

        eventBus.emit(

            "menu:favorite:add",

            menu

        );

    }, [

        state.favorites

    ]);

    const removeFavorite = useCallback((menuId) => {

        dispatch({

            type: ACTIONS.REMOVE_FAVORITE,

            payload: menuId

        });

        eventBus.emit(

            "menu:favorite:remove",

            menuId

        );

    }, []);

    /* ======================================================
     * Menus Recentes
     * ====================================================== */

    const addRecent = useCallback((menu) => {

        if (!menu?.id) {

            return;

        }

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
     * Expandir / Recolher
     * ====================================================== */

    const toggleExpanded = useCallback((menuId) => {

        dispatch({

            type: ACTIONS.TOGGLE_EXPANDED,

            payload: menuId

        });

    }, []);

    const expandAll = useCallback(() => {

        dispatch({

            type: ACTIONS.EXPAND_ALL,

            payload: getExpandedIds(

                state.menuTree

            )

        });

    }, [

        state.menuTree,

        getExpandedIds

    ]);

    const collapseAll = useCallback(() => {

        dispatch({

            type: ACTIONS.COLLAPSE_ALL

        });

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

        state.favorites,

        state.recentMenus,

        state.expandedMenus,

        state.initialized,

        persist

    ]);

        /* ======================================================
     * Localizar Menu por ID
     * ====================================================== */

    const findMenuById = useCallback((id) => {

        if (!id) {

            return null;

        }

        return state.flatMenus.find(

            menu => menu.id === id

        ) || null;

    }, [

        state.flatMenus

    ]);

    /* ======================================================
     * Localizar Menu por Path
     * ====================================================== */

    const findMenuByPath = useCallback((path) => {

        if (!path) {

            return null;

        }

        return state.flatMenus.find(

            menu => menu.path === path

        ) || null;

    }, [

        state.flatMenus

    ]);

    /* ======================================================
     * Breadcrumbs
     * ====================================================== */

    const buildBreadcrumbs = useCallback((menu) => {

        if (!menu) {

            dispatch({

                type: ACTIONS.SET_BREADCRUMBS,

                payload: []

            });

            return [];

        }

        const breadcrumbs = [];

        let current = menu;

        while (current) {

            breadcrumbs.unshift(current);

            current = current.parentId

                ? findMenuById(current.parentId)

                : null;

        }

        dispatch({

            type: ACTIONS.SET_BREADCRUMBS,

            payload: breadcrumbs

        });

        return breadcrumbs;

    }, [

        findMenuById

    ]);

    /* ======================================================
     * Atualização do Menu Atual
     * ====================================================== */

    useEffect(() => {

        if (!state.currentMenu) {

            dispatch({

                type: ACTIONS.SET_BREADCRUMBS,

                payload: []

            });

            return;

        }

        buildBreadcrumbs(

            state.currentMenu

        );

    }, [

        state.currentMenu,

        buildBreadcrumbs

    ]);

    /* ======================================================
     * Eventos
     * ====================================================== */

    useEffect(() => {

        if (!state.initialized) {

            return;

        }

        eventBus.emit(

            "menu:changed",

            {

                currentMenu: state.currentMenu,

                selectedMenu: state.selectedMenu,

                breadcrumbs: state.breadcrumbs,

                favorites: state.favorites

            }

        );

    }, [

        state.currentMenu,

        state.selectedMenu,

        state.breadcrumbs,

        state.favorites,

        state.initialized

    ]);

    /* ======================================================
     * Limpeza de Erro
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

    const resetMenu = useCallback(() => {

        storage.remove(STORAGE_KEY);

        cache.remove("menus");

        dispatch({

            type: ACTIONS.RESET

        });

        logger.info(

            "MenuProvider restaurado."

        );

        eventBus.emit(

            "menu:reset"

        );

    }, []);

        /* ======================================================
     * Context Value
     * ====================================================== */

    const value = useMemo(() => ({

        /* Estado */

        initialized: state.initialized,

        loading: state.loading,

        menus: state.menus,

        menuTree: state.menuTree,

        flatMenus: state.flatMenus,

        favorites: state.favorites,

        recentMenus: state.recentMenus,

        breadcrumbs: state.breadcrumbs,

        currentMenu: state.currentMenu,

        selectedMenu: state.selectedMenu,

        search: state.search,

        filteredMenus: state.filteredMenus,

        expandedMenus: state.expandedMenus,

        error: state.error,

        /* Métodos */

        initialize,

        loadMenus,

        reloadMenus,

        setCurrentMenu,

        setSelectedMenu,

        searchMenus,

        clearSearch,

        toggleExpanded,

        expandAll,

        collapseAll,

        addFavorite,

        removeFavorite,

        addRecent,

        clearRecent,

        buildBreadcrumbs,

        findMenuById,

        findMenuByPath,

        clearError,

        resetMenu

    }), [

        state,

        initialize,

        loadMenus,

        reloadMenus,

        setCurrentMenu,

        setSelectedMenu,

        searchMenus,

        clearSearch,

        toggleExpanded,

        expandAll,

        collapseAll,

        addFavorite,

        removeFavorite,

        addRecent,

        clearRecent,

        buildBreadcrumbs,

        findMenuById,

        findMenuByPath,

        clearError,

        resetMenu

    ]);

    /* ======================================================
     * Render
     * ====================================================== */

    return (

        <MenuContext.Provider value={value}>

            {children}

        </MenuContext.Provider>

    );

}

/* ==========================================================
 * Hook
 * ========================================================== */

export function useMenu() {

    const context = useContext(

        MenuContext

    );

    if (!context) {

        throw new Error(

            "useMenu deve ser utilizado dentro do MenuProvider."

        );

    }

    return context;

}

/* ==========================================================
 * Exportações
 * ========================================================== */

export {

    MenuContext

};

export default MenuProvider;