export default function KanbanHeader({

    titulo,

    quantidade

}) {

    return (

        <div

            style={{

                display:"flex",

                justifyContent:"space-between",

                marginBottom:20

            }}

        >

            <h3>

                {titulo}

            </h3>

            <span>

                {quantidade}

            </span>

        </div>

    );

}