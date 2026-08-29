import BarChart from "../charts/BarChart";

export default function DashboardChart({

    titulo,

    dados

}){

    return(

        <div
            style={{

                background:"#fff",

                padding:20,

                borderRadius:12,

                boxShadow:"0 2px 10px rgba(0,0,0,.08)"

            }}
        >

            <h3>

                {titulo}

            </h3>

            <BarChart

                data={dados}

            />

        </div>

    );

}