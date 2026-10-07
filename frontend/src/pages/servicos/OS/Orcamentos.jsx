import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    CalendarDays,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    FileText,
    Filter,
    Hourglass,
    LayoutGrid,
    Mail,
    Minus,
    MoreHorizontal,
    Plus,
    FileSpreadsheet,
    Search,
    Settings2,
    TrendingDown,
    Upload,
    TrendingUp,
    X
} from "lucide-react";

import bannerOrcamento from "../../../assets/images/orcamento-banner.jpg";
import ImportadorMassa from "../../cadastros/ImportadorMassa";
import { excluirOrcamento, importarOrcamentosLote, listarOrcamentos, salvarOrcamento, sinaisDoStatus } from "../../../services/orcamento.service";
import { baixarLayoutOrcamento, lerArquivoOrcamento, lerPlanilhaOrcamentos, mesclarLeiturasOrcamentos } from "../../../services/orcamentoImport.service";
import "../../../styles/pages/orcamentos.css";

const STATUS = {
    em_aberto: { label: "Em aberto", tom: "amarelo" },
    rascunho: { label: "Rascunho", tom: "cinza" },
    pendente: { label: "Pendente", tom: "ambar" },
    aguardando: { label: "Aguardando", tom: "creme" },
    aprovada: { label: "Aprovada", tom: "verde" },
    nao_aprovada: { label: "Não aprovado", tom: "rosa" },
    concluida: { label: "Concluída", tom: "verde" },
    modelo: { label: "Modelo", tom: "roxo" }
};

const ABAS = [
    { id: "todas", label: "Todas", tom: "cinza" },
    { id: "aberto", label: "Em aberto", tom: "rosa" },
    { id: "rascunho", label: "Rascunhos", tom: "amarelo" },
    { id: "pendente", label: "Pendentes", tom: "ambar" },
    { id: "aguardando", label: "Aguardando", tom: "creme" },
    { id: "aprovada", label: "Aprovadas", tom: "verde" },
    { id: "nao_aprovada", label: "Não aprovadas", tom: "rosa" },
    { id: "concluida", label: "Concluídas", tom: "verde" },
    { id: "modelo", label: "Modelos", tom: "roxo" }
];

const COLUNAS = [
    { id: "numero", label: "Número" },
    { id: "data", label: "Data" },
    { id: "cliente", label: "Cliente" },
    { id: "fantasia", label: "Nome fantasia" },
    { id: "valor", label: "Valor (R$)" },
    { id: "status", label: "Status" },
    { id: "integracoes", label: "Integrações" }
];

