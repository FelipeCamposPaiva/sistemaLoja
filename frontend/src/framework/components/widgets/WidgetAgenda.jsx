export default function WidgetAgenda({

    eventos=[]

}){

    return(

        <div className="widget">

            <h3>

                Agenda de Hoje

            </h3>

            {

                eventos.length===0

                ?

                <p>

                    Nenhum compromisso.

                </p>

                :

                eventos.map(evento=>(

                    <div

                        key={evento.id}

                        style={{

                            padding:"10px 0",

                            borderBottom:"1px solid #eee"

                        }}

                    >

                        <strong>

                            {evento.hora}

                        </strong>

                        {" - "}

                        {evento.titulo}

                    </div>

                ))

            }

        </div>

    );

}