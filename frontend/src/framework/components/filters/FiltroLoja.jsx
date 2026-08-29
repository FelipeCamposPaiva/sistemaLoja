export default function FiltroLoja({

    value,

    onChange,

    lojas=[]

}){

    return(

        <div className="filtro-item">

            <label>

                Loja

            </label>

            <select

                value={value}

                onChange={(e)=>

                    onChange?.(

                        e.target.value

                    )

                }

            >

                <option value="">

                    Todas

                </option>

                {

                    lojas.map(loja=>(

                        <option

                            key={loja.id}

                            value={loja.id}

                        >

                            {loja.nome}

                        </option>

                    ))

                }

            </select>

        </div>

    );

}