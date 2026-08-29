export default function WidgetVendas({

    vendas=0

}){

    return(

        <div className="widget">

            <h3>

                Vendas

            </h3>

            <h1>

                {vendas}

            </h1>

        </div>

    );

}