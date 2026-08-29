export default function validarTelefone(telefone = "") {

    telefone = telefone.replace(/\D/g, "");

    return (

        telefone.length === 10 ||

        telefone.length === 11

    );

}