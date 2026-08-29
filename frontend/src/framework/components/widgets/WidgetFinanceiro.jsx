export default function WidgetFinanceiro({

    saldo=0

}){

    return(

        <div className="widget">

            <h3>

                Financeiro

            </h3>

            <h2>

                {saldo.toLocaleString(

                    "pt-BR",

                    {

                        style:"currency",

                        currency:"BRL"

                    }

                )}

            </h2>

        </div>

    );

}