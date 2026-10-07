import { Link } from "react-router-dom";

import ROTAS from "../../constants/rotas";
import TelaErro from "./TelaErro";

export default function NotFound() {
    return (
        <TelaErro
            codigo="404"
            titulo="Página não encontrada"
            texto="Esse endereço não existe no ERP. Volte ao índice ou abra um módulo pelo menu."
        >
            <div className="err-acoes">
                <Link to={ROTAS.INDICE} className="idx-pill">ir para o índice</Link>
                <Link to={`${ROTAS.NOTAS_ENTRADA}#list`} className="idx-text">notas de entrada</Link>
                <Link to={ROTAS.PDV} className="idx-text">PDV</Link>
            </div>
        </TelaErro>
    );
}
