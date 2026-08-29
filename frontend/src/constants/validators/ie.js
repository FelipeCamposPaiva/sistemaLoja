export default function validarIE(ie = "") {

    ie = ie.replace(/\D/g, "");

    return ie.length >= 8;

}