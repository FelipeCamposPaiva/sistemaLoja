export default function ButtonIcon({

    icon,

    children,

    onClick,

    color = "#2563eb",

    disabled = false,

    type = "button"

}) {

    return (

        <button

            type={type}

            disabled={disabled}

            onClick={onClick}

            style={{

                display: "flex",

                alignItems: "center",

                gap: 8,

                background: color,

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

            {icon &&

                <span

                    style={{

                        display: "flex",

                        alignItems: "center"

                    }}

                >

                    {icon}

                </span>

            }

            {children}

        </button>

    );

}