/**
 * ==========================================================
 * Máscaras
 * ERP Tem de Tudo
 * ==========================================================
 */

const somenteNumeros = (valor = "") =>
    String(valor).replace(/\D/g, "");

const somenteLetras = (valor = "") =>
    String(valor).replace(/[^A-Za-zÀ-ÿ\s]/g, "");

const alfaNumerico = (valor = "") =>
    String(valor).replace(/[^0-9A-Za-z]/g, "");

export const onlyNumbers = somenteNumeros;
export const onlyLetters = somenteLetras;
export const onlyAlphaNumeric = alfaNumerico;

/*
|--------------------------------------------------------------------------
| Engine
|--------------------------------------------------------------------------
*/

export function mask(valor = "", mascara = "") {

    if (!mascara) {

        return valor;

    }

    let resultado = "";

    const texto = String(valor);

    let posicao = 0;

    for (let i = 0; i < mascara.length; i++) {

        const caractere = mascara[i];

        if (caractere === "#") {

            if (texto[posicao]) {

                resultado += texto[posicao++];

            }

        }

        else {

            resultado += caractere;

        }

    }

    return resultado;

}

export function unmask(valor = "") {

    return somenteNumeros(valor);

}

/*
|--------------------------------------------------------------------------
| CPF
|--------------------------------------------------------------------------
*/

export function cpf(valor = "") {

    return mask(

        somenteNumeros(valor).slice(0, 11),

        "###.###.###-##"

    );

}

/*
|--------------------------------------------------------------------------
| CNPJ
|--------------------------------------------------------------------------
*/

export function cnpj(valor = "") {

    return mask(

        somenteNumeros(valor).slice(0, 14),

        "##.###.###/####-##"

    );

}

/*
|--------------------------------------------------------------------------
| CPF ou CNPJ
|--------------------------------------------------------------------------
*/

export function cpfCnpj(valor = "") {

    const numero = somenteNumeros(valor);

    if (numero.length <= 11) {

        return cpf(numero);

    }

    return cnpj(numero);

}

/*
|--------------------------------------------------------------------------
| CEP
|--------------------------------------------------------------------------
*/

export function cep(valor = "") {

    return mask(

        somenteNumeros(valor).slice(0, 8),

        "#####-###"

    );

}

/*
|--------------------------------------------------------------------------
| RG
|--------------------------------------------------------------------------
*/

export function rg(valor = "") {

    return mask(

        somenteNumeros(valor).slice(0, 9),

        "##.###.###-#"

    );

}

/*
|--------------------------------------------------------------------------
| Telefone
|--------------------------------------------------------------------------
*/

export function telefone(valor = "") {

    const numero = somenteNumeros(valor).slice(0, 11);

    if (!numero) {

        return "";

    }

    if (numero.length <= 10) {

        return mask(

            numero,

            "(##) ####-####"

        );

    }

    return mask(

        numero,

        "(##) #####-####"

    );

}

export function celular(valor = "") {

    return mask(

        somenteNumeros(valor).slice(0, 11),

        "(##) #####-####"

    );

}

export function telefoneOuCelular(valor = "") {

    return telefone(valor);

}

/*
|--------------------------------------------------------------------------
| Data
|--------------------------------------------------------------------------
*/

export function data(valor = "") {

    return mask(

        somenteNumeros(valor).slice(0, 8),

        "##/##/####"

    );

}

/*
|--------------------------------------------------------------------------
| Hora
|--------------------------------------------------------------------------
*/

export function hora(valor = "") {

    return mask(

        somenteNumeros(valor).slice(0, 4),

        "##:##"

    );

}

/*
|--------------------------------------------------------------------------
| Data e Hora
|--------------------------------------------------------------------------
*/

export function dataHora(valor = "") {

    const numero = somenteNumeros(valor).slice(0, 12);

    if (numero.length <= 8) {

        return data(numero);

    }

    return `${

        data(numero.slice(0, 8))

    } ${

        hora(numero.slice(8))

    }`;

}

/*
|--------------------------------------------------------------------------
| Placa Mercosul
|--------------------------------------------------------------------------
*/

export function placa(valor = "") {

    const texto = alfaNumerico(valor)

        .toUpperCase()

        .slice(0, 7);

    if (texto.length <= 3) {

        return texto;

    }

    return `${

        texto.slice(0, 3)

    }-${

        texto.slice(3)

    }`;

}

/*
|--------------------------------------------------------------------------
| Código de Barras
|--------------------------------------------------------------------------
*/

export function codigoBarras(valor = "") {

    return somenteNumeros(valor);

}

/*
|--------------------------------------------------------------------------
| NCM
|--------------------------------------------------------------------------
*/

export function ncm(valor = "") {

    return mask(

        somenteNumeros(valor).slice(0, 8),

        "####.##.##"

    );

}

/*
|--------------------------------------------------------------------------
| CFOP
|--------------------------------------------------------------------------
*/

export function cfop(valor = "") {

    return somenteNumeros(valor)

        .slice(0, 4);

}

/*
|--------------------------------------------------------------------------
| Inscrição Estadual
|--------------------------------------------------------------------------
*/

export function inscricaoEstadual(valor = "") {

    return somenteNumeros(valor)

        .slice(0, 14);

}

/*
|--------------------------------------------------------------------------
| Número Inteiro
|--------------------------------------------------------------------------
*/

export function inteiro(valor = "") {

    return somenteNumeros(valor);

}

/*
|--------------------------------------------------------------------------
| Número Decimal
|--------------------------------------------------------------------------
*/

