import "../styles/layout/app-shell.css";

export default function Loader({ texto = "Carregando..." }) {
    return (
        <div className="erp-loader" role="status">
            <span className="erp-loader-spin" aria-hidden />
            {texto}
        </div>
    );
}
