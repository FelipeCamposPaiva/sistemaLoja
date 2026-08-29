import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";

export default function GaugeChart({

    valor = 0,

    maximo = 100,

    cor = "#22c55e"

}) {

    const percentual = Math.min(

        (valor / maximo) * 100,

        100

    );

    const data = [

        {

            value: percentual

        },

        {

            value: 100 - percentual

        }

    ];

    return (

        <div
            style={{
                width: "100%",
                height: 280,
                position: "relative"
            }}
        >

            <ResponsiveContainer>

                <PieChart>

                    <Pie

                        data={data}

                        startAngle={180}

                        endAngle={0}

                        innerRadius={70}

                        outerRadius={100}

                        dataKey="value"

                    >

                        <Cell fill={cor} />

                        <Cell fill="#e5e7eb" />

                    </Pie>

                </PieChart>

            </ResponsiveContainer>

            <div
                style={{
                    position: "absolute",
                    bottom: 30,
                    width: "100%",
                    textAlign: "center"
                }}
            >

                <h2>

                    {valor}

                </h2>

            </div>

        </div>

    );

}