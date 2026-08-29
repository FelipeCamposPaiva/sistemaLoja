export default function DataGridActions({

    onEditar,

    onExcluir

}) {

    return (

        <div
            style={{
                display:"flex",
                gap:10
            }}
        >

            <button
                onClick={onEditar}
            >
                Editar
            </button>

            <button
                onClick={onExcluir}
            >
                Excluir
            </button>

        </div>

    );

}