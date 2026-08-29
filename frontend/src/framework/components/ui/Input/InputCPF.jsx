import { formatarCPF } from "../../../utils/formatarCPF";

export default function InputCPF({

    value="",

    onChange,

    label="CPF"

}){

    return(

        <div>

            <label>{label}</label>

            <input

                value={value}

                maxLength={14}

                placeholder="000.000.000-00"

                onChange={(e)=>

                    onChange?.(

                        formatarCPF(

                            e.target.value

                        )

                    )

                }

            />

        </div>

    );

}