function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function moedaRS(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataBR(iso) {
    if (!iso) {
        return "—";
    }
    const [ano, mes, dia] = String(iso).slice(0, 10).split("-");
    if (!ano || !mes || !dia) {
        return "—";
    }
    return `${dia}/${mes}/${ano}`;
}

function contagem(n) {
    const valor = Number(n) || 0;
    return valor === 0 ? "0" : String(valor).padStart(2, "0");
}

function variacao(atual, anterior) {
    if (!anterior) {
        return atual ? 100 : 0;
    }
    return Math.round(((atual - anterior) / anterior) * 100);
}

function isoLocal(data) {
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${data.getFullYear()}-${mes}-${dia}`;
}

function faixaMes(deslocamento) {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() + deslocamento, 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + deslocamento + 1, 1);
    return { inicio: isoLocal(inicio), fim: isoLocal(fim) };
}

function resumir(itens) {
    const abertos = itens.filter((item) => item.aberto);
    return {
        total: itens.length,
        abertos: abertos.length,
        aprovados: itens.filter((item) => item.status === "aprovada").length,
        recusados: itens.filter((item) => item.status === "nao_aprovada").length,
        valor: abertos.reduce((soma, item) => soma + Number(item.valor || 0), 0)
    };
}

function noIntervalo(lista, faixa) {
    return lista.filter((item) => item.data && item.data >= faixa.inicio && item.data < faixa.fim);
}

function passaAba(item, aba) {
    if (aba === "todas") {
        return true;
    }
    if (aba === "aberto") {
        return Boolean(item.aberto);
    }
    if (aba === "pendente") {
        return Boolean(item.pendente) || item.status === "pendente";
    }
    return item.status === aba;
}

function passaPeriodo(iso, periodo) {
    if (!periodo || periodo === "todos" || !iso) {
        return true;
    }
    const data = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
    const hoje = new Date();
    if (periodo === "mes") {
        return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
    }
    if (periodo === "anterior") {
        const mes = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
        const ano = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
        return data.getMonth() === mes && data.getFullYear() === ano;
    }
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() - 30);
    return data >= limite && data <= hoje;
}

function vazioForm() {
    return { cliente: "", fantasia: "", valor: "", status: "em_aberto", vendedor: "", email: false };
}

export default function Orcamentos() {
    const raiz = useRef(null);
    const planilhaRef = useRef(null);
    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aviso, setAviso] = useState("");
    const [importando, setImportando] = useState(false);
    const [importadorMassa, setImportadorMassa] = useState(false);
    const [busca, setBusca] = useState("");
    const [aba, setAba] = useState("aberto");
    const [periodo, setPeriodo] = useState("todos");
    const [cliente, setCliente] = useState("");
    const [vendedor, setVendedor] = useState("");
    const [rascunho, setRascunho] = useState({ periodo: "todos", status: "aberto", cliente: "", vendedor: "" });
    const [menu, setMenu] = useState(null);
    const [painel, setPainel] = useState(null);
    const [form, setForm] = useState(vazioForm);
    const [ordem, setOrdem] = useState({ campo: "numero", dir: "desc" });
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);
    const [marcados, setMarcados] = useState([]);
    const [colunas, setColunas] = useState(COLUNAS.map((c) => c.id));

    useEffect(() => {
        carregar();
    }, []);

    useEffect(() => {
        function fechar(ev) {
            if (raiz.current && !raiz.current.contains(ev.target)) {
                setMenu(null);
            }
        }
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, []);

    const clientes = useMemo(
        () => [...new Set(lista.map((item) => item.cliente).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
        [lista]
    );
    const vendedores = useMemo(
        () => [...new Set(lista.map((item) => item.vendedor).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
        [lista]
    );

    const contagens = useMemo(() => {
        const base = Object.fromEntries(ABAS.map((item) => [item.id, 0]));
        lista.forEach((item) => {
            ABAS.forEach((abaItem) => {
                if (passaAba(item, abaItem.id)) {
                    base[abaItem.id] += 1;
                }
            });
        });
        return base;
    }, [lista]);

    const kpis = useMemo(() => resumir(lista), [lista]);
    const comparacao = useMemo(() => {
        const atual = resumir(noIntervalo(lista, faixaMes(0)));
        const anterior = resumir(noIntervalo(lista, faixaMes(-1)));
        return {
            total: variacao(atual.total, anterior.total),
            abertos: variacao(atual.abertos, anterior.abertos),
            aprovados: variacao(atual.aprovados, anterior.aprovados),
            recusados: variacao(atual.recusados, anterior.recusados),
            valor: variacao(atual.valor, anterior.valor)
        };
    }, [lista]);

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const linhas = lista.filter((item) => {
            if (!passaAba(item, aba)) {
                return false;
            }
            if (!passaPeriodo(item.data, periodo)) {
                return false;
            }
            if (cliente && item.cliente !== cliente) {
                return false;
            }
            if (vendedor && item.vendedor !== vendedor) {
                return false;
            }
            if (!termo) {
                return true;
            }
            return [item.numero, item.cliente, item.fantasia, item.vendedor, STATUS[item.status]?.label]
                .join(" ")
                .toLowerCase()
                .includes(termo);
        });
        const fator = ordem.dir === "asc" ? 1 : -1;
        return linhas.sort((a, b) => {
            if (ordem.campo === "cliente") {
                return a.cliente.localeCompare(b.cliente, "pt-BR") * fator;
            }
            if (ordem.campo === "data") {
                return String(a.data).localeCompare(String(b.data)) * fator;
            }
            return (Number(a[ordem.campo]) - Number(b[ordem.campo])) * fator;
        });
    }, [lista, busca, aba, periodo, cliente, vendedor, ordem]);

    const paginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
    const paginaAtual = Math.min(pagina, paginas);
    const inicio = filtrados.length ? (paginaAtual - 1) * porPagina : 0;
    const visiveis = filtrados.slice(inicio, inicio + porPagina);
    const fim = inicio + visiveis.length;

    async function carregar() {
        setLoading(true);
        try {
            setLista(await listarOrcamentos());
            setAviso("");
        } catch (erro) {
            console.error(erro);
            setLista([]);
            setAviso("Não foi possível ler os orçamentos.");
        } finally {
            setLoading(false);
        }
    }

    async function salvar(ev) {
        ev.preventDefault();
        const nome = form.cliente.trim();
        const textoValor = String(form.valor).trim();
        const valor = Number(textoValor.includes(",") ? textoValor.replace(/\./g, "").replace(",", ".") : textoValor);
        if (!nome || !Number.isFinite(valor)) {
            return;
        }
        const atual = painel?.modo === "editar" ? lista.find((item) => item.id === painel.id) : null;
        try {
            await salvarOrcamento({
                ...atual,
                ...sinaisDoStatus(form.status || "em_aberto"),
                cliente: nome,
                fantasia: form.fantasia.trim(),
                valor,
                vendedor: form.vendedor.trim(),
                email: Boolean(form.email)
            });
            setPainel(null);
            await carregar();
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível salvar o orçamento.");
        }
    }

    async function duplicar(item) {
        try {
            await salvarOrcamento({
                ...item,
                id: null,
                numero: "",
                data: new Date().toISOString().slice(0, 10),
                ...sinaisDoStatus("rascunho")
            });
            setMenu(null);
            await carregar();
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível duplicar o orçamento.");
        }
    }

    async function excluir(id) {
        try {
            await excluirOrcamento(id);
            setMarcados((atual) => atual.filter((item) => item !== id));
            setMenu(null);
            await carregar();
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível excluir o orçamento.");
        }
    }

    async function importarExcel(arquivo) {
        if (!arquivo) {
            return;
        }
        setImportando(true);
        try {
            const itens = await lerPlanilhaOrcamentos(arquivo);
            if (!itens.length) {
                setAviso("A planilha não tem orçamentos com número ou cliente.");
                return;
            }
            const resumo = await importarOrcamentosLote(itens);
            await carregar();
            const falhas = resumo.erros ? `, ${resumo.erros} com erro` : "";
            setAviso(`${arquivo.name}: ${resumo.novos} novos, ${resumo.atualizados} atualizados${falhas}.`);
        } catch (erro) {
            console.error(erro);
            setAviso(erro?.response?.data?.mensagem || erro?.message || "Não foi possível importar a planilha.");
        } finally {
            setImportando(false);
            setMenu(null);
            if (planilhaRef.current) {
                planilhaRef.current.value = "";
            }
        }
    }

    function aplicarFiltros() {
        setPeriodo(rascunho.periodo);
        setAba(rascunho.status || "todas");
        setCliente(rascunho.cliente);
        setVendedor(rascunho.vendedor);
        setPagina(1);
        setMenu(null);
    }

    function limparFiltros() {
        setBusca("");
        setPeriodo("todos");
        setAba("aberto");
        setCliente("");
        setVendedor("");
        setRascunho({ periodo: "todos", status: "aberto", cliente: "", vendedor: "" });
        setPagina(1);
        setMenu(null);
    }

    function escolherAba(id) {
        setAba(id);
        setRascunho((atual) => ({ ...atual, status: id }));
        setPagina(1);
    }

    function ordenar(campo) {
        setOrdem((atual) => (
            atual.campo === campo
                ? { campo, dir: atual.dir === "asc" ? "desc" : "asc" }
                : { campo, dir: "asc" }
        ));
    }

    function abrirNovo() {
        setForm(vazioForm());
        setPainel({ modo: "novo" });
        setMenu(null);
    }

    function abrirEdicao(item) {
        setForm({
            cliente: item.cliente,
            fantasia: item.fantasia || "",
            valor: String(item.valor).replace(".", ","),
            status: item.status,
            vendedor: item.vendedor || "",
            email: Boolean(item.email)
        });
        setPainel({ modo: "editar", id: item.id });
        setMenu(null);
    }

    function exportar() {
        const linhas = ["Número;Data;Cliente;Nome fantasia;Valor;Status;Vendedor"];
        filtrados.forEach((item) => {
            linhas.push([
                item.numero,
                dataBR(item.data),
                item.cliente,
                item.fantasia || "",
                moeda(item.valor),
                STATUS[item.status]?.label || item.status,
                item.vendedor || ""
            ].join(";"));
        });
        const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "orcamentos.csv";
        link.click();
        URL.revokeObjectURL(url);
        setMenu(null);
    }

    function toggleMarca(id) {
        setMarcados((atual) => (atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]));
    }

    const todosVisiveis = visiveis.length > 0 && visiveis.every((item) => marcados.includes(item.id));
    const filtrosAtivos = Boolean(
        busca.trim()
        || periodo !== "todos"
        || aba !== "aberto"
        || cliente
        || vendedor
        || rascunho.periodo !== "todos"
        || rascunho.status !== "aberto"
        || rascunho.cliente
        || rascunho.vendedor
    );

    return (
        <div className="orc-page" ref={raiz}>
            <nav className="orc-crumb">
                <Link to="/index">Início</Link>
                <span>›</span>
                <Link to="/dashboard#/vendas">Vendas</Link>
                <span>›</span>
                <strong>Orçamento</strong>
            </nav>

            <header className="orc-hero">
                <img
                    className="orc-hero-banner"
                    src={bannerOrcamento}
                    alt="Orçamento. Crie, gerencie e acompanhe seus orçamentos comerciais."
                />
                <div className="orc-hero-acoes">
                    <button type="button" className="orc-novo" onClick={abrirNovo}>
                        <Plus size={16} /> Novo orçamento
                    </button>
                    <div className="orc-drop">
                        <button type="button" className={`orc-mais${menu === "mais" ? " is-on" : ""}`} onClick={() => setMenu(menu === "mais" ? null : "mais")}>
                            Mais ações <ChevronDown size={16} />
                        </button>
                        {menu === "mais" ? (
                            <div className="orc-menu">
                                <button type="button" disabled={importando} onClick={() => { planilhaRef.current?.click(); setMenu(null); }}>
                                    <Upload size={15} /> {importando ? "Importando…" : "Importar planilha (.xls)"}
                                </button>
                                <button type="button" disabled={importando} onClick={() => { setImportadorMassa(true); setMenu(null); }}>
                                    <FileSpreadsheet size={15} /> Importar planilha em massa (.xls)
                                </button>
                                <button type="button" onClick={exportar}>Exportar planilha (.csv)</button>
                                <button type="button" onClick={() => { window.print(); setMenu(null); }}>Imprimir lista</button>
                                {filtrosAtivos ? <button type="button" onClick={limparFiltros}>Limpar filtros</button> : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </header>

            {aviso ? <p className="orc-aviso">{aviso}</p> : null}

            <section className="orc-kpis">
                <Kpi titulo="Total de orçamentos" valor={String(kpis.total)} delta={comparacao.total} tom="rosa" icone={<FileText size={18} />} />
                <Kpi titulo="Em aberto" valor={String(kpis.abertos)} delta={comparacao.abertos} tom="amarelo" icone={<Hourglass size={18} />} />
                <Kpi titulo="Aprovados" valor={String(kpis.aprovados)} delta={comparacao.aprovados} tom="verde" icone={<Check size={18} />} />
                <Kpi titulo="Não aprovados" valor={String(kpis.recusados)} delta={comparacao.recusados} tom="vermelho" icone={<X size={18} />} />
                <Kpi titulo="Valor total (em aberto)" valor={moedaRS(kpis.valor)} delta={comparacao.valor} tom="roxo" icone={<CircleDollarSign size={18} />} />
            </section>

            <section className="orc-filtros">
                <label className="orc-busca">
                    <Search size={16} />
                    <input
                        value={busca}
                        onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                        placeholder="Pesquise por cliente, número, produto..."
                    />
                </label>
                <div className="orc-drop">
                    <button type="button" className={`orc-campo${menu === "periodo" ? " is-on" : ""}`} onClick={() => setMenu(menu === "periodo" ? null : "periodo")}>
                        <CalendarDays size={15} /> Por período <ChevronDown size={14} />
                    </button>
                    {menu === "periodo" ? (
                        <div className="orc-menu">
                            {[
                                ["todos", "Todo o período"],
                                ["mes", "Este mês"],
                                ["anterior", "Mês passado"],
                                ["30", "Últimos 30 dias"]
                            ].map(([id, label]) => (
                                <button key={id} type="button" className={rascunho.periodo === id ? "is-on" : ""} onClick={() => { setRascunho((a) => ({ ...a, periodo: id })); setMenu(null); }}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
                <label className="orc-select">
                    <span>Status</span>
                    <select value={rascunho.status} onChange={(e) => setRascunho((a) => ({ ...a, status: e.target.value }))}>
                        {ABAS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                </label>
                <label className="orc-select">
                    <span>Cliente</span>
                    <select value={rascunho.cliente} onChange={(e) => setRascunho((a) => ({ ...a, cliente: e.target.value }))}>
                        <option value="">Todos</option>
                        {clientes.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                    </select>
                </label>
                <label className="orc-select">
                    <span>Vendedor</span>
                    <select value={rascunho.vendedor} onChange={(e) => setRascunho((a) => ({ ...a, vendedor: e.target.value }))}>
                        <option value="">Todos</option>
                        {vendedores.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                    </select>
                </label>
                <button type="button" className="orc-filtrar" onClick={aplicarFiltros}>
                    <Filter size={15} /> Filtrar
                </button>
                {filtrosAtivos ? (
                    <button type="button" className="orc-limpar" onClick={limparFiltros}>
                        Limpar filtros
                    </button>
                ) : null}
            </section>

            <section className="orc-lista">
                <div className="orc-chips-linha">
                    <div className="orc-chips">
                        {ABAS.map((item) => (
                            <button key={item.id} type="button" className={`tom-${item.tom}${aba === item.id ? " is-on" : ""}`} onClick={() => escolherAba(item.id)}>
                                {item.label}
                                <b>{contagem(contagens[item.id])}</b>
                            </button>
                        ))}
                    </div>
                    <div className="orc-tools">
                        <div className="orc-drop">
                            <button type="button" className="orc-tool" aria-label="Colunas visíveis" onClick={() => setMenu(menu === "colunas" ? null : "colunas")}>
                                <LayoutGrid size={16} />
                            </button>
                            {menu === "colunas" ? (
                                <div className="orc-menu orc-menu-cols">
                                    {COLUNAS.map((coluna) => (
                                        <label key={coluna.id}>
                                            <input
                                                type="checkbox"
                                                checked={colunas.includes(coluna.id)}
                                                onChange={() => setColunas((atual) => (
                                                    atual.includes(coluna.id)
                                                        ? atual.filter((id) => id !== coluna.id)
                                                        : COLUNAS.map((c) => c.id).filter((id) => id === coluna.id || atual.includes(id))
                                                ))}
                                            />
                                            {coluna.label}
                                        </label>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                        <button type="button" className="orc-tool" aria-label="Mostrar todas as colunas" onClick={() => setColunas(COLUNAS.map((c) => c.id))}>
                            <Settings2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="orc-scroll">
                    <table className="orc-table">
                        <thead>
                            <tr>
                                <th className="orc-check">
                                    <input
                                        type="checkbox"
                                        checked={todosVisiveis}
                                        onChange={() => setMarcados(todosVisiveis ? [] : visiveis.map((item) => item.id))}
                                        aria-label="Selecionar página"
                                    />
                                </th>
                                {colunas.includes("numero") ? <Th campo="numero" ordem={ordem} onClick={ordenar}>Número</Th> : null}
                                {colunas.includes("data") ? <Th campo="data" ordem={ordem} onClick={ordenar}>Data</Th> : null}
                                {colunas.includes("cliente") ? <Th campo="cliente" ordem={ordem} onClick={ordenar}>Cliente</Th> : null}
                                {colunas.includes("fantasia") ? <th>Nome fantasia</th> : null}
                                {colunas.includes("valor") ? <Th campo="valor" ordem={ordem} onClick={ordenar}>Valor (R$)</Th> : null}
                                {colunas.includes("status") ? <th>Status</th> : null}
                                {colunas.includes("integracoes") ? <th>Integrações</th> : null}
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visiveis.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="orc-vazio">
                                        {loading ? "Carregando orçamentos..." : "Nenhum orçamento encontrado."}
                                        {!loading && filtrosAtivos ? <button type="button" onClick={limparFiltros}>Limpar filtros</button> : null}
                                    </td>
                                </tr>
                            ) : visiveis.map((item) => {
                                const status = STATUS[item.status] || STATUS.em_aberto;
                                return (
                                    <tr key={item.id} className={marcados.includes(item.id) ? "is-sel" : ""}>
                                        <td className="orc-check">
                                            <input type="checkbox" checked={marcados.includes(item.id)} onChange={() => toggleMarca(item.id)} aria-label={`Selecionar ${item.numero}`} />
                                        </td>
                                        {colunas.includes("numero") ? <td className="orc-num">{item.numero}</td> : null}
                                        {colunas.includes("data") ? <td>{dataBR(item.data)}</td> : null}
                                        {colunas.includes("cliente") ? <td>{item.cliente}</td> : null}
                                        {colunas.includes("fantasia") ? <td>{item.fantasia || "—"}</td> : null}
                                        {colunas.includes("valor") ? <td className="orc-valor">{moeda(item.valor)}</td> : null}
                                        {colunas.includes("status") ? (
                                            <td><span className={`orc-badge tom-${status.tom}`}>{status.label}</span></td>
                                        ) : null}
                                        {colunas.includes("integracoes") ? (
                                            <td>
                                                <span className="orc-ints">
                                                    <Mail size={15} className={item.email ? "is-on" : ""} />
                                                    <i className={`sinal-${item.sinal || "neutro"}`} />
                                                </span>
                                            </td>
                                        ) : null}
                                        <td className="orc-acoes">
                                            <button type="button" aria-label={`Ações do orçamento ${item.numero}`} onClick={() => setMenu(menu === item.id ? null : item.id)}>
                                                <MoreHorizontal size={16} />
                                            </button>
                                            {menu === item.id ? (
                                                <div className="orc-menu orc-menu-up">
                                                    <button type="button" onClick={() => { setPainel({ modo: "ver", item }); setMenu(null); }}>Visualizar</button>
                                                    <button type="button" onClick={() => abrirEdicao(item)}>Editar</button>
                                                    <button type="button" onClick={() => duplicar(item)}>Duplicar</button>
                                                    <button type="button" onClick={() => excluir(item.id)}>Excluir</button>
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <footer className="orc-foot">
                    <p>Exibindo {filtrados.length ? inicio + 1 : 0} a {fim} de {filtrados.length} orçamentos</p>
                    <div className="orc-pager">
                        <button type="button" aria-label="Página anterior" disabled={paginaAtual <= 1} onClick={() => setPagina(paginaAtual - 1)}>
                            <ChevronLeft size={16} />
                        </button>
                        <span>{paginaAtual}</span>
                        <button type="button" aria-label="Próxima página" disabled={paginaAtual >= paginas} onClick={() => setPagina(paginaAtual + 1)}>
                            <ChevronRight size={16} />
                        </button>
                        <label>
                            <select value={porPagina} aria-label="Itens por página" onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }}>
                                {[10, 20, 50].map((n) => <option key={n} value={n}>{n} por página</option>)}
                            </select>
                        </label>
                    </div>
                </footer>
            </section>

            {painel?.modo === "ver" ? (
                <div className="orc-modal-bg" onMouseDown={() => setPainel(null)}>
                    <article className="orc-modal" onMouseDown={(e) => e.stopPropagation()}>
                        <header>
                            <strong>Orçamento {painel.item.numero}</strong>
                            <button type="button" aria-label="Fechar" onClick={() => setPainel(null)}><X size={16} /></button>
                        </header>
                        <dl>
                            <div><dt>Data</dt><dd>{dataBR(painel.item.data)}</dd></div>
                            <div><dt>Cliente</dt><dd>{painel.item.cliente}</dd></div>
                            <div><dt>Nome fantasia</dt><dd>{painel.item.fantasia || "—"}</dd></div>
                            <div><dt>Vendedor</dt><dd>{painel.item.vendedor || "—"}</dd></div>
                            <div><dt>Valor</dt><dd>{moedaRS(painel.item.valor)}</dd></div>
                            <div><dt>Status</dt><dd>{STATUS[painel.item.status]?.label}</dd></div>
                        </dl>
                        <footer>
                            <button type="button" className="orc-novo" onClick={() => abrirEdicao(painel.item)}>Editar</button>
                        </footer>
                    </article>
                </div>
            ) : null}

            {painel?.modo === "novo" || painel?.modo === "editar" ? (
                <div className="orc-modal-bg" onMouseDown={() => setPainel(null)}>
                    <form className="orc-modal" onSubmit={salvar} onMouseDown={(e) => e.stopPropagation()}>
                        <header>
                            <strong>{painel.modo === "editar" ? "Editar orçamento" : "Novo orçamento"}</strong>
                            <button type="button" aria-label="Fechar" onClick={() => setPainel(null)}><X size={16} /></button>
                        </header>
                        <label>
                            Cliente
                            <input value={form.cliente} onChange={(e) => setForm((a) => ({ ...a, cliente: e.target.value }))} required />
                        </label>
                        <label>
                            Nome fantasia
                            <input value={form.fantasia} onChange={(e) => setForm((a) => ({ ...a, fantasia: e.target.value }))} />
                        </label>
                        <label>
                            Valor
                            <input value={form.valor} inputMode="decimal" onChange={(e) => setForm((a) => ({ ...a, valor: e.target.value }))} required />
                        </label>
                        <label>
                            Status
                            <select value={form.status} onChange={(e) => setForm((a) => ({ ...a, status: e.target.value }))}>
                                {Object.entries(STATUS).map(([id, meta]) => <option key={id} value={id}>{meta.label}</option>)}
                            </select>
                        </label>
                        <label>
                            Vendedor
                            <input value={form.vendedor} onChange={(e) => setForm((a) => ({ ...a, vendedor: e.target.value }))} />
                        </label>
                        <label className="orc-check-linha">
                            <input type="checkbox" checked={form.email} onChange={(e) => setForm((a) => ({ ...a, email: e.target.checked }))} />
                            Enviado por e-mail
                        </label>
                        <footer>
                            <button type="button" className="orc-limpar" onClick={() => setPainel(null)}>Cancelar</button>
                            <button type="submit" className="orc-novo">Salvar</button>
                        </footer>
                    </form>
                </div>
            ) : null}
            <input
                ref={planilhaRef}
                type="file"
                accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                hidden
                onChange={(e) => importarExcel(e.target.files?.[0])}
            />
            <ImportadorMassa
                aberto={importadorMassa}
                ocupado={importando}
                onFechar={() => setImportadorMassa(false)}
                titulo="Importar orçamentos"
                descricao="Selecione várias planilhas de orçamentos (.xls/.xlsx/.csv) de uma vez."
                aceitos=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                permitirXml={false}
                rotuloItem="orçamentos"
                rotuloArquivo="planilha"
                onBaixarModelo={baixarLayoutOrcamento}
                lerExcel={lerArquivoOrcamento}
                mesclar={mesclarLeiturasOrcamentos}
                importarLote={importarOrcamentosLote}
                onConcluido={async (mensagem) => {
                    setAviso(mensagem);
                    await carregar();
                }}
            />
        </div>
    );
}

function Kpi({ titulo, valor, delta, tom, icone }) {
    const classe = delta > 0 ? "is-up" : delta < 0 ? "is-down" : "is-flat";
    const Icone = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
    return (
        <article>
            <i className={`tom-${tom}`}>{icone}</i>
            <div>
                <span>{titulo}</span>
                <strong>{valor}</strong>
                <em className={classe}>
                    <Icone size={13} /> {delta > 0 ? "+" : ""}{delta}%
                </em>
                <small>vs. período anterior</small>
            </div>
        </article>
    );
}

function Th({ campo, ordem, onClick, children }) {
    const ativo = ordem.campo === campo;
    return (
        <th>
            <button type="button" className={ativo ? "is-on" : ""} onClick={() => onClick(campo)}>
                {children}
                <ChevronDown size={12} className={ativo && ordem.dir === "asc" ? "is-asc" : ""} />
            </button>
        </th>
    );
}
