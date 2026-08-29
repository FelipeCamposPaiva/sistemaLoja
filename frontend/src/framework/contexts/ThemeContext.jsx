import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import Theme from "../core/theme/theme";

const ThemeContext = createContext({});

export function ThemeProvider({ children }) {

    const [theme, setTheme] = useState("light");

    useEffect(() => {

        const atual = Theme.get();

        setTheme(atual);

        document.documentElement.setAttribute(

            "data-theme",

            atual

        );

    }, []);

    function alterarTema(novoTema) {

        Theme.set(novoTema);

        setTheme(novoTema);

        document.documentElement.setAttribute(

            "data-theme",

            novoTema

        );

    }

    function toggleTheme() {

        const novoTema = Theme.toggle();

        setTheme(novoTema);

        document.documentElement.setAttribute(

            "data-theme",

            novoTema

        );

    }

    return (

        <ThemeContext.Provider

            value={{

                theme,

                alterarTema,

                toggleTheme

            }}

        >

            {children}

        </ThemeContext.Provider>

    );

}

export function useTheme() {

    return useContext(ThemeContext);

}