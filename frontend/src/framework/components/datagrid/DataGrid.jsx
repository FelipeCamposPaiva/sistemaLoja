import DataGridHeader from "./DataGridHeader";
import DataGridEmpty from "./DataGridEmpty";

export default function DataGrid({

    columns = [],

    rows = [],

    children

}) {

    return (

        <div className="datagrid">

            {children}

            <table className="table">

                <DataGridHeader

                    columns={columns}

                />

                <tbody>

                    {

                        rows.length === 0

                            ? (

                                <DataGridEmpty

                                    colSpan={columns.length}

                                />

                            )

                            : (

                                rows.map((row, index) => (

                                    <tr key={index}>

                                        {

                                            columns.map(col => (

                                                <td key={col.field}>

                                                    {

                                                        row[col.field]

                                                    }

                                                </td>

                                            ))

                                        }

                                    </tr>

                                ))

                            )

                    }

                </tbody>

            </table>

        </div>

    );

}