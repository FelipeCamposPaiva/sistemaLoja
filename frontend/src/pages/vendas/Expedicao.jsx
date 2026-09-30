import { Link } from "react-router-dom";

import { ListaPedidos } from "./PedidoVenda";
import ROTAS from "../../constants/rotas";

export default function Expedicao() {
    return (
        <>
            <p className="prd-sub" style={{ margin: "0 0 10px" }}>
                <Link to={ROTAS.DASHBOARD_EXPEDICAO}>abrir dashboard de expedição</Link>
                {" · painel para monitor da área"}
            </p>
            <ListaPedidos vista="expedicao" />
        </>
    );
}
