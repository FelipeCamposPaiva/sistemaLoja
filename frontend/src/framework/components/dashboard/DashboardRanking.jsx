export default function DashboardRanking({

    ranking=[]

}){

    return(

        <div
            style={{

                background:"#fff",

                padding:20,

                borderRadius:12

            }}
        >

            <h3>

                Ranking

            </h3>

            {

                ranking.map((item,index)=>(

                    <div
                        key={index}
                        style={{

                            display:"flex",

                            justifyContent:"space-between",

                            padding:"10px 0",

                            borderBottom:"1px solid #eee"

                        }}
                    >

                        <span>

                            {item.nome}

                        </span>

                        <strong>

                            {item.valor}

                        </strong>

                    </div>

                ))

            }

        </div>

    );

}