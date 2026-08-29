export default function maskTelefone(valor = "") {

    valor = valor.replace(/\D/g, "");

    if (valor.length <= 10) {

        return valor
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2")
            .substring(0, 14);

    }

    return valor
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .substring(0, 15);

}