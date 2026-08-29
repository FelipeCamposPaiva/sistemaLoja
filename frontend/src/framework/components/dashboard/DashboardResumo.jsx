import DashboardCard from "./DashboardCard";

export default function DashboardResumo({

    clientes,

    produtos,

    vendas,

    faturamento

}){

    return(

        <div
            style={{

                display:"grid",

                gridTemplateColumns:"repeat(4,1fr)",

                gap:20

            }}
        >

            <DashboardCard

                titulo="Clientes"

                valor={clientes}

                cor="#2563eb"

            />

            <DashboardCard

                titulo="Produtos"

                valor={produtos}

                cor="#22c55e"

            />

            <DashboardCard

                titulo="Vendas"

                valor={vendas}

                cor="#f97316"

            />

            <DashboardCard

                titulo="Faturamento"

                valor={faturamento}

                cor="#8b5cf6"

            />

        </div>

    );

}