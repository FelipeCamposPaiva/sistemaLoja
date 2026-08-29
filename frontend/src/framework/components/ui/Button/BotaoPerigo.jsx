export default function BotaoPerigo({

    children,

    onClick,

    disabled = false,

    type = "button"

}) {

    return (

        <button

            type={type}

            disabled={disabled}

            onClick={onClick}

            style={{

                background: "#dc2626",

                color: "#fff",

                border: "none",

                borderRadius: 8,

                padding: "10px 18px",

                cursor: disabled ? "not-allowed" : "pointer",

                opacity: disabled ? 0.6 : 1,

                fontWeight: 600,

                transition: ".2s"

            }}

        >

            {children}

        </button>

    );

}