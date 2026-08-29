export default function DataGridPagination({

    pagina,

    total,

    anterior,

    proximo

}){

    return(

        <div

            style={{

                display:"flex",

                justifyContent:"space-between",

                marginTop:20

            }}

        >

            <button

                onClick={anterior}

            >

                Anterior

            </button>

            <span>

                Página {pagina} de {total}

            </span>

            <button

                onClick={proximo}

            >

                Próxima

            </button>

        </div>

    );

}