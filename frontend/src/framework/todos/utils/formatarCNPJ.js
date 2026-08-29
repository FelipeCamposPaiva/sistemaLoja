/**
 * ==========================================================
 * Formatação de CNPJ
 * ==========================================================
 */

const somenteNumeros = (valor = "") =>
    String(valor).replace(/\D/g, "");

export function formatarCNPJ(valor = "") {

    const cnpj = somenteNumeros(valor).slice(0, 14);

    if (!cnpj) {

        return "";

    }

    return cnpj
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");

}

export function desformatarCNPJ(valor = "") {

    return somenteNumeros(valor);

}

export function validarCNPJ(valor = "") {

    const cnpj = somenteNumeros(valor);

    if (cnpj.length !== 14) {

        return false;

    }

    if (/^(\d)\1+$/.test(cnpj)) {

        return false;

    }

    const calcular = tamanho => {

        const numeros = cnpj.substring(0, tamanho);

        const digitos = cnpj.substring(tamanho);

        let soma = 0;

        let pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {

            soma += numeros[tamanho - i] * pos--;

            if (pos < 2) {

                pos = 9;

            }

        }

        const resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

        return resultado == digitos[0];

    };

    return calcular(12) && calcular(13);

}

export default {

    formatarCNPJ,

    desformatarCNPJ,

    validarCNPJ

};