import { formatarMoeda } from "../../../utils/formatarMoeda";

export default function InputMoney({

    value="",

    onChange,

    label="Valor"

}){

    function alterar(valor){

        onChange?.(

            formatarMoeda(

                valor

            )

        );

    }

    return(

        <div>

            <label>{label}</label>

            <input

                value={value}

                placeholder="R$ 0,00"

                onChange={(e)=>

                    alterar(

                        e.target.value

                    )

                }

            />

        </div>

    );

}