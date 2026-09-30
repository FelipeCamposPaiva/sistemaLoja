import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

import ROTAS from "../../constants/rotas";
import { dataPedidoBr, moedaPedido } from "../../constants/pedidosVenda";
import { listarPedidosVenda } from "../../services/pedidoVenda.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/pedidos-venda.css";
import "../../styles/pages/loja-admin.css";

export default function PedidoEcommerce() {
    const [lista, setLista] = useState([]);

    useEffect(() => {
        listarPedidosVenda()
            .then(setLista)
            .catch(() => setLista([]));
    }, []);

    const pedidos = useMemo(
        () => lista.filter((p) => String(p.origem || "").toLowerCase() === "loja"),
        [lista]
    );

    return (
        <div className="prd-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <span>pedidos da loja</span>
            </nav>
            <div className="fer-head">
                <h2>Pedidos Ecommerce</h2>
                <a className="lja-ver" href="/" target="_blank" rel="noreferrer">
                    <ExternalLink size={16} /> ver vitrine
                </a>
            </div>
            <p className="idx-sub">Pedidos que o cliente fechou no site, antes do login do ERP.</p>
            <table className="fer-table">
                <thead>
                    <tr>
                        <th>Nº</th>
                        <th>Cliente</th>
                        <th>Data</th>
                        <th>Total</th>
                        <th>Pagamento</th>
                        <th>Envio</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {pedidos.map((p) => (
                        <tr key={p.id || p.numero}>
                            <td>{p.numero}</td>
                            <td>{p.cliente}</td>
                            <td>{dataPedidoBr(p.data)}</td>
                            <td>{moedaPedido(p.valor)}</td>
                            <td>{p.pagamento || "—"}</td>
                            <td>{p.formaEnvio || "—"}</td>
                            <td>{p.status}</td>
                        </tr>
                    ))}
                    {!pedidos.length ? (
                        <tr>
                            <td colSpan={7}>Nenhum pedido da vitrine ainda. Feche uma compra em `/` para testar.</td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
            <p className="fer-ajuda">
                A lista completa, com separação e expedição, está em <Link to={`${ROTAS.PEDIDO_VENDA}#list`}>Pedidos de Venda</Link>.
            </p>
        </div>
    );
}
