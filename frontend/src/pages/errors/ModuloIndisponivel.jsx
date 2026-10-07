import TelaErro from "./TelaErro";

export default function ModuloIndisponivel() {
    return (
        <TelaErro
            aviso="alerta"
            titulo="Módulo indisponível"
            texto="Este módulo ainda não está liberado para a sua conta."
        />
    );
}
