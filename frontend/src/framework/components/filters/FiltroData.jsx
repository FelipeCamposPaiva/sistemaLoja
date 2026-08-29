import { useState } from "react";

export default function FiltroData({

    value,

    onChange,

    label = "Data"

}) {

    const [data, setData] = useState(

        value || ""

    );

    function alterar(valor) {

        setData(valor);

        onChange?.(valor);

    }

    return (

        <div className="filtro-item">

            <label>

                {label}

            </label>

            <input

                type="date"

                value={data}

                onChange={(e)=>

                    alterar(e.target.value)

                }

            />

        </div>

    );

}