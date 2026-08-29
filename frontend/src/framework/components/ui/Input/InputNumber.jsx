export default function InputNumber({

    value,

    onChange,

    label="Número",

    min,

    max,

    step=1

}){

    return(

        <div>

            <label>{label}</label>

            <input

                type="number"

                value={value}

                min={min}

                max={max}

                step={step}

                onChange={(e)=>

                    onChange?.(

                        e.target.value

                    )

                }

            />

        </div>

    );

}