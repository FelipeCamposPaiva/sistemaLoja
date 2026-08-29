import { useState } from "react";

export default function ForgotPassword() {

    const [email, setEmail] = useState("");

    const [enviado, setEnviado] = useState(false);

    function recuperar(e) {

        e.preventDefault();

        // TODO integração backend

        setEnviado(true);

    }

    if (enviado) {

        return (

            <div>

                <h2>Recuperação de Senha</h2>

                <p>

                    Se existir uma conta para este e-mail,

                    enviaremos as instruções de recuperação.

                </p>

            </div>

        );

    }

    return (

        <form onSubmit={recuperar}>

            <h2>Esqueci minha senha</h2>

            <p>

                Informe seu e-mail para recuperar o acesso.

            </p>

            <input

                type="email"

                placeholder="E-mail"

                value={email}

                onChange={(e)=>setEmail(e.target.value)}

                required

            />

            <button

                className="btn-primary"

                type="submit"

            >

                Enviar

            </button>

        </form>

    );

}