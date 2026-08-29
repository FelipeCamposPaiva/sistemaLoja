import DashboardCard from "./DashboardCard";

export default function DashboardCompras({

    total=0

}){

    return(

        <DashboardCard

            titulo="Compras"

            valor={total}

            cor="#ea580c"

        />

    );

}