import TelaErro from "./TelaErro";

export default function Licenca() {
    return (
        <TelaErro
            aviso="alerta"
            titulo="Licença necessária"
            texto="A licença desta tela não está ativa. Fale com o administrador da loja."
        />
    );
}