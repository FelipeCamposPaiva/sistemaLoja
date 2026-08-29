export default function Importacao() {
  return (
    <div className="container-fluid">

      <h2 className="mb-4">Importação de Dados</h2>

      <div className="card p-4">

        <div className="mb-3">
          <label className="form-label">Tipo de Importação</label>

          <select className="form-select">
            <option>Clientes</option>
            <option>Produtos</option>
            <option>Ordens de Serviço</option>
            <option>Contas a Receber</option>
            <option>Contas a Pagar</option>
          </select>
        </div>

        <div className="mb-3">
          <input
            type="file"
            className="form-control"
            accept=".xls,.xlsx,.csv"
          />
        </div>

        <button className="btn btn-primary">
          Importar Arquivo
        </button>

      </div>

    </div>
  );
}