import { EstoqueProvider as Provider } from "../contexts/EstoqueContext";

export default function EstoqueProvider({ children }) {

    return (

        <Provider>

            {children}

        </Provider>

    );

}