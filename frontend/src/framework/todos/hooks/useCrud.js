import { useEffect, useState } from "react";
import marcaService from "../services/marca.service";

export default function useMarcas() {

    const [marcas, setMarcas] = useState([]);

    const [loading, setLoading] = useState(true);

    async function carregar() {

        try {

            const dados = await marcaService.listar();

            setMarcas(dados);

        }

        catch (e) {

            console.error(e);

        }

        finally {

            setLoading(false);

        }

    }

    async function salvar(marca) {

        const nova = await marcaService.salvar(marca);

        setMarcas(lista => [...lista, nova]);

    }

    async function atualizar(id, dados) {

        const atualizada = await marcaService.atualizar(id, dados);

        setMarcas(lista =>

            lista.map(item =>

                item.id === id

                    ? atualizada

                    : item

            )

        );

    }

    async function excluir(id) {

        await marcaService.excluir(id);

        setMarcas(lista =>

            lista.filter(item => item.id !== id)

        );

    }

    useEffect(() => {

        carregar();

    }, []);

    return {

        marcas,

        loading,

        atualizarLista: carregar,

        salvar,

        atualizar,

        excluir

    };

}