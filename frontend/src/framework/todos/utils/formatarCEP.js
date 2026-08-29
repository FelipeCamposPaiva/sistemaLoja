/**
 * ==========================================================
 * Formatação de CEP
 * ==========================================================
 */

const somenteNumeros = (valor = "") =>
    String(valor).replace(/\D/g, "");

export function formatarCEP(valor = "") {

    const cep = somenteNumeros(valor).slice(0, 8);

    if (!cep) {

        return "";

    }

    return cep.replace(

        /^(\d{5})(\d)/,

        "$1-$2"

    );

}

export function desformatarCEP(valor = "") {

    return somenteNumeros(valor);

}

export function validarCEP(valor = "") {

    return /^\d{8}$/.test(

        somenteNumeros(valor)

    );

}

export default {

    formatarCEP,

    desformatarCEP,

    validarCEP

};