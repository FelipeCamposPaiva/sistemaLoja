/**
 * ==========================================================
 * Formatação de Telefones
 * ==========================================================
 */

const somenteNumeros = (valor = "") =>
    String(valor).replace(/\D/g, "");

export function formatarTelefone(valor = "") {

    const telefone = somenteNumeros(valor).slice(0, 13);

    if (!telefone) {
        return "";
    }

    // +55
    if (telefone.length > 11) {

        const ddi = telefone.slice(0, telefone.length - 11);
        const numero = telefone.slice(-11);

        return `+${ddi} ${formatarTelefone(numero)}`;
    }

    // Celular
    if (telefone.length === 11) {

        return telefone.replace(

            /^(\d{2})(\d{5})(\d{4})$/,

            "($1) $2-$3"

        );

    }

    // Fixo
    if (telefone.length === 10) {

        return telefone.replace(

            /^(\d{2})(\d{4})(\d{4})$/,

            "($1) $2-$3"

        );

    }

    return telefone;

}

export function desformatarTelefone(valor = "") {

    return somenteNumeros(valor);

}

export function validarTelefone(valor = "") {

    const numero = somenteNumeros(valor);

    return numero.length === 10 || numero.length === 11;

}

export function tipoTelefone(valor = "") {

    const numero = somenteNumeros(valor);

    if (numero.length === 11) {

        return "CELULAR";

    }

    if (numero.length === 10) {

        return "FIXO";

    }

    return "INVÁLIDO";

}

export default {

    formatarTelefone,

    desformatarTelefone,

    validarTelefone,

    tipoTelefone

};