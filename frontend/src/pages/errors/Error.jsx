import TelaErro from "./TelaErro";

export default function Error() {
    return (
        <TelaErro
            titulo="A tela encontrou um erro"
            texto="Não foi possível mostrar esta tela. Volte ao índice e abra o módulo outra vez."
        />
    );
}
