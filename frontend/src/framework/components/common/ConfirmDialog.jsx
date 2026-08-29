export default function ConfirmDialog({

    aberto,

    titulo = "Confirmação",

    mensagem = "Deseja continuar?",

    confirmar,

    cancelar

}) {

    if (!aberto) return null;

    return (

        <div className="modal-overlay">

            <div className="modal">

                <h2>{titulo}</h2>

                <p>{mensagem}</p>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                        marginTop: 20
                    }}
                >

                    <button
                        className="btn-secondary"
                        onClick={cancelar}
                    >
                        Cancelar
                    </button>

                    <button
                        className="btn-danger"
                        onClick={confirmar}
                    >
                        Confirmar
                    </button>

                </div>

            </div>

        </div>

    );

}