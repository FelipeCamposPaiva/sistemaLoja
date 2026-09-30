import { useEffect, useState } from "react";

import {
  listarOrdensCompra,
  salvarOrdemCompra,
  excluirOrdemCompra,
  receberOrdem
} from "../../services/ordemCompra.service";

import ModalItensOrdem from "../../framework/components/modals/compras/ModalItensOrdem";

import "../../styles/pages/ordens-compra.css";

export default function OrdensCompra() {

  const [ordens, setOrdens] =
    useState([]);

  const [fornecedorId, setFornecedorId] =
    useState("");

  const [observacao, setObservacao] =
    useState("");

  const [modalItensAberto, setModalItensAberto] =
    useState(false);

  const [ordemSelecionada, setOrdemSelecionada] =
    useState(null);

  useEffect(() => {

    carregarOrdens();

  }, []);

  async function carregarOrdens() {

    try {

      const dados =
        await listarOrdensCompra();

      setOrdens(
        dados || []
      );

    } catch (error) {

      console.error(error);

    }

  }

  async function salvar() {

    if (!fornecedorId) {

      alert(
        "Informe o fornecedor."
      );

      return;

    }

    try {

      await salvarOrdemCompra({

        fornecedorId:
          Number(
            fornecedorId
          ),

        observacao,

        valorTotal: 0

      });

      setFornecedorId("");
      setObservacao("");

      carregarOrdens();

      alert(
        "Ordem criada com sucesso!"
      );

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao criar ordem."
      );

    }

  }

  async function excluir(id) {

    if (
      !window.confirm(
        "Deseja excluir esta ordem?"
      )
    ) {
      return;
    }

    try {

      await excluirOrdemCompra(
        id
      );

      carregarOrdens();

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao excluir."
      );

    }

  }

  async function receber(id) {

    if (
      !window.confirm(
        "Confirmar recebimento da mercadoria?"
      )
    ) {
      return;
    }

    try {

      await receberOrdem(id);

      alert(
        "Mercadoria recebida com sucesso!"
      );

      carregarOrdens();

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao receber mercadoria."
      );

    }

  }

  function abrirItens(ordemId) {

    setOrdemSelecionada(
      ordemId
    );

    setModalItensAberto(
      true
    );

  }

  return (

    <div className="ordens-page">

      <div className="ordens-topo">

        <div>

          <small>
            SUPRIMENTOS
          </small>

          <h1>
            Ordens de Compra
          </h1>

        </div>

      </div>

      <div className="ordens-form">

        <input
          type="number"
          placeholder="ID Fornecedor"
          value={fornecedorId}
          onChange={(e) =>
            setFornecedorId(
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
          Criar Ordem
        </button>

      </div>

      <div className="ordens-card">

        <table>

          <thead>

            <tr>

              <th>ID</th>

              <th>Fornecedor</th>

              <th>Status</th>

              <th>Data Emissão</th>

              <th>Ações</th>

            </tr>

          </thead>

          <tbody>

            {ordens.length === 0 ? (

              <tr>

                <td colSpan="5">

                  Nenhuma ordem encontrada

                </td>

              </tr>

            ) : (

              ordens.map((o) => (

                <tr key={o.id}>

                  <td>
                    {o.id}
                  </td>

                  <td>
                    {o.fornecedorId}
                  </td>

                  <td>

                    <span
                      className={
                        o.status === "RECEBIDA"
                          ? "badge-recebida"
                          : "badge-aberta"
                      }
                    >
                      {o.status}
                    </span>

                  </td>

                  <td>

                    {o.dataEmissao
                      ? new Date(
                          o.dataEmissao
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
                          o.id
                        )
                      }
                    >
                      Itens
                    </button>

                    {o.status !== "RECEBIDA" && (

                      <button
                        className="btn-primary"
                        onClick={() =>
                          receber(
                            o.id
                          )
                        }
                      >
                        Receber
                      </button>

                    )}

                    <button
                      className="btn-tabela excluir"
                      onClick={() =>
                        excluir(
                          o.id
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

      <ModalItensOrdem
        aberto={
          modalItensAberto
        }
        fechar={() =>
          setModalItensAberto(
            false
          )
        }
        ordemId={
          ordemSelecionada
        }
      />

    </div>

  );

}