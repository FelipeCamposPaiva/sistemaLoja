import { OSProvider as Provider } from "../contexts/OSContext";

export default function OSProvider({ children }) {

    return (

        <Provider>

            {children}

        </Provider>

    );

}