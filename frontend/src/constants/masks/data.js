export default function maskData(valor = "") {

    return valor
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/, "$1/$2")
        .replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3")
        .substring(0, 10);

}