import { PermissaoProvider as Provider } from "../contexts/PermissaoContext";

export default function PermissaoProvider({ children }) {

    return (

        <Provider>

            {children}

        </Provider>

    );

}