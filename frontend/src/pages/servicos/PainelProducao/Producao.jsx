import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
    BarChart3,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Cog,
    FileText,
    Gift,
    Image as ImageIcon,
    Package,
    Palette,
    Plus,
    Scissors,
    Search,
    SlidersHorizontal,
    Truck
} from "lucide-react";

import {
    MESES,
    codigoStatus,
    dataBr,
    isoDate,
    moeda,
    totalLiquido
} from "../../../constants/ordensServico";
import { SETORES_OS, setorPorStatus } from "../../../constants/tecnicos";
import ROTAS from "../../../constants/rotas";
import { atualizarOS, listarOS } from "../../../services/os.service";

import "../../../styles/pages/painel-producao.css";

const QUADRO = [
    { id: "ORCAMENTO", label: "Orçamento", cor: "#f5a524", Icone: FileText },
    { id: "APROVADO", label: "Aprovado", cor: "#22c55e", Icone: CheckCircle2 },
    { id: "ARTE", label: "Arte", cor: "#a855f7", Icone: Palette },
    { id: "AJUSTE_ARTE", label: "Ajuste de arte", cor: "#eab308", Icone: ImageIcon },
    { id: "PRODUCAO", label: "Produção", cor: "#3b82f6", Icone: Cog },
    { id: "ACABAMENTO", label: "Acabamento", cor: "#ec4899", Icone: Scissors },
    { id: "PRONTO", label: "Pronto", cor: "#22c55e", Icone: Package },
    { id: "ENTREGUE", label: "Entrega", cor: "#3b82f6", Icone: Truck }
];

const ANDAMENTO = new Set(["ARTE", "AJUSTE_ARTE", "PRODUCAO", "ACABAMENTO"]);
const CONCLUIDOS = new Set(["PRONTO", "ENTREGUE"]);
const FECHADOS = new Set(["PRONTO", "ENTREGUE", "CANCELADA", "NAO_APROVADA", "FINALIZADA"]);
const OCULTAS = new Set(["CANCELADA", "NAO_APROVADA"]);
const LOTE = 40;

const ROTULO = Object.fromEntries(QUADRO.map((coluna) => [coluna.id, coluna]));

function mesDe(iso) {
    return String(iso || "").slice(0, 7);
}

