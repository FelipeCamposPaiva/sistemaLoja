export default function Timeline({

    eventos = []

}) {

    return (

        <div className="timeline">

            {

                eventos.map(

                    evento => (

                        <div

                            key={evento.id}

                            className="timeline-item"

                        >

                            <div className="timeline-dot"/>

                            <div>

                                <strong>

                                    {evento.titulo}

                                </strong>

                                <p>

                                    {evento.data}

                                </p>

                            </div>

                        </div>

                    )

                )

            }

        </div>

    );

}