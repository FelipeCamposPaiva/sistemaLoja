export default function SelectPadrao({

    label,

    value,

    options = [],

    onChange,

    placeholder = "Selecione...",

    disabled = false,

    required = false,

    erro

}) {

    return (

        <div

            style={{

                display: "flex",

                flexDirection: "column",

                gap: 6

            }}

        >

            {

                label && (

                    <label>

                        {label}

                        {

                            required &&

                            <span
                                style={{
                                    color: "red"
                                }}
                            >

                                *

                            </span>

                        }

                    </label>

                )

            }

            <select

                value={value}

                disabled={disabled}

                onChange={(e)=>

                    onChange?.(

                        e.target.value

                    )

                }

                style={{

                    padding:"12px",

                    borderRadius:8,

                    border:

                        erro

                        ? "1px solid #ef4444"

                        : "1px solid #d1d5db",

                    outline:"none"

                }}

            >

                <option value="">

                    {placeholder}

                </option>

                {

                    options.map(op => (

                        <option

                            key={op.value}

                            value={op.value}

                        >

                            {op.label}

                        </option>

                    ))

                }

            </select>

            {

                erro &&

                <small

                    style={{

                        color:"#ef4444"

                    }}

                >

                    {erro}

                </small>

            }

        </div>

    );

}