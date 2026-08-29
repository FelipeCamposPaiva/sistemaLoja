import { formatarTelefone } from "../../../utils/formatarTelefone";

export default function InputTelefone({

    value="",

    onChange,

    label="Telefone"

}){

    return(

        <div>

            <label>{label}</label>

            <input

                value={value}

                maxLength={15}

                placeholder="(00) 00000-0000"

                onChange={(e)=>

                    onChange?.(

                        formatarTelefone(

                            e.target.value

                        )

                    )

                }

            />

        </div>

    );

}