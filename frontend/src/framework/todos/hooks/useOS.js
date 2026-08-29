import { useMemo } from "react";

import { useOS as useOSContext } from "../contexts/OSContext";

/*
|--------------------------------------------------------------------------
| useOS
|--------------------------------------------------------------------------
*/

export default function useOS() {

    const {

        ordens,

        loading,

        carregar,

        atualizarStatus

    } = useOSContext();

    function buscarPorId(id) {

        return ordens.find(

            os =>

                os.id === id

        );

    }

    function pesquisar(texto = "") {

        if (!texto.trim()) {

            return ordens;

        }

        const termo = texto.toLowerCase();

        return ordens.filter(os =>

            os.cliente?.toLowerCase().includes(termo)

            ||

            os.numero?.toString().includes(termo)

            ||

            os.descricao?.toLowerCase().includes(termo)

        );

    }

    function porStatus(status) {

        return ordens.filter(

            os =>

                os.status === status

        );

    }

    function abertas() {

        return ordens.filter(

            os =>

                os.status !== "ENTREGUE"

        );

    }

    function entregues() {

        return porStatus(

            "ENTREGUE"

        );

    }

    return useMemo(() => ({

        ordens,

        loading,

        atualizarLista: carregar,

        atualizarStatus,

        buscarPorId,

        pesquisar,

        porStatus,

        abertas,

        entregues

    }), [

        ordens,

        loading,

        carregar,

        atualizarStatus

    ]);

}