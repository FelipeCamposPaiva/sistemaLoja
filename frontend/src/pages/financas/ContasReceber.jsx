import { useEffect, useState } from "react";

import {
  listarContasReceber,
  salvarContaReceber,
  receberConta,
  excluirContaReceber
} from "../../services/contaReceber.service";

import "../../styles/pages/ordens-compra.css";

export default function ContasReceber() {

  const [contas, setContas] =
    useState([]);

  const [clienteId, setClienteId] =
    useState("");

  const [valor, setValor] =
    useState("");

  const [vencimento, setVencimento] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  useEffect(() => {

    carregar();

  }, []);

  async function carregar() {

    try {

      const dados =
        await listarContasReceber();

      setContas(
        dados || []
      );

    } catch (error) {

      console.error(error);

    }

  }

  async function salvar() {

    try {

      await salvarContaReceber({

        clienteId:
          Number(clienteId),

        descricao,

        valor:
          Number(valor),

        vencimento,

        status:
          "ABERTO"

      });

      setClienteId("");
      setDescricao("");
      setValor("");
      setVencimento("");

      carregar();

    } catch (error) {

      console.error(error);

    }

  }

  async function receber(id) {

    try {

      await receberConta(id);

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

      await excluirContaReceber(
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
            Contas a Receber
          </h1>

        </div>

      </div>

      <div className="ordens-form">

        <input
          type="number"
          placeholder="Cliente ID"
          value={clienteId}
          onChange={(e) =>
            setClienteId(
              e.target.value
            )
          }
        />

        <input
          placeholder="Descrição"
          value={descricao}
          onChange={(e) =>
            setDescricao(
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
              <th>Cliente</th>
              <th>Descrição</th>
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
                  {c.clienteId}
                </td>

                <td>
                  {c.descricao}
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

                  {c.status !== "RECEBIDO" && (

                    <button
                      className="btn-primary"
                      onClick={() =>
                        receber(c.id)
                      }
                    >
                      Receber
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