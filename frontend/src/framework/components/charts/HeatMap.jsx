export default function HeatMap({

    dados = []

}) {

    return (

        <div

            style={{

                display: "grid",

                gridTemplateColumns:

                    "repeat(7,1fr)",

                gap: 6

            }}

        >

            {

                dados.map(

                    (item,index)=>(

                        <div

                            key={index}

                            style={{

                                height:40,

                                borderRadius:6,

                                background:`rgba(37,99,235,${item.valor})`

                            }}

                            title={item.titulo}

                        />

                    )

                )

            }

        </div>

    );

}