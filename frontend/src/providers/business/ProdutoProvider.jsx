import { ProdutoProvider as Provider } from "../contexts/ProdutoContext";

export default function ProdutoProvider({ children }) {

    return (

        <Provider>

            {children}

        </Provider>

    );

}