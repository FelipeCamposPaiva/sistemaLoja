import { useMemo } from "react";

import { useFinanceiro as useFinanceiroContext } from "../contexts/FinanceiroContext";

/*
|--------------------------------------------------------------------------
| useFinanceiro
|--------------------------------------------------------------------------
*/

export default function useFinanceiro() {

    const {

        dados,

        loading,

        carregar

    } = useFinanceiroContext();

    function receitas() {

        return dados.filter(

            item =>

                item.tipo === "RECEITA"

        );

    }

    function despesas() {

        return dados.filter(

            item =>

                item.tipo === "DESPESA"

        );

    }

    function saldo() {

        const totalReceitas = receitas()

            .reduce(

                (t, item) =>

                    t + Number(item.valor || 0),

                0

            );

        const totalDespesas = despesas()

            .reduce(

                (t, item) =>

                    t + Number(item.valor || 0),

                0

            );

        return totalReceitas - totalDespesas;

    }

    function pesquisar(texto = "") {

        if (!texto.trim()) {

            return dados;

        }

        const termo = texto.toLowerCase();

        return dados.filter(item =>

            item.descricao?.toLowerCase().includes(termo)

        );

    }

    return useMemo(() => ({

        financeiro: dados,

        dados,

        loading,

        atualizarLista: carregar,

        receitas,

        despesas,

        saldo,

        pesquisar

    }), [

        dados,

        loading,

        carregar

    ]);

}