import { Link } from "react-router-dom";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";

export default function NotFound() {
    return (
        <div className="err-page">
            <p className="dash-crumb">erro 404</p>
            <h2>Página não encontrada</h2>
            <p>Esse endereço não existe no ERP. Volte ao índice ou abra um módulo pelo menu.</p>
            <div className="err-acoes">
                <Link to={ROTAS.INDICE} className="idx-pill">ir para o índice</Link>
                <Link to={`${ROTAS.NOTAS_ENTRADA}#list`} className="idx-text">notas de entrada</Link>
                <Link to={ROTAS.PDV} className="idx-text">PDV</Link>
            </div>
        </div>
    );
}
