import {

    ResponsiveContainer,

    PieChart as Chart,

    Pie,

    Tooltip,

    Cell

} from "recharts";

const COLORS=[

    "#2563eb",

    "#22c55e",

    "#f97316",

    "#e11d48",

    "#8b5cf6"

];

export default function PieChart({

    data=[],

    dataKey="valor",

    nameKey="nome"

}){

    return(

        <ResponsiveContainer width="100%" height={320}>

            <Chart>

                <Pie

                    data={data}

                    dataKey={dataKey}

                    nameKey={nameKey}

                    outerRadius={110}

                >

                    {

                        data.map((item,index)=>(

                            <Cell

                                key={index}

                                fill={COLORS[index%COLORS.length]}

                            />

                        ))

                    }

                </Pie>

                <Tooltip/>

            </Chart>

        </ResponsiveContainer>

    );

}