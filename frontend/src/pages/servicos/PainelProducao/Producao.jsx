import { useEffect, useState } from "react";
import "../../styles/pages/Producao.css";
import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";

import {
  listarOS,
  atualizarStatusOS
} from "../../services/os.service";

const COLUNAS = [
  "ORÇAMENTO",
  "APROVADO",
  "ARTE",
  "AJUSTE_ARTE",
  "PRODUCAO",
  "ACABAMENTO",
  "PRONTO",
  "ENTREGUE"
];

export default function Producao() {

  const [ordens, setOrdens] = useState([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const dados = await listarOS();
      setOrdens(dados);
    } catch (erro) {
      console.error(erro);
    }
  }

  async function onDragEnd(result) {

    if (!result.destination) return;

    const osId = Number(
      result.draggableId
    );

    const novoStatus =
      result.destination.droppableId;

    try {

      await atualizarStatusOS(
        osId,
        novoStatus
      );

      carregar();

    } catch (erro) {

      console.error(erro);

    }
  }

  return (
    <div className="kanban-page">

      <div className="kanban-topo">

        <div>
          <small>produção gráfica</small>
          <h1>Kanban de Produção</h1>
        </div>

        <button className="btn-nova-os">
          + Nova Ordem
        </button>

      </div>

      <DragDropContext
        onDragEnd={onDragEnd}
      >

        <div className="kanban-board">

          {COLUNAS.map((status) => (

            <Coluna
              key={status}
              titulo={status}
              itens={ordens.filter(
                (os) => os.status === status
              )}
            />

          ))}

        </div>

      </DragDropContext>

    </div>
  );
}

function Coluna({ titulo, itens }) {

  return (

    <Droppable droppableId={titulo}>

      {(provided) => (

        <div
          className="kanban-coluna"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >

          <div className="kanban-coluna-header">

            <span>{titulo}</span>

            <div className="contador">
              {itens.length}
            </div>

          </div>

          {itens.map((os, index) => (

            <Draggable
              key={os.id}
              draggableId={String(os.id)}
              index={index}
            >

              {(provided) => (

                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                >
                  <CardOS os={os} />
                </div>

              )}

            </Draggable>

          ))}

          {provided.placeholder}

        </div>

      )}

    </Droppable>

  );
}

function CardOS({ os }) {

  return (

    <div className="kanban-card">

      <div className="os-id">
        OS #{os.id}
      </div>

      <div className="os-cliente">
        {os.cliente}
      </div>

      <div className="os-descricao">
        {os.descricao}
      </div>

      <div className="os-footer">

        <div className="os-valor">
          R$ {os.valor}
        </div>

        <div className="os-data">
          {os.dataEntrega}
        </div>

      </div>

    </div>

  );
}