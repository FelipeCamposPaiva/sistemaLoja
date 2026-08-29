export default function ButtonGroup({

    children,

    align = "right",

    gap = 10

}) {

    const justify = {

        left: "flex-start",

        center: "center",

        right: "flex-end",

        between: "space-between"

    };

    return (

        <div

            style={{

                display: "flex",

                gap,

                justifyContent:

                    justify[align] || "flex-end",

                alignItems: "center",

                flexWrap: "wrap"

            }}

        >

            {children}

        </div>

    );

}