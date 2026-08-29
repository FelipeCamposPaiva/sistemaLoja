export default function validarCNPJ(cnpj = "") {

    cnpj = cnpj.replace(/\D/g, "");

    if (cnpj.length !== 14) return false;

    if (/^(\d)\1+$/.test(cnpj)) return false;

    return true;

}