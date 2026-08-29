import Calendario from "../agenda/Calendario";

export default function DashboardAgenda({

    eventos=[]

}){

    return(

        <Calendario

            eventos={eventos}

        />

    );

}