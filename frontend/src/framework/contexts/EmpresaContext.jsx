import {

    createContext,

    useContext,

    useEffect,

    useState

} from "react";

import storage from "../core/storage/storage";

const EmpresaContext = createContext({});

const STORAGE_KEY = "empresa";

export function EmpresaProvider({

    children

}) {

    const [

        empresa,

        setEmpresa

    ] = useState(null);

    useEffect(() => {

        const dados = storage.get(

            STORAGE_KEY

        );

        if (dados) {

            setEmpresa(dados);

        }

    }, []);

    function alterarEmpresa(

        dados

    ) {

        setEmpresa(dados);

        storage.set(

            STORAGE_KEY,

            dados

        );

    }

    function limparEmpresa() {

        setEmpresa(null);

        storage.remove(

            STORAGE_KEY

        );

    }

    return (

        <EmpresaContext.Provider

            value={{

                empresa,

                alterarEmpresa,

                limparEmpresa

            }}

        >

            {children}

        </EmpresaContext.Provider>

    );

}

export function useEmpresa() {

    return useContext(

        EmpresaContext

    );

}