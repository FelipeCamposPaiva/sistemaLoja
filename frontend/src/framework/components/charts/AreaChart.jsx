import {
    AreaChart as Chart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts";

export default function AreaChart({

    data = [],

    dataKey = "valor",

    xKey = "nome",

    color = "#2563eb"

}) {

    return (

        <ResponsiveContainer
            width="100%"
            height={300}
        >

            <Chart data={data}>

                <CartesianGrid strokeDasharray="3 3"/>

                <XAxis dataKey={xKey}/>

                <YAxis/>

                <Tooltip/>

                <Area

                    type="monotone"

                    dataKey={dataKey}

                    stroke={color}

                    fill={color}

                    fillOpacity={0.2}

                />

            </Chart>

        </ResponsiveContainer>

    );

}