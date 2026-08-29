export default function CardResumo({

    titulo,

    valor,

    icone,

    cor = "#2563eb",

    subtitulo

}) {

    return (

        <div
            className="card-resumo"
            style={{
                borderTop: `5px solid ${cor}`
            }}
        >

            <div className="card-resumo-topo">

                <div>

                    <small>{titulo}</small>

                    <h2>{valor}</h2>

                    {

                        subtitulo &&

                        <p>{subtitulo}</p>

                    }

                </div>

                {

                    icone &&

                    <div className="icone">

                        {icone}

                    </div>

                }

            </div>

        </div>

    );

}