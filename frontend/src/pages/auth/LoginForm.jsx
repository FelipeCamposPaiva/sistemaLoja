import { useState } from "react";
import { useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

export default function LoginForm() {

    const navigate = useNavigate();

    const { login } = useAuth();

    const [email, setEmail] = useState("");

    const [senha, setSenha] = useState("");

    const [loading, setLoading] = useState(false);

    async function entrar(e) {

        e.preventDefault();

        try {

            setLoading(true);

            await login(

                email,

                senha

            );

            navigate("/");

        }

        catch (error) {

            console.error(error);

            alert("Usuário ou senha inválidos.");

        }

        finally {

            setLoading(false);

        }

    }

    return (

        <form

            className="login-form"

            onSubmit={entrar}

        >

            <div className="campo">

                <label>E-mail</label>

                <input

                    type="email"

                    value={email}

                    onChange={(e)=>setEmail(e.target.value)}

                    required

                />

            </div>

            <div className="campo">

                <label>Senha</label>

                <input

                    type="password"

                    value={senha}

                    onChange={(e)=>setSenha(e.target.value)}

                    required

                />

            </div>

            <button

                type="submit"

                disabled={loading}

            >

                {

                    loading

                        ? "Entrando..."

                        : "Entrar"

                }

            </button>

        </form>

    );

}