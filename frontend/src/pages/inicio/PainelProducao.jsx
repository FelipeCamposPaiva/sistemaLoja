import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    DragDropContext,
    Draggable,
    Droppable
} from "@hello-pangea/dnd";
import {
    GripVertical,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Trash2
} from "lucide-react";

import {
    PRIORIDADES,
    gravarPainelProducao,
    lerPainelProducao,
    novoId
} from "../../constants/kanbanProducao";
import ROTAS from "../../constants/rotas";

import "../../styles/pages/kanban.css";

const CARD_VAZIO = {
    titulo: "",
    cliente: "",
    descricao: "",
    valor: "",
    prazo: "",
    responsavel: "",
    prioridade: "media",
    colunaId: ""
};

export default function PainelProducao() {
    const [painel, setPainel] = useState(lerPainelProducao);
    const [busca, setBusca] = useState("");
    const [menuColuna, setMenuColuna] = useState(null);
    const [renomear, setRenomear] = useState(null);
    const [drawer, setDrawer] = useState(null);
    const dragging = useRef(false);

    useEffect(() => {
        gravarPainelProducao(painel);
    }, [painel]);

    const texto = busca.trim().toLowerCase();
    const cardsFiltrados = useMemo(() => {
        if (!texto) {
            return painel.cards;
        }
        return painel.cards.filter((card) =>
            [card.titulo, card.cliente, card.responsavel, card.descricao]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(texto)
        );
    }, [painel.cards, texto]);

    function atualizar(proximo) {
        setPainel(proximo);
        setMenuColuna(null);
    }

    function mover(result) {
        const { destination, source, type, draggableId } = result;
        if (!destination) {
            return;
        }
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        if (type === "coluna") {
            const colunas = [...painel.colunas];
            const [movida] = colunas.splice(source.index, 1);
            colunas.splice(destination.index, 0, movida);
            atualizar({ ...painel, colunas });
            return;
        }

        const cards = painel.cards.map((item) => ({ ...item }));
        const card = cards.find((item) => item.id === draggableId);
        if (!card) {
            return;
        }
        card.colunaId = destination.droppableId;
        const daColuna = cards.filter((item) => item.colunaId === destination.droppableId && item.id !== card.id);
        const resto = cards.filter((item) => item.colunaId !== destination.droppableId && item.id !== card.id);
        daColuna.splice(destination.index, 0, card);
        atualizar({ ...painel, cards: [...resto, ...daColuna] });
    }

    function abrirNovo(colunaId) {
        setDrawer({
            ...CARD_VAZIO,
            colunaId: colunaId || painel.colunas[0]?.id || ""
        });
        setMenuColuna(null);
    }

    function salvarCard(evento) {
        evento.preventDefault();
        if (!drawer.titulo.trim()) {
            return;
        }
        const registro = {
            ...drawer,
            titulo: drawer.titulo.trim(),
            id: drawer.id || novoId("os")
        };
        const cards = drawer.id
            ? painel.cards.map((item) => (item.id === drawer.id ? registro : item))
            : [registro, ...painel.cards];
        atualizar({ ...painel, cards });
        setDrawer(null);
    }

    function excluirCard(id) {
        atualizar({ ...painel, cards: painel.cards.filter((item) => item.id !== id) });
        setDrawer(null);
    }

    function adicionarColuna() {
        const nome = `Nova coluna ${painel.colunas.length + 1}`;
        atualizar({
            ...painel,
            colunas: [...painel.colunas, { id: novoId("col"), nome, cor: "#3b82f6" }]
        });
    }

    function gravarNomeColuna(id, nome) {
        const textoNome = nome.trim();
        if (!textoNome) {
            setRenomear(null);
            return;
        }
        atualizar({
            ...painel,
            colunas: painel.colunas.map((col) => (col.id === id ? { ...col, nome: textoNome } : col))
        });
        setRenomear(null);
    }

    function excluirColuna(id) {
        atualizar({
            ...painel,
            colunas: painel.colunas.filter((col) => col.id !== id),
            cards: painel.cards.filter((card) => card.colunaId !== id)
        });
    }

    const prioridadeDe = (id) => PRIORIDADES.find((item) => item.id === id) || PRIORIDADES[1];

    return (
        <div className={`kb-page${drawer ? " has-drawer" : ""}`}>
            <div className="kb-main">
                <nav className="dash-crumb" aria-label="Trilha">
                    <Link to={ROTAS.INDICE}>início</Link>
                    <span>›</span>
                    <Link to="/ordem_servicos">serviços</Link>
                    <span>›</span>
                    <span>painel produção</span>
                </nav>
                <header className="kb-head">
                    <div>
                        <h2>Painel de Produção</h2>
                        <p>Kanban editável das ordens gráficas. Arraste cartões e colunas; clique para alterar.</p>
                    </div>
                    <button type="button" className="idx-pill kb-add" onClick={() => abrirNovo()}>
                        + Nova ordem
                    </button>
                </header>

                <div className="kb-toolbar">
                    <label className="kb-search">
                        <Search size={15} />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar ordem, cliente ou responsável"
                        />
                    </label>
                    <span className="kb-meta">{cardsFiltrados.length} ordens</span>
                </div>

                <DragDropContext
                    onDragStart={() => {
                        dragging.current = true;
                    }}
                    onDragEnd={(result) => {
                        mover(result);
                        window.setTimeout(() => {
                            dragging.current = false;
                        }, 0);
                    }}
                >
                    <Droppable droppableId="board" direction="horizontal" type="coluna">
                        {(board) => (
                            <div className="kb-board" ref={board.innerRef} {...board.droppableProps}>
                                {painel.colunas.map((coluna, indexColuna) => {
                                    const itens = cardsFiltrados.filter((card) => card.colunaId === coluna.id);
                                    return (
                                        <Draggable key={coluna.id} draggableId={`col-${coluna.id}`} index={indexColuna}>
                                            {(colDrag) => (
                                                <div
                                                    className="kb-col-wrap"
                                                    ref={colDrag.innerRef}
                                                    {...colDrag.draggableProps}
                                                >
                                                    <Droppable droppableId={coluna.id} type="card">
                                                        {(drop, snapshot) => (
                                                            <section className={`kb-col${snapshot.isDraggingOver ? " is-over" : ""}`}>
                                                                <header className="kb-col-head">
                                                                    <button
                                                                        type="button"
                                                                        className="kb-grip"
                                                                        aria-label="Mover coluna"
                                                                        {...colDrag.dragHandleProps}
                                                                    >
                                                                        <GripVertical size={14} />
                                                                    </button>
                                                                    <i style={{ background: coluna.cor }} />
                                                                    {renomear === coluna.id ? (
                                                                        <input
                                                                            className="kb-rename"
                                                                            defaultValue={coluna.nome}
                                                                            autoFocus
                                                                            onBlur={(e) => gravarNomeColuna(coluna.id, e.target.value)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter") {
                                                                                    gravarNomeColuna(coluna.id, e.currentTarget.value);
                                                                                }
                                                                                if (e.key === "Escape") {
                                                                                    setRenomear(null);
                                                                                }
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <strong>{coluna.nome}</strong>
                                                                    )}
                                                                    <em>{itens.length}</em>
                                                                    <button
                                                                        type="button"
                                                                        className="idx-more"
                                                                        aria-label={`Adicionar em ${coluna.nome}`}
                                                                        onClick={() => abrirNovo(coluna.id)}
                                                                    >
                                                                        <Plus size={15} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="idx-more"
                                                                        aria-label={`Opções de ${coluna.nome}`}
                                                                        onClick={() => setMenuColuna(menuColuna === coluna.id ? null : coluna.id)}
                                                                    >
                                                                        <MoreVertical size={15} />
                                                                    </button>
                                                                </header>
                                                                {menuColuna === coluna.id ? (
                                                                    <ul className="kb-menu">
                                                                        <li>
                                                                            <button type="button" onClick={() => { setRenomear(coluna.id); setMenuColuna(null); }}>
                                                                                <Pencil size={13} />
                                                                                Renomear coluna
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button type="button" onClick={() => excluirColuna(coluna.id)}>
                                                                                <Trash2 size={13} />
                                                                                Excluir coluna
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                ) : null}
                                                                <div
                                                                    className="kb-col-body"
                                                                    ref={drop.innerRef}
                                                                    {...drop.droppableProps}
                                                                >
                                                                    {itens.map((card, index) => {
                                                                        const prio = prioridadeDe(card.prioridade);
                                                                        return (
                                                                            <Draggable key={card.id} draggableId={card.id} index={index}>
                                                                                {(drag, dragSnap) => (
                                                                                    <article
                                                                                        className={`kb-card${dragSnap.isDragging ? " is-drag" : ""}`}
                                                                                        ref={drag.innerRef}
                                                                                        {...drag.draggableProps}
                                                                                        {...drag.dragHandleProps}
                                                                                        onClick={() => {
                                                                                            if (!dragging.current) {
                                                                                                setDrawer({ ...card });
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <b style={{ background: prio.cor }} />
                                                                                        <strong>{card.titulo}</strong>
                                                                                        <span>{card.cliente || "Sem cliente"}</span>
                                                                                        <footer>
                                                                                            <em>{card.responsavel || "—"}</em>
                                                                                            {card.valor ? <small>R$ {card.valor}</small> : null}
                                                                                            {card.prazo ? (
                                                                                                <small>
                                                                                                    {new Date(`${card.prazo}T12:00:00`).toLocaleDateString("pt-BR")}
                                                                                                </small>
                                                                                            ) : null}
                                                                                        </footer>
                                                                                    </article>
                                                                                )}
                                                                            </Draggable>
                                                                        );
                                                                    })}
                                                                    {drop.placeholder}
                                                                </div>
                                                            </section>
                                                        )}
                                                    </Droppable>
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {board.placeholder}
                                <button type="button" className="kb-add-col" onClick={adicionarColuna}>
                                    <Plus size={16} />
                                    Adicionar coluna
                                </button>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>

            {drawer ? (
                <aside className="kb-drawer" aria-label="Editar ordem">
                    <header>
                        <h3>{drawer.id ? "Editar ordem" : "Nova ordem"}</h3>
                        <button type="button" className="idx-text" onClick={() => setDrawer(null)}>
                            fechar x
                        </button>
                    </header>
                    <form onSubmit={salvarCard}>
                        <label>
                            Título
                            <input
                                value={drawer.titulo}
                                onChange={(e) => setDrawer({ ...drawer, titulo: e.target.value })}
                                required
                            />
                        </label>
                        <label>
                            Cliente
                            <input
                                value={drawer.cliente}
                                onChange={(e) => setDrawer({ ...drawer, cliente: e.target.value })}
                            />
                        </label>
                        <label>
                            Descrição
                            <textarea
                                rows={3}
                                value={drawer.descricao}
                                onChange={(e) => setDrawer({ ...drawer, descricao: e.target.value })}
                            />
                        </label>
                        <div className="kb-grid">
                            <label>
                                Valor (R$)
                                <input
                                    value={drawer.valor}
                                    onChange={(e) => setDrawer({ ...drawer, valor: e.target.value })}
                                />
                            </label>
                            <label>
                                Prazo
                                <input
                                    type="date"
                                    value={drawer.prazo}
                                    onChange={(e) => setDrawer({ ...drawer, prazo: e.target.value })}
                                />
                            </label>
                        </div>
                        <label>
                            Responsável
                            <input
                                value={drawer.responsavel}
                                onChange={(e) => setDrawer({ ...drawer, responsavel: e.target.value })}
                            />
                        </label>
                        <label>
                            Coluna
                            <select
                                value={drawer.colunaId}
                                onChange={(e) => setDrawer({ ...drawer, colunaId: e.target.value })}
                            >
                                {painel.colunas.map((col) => (
                                    <option key={col.id} value={col.id}>{col.nome}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Prioridade
                            <select
                                value={drawer.prioridade}
                                onChange={(e) => setDrawer({ ...drawer, prioridade: e.target.value })}
                            >
                                {PRIORIDADES.map((item) => (
                                    <option key={item.id} value={item.id}>{item.nome}</option>
                                ))}
                            </select>
                        </label>
                        <div className="kb-actions">
                            <button type="submit" className="idx-pill kb-add">salvar</button>
                            {drawer.id ? (
                                <button type="button" className="idx-text" onClick={() => excluirCard(drawer.id)}>
                                    excluir
                                </button>
                            ) : null}
                        </div>
                    </form>
                </aside>
            ) : null}
        </div>
    );
}
