import {
    useMemo,
    useState
} from "react";

import useDebounce from "./useDebounce";

/*
|--------------------------------------------------------------------------
| useSearch
|--------------------------------------------------------------------------
|
| Pesquisa genérica.
|
*/

export default function useSearch(

    data = [],

    fields = []

) {

    const [

        search,

        setSearch

    ] = useState("");

    const debouncedSearch =

        useDebounce(

            search,

            300

        );

    const results = useMemo(() => {

        if (

            !debouncedSearch.trim()

        ) {

            return data;

        }

        const texto =

            debouncedSearch.toLowerCase();

        return data.filter(item =>

            fields.some(field =>

                String(

                    item[field] ?? ""

                )

                    .toLowerCase()

                    .includes(texto)

            )

        );

    }, [

        data,

        fields,

        debouncedSearch

    ]);

    const clear = () =>

        setSearch("");

    return {

        search,

        setSearch,

        clear,

        results

    };

}