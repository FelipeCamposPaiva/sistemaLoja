export default function Radio({

    label,

    value,

    checked,

    name,

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

                type="radio"

                value={value}

                checked={checked}

                name={name}

                disabled={disabled}

                onChange={() =>

                    onChange?.(

                        value

                    )

                }

            />

            {label}

        </label>

    );

}