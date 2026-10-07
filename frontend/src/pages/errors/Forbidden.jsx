import TelaErro from "./TelaErro";

export default function Forbidden() {
    return (
        <TelaErro
            codigo="403"
            titulo="Acesso negado"
            texto="Seu usuário não tem permissão para esta tela. Fale com o administrador da loja."
        />
    );
}
