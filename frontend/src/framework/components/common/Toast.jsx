import { useEffect } from "react";

export default function Toast({

    aberto,

    mensagem,

    tipo = "success",

    fechar,

    tempo = 3000

}) {

    useEffect(() => {

        if (!aberto) return;

        const timer = setTimeout(

            fechar,

            tempo

        );

        return () => clearTimeout(timer);

    }, [

        aberto,

        fechar,

        tempo

    ]);

    if (!aberto) return null;

    const cores = {

        success: "#22c55e",

        error: "#ef4444",

        warning: "#f59e0b",

        info: "#2563eb"

    };

    return (

        <div

            style={{

                position: "fixed",

                right: 20,

                bottom: 20,

                background: cores[tipo],

                color: "#fff",

                padding: "15px 25px",

                borderRadius: 10,

                zIndex: 9999,

                boxShadow: "0 10px 30px rgba(0,0,0,.2)"

            }}

        >

            {mensagem}

        </div>

    );

}