/**
 * ==========================================================
 * ERP TEM DE TUDO
 * Exportação PDF
 * ==========================================================
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function createDocument(options = {}) {

    return new jsPDF({

        orientation:

            options.orientation ||

            "portrait",

        unit:

            options.unit ||

            "mm",

        format:

            options.format ||

            "a4"

    });

}

function writeTitle(

    pdf,

    title,

    options = {}

) {

    if (!title) {

        return;

    }

    pdf.setFont(

        "helvetica",

        "bold"

    );

    pdf.setFontSize(

        options.titleSize ||

        18

    );

    pdf.text(

        title,

        14,

        18

    );

}

function writeSubtitle(

    pdf,

    subtitle,

    options = {}

) {

    if (!subtitle) {

        return;

    }

    pdf.setFont(

        "helvetica",

        "normal"

    );

    pdf.setFontSize(

        options.subtitleSize ||

        11

    );

    pdf.text(

        subtitle,

        14,

        26

    );

}

function writeFooter(

    pdf,

    page,

    pages

) {

    const width =

        pdf.internal.pageSize.getWidth();

    const height =

        pdf.internal.pageSize.getHeight();

    pdf.setFontSize(9);

    pdf.text(

        `Página ${page} de ${pages}`,

        width - 40,

        height - 10

    );

}

function normalizeColumns(columns = [], data = []) {

    if (

        columns.length

    ) {

        return columns;

    }

    if (

        !data.length

    ) {

        return [];

    }

    return Object.keys(data[0]).map(

        key => ({

            header: key,

            dataKey: key

        })

    );

}

function normalizeRows(

    data = [],

    columns = []

) {

    return data.map(item => {

        const row = {};

        columns.forEach(col => {

            row[col.dataKey] =

                item[col.dataKey];

        });

        return row;

    });

}

/*
|--------------------------------------------------------------------------
| Exportação
|--------------------------------------------------------------------------
*/

export function exportPDF({

    fileName = "Relatorio",

    title = "",

    subtitle = "",

    author = "",

    subject = "",

    creator = "ERP Tem de Tudo",

    orientation = "portrait",

    format = "a4",

    columns = [],

    data = [],

    marginTop = 34,

    logo = null

} = {}) {

    const pdf = createDocument({

        orientation,

        format

    });

    /*
    |--------------------------------------------------------------------------
    | Metadados
    |--------------------------------------------------------------------------
    */

    pdf.setProperties({

        title,

        subject,

        author,

        creator

    });

    /*
    |--------------------------------------------------------------------------
    | Cabeçalho
    |--------------------------------------------------------------------------
    */

    if (logo) {

        try {

            pdf.addImage(

                logo,

                "PNG",

                14,

                10,

                24,

                24

            );

        }

        catch {

            // Ignora logo inválida

        }

    }

    writeTitle(

        pdf,

        title

    );

    writeSubtitle(

        pdf,

        subtitle

    );

    /*
    |--------------------------------------------------------------------------
    | Tabela
    |--------------------------------------------------------------------------
    */

    const cols = normalizeColumns(

        columns,

        data

    );

    const rows = normalizeRows(

        data,

        cols

    );

    autoTable(pdf, {

        startY: marginTop,

        columns: cols,

        body: rows,

        theme: "striped",

        styles: {

            font: "helvetica",

            fontSize: 9,

            cellPadding: 2

        },

        headStyles: {

            fillColor: [41, 128, 185],

            textColor: 255,

            fontStyle: "bold"

        }

    });

    /*
    |--------------------------------------------------------------------------
    | Rodapé
    |--------------------------------------------------------------------------
    */

    const pages = pdf.getNumberOfPages();

    for (

        let page = 1;

        page <= pages;

        page++

    ) {

        pdf.setPage(page);

        writeFooter(

            pdf,

            page,

            pages

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Download
    |--------------------------------------------------------------------------
    */

    pdf.save(

        `${fileName}.pdf`

    );

}

/*
|--------------------------------------------------------------------------
| Exportação Simples
|--------------------------------------------------------------------------
*/

export function exportTabela(

    data,

    fileName = "Relatorio",

    title = "Relatório"

) {

    exportPDF({

        fileName,

        title,

        data

    });

}

/*
|--------------------------------------------------------------------------
| Texto Livre
|--------------------------------------------------------------------------
*/

export function exportTexto({

    fileName = "Documento",

    title = "",

    texto = ""

} = {}) {

    const pdf = createDocument();

    writeTitle(

        pdf,

        title

    );

    pdf.setFont(

        "helvetica",

        "normal"

    );

    pdf.setFontSize(11);

    pdf.text(

        texto,

        14,

        30,

        {

            maxWidth: 180

        }

    );

    pdf.save(

        `${fileName}.pdf`

    );

}

/*
|--------------------------------------------------------------------------
| Exportações
|--------------------------------------------------------------------------
*/

export default {

    exportPDF,

    exportTabela,

    exportTexto

};