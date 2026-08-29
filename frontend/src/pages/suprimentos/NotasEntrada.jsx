import { useEffect, useState } from "react";

import {
  listarNotas,
  salvarNota,
  excluirNota,
  confirmarNota
} from "../../services/notaEntrada.service";

import ModalItensNota from "../../components/modals/compras/ModalItensNota";

import "../../styles/pages/ordens-compra.css";

export default function NotasEntrada() {

  const [notas, setNotas] =
    useState([]);

  const [numeroNf, setNumeroNf] =
    useState("");

  const [fornecedorId, setFornecedorId] =
    useState("");

  const [ordemCompraId, setOrdemCompraId] =
    useState("");

  const [valorTotal, setValorTotal] =
    useState("");

  const [observacao, setObservacao] =
    useState("");

  const [modalAberto, setModalAberto] =
    useState(false);

  const [notaSelecionada, setNotaSelecionada] =
    useState(null);

  useEffect(() => {

    carregarNotas();

  }, []);

  async function carregarNotas() {

    try {

      const dados =
        await listarNotas();

      setNotas(
        dados || []
      );

    } catch (error) {

      console.error(error);

    }

  }

  async function salvar() {

    if (!numeroNf) {

      alert(
        "Informe o número da NF."
      );

      return;

    }

    try {

      await salvarNota({

        numeroNf,

        fornecedorId:
          fornecedorId
            ? Number(
                fornecedorId
              )
            : null,

        ordemCompraId:
          ordemCompraId
            ? Number(
                ordemCompraId
              )
            : null,

        valorTotal:
          Number(
            valorTotal || 0
          ),

        observacao

      });

      setNumeroNf("");
      setFornecedorId("");
      setOrdemCompraId("");
      setValorTotal("");
      setObservacao("");

      carregarNotas();

      alert(
        "Nota lançada com sucesso!"
      );

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao salvar nota."
      );

    }

  }

  async function excluir(id) {

    if (
      !window.confirm(
        "Excluir nota?"
      )
    ) {
      return;
    }

    try {

      await excluirNota(id);

      carregarNotas();

    } catch (error) {

      console.error(error);

    }

  }

  async function confirmar(id) {

    if (
      !window.confirm(
        "Confirmar nota?"
      )
    ) {
      return;
    }

    try {

      await confirmarNota(id);

      carregarNotas();

      alert(
        "Nota confirmada!"
      );

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao confirmar."
      );

    }

  }

  function abrirItens(id) {

    setNotaSelecionada(id);

    setModalAberto(true);

  }

  return (

    <div className="ordens-page">

      <div className="ordens-topo">

        <div>

          <small>
            SUPRIMENTOS
          </small>

          <h1>
            Notas de Entrada
          </h1>

        </div>

      </div>

      <div className="ordens-form">

        <input
          placeholder="Número NF"
          value={numeroNf}
          onChange={(e) =>
            setNumeroNf(
              e.target.value
            )
          }
        />

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
          placeholder="Ordem Compra ID"
          value={ordemCompraId}
          onChange={(e) =>
            setOrdemCompraId(
              e.target.value
            )
          }
        />

        <input
          type="number"
          step="0.01"
          placeholder="Valor Total"
          value={valorTotal}
          onChange={(e) =>
            setValorTotal(
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
          Lançar Nota
        </button>

      </div>

      <div className="ordens-card">

        <table>

          <thead>

            <tr>

              <th>ID</th>
              <th>NF</th>
              <th>Fornecedor</th>
              <th>OC</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data Entrada</th>
              <th>Ações</th>

            </tr>

          </thead>

          <tbody>

            {notas.length === 0 ? (

              <tr>

                <td colSpan="8">

                  Nenhuma nota encontrada

                </td>

              </tr>

            ) : (

              notas.map((n) => (

                <tr key={n.id}>

                  <td>{n.id}</td>

                  <td>{n.numeroNf}</td>

                  <td>{n.fornecedorId}</td>

                  <td>{n.ordemCompraId}</td>

                  <td>

                    {Number(
                      n.valorTotal || 0
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

                    <span
                      className={
                        n.status === "RECEBIDA"
                          ? "badge-recebida"
                          : "badge-aberta"
                      }
                    >
                      {n.status}
                    </span>

                  </td>

                  <td>

                    {n.dataEntrada
                      ? new Date(
                          n.dataEntrada
                        ).toLocaleString(
                          "pt-BR"
                        )
                      : "-"}

                  </td>

                  <td>

                    <button
                      className="btn-outline"
                      onClick={() =>
                        abrirItens(
                          n.id
                        )
                      }
                    >
                      Itens
                    </button>

                    {n.status !== "RECEBIDA" && (

                      <button
                        className="btn-primary"
                        onClick={() =>
                          confirmar(
                            n.id
                          )
                        }
                      >
                        Confirmar
                      </button>

                    )}

                    <button
                      className="btn-tabela excluir"
                      onClick={() =>
                        excluir(
                          n.id
                        )
                      }
                    >
                      Excluir
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      <ModalItensNota
        aberto={modalAberto}
        fechar={() =>
          setModalAberto(false)
        }
        notaId={
          notaSelecionada
        }
      />

    </div>

  );

}