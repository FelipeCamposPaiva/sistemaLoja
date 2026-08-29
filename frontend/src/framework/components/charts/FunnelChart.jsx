export default function FunnelChart({

    etapas = []

}) {

    return (

        <div>

            {

                etapas.map(

                    (etapa,index)=>(

                        <div

                            key={index}

                            style={{

                                width:`${100-index*10}%`,

                                margin:"12px auto",

                                padding:"15px",

                                textAlign:"center",

                                borderRadius:8,

                                background:"#2563eb",

                                color:"#fff"

                            }}

                        >

                            {etapa.nome}

                            {" - "}

                            {etapa.valor}

                        </div>

                    )

                )

            }

        </div>

    );

}