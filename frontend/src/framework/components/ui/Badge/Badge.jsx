export default function Badge({

    children,

    color = "#2563eb",

    background,

    size = "md",

    rounded = true

}) {

    const sizes = {

        sm: {

            fontSize: 11,

            padding: "3px 8px"

        },

        md: {

            fontSize: 13,

            padding: "5px 10px"

        },

        lg: {

            fontSize: 15,

            padding: "8px 14px"

        }

    };

    return (

        <span

            style={{

                display: "inline-flex",

                alignItems: "center",

                justifyContent: "center",

                background:

                    background ||

                    `${color}22`,

                color,

                fontWeight: 600,

                borderRadius:

                    rounded ? 20 : 4,

                ...sizes[size]

            }}

        >

            {children}

        </span>

    );

}