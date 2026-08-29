export default function Loader({

    texto = "Carregando...",

    tamanho = 40

}) {

    return (

        <div

            style={{

                display: "flex",

                flexDirection: "column",

                alignItems: "center",

                justifyContent: "center",

                gap: 15,

                padding: 30

            }}

        >

            <div

                style={{

                    width: tamanho,

                    height: tamanho,

                    border: "4px solid #e5e7eb",

                    borderTop: "4px solid #2563eb",

                    borderRadius: "50%",

                    animation: "spin 1s linear infinite"

                }}

            />

            <span>

                {texto}

            </span>

        </div>

    );

}