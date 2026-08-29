import {

    createContext,

    useContext,

    useState,

    useCallback

} from "react";

const ToastContext = createContext({});

export function ToastProvider({

    children

}) {

    const [

        toasts,

        setToasts

    ] = useState([]);

    const addToast = useCallback(

        (

            message,

            type = "success",

            duration = 3000

        ) => {

            const id = Date.now();

            const toast = {

                id,

                message,

                type

            };

            setToasts(

                atual => [

                    ...atual,

                    toast

                ]

            );

            setTimeout(() => {

                removeToast(id);

            }, duration);

        },

        []

    );

    function removeToast(id) {

        setToasts(

            atual =>

                atual.filter(

                    toast => toast.id !== id

                )

        );

    }

    return (

        <ToastContext.Provider

            value={{

                toasts,

                addToast,

                removeToast

            }}

        >

            {children}

        </ToastContext.Provider>

    );

}

export function useToast() {

    return useContext(

        ToastContext

    );

}