/**
 * ==========================================================
 * ERP TEM DE TUDO
 * Download de Arquivos
 * ==========================================================
 */

const MIME_TYPES = {

    pdf: "application/pdf",

    csv: "text/csv;charset=utf-8;",

    txt: "text/plain;charset=utf-8;",

    json: "application/json;charset=utf-8;",

    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    xls: "application/vnd.ms-excel",

    doc: "application/msword",

    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    png: "image/png",

    jpg: "image/jpeg",

    jpeg: "image/jpeg",

    gif: "image/gif",

    svg: "image/svg+xml",

    webp: "image/webp",

    zip: "application/zip"

};

function getMime(ext = "") {

    ext = String(ext)

        .replace(".", "")

        .toLowerCase();

    return MIME_TYPES[ext] ||

        "application/octet-stream";

}

function criarBlob(conteudo, mime) {

    if (conteudo instanceof Blob) {

        return conteudo;

    }

    if (conteudo instanceof File) {

        return conteudo;

    }

    return new Blob(

        [conteudo],

        {

            type: mime

        }

    );

}

function baixarBlob(blob, nome) {

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = nome;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setTimeout(() => {

        URL.revokeObjectURL(url);

    }, 100);

}

export function downloadArquivo(

    conteudo,

    nome = "arquivo",

    extensao = ""

) {

    const mime = getMime(extensao);

    const blob = criarBlob(

        conteudo,

        mime

    );

    baixarBlob(

        blob,

        extensao

            ? `${nome}.${extensao.replace(".", "")}`

            : nome

    );

}

export function downloadJSON(

    dados,

    nome = "dados"

) {

    downloadArquivo(

        JSON.stringify(

            dados,

            null,

            2

        ),

        nome,

        "json"

    );

}

export function downloadTexto(

    texto,

    nome = "arquivo"

) {

    downloadArquivo(

        texto,

        nome,

        "txt"

    );

}

export function downloadCSV(

    texto,

    nome = "dados"

) {

    downloadArquivo(

        texto,

        nome,

        "csv"

    );

}

export function downloadBlob(

    blob,

    nome

) {

    baixarBlob(

        blob,

        nome

    );

}

export function downloadBase64(

    base64,

    nome = "arquivo"

) {

    const partes = base64.split(",");

    const mime = partes[0]

        .match(/:(.*?);/)[1];

    const bytes = atob(

        partes[1]

    );

    const array = new Uint8Array(

        bytes.length

    );

    for (

        let i = 0;

        i < bytes.length;

        i++

    ) {

        array[i] = bytes.charCodeAt(i);

    }

    baixarBlob(

        new Blob(

            [array],

            {

                type: mime

            }

        ),

        nome

    );

}

export async function downloadURL(

    url,

    nome = "download"

) {

    const resposta = await fetch(url);

    const blob = await resposta.blob();

    baixarBlob(

        blob,

        nome

    );

}

export default {

    downloadArquivo,

    downloadBlob,

    downloadJSON,

    downloadTexto,

    downloadCSV,

    downloadBase64,

    downloadURL

};