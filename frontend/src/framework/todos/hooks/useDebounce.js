import {
    useEffect,
    useState
} from "react";

/*
|--------------------------------------------------------------------------
| useDebounce
|--------------------------------------------------------------------------
|
| Atrasa a atualização de um valor.
| Muito utilizado em pesquisas, filtros e autocomplete.
|
| Exemplo:
|
| const textoDebounce = useDebounce(texto, 500);
|
*/

export default function useDebounce(

    value,

    delay = 500

) {

    /*
    |--------------------------------------------------------------------------
    | Valor Debounce
    |--------------------------------------------------------------------------
    */

    const [

        debouncedValue,

        setDebouncedValue

    ] = useState(value);

    /*
    |--------------------------------------------------------------------------
    | Delay
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const timer = setTimeout(() => {

            setDebouncedValue(

                value

            );

        }, delay);

        return () =>

            clearTimeout(

                timer

            );

    }, [

        value,

        delay

    ]);

    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */

    return debouncedValue;

}