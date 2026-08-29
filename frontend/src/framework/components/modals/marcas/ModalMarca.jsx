import { useEffect, useState } from "react";

export default function ModalMarca({

    aberto,

    fechar,

    salvar,

    marcaEditando

}) {

    const inicial = {

        nome: "",

        fabricante: "",

        descricao: "",

        logo: "",

        site: "",

        email: "",

        telefone: "",

        ativo: true

    };

    const [form, setForm] = useState(inicial);

    useEffect(() => {

        if (!aberto) return;

        if (marcaEditando) {

            setForm({

                ...inicial,

                ...marcaEditando

            });

        } else {

            setForm(inicial);

        }

    }, [marcaEditando, aberto]);

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

                    {

                        marcaEditando

                            ?

                            "Editar Marca"

                            :

                            "Nova Marca"

                    }

                </h2>

                <form onSubmit={enviar}>

                    <div className="grid-2">

                        <input

                            name="nome"

                            placeholder="Nome da Marca"

                            value={form.nome}

                            onChange={alterar}

                            required

                        />

                        <input

                            name="fabricante"

                            placeholder="Fabricante"

                            value={form.fabricante}

                            onChange={alterar}

                        />

                        <input

                            name="site"

                            placeholder="Site"

                            value={form.site}

                            onChange={alterar}

                        />

                        <input

                            name="email"

                            placeholder="Email"

                            value={form.email}

                            onChange={alterar}

                        />

                        <input

                            name="telefone"

                            placeholder="Telefone"

                            value={form.telefone}

                            onChange={alterar}

                        />

                        <input

                            name="logo"

                            placeholder="URL da Logo"

                            value={form.logo}

                            onChange={alterar}

                        />

                    </div>

                    <textarea

                        name="descricao"

                        placeholder="Descrição"

                        value={form.descricao}

                        onChange={alterar}

                    />

                    <div
                        style={{
                            display: "flex",
                            gap: 15,
                            marginTop: 15
                        }}
                    >

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

                    </div>

                    <div className="acoes-modal">

                        <button

                            type="button"

                            onClick={fechar}

                        >

                            Cancelar

                        </button>

                        <button

                            type="submit"

                            className="btn-primary"

                        >

                            Salvar

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}