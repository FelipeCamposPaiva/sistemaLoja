import DashboardCard from "./DashboardCard";

export default function DashboardProdutos({

    total=0

}){

    return(

        <DashboardCard

            titulo="Produtos"

            valor={total}

            cor="#16a34a"

        />

    );

}