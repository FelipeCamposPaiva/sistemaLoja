export default function DataGridEmpty({

    colSpan

}) {

    return (

        <tr>

            <td

                colSpan={colSpan}

                style={{

                    textAlign:"center",

                    padding:40,

                    color:"#999"

                }}

            >

                Nenhum registro encontrado.

            </td>

        </tr>

    );

}