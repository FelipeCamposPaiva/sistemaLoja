import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback
} from "react";

import agendaService from "../services/agenda.service";

const AgendaContext = createContext({});

export function AgendaProvider({ children }) {

    const [eventos, setEventos] = useState([]);

    const [loading, setLoading] = useState(false);

    const carregarEventos = useCallback(async () => {

        setLoading(true);

        try {

            const dados = await agendaService.listar();

            setEventos(dados);

        }

        catch (e) {

            console.error(e);

        }

        finally {

            setLoading(false);

        }

    }, []);

    useEffect(() => {

        carregarEventos();

    }, [carregarEventos]);

    async function adicionarEvento(evento) {

        const novo = await agendaService.salvar(evento);

        setEventos(anterior => [

            ...anterior,

            novo

        ]);

    }

    async function atualizarEvento(id, dados) {

        const atualizado = await agendaService.atualizar(id, dados);

        setEventos(anterior =>

            anterior.map(item =>

                item.id === id

                    ? atualizado

                    : item

            )

        );

    }

    async function removerEvento(id) {

        await agendaService.excluir(id);

        setEventos(anterior =>

            anterior.filter(

                item => item.id !== id

            )

        );

    }

    return (

        <AgendaContext.Provider

            value={{

                eventos,

                loading,

                carregarEventos,

                adicionarEvento,

                atualizarEvento,

                removerEvento

            }}

        >

            {children}

        </AgendaContext.Provider>

    );

}

export function useAgenda() {

    return useContext(AgendaContext);

}