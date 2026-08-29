import {

    ResponsiveContainer,

    RadarChart as Chart,

    PolarGrid,

    PolarAngleAxis,

    PolarRadiusAxis,

    Radar,

    Tooltip

} from "recharts";

export default function RadarChart({

    data = [],

    dataKey = "valor",

    nameKey = "nome",

    color = "#2563eb"

}) {

    return (

        <ResponsiveContainer

            width="100%"

            height={350}

        >

            <Chart data={data}>

                <PolarGrid/>

                <PolarAngleAxis

                    dataKey={nameKey}

                />

                <PolarRadiusAxis/>

                <Radar

                    dataKey={dataKey}

                    stroke={color}

                    fill={color}

                    fillOpacity={0.5}

                />

                <Tooltip/>

            </Chart>

        </ResponsiveContainer>

    );

}