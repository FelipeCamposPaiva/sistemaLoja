export default function FiltroStatus({

    value,

    onChange,

    opcoes=[

        "Todos"

    ]

}){

    return(

        <div className="filtro-item">

            <label>

                Status

            </label>

            <select

                value={value}

                onChange={(e)=>

                    onChange?.(

                        e.target.value

                    )

                }

            >

                {

                    opcoes.map(status=>(

                        <option

                            key={status}

                            value={status}

                        >

                            {status}

                        </option>

                    ))

                }

            </select>

        </div>

    );

}