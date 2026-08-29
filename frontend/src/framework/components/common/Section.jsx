export default function Section({

    titulo,

    children

}) {

    return (

        <section

            style={{

                background: "#fff",

                borderRadius: 12,

                padding: 20,

                boxShadow: "0 2px 10px rgba(0,0,0,.08)"

            }}

        >

            {

                titulo &&

                <h2

                    style={{

                        marginBottom:20

                    }}

                >

                    {titulo}

                </h2>

            }

            {children}

        </section>

    );

}