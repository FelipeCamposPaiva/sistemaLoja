import {

    ResponsiveContainer,

    PieChart,

    Pie,

    Tooltip,

    Cell

} from "recharts";

const COLORS=[

    "#2563eb",

    "#22c55e",

    "#f59e0b",

    "#ef4444"

];

export default function DonutChart({

    data=[],

    dataKey="valor",

    nameKey="nome"

}){

    return(

        <ResponsiveContainer width="100%" height={300}>

            <PieChart>

                <Pie

                    data={data}

                    innerRadius={70}

                    outerRadius={110}

                    dataKey={dataKey}

                    nameKey={nameKey}

                >

                    {

                        data.map((x,i)=>

                            <Cell

                                key={i}

                                fill={COLORS[i%COLORS.length]}

                            />

                        )

                    }

                </Pie>

                <Tooltip/>

            </PieChart>

        </ResponsiveContainer>

    );

}