import { UsuarioProvider as Provider } from "../contexts/UsuarioContext";

export default function UsuarioProvider({ children }) {

    return (

        <Provider>

            {children}

        </Provider>

    );

}