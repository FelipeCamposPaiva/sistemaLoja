export default function KanbanFooter({

    onClick

}) {

    return (

        <button

            onClick={onClick}

            style={{

                width:"100%",

                marginTop:15

            }}

        >

            + Novo Card

        </button>

    );

}