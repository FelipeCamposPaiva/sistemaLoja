    import DashboardCard from "./DashboardCard";

export default function DashboardFinanceiro({

    saldo=0

}){

    return(

        <DashboardCard

            titulo="Saldo"

            valor={saldo}

            cor="#22c55e"

        />

    );

}