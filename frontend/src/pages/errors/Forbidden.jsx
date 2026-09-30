import { Link } from "react-router-dom";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";

export default function Forbidden() {
    return (
        <div className="err-page">
            <p className="dash-crumb">erro 403</p>
            <h2>Acesso negado</h2>
            <p>Seu usuário não tem permissão para esta tela. Fale com o administrador da loja.</p>
            <Link to={ROTAS.INDICE} className="idx-pill">voltar ao índice</Link>
        </div>
    );
}
