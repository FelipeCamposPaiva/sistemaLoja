/**
 * ==========================================================
 * Formatação Monetária
 * ==========================================================
 */

export function formatarMoeda(

    valor = 0,

    locale = "pt-BR",

    moeda = "BRL"

) {

    const numero = Number(valor);

    if (Number.isNaN(numero)) {

        return "R$ 0,00";

    }

    return new Intl.NumberFormat(

        locale,

        {

            style: "currency",

            currency: moeda

        }

    ).format(numero);

}

export function moedaSemSimbolo(

    valor = 0,

    locale = "pt-BR"

) {

    const numero = Number(valor);

    if (Number.isNaN(numero)) {

        return "0,00";

    }

    return new Intl.NumberFormat(

        locale,

        {

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        }

    ).format(numero);

}

export function parseMoeda(valor = "") {

    if (typeof valor === "number") {

        return valor;

    }

    return Number(

        String(valor)

            .replace(/\./g, "")

            .replace(",", ".")

            .replace(/[^\d.-]/g, "")

    ) || 0;

}

export default {

    formatarMoeda,

    moedaSemSimbolo,

    parseMoeda

};