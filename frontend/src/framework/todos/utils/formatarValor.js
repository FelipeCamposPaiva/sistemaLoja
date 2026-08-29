/**
 * ==========================================================
 * Formatação de Valores Numéricos
 * ==========================================================
 */

import {

    formatarMoeda,

    parseMoeda

} from "./formatarMoeda";

export function formatarValor(

    valor,

    casas = 2

) {

    const numero = Number(valor);

    if (Number.isNaN(numero)) {

        return "0";

    }

    return numero.toLocaleString(

        "pt-BR",

        {

            minimumFractionDigits: casas,

            maximumFractionDigits: casas

        }

    );

}

export function numero(valor = "") {

    if (typeof valor === "number") {

        return valor;

    }

    return parseMoeda(valor);

}

export function arredondar(

    valor,

    casas = 2

) {

    const fator = Math.pow(10, casas);

    return Math.round(

        Number(valor) * fator

    ) / fator;

}

export function porcentagem(

    valor,

    total

) {

    valor = Number(valor);

    total = Number(total);

    if (total === 0) {

        return 0;

    }

    return (valor * 100) / total;

}

export function formatarPorcentagem(

    valor,

    casas = 2

) {

    return `${formatarValor(valor, casas)}%`;

}

export {

    formatarMoeda

};

export default {

    numero,

    arredondar,

    porcentagem,

    formatarValor,

    formatarPorcentagem,

    formatarMoeda

};