function mesAnterior(iso) {
    const [ano, mes] = String(iso || "").split("-").map(Number);
    const data = new Date(ano, (mes || 1) - 2, 1);
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function diasAntes(iso, dias) {
    const [ano, mes, dia] = String(iso || "").split("-").map(Number);
    const data = new Date(ano, (mes || 1) - 1, dia || 1);
    data.setDate(data.getDate() - dias);
    return isoDate(data);
}

function rotuloDia(iso) {
    const [ano, mes, dia] = String(iso || "").split("-");
    const nome = MESES[Number(mes) - 1] || "";
    const texto = `${dia} de ${nome} de ${ano}`;
    return iso === isoDate(new Date()) ? `Hoje, ${texto}` : texto;
}

function setorDa(os) {
    return setorPorStatus(os?.setorAtual || os?.status).id;
}

function noPainel(os) {
    return !OCULTAS.has(codigoStatus(os?.status));
}

function resumo(os) {
    const item = (os?.itens || []).map((linha) => linha?.descricao).find(Boolean);
    return item || os?.descricao || os?.equipamento || "Sem descrição";
}

function valorDa(os) {
    if ((os?.itens || []).length) {
        const liquido = totalLiquido(os);
        if (liquido > 0) {
            return liquido;
        }
    }
    return Number(os?.valor || 0);
}

function miniatura(os) {
    const anexo = (os?.anexos || []).find((item) => /^data:image|^https?:/i.test(String(item?.dataUrl || item?.url || "")));
    if (anexo) {
        return anexo.dataUrl || anexo.url;
    }
    const item = (os?.itens || []).find((linha) => linha?.imagem || linha?.foto);
    return item?.imagem || item?.foto || "";
}

function atrasada(os, ref) {
    if (FECHADOS.has(setorDa(os)) || FECHADOS.has(codigoStatus(os?.status))) {
        return false;
    }
    return Boolean(os?.dataPrevisao) && os.dataPrevisao < ref;
}

function concluidaNoMes(os, mes) {
    if (os?.dataConclusao) {
        return mesDe(os.dataConclusao) === mes;
    }
    return CONCLUIDOS.has(setorDa(os)) && mesDe(os?.dataAbertura) === mes;
}

function entregueNoDia(os, ref) {
    if (setorDa(os) !== "ENTREGUE" && codigoStatus(os?.status) !== "FINALIZADA") {
        return false;
    }
    return os?.dataConclusao === ref || (!os?.dataConclusao && os?.dataAbertura === ref);
}

function variacao(atual, anterior) {
    if (!anterior && !atual) {
        return 0;
    }
    if (!anterior) {
        return 100;
    }
    return Math.round(((atual - anterior) / anterior) * 100);
}

function deltaComparado(atual, anterior) {
    const diff = atual - anterior;
    if (!diff && !anterior) {
        return null;
    }
    if (anterior >= 8) {
        const pct = variacao(atual, anterior);
        if (Math.abs(pct) <= 100) {
            return { texto: textoDelta(pct, true), valor: pct };
        }
    }
    if (!diff) {
        return null;
    }
    return { texto: textoDelta(diff, false), valor: diff };
}

function textoDelta(valor, percentual) {
    const sinal = valor > 0 ? "+" : "";
    return percentual ? `${sinal}${valor}%` : `${sinal}${valor}`;
}

function classeDelta(valor, invertido) {
    if (!valor) {
        return "is-neutro";
    }
    const bom = invertido ? valor < 0 : valor > 0;
    return bom ? "is-up" : "is-down";
}

export default function Producao() {
    const navigate = useNavigate();
    const dataInput = useRef(null);
    const filtroRef = useRef(null);
    const arrastou = useRef(false);
    const [ordens, setOrdens] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [aviso, setAviso] = useState("");
    const [busca, setBusca] = useState("");
    const [dataRef, setDataRef] = useState(() => isoDate(new Date()));
    const [setorId, setSetorId] = useState("");
    const [soAtrasadas, setSoAtrasadas] = useState(false);
    const [recorte, setRecorte] = useState("");
    const [filtrosAbertos, setFiltrosAbertos] = useState(false);
    const [lotes, setLotes] = useState({});

    useEffect(() => {
        carregar();
    }, []);

    useEffect(() => {
        function fechar(evento) {
            if (filtroRef.current && !filtroRef.current.contains(evento.target)) {
                setFiltrosAbertos(false);
            }
        }
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, []);

    async function carregar() {
        setCarregando(true);
        try {
            setOrdens(await listarOS());
            setAviso("");
        } catch (erro) {
            console.error(erro);
            setOrdens([]);
            setAviso("Não foi possível ler as ordens de serviço.");
        } finally {
            setCarregando(false);
        }
    }

    const painel = useMemo(() => ordens.filter(noPainel), [ordens]);
    const mes = mesDe(dataRef);
    const anterior = mesAnterior(dataRef);

    const kpis = useMemo(() => {
        const abertasMes = painel.filter((os) => mesDe(os.dataAbertura) === mes).length;
        const abertasAntes = painel.filter((os) => mesDe(os.dataAbertura) === anterior).length;
        const andamento = painel.filter((os) => ANDAMENTO.has(setorDa(os)));
        const entraramHoje = andamento.filter((os) => (os.historicoWorkflow || []).some((passo) => {
            const setor = setorPorStatus(passo.setor || passo.status).id;
            return isoDate(passo.em) === dataRef && ANDAMENTO.has(setor);
        })).length;
        const concluidas = painel.filter((os) => concluidaNoMes(os, mes)).length;
        const concluidasAntes = painel.filter((os) => concluidaNoMes(os, anterior)).length;
        const atrasadas = painel.filter((os) => atrasada(os, dataRef));
        const limite = diasAntes(dataRef, 7);
        const atrasadasRecentes = atrasadas.filter((os) => os.dataPrevisao >= limite).length;
        const entreguesHoje = painel.filter((os) => entregueNoDia(os, dataRef)).length;
        return {
            total: painel.length,
            totalDelta: deltaComparado(abertasMes, abertasAntes),
            andamento: andamento.length,
            andamentoDelta: entraramHoje ? { texto: textoDelta(entraramHoje, false), valor: entraramHoje } : null,
            concluidas,
            concluidasDelta: deltaComparado(concluidas, concluidasAntes),
            atrasadas: atrasadas.length,
            atrasadasDelta: atrasadasRecentes
                ? { texto: textoDelta(atrasadasRecentes, false), valor: atrasadasRecentes }
                : null,
            entreguesHoje
        };
    }, [painel, mes, anterior, dataRef]);

    const texto = busca.trim().toLowerCase();

    function casaBusca(os) {
        if (!texto) {
            return true;
        }
        const itens = (os.itens || []).map((linha) => linha?.descricao).join(" ");
        return [os.numero, os.id, os.cliente, os.fantasia, os.descricao, os.equipamento, itens]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(texto);
    }

    function cardEntra(os) {
        if (!casaBusca(os)) {
            return false;
        }
        if ((soAtrasadas || recorte === "atrasadas") && !atrasada(os, dataRef)) {
            return false;
        }
        if (recorte === "concluidas" && !concluidaNoMes(os, mes)) {
            return false;
        }
        if (recorte === "hoje" && !entregueNoDia(os, dataRef)) {
            return false;
        }
        return true;
    }

    function colunaEntra(id) {
        if (setorId && id !== setorId) {
            return false;
        }
        if (recorte === "andamento" && !ANDAMENTO.has(id)) {
            return false;
        }
        if (recorte === "concluidas" && !CONCLUIDOS.has(id)) {
            return false;
        }
        if (recorte === "hoje" && id !== "ENTREGUE") {
            return false;
        }
        return true;
    }

    const colunas = useMemo(() => {
        return QUADRO.filter((coluna) => colunaEntra(coluna.id)).map((coluna) => ({
            ...coluna,
            itens: painel.filter((os) => setorDa(os) === coluna.id && cardEntra(os))
        }));
    }, [painel, texto, setorId, soAtrasadas, recorte, dataRef, mes]);

    function alternarRecorte(id) {
        setRecorte((atual) => (atual === id ? "" : id));
        setFiltrosAbertos(false);
    }

    function limparFiltros() {
        setSetorId("");
        setSoAtrasadas(false);
        setRecorte("");
        setBusca("");
        setFiltrosAbertos(false);
    }

    async function onDragEnd(result) {
        const mudou = result.destination && result.destination.droppableId !== result.source.droppableId;
        if (!mudou) {
            return;
        }
        arrastou.current = true;
        setTimeout(() => {
            arrastou.current = false;
        }, 80);
        const os = ordens.find((item) => String(item.id) === result.draggableId);
        const destino = SETORES_OS.find((setor) => setor.id === result.destination.droppableId);
        if (!os || !destino) {
            return;
        }
        const historicoWorkflow = [
            ...(os.historicoWorkflow || []),
            { setor: destino.id, status: destino.status, em: new Date().toISOString() }
        ];
        const atualizada = {
            ...os,
            status: destino.status,
            setorAtual: destino.id,
            dataConclusao: destino.id === "ENTREGUE" ? (os.dataConclusao || dataRef) : os.dataConclusao,
            historicoWorkflow
        };
        setOrdens((lista) => lista.map((item) => (item.id === os.id ? atualizada : item)));
        try {
            await atualizarOS(os.id, atualizada);
            setAviso("");
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível encaminhar a OS.");
            carregar();
        }
    }

    function abrir(os) {
        if (arrastou.current) {
            return;
        }
        navigate(`${ROTAS.ORDEM_SERVICO}#edit/${os.id}`);
    }

    const filtrosAtivos = Boolean(setorId || soAtrasadas || recorte || texto);

    return (
        <div className="pp-page">
            <header className="pp-head">
                <div>
                    <nav className="dash-crumb" aria-label="Trilha">
                        <Link to={ROTAS.INDICE}>Início</Link>
                        <ChevronRight size={12} />
                        <span>Serviços</span>
                        <ChevronRight size={12} />
                        <span className="is-current">Painel de produção</span>
                    </nav>
                    <div className="pp-title">
                        <span className="pp-title-ico" aria-hidden="true">
                            <BarChart3 size={22} />
                        </span>
                        <div>
                            <h1>Painel de Produção</h1>
                            <p>Acompanhe o andamento das ordens de produção entre os setores.</p>
                        </div>
                    </div>
                </div>
                <div className="pp-tools">
                    <label className="pp-data">
                        <CalendarDays size={16} />
                        <span>{rotuloDia(dataRef)}</span>
                        <input
                            ref={dataInput}
                            type="date"
                            value={dataRef}
                            aria-label="Data de referência dos indicadores"
                            onChange={(evento) => setDataRef(evento.target.value || isoDate(new Date()))}
                        />
                    </label>
                    <label className="pp-busca">
                        <Search size={16} />
                        <input
                            value={busca}
                            onChange={(evento) => setBusca(evento.target.value)}
                            placeholder="Buscar OS, cliente ou produto..."
                            aria-label="Buscar OS, cliente ou produto"
                        />
                    </label>
                    <div className="pp-filtro-wrap" ref={filtroRef}>
                        <button
                            type="button"
                            className={setorId || soAtrasadas ? "is-on" : ""}
                            onClick={() => setFiltrosAbertos((aberto) => !aberto)}
                        >
                            <SlidersHorizontal size={16} />
                            Filtros
                        </button>
                        {filtrosAbertos ? (
                            <div className="pp-pop" role="dialog" aria-label="Filtros do painel">
                                <label>
                                    Setor
                                    <select value={setorId} onChange={(evento) => setSetorId(evento.target.value)}>
                                        <option value="">Todos os setores</option>
                                        {QUADRO.map((coluna) => (
                                            <option key={coluna.id} value={coluna.id}>{coluna.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="pp-check">
                                    <input
                                        type="checkbox"
                                        checked={soAtrasadas}
                                        onChange={(evento) => setSoAtrasadas(evento.target.checked)}
                                    />
                                    Somente atrasadas
                                </label>
                                <button type="button" onClick={limparFiltros}>Limpar filtros</button>
                            </div>
                        ) : null}
                    </div>
                    <button type="button" className="pp-nova" onClick={() => navigate(`${ROTAS.ORDEM_SERVICO}#add`)}>
                        <Plus size={16} />
                        Nova OS
                    </button>
                </div>
            </header>

            {aviso ? <p className="pp-aviso" role="status">{aviso}</p> : null}

            <section className="pp-kpis" aria-label="Indicadores">
                <Kpi
                    icone={FileText}
                    tom="rosa"
                    titulo="Total de OS"
                    valor={carregando ? "—" : kpis.total}
                    delta={carregando ? "" : kpis.totalDelta?.texto}
                    deltaClasse={classeDelta(kpis.totalDelta?.valor)}
                    legenda="Em produção este mês"
                    ativo={false}
                    onClick={() => setRecorte("")}
                />
                <Kpi
                    icone={Cog}
                    tom="azul"
                    titulo="Em produção"
                    valor={carregando ? "—" : kpis.andamento}
                    delta={carregando ? "" : kpis.andamentoDelta?.texto}
                    deltaClasse={classeDelta(kpis.andamentoDelta?.valor)}
                    legenda="Em andamento agora"
                    ativo={recorte === "andamento"}
                    onClick={() => alternarRecorte("andamento")}
                />
                <Kpi
                    icone={CheckCircle2}
                    tom="verde"
                    titulo="Concluídas"
                    valor={carregando ? "—" : kpis.concluidas}
                    delta={carregando ? "" : kpis.concluidasDelta?.texto}
                    deltaClasse={classeDelta(kpis.concluidasDelta?.valor)}
                    legenda="Finalizadas este mês"
                    ativo={recorte === "concluidas"}
                    onClick={() => alternarRecorte("concluidas")}
                />
                <Kpi
                    icone={Clock3}
                    tom="ambar"
                    titulo="Atrasadas"
                    valor={carregando ? "—" : kpis.atrasadas}
                    delta={carregando ? "" : kpis.atrasadasDelta?.texto}
                    deltaClasse={classeDelta(kpis.atrasadasDelta?.valor, true)}
                    legenda="Precisam de atenção"
                    ativo={recorte === "atrasadas"}
                    onClick={() => alternarRecorte("atrasadas")}
                />
                <Kpi
                    icone={Gift}
                    tom="verde"
                    titulo="Entregues hoje"
                    valor={carregando ? "—" : kpis.entreguesHoje}
                    legenda="Últimas 24 horas"
                    ativo={recorte === "hoje"}
                    onClick={() => alternarRecorte("hoje")}
                />
            </section>

            {filtrosAtivos ? (
                <div className="pp-recorte">
                    <span>
                        {colunas.reduce((acc, coluna) => acc + coluna.itens.length, 0)} OS no recorte
                    </span>
                    <button type="button" onClick={limparFiltros}>Limpar</button>
                </div>
            ) : null}

        <DragDropContext onDragEnd={onDragEnd}>
                <div className="pp-board">
                    {colunas.map((coluna) => (
                        <Coluna
                            key={coluna.id}
                            coluna={coluna}
                            carregando={carregando}
                            limite={lotes[coluna.id] || LOTE}
                            onMais={() => setLotes((atual) => ({
                                ...atual,
                                [coluna.id]: (atual[coluna.id] || LOTE) + LOTE
                            }))}
                            onAbrir={abrir}
                        />
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}

function Kpi({ icone: Icone, tom, titulo, valor, delta, deltaClasse, legenda, ativo, onClick }) {
    return (
        <button type="button" className={`pp-kpi is-${tom}${ativo ? " is-active" : ""}`} onClick={onClick}>
            <span className="pp-kpi-ico" aria-hidden="true">
                <Icone size={18} />
            </span>
            <span className="pp-kpi-corpo">
                <small>{titulo}</small>
                <strong>
                    {valor}
                    {delta ? <em className={deltaClasse}>{delta}</em> : null}
                </strong>
                <span>{legenda}</span>
            </span>
        </button>
    );
}

function Coluna({ coluna, carregando, limite, onMais, onAbrir }) {
    const Icone = coluna.Icone;
    const visiveis = coluna.itens.slice(0, limite);
    return (
        <Droppable droppableId={coluna.id}>
            {(provided, snapshot) => (
                <section
                    className={`pp-col${snapshot.isDraggingOver ? " is-over" : ""}`}
                    style={{ "--pp-cor": coluna.cor }}
                >
                    <header className="pp-col-head">
                        <i />
                        <strong>{coluna.label}</strong>
                        <em>{coluna.itens.length}</em>
                    </header>
                    <div
                        className="pp-col-body"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {carregando ? <CardEsqueleto /> : null}
                        {!carregando && coluna.itens.length === 0 ? (
                            <div className="pp-empty">
                                <span><Icone size={22} /></span>
                                <strong>Nenhuma OS</strong>
                                <small>Arraste uma ordem para cá</small>
                            </div>
                        ) : null}
                        {visiveis.map((os, index) => (
                            <Draggable key={os.id} draggableId={String(os.id)} index={index}>
                                {(drag, estado) => (
                                    <div
                                        ref={drag.innerRef}
                                        {...drag.draggableProps}
                                        {...drag.dragHandleProps}
                                        className={estado.isDragging ? "is-drag" : ""}
                                        onClick={() => onAbrir(os)}
                                    >
                                        <CardOS os={os} />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        {coluna.itens.length > visiveis.length ? (
                            <button type="button" className="pp-mais" onClick={onMais}>
                                Mostrar mais ({coluna.itens.length - visiveis.length})
                            </button>
                        ) : null}
                    </div>
                </section>
            )}
        </Droppable>
    );
}

function CardOS({ os }) {
    const coluna = ROTULO[setorDa(os)] || QUADRO[0];
    const foto = miniatura(os);
    const data = dataBr(os.dataAbertura || os.dataPrevisao);
    return (
        <article className="pp-card" style={{ "--pp-cor": coluna.cor }}>
            <div>
                <b>OS #{os.numero || os.id}</b>
                <strong>{os.cliente || os.fantasia || "Sem cliente"}</strong>
                <p>{resumo(os)}</p>
                <em>{coluna.label}</em>
                <span className="pp-preco">R$ {moeda(valorDa(os))}</span>
                {data ? <time>{data}</time> : null}
            </div>
            {foto ? (
                <img src={foto} alt="" />
            ) : (
                <span className="pp-thumb" aria-hidden="true">
                    <ImageIcon size={18} />
                </span>
            )}
        </article>
    );
}

function CardEsqueleto() {
    return (
        <div className="pp-card pp-skeleton" aria-hidden="true">
            <div>
                <b />
                <strong />
                <p />
            </div>
        </div>
    );
}
