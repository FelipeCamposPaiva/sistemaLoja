import { useState } from "react";

export default function ImageUpload({

    onChange

}) {

    const [

        preview,

        setPreview

    ] = useState(null);

    function selecionar(e){

        const arquivo=

            e.target.files[0];

        if(!arquivo) return;

        setPreview(

            URL.createObjectURL(

                arquivo

            )

        );

        onChange?.(

            arquivo

        );

    }

    return(

        <div>

            <input

                type="file"

                accept="image/*"

                onChange={selecionar}

            />

            {

                preview &&

                <img

                    src={preview}

                    alt="preview"

                    style={{

                        marginTop:20,

                        width:200,

                        borderRadius:10

                    }}

                />

            }

        </div>

    );

}