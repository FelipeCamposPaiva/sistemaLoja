import TelaErro from "./TelaErro";

export default function ErroServidor() {
    return (
        <TelaErro
            codigo="500"
            titulo="Falha ao abrir a tela"
            texto="O servidor não conseguiu concluir esta tela. Tente de novo em instantes."
        />
    );
}
