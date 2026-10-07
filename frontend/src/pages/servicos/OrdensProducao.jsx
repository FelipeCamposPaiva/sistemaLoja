import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, ClipboardList, Copy, FileText, Hash, Minus, Paperclip, Plus, Search, Tag, Trash2, UserRound, X } from "lucide-react";

import ROTAS from "../../constants/rotas";
import { equipeAtiva, supervisorDe } from "../../constants/rh";
import { componentesDoProduto } from "../../services/kitComposicao";
import { enviarAnexoProducao, excluirOrdemProducao, listarOrdensProducao, salvarOrdemProducao } from "../../services/producao.service";
import { buscarProdutos } from "../../services/produto.service";
import { urlMidia } from "../../services/produtoMidia.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ordens-producao.css";

const FAIXAS = [
    { id: "todas", nome: "todas" },
    { id: "em_aberto", nome: "em aberto" },
    { id: "em_andamento", nome: "em andamento" },
    { id: "finalizada", nome: "finalizada" },
    { id: "cancelada", nome: "cancelada" }
];

const STATUS = [
    { id: "EM_ABERTO", nome: "pendente" },
    { id: "EM_ANDAMENTO", nome: "em andamento" },
    { id: "FINALIZADA", nome: "finalizada" },
    { id: "CANCELADA", nome: "cancelada" }
];

const STATUS_ETAPA = [
    ["EM_ABERTO", "Em aberto"],
    ["EM_ANDAMENTO", "Em andamento"],
    ["FINALIZADA", "Finalizada"],
    ["CANCELADA", "Cancelada"]
];

function faixaDe(status) {
    const valor = String(status || "").toUpperCase();
    if (valor.includes("CANCEL")) {
        return "cancelada";
    }
    if (valor === "FINALIZADA" || valor === "PRONTO" || valor === "ENTREGUE") {
        return "finalizada";
    }
    if (valor === "EM_ANDAMENTO" || valor === "PRODUCAO" || valor === "ACABAMENTO" || valor === "ARTE") {
        return "em_andamento";
    }
    return "em_aberto";
}

function nomeStatus(status) {
    return STATUS.find((item) => item.id === statusEditavel(status))?.nome || status;
}

function dataBr(iso) {
    if (!iso) {
        return "—";
    }
    const [y, m, d] = String(iso).slice(0, 10).split("-");
    return d && m && y ? `${d}/${m}/${y}` : iso;
}

function agoraLocal() {
    const data = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}T${p(data.getHours())}:${p(data.getMinutes())}:${p(data.getSeconds())}`;
}

function mesmoInstante(a, b) {
    const na = String(a || "").slice(0, 19);
    const nb = String(b || "").slice(0, 19);
    if (na === nb) {
        return true;
    }
    if (na.length === 16 && nb.startsWith(na)) {
        return true;
    }
    if (nb.length === 16 && na.startsWith(nb)) {
        return true;
    }
    return false;
}

function instanteBr(valor) {
    if (!valor) {
        return "";
    }
    const [data, hora] = String(valor).split("T");
    return `${dataBr(data)} ${hora || ""}`.trim();
}

function hojeIso() {
    const agora = new Date();
    const m = String(agora.getMonth() + 1).padStart(2, "0");
    const d = String(agora.getDate()).padStart(2, "0");
    return `${agora.getFullYear()}-${m}-${d}`;
}

function statusEditavel(status) {
    const faixa = faixaDe(status);
    if (faixa === "cancelada") {
        return "CANCELADA";
    }
    if (faixa === "finalizada") {
        return "FINALIZADA";
    }
    if (faixa === "em_andamento") {
        return "EM_ANDAMENTO";
    }
    return "EM_ABERTO";
}

function novoId(prefixo) {
    return `${prefixo}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

function unidadeDoProduto(produto) {
    return String(produto?.unidade || "").trim();
}

function fotoDoProduto(produto) {
    return produto?.imagem || produto?.fotos?.[0]?.url || "";
}

function linhaComposicao() {
    return { id: novoId("cp"), produto: "", sku: "", quantidade: "0,00", unidade: "", custo: "0,00" };
}

function situacaoEtapa(valor) {
    const texto = String(valor || "").toLowerCase();
    if (texto === "andamento" || texto === "em_andamento" || texto === "em andamento") {
        return "EM_ANDAMENTO";
    }
    if (texto === "concluida" || texto === "finalizada") {
        return "FINALIZADA";
    }
    if (texto.includes("cancel")) {
        return "CANCELADA";
    }
    return "EM_ABERTO";
}

function linhaEtapa() {
    return {
        id: novoId("et"),
        nome: "",
        inicio: "",
        fim: "",
        inicioBase: "",
        fimBase: "",
        inicioManual: false,
        fimManual: false,
        situacao: "EM_ABERTO"
    };
}

function normalizarEtapa(linha) {
    return {
        ...linhaEtapa(),
        ...linha,
        id: linha?.id || novoId("et"),
        situacao: situacaoEtapa(linha?.situacao),
        inicioBase: linha?.inicioBase || linha?.inicio || "",
        fimBase: linha?.fimBase || linha?.fim || ""
    };
}

