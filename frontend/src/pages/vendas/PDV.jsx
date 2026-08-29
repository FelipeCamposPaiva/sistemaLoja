import { useState } from "react";

export default function PDV() {
  const [itens, setItens] = useState([]);

  const adicionarProduto = () => {
    setItens([
      ...itens,
      {
        codigo: "789123",
        produto: "Caneca Personalizada",
        qtd: 1,
        valor: 35
      }
    ]);
  };

  const total = itens.reduce(
    (acc, item) => acc + item.valor * item.qtd,
    0
  );

  return (
    <div className="pagina">
      <h1>Ponto de Venda</h1>

      <div className="card">
        <button
          className="btn-primary"
          onClick={adicionarProduto}
        >
          Adicionar Produto
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Qtd</th>
              <th>Valor</th>
            </tr>
          </thead>

          <tbody>
            {itens.map((item, index) => (
              <tr key={index}>
                <td>{item.codigo}</td>
                <td>{item.produto}</td>
                <td>{item.qtd}</td>
                <td>R$ {item.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Total: R$ {total}</h2>

        <div
          style={{
            display: "flex",
            gap: "10px"
          }}
        >
          <button>PIX</button>
          <button>Dinheiro</button>
          <button>Cartão</button>
          <button className="btn-primary">
            Finalizar Venda
          </button>
        </div>
      </div>
    </div>
  );
}