import { useState } from "react";

export default function PedidoVenda() {
  const [busca, setBusca] = useState("");

  const pedidos = [
    {
      id: 1,
      cliente: "João Silva",
      vendedor: "Felipe",
      data: "22/06/2026",
      valor: 250,
      status: "Aprovado"
    },
    {
      id: 2,
      cliente: "Maria Souza",
      vendedor: "Gabriela",
      data: "22/06/2026",
      valor: 780,
      status: "Produção"
    }
  ];

  return (
    <div className="pagina">
      <div className="topo">
        <h1>Pedidos de Venda</h1>

        <button className="btn-primary">
          Novo Pedido
        </button>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Pesquisar cliente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nº</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Data</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {pedidos
              .filter((p) =>
                p.cliente.toLowerCase().includes(busca.toLowerCase())
              )
              .map((pedido) => (
                <tr key={pedido.id}>
                  <td>{pedido.id}</td>
                  <td>{pedido.cliente}</td>
                  <td>{pedido.vendedor}</td>
                  <td>{pedido.data}</td>
                  <td>R$ {pedido.valor}</td>
                  <td>{pedido.status}</td>
                  <td>
                    <button>Editar</button>
                    <button>Excluir</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}