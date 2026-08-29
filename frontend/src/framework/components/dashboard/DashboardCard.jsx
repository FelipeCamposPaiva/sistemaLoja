export default function DashboardCard({

    titulo,

    valor,

    icone,

    cor = "#2563eb",

    subtitulo

}) {

    return (

        <div
            style={{

                background:"#fff",

                borderRadius:12,

                padding:20,

                borderLeft:`6px solid ${cor}`,

                boxShadow:"0 2px 10px rgba(0,0,0,.08)"

            }}

        >

            <div
                style={{

                    display:"flex",

                    justifyContent:"space-between",

                    alignItems:"center"

                }}
            >

                <div>

                    <small>{titulo}</small>

                    <h2>{valor}</h2>

                    {

                        subtitulo &&

                        <p>{subtitulo}</p>

                    }

                </div>

                <div>

                    {icone}

                </div>

            </div>

        </div>

    );

}