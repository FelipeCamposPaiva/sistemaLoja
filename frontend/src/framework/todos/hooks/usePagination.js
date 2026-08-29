import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

/*
|--------------------------------------------------------------------------
| usePagination
|--------------------------------------------------------------------------
|
| Hook genérico para paginação.
|
| Recursos:
| ✔ Paginação
| ✔ Ordenação
| ✔ Busca
| ✔ Quantidade por página
| ✔ Navegação
| ✔ React 19
|
*/

export default function usePagination(

    data = [],

    initialPage = 1,

    initialLimit = 10

) {

    /*
    |--------------------------------------------------------------------------
    | Estados
    |--------------------------------------------------------------------------
    */

    const [page, setPage] = useState(initialPage);

    const [limit, setLimit] = useState(initialLimit);

    /*
    |--------------------------------------------------------------------------
    | Total
    |--------------------------------------------------------------------------
    */

    const totalItems = data.length;

    const totalPages = Math.max(

        1,

        Math.ceil(

            totalItems / limit

        )

    );

    /*
    |--------------------------------------------------------------------------
    | Ajusta página
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (page > totalPages) {

            setPage(totalPages);

        }

    }, [

        page,

        totalPages

    ]);

    /*
    |--------------------------------------------------------------------------
    | Dados paginados
    |--------------------------------------------------------------------------
    */

    const items = useMemo(() => {

        const inicio =

            (page - 1) * limit;

        const fim =

            inicio + limit;

        return data.slice(

            inicio,

            fim

        );

    }, [

        data,

        page,

        limit

    ]);

    /*
    |--------------------------------------------------------------------------
    | Navegação
    |--------------------------------------------------------------------------
    */

    const next = useCallback(() => {

        setPage(valor =>

            Math.min(

                valor + 1,

                totalPages

            )

        );

    }, [

        totalPages

    ]);

    const previous = useCallback(() => {

        setPage(valor =>

            Math.max(

                valor - 1,

                1

            )

        );

    }, []);

    const first = useCallback(() => {

        setPage(1);

    }, []);

    const last = useCallback(() => {

        setPage(totalPages);

    }, [

        totalPages

    ]);

    const goTo = useCallback((pagina) => {

        if (

            pagina < 1 ||

            pagina > totalPages

        ) {

            return;

        }

        setPage(pagina);

    }, [

        totalPages

    ]);

    /*
    |--------------------------------------------------------------------------
    | Alterar limite
    |--------------------------------------------------------------------------
    */

    const changeLimit = useCallback((novoLimite) => {

        setLimit(novoLimite);

        setPage(1);

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    const hasNext =

        page < totalPages;

    const hasPrevious =

        page > 1;

    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */

    return {

        page,

        limit,

        totalItems,

        totalPages,

        items,

        hasNext,

        hasPrevious,

        next,

        previous,

        first,

        last,

        goTo,

        changeLimit,

        setPage,

        setLimit

    };

}