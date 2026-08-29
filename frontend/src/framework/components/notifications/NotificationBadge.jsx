export default function NotificationBadge({

    total = 0

}) {

    if (total <= 0) return null;

    return (

        <span
            style={{

                position: "absolute",

                top: -6,

                right: -6,

                background: "#ef4444",

                color: "#fff",

                borderRadius: "50%",

                width: 20,

                height: 20,

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                fontSize: 11,

                fontWeight: "bold"

            }}

        >

            {total}

        </span>

    );

}