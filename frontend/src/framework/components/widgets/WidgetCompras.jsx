export default function WidgetCompras({

    total=0

}){

    return(

        <div className="widget">

            <h3>

                Compras

            </h3>

            <h1>

                {total}

            </h1>

        </div>

    );

}