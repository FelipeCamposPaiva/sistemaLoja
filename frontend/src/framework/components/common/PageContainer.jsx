export default function PageContainer({

    children

}) {

    return (

        <div

            style={{

                padding: 30,

                display: "flex",

                flexDirection: "column",

                gap: 25

            }}

        >

            {children}

        </div>

    );

}