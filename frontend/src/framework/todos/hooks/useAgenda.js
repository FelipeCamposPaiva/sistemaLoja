import { useMemo } from "react";

import { useAgenda as useAgendaContext } from "../contexts/AgendaContext";

/*
|--------------------------------------------------------------------------
| useAgenda
|--------------------------------------------------------------------------
|
| Hook para gerenciamento da Agenda.
|
| Recursos
| ✔ Eventos
| ✔ CRUD
| ✔ Buscar por ID
| ✔ Eventos do Dia
| ✔ Eventos da Semana
| ✔ Eventos do Mês
| ✔ Pesquisa
| ✔ Atualizar Lista
|
*/

export default function useAgenda() {

    const {

        eventos,

        loading,

        carregarEventos,

        adicionarEvento,

        atualizarEvento,

        removerEvento

    } = useAgendaContext();

    /*
    |--------------------------------------------------------------------------
    | Buscar Evento
    |--------------------------------------------------------------------------
    */

    function buscarPorId(id) {

        return eventos.find(

            evento => evento.id === id

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Pesquisa
    |--------------------------------------------------------------------------
    */

    function pesquisar(texto = "") {

        if (!texto.trim()) {

            return eventos;

        }

        const termo = texto.toLowerCase();

        return eventos.filter(evento =>

            evento.titulo?.toLowerCase().includes(termo)

            ||

            evento.descricao?.toLowerCase().includes(termo)

            ||

            evento.local?.toLowerCase().includes(termo)

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Eventos de Hoje
    |--------------------------------------------------------------------------
    */

    function hoje() {

        const data = new Date().toISOString().slice(0, 10);

        return eventos.filter(evento =>

            evento.data?.startsWith(data)

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Próximos Eventos
    |--------------------------------------------------------------------------
    */

    function proximos(dias = 7) {

        const hoje = new Date();

        const limite = new Date();

        limite.setDate(

            limite.getDate() + dias

        );

        return eventos.filter(evento => {

            const data = new Date(evento.data);

            return (

                data >= hoje &&

                data <= limite

            );

        });

    }

    /*
    |--------------------------------------------------------------------------
    | Ordenados
    |--------------------------------------------------------------------------
    */

    function ordenados() {

        return [...eventos].sort(

            (a, b) =>

                new Date(a.data) -

                new Date(b.data)

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Memo
    |--------------------------------------------------------------------------
    */

    return useMemo(() => ({

        agenda: eventos,

        eventos,

        loading,

        atualizarLista:

            carregarEventos,

        adicionarEvento,

        atualizarEvento,

        removerEvento,

        buscarPorId,

        pesquisar,

        hoje,

        proximos,

        ordenados

    }), [

        eventos,

        loading,

        carregarEventos,

        adicionarEvento,

        atualizarEvento,

        removerEvento

    ]);

}