import { useEffect, useState } from "react";

import "../../styles/pages/estoque.css";

import {
  listarMovimentacoes,
  salvarMovimentacao as salvarAPI
} from "../../services/movimentacao.service";

import {
  listarProdutos
} from "../../services/produto.service";

export default function ControleEstoques() {

  const [movimentacoes, setMovimentacoes] =
    useState([]);

  const [produtos, setProdutos] =
    useState([]);

  const [produto, setProduto] =
    useState("");

  const [tipo, setTipo] =
    useState("ENTRADA");

  const [quantidade, setQuantidade] =
    useState("");

  const [observacao, setObservacao] =
    useState("");

  useEffect(() => {

    carregarMovimentacoes();
    carregarProdutos();

  }, []);

  async function carregarMovimentacoes() {

    try {

      const dados =
        await listarMovimentacoes();

      setMovimentacoes(
        dados || []
      );

    } catch (error) {

      console.error(error);

    }

  }

  async function carregarProdutos() {

    try {

      const dados =
        await listarProdutos();

      setProdutos(
        dados || []
      );

    } catch (error) {

      console.error(error);

    }

  }

  function nomeProduto(id) {

    const produtoEncontrado =
      produtos.find(
        p => p.id === id
      );

    return produtoEncontrado
      ? produtoEncontrado.nome
      : id;

  }

  async function salvarMovimentacao() {

    if (!produto) {

      alert(
        "Selecione um produto"
      );

      return;

    }

    if (!quantidade) {

      alert(
        "Informe a quantidade"
      );

      return;

    }

    try {

      const movimentacao = {

        produtoId:
          Number(produto),

        tipo,

        quantidade:
          Number(quantidade),

        observacao,

        dataMovimento:
          new Date()

      };

      await salvarAPI(
        movimentacao
      );

      setProduto("");
      setQuantidade("");
      setObservacao("");

      carregarMovimentacoes();

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao salvar movimentação"
      );

    }

  }

  return (

    <div className="estoque-page">

      <div className="estoque-topo">

        <div>

          <small>
            SUPRIMENTOS
          </small>

          <h1>
            Controle de Estoque
          </h1>

        </div>

      </div>

      <div className="estoque-resumo">

        <div className="card-resumo">

          <span>
            Movimentações
          </span>

          <h2>
            {movimentacoes.length}
          </h2>

        </div>

      </div>

      <div className="card-movimento">

        <h3>
          Nova Movimentação
        </h3>

        <div className="grid-2">

          <select
            value={produto}
            onChange={(e) =>
              setProduto(
                e.target.value
              )
            }
          >

            <option value="">
              Selecione o Produto
            </option>

            {produtos.map(
              (p) => (

                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.nome}
                </option>

              )
            )}

          </select>

          <select
            value={tipo}
            onChange={(e) =>
              setTipo(
                e.target.value
              )
            }
          >

            <option value="ENTRADA">
              Entrada
            </option>

            <option value="SAIDA">
              Saída
            </option>

            <option value="TRANSFERENCIA">
              Transferência
            </option>

          </select>

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
            placeholder="Observação"
            value={observacao}
            onChange={(e) =>
              setObservacao(
                e.target.value
              )
            }
          />

        </div>

        <button
          className="btn-primary"
          onClick={
            salvarMovimentacao
          }
        >
          Salvar Movimentação
        </button>

      </div>

      <div className="card-tabela">

        <table>

          <thead>

            <tr>

              <th>ID</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Observação</th>
              <th>Data</th>

            </tr>

          </thead>

          <tbody>

            {movimentacoes.length === 0 ? (

              <tr>

                <td colSpan="6">
                  Nenhuma movimentação
                </td>

              </tr>

            ) : (

              movimentacoes.map(
                (item) => (

                  <tr key={item.id}>

                    <td>
                      {item.id}
                    </td>

                    <td>
                      {nomeProduto(
                        item.produtoId
                      )}
                    </td>

                    <td>
                      {item.tipo}
                    </td>

                    <td>
                      {item.quantidade}
                    </td>

                    <td>
                      {item.observacao}
                    </td>

                    <td>
                      {item.dataMovimento
                        ? new Date(
                            item.dataMovimento
                          ).toLocaleString(
                            "pt-BR"
                          )
                        : "-"
                      }
                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

}