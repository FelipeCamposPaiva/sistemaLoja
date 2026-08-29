export default function maskMoeda(valor = "") {

    valor = valor.replace(/\D/g, "");

    valor = Number(valor) / 100;

    return valor.toLocaleString(

        "pt-BR",

        {

            style: "currency",

            currency: "BRL"

        }

    );

}