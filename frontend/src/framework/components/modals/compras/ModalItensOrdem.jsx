import { useEffect, useState } from "react";

import {
  listarItens,
  salvarItem,
  excluirItem
} from "../../services/OrdemCompraItemService";

export default function ModalItensOrdem({
  aberto,
  fechar,
  ordemId
}) {

  const [itens, setItens] = useState([]);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");

  useEffect(() => {

    if (aberto && ordemId) {
      carregarItens();
    }

  }, [aberto, ordemId]);

  async function carregarItens() {

    const dados =
      await listarItens(ordemId);

    setItens(dados || []);

  }

  async function adicionarItem() {

    await salvarItem({
      ordemId,
      produtoId: Number(produtoId),
      quantidade: Number(quantidade),
      valorUnitario: Number(valorUnitario || 0),
      valorTotal:
        Number(quantidade) *
        Number(valorUnitario || 0)
    });

    setProdutoId("");
    setQuantidade("");
    setValorUnitario("");

    carregarItens();

  }

  async function remover(id) {

    await excluirItem(id);

    carregarItens();

  }

  if (!aberto) return null;

  const totalGeral =
    itens.reduce(
      (t, i) =>
        t +
        Number(i.valorTotal || 0),
      0
    );

  return (

    <div className="modal-overlay">

      <div className="modal-cliente">

        <h2>
          Itens da Ordem #{ordemId}
        </h2>

        <div className="grid-3">

          <input
            placeholder="ID Produto"
            value={produtoId}
            onChange={(e) =>
              setProdutoId(
                e.target.value
              )
            }
          />

          <input
            placeholder="Quantidade"
            value={quantidade}
            onChange={(e) =>
              setQuantidade(
                e.target.value
              )
            }
          />

          <input
            placeholder="Valor Unitário"
            value={valorUnitario}
            onChange={(e) =>
              setValorUnitario(
                e.target.value
              )
            }
          />

        </div>

        <button
          className="btn-primary"
          onClick={adicionarItem}
        >
          Adicionar Item
        </button>

        <table style={{ width: "100%", marginTop: 20 }}>

          <thead>

            <tr>
              <th>Produto</th>
              <th>Qtd</th>
              <th>Valor</th>
              <th>Total</th>
              <th></th>
            </tr>

          </thead>

          <tbody>

            {itens.map((item) => (

              <tr key={item.id}>

                <td>{item.produtoId}</td>

                <td>{item.quantidade}</td>

                <td>{item.valorUnitario}</td>

                <td>{item.valorTotal}</td>

                <td>

                  <button
                    className="btn-tabela excluir"
                    onClick={() =>
                      remover(item.id)
                    }
                  >
                    Excluir
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

        <h3>

          Total Geral:

          {" "}

          {totalGeral.toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL"
            }
          )}

        </h3>

        <div className="acoes-modal">

          <button onClick={fechar}>
            Fechar
          </button>

        </div>

      </div>

    </div>

  );

}