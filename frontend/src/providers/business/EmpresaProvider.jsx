import { EmpresaProvider as Provider } from "../contexts/EmpresaContext";

export default function EmpresaProvider({ children }) {

    return (

        <Provider>

            {children}

        </Provider>

    );

}