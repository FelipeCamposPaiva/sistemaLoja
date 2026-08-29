export default function PreviewUpload({

    arquivo

}) {

    if(!arquivo){

        return null;

    }

    return(

        <div

            style={{

                padding:15,

                border:"1px solid #ddd",

                borderRadius:8,

                marginTop:20

            }}

        >

            <strong>

                Arquivo

            </strong>

            <br/>

            {arquivo.name}

            <br/>

            {(arquivo.size/1024).toFixed(2)}

            KB

        </div>

    );

}