import { useState } from "react";

export default function FiltroPeriodo({

    inicio,

    fim,

    onChange

}) {

    const [dataInicio,setInicio]=

        useState(inicio || "");

    const [dataFim,setFim]=

        useState(fim || "");

    function atualizar(

        novoInicio,

        novoFim

    ){

        onChange?.({

            inicio:novoInicio,

            fim:novoFim

        });

    }

    return(

        <div

            style={{

                display:"flex",

                gap:15,

                alignItems:"end"

            }}

        >

            <div>

                <label>

                    Início

                </label>

                <input

                    type="date"

                    value={dataInicio}

                    onChange={(e)=>{

                        setInicio(e.target.value);

                        atualizar(

                            e.target.value,

                            dataFim

                        );

                    }}

                />

            </div>

            <div>

                <label>

                    Fim

                </label>

                <input

                    type="date"

                    value={dataFim}

                    onChange={(e)=>{

                        setFim(e.target.value);

                        atualizar(

                            dataInicio,

                            e.target.value

                        );

                    }}

                />

            </div>

        </div>

    );

}