import { useState } from "react";

export default function BarcodeScanner({

    onScan

}) {

    const [codigo, setCodigo] = useState("");

    function confirmar() {

        if (!codigo) return;

        onScan?.(codigo);

        setCodigo("");

    }

    return (

        <div
            style={{

                display: "flex",

                gap: 10,

                alignItems: "center"

            }}

        >

            <input

                type="text"

                placeholder="Leia ou digite o código de barras"

                value={codigo}

                onChange={(e) =>

                    setCodigo(e.target.value)

                }

                onKeyDown={(e) => {

                    if (e.key === "Enter") {

                        confirmar();

                    }

                }}

            />

            <button onClick={confirmar}>

                Ler

            </button>

        </div>

    );

}