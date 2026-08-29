import { useCallback } from "react";

import { useToast as useToastContext } from "../providers/ToastProvider";

/*
|--------------------------------------------------------------------------
| useToast
|--------------------------------------------------------------------------
|
| Hook para utilização dos Toasts da aplicação.
|
| Compatível com:
| ✔ React Hot Toast
| ✔ ToastProvider
| ✔ React 19
| ✔ Vite
|
*/

export default function useToast() {

    const toast = useToastContext();

    /*
    |--------------------------------------------------------------------------
    | Atalhos
    |--------------------------------------------------------------------------
    */

    const success = useCallback((message, options = {}) => {

        toast.success(message, options);

    }, [toast]);

    const error = useCallback((message, options = {}) => {

        toast.error(message, options);

    }, [toast]);

    const warning = useCallback((message, options = {}) => {

        toast.warning(message, options);

    }, [toast]);

    const info = useCallback((message, options = {}) => {

        toast.info(message, options);

    }, [toast]);

    const loading = useCallback((message) => {

        return toast.loading(message);

    }, [toast]);

    const dismiss = useCallback((id) => {

        toast.dismiss(id);

    }, [toast]);

    const promise = useCallback((promiseObject, messages) => {

        return toast.promise(

            promiseObject,

            messages

        );

    }, [toast]);

    const custom = useCallback((component, options = {}) => {

        return toast.custom(

            component,

            options

        );

    }, [toast]);

    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */

    return {

        success,

        error,

        warning,

        info,

        loading,

        dismiss,

        promise,

        custom

    };

}