import {

    createContext,

    useContext,

    useState

} from "react";

const UsuarioContext = createContext({});

export function UsuarioProvider({

    children

}) {

    const [

        usuario,

        setUsuario

    ] = useState(null);

    function atualizarUsuario(dados) {

        setUsuario(

            anterior => ({

                ...anterior,

                ...dados

            })

        );

    }

    function limparUsuario() {

        setUsuario(null);

    }

    const value = {

        usuario,

        setUsuario,

        atualizarUsuario,

        limparUsuario

    };

    return (

        <UsuarioContext.Provider

            value={value}

        >

            {children}

        </UsuarioContext.Provider>

    );

}

export function useUsuario() {

    return useContext(

        UsuarioContext

    );

}