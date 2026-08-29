export default function WidgetEstoque({

    itens=0

}){

    return(

        <div className="widget">

            <h3>

                Estoque

            </h3>

            <h1>

                {itens}

            </h1>

        </div>

    );

}