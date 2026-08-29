import {

    ResponsiveContainer,

    LineChart as Chart,

    Line,

    Tooltip,

    CartesianGrid,

    XAxis,

    YAxis

} from "recharts";

export default function LineChart({

    data=[],

    dataKey="valor",

    xKey="nome",

    color="#2563eb"

}){

    return(

        <ResponsiveContainer width="100%" height={300}>

            <Chart data={data}>

                <CartesianGrid strokeDasharray="3 3"/>

                <XAxis dataKey={xKey}/>

                <YAxis/>

                <Tooltip/>

                <Line

                    type="monotone"

                    dataKey={dataKey}

                    stroke={color}

                    strokeWidth={3}

                />

            </Chart>

        </ResponsiveContainer>

    );

}