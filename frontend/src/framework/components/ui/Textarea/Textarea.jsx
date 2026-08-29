export default function Textarea({

    label,

    value,

    onChange,

    placeholder = "",

    rows = 5,

    disabled = false,

    required = false,

    maxLength,

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

            <textarea

                rows={rows}

                value={value}

                placeholder={placeholder}

                disabled={disabled}

                maxLength={maxLength}

                onChange={(e)=>

                    onChange?.(

                        e.target.value

                    )

                }

                style={{

                    resize:"vertical",

                    padding:"12px",

                    borderRadius:8,

                    border:

                        erro

                        ? "1px solid #ef4444"

                        : "1px solid #d1d5db",

                    outline:"none",

                    fontSize:14,

                    minHeight:120

                }}

            />

            {

                erro && (

                    <small

                        style={{

                            color:"#ef4444"

                        }}

                    >

                        {erro}

                    </small>

                )

            }

        </div>

    );

}