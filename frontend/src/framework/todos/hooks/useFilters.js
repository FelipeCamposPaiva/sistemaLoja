import {
    useCallback,
    useMemo,
    useState
} from "react";

/*
|--------------------------------------------------------------------------
| useFilters
|--------------------------------------------------------------------------
|
| Hook genérico para filtros.
|
| Funciona com qualquer lista.
|
*/

export default function useFilters(

    data = []

) {

    const [

        filters,

        setFilters

    ] = useState({});

    /*
    |--------------------------------------------------------------------------
    | Atualizar filtro
    |--------------------------------------------------------------------------
    */

    const setFilter = useCallback((

        field,

        value

    ) => {

        setFilters(

            atual => ({

                ...atual,

                [field]: value

            })

        );

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Remover filtro
    |--------------------------------------------------------------------------
    */

    const removeFilter = useCallback(field => {

        setFilters(atual => {

            const novo = {

                ...atual

            };

            delete novo[field];

            return novo;

        });

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Limpar
    |--------------------------------------------------------------------------
    */

    const clearFilters = useCallback(() => {

        setFilters({});

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Dados filtrados
    |--------------------------------------------------------------------------
    */

    const filteredData = useMemo(() => {

        return data.filter(item => {

            return Object.entries(filters).every(

                ([campo, valor]) => {

                    if (

                        valor === "" ||

                        valor === null ||

                        valor === undefined

                    ) {

                        return true;

                    }

                    const conteudo = item[campo];

                    if (

                        conteudo === null ||

                        conteudo === undefined

                    ) {

                        return false;

                    }

                    return String(conteudo)

                        .toLowerCase()

                        .includes(

                            String(valor)

                                .toLowerCase()

                        );

                }

            );

        });

    }, [

        data,

        filters

    ]);

    return {

        filters,

        filteredData,

        setFilter,

        removeFilter,

        clearFilters,

        setFilters

    };

}