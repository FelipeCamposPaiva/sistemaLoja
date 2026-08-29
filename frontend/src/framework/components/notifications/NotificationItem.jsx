export default function NotificationItem({

    notificacao,

    onClick

}) {

    return (

        <div

            onClick={() => onClick?.(notificacao)}

            style={{

                padding: 15,

                borderBottom: "1px solid #eee",

                cursor: "pointer",

                transition: ".2s"

            }}

        >

            <strong>

                {notificacao.titulo}

            </strong>

            <p
                style={{
                    marginTop: 5,
                    color: "#64748b"
                }}
            >

                {notificacao.mensagem}

            </p>

            <small>

                {notificacao.data}

            </small>

        </div>

    );

}