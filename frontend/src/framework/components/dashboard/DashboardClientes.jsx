import DashboardCard from "./DashboardCard";

export default function DashboardClientes({

    total=0

}){

    return(

        <DashboardCard

            titulo="Clientes"

            valor={total}

            cor="#2563eb"

        />

    );

}