export default function Switch({

    checked = false,

    onChange,

    label,

    disabled = false

}) {

    return (

        <label

            style={{

                display:"flex",

                alignItems:"center",

                gap:12,

                cursor:disabled

                    ? "not-allowed"

                    : "pointer"

            }}

        >

            <div

                onClick={() => {

                    if (!disabled) {

                        onChange?.(

                            !checked

                        );

                    }

                }}

                style={{

                    width:50,

                    height:28,

                    borderRadius:20,

                    background:

                        checked

                            ? "#22c55e"

                            : "#cbd5e1",

                    position:"relative",

                    transition:".3s"

                }}

            >

                <div

                    style={{

                        width:22,

                        height:22,

                        background:"#fff",

                        borderRadius:"50%",

                        position:"absolute",

                        top:3,

                        left:checked

                            ? 25

                            : 3,

                        transition:".3s",

                        boxShadow:

                            "0 2px 6px rgba(0,0,0,.2)"

                    }}

                />

            </div>

            {

                label &&

                <span>

                    {label}

                </span>

            }

        </label>

    );

}