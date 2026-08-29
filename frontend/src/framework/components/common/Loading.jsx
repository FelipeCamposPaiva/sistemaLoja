export default function Loading({

    texto = "Carregando..."

}) {

    return (

        <div

            style={{

                display: "flex",

                justifyContent: "center",

                alignItems: "center",

                padding: 50

            }}

        >

            <div>

                <div className="spinner"/>

                <p>{texto}</p>

            </div>

        </div>

    );

}