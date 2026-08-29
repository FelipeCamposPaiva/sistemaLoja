export default function DataGridHeader({

    columns

}) {

    return (

        <thead>

            <tr>

                {

                    columns.map(col => (

                        <th key={col.field}>

                            {col.header}

                        </th>

                    ))

                }

            </tr>

        </thead>

    );

}