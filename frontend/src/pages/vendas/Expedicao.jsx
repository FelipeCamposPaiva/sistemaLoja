const expedicoes = [
  {
    pedido: 1001,
    cliente: "João",
    transportadora: "Correios",
    rastreio: "BR123456",
    status: "Despachado"
  }
];

export default function Expedicao() {
  return (
    <div className="pagina">
      <h1>Expedição</h1>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Transportadora</th>
              <th>Rastreio</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {expedicoes.map((item, index) => (
              <tr key={index}>
                <td>{item.pedido}</td>
                <td>{item.cliente}</td>
                <td>{item.transportadora}</td>
                <td>{item.rastreio}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}