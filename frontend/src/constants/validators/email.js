import REGEX_EMAIL from "../regex/email";

export default function validarEmail(email = "") {

    return REGEX_EMAIL.test(email);

}