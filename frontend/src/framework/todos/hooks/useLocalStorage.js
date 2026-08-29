import {
    useCallback,
    useEffect,
    useState
} from "react";

/*
|--------------------------------------------------------------------------
| useLocalStorage
|--------------------------------------------------------------------------
|
| Hook para persistência automática no LocalStorage.
|
| Recursos:
| ✔ Persistência automática
| ✔ JSON
| ✔ Reset
| ✔ Remove
| ✔ Atualização entre abas
|
*/

export default function useLocalStorage(

    key,

    initialValue = null

) {

    /*
    |--------------------------------------------------------------------------
    | Recupera valor salvo
    |--------------------------------------------------------------------------
    */

    const getStoredValue = useCallback(() => {

        try {

            const item = localStorage.getItem(key);

            if (item === null) {

                return initialValue;

            }

            return JSON.parse(item);

        }

        catch {

            return initialValue;

        }

    }, [

        key,

        initialValue

    ]);

    /*
    |--------------------------------------------------------------------------
    | State
    |--------------------------------------------------------------------------
    */

    const [

        value,

        setValue

    ] = useState(

        getStoredValue

    );

    /*
    |--------------------------------------------------------------------------
    | Persistência
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        try {

            localStorage.setItem(

                key,

                JSON.stringify(value)

            );

        }

        catch (error) {

            console.error(

                "LocalStorage Error:",

                error

            );

        }

    }, [

        key,

        value

    ]);

    /*
    |--------------------------------------------------------------------------
    | Atualização entre abas
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        function handleStorage(event) {

            if (

                event.key !== key

            ) {

                return;

            }

            try {

                if (

                    event.newValue === null

                ) {

                    setValue(

                        initialValue

                    );

                    return;

                }

                setValue(

                    JSON.parse(

                        event.newValue

                    )

                );

            }

            catch {

                setValue(

                    initialValue

                );

            }

        }

        window.addEventListener(

            "storage",

            handleStorage

        );

        return () =>

            window.removeEventListener(

                "storage",

                handleStorage

            );

    }, [

        key,

        initialValue

    ]);

    /*
    |--------------------------------------------------------------------------
    | Continua Parte 2
    |--------------------------------------------------------------------------
    */

        /*
    |--------------------------------------------------------------------------
    | Atualizar
    |--------------------------------------------------------------------------
    */

    const update = useCallback((novoValor) => {

        setValue(valorAtual => {

            if (typeof novoValor === "function") {

                return novoValor(valorAtual);

            }

            return novoValor;

        });

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Remove somente esta chave
    |--------------------------------------------------------------------------
    */

    const remove = useCallback(() => {

        try {

            localStorage.removeItem(key);

        }

        finally {

            setValue(initialValue);

        }

    }, [

        key,

        initialValue

    ]);

    /*
    |--------------------------------------------------------------------------
    | Reset
    |--------------------------------------------------------------------------
    */

    const reset = useCallback(() => {

        setValue(initialValue);

    }, [

        initialValue

    ]);

    /*
    |--------------------------------------------------------------------------
    | Recarregar do LocalStorage
    |--------------------------------------------------------------------------
    */

    const reload = useCallback(() => {

        setValue(

            getStoredValue()

        );

    }, [

        getStoredValue

    ]);

    /*
    |--------------------------------------------------------------------------
    | Existe?
    |--------------------------------------------------------------------------
    */

    const exists = useCallback(() => {

        return localStorage.getItem(key) !== null;

    }, [

        key

    ]);

    /*
    |--------------------------------------------------------------------------
    | Limpar TODO LocalStorage
    |--------------------------------------------------------------------------
    */

    const clear = useCallback(() => {

        localStorage.clear();

        setValue(initialValue);

    }, [

        initialValue

    ]);

    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */

    return {

        value,

        setValue: update,

        update,

        remove,

        reset,

        reload,

        clear,

        exists

    };

}