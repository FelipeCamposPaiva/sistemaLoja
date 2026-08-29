export default function DataGridExport({

    excel,

    pdf

}){

    return(

        <div

            style={{

                display:"flex",

                gap:10

            }}

        >

            <button

                onClick={excel}

            >

                Excel

            </button>

            <button

                onClick={pdf}

            >

                PDF

            </button>

        </div>

    );

}