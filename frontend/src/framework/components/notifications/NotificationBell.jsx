import NotificationBadge from "./NotificationBadge";

export default function NotificationBell({

    total = 0,

    onClick

}) {

    return (

        <button

            onClick={onClick}

            style={{

                position: "relative",

                width: 42,

                height: 42,

                borderRadius: 10,

                border: "none",

                background: "#f3f4f6",

                cursor: "pointer",

                fontSize: 20

            }}

        >

            🔔

            <NotificationBadge

                total={total}

            />

        </button>

    );

}