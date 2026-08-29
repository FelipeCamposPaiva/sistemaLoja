import { FinanceiroProvider as Provider } from "../contexts/FinanceiroContext";

export default function FinanceiroProvider({ children }) {

    return (

        <Provider>

            {children}

        </Provider>

    );

}