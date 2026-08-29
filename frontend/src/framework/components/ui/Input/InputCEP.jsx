import { formatarCEP } from "../../../utils/formatarCEP";

export default function InputCEP({

    value = "",

    onChange,

    label = "CEP",

    disabled = false

}) {

    function alterar(valor){

        const cep = formatarCEP(valor);

        onChange?.(cep);

    }

    return(

        <div>

            <label>{label}</label>

            <input

                type="text"

                maxLength={9}

                value={value}

                disabled={disabled}

                placeholder="00000-000"

                onChange={(e)=>

                    alterar(e.target.value)

                }

            />

        </div>

    );

}