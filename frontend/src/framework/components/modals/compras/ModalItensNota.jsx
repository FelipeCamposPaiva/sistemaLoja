import { useEffect, useState } from "react";

import {
  listarItensNota,
  salvarItemNota,
  excluirItemNota
} from "../../services/notaEntradaItem.service";

export default function ModalItensNota({
  aberto,
  fechar,
  notaId
}) {

  const [itens, setItens] =
    useState([]);

  const [produtoId, setProdutoId] =
    useState("");

  const [quantidade, setQuantidade] =
    useState("");

  const [valorUnitario, setValorUnitario] =
    useState("");

  useEffect(() => {

    if (
      aberto &&
      notaId
    ) {

      carregarItens();

    }

  }, [aberto, notaId]);

  async function carregarItens() {

    try {

      const dados =
        await listarItensNota(
          notaId
        );

      setItens(
        dados || []
      );

    } catch (error) {

      console.error(error);

    }

  }

  async function adicionarItem() {

    if (
      !produtoId ||
      !quantidade
    ) {

      alert(
        "Informe produto e quantidade."
      );

      return;

    }

    try {

      await salvarItemNota({

        notaEntradaId:
          notaId,

        produtoId:
          Number(
            produtoId
          ),

        quantidade:
          Number(
            quantidade
          ),

        valorUnitario:
          Number(
            valorUnitario || 0
          ),

        valorTotal:
          Number(
            quantidade
          ) *
          Number(
            valorUnitario || 0
          )

      });

      setProdutoId("");
      setQuantidade("");
      setValorUnitario("");

      carregarItens();

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao adicionar item."
      );

    }

  }

  async function remover(id) {

    if (
      !window.confirm(
        "Excluir item?"
      )
    ) {
      return;
    }

    try {

      await excluirItemNota(
        id
      );

      carregarItens();

    } catch (error) {

      console.error(error);

    }

  }

  const totalGeral =
    itens.reduce(
      (total, item) =>
        total +
        Number(
          item.valorTotal || 0
        ),
      0
    );

  if (!aberto)
    return null;

  return (

    <div className="modal-overlay">

      <div className="modal-cliente">

        <h2>
          Itens da Nota #{notaId}
        </h2>

        <div className="grid-3">

          <input
            type="number"
            placeholder="ID Produto"
            value={produtoId}
            onChange={(e) =>
              setProdutoId(
                e.target.value
              )
            }
          />

          <input
            type="number"
            placeholder="Quantidade"
            value={quantidade}
            onChange={(e) =>
              setQuantidade(
                e.target.value
              )
            }
          />

          <input
            type="number"
            step="0.01"
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
          onClick={
            adicionarItem
          }
        >
          Adicionar Item
        </button>

        <table
          style={{
            width: "100%",
            marginTop: "20px"
          }}
        >

          <thead>

            <tr>

              <th>Produto</th>
              <th>Qtd</th>
              <th>V.Unit</th>
              <th>Total</th>
              <th></th>

            </tr>

          </thead>

          <tbody>

            {itens.map(
              (item) => (

                <tr
                  key={item.id}
                >

                  <td>
                    {item.produtoId}
                  </td>

                  <td>
                    {item.quantidade}
                  </td>

                  <td>

                    {Number(
                      item.valorUnitario
                    ).toLocaleString(
                      "pt-BR",
                      {
                        style:
                          "currency",
                        currency:
                          "BRL"
                      }
                    )}

                  </td>

                  <td>

                    {Number(
                      item.valorTotal
                    ).toLocaleString(
                      "pt-BR",
                      {
                        style:
                          "currency",
                        currency:
                          "BRL"
                      }
                    )}

                  </td>

                  <td>

                    <button
                      className="btn-tabela excluir"
                      onClick={() =>
                        remover(
                          item.id
                        )
                      }
                    >
                      Excluir
                    </button>

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

        <h3
          style={{
            marginTop: "20px"
          }}
        >
          Total Geral:
          {" "}
          {totalGeral.toLocaleString(
            "pt-BR",
            {
              style:
                "currency",
              currency:
                "BRL"
            }
          )}
        </h3>

        <div
          className="acoes-modal"
        >

          <button
            onClick={fechar}
          >
            Fechar
          </button>

        </div>

      </div>

    </div>

  );

}