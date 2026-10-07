import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRightLeft,
    ArrowUpDown,
    Boxes,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleHelp,
    ClipboardList,
    Copy,
    Eye,
    Filter,
    MapPin,
    MapPinOff,
    MoreVertical,
    Package,
    PenLine,
    Printer,
    Tags,
    Warehouse
} from "lucide-react";

import BuscaLocalizacao from "../../components/BuscaLocalizacao";
import ModalEstoqueLocal from "../../components/ModalEstoqueLocal";
import { garantirCatalogoLoja, produtosLoja } from "../../constants/catalogoLoja";
import ROTAS from "../../constants/rotas";
import { imprimirEtiquetasGondola } from "../../services/etiquetaGondola";
import { listarInventarios } from "../../services/inventario.service";
import {
    SEM_LOCAL_ROTULO,
    SEM_PRATELEIRA,
    filtrarPorLocalizacao,
    gravarLocalProduto,
    imprimirProdutosLocalizacao,
    localizacaoDe,
    metricasCatalogo,
    resumirLocalizacoes,
    setorDaLocalizacao,
    situacaoEstoque
} from "../../services/localizacao";
import { listarMovimentacoes } from "../../services/movimentacao.service";
import { urlMidia } from "../../services/produtoMidia.service";
import { atualizarProduto, listarProdutos } from "../../services/produto.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/localizacao.css";

const TAMANHOS = [10, 20, 50];

