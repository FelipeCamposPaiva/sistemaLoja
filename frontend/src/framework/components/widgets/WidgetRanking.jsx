export default function WidgetRanking({

    ranking=[]

}){

    return(

        <div className="widget">

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

                            marginBottom:10

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