function statusDasEtapas(etapas) {
    const lista = (etapas || []).map((linha) => situacaoEtapa(linha.situacao));
    if (!lista.length || lista.every((item) => item === "EM_ABERTO")) {
        return "EM_ABERTO";
    }
    if (lista.every((item) => item === "CANCELADA")) {
        return "CANCELADA";
    }
    if (lista.every((item) => item === "FINALIZADA" || item === "CANCELADA")) {
        return "FINALIZADA";
    }
    return "EM_ANDAMENTO";
}

function numeroDe(valor) {
    const texto = String(valor ?? "").trim();
    if (!texto) {
        return 0;
    }
    if (texto.includes(",")) {
        return Number(texto.replace(/\./g, "").replace(",", ".")) || 0;
    }
    return Number(texto) || 0;
}

function dinheiro(valor) {
    return numeroDe(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BuscaProduto({ value, onChange, onPick, onClear, placeholder, required = false }) {
    const [aberto, setAberto] = useState(false);
    const [opcoes, setOpcoes] = useState([]);

    useEffect(() => {
        const termo = String(value || "").trim();
        if (!aberto || termo.length < 2) {
            setOpcoes([]);
            return undefined;
        }
        let vivo = true;
        const timer = setTimeout(() => {
            buscarProdutos(termo)
                .then((lista) => {
                    if (vivo) {
                        setOpcoes(lista.slice(0, 8));
                    }
                })
                .catch(() => {
                    if (vivo) {
                        setOpcoes([]);
                    }
                });
        }, 250);
        return () => {
            vivo = false;
            clearTimeout(timer);
        };
    }, [aberto, value]);

    return (
        <div className="op-busca">
            <Search size={16} />
            <input
                value={value}
                required={required}
                placeholder={placeholder}
                onFocus={() => setAberto(true)}
                onBlur={() => setTimeout(() => setAberto(false), 180)}
                onChange={(e) => onChange(e.target.value)}
            />
            {onClear && value ? (
                <button type="button" className="op-limpar" aria-label="Limpar" onMouseDown={(e) => { e.preventDefault(); onClear(); }}>
                    <X size={14} />
                </button>
            ) : null}
            {aberto && opcoes.length > 0 ? (
                <ul>
                    {opcoes.map((produto) => (
                        <li key={produto.id}>
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onPick(produto);
                                    setAberto(false);
                                }}
                            >
                                <strong>{produto.nome}</strong>
                                <span>{[produto.sku || produto.gtin || "sem código", unidadeDoProduto(produto)].filter(Boolean).join(" · ")}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

function formVazio() {
    return {
        id: null,
        produto: "",
        cliente: "",
        quantidade: 1,
        unidade: "",
        data: "",
        dataPrevista: "",
        hora: "09:00",
        numero: "",
        foto: "",
        sku: "",
        produtoId: "",
        categoria: "",
        criadoEm: "",
        anexos: [],
        pedido: "",
        responsavel: "",
        supervisor: "",
        status: "EM_ABERTO",
        inicio: "",
        termino: "",
        inicioBase: "",
        terminoBase: "",
        inicioManual: false,
        terminoManual: false,
        alteracoes: [],
        observacao: "",
        marcadores: "",
        composicao: [linhaComposicao()],
        etapas: [linhaEtapa()]
    };
}

function abrirOrdem(item) {
    return {
        ...formVazio(),
        ...item,
        status: statusEditavel(item.status),
        hora: item.hora || "09:00",
        unidade: String(item.unidade || "").trim(),
        composicao: item.composicao?.length ? item.composicao : formVazio().composicao,
        etapas: item.etapas?.length ? item.etapas.map(normalizarEtapa) : formVazio().etapas,
        inicioBase: item.inicio || "",
        terminoBase: item.termino || ""
    };
}

export default function OrdensProducao() {
    const location = useLocation();
    const navigate = useNavigate();
    const [ordens, setOrdens] = useState([]);
    const [busca, setBusca] = useState("");
    const [faixa, setFaixa] = useState("todas");
    const [de, setDe] = useState("");
    const [ate, setAte] = useState("");
    const [form, setForm] = useState(null);
    const [aviso, setAviso] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(true);
    const anexoPendente = useRef(null);
    const [nomeAnexo, setNomeAnexo] = useState("");

    const equipe = useMemo(() => {
        return [...equipeAtiva()].sort((a, b) => Number(b.producao) - Number(a.producao) || a.nome.localeCompare(b.nome, "pt-BR"));
    }, []);

    const supervisores = useMemo(() => {
        const nomes = equipe.map((p) => p.nome);
        return nomes.includes("Administrador") ? nomes : ["Administrador", ...nomes];
    }, [equipe]);

    useEffect(() => {
        let vivo = true;
        listarOrdensProducao()
            .then((dados) => {
                if (vivo) {
                    setOrdens(dados);
                }
            })
            .catch(() => {
                if (vivo) {
                    setErro("Não foi possível carregar as ordens de produção.");
                }
            })
            .finally(() => {
                if (vivo) {
                    setCarregando(false);
                }
            });
        return () => {
            vivo = false;
        };
    }, []);

    useEffect(() => {
        const hash = location.hash;
        if (hash === "#add") {
            const params = new URLSearchParams(location.search);
            setForm((atual) => {
                const nums = ordens.map((item) => Number(item.numero || item.id) || 0);
                const proximo = String(Math.max(0, ...nums) + 1);
                if (atual && !atual.id) {
                    return { ...atual, numero: proximo };
                }
                return {
                    ...formVazio(),
                    numero: proximo,
                    data: params.get("produto") ? hojeIso() : "",
                    produto: params.get("produto") || "",
                    cliente: params.get("cliente") || "",
                    pedido: params.get("pedido") || "",
                    sku: params.get("sku") || "",
                    unidade: params.get("unidade") || "",
                    quantidade: params.get("quantidade") || 1
                };
            });
            return;
        }
        const editar = hash.match(/^#(?:edit\/)?(\d+)$/);
        if (!editar) {
            setForm(null);
            return;
        }
        const achada = ordens.find((item) => String(item.id) === editar[1]);
        if (achada) {
            setForm((atual) => (atual && String(atual.id) === editar[1] ? atual : abrirOrdem(achada)));
        }
    }, [location.hash, location.search, ordens]);

    useEffect(() => {
        const produto = new URLSearchParams(location.search).get("produto");
        if (produto && location.hash !== "#add" && !location.hash.startsWith("#edit")) {
            setBusca(produto);
        }
    }, [location.hash, location.search]);

    useEffect(() => {
        const nome = String(form?.produto || "").trim();
        if (!form || !nome || (form.foto && form.unidade && form.sku && form.categoria)) {
            return undefined;
        }
        let vivo = true;
        buscarProdutos(nome)
            .then((lista) => {
                if (!vivo) {
                    return;
                }
                const produto = lista.find((item) => String(item.nome || "").trim().toLowerCase() === nome.toLowerCase());
                if (!produto) {
                    return;
                }
                const foto = fotoDoProduto(produto);
                setForm((atual) => {
                    if (!atual || String(atual.produto || "").trim().toLowerCase() !== nome.toLowerCase()) {
                        return atual;
                    }
                    const proxima = {
                        foto: atual.foto || foto,
                        unidade: atual.unidade || unidadeDoProduto(produto),
                        sku: atual.sku || produto.sku || produto.gtin || "",
                        produtoId: atual.produtoId || produto.id || "",
                        categoria: atual.categoria || produto.categoria || produto.grupo || ""
                    };
                    if (
                        atual.foto === proxima.foto
                        && atual.unidade === proxima.unidade
                        && atual.sku === proxima.sku
                        && atual.categoria === proxima.categoria
                        && String(atual.produtoId || "") === String(proxima.produtoId || "")
                    ) {
                        return atual;
                    }
                    return { ...atual, ...proxima };
                });
            })
            .catch(() => {});
        return () => {
            vivo = false;
        };
    }, [form?.id, form?.produto, form?.foto, form?.unidade, form?.sku, form?.categoria]);

    const texto = busca.trim().toLowerCase();
    const visiveis = useMemo(() => {
        return ordens.filter((item) => {
            if (faixa !== "todas" && faixaDe(item.status) !== faixa) {
                return false;
            }
            if (de && item.data && item.data < de) {
                return false;
            }
            if (ate && item.data && item.data > ate) {
                return false;
            }
            if (!texto) {
                return true;
            }
            return [item.id, item.numero, item.produto, item.cliente, item.pedido, item.responsavel, item.marcadores]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(texto);
        });
    }, [ordens, faixa, de, ate, texto]);

    function abrirNova() {
        setAviso("");
        setErro("");
        navigate(`${ROTAS.PRODUCAO}#add`);
    }

    function abrir(item) {
        setAviso("");
        setErro("");
        navigate(`${ROTAS.PRODUCAO}#edit/${item.id}`);
    }

    function fechar() {
        setForm(null);
        navigate(ROTAS.PRODUCAO);
    }

    function escolherExecutor(nome) {
        setForm((atual) => ({
            ...atual,
            responsavel: nome,
            supervisor: atual.supervisor && atual.supervisor !== supervisorDe(atual.responsavel)
                ? atual.supervisor
                : supervisorDe(nome)
        }));
    }

    function atualizarLista(lista, id, campo, valor) {
        setForm((atual) => ({
            ...atual,
            [lista]: atual[lista].map((linha) => (linha.id === id ? { ...linha, [campo]: valor } : linha))
        }));
    }

    async function salvar(event) {
        event.preventDefault();
        if (!form.produto.trim() || !form.responsavel || !form.data) {
            setErro("Informe o produto, a data e quem executa o serviço.");
            return;
        }
        setErro("");
        try {
            let salva = await salvarOrdemProducao({
                ...form,
                numero: form.numero,
                produto: form.produto.trim(),
                cliente: form.cliente.trim(),
                supervisor: form.supervisor || supervisorDe(form.responsavel)
            });
            if (anexoPendente.current && salva.id) {
                try {
                    const enviado = await enviarAnexoProducao(salva.id, anexoPendente.current);
                    salva = await salvarOrdemProducao({
                        ...salva,
                        anexos: [...(salva.anexos || []), enviado]
                    });
                    anexoPendente.current = null;
                    setNomeAnexo("");
                } catch {
                    setErro("A ordem foi salva, mas o anexo não foi gravado.");
                }
            }
            setOrdens((atual) => {
                const resto = atual.filter((item) => item.id !== salva.id);
                return [salva, ...resto];
            });
            const pessoas = [salva.responsavel, salva.supervisor].filter(Boolean);
            const unicas = [...new Set(pessoas)];
            setAviso(
                salva.agendaEventoId
                    ? `Na agenda de ${unicas.join(" e ")} em ${dataBr(salva.data)} às ${salva.hora || "09:00"}.`
                    : "Ordem salva. A agenda não foi atualizada; salve de novo para tentar."
            );
            setForm(null);
            const fila = JSON.parse(sessionStorage.getItem("erp-op-fila") || "[]");
            if (Array.isArray(fila) && fila.length) {
                const [proxima, ...resto] = fila;
                sessionStorage.setItem("erp-op-fila", JSON.stringify(resto));
                navigate(proxima);
                return;
            }
            sessionStorage.removeItem("erp-op-fila");
            navigate(ROTAS.PRODUCAO);
        } catch {
            setErro("Não foi possível salvar a ordem de produção.");
        }
    }

    async function excluir() {
        if (!form?.id || !window.confirm("Excluir esta ordem e o compromisso na agenda?")) {
            return;
        }
        try {
            await excluirOrdemProducao(form.id);
            setOrdens((atual) => atual.filter((item) => item.id !== form.id));
            setAviso("Ordem e compromisso removidos da agenda.");
            fechar();
        } catch {
            setErro("Não foi possível excluir a ordem.");
        }
    }

    const agendaDe = form
        ? [...new Set([form.responsavel, form.supervisor || (form.responsavel ? supervisorDe(form.responsavel) : "")].filter(Boolean))]
        : [];

    function resumirOrdem(atual, etapas, registros) {
        const status = statusDasEtapas(etapas);
        const inicios = etapas.map((linha) => linha.inicio).filter(Boolean).sort();
        const fins = etapas.map((linha) => linha.fim).filter(Boolean).sort();
        const inicio = inicios[0] || (status === "EM_ABERTO" ? "" : atual.inicio || "");
        const termino = status === "FINALIZADA" ? (fins[fins.length - 1] || atual.termino || "") : (atual.termino || "");
        return {
            ...atual,
            etapas,
            status,
            inicio,
            termino,
            inicioBase: inicio || atual.inicioBase || "",
            terminoBase: termino || atual.terminoBase || "",
            alteracoes: [...(atual.alteracoes || []), ...(registros || [])]
        };
    }

    function mudarSituacaoEtapa(id, novo) {
        setForm((atual) => {
            const agora = agoraLocal();
            const registros = [];
            const etapas = atual.etapas.map((linha) => {
                if (linha.id !== id) {
                    return linha;
                }
                const anterior = situacaoEtapa(linha.situacao);
                if (anterior === novo) {
                    return linha;
                }
                const nome = linha.nome || "Etapa";
                let inicio = linha.inicio || "";
                let fim = linha.fim || "";
                let inicioBase = linha.inicioBase || "";
                let fimBase = linha.fimBase || "";
                let inicioManual = linha.inicioManual;
                let fimManual = linha.fimManual;
                if (anterior === "EM_ABERTO" && (novo === "EM_ANDAMENTO" || novo === "FINALIZADA")) {
                    inicio = agora;
                    inicioBase = agora;
                    inicioManual = false;
                    registros.push({
                        campo: "inicio",
                        de: linha.inicio || "",
                        para: agora,
                        em: agora,
                        manual: false,
                        texto: `${nome}: saiu de em aberto`
                    });
                }
                if (novo === "FINALIZADA" && anterior !== "FINALIZADA") {
                    fim = agora;
                    fimBase = agora;
                    fimManual = false;
                    registros.push({
                        campo: "fim",
                        de: linha.fim || "",
                        para: agora,
                        em: agora,
                        manual: false,
                        texto: `${nome}: etapa finalizada`
                    });
                }
                return {
                    ...linha,
                    situacao: novo,
                    inicio,
                    fim,
                    inicioBase,
                    fimBase,
                    inicioManual,
                    fimManual
                };
            });
            return resumirOrdem(atual, etapas, registros);
        });
    }

    function confirmarInstanteEtapa(id, campo, valor) {
        setForm((atual) => {
            const agora = agoraLocal();
            let registro = null;
            const etapas = atual.etapas.map((linha) => {
                if (linha.id !== id) {
                    return linha;
                }
                const baseKey = campo === "inicio" ? "inicioBase" : "fimBase";
                const manualKey = campo === "inicio" ? "inicioManual" : "fimManual";
                const base = linha[baseKey] || "";
                const cheio = valor.length === 16 ? `${valor}:00` : valor;
                if (mesmoInstante(valor, base)) {
                    return { ...linha, [campo]: base || cheio, [manualKey]: false };
                }
                registro = {
                    campo,
                    de: base,
                    para: cheio,
                    em: agora,
                    manual: true,
                    texto: `${linha.nome || "Etapa"}: ${campo === "inicio" ? "Início" : "Término"} alterado manualmente`
                };
                return { ...linha, [campo]: cheio, [baseKey]: cheio, [manualKey]: true };
            });
            return resumirOrdem(atual, etapas, registro ? [registro] : []);
        });
    }

    function mudarQuantidade(delta) {
        setForm((atual) => ({
            ...atual,
            quantidade: Math.max(0, numeroDe(atual.quantidade) + delta)
        }));
    }

    function escolherInsumo(id, produto) {
        setForm((atual) => ({
            ...atual,
            composicao: atual.composicao.map((linha) => (
                linha.id === id
                    ? {
                        ...linha,
                        produto: produto.nome,
                        sku: produto.sku || produto.gtin || "",
                        unidade: unidadeDoProduto(produto),
                        custo: dinheiro(produto.custo || produto.custoCompra || 0)
                    }
                    : linha
            ))
        }));
    }

    if (form) {
        return (
            <div className="op-page op-nova">
                <nav className="op-trilha" aria-label="Trilha">
                    <button type="button" className="op-voltar" onClick={fechar} aria-label="Voltar"><ArrowLeft size={16} /></button>
                    <Link to={ROTAS.INDICE}>Início</Link>
                    <span>›</span>
                    <button type="button" onClick={fechar}>Suprimentos</button>
                    <span>›</span>
                    <button type="button" onClick={fechar}>Ordens de Produção</button>
                    <span>›</span>
                    <strong>{form.id ? `Ordem ${form.numero || form.id}` : "Nova Ordem"}</strong>
                </nav>
                <form className="op-ficha" onSubmit={salvar}>
                    <header className="op-topo">
                        <figure className="op-foto">
                            {form.foto ? (
                                <img src={urlMidia(form.foto)} alt={form.produto || "Foto do produto"} />
                            ) : (
                                <span>Foto do produto</span>
                            )}
                        </figure>
                        <div className="op-topo-texto">
                            <span className="op-hero-ico" aria-hidden="true"><ClipboardList size={22} /></span>
                            <div>
                                <h2>Ordem de Produção {form.numero ? `#${form.numero}` : ""}</h2>
                                <p>{form.produto || "Escolha o produto para puxar a foto, a unidade e a composição."}</p>
                                <div className="op-ligacoes">
                                    {form.pedido ? (
                                        <Link to={`${ROTAS.PEDIDO_VENDA}#edit/${encodeURIComponent(form.pedido)}`}>Pedido {form.pedido}</Link>
                                    ) : null}
                                    {form.produto ? (
                                        <Link to={`${ROTAS.PRODUTOS}?q=${encodeURIComponent(form.sku || form.produto)}#list`}>Cadastro do produto</Link>
                                    ) : null}
                                    {form.data ? (
                                        <Link to={`${ROTAS.AGENDA}?data=${form.data}`}>Agenda em {dataBr(form.data)}</Link>
                                    ) : null}
                                    <Link to={ROTAS.PAINEL_PRODUCAO}>Painel de produção</Link>
                                </div>
                            </div>
                        </div>
                        <aside className="op-resumo">
                            <label className={`op-status-sel is-${faixaDe(form.status)}`}>
                                <select
                                    value={statusEditavel(form.status)}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    aria-label="Situação da ordem"
                                >
                                    {STATUS_ETAPA.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                                </select>
                            </label>
                            <ul>
                                <li><Hash size={14} /> <span>Código/SKU</span> <strong>{form.sku || "—"}</strong></li>
                                <li><Tag size={14} /> <span>Categoria</span> <strong>{form.categoria || "—"}</strong></li>
                                <li><UserRound size={14} /> <span>Cliente</span> <strong>{form.cliente || "Não informado"}</strong></li>
                                <li><Calendar size={14} /> <span>Criado em</span> <strong>{form.criadoEm ? instanteBr(form.criadoEm) : form.data ? `${dataBr(form.data)} ${form.hora || ""}`.trim() : "—"}</strong></li>
                            </ul>
                        </aside>
                    </header>

                    {erro ? <p className="op-erro">{erro}</p> : null}

                    <section className="op-card">
                        <header className="op-card-head">
                            <span className="op-num">1</span>
                            <div>
                                <h3>Informações principais</h3>
                                <p>Selecione o produto, defina a quantidade e as informações básicas da ordem de produção.</p>
                            </div>
                        </header>
                        <div className="op-produto">
                            <label>
                                Produto a ser produzido *
                                <BuscaProduto
                                    value={form.produto}
                                    required
                                    placeholder="Pesquise por descrição, código (SKU) ou GTIN..."
                                    onClear={() => setForm((atual) => ({
                                        ...atual,
                                        produto: "",
                                        unidade: "",
                                        foto: "",
                                        sku: "",
                                        produtoId: "",
                                        categoria: ""
                                    }))}
                                    onChange={(nome) => setForm((atual) => ({
                                        ...atual,
                                        produto: nome,
                                        unidade: "",
                                        foto: "",
                                        sku: "",
                                        categoria: ""
                                    }))}
                                    onPick={(produto) => {
                                        const componentes = componentesDoProduto(produto);
                                        const composicao = componentes.length
                                            ? componentes.map((item) => ({
                                                id: novoId("cp"),
                                                produto: item.nome || item.sku,
                                                sku: item.sku || "",
                                                quantidade: String(item.quantidade || 1).replace(".", ","),
                                                unidade: "",
                                                custo: "0,00"
                                            }))
                                            : null;
                                        setForm((atual) => ({
                                            ...atual,
                                            produto: produto.nome,
                                            sku: produto.sku || produto.gtin || "",
                                            produtoId: produto.id || "",
                                            categoria: produto.categoria || produto.grupo || "",
                                            unidade: unidadeDoProduto(produto),
                                            foto: fotoDoProduto(produto),
                                            composicao: composicao || atual.composicao
                                        }));
                                    }}
                                />
                            </label>
                            <label className="op-qtd-label">
                                Quantidade *
                                <span className="op-stepper">
                                    <button type="button" aria-label="Diminuir" onClick={() => mudarQuantidade(-1)}><Minus size={14} /></button>
                                    <input
                                        value={form.quantidade}
                                        onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                                    />
                                    <button type="button" aria-label="Aumentar" onClick={() => mudarQuantidade(1)}><Plus size={14} /></button>
                                    <input className="op-unidade" value={form.unidade || "—"} readOnly tabIndex={-1} title="Unidade do produto" />
                                </span>
                            </label>
                        </div>
                        <div className="op-datas">
                            <label>
                                Data de início *
                                <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
                            </label>
                            <label>
                                Hora
                                <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
                            </label>
                            <label>
                                Data prevista
                                <input type="date" value={form.dataPrevista} onChange={(e) => setForm({ ...form, dataPrevista: e.target.value })} />
                            </label>
                            <label>
                                Número da OP
                                <input className="op-numero" value={form.numero || "—"} readOnly tabIndex={-1} />
                                <small>Sequência automática. Não pode ser alterada.</small>
                            </label>
                        </div>
                        <div className="op-datas">
                            <label>
                                Quem executa *
                                <select value={form.responsavel} onChange={(e) => escolherExecutor(e.target.value)} required>
                                    <option value="">Selecionar</option>
                                    {equipe.map((pessoa) => (
                                        <option key={pessoa.id} value={pessoa.nome}>{pessoa.nome}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Supervisor *
                                <select value={form.supervisor} onChange={(e) => setForm({ ...form, supervisor: e.target.value })} required>
                                    <option value="">Selecionar</option>
                                    {supervisores.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                                </select>
                            </label>
                            <label>
                                Cliente
                                <span className="op-campo-ico">
                                    <UserRound size={15} />
                                    <input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} placeholder="Quem pediu" />
                                </span>
                            </label>
                            <label>
                                Pedido de venda
                                <span className="op-campo-ico">
                                    <FileText size={15} />
                                    <input value={form.pedido} onChange={(e) => setForm({ ...form, pedido: e.target.value })} placeholder="Número do pedido" />
                                </span>
                            </label>
                            <p className="op-hint">
                                <Calendar size={14} />
                                {agendaDe.length
                                    ? `Entra na agenda de ${agendaDe.join(" e ")} em ${form.data ? dataBr(form.data) : "a data de início"}.`
                                    : "A ordem entra na agenda de quem executa e do supervisor."}
                            </p>
                        </div>
                    </section>

                    <section className="op-card">
                        <header className="op-card-head">
                            <span className="op-num">2</span>
                            <div>
                                <h3>Composição</h3>
                                <p>Defina os materiais e insumos necessários para a produção.</p>
                            </div>
                            <button type="button" className="op-add" onClick={() => setForm((atual) => ({ ...atual, composicao: [...atual.composicao, linhaComposicao()] }))}>
                                <Plus size={14} /> Adicionar item de composição
                            </button>
                        </header>
                        <div className="op-table-wrap">
                            <table className="op-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Produto / Insumo</th>
                                        <th>Quantidade</th>
                                        <th>Unidade</th>
                                        <th>Custo unitário (R$)</th>
                                        <th>Custo total (R$)</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.composicao.map((linha, indice) => (
                                        <tr key={linha.id}>
                                            <td>{indice + 1}</td>
                                            <td>
                                                <BuscaProduto
                                                    value={linha.produto}
                                                    placeholder="Busque o produto ou insumo..."
                                                    onChange={(valor) => setForm((atual) => ({
                                                        ...atual,
                                                        composicao: atual.composicao.map((item) => (
                                                            item.id === linha.id ? { ...item, produto: valor, unidade: "" } : item
                                                        ))
                                                    }))}
                                                    onPick={(produto) => escolherInsumo(linha.id, produto)}
                                                />
                                            </td>
                                            <td><input value={linha.quantidade} onChange={(e) => atualizarLista("composicao", linha.id, "quantidade", e.target.value)} /></td>
                                            <td>
                                                <input className="op-unidade" value={linha.unidade || "—"} readOnly tabIndex={-1} title="Unidade do produto" />
                                            </td>
                                            <td><input value={linha.custo || "0,00"} onChange={(e) => atualizarLista("composicao", linha.id, "custo", e.target.value)} /></td>
                                            <td className="op-custo">R$ {dinheiro(numeroDe(linha.quantidade) * numeroDe(linha.custo))}</td>
                                            <td className="op-acoes">
                                                <button type="button" className="op-icon" aria-label="Duplicar item" onClick={() => setForm((atual) => ({ ...atual, composicao: [...atual.composicao, { ...linha, id: novoId("cp") }] }))}>
                                                    <Copy size={14} />
                                                </button>
                                                <button type="button" className="op-icon" aria-label="Remover item" onClick={() => setForm((atual) => ({ ...atual, composicao: atual.composicao.filter((item) => item.id !== linha.id) }))}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="op-card">
                        <header className="op-card-head">
                            <span className="op-num">3</span>
                            <div>
                                <h3>Etapas da Produção</h3>
                                <p>A situação de cada etapa grava o início e o término com hora e segundos.</p>
                            </div>
                            <button type="button" className="op-add" onClick={() => setForm((atual) => ({ ...atual, etapas: [...atual.etapas, linhaEtapa()] }))}>
                                <Plus size={14} /> Adicionar etapa
                            </button>
                        </header>
                        <div className="op-etapas">
                            {form.etapas.map((linha, indice) => (
                                <article key={linha.id} className="op-etapa">
                                    <header>
                                        <span>{indice + 1}</span>
                                        <input value={linha.nome} placeholder="Ex.: Impressão, Corte, Montagem..." onChange={(e) => atualizarLista("etapas", linha.id, "nome", e.target.value)} />
                                        <button type="button" className="op-icon" aria-label="Remover etapa" onClick={() => setForm((atual) => resumirOrdem(atual, atual.etapas.filter((item) => item.id !== linha.id)))}>
                                            <Trash2 size={14} />
                                        </button>
                                    </header>
                                    <div className="op-status-row is-etapa" role="group" aria-label={`Situação da etapa ${indice + 1}`}>
                                        {STATUS_ETAPA.map(([id, nome]) => (
                                            <button
                                                key={id}
                                                type="button"
                                                className={situacaoEtapa(linha.situacao) === id ? "is-on" : ""}
                                                onClick={() => mudarSituacaoEtapa(linha.id, id)}
                                            >
                                                {nome}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="op-etapa-tempos">
                                        {situacaoEtapa(linha.situacao) !== "EM_ABERTO" || linha.inicio ? (
                                            <label className={linha.inicioManual ? "op-marco is-manual" : "op-marco"}>
                                                Início
                                                <input
                                                    type="datetime-local"
                                                    step="1"
                                                    value={linha.inicio || ""}
                                                    onChange={(e) => atualizarLista("etapas", linha.id, "inicio", e.target.value)}
                                                    onBlur={(e) => confirmarInstanteEtapa(linha.id, "inicio", e.target.value)}
                                                />
                                                <small>{linha.inicioManual ? "alterado manualmente" : "ao sair de em aberto"}</small>
                                            </label>
                                        ) : null}
                                        {situacaoEtapa(linha.situacao) === "FINALIZADA" || linha.fim ? (
                                            <label className={linha.fimManual ? "op-marco is-manual" : "op-marco"}>
                                                Término
                                                <input
                                                    type="datetime-local"
                                                    step="1"
                                                    value={linha.fim || ""}
                                                    onChange={(e) => atualizarLista("etapas", linha.id, "fim", e.target.value)}
                                                    onBlur={(e) => confirmarInstanteEtapa(linha.id, "fim", e.target.value)}
                                                />
                                                <small>{linha.fimManual ? "alterado manualmente" : "ao finalizar"}</small>
                                            </label>
                                        ) : null}
                                    </div>
                                </article>
                            ))}
                        </div>
                        {form.alteracoes?.length ? (
                            <div className="op-log">
                                <h4>Registro de alteração</h4>
                                <ul>
                                    {[...form.alteracoes].reverse().map((item, indice) => (
                                        <li key={`${item.em}-${item.campo}-${indice}`} className={item.manual ? "is-manual" : ""}>
                                            <strong>{instanteBr(item.em)}</strong>
                                            <span>
                                                {item.texto}
                                                {item.manual ? `: ${instanteBr(item.de) || "—"} → ${instanteBr(item.para) || "—"}` : item.para ? ` · ${instanteBr(item.para)}` : ""}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </section>

                    <section className="op-card">
                        <header className="op-card-head">
                            <span className="op-num">4</span>
                            <div>
                                <h3>Observações e marcações</h3>
                            </div>
                        </header>
                        <label className="op-anexo">
                            Anexo
                            <span>
                                <Paperclip size={16} />
                                <input
                                    type="file"
                                    onChange={(e) => {
                                        const arquivo = e.target.files?.[0];
                                        anexoPendente.current = arquivo || null;
                                        setNomeAnexo(arquivo?.name || "");
                                        e.target.value = "";
                                    }}
                                />
                                <em>{nomeAnexo || "Selecionar arquivo"}</em>
                            </span>
                        </label>
                        {(form.anexos || []).length > 0 ? (
                            <ul className="op-anexos">
                                {form.anexos.map((item) => (
                                    <li key={item.url || item.nome}>
                                        <a href={urlMidia(item.url)} target="_blank" rel="noreferrer">{item.nome}</a>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                        <div className="op-obs">
                            <label>
                                Observações
                                <textarea rows={4} value={form.observacao} placeholder="Adicione observações sobre esta ordem de produção..." onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
                            </label>
                            <label>
                                Marcadores (tags)
                                <input
                                    value={form.marcadores}
                                    onChange={(e) => setForm({ ...form, marcadores: e.target.value })}
                                    placeholder="Ex.: Urgente, Personalizado, Cliente VIP..."
                                />
                                <small>Separados por vírgula ou pressione Enter</small>
                            </label>
                        </div>
                    </section>

                    <div className="op-salvar-bar">
                        <button type="button" className="op-text" onClick={fechar}>Cancelar</button>
                        <button type="submit" className="op-primary">Salvar ordem de produção</button>
                        {form.id ? <button type="button" className="op-text" onClick={excluir}>Excluir</button> : null}
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="op-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <Link to={ROTAS.ORDEM_SERVICO}>serviços</Link>
                <span>›</span>
                <span>ordens de produção</span>
            </nav>

            <header className="op-head">
                <h2>Ordens de produção</h2>
                <div className="op-head-actions">
                    <button type="button" className="op-ghost" onClick={() => window.print()}>imprimir</button>
                    <Link to="/ordem_producao/grafica" className="op-ghost">calculadora gráfica</Link>
                    <button type="button" className="op-primary" onClick={abrirNova}>incluir ordem de produção</button>
                </div>
            </header>

            <div className="op-tools">
                <label className="op-search">
                    <Search size={16} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Pesquise pelo produto ou número da ordem"
                    />
                </label>
                <label>
                    de
                    <input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
                </label>
                <label>
                    até
                    <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
                </label>
            </div>

            <div className="op-tabs" role="tablist">
                {FAIXAS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={faixa === item.id}
                        className={faixa === item.id ? "is-on" : ""}
                        onClick={() => setFaixa(item.id)}
                    >
                        <i className={`op-dot is-${item.id}`} />
                        {item.nome}
                        <span>{item.id === "todas" ? ordens.length : ordens.filter((ordem) => faixaDe(ordem.status) === item.id).length}</span>
                    </button>
                ))}
            </div>

            {aviso ? <p className="op-aviso">{aviso}</p> : null}
            {erro ? <p className="op-erro">{erro}</p> : null}
            {carregando ? <p className="op-muted">Carregando ordens…</p> : null}

            {!carregando && ordens.length > 0 && visiveis.length === 0 ? (
                <p className="op-muted">Nenhuma ordem neste filtro.</p>
            ) : null}

            {!carregando && ordens.length === 0 ? (
                <div className="op-empty">
                    <strong>Você não possui nenhum item cadastrado.</strong>
                    <p>Para inserir novos registros, inclua uma ordem de produção. Ela entra na agenda de quem executa o serviço e na do supervisor.</p>
                    <button type="button" className="op-primary" onClick={abrirNova}>incluir ordem de produção</button>
                </div>
            ) : null}

            {visiveis.length > 0 ? (
                <div className="op-table-wrap">
                    <table className="op-table">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Pedidos</th>
                                <th>Data</th>
                                <th>Data prevista</th>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Un</th>
                                <th>Marcadores</th>
                                <th>Situação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visiveis.map((item) => (
                                <tr key={item.id} className="is-click" onClick={() => abrir(item)}>
                                    <td>{item.numero || item.id}</td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        {item.pedido ? (
                                            <Link to={`${ROTAS.PEDIDO_VENDA}#edit/${encodeURIComponent(item.pedido)}`}>{item.pedido}</Link>
                                        ) : "—"}
                                    </td>
                                    <td>{dataBr(item.data)}</td>
                                    <td>{dataBr(item.dataPrevista)}</td>
                                    <td className="op-prod" onClick={(e) => e.stopPropagation()}>
                                        {item.foto ? <img src={urlMidia(item.foto)} alt="" /> : <span />}
                                        <Link to={`${ROTAS.PRODUTOS}?q=${encodeURIComponent(item.sku || item.produto)}#list`}>{item.produto}</Link>
                                    </td>
                                    <td>{Number(item.quantidade || 0).toLocaleString("pt-BR")}</td>
                                    <td>{item.unidade || "UN"}</td>
                                    <td>{item.marcadores || "—"}</td>
                                    <td><span className={`op-pill is-${faixaDe(item.status)}`}>{nomeStatus(item.status)}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}
