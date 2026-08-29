import KanbanCard from "./KanbanCard";
import KanbanHeader from "./KanbanHeader";
import KanbanFooter from "./KanbanFooter";

export default function KanbanColumn({

    coluna,

    onCardClick,

    onAddCard

}) {

    return (

        <div
            style={{
                width: 330,
                background: "#f8fafc",
                borderRadius: 12,
                padding: 15,
                minHeight: 600
            }}
        >

            <KanbanHeader

                titulo={coluna.titulo}

                quantidade={coluna.cards.length}

            />

            {

                coluna.cards.map(card => (

                    <KanbanCard

                        key={card.id}

                        card={card}

                        onClick={() =>

                            onCardClick?.(card)

                        }

                    />

                ))

            }

            <KanbanFooter

                onClick={()=>

                    onAddCard?.(coluna)

                }

            />

        </div>

    );

}