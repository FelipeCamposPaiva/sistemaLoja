export default function validarSenha(senha = "") {

    return (

        senha.length >= 8 &&

        /[A-Z]/.test(senha) &&

        /[a-z]/.test(senha) &&

        /\d/.test(senha)

    );

}