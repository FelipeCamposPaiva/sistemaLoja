export default function ErrorMessage({

    mensagem = "Ocorreu um erro."

}) {

    return (

        <div

            style={{

                background: "#fee2e2",

                color: "#b91c1c",

                padding: 15,

                borderRadius: 8,

                border: "1px solid #fecaca"

            }}

        >

            {mensagem}

        </div>

    );

}