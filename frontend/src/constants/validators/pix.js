import REGEX_PIX from "../regex/pix";

export default function validarPIX(chave = "") {

    return (

        REGEX_PIX.email.test(chave) ||

        REGEX_PIX.telefone.test(chave) ||

        REGEX_PIX.cpf.test(chave) ||

        REGEX_PIX.cnpj.test(chave) ||

        REGEX_PIX.aleatoria.test(chave)

    );

}