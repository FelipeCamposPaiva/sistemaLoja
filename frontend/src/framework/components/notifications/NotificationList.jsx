import NotificationItem from "./NotificationItem";

export default function NotificationList({

    notificacoes = [],

    onClick

}) {

    if (notificacoes.length === 0) {

        return (

            <div
                style={{
                    padding: 30,
                    textAlign: "center"
                }}
            >

                Nenhuma notificação.

            </div>

        );

    }

    return (

        <>

            {

                notificacoes.map(item => (

                    <NotificationItem

                        key={item.id}

                        notificacao={item}

                        onClick={onClick}

                    />

                ))

            }

        </>

    );

}