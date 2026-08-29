export default function PDFUpload({

    onChange

}) {

    return (

        <input

            type="file"

            accept=".pdf"

            onChange={(e)=>

                onChange?.(

                    e.target.files[0]

                )

            }

        />

    );

}