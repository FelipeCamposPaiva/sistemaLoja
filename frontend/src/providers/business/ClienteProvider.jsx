import { ClienteProvider as Provider } from "../contexts/ClienteContext";

export default function ClienteProvider({ children }) {

    return (

        <Provider>

            {children}

        </Provider>

    );

}