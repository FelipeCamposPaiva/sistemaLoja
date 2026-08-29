import DashboardCard from "./DashboardCard";

export default function DashboardProdução({

    total=0

}){

    return(

        <DashboardCard

            titulo="Produção"

            valor={total}

            cor="#f97316"

        />

    );

}