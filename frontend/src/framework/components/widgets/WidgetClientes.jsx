export default function WidgetClientes({

    total=0

}){

    return(

        <div className="widget">

            <h3>

                Clientes

            </h3>

            <h1>

                {total}

            </h1>

        </div>

    );

}