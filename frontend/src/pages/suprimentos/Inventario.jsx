import { useEffect, useState } from "react";

import "../../styles/pages/estoque.css";

import {
  listarInventarios,
  criarInventario
} from "../../services/inventario.service";

export default function Inventario() {

  const [inventarios, setInventarios] =
    useState([]);

  const [localId, setLocalId] =
    useState("");

  const [observacao, setObservacao] =
    useState("");

  useEffect(() => {

    carregarInventarios();

  }, []);

  async function carregarInventarios() {

    try {

      const dados =
        await listarInventarios();

      setInventarios(
        dados || []
      );

    } catch (error) {

      console.error(error);

    }

  }

  async function novoInventario() {

    if (!localId) {

      alert("Informe o Local");

      return;

    }

    try {

      await criarInventario({

        localId:
          Number(localId),

        usuarioId: 1,

        observacao

      });

      setLocalId("");
      setObservacao("");

      carregarInventarios();

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao criar inventário"
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
            Inventário
          </h1>

        </div>

      </div>

      <div className="card-movimento">

        <h3>
          Novo Inventário
        </h3>

        <div className="grid-2">

          <input
            type="number"
            placeholder="ID Local"
            value={localId}
            onChange={(e) =>
              setLocalId(
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
          onClick={novoInventario}
        >
          Criar Inventário
        </button>

      </div>

      <div className="card-tabela">

        <table>

          <thead>

            <tr>

              <th>ID</th>

              <th>Local</th>

              <th>Data</th>

              <th>Observação</th>

            </tr>

          </thead>

          <tbody>

            {inventarios.map((item) => (

              <tr key={item.id}>

                <td>
                  {item.id}
                </td>

                <td>
                  {item.localId}
                </td>

                <td>
                  {
                    item.dataInventario
                  }
                </td>

                <td>
                  {item.observacao}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}