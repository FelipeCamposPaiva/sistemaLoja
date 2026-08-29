import { useRef } from "react";

export default function ArquivoUpload({

    accept = "*",

    multiple = false,

    onSelect

}) {

    const inputRef = useRef(null);

    function abrir() {

        inputRef.current.click();

    }

    function selecionar(e) {

        const arquivos =

            Array.from(

                e.target.files

            );

        onSelect?.(

            multiple

                ? arquivos

                : arquivos[0]

        );

    }

    return (

        <div>

            <input

                ref={inputRef}

                type="file"

                accept={accept}

                multiple={multiple}

                style={{

                    display:"none"

                }}

                onChange={selecionar}

            />

            <button

                onClick={abrir}

            >

                Selecionar Arquivo

            </button>

        </div>

    );

}