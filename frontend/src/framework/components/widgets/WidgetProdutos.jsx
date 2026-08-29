export default function WidgetProdutos({

    total=0

}){

    return(

        <div className="widget">

            <h3>

                Produtos

            </h3>

            <h1>

                {total}

            </h1>

        </div>

    );

}