export default function InputDate({

    value,

    onChange,

    label="Data"

}){

    return(

        <div>

            <label>{label}</label>

            <input

                type="date"

                value={value}

                onChange={(e)=>

                    onChange?.(

                        e.target.value

                    )

                }

            />

        </div>

    );

}