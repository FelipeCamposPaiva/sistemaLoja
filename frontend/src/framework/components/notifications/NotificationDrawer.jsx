import NotificationList from "./NotificationList";

export default function NotificationDrawer({

    aberto,

    notificacoes = [],

    fechar

}) {

    if (!aberto) return null;

    return (

        <div

            style={{

                position: "fixed",

                top: 0,

                right: 0,

                width: 360,

                height: "100vh",

                background: "#fff",

                boxShadow: "-5px 0 20px rgba(0,0,0,.15)",

                zIndex: 9999,

                display: "flex",

                flexDirection: "column"

            }}

        >

            <div

                style={{

                    padding: 20,

                    display: "flex",

                    justifyContent: "space-between",

                    borderBottom: "1px solid #eee"

                }}

            >

                <h3>

                    Notificações

                </h3>

                <button onClick={fechar}>

                    ✕

                </button>

            </div>

            <div
                style={{
                    flex: 1,
                    overflowY: "auto"
                }}
            >

                <NotificationList

                    notificacoes={notificacoes}

                />

            </div>

        </div>

    );

}