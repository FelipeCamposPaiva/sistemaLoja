import {

    ResponsiveContainer,

    BarChart as Chart,

    Bar,

    CartesianGrid,

    Tooltip,

    XAxis,

    YAxis

} from "recharts";

export default function BarChart({

    data=[],

    dataKey="valor",

    xKey="nome",

    color="#22c55e"

}){

    return(

        <ResponsiveContainer width="100%" height={300}>

            <Chart data={data}>

                <CartesianGrid strokeDasharray="3 3"/>

                <XAxis dataKey={xKey}/>

                <YAxis/>

                <Tooltip/>

                <Bar

                    dataKey={dataKey}

                    fill={color}

                    radius={[6,6,0,0]}

                />

            </Chart>

        </ResponsiveContainer>

    );

}