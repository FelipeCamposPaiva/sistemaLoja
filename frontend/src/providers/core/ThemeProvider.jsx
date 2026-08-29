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

const STORAGE_KEY = "theme";

const initialState = {

    initialized: false,

    mode: "light", // light | dark | system

    resolvedMode: "light",

    accent: "#2563eb",

    radius: 8,

    fontSize: 14,

    compact: false,

    animations: true

};

/* ==========================================================
 * Actions
 * ========================================================== */

const ACTIONS = {

    INITIALIZE: "INITIALIZE",

    SET_MODE: "SET_MODE",

    SET_ACCENT: "SET_ACCENT",

    SET_RADIUS: "SET_RADIUS",

    SET_FONT_SIZE: "SET_FONT_SIZE",

    SET_COMPACT: "SET_COMPACT",

    SET_ANIMATIONS: "SET_ANIMATIONS",

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

        case ACTIONS.SET_MODE:

            return {

                ...state,

                mode: action.payload.mode,

                resolvedMode:

                    action.payload.resolvedMode

            };

        case ACTIONS.SET_ACCENT:

            return {

                ...state,

                accent: action.payload

            };

        case ACTIONS.SET_RADIUS:

            return {

                ...state,

                radius: action.payload

            };

        case ACTIONS.SET_FONT_SIZE:

            return {

                ...state,

                fontSize: action.payload

            };

        case ACTIONS.SET_COMPACT:

            return {

                ...state,

                compact: action.payload

            };

        case ACTIONS.SET_ANIMATIONS:

            return {

                ...state,

                animations: action.payload

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

const ThemeContext = createContext(null);

/* ==========================================================
 * Helpers
 * ========================================================== */

function getSystemTheme() {

    if (typeof window === "undefined") {

        return "light";

    }

    return window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).matches

        ? "dark"

        : "light";

}

function resolveTheme(mode) {

    if (mode === "system") {

        return getSystemTheme();

    }

    return mode;

}

/* ==========================================================
 * Provider
 * ========================================================== */

export function ThemeProvider({ children }) {

    const [state, dispatch] = useReducer(
        reducer,
        initialState
    );

    /* ======================================================
     * Persistência
     * ====================================================== */

    const persist = useCallback((theme) => {

        storage.set(STORAGE_KEY, theme);

    }, []);

    /* ======================================================
     * CSS Variables
     * ====================================================== */

    const applyTheme = useCallback((theme) => {

        if (typeof document === "undefined") {

            return;

        }

        const root = document.documentElement;

        root.setAttribute(
            "data-theme",
            theme.resolvedMode
        );

        root.style.setProperty(
            "--color-accent",
            theme.accent
        );

        root.style.setProperty(
            "--radius",
            `${theme.radius}px`
        );

        root.style.setProperty(
            "--font-size-base",
            `${theme.fontSize}px`
        );

        root.style.setProperty(
            "--layout-density",
            theme.compact ? "compact" : "default"
        );

        root.classList.toggle(
            "theme-dark",
            theme.resolvedMode === "dark"
        );

        root.classList.toggle(
            "theme-light",
            theme.resolvedMode === "light"
        );

        root.classList.toggle(
            "compact-mode",
            theme.compact
        );

        root.classList.toggle(
            "animations-disabled",
            !theme.animations
        );

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

            const theme = {

                ...initialState,

                ...saved

            };

            theme.resolvedMode = resolveTheme(
                theme.mode
            );

            applyTheme(theme);

            dispatch({

                type: ACTIONS.INITIALIZE,

                payload: theme

            });

            logger.info(
                "Tema inicializado."
            );

            eventBus.emit(
                "theme:initialized",
                theme
            );

        }

        catch (error) {

            logger.error(error);

        }

    }, [

        applyTheme

    ]);

    /* ======================================================
     * Alterar Tema
     * ====================================================== */

    const setMode = useCallback((mode) => {

        const resolvedMode = resolveTheme(mode);

        const theme = {

            ...state,

            mode,

            resolvedMode

        };

        persist(theme);

        applyTheme(theme);

        dispatch({

            type: ACTIONS.SET_MODE,

            payload: {

                mode,

                resolvedMode

            }

        });

        logger.info(
            "Tema alterado."
        );

        eventBus.emit(
            "theme:mode",
            mode
        );

    }, [

        state,
        persist,
        applyTheme

    ]);

    /* ======================================================
     * Accent
     * ====================================================== */

    const setAccent = useCallback((accent) => {

        const theme = {

            ...state,

            accent

        };

        persist(theme);

        applyTheme(theme);

        dispatch({

            type: ACTIONS.SET_ACCENT,

            payload: accent

        });

    }, [

        state,
        persist,
        applyTheme

    ]);

    /* ======================================================
     * Radius
     * ====================================================== */

    const setRadius = useCallback((radius) => {

        const theme = {

            ...state,

            radius

        };

        persist(theme);

        applyTheme(theme);

        dispatch({

            type: ACTIONS.SET_RADIUS,

            payload: radius

        });

    }, [

        state,
        persist,
        applyTheme

    ]);

    /* ======================================================
     * Font Size
     * ====================================================== */

    const setFontSize = useCallback((fontSize) => {

        const theme = {

            ...state,

            fontSize

        };

        persist(theme);

        applyTheme(theme);

        dispatch({

            type: ACTIONS.SET_FONT_SIZE,

            payload: fontSize

        });

    }, [

        state,
        persist,
        applyTheme

    ]);

        /* ======================================================
     * Compact Mode
     * ====================================================== */

    const setCompact = useCallback((compact) => {

        const theme = {

            ...state,

            compact

        };

        persist(theme);

        applyTheme(theme);

        dispatch({

            type: ACTIONS.SET_COMPACT,

            payload: compact

        });

    }, [

        state,
        persist,
        applyTheme

    ]);

    /* ======================================================
     * Animations
     * ====================================================== */

    const setAnimations = useCallback((animations) => {

        const theme = {

            ...state,

            animations

        };

        persist(theme);

        applyTheme(theme);

        dispatch({

            type: ACTIONS.SET_ANIMATIONS,

            payload: animations

        });

    }, [

        state,
        persist,
        applyTheme

    ]);

    /* ======================================================
     * Reset
     * ====================================================== */

    const resetTheme = useCallback(() => {

        storage.remove(STORAGE_KEY);

        const theme = {

            ...initialState,

            resolvedMode: resolveTheme(

                initialState.mode

            )

        };

        applyTheme(theme);

        dispatch({

            type: ACTIONS.RESET

        });

        logger.info(

            "Tema restaurado."

        );

        eventBus.emit(

            "theme:reset"

        );

    }, [

        applyTheme

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
     * Tema do Sistema
     * ====================================================== */

    useEffect(() => {

        if (

            state.mode !== "system" ||

            typeof window === "undefined"

        ) {

            return;

        }

        const media = window.matchMedia(

            "(prefers-color-scheme: dark)"

        );

        const handleChange = () => {

            setMode("system");

        };

        if (media.addEventListener) {

            media.addEventListener(

                "change",

                handleChange

            );

        } else {

            media.addListener(

                handleChange

            );

        }

        return () => {

            if (media.removeEventListener) {

                media.removeEventListener(

                    "change",

                    handleChange

                );

            } else {

                media.removeListener(

                    handleChange

                );

            }

        };

    }, [

        state.mode,

        setMode

    ]);

    /* ======================================================
     * Context Value
     * ====================================================== */

    const value = useMemo(() => ({

        initialized:

            state.initialized,

        mode:

            state.mode,

        resolvedMode:

            state.resolvedMode,

        accent:

            state.accent,

        radius:

            state.radius,

        fontSize:

            state.fontSize,

        compact:

            state.compact,

        animations:

            state.animations,

        setMode,

        setAccent,

        setRadius,

        setFontSize,

        setCompact,

        setAnimations,

        resetTheme

    }), [

        state,

        setMode,

        setAccent,

        setRadius,

        setFontSize,

        setCompact,

        setAnimations,

        resetTheme

    ]);

    return (

        <ThemeContext.Provider

            value={value}

        >

            {children}

        </ThemeContext.Provider>

    );

}

/* ==========================================================
 * Hook
 * ========================================================== */

export function useTheme() {

    const context = useContext(

        ThemeContext

    );

    if (!context) {

        throw new Error(

            "useTheme deve ser utilizado dentro de ThemeProvider."

        );

    }

    return context;

}

/* ==========================================================
 * Exportações
 * ========================================================== */

export default ThemeProvider;