/**
 * ==========================================================
 * ERP TEM DE TUDO
 * Exportação Excel
 * ==========================================================
 */

import * as XLSX from "xlsx";
import { downloadBlob } from "./downloadArquivo";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function autoColumns(data = []) {

    if (!data.length) {

        return [];

    }

    const cols = Object.keys(data[0]);

    return cols.map(col => {

        let max = col.length;

        data.forEach(item => {

            const value = item[col];

            if (value === undefined || value === null) {

                return;

            }

            max = Math.max(

                max,

                String(value).length

            );

        });

        return {

            wch: Math.min(

                Math.max(max + 2, 10),

                50

            )

        };

    });

}

function normalizeData(

    data,

    columns

) {

    if (!columns?.length) {

        return data;

    }

    return data.map(item => {

        const row = {};

        columns.forEach(col => {

            if (typeof col === "string") {

                row[col] = item[col];

            }

            else {

                row[col.header] =

                    item[col.key];

            }

        });

        return row;

    });

}

function createSheet(

    data,

    options = {}

) {

    const rows = normalizeData(

        data,

        options.columns

    );

    const sheet = XLSX.utils.json_to_sheet(

        rows

    );

    sheet["!cols"] = autoColumns(rows);

    sheet["!autofilter"] = {

        ref: sheet["!ref"]

    };

    sheet["!freeze"] = {

        xSplit: 0,

        ySplit: 1

    };

    return sheet;

}

/*
|--------------------------------------------------------------------------
| Workbook
|--------------------------------------------------------------------------
*/

function createWorkbook() {

    return XLSX.utils.book_new();

}

function appendSheet(

    workbook,

    {

        name = "Planilha",

        data = [],

        columns = []

    }

) {

    const sheet = createSheet(

        data,

        {

            columns

        }

    );

    XLSX.utils.book_append_sheet(

        workbook,

        sheet,

        name

    );

}

/*
|--------------------------------------------------------------------------
| Exportação
|--------------------------------------------------------------------------
*/

export function exportExcel({

    fileName = "Planilha",

    sheets = []

} = {}) {

    const workbook = createWorkbook();

    if (!Array.isArray(sheets)) {

        throw new Error(

            "sheets deve ser um array."

        );

    }

    if (sheets.length === 0) {

        appendSheet(

            workbook,

            {

                name: "Dados",

                data: []

            }

        );

    }

    else {

        sheets.forEach(sheet => {

            appendSheet(

                workbook,

                sheet

            );

        });

    }

    const buffer = XLSX.write(

        workbook,

        {

            bookType: "xlsx",

            type: "array",

            compression: true

        }

    );

    const blob = new Blob(

        [buffer],

        {

            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        }

    );

    downloadBlob(

        blob,

        `${fileName}.xlsx`

    );

}

/*
|--------------------------------------------------------------------------
| Exporta apenas um Array
|--------------------------------------------------------------------------
*/

export function exportArray(

    data,

    fileName = "Planilha",

    columns = []

) {

    exportExcel({

        fileName,

        sheets: [

            {

                name: "Dados",

                data,

                columns

            }

        ]

    });

}

/*
|--------------------------------------------------------------------------
| Exportações
|--------------------------------------------------------------------------
*/

export default {

    exportExcel,

    exportArray

};