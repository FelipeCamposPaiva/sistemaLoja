import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    DragDropContext,
    Draggable,
    Droppable
} from "@hello-pangea/dnd";

import { SETORES_OS, setorPorStatus } from "../../../constants/tecnicos";
import { moeda, nomesTecnicos } from "../../../constants/ordensServico";
import { atualizarOS, listarOS } from "../../../services/os.service";
import ROTAS from "../../../constants/rotas";

import "../../../styles/pages/producao.css";
import "../../../styles/pages/os.css";

export default function Producao() {
    const navigate = useNavigate();
    const [ordens, setOrdens] = useState([]);
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        try {
            setOrdens(await listarOS());
        } catch (erro) {
            console.error(erro);
            setOrdens([]);
            setAviso("Não foi possível ler as ordens de serviço.");
        }
    }

    async function onDragEnd(result) {
        if (!result.destination) {
            return;
        }
        const os = ordens.find((item) => String(item.id) === result.draggableId);
        const setor = SETORES_OS.find((s) => s.id === result.destination.droppableId);
        if (!os || !setor) {
            return;
        }
        try {
            await atualizarOS(os.id, {
                ...os,
                status: setor.status,
                setorAtual: setor.id,
                historicoWorkflow: [
                    ...(os.historicoWorkflow || []),
                    { setor: setor.id, status: setor.status, em: new Date().toISOString() }
                ]
            });
            await carregar();
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível encaminhar a OS.");
        }
    }

    return (
        <div className="kanban-page os-page">
            <div className="kanban-topo">
                <div>
                    <small>serviços</small>
                    <h1>Painel de produção</h1>
                    <p>Encaminhe a OS entre setores. Os técnicos da ordem aparecem no card.</p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <button type="button" className="btn-nova-os" onClick={() => navigate(`${ROTAS.ORDEM_SERVICO}#add`)}>
                    + Nova ordem
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="kanban-board">
                    {SETORES_OS.map((setor) => (
                        <Coluna
                            key={setor.id}
                            setor={setor}
                            itens={ordens.filter((os) => setorPorStatus(os.setorAtual || os.status).id === setor.id)}
                        />
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}

function Coluna({ setor, itens }) {
    return (
        <Droppable droppableId={setor.id}>
            {(provided) => (
                <div className="kanban-coluna" ref={provided.innerRef} {...provided.droppableProps}>
                    <div className="kanban-coluna-header">
                        <span>{setor.label}</span>
                        <div className="contador">{itens.length}</div>
                    </div>
                    {itens.map((os, index) => (
                        <Draggable key={os.id} draggableId={String(os.id)} index={index}>
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
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
    const setor = setorPorStatus(os.setorAtual || os.status);
    return (
        <Link className="kanban-card" to={`${ROTAS.ORDEM_SERVICO}#edit/${os.id}`}>
            <div className="os-id">OS #{os.numero || os.id}</div>
            <div className="os-cliente">{os.cliente}</div>
            <div className="os-descricao">{os.descricao}</div>
            <div className="os-tecnicos-mini">{nomesTecnicos(os) || setor.label}</div>
            <div className="os-footer">
                <div className="os-valor">R$ {moeda(os.valor)}</div>
                <div className="os-data">{os.dataPrevisao || ""}</div>
            </div>
        </Link>
    );
}