export function decimal(

    valor = "",

    casas = 2

) {

    let numero = somenteNumeros(valor);

    if (!numero) {

        return "";

    }

    while (

        numero.length <= casas

    ) {

        numero = "0" + numero;

    }

    const inteiro = numero.slice(

        0,

        -casas

    );

    const decimal = numero.slice(

        -casas

    );

    return `${

        Number(inteiro).toLocaleString(

            "pt-BR"

        )

    },${decimal}`;

}

/*
|--------------------------------------------------------------------------
| Moeda
|--------------------------------------------------------------------------
*/

export function moeda(valor = "") {

    return decimal(

        valor,

        2

    );

}

/*
|--------------------------------------------------------------------------
| Porcentagem
|--------------------------------------------------------------------------
*/

export function porcentagem(valor = "") {

    return decimal(

        valor,

        2

    ) + "%";

}

/*
|--------------------------------------------------------------------------
| Quantidade
|--------------------------------------------------------------------------
*/

export function quantidade(valor = "") {

    return decimal(

        valor,

        3

    );

}

/*
|--------------------------------------------------------------------------
| Peso
|--------------------------------------------------------------------------
*/

export function peso(valor = "") {

    return decimal(

        valor,

        3

    );

}

/*
|--------------------------------------------------------------------------
| Altura
|--------------------------------------------------------------------------
*/

export function altura(valor = "") {

    return decimal(

        valor,

        2

    );

}

/*
|--------------------------------------------------------------------------
| Largura
|--------------------------------------------------------------------------
*/

export function largura(valor = "") {

    return decimal(

        valor,

        2

    );

}

/*
|--------------------------------------------------------------------------
| Comprimento
|--------------------------------------------------------------------------
*/

export function comprimento(valor = "") {

    return decimal(

        valor,

        2

    );

}

/*
|--------------------------------------------------------------------------
| Valor
|--------------------------------------------------------------------------
*/

export function valor(valorDigitado = "") {

    return moeda(

        valorDigitado

    );

}

/*
|--------------------------------------------------------------------------
| Remove Máscara
|--------------------------------------------------------------------------
*/

export function removeMask(valor = "") {

    return somenteNumeros(valor);

}

/*
|--------------------------------------------------------------------------
| Apply Mask
|--------------------------------------------------------------------------
*/

export function applyMask(

    valor,

    callback

) {

    if (

        typeof callback !== "function"

    ) {

        return valor;

    }

    return callback(valor);

}

/*
|--------------------------------------------------------------------------
| Máscara Dinâmica
|--------------------------------------------------------------------------
*/

export function dinamica(

    tipo,

    valor

) {

    switch (tipo) {

        case "cpf":

            return cpf(valor);

        case "cnpj":

            return cnpj(valor);

        case "cpfCnpj":

            return cpfCnpj(valor);

        case "cep":

            return cep(valor);

        case "telefone":

            return telefone(valor);

        case "celular":

            return celular(valor);

        case "telefoneOuCelular":

            return telefoneOuCelular(valor);

        case "data":

            return data(valor);

        case "hora":

            return hora(valor);

        case "dataHora":

            return dataHora(valor);

        case "placa":

            return placa(valor);

        case "moeda":

            return moeda(valor);

        case "porcentagem":

            return porcentagem(valor);

        case "quantidade":

            return quantidade(valor);

        case "peso":

            return peso(valor);

        case "altura":

            return altura(valor);

        case "largura":

            return largura(valor);

        case "comprimento":

            return comprimento(valor);

        case "inteiro":

            return inteiro(valor);

        case "decimal":

            return decimal(valor);

        case "ncm":

            return ncm(valor);

        case "cfop":

            return cfop(valor);

        case "ie":

            return inscricaoEstadual(valor);

        default:

            return valor;

    }

}

/*
|--------------------------------------------------------------------------
| Detecta automaticamente a máscara
|--------------------------------------------------------------------------
*/

export function detectMask(valor = "") {

    const numero = somenteNumeros(valor);

    if (numero.length === 8) {

        return "cep";

    }

    if (numero.length === 10) {

        return "telefone";

    }

    if (numero.length === 11) {

        if (numero.startsWith("0")) {

            return "rg";

        }

        return "cpf";

    }

    if (numero.length === 14) {

        return "cnpj";

    }

    return null;

}

/*
|--------------------------------------------------------------------------
| Verifica se possui máscara
|--------------------------------------------------------------------------
*/

export function isMasked(valor = "") {

    return /[.\-()/:\s]/.test(

        String(valor)

    );

}

/*
|--------------------------------------------------------------------------
| Limpa qualquer máscara
|--------------------------------------------------------------------------
*/

export function clearMask(valor = "") {

    return somenteNumeros(valor);

}

/*
|--------------------------------------------------------------------------
| Handler para React
|--------------------------------------------------------------------------
*/

export function onChangeMask(

    event,

    tipo

) {

    if (

        !event ||

        !event.target

    ) {

        return "";

    }

    const valor = event.target.value;

    return dinamica(

        tipo,

        valor

    );

}

/*
|--------------------------------------------------------------------------
| Exportações
|--------------------------------------------------------------------------
*/

export default {

    mask,

    unmask,

    applyMask,

    removeMask,

    detectMask,

    isMasked,

    clearMask,

    dinamica,

    onChangeMask,

    onlyNumbers,

    onlyLetters,

    onlyAlphaNumeric,

    cpf,

    cnpj,

    cpfCnpj,

    cep,

    rg,

    telefone,

    celular,

    telefoneOuCelular,

    data,

    hora,

    dataHora,

    placa,

    codigoBarras,

    ncm,

    cfop,

    inscricaoEstadual,

    inteiro,

    decimal,

    moeda,

    valor,

    porcentagem,

    quantidade,

    peso,

    altura,

    largura,

    comprimento

};