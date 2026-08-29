const pedidos = [
  {
    id: 1001,
    cliente: "Carlos",
    status: "Separando"
  },
  {
    id: 1002,
    cliente: "Maria",
    status: "Separado"
  }
];

export default function Separacao() {
  return (
    <div className="pagina">
      <h1>Separação</h1>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>

          <tbody>
            {pedidos.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.cliente}</td>
                <td>{item.status}</td>
                <td>
                  <button>Atualizar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}