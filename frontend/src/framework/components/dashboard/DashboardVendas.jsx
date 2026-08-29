import DashboardCard from "./DashboardCard";

export default function DashboardVendas({

    total=0

}){

    return(

        <DashboardCard

            titulo="Vendas"

            valor={total}

            cor="#2563eb"

        />

    );

}