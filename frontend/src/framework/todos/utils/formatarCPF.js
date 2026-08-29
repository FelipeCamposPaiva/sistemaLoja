/**
 * ==========================================================
 * Formatação de CPF
 * ==========================================================
 */

const somenteNumeros = (valor = "") =>
    String(valor).replace(/\D/g, "");

export function formatarCPF(valor = "") {

    const cpf = somenteNumeros(valor).slice(0, 11);

    if (!cpf) {
        return "";
    }

    return cpf
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");

}

export function desformatarCPF(valor = "") {

    return somenteNumeros(valor);

}

export function validarCPF(valor = "") {

    const cpf = somenteNumeros(valor);

    if (cpf.length !== 11) {

        return false;

    }

    if (/^(\d)\1+$/.test(cpf)) {

        return false;

    }

    let soma = 0;

    for (let i = 0; i < 9; i++) {

        soma += Number(cpf[i]) * (10 - i);

    }

    let resto = (soma * 10) % 11;

    if (resto === 10) resto = 0;

    if (resto !== Number(cpf[9])) {

        return false;

    }

    soma = 0;

    for (let i = 0; i < 10; i++) {

        soma += Number(cpf[i]) * (11 - i);

    }

    resto = (soma * 10) % 11;

    if (resto === 10) resto = 0;

    return resto === Number(cpf[10]);

}

export default {

    formatarCPF,

    desformatarCPF,

    validarCPF

};