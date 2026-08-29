export default function Checkbox({

    label,

    checked = false,

    onChange,

    disabled = false

}) {

    return (

        <label

            style={{

                display: "flex",

                alignItems: "center",

                gap: 8,

                cursor: disabled ? "not-allowed" : "pointer",

                opacity: disabled ? 0.6 : 1

            }}

        >

            <input

                type="checkbox"

                checked={checked}

                disabled={disabled}

                onChange={(e) =>

                    onChange?.(

                        e.target.checked

                    )

                }

            />

            {label}

        </label>

    );

}