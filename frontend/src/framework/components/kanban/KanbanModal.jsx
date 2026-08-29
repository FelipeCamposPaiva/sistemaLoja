export default function KanbanModal({

    aberto,

    card,

    fechar

}) {

    if(!aberto) return null;

    return(

        <div
            className="modal-overlay"
        >

            <div
                className="modal"
            >

                <h2>

                    {card?.titulo}

                </h2>

                <p>

                    {card?.descricao}

                </p>

                <button

                    onClick={fechar}

                >

                    Fechar

                </button>

            </div>

        </div>

    );

}