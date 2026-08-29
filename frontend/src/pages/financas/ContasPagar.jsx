import { useEffect, useState } from "react";

import {
  listarContasPagar,
  salvarContaPagar,
  baixarContaPagar,
  excluirContaPagar
} from "../../services/contaPagar.service";

import "../../styles/pages/ordens-compra.css";

export default function ContasPagar() {

  const [contas, setContas] =
    useState([]);

  const [fornecedorId, setFornecedorId] =
    useState("");

  const [valor, setValor] =
    useState("");

  const [vencimento, setVencimento] =
    useState("");

  const [observacao, setObservacao] =
    useState("");

  useEffect(() => {

    carregar();

  }, []);

  async function carregar() {

    try {

      const dados =
        await listarContasPagar();

      setContas(
        dados || []
      );

    } catch (error) {

      console.error(error);

    }

  }

  async function salvar() {

    try {

      await salvarContaPagar({

        fornecedorId:
          Number(
            fornecedorId
          ),

        valor:
          Number(
            valor
          ),

        vencimento,

        observacao,

        status:
          "ABERTO"

      });

      setFornecedorId("");
      setValor("");
      setVencimento("");
      setObservacao("");

      carregar();

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao salvar."
      );

    }

  }

  async function baixar(id) {

    try {

      await baixarContaPagar(
        id
      );

      carregar();

    } catch (error) {

      console.error(error);

    }

  }

  async function excluir(id) {

    if (
      !window.confirm(
        "Excluir conta?"
      )
    ) {
      return;
    }

    try {

      await excluirContaPagar(
        id
      );

      carregar();

    } catch (error) {

      console.error(error);

    }

  }

  return (

    <div className="ordens-page">

      <div className="ordens-topo">

        <div>

          <small>
            FINANCEIRO
          </small>

          <h1>
            Contas a Pagar
          </h1>

        </div>

      </div>

      <div className="ordens-form">

        <input
          type="number"
          placeholder="Fornecedor ID"
          value={fornecedorId}
          onChange={(e) =>
            setFornecedorId(
              e.target.value
            )
          }
        />

        <input
          type="number"
          step="0.01"
          placeholder="Valor"
          value={valor}
          onChange={(e) =>
            setValor(
              e.target.value
            )
          }
        />

        <input
          type="date"
          value={vencimento}
          onChange={(e) =>
            setVencimento(
              e.target.value
            )
          }
        />

        <input
          placeholder="Observação"
          value={observacao}
          onChange={(e) =>
            setObservacao(
              e.target.value
            )
          }
        />

        <button
          className="btn-primary"
          onClick={salvar}
        >
          Salvar
        </button>

      </div>

      <div className="ordens-card">

        <table>

          <thead>

            <tr>

              <th>ID</th>
              <th>Fornecedor</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Ações</th>

            </tr>

          </thead>

          <tbody>

            {contas.map((c) => (

              <tr key={c.id}>

                <td>{c.id}</td>

                <td>
                  {c.fornecedorId}
                </td>

                <td>

                  {Number(
                    c.valor || 0
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
                  {c.vencimento}
                </td>

                <td>
                  {c.status}
                </td>

                <td>

                  {c.status !== "PAGO" && (

                    <button
                      className="btn-primary"
                      onClick={() =>
                        baixar(c.id)
                      }
                    >
                      Baixar
                    </button>

                  )}

                  <button
                    className="btn-tabela excluir"
                    onClick={() =>
                      excluir(c.id)
                    }
                  >
                    Excluir
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}