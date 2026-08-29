import { formatarCNPJ } from "../../../utils/formatarCNPJ";

export default function InputCNPJ({

    value="",

    onChange,

    label="CNPJ"

}){

    return(

        <div>

            <label>{label}</label>

            <input

                value={value}

                maxLength={18}

                placeholder="00.000.000/0000-00"

                onChange={(e)=>

                    onChange?.(

                        formatarCNPJ(

                            e.target.value

                        )

                    )

                }

            />

        </div>

    );

}