import {
    useCallback,
    useState
} from "react";

/*
|--------------------------------------------------------------------------
| useKanban
|--------------------------------------------------------------------------
*/

export default function useKanban(initialColumns = {}) {

    const [

        columns,

        setColumns

    ] = useState(initialColumns);

    const moveCard = useCallback((

        source,

        destination,

        card

    ) => {

        if (

            !destination

        ) {

            return;

        }

        const next = {

            ...columns

        };

        next[source] =

            next[source].filter(

                item =>

                    item.id !== card.id

            );

        next[destination] = [

            ...next[destination],

            card

        ];

        setColumns(next);

    }, [

        columns

    ]);

    const updateColumns = useCallback((novasColunas) => {

        setColumns(novasColunas);

    }, []);

    return {

        columns,

        moveCard,

        updateColumns,

        setColumns

    };

}