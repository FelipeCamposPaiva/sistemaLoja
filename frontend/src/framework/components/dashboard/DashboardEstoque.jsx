import DashboardCard from "./DashboardCard";

export default function DashboardEstoque({

    total=0

}){

    return(

        <DashboardCard

            titulo="Estoque"

            valor={total}

            cor="#dc2626"

        />

    );

}