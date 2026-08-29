import KanbanColumn from "./KanbanColumn";

export default function Kanban({

    colunas = [],

    onCardClick,

    onAddCard

}) {

    return (

        <div
            style={{
                display: "flex",
                gap: 20,
                overflowX: "auto",
                alignItems: "flex-start"
            }}
        >

            {

                colunas.map(coluna => (

                    <KanbanColumn

                        key={coluna.id}

                        coluna={coluna}

                        onCardClick={onCardClick}

                        onAddCard={onAddCard}

                    />

                ))

            }

        </div>

    );

}