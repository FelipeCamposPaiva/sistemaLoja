export default function WidgetOS({

    abertas=0

}){

    return(

        <div className="widget">

            <h3>

                Ordens de Serviço

            </h3>

            <h1>

                {abertas}

            </h1>

        </div>

    );

}