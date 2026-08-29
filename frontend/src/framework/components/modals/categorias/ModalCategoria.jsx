import { useEffect, useState } from "react";

export default function ModalCategoria({

    aberto,

    fechar,

    salvar,

    categoriaEditando

}) {

    const inicial = {

        nome: "",

        descricao: "",

        ativo: true

    };

    const [form, setForm] = useState(inicial);

    useEffect(() => {

        if (!aberto) return;

        if (categoriaEditando) {

            setForm({

                ...inicial,

                ...categoriaEditando

            });

        } else {

            setForm(inicial);

        }

    }, [categoriaEditando, aberto]);

    function alterar(e) {

        const { name, value } = e.target;

        setForm(old => ({

            ...old,

            [name]: value

        }));

    }

    function enviar(e) {

        e.preventDefault();

        salvar(form);

    }

    if (!aberto) return null;

    return (

        <div className="modal-overlay">

            <div className="modal-produto">

                <h2>

                    {categoriaEditando ?

                        "Editar Categoria"

                        :

                        "Nova Categoria"}

                </h2>

                <form onSubmit={enviar}>

                    <input

                        name="nome"

                        placeholder="Nome"

                        value={form.nome}

                        onChange={alterar}

                        required

                    />

                    <textarea

                        name="descricao"

                        placeholder="Descrição"

                        value={form.descricao}

                        onChange={alterar}

                    />

                    <label>

                        <input

                            type="checkbox"

                            checked={form.ativo}

                            onChange={(e) =>

                                setForm({

                                    ...form,

                                    ativo: e.target.checked

                                })

                            }

                        />

                        Ativo

                    </label>

                    <div className="acoes-modal">

                        <button
                            type="button"
                            onClick={fechar}
                        >
                            Cancelar
                        </button>

                        <button
                            className="btn-primary"
                            type="submit"
                        >
                            Salvar
                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}