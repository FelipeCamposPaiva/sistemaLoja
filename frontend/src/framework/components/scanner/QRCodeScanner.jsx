import { useState } from "react";

export default function QRCodeScanner({

    onScan

}) {

    const [valor, setValor] = useState("");

    function lerQRCode() {

        if (!valor) return;

        onScan?.(valor);

        setValor("");

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

                placeholder="Leia ou digite o QR Code"

                value={valor}

                onChange={(e) =>

                    setValor(e.target.value)

                }

                onKeyDown={(e) => {

                    if (e.key === "Enter") {

                        lerQRCode();

                    }

                }}

            />

            <button onClick={lerQRCode}>

                Ler QR Code

            </button>

        </div>

    );

}