function qtd(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function nomeExibicao(produto) {
    const bruto = String(produto?.nome || "").trim();
    return bruto.replace(/^\d+\s*[:.\-]\s*/, "").trim() || bruto || "—";
}

function codigoExibicao(produto) {
    const sku = String(produto?.sku || "").trim();
    const gtin = String(produto?.gtin || produto?.codigoBarras || "").trim();
    const id = String(produto?.id || "");
    if (sku && sku !== id && !/^\d{1,4}$/.test(sku)) {
        return sku;
    }
    return gtin || (sku && sku !== id ? sku : "") || sku || "—";
}

function visualProduto(produto) {
    const capa = produto.imagem || produto.fotos?.[0]?.url;
    if (capa) {
        return { bg: "#fce7f3", img: urlMidia(capa), emoji: "" };
    }
    const t = `${nomeExibicao(produto)} ${produto.grupo || ""}`.toUpperCase();
    if (/CADERN/.test(t)) {
        return { bg: "#fef3c7", emoji: "📒" };
    }
    if (/CANETA|MARCA.?TEXTO/.test(t)) {
        return { bg: "#dbeafe", emoji: "🖊️" };
    }
    if (/L[AÁ]PIS/.test(t)) {
        return { bg: "#fce7f3", emoji: "✏️" };
    }
    if (/TESOURA/.test(t)) {
        return { bg: "#ede9fe", emoji: "✂️" };
    }
    if (/COLA/.test(t)) {
        return { bg: "#dcfce7", emoji: "🧴" };
    }
    if (/POST.?IT|BLOCO/.test(t)) {
        return { bg: "#ffedd5", emoji: "🟨" };
    }
    const letras = nomeExibicao(produto).replace(/[^A-Za-zÀ-ÿ]/g, "");
    return { bg: "#fce7f3", emoji: (letras[0] || nomeExibicao(produto)[0] || "?").toUpperCase() };
}

function corCategoria(nome) {
    const n = String(nome || "").toUpperCase();
    if (n.includes("PAPEL")) {
        return "#ec4899";
    }
    if (n.includes("UTIL")) {
        return "#8b5cf6";
    }
    if (n.includes("BRINQ")) {
        return "#f59e0b";
    }
    if (n.includes("PRESENT")) {
        return "#14b8a6";
    }
    return "#f472b6";
}

function filtroDaUrl(params) {
    const valor = params.get("estoque");
    if (valor === "sem" || valor === "negativo" || valor === "disponivel") {
        return valor;
    }
    return params.get("comEstoque") === "1" ? "disponivel" : "todos";
}

function instanteDe(valor) {
    if (!valor) {
        return 0;
    }
    if (Array.isArray(valor) && valor.length >= 3) {
        const [ano, mes, dia, hora = 0, min = 0, seg = 0] = valor;
        const data = new Date(ano, mes - 1, dia, hora, min, seg);
        return Number.isNaN(data.getTime()) ? 0 : data.getTime();
    }
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? 0 : data.getTime();
}

function fmtData(ms) {
    if (!ms) {
        return "—";
    }
    return new Date(ms).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function janelaPaginas(atual, total) {
    const tamanho = 5;
    let inicio = Math.max(1, atual - 2);
    let fim = Math.min(total, inicio + tamanho - 1);
    inicio = Math.max(1, fim - tamanho + 1);
    const nums = [];
    for (let n = inicio; n <= fim; n += 1) {
        nums.push(n);
    }
    return nums;
}

function serieDe(valores) {
    const nums = (valores || []).map(Number).filter((n) => Number.isFinite(n));
    if (!nums.length) {
        return [0, 0, 0, 0];
    }
    if (nums.length === 1) {
        return [nums[0], nums[0], nums[0], nums[0]];
    }
    const passo = Math.max(1, Math.ceil(nums.length / 8));
    const saida = [];
    for (let i = 0; i < nums.length && saida.length < 8; i += passo) {
        saida.push(nums[i]);
    }
    if (saida[saida.length - 1] !== nums[nums.length - 1]) {
        saida.push(nums[nums.length - 1]);
    }
    return saida;
}

function Spark({ valores, cor }) {
    const vals = serieDe(valores);
    const w = 92;
    const h = 34;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const pontos = vals.map((valor, i) => {
        const x = vals.length === 1 ? w / 2 : (i / (vals.length - 1)) * w;
        const y = h - ((valor - min) / span) * (h - 6) - 3;
        return `${x},${y}`;
    }).join(" ");
    return (
        <svg className="loc-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
            <polyline fill="none" stroke={cor} strokeWidth="2.2" points={pontos} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function csvCelula(valor) {
    return `"${String(valor ?? "").replace(/"/g, "\"\"")}"`;
}

function baixarCsv(nome, linhas) {
    const csv = linhas.map((row) => row.map(csvCelula).join(";")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nome;
    link.click();
    URL.revokeObjectURL(link.href);
}

function produtosUnicos(grupos) {
    const mapa = new Map();
    for (const grupo of grupos) {
        for (const produto of grupo.itens || []) {
            mapa.set(String(produto.id), produto);
        }
    }
    return [...mapa.values()];
}

function tituloMovimento(grupo) {
    if (grupo.movimento && grupo.contagem) {
        return grupo.movimento >= grupo.contagem
            ? "Última movimentação de estoque"
            : `Contagem de inventário em ${fmtData(grupo.contagem)}. Movimentação em ${fmtData(grupo.movimento)}.`;
    }
    if (grupo.contagem) {
        return "Última contagem registrada no inventário";
    }
    if (grupo.movimento) {
        return "Última movimentação de estoque";
    }
    return "Sem movimentação nem contagem nesta prateleira";
}

function dataExibida(grupo) {
    return fmtData(Math.max(grupo.movimento || 0, grupo.contagem || 0));
}

export default function Localizacoes() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [produtos, setProdutos] = useState([]);
    const [movPorProduto, setMovPorProduto] = useState(() => new Map());
    const [contagemPorLocal, setContagemPorLocal] = useState(() => new Map());
    const [carregando, setCarregando] = useState(true);
    const [aberta, setAberta] = useState(params.get("localizacao") || "");
    const [busca, setBusca] = useState("");
    const [texto, setTexto] = useState("");
    const [filtroEstoque, setFiltroEstoque] = useState(() => filtroDaUrl(params));
    const [setor, setSetor] = useState("");
    const [aviso, setAviso] = useState("");
    const [categoria, setCategoria] = useState("todas");
    const [ordem, setOrdem] = useState("nome");
    const [ordemLoc, setOrdemLoc] = useState("localizacao");
    const [dirLoc, setDirLoc] = useState("asc");
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);
    const [sel, setSel] = useState(() => new Set());
    const [menuId, setMenuId] = useState("");
    const [painel, setPainel] = useState("");
    const [modal, setModal] = useState(null);

    useEffect(() => {
        let vivo = true;
        (async () => {
            try {
                await garantirCatalogoLoja();
            } catch {
                /* catálogo local */
            }
            let lista = [];
            try {
                lista = await listarProdutos();
            } catch {
                lista = [];
            }
            if (!Array.isArray(lista) || !lista.length) {
                lista = produtosLoja();
            }
            let movimentos = [];
            let inventarios = [];
            try {
                movimentos = await listarMovimentacoes();
            } catch {
                movimentos = [];
            }
            try {
                inventarios = await listarInventarios();
            } catch {
                inventarios = [];
            }
            if (!vivo) {
                return;
            }
            const porProduto = new Map();
            for (const mov of movimentos || []) {
                const id = String(mov.produtoId || "");
                const ms = instanteDe(mov.dataMovimento);
                if (!id || !ms || ms <= (porProduto.get(id) || 0)) {
                    continue;
                }
                porProduto.set(id, ms);
            }
            const porLocal = new Map();
            for (const inv of inventarios || []) {
                const chave = String(inv.localizacao || "").trim().toLowerCase();
                const ms = instanteDe(inv.dataInventario);
                if (!chave || !ms || ms <= (porLocal.get(chave) || 0)) {
                    continue;
                }
                porLocal.set(chave, ms);
            }
            setMovPorProduto(porProduto);
            setContagemPorLocal(porLocal);
            setProdutos(lista);
            setCarregando(false);
        })();
        return () => {
            vivo = false;
        };
    }, []);

    useEffect(() => {
        const next = new URLSearchParams();
        if (aberta.trim()) {
            next.set("localizacao", aberta.trim());
        }
        if (filtroEstoque && filtroEstoque !== "todos") {
            next.set("estoque", filtroEstoque);
        }
        setParams(next, { replace: true });
    }, [aberta, filtroEstoque, setParams]);

    const filtroChave = [aberta, busca, texto, filtroEstoque, setor, porPagina, ordem, ordemLoc, dirLoc].join("|");
    const [chaveLista, setChaveLista] = useState(filtroChave);
    if (chaveLista !== filtroChave) {
        setChaveLista(filtroChave);
        setPagina(1);
        setSel(new Set());
        setMenuId("");
    }

    const metricas = useMemo(() => metricasCatalogo(produtos), [produtos]);

    const resumo = useMemo(() => resumirLocalizacoes(produtos, filtroEstoque).map((grupo) => {
        let movimento = 0;
        for (const item of grupo.itens) {
            const ms = movPorProduto.get(String(item.id)) || 0;
            if (ms > movimento) {
                movimento = ms;
            }
        }
        return {
            ...grupo,
            movimento,
            contagem: contagemPorLocal.get(grupo.localizacao.toLowerCase()) || 0
        };
    }), [produtos, filtroEstoque, movPorProduto, contagemPorLocal]);

    const setores = useMemo(() => {
        const mapa = new Map();
        for (const item of resumo) {
            const nome = setorDaLocalizacao(item.localizacao);
            mapa.set(nome, (mapa.get(nome) || 0) + 1);
        }
        return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt"));
    }, [resumo]);

    const chips = useMemo(() => {
        const ranked = [...resumo].sort((a, b) => b.qtd - a.qtd || a.localizacao.localeCompare(b.localizacao, "pt", { numeric: true }));
        const top = ranked.filter((item) => item.localizacao !== SEM_LOCAL_ROTULO).slice(0, 10);
        const sem = ranked.find((item) => item.localizacao === SEM_LOCAL_ROTULO);
        return sem ? [...top, sem] : top;
    }, [resumo]);

    const listaLocais = useMemo(() => {
        const q = busca.trim().toLowerCase();
        const dados = resumo.filter((item) => {
            if (setor && setorDaLocalizacao(item.localizacao) !== setor) {
                return false;
            }
            if (!q) {
                return true;
            }
            if (item.localizacao.toLowerCase().includes(q) || setorDaLocalizacao(item.localizacao).toLowerCase().includes(q)) {
                return true;
            }
            return item.itens.some((p) => [p.nome, p.sku, p.gtin, p.codigoBarras].join(" ").toLowerCase().includes(q));
        });
        const cmp = {
            localizacao: (a, b) => a.localizacao.localeCompare(b.localizacao, "pt", { numeric: true }),
            produtos: (a, b) => a.qtd - b.qtd,
            estoque: (a, b) => a.estoque - b.estoque,
            ocupacao: (a, b) => a.ocupacao - b.ocupacao,
            movimento: (a, b) => Math.max(a.movimento, a.contagem) - Math.max(b.movimento, b.contagem),
            status: (a, b) => a.status.nome.localeCompare(b.status.nome, "pt")
        }[ordemLoc] || ((a, b) => a.localizacao.localeCompare(b.localizacao, "pt", { numeric: true }));
        const fator = dirLoc === "desc" ? -1 : 1;
        return [...dados].sort((a, b) => {
            if (ordemLoc === "localizacao") {
                if (a.localizacao === SEM_LOCAL_ROTULO) {
                    return 1;
                }
                if (b.localizacao === SEM_LOCAL_ROTULO) {
                    return -1;
                }
            }
            return cmp(a, b) * fator;
        });
    }, [resumo, busca, setor, ordemLoc, dirLoc]);

    const grupoAberto = resumo.find((item) => item.localizacao.toLowerCase() === aberta.trim().toLowerCase()) || null;

    const filtrados = useMemo(() => {
        if (!aberta.trim()) {
            return [];
        }
        return filtrarPorLocalizacao(produtos, aberta, filtroEstoque).map((p) => ({
            ...p,
            localizacao: localizacaoDe(p) || SEM_LOCAL_ROTULO
        }));
    }, [produtos, aberta, filtroEstoque]);

    const categorias = useMemo(() => {
        const nomes = [...new Set(filtrados.map((p) => p.grupo || p.categoria).filter(Boolean))];
        return nomes.sort((a, b) => a.localeCompare(b, "pt"));
    }, [filtrados]);

    const lista = useMemo(() => {
        const q = texto.trim().toLowerCase();
        const dados = filtrados.filter((p) => {
            if (categoria !== "todas" && String(p.grupo || p.categoria) !== categoria) {
                return false;
            }
            if (!q) {
                return true;
            }
            return [nomeExibicao(p), codigoExibicao(p), p.grupo, p.categoria, p.marca].join(" ").toLowerCase().includes(q);
        });
        const chave = {
            nome: (a, b) => nomeExibicao(a).localeCompare(nomeExibicao(b), "pt"),
            sku: (a, b) => String(codigoExibicao(a)).localeCompare(String(codigoExibicao(b)), "pt"),
            estoque: (a, b) => Number(b.estoque || 0) - Number(a.estoque || 0),
            localizacao: (a, b) => String(a.localizacao).localeCompare(String(b.localizacao), "pt", { numeric: true })
        }[ordem] || ((a, b) => nomeExibicao(a).localeCompare(nomeExibicao(b), "pt"));
        return [...dados].sort(chave);
    }, [filtrados, categoria, ordem, texto]);

    const modoLocais = !aberta.trim();
    const fonte = modoLocais ? listaLocais : lista;
    const paginas = Math.max(1, Math.ceil(fonte.length / porPagina));
    const paginaAtual = Math.min(pagina, paginas);
    const fatia = lista.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);
    const fatiaLocais = listaLocais.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);
    const gruposAlvo = modoLocais
        ? (sel.size ? listaLocais.filter((item) => sel.has(item.localizacao)) : listaLocais)
        : [];
    const imprimiveis = modoLocais
        ? produtosUnicos(gruposAlvo)
        : lista.filter((p) => !sel.size || sel.has(String(p.id)));
    const alvoUnico = aberta.trim() || (sel.size === 1 ? [...sel][0] : "");
    const sufixoEstoque = filtroEstoque && filtroEstoque !== "todos" ? `&estoque=${filtroEstoque}` : "";
    const queryProdutos = alvoUnico
        ? `${ROTAS.PRODUTOS}?localizacao=${encodeURIComponent(alvoUnico)}${sufixoEstoque}`
        : ROTAS.PRODUTOS;
    const queryInventario = alvoUnico
        ? `${ROTAS.INVENTARIO}?localizacao=${encodeURIComponent(alvoUnico)}${sufixoEstoque}`
        : ROTAS.INVENTARIO;
    const queryEstoque = alvoUnico
        ? `${ROTAS.ESTOQUE}?localizacao=${encodeURIComponent(alvoUnico)}${sufixoEstoque}`
        : ROTAS.ESTOQUE;

    const series = useMemo(() => {
        const ordenados = [...resumo].filter((item) => item.localizacao !== SEM_LOCAL_ROTULO);
        return {
            locais: ordenados.map((item) => item.qtd),
            comEstoque: ordenados.filter((item) => item.estoque > 0).map((item) => item.estoque),
            produtos: ordenados.map((item) => item.qtd),
            unidades: ordenados.map((item) => item.estoque)
        };
    }, [resumo]);

    function alternarOrdem(coluna) {
        if (ordemLoc === coluna) {
            setDirLoc((atual) => (atual === "asc" ? "desc" : "asc"));
            return;
        }
        setOrdemLoc(coluna);
        setDirLoc(coluna === "localizacao" || coluna === "status" ? "asc" : "desc");
    }

    function abrirLocal(codigo) {
        setAberta(codigo);
        setTexto("");
        setCategoria("todas");
        setPainel("");
    }

    function teclaBusca(evento) {
        if (evento.key !== "Enter" || !modoLocais) {
            return;
        }
        const q = busca.trim().toLowerCase();
        const exato = listaLocais.find((item) => item.localizacao.toLowerCase() === q);
        if (exato) {
            abrirLocal(exato.localizacao);
            return;
        }
        if (listaLocais.length === 1) {
            abrirLocal(listaLocais[0].localizacao);
        }
    }

    function toggleSel(id) {
        const chave = String(id);
        setSel((atual) => {
            const prox = new Set(atual);
            if (prox.has(chave)) {
                prox.delete(chave);
            } else {
                prox.add(chave);
            }
            return prox;
        });
    }

    function toggleTodosLocais() {
        if (fatiaLocais.length && fatiaLocais.every((item) => sel.has(item.localizacao))) {
            setSel(new Set());
            return;
        }
        setSel(new Set(fatiaLocais.map((item) => item.localizacao)));
    }

    function toggleTodos() {
        if (fatia.every((p) => sel.has(String(p.id)))) {
            setSel(new Set());
            return;
        }
        setSel(new Set(fatia.map((p) => String(p.id))));
    }

    function copiar(textoCopia) {
        navigator.clipboard?.writeText(textoCopia).then(() => setAviso("Copiado.")).catch(() => {});
        setMenuId("");
        setPainel("");
    }

    function abrirEdicao(produto) {
        if (!produto?.id) {
            return;
        }
        navigate(`${ROTAS.PRODUTOS}?edit=${encodeURIComponent(produto.id)}`);
    }

    async function mudarPrateleira(produto, nova) {
        const valor = String(nova || "").trim();
        gravarLocalProduto(produto.id, valor || SEM_PRATELEIRA);
        try {
            if (produto.id) {
                await atualizarProduto(produto.id, { ...produto, localizacao: valor });
            }
        } catch {
            /* catálogo local já gravado */
        }
        setProdutos((atual) => atual.map((p) => (
            String(p.id) === String(produto.id) ? { ...p, localizacao: valor } : p
        )));
        setAviso(valor ? `Produto gravado em ${valor}.` : "Produto saiu da prateleira e ficou sem localização.");
        setModal(null);
        setMenuId("");
    }

    function exportarLocais(grupos) {
        const linhas = [["Localização", "Setor", "Produtos", "Estoque", "Ocupação %", "Última movimentação", "Status"]];
        for (const item of grupos) {
            linhas.push([
                item.localizacao,
                setorDaLocalizacao(item.localizacao),
                item.qtd,
                item.estoque,
                item.ocupacao,
                dataExibida(item),
                item.status.nome
            ]);
        }
        baixarCsv("localizacoes.csv", linhas);
        setPainel("");
        setAviso("Planilha de prateleiras gerada.");
    }

    function exportarProdutos(itens) {
        const linhas = [["SKU", "Produto", "Categoria", "Localização", "Estoque", "Mínimo", "Máximo", "Situação"]];
        for (const produto of itens) {
            const sit = situacaoEstoque(produto);
            linhas.push([
                codigoExibicao(produto),
                nomeExibicao(produto),
                produto.grupo || produto.categoria || "",
                localizacaoDe(produto) || SEM_LOCAL_ROTULO,
                produto.estoque ?? "",
                produto.estoqueMinimo ?? "",
                produto.estoqueMaximo ?? "",
                sit.nome
            ]);
        }
        baixarCsv(alvoUnico ? `produtos-${alvoUnico}.csv` : "produtos-localizacoes.csv", linhas);
        setPainel("");
        setAviso("Planilha de produtos gerada.");
    }

    function imprimirAlvo() {
        if (!imprimiveis.length) {
            return;
        }
        const umSo = modoLocais && new Set(imprimiveis.map((p) => localizacaoDe(p) || SEM_LOCAL_ROTULO)).size === 1;
        imprimirProdutosLocalizacao(imprimiveis, umSo ? (localizacaoDe(imprimiveis[0]) || aberta) : aberta);
        setPainel("");
    }

    const rotuloVazio = filtroEstoque === "disponivel"
        ? " com estoque disponível"
        : filtroEstoque === "sem"
            ? " sem estoque disponível"
            : filtroEstoque === "negativo"
                ? " com estoque negativo"
                : "";
    const pctComEstoque = metricas.total
        ? ((metricas.comEstoque / metricas.total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })
        : "0";

    function Th({ id, children }) {
        return (
            <th>
                <button type="button" className={`loc-th${ordemLoc === id ? " is-on" : ""}`} onClick={() => alternarOrdem(id)}>
                    {children}
                    <ArrowUpDown size={12} />
                </button>
            </th>
        );
    }

    return (
        <div className="loc-page has-pager">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>cadastros</span>
                <span>›</span>
                <Link to={ROTAS.LOCALIZACOES} onClick={(e) => { e.preventDefault(); setAberta(""); setBusca(""); }}>localizações</Link>
                {aberta ? (
                    <>
                        <span>›</span>
                        <span>{aberta}</span>
                    </>
                ) : (
                    <>
                        <span>›</span>
                        <span>prateleiras</span>
                    </>
                )}
            </nav>

            <header className="loc-hero">
                <div>
                    <h2>{aberta ? (aberta === SEM_LOCAL_ROTULO ? "Produtos sem prateleira" : `Prateleira ${aberta}`) : "Localização → produtos"}</h2>
                    <p>
                        {aberta
                            ? "Produtos gravados neste código no cadastro. A ocupação usa o estoque contra o máximo (ou o mínimo, se não houver máximo)."
                            : "Prateleira, caixa, corredor ou setor que está no cadastro do produto. Abaixo, o que cada uma guarda e como liga com estoque, inventário e separação."}
                    </p>
                    {aviso ? <p className="loc-aviso">{aviso}</p> : null}
                    {carregando ? <p className="loc-aviso">Lendo catálogo, movimentações e inventários…</p> : null}
                </div>
                <div className="loc-menu-wrap">
                    <button type="button" className="loc-btn" onClick={() => setPainel(painel === "ajuda" ? "" : "ajuda")}>
                        <CircleHelp size={16} /> Ajuda
                    </button>
                    {painel === "ajuda" ? (
                        <div className="loc-pop loc-ajuda">
                            <p>O código vem do campo localização do produto. Nada é inventado: quem não tem prateleira aparece em Sem localização.</p>
                            <p>Ocupação é o estoque dividido pelo máximo. Sem máximo, a conta usa quatro vezes o mínimo. Abaixo de 30%, ou com metade dos itens no mínimo, a prateleira fica como estoque baixo.</p>
                            <p>A data junta a última movimentação da auditoria de estoque e a última contagem do inventário.</p>
                            <p>Sugerir pelo grupo só preenche o código quando você pede, na troca de prateleira. Confirmar grava no cadastro.</p>
                        </div>
                    ) : null}
                </div>
            </header>

            <div className="loc-kpis">
                <button type="button" className={`loc-kpi${filtroEstoque === "todos" && !aberta && !setor ? " is-on" : ""}`} onClick={() => { setFiltroEstoque("todos"); setSetor(""); setBusca(""); setAberta(""); }}>
                    <span className="loc-kpi-ico is-rosa"><MapPin size={18} /></span>
                    <small>Total de localizações</small>
                    <strong>{qtd(metricas.total)}</strong>
                    <Spark valores={series.locais} cor="#f472b6" />
                </button>
                <button type="button" className={`loc-kpi${filtroEstoque === "disponivel" ? " is-on" : ""}`} onClick={() => setFiltroEstoque(filtroEstoque === "disponivel" ? "todos" : "disponivel")}>
                    <span className="loc-kpi-ico is-verde"><Boxes size={18} /></span>
                    <small>Localizações com estoque</small>
                    <strong>{qtd(metricas.comEstoque)}</strong>
                    <em>{pctComEstoque}% do total</em>
                    <Spark valores={series.comEstoque} cor="#34d399" />
                </button>
                <button type="button" className="loc-kpi" onClick={() => metricas.sem ? abrirLocal(SEM_LOCAL_ROTULO) : setAberta("")}>
                    <span className="loc-kpi-ico is-roxo"><Package size={18} /></span>
                    <small>Produtos armazenados</small>
                    <strong>{qtd(metricas.produtos)}</strong>
                    <em>{metricas.sem ? `${qtd(metricas.sem)} sem prateleira` : "produtos únicos"}</em>
                    <Spark valores={series.produtos} cor="#a78bfa" />
                </button>
                <button type="button" className="loc-kpi" onClick={() => { setAberta(""); alternarOrdem("estoque"); }}>
                    <span className="loc-kpi-ico is-ambar"><Warehouse size={18} /></span>
                    <small>Estoque total</small>
                    <strong>{qtd(metricas.estoque)}</strong>
                    <em>unidades</em>
                    <Spark valores={series.unidades} cor="#fbbf24" />
                </button>
            </div>

            {aberta ? (
                <button type="button" className="loc-voltar" onClick={() => setAberta("")}>
                    <ArrowLeft size={15} /> Todas as prateleiras
                </button>
            ) : null}

            <div className="loc-barra">
                <BuscaLocalizacao
                    localizacao={modoLocais ? busca : texto}
                    onLocalizacao={modoLocais ? setBusca : setTexto}
                    onKeyDown={teclaBusca}
                    filtroEstoque={filtroEstoque}
                    onFiltroEstoque={setFiltroEstoque}
                    placeholder={modoLocais ? "Ex.: PT-150, caixa, corredor ou setor" : "Filtrar produto ou SKU nesta prateleira"}
                >
                    {modoLocais ? (
                        <div className="loc-menu-wrap">
                            <button type="button" className="loc-btn" onClick={() => setPainel(painel === "filtros" ? "" : "filtros")}>
                                <Filter size={15} /> Filtros
                            </button>
                            {painel === "filtros" ? (
                                <div className="loc-pop">
                                    <button type="button" className={!setor ? "is-on" : ""} onClick={() => { setSetor(""); setPainel(""); }}>
                                        Todos os setores
                                    </button>
                                    {setores.map(([nome, total]) => (
                                        <button type="button" key={nome} className={setor === nome ? "is-on" : ""} onClick={() => { setSetor(nome); setPainel(""); }}>
                                            {nome} <span>{total}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </BuscaLocalizacao>
            </div>

            {modoLocais && chips.length ? (
                <div className="loc-chips">
                    {chips.map((chip) => (
                        <button
                            type="button"
                            key={chip.localizacao}
                            className={busca.trim().toUpperCase() === chip.localizacao.toUpperCase() ? "is-on" : ""}
                            onClick={() => abrirLocal(chip.localizacao)}
                        >
                            {chip.localizacao}
                        </button>
                    ))}
                </div>
            ) : null}

            <div className="loc-acoes">
                <button type="button" className="loc-btn-pri" disabled={!imprimiveis.length} onClick={imprimirAlvo}>
                    <Printer size={16} /> Imprimir lista / contagem
                </button>
                <Link className="loc-btn" to={queryProdutos}>
                    <ClipboardList size={16} /> Abrir no cadastro de produtos
                </Link>
                <Link className="loc-btn" to={queryInventario}>
                    <Package size={16} /> Contar no inventário
                </Link>
                <div className="loc-menu-wrap">
                    <button type="button" className="loc-btn" onClick={() => setPainel(painel === "exportar" ? "" : "exportar")}>
                        Exportar <ChevronDown size={14} />
                    </button>
                    {painel === "exportar" ? (
                        <div className="loc-pop">
                            {modoLocais ? (
                                <button type="button" onClick={() => exportarLocais(sel.size ? listaLocais.filter((item) => sel.has(item.localizacao)) : listaLocais)}>
                                    Planilha das prateleiras
                                </button>
                            ) : null}
                            <button type="button" disabled={!imprimiveis.length} onClick={() => exportarProdutos(imprimiveis)}>
                                Planilha dos produtos
                            </button>
                            <button type="button" disabled={!imprimiveis.length} onClick={() => { imprimirEtiquetasGondola(imprimiveis); setPainel(""); }}>
                                <Tags size={13} /> Etiquetas de gôndola
                            </button>
                            <button type="button" disabled={!imprimiveis.length} onClick={imprimirAlvo}>
                                <Printer size={13} /> Lista de contagem
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            <nav className="loc-ligacoes" aria-label="Ligações do sistema">
                <Link to={queryProdutos}>Produtos</Link>
                <Link to={queryInventario}>Inventário</Link>
                <Link to={queryEstoque}>Controle de estoque</Link>
                <Link to={ROTAS.AUDITORIA_ESTOQUE}>Auditoria de estoque</Link>
                <Link to={ROTAS.SEPARACAO}>Separação</Link>
                <Link to={ROTAS.NECESSIDADES_COMPRA}>Necessidades de compra</Link>
                <Link to={ROTAS.DASHBOARD_SUPRIMENTOS}>Painel de estoque</Link>
            </nav>

            {modoLocais && sel.size ? (
                <div className="loc-lote">
                    <strong>{sel.size} selecionada(s)</strong>
                    <button type="button" onClick={() => copiar([...sel].join(", "))}>Copiar códigos</button>
                    <button type="button" onClick={imprimirAlvo}>Imprimir</button>
                    <button type="button" onClick={() => exportarLocais(listaLocais.filter((item) => sel.has(item.localizacao)))}>Exportar</button>
                    {sel.size === 1 ? <Link to={queryInventario}>Contar</Link> : null}
                    <button type="button" onClick={() => setSel(new Set())}>Limpar</button>
                </div>
            ) : null}

            <section className="loc-card">
                <div className="loc-card-head">
                    <h3>{modoLocais ? "Prateleiras e setores" : "Produtos na localização"}</h3>
                    <div className="loc-card-acoes">
                        {modoLocais ? null : (
                            <>
                                <div className="loc-menu-wrap">
                                    <button type="button" className="loc-btn-ghost" onClick={() => setPainel(painel === "categoria" ? "" : "categoria")}>
                                        <Filter size={15} /> Filtros
                                    </button>
                                    {painel === "categoria" ? (
                                        <div className="loc-pop">
                                            <button type="button" className={categoria === "todas" ? "is-on" : ""} onClick={() => { setCategoria("todas"); setPainel(""); }}>
                                                Todas as categorias
                                            </button>
                                            {categorias.map((c) => (
                                                <button type="button" key={c} className={categoria === c ? "is-on" : ""} onClick={() => { setCategoria(c); setPainel(""); }}>
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                                <label className="loc-ordenar">
                                    <ArrowUpDown size={15} />
                                    <select value={ordem} onChange={(e) => setOrdem(e.target.value)} aria-label="Ordenar por">
                                        <option value="nome">Produto</option>
                                        <option value="sku">SKU</option>
                                        <option value="localizacao">Localização</option>
                                        <option value="estoque">Estoque</option>
                                    </select>
                                </label>
                            </>
                        )}
                        {grupoAberto ? (
                            <span className={`loc-sit is-${grupoAberto.status.id}`}>{grupoAberto.status.nome}</span>
                        ) : null}
                        <div className="loc-total">
                            <Package size={16} />
                            <span>{modoLocais ? "Total de localizações" : "Total de produtos"}</span>
                            <strong>{qtd(fonte.length)}</strong>
                        </div>
                    </div>
                </div>

                <div className="loc-scroll">
                    <table className="loc-table">
                        <thead>
                            {modoLocais ? (
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={fatiaLocais.length > 0 && fatiaLocais.every((item) => sel.has(item.localizacao))}
                                            onChange={toggleTodosLocais}
                                            aria-label="Selecionar visíveis"
                                        />
                                    </th>
                                    <Th id="localizacao">Localização</Th>
                                    <Th id="produtos">Produtos</Th>
                                    <Th id="estoque">Estoque</Th>
                                    <Th id="ocupacao">Ocupação</Th>
                                    <Th id="movimento">Última movimentação</Th>
                                    <Th id="status">Status</Th>
                                    <th>Ações</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={fatia.length > 0 && fatia.every((p) => sel.has(String(p.id)))}
                                            onChange={toggleTodos}
                                            aria-label="Selecionar visíveis"
                                        />
                                    </th>
                                    <th>SKU</th>
                                    <th>Produto</th>
                                    <th>Categoria</th>
                                    <th>Localização</th>
                                    <th>Estoque</th>
                                    <th>Situação</th>
                                    <th>Ações</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {modoLocais && fatiaLocais.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="loc-vazio">
                                        {carregando ? "Carregando localizações…" : `Nenhuma prateleira${rotuloVazio} no cadastro.`}
                                    </td>
                                </tr>
                            ) : modoLocais ? fatiaLocais.map((item) => (
                                <tr key={item.localizacao} className={`loc-click${sel.has(item.localizacao) ? " is-on" : ""}${item.localizacao === SEM_LOCAL_ROTULO ? " is-sem" : ""}`} onClick={() => abrirLocal(item.localizacao)}>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" checked={sel.has(item.localizacao)} onChange={() => toggleSel(item.localizacao)} aria-label={`Selecionar ${item.localizacao}`} />
                                    </td>
                                    <td>
                                        <button type="button" className="loc-local-btn" onClick={(e) => { e.stopPropagation(); abrirLocal(item.localizacao); }}>
                                            {item.localizacao}
                                        </button>
                                        <small className="loc-setor">{setorDaLocalizacao(item.localizacao)}</small>
                                    </td>
                                    <td>{qtd(item.qtd)}</td>
                                    <td>{qtd(item.estoque)}</td>
                                    <td>
                                        <div className="loc-ocup" title="Estoque em relação ao máximo cadastrado. Sem máximo, usa quatro vezes o mínimo.">
                                            <span className={`loc-ocup-bar is-${item.status.id}`}><i style={{ width: `${Math.max(0, Math.min(100, item.ocupacao))}%` }} /></span>
                                            <b>{item.ocupacao}%</b>
                                        </div>
                                    </td>
                                    <td title={tituloMovimento(item)}>{dataExibida(item)}</td>
                                    <td>
                                        <span className={`loc-sit is-${item.status.id}`}>{item.status.nome}</span>
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="loc-row-acoes">
                                            <button type="button" title="Ver produtos" onClick={() => abrirLocal(item.localizacao)}>
                                                <Eye size={15} />
                                            </button>
                                            <button type="button" title="Copiar localização" onClick={() => copiar(item.localizacao)}>
                                                <Copy size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : fatia.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="loc-vazio">Nenhum produto nesta localização{rotuloVazio}.</td>
                                </tr>
                            ) : fatia.map((p) => {
                                const vis = visualProduto(p);
                                const sit = situacaoEstoque(p);
                                const cat = p.grupo || p.categoria || "—";
                                const sku = codigoExibicao(p);
                                const nome = nomeExibicao(p);
                                return (
                                    <tr key={p.id} className={sel.has(String(p.id)) ? "is-on" : ""}>
                                        <td>
                                            <input type="checkbox" checked={sel.has(String(p.id))} onChange={() => toggleSel(p.id)} aria-label={`Selecionar ${nome}`} />
                                        </td>
                                        <td>
                                            <div className="loc-sku">
                                                <span className="loc-foto" style={{ background: vis.bg }}>
                                                    {vis.img ? <img src={vis.img} alt="" /> : vis.emoji}
                                                </span>
                                                {sku}
                                            </div>
                                        </td>
                                        <td className="loc-nome" title={p.nome}>{nome}</td>
                                        <td>
                                            <span className="loc-cat" style={{ background: `${corCategoria(cat)}22`, color: corCategoria(cat) }}>
                                                {cat}
                                            </span>
                                        </td>
                                        <td>{p.localizacao}</td>
                                        <td>{qtd(p.estoque)}</td>
                                        <td>
                                            <span className={`loc-sit is-${sit.id}`}>{sit.nome}</span>
                                        </td>
                                        <td>
                                            <div className="loc-row-acoes">
                                                <button type="button" title="Ver estoque" onClick={() => { setMenuId(""); setModal({ produto: p, modo: "ver" }); }}>
                                                    <Eye size={15} />
                                                </button>
                                                <button type="button" title="Editar no cadastro" onClick={() => abrirEdicao(p)}>
                                                    <PenLine size={15} />
                                                </button>
                                                <div className="loc-menu-wrap">
                                                    <button type="button" title="Mais" onClick={() => setMenuId(menuId === String(p.id) ? "" : String(p.id))}>
                                                        <MoreVertical size={15} />
                                                    </button>
                                                    {menuId === String(p.id) ? (
                                                        <div className="loc-pop">
                                                            <button type="button" onClick={() => copiar(sku !== "—" ? sku : nome)}><Copy size={13} /> Copiar SKU</button>
                                                            <button type="button" onClick={() => copiar(p.localizacao)}><Copy size={13} /> Copiar localização</button>
                                                            <button type="button" onClick={() => { setMenuId(""); setModal({ produto: p, modo: "prateleira" }); }}>
                                                                <MapPinOff size={13} /> Trocar / sair da prateleira
                                                            </button>
                                                            <button type="button" onClick={() => { setMenuId(""); setModal({ produto: p, modo: "loja" }); }}>
                                                                <ArrowRightLeft size={13} /> Transferir para outra loja
                                                            </button>
                                                            <Link to={`${ROTAS.ESTOQUE}?localizacao=${encodeURIComponent(p.localizacao)}`} onClick={() => setMenuId("")}>
                                                                <Warehouse size={13} /> Movimentar no estoque
                                                            </Link>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <footer className="loc-pagina">
                    <span>
                        {fonte.length
                            ? `Mostrando ${(paginaAtual - 1) * porPagina + 1} a ${Math.min(paginaAtual * porPagina, fonte.length)} de ${fonte.length} ${modoLocais ? "localizações" : "produtos"}`
                            : modoLocais ? "Nenhuma localização listada" : "Nenhum produto listado"}
                    </span>
                    <nav className="erp-pager-nav" aria-label="Páginas">
                        <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina((n) => n - 1)} aria-label="Página anterior">
                            <ChevronLeft size={16} />
                        </button>
                        {janelaPaginas(paginaAtual, paginas).map((n) => (
                            <button type="button" key={n} className={n === paginaAtual ? "is-on" : ""} onClick={() => setPagina(n)}>
                                {n}
                            </button>
                        ))}
                        <button type="button" disabled={paginaAtual >= paginas} onClick={() => setPagina((n) => n + 1)} aria-label="Próxima página">
                            <ChevronRight size={16} />
                        </button>
                    </nav>
                    <label className="erp-pager-size">
                        <select value={porPagina} onChange={(e) => setPorPagina(Number(e.target.value))} aria-label="Itens por página">
                            {TAMANHOS.map((n) => (
                                <option key={n} value={n}>{n} por página</option>
                            ))}
                        </select>
                    </label>
                </footer>
            </section>
            {modal?.produto ? (
                <ModalEstoqueLocal
                    produto={modal.produto}
                    modo={modal.modo}
                    prateleiraAtual={localizacaoDe(modal.produto)}
                    produtos={produtos}
                    onFechar={() => setModal(null)}
                    onPrateleira={(nova) => mudarPrateleira(modal.produto, nova)}
                    onAviso={setAviso}
                />
            ) : null}
        </div>
    );
}
