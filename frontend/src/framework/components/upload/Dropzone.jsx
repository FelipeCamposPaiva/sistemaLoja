import { useState } from "react";

export default function Dropzone({

    onDrop

}) {

    const [

        hover,

        setHover

    ] = useState(false);

    function soltar(e){

        e.preventDefault();

        setHover(false);

        onDrop?.(

            Array.from(

                e.dataTransfer.files

            )

        );

    }

    return(

        <div

            onDragOver={(e)=>{

                e.preventDefault();

                setHover(true);

            }}

            onDragLeave={()=>

                setHover(false)

            }

            onDrop={soltar}

            style={{

                border:"2px dashed #94a3b8",

                padding:40,

                borderRadius:10,

                textAlign:"center",

                background:

                    hover

                    ? "#eff6ff"

                    : "#fff"

            }}

        >

            Arraste arquivos aqui

        </div>

    );

}