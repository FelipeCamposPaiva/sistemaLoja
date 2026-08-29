export default function maskCEP(valor = "") {

    return valor
        .replace(/\D/g, "")
        .replace(/^(\d{5})(\d)/, "$1-$2")
        .substring(0, 9);

}