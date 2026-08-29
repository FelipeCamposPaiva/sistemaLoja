export default function validarCEP(cep = "") {

    cep = cep.replace(/\D/g, "");

    return cep.length === 8;

}