export default function KanbanCard({

    card,

    onClick

}) {

    return (

        <div

            onClick={onClick}

            style={{

                background:"#fff",

                padding:15,

                marginBottom:15,

                borderRadius:10,

                cursor:"pointer",

                boxShadow:"0 2px 8px rgba(0,0,0,.08)"

            }}

        >

            <strong>

                {card.titulo}

            </strong>

            <p>

                {card.descricao}

            </p>

            {

                card.cliente &&

                <small>

                    Cliente:

                    {" "}

                    {card.cliente}

                </small>

            }

            <br/>

            {

                card.entrega &&

                <small>

                    Entrega:

                    {" "}

                    {card.entrega}

                </small>

            }

        </div>

    );

}