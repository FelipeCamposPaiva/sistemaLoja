import { AgendaProvider as Provider } from "../contexts/AgendaContext";

export default function AgendaProvider({ children }) {

    return (

        <Provider>

            {children}

        </Provider>

    );

}