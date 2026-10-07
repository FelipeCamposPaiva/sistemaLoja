import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowLeftRight,
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ClipboardList,
    Columns3,
    Eye,
    FileText,
    Filter,
    FilterX,
    History,
    Download,
    ImageOff,
    MapPin,
    MoreHorizontal,
    Package,
    PackageX,
    Pencil,
    Plus,
    Printer,
    Search,
    SlidersHorizontal,
    Trash2,
    Warehouse,
    X
} from "lucide-react";

import "../../styles/pages/estoque.css";
import ROTAS from "../../constants/rotas";
import { imprimirEtiquetasGondola } from "../../services/etiquetaGondola";
import {
    lerCacheSaldos,
    listarLocaisEstoque,
    saldosProduto,
    transferirEntreLocais
} from "../../services/estoqueLocais";
import { consultarAuditoria, estornarMovimentacao, salvarMovimentacao } from "../../services/movimentacao.service";
import { componentesDoProduto } from "../../services/kitComposicao";
import { listarProdutos } from "../../services/produto.service";

const PAGINAS = [10, 25, 50, 100];
const COL_KEY = "erp-estoque-colunas-v2";

const ABAS = [
    { id: "todos", label: "Todos" },
    { id: "simples", label: "Simples" },
    { id: "kits", label: "Kits" },
    { id: "fabricado", label: "Fabricado" },
    { id: "materia-prima", label: "Matéria-prima" }
];

const COLUNAS = [
    { id: "imagem", label: "Imagem" },
    { id: "produto", label: "Produto" },
    { id: "sku", label: "Código (SKU)" },
    { id: "preco", label: "Preço" },
    { id: "custo", label: "Custo médio" },
    { id: "fisico", label: "Estoque físico" },
    { id: "reservado", label: "Estoque reservado" },
    { id: "disponivel", label: "Estoque disponível" },
    { id: "unidade", label: "Unidade" },
    { id: "localizacao", label: "Localização" }
];

const COLUNAS_PADRAO = {
    imagem: true,
    produto: true,
    sku: true,
    preco: true,
    custo: true,
    fisico: true,
    reservado: true,
    disponivel: true,
    unidade: true,
    localizacao: true
};

const REFINOS = [
    { id: "codigo", label: "Código" },
    { id: "codigo-parcial", label: "Código (parcial)" },
    { id: "fornecedor", label: "Código no fornecedor" },
    { id: "gtin", label: "GTIN/EAN" },
    { id: "descricao", label: "Descrição" },
    { id: "palavras", label: "Palavras-chave" },
    { id: "", label: "Não refinar" }
];

const FILTRO_ZERO = {
    categoria: "",
    grupoEmpresas: false,
    tag: "",
    variacao: "",
    fornecedor: ""
};

const TIPOS_LANCAMENTO = [
    { id: "ENTRADA", label: "Entrada" },
    { id: "SAIDA", label: "Saída" },
    { id: "BALANCO", label: "Balanço" },
    { id: "AJUSTE", label: "Ajuste" },
    { id: "TRANSFERENCIA", label: "Transferência" },
    { id: "PERDA", label: "Perda" },
    { id: "ESTORNO", label: "Estorno" }
];

function semAcento(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const DEPOSITOS_LOJA = [
    {
        id: "AL",
        nome: "Água Limpa",
        casa: (local) => local.codigo === "AL" || semAcento(local.nome).includes("agua limpa")
    },
    {
        id: "DEP",
        nome: "Depósito Geral",
        casa: (local) => {
            const nome = semAcento(local.nome);
            if (local.codigo === "TRANS" || /transfer|transito/.test(nome)) {
                return false;
            }
            return local.codigo === "DEP" || local.codigo === "EST" || nome === "estoque" || /deposito/.test(nome);
        }
    },
    {
        id: "TRANS",
        nome: "Estoque em Transito",
        casa: (local) => local.codigo === "TRANS" || /transfer|transito/.test(semAcento(local.nome))
    },
    {
        id: "PERS",
        nome: "Personalizados",
        casa: (local) => local.codigo === "PERS" || semAcento(local.nome).startsWith("personaliz")
    },
    {
        id: "STG",
        nome: "Santo Agostinho",
        casa: (local) => local.codigo === "STG" || semAcento(local.nome).includes("santo agostinho")
    }
];

function saldoCatalogo(produto, item, reais, cache) {
    const total = Number(produto?.estoque || 0);
    const gravado = cache?.[String(produto?.id ?? "")];
    if (!item) {
        if (gravado) {
            return Object.values(gravado).reduce((soma, valor) => soma + Number(valor || 0), 0);
        }
        return total;
    }
    const ligados = reais.filter(item.casa);
    if (gravado && ligados.length) {
        return ligados.reduce((soma, local) => soma + Number(gravado[local.codigo] || 0), 0);
    }
    return item.id === "DEP" ? total : 0;
}

function localPrincipal(item, reais) {
    const lista = reais.filter(item.casa);
    return lista.find((local) => local.codigo === "EST")
        || lista.find((local) => local.codigo === item.id)
        || lista[0]
        || null;
}

function instante(valor) {
    if (Array.isArray(valor)) {
        const [ano, mes, dia, hora = 0, minuto = 0, segundo = 0] = valor;
        return new Date(ano, mes - 1, dia, hora, minuto, segundo);
    }
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
}

function dataLancamento(valor) {
    const data = instante(valor);
    if (!data) {
        return "—";
    }
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const hora = String(data.getHours()).padStart(2, "0");
    const minuto = String(data.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${data.getFullYear()} - ${hora}:${minuto}`;
}

function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function colunasSalvas() {
    try {
        const bruto = JSON.parse(localStorage.getItem(COL_KEY) || "null");
        if (!bruto || typeof bruto !== "object") {
            return { ...COLUNAS_PADRAO };
        }
        return { ...COLUNAS_PADRAO, ...bruto, produto: true };
    } catch {
        return { ...COLUNAS_PADRAO };
    }
}

function tipoProduto(produto) {
    const informado = produto.tipoCadastro || produto.tipo;
    if (["simples", "kits", "variacoes", "fabricado", "materia-prima"].includes(informado)) {
        return informado;
    }
    const comps = produto.componentes?.length ? produto.componentes : componentesDoProduto(produto);
    if (comps.length) {
        return produto.produtoProducao ? "fabricado" : "kits";
    }
    const grupo = String(produto.grupo || produto.categoria || "").toUpperCase();
    const nome = String(produto.nome || "").toUpperCase();
    if (grupo === "ARTESANATO" || /MAT[EÉ]RIA/.test(grupo) || grupo === "INSUMO" || grupo === "INSUMOS") {
        return "materia-prima";
    }
    if (/\bKITS?\b/.test(nome) || grupo === "KIT" || grupo === "KITS") {
        return "kits";
    }
    if (produto.produtoProducao || /^PERSONALIZ/.test(grupo)) {
        return "fabricado";
    }
    return "simples";
}

function texto(valor) {
    return String(valor || "").trim().toLowerCase();
}

function passaBusca(produto, termo, refino) {
    if (!termo) {
        return true;
    }
    const sku = texto(produto.sku);
    const gtin = texto(produto.gtin || produto.codigoBarras);
    const nome = texto(produto.nome);
    const fornecedor = texto(produto.codigoFornecedor);
    if (refino === "codigo") {
        return sku === termo;
    }
    if (refino === "codigo-parcial") {
        return sku.includes(termo);
    }
    if (refino === "fornecedor") {
        return fornecedor.includes(termo);
    }
    if (refino === "gtin") {
        return gtin.includes(termo);
    }
    if (refino === "descricao") {
        return nome.includes(termo);
    }
    if (refino === "palavras") {
        const base = `${nome} ${sku} ${gtin} ${texto(produto.categoria)} ${texto(produto.observacoes)}`;
        return termo.split(/\s+/).filter(Boolean).every((parte) => base.includes(parte));
    }
    const base = [nome, sku, gtin, fornecedor, texto(produto.localizacao), texto(produto.categoria), texto(produto.marca)].join(" ");
    return base.includes(termo);
}

function tagsDe(produto) {
    if (Array.isArray(produto.tags)) {
        return produto.tags.map((tag) => String(tag)).filter(Boolean);
    }
    if (produto.tag) {
        return [String(produto.tag)];
    }
    return [];
}

function passaFiltro(produto, filtro, tipo) {
    if (filtro.categoria && !texto(produto.categoria || produto.grupo).includes(texto(filtro.categoria))) {
        return false;
    }
    if (filtro.tag && !tagsDe(produto).some((tag) => texto(tag) === texto(filtro.tag))) {
        return false;
    }
    if (filtro.variacao === "com" && tipo !== "variacoes") {
        return false;
    }
    if (filtro.variacao === "sem" && tipo === "variacoes") {
        return false;
    }
    if (filtro.fornecedor) {
        const base = texto([produto.fornecedorNome, produto.fornecedor, produto.marca].filter(Boolean).join(" "));
        if (!base.includes(texto(filtro.fornecedor))) {
            return false;
        }
    }
    return true;
}

function preco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 5, maximumFractionDigits: 5 });
}

function qtd(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function qtdLista(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 4 });
}

function inteiro(valor) {
    return Number(valor || 0).toLocaleString("pt-BR");
}

function parte(valor, total) {
    if (!total) {
        return "0% do cadastro";
    }
    return `${inteiro(Math.round((Number(valor) / total) * 100))}% do cadastro`;
}

function tomSaldo(item) {
    if (Number(item?.disponivel || 0) <= 0) {
        return "sem";
    }
    return situacaoDe(item) === "baixo" ? "baixo" : "ok";
}

const CURVAS = {
    roxo: "M2 20 C 16 18, 24 22, 36 14 S 58 6, 72 10 S 96 4, 108 8",
    verde: "M2 18 C 18 16, 28 20, 44 12 S 70 6, 108 9",
    ambar: "M2 16 C 20 18, 34 12, 50 14 S 78 20, 108 8",
    vermelho: "M2 14 C 16 18, 32 8, 48 12 S 80 18, 108 6"
};

function Curva({ tom }) {
    return (
        <svg className="estq2-curva" viewBox="0 0 110 28" aria-hidden="true">
            <path d={CURVAS[tom] || CURVAS.roxo} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
    );
}

function situacaoDe(item) {
    const fisico = Number(item?.fisico || 0);
    const minimo = Number(item?.produto?.estoqueMinimo || 0);
    if (fisico <= 0) {
        return "sem";
    }
    if (minimo > 0 && fisico <= minimo) {
        return "baixo";
    }
    return "estoque";
}

function escapar(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function paginasVisiveis(atual, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const inicio = Math.max(1, Math.min(atual - 2, total - 4));
    const meio = [];
    for (let n = inicio; n < inicio + 5 && n <= total; n += 1) {
        meio.push(n);
    }
    if (meio[meio.length - 1] < total) {
        return [...meio, "…", total];
    }
    return meio;
}

function imprimirRelatorio(linhas, depositoNome) {
    const corpo = linhas.map((item) => `
        <tr>
            <td>${escapar(item.nome)}</td>
            <td>${escapar(item.sku)}</td>
            <td>${preco(item.precoValor)}</td>
            <td>${qtd(item.fisico)}</td>
            <td>${qtd(item.reservado)}</td>
            <td>${qtd(item.disponivel)}</td>
            <td>${escapar(item.unidade)}</td>
            <td>${escapar(item.localizacao)}</td>
        </tr>`).join("");
    const janela = window.open("", "_blank", "noopener,noreferrer");
    if (!janela) {
        return;
    }
    janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<title>Controle de estoques</title>
<style>
  body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p { margin: 0 0 16px; color: #444; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border-bottom: 1px solid #ddd; text-align: left; padding: 6px 8px; }
  th { font-size: 11px; }
  td:nth-child(n+3) { text-align: right; }
  td:last-child, th:last-child { text-align: left; }
</style></head><body>
<h1>Controle de estoques</h1>
<p>${escapar(depositoNome)} · ${linhas.length} produto(s)</p>
<table>
<thead><tr><th>Produto</th><th>Código (SKU)</th><th>Preço</th><th>Estoque físico</th><th>Estoque reservado</th><th>Estoque disponível</th><th>Unidade</th><th>Localização</th></tr></thead>
<tbody>${corpo || "<tr><td colspan='8'>Nenhum produto</td></tr>"}</tbody>
</table>
</body></html>`);
    janela.document.close();
    janela.focus();
    janela.print();
}

function csvCampo(valor) {
    return `"${String(valor ?? "").replace(/"/g, "\"\"")}"`;
}

function exportarCsv(linhas, depositoNome) {
    const cabecalho = ["Produto", "Código (SKU)", "Preço", "Custo médio", "Estoque físico", "Estoque reservado", "Estoque disponível", "Unidade", "Localização"];
    const corpo = linhas.map((item) => [
        item.nome,
        item.sku,
        item.precoValor,
        item.custo,
        item.fisico,
        item.reservado,
        item.disponivel,
        item.unidade,
        item.localizacao
    ].map(csvCampo).join(";"));
    const blob = new Blob([`\uFEFF${[cabecalho.join(";"), ...corpo].join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estoque-${String(depositoNome || "todos").replace(/\s+/g, "-").toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

function novaLinha() {
    return {
        chave: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        busca: "",
        produto: null,
        quantidade: "",
        valor: "",
        saldo: null
    };
}

export default function ControleEstoques() {
    const [params] = useSearchParams();
    const [produtos, setProdutos] = useState([]);
    const [depositos, setDepositos] = useState([]);
    const [depositoId, setDepositoId] = useState("DEP");
    const [fichaId, setFichaId] = useState(null);
    const [fichaAba, setFichaAba] = useState("lancamentos");
    const [porPagina, setPorPagina] = useState(10);
    const [marcados, setMarcados] = useState([]);
    const [situacao, setSituacao] = useState("");
    const [soAtivos, setSoAtivos] = useState(false);
    const [cacheTick, setCacheTick] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [aviso, setAviso] = useState("");
    const [busca, setBusca] = useState(() => params.get("q") || params.get("sku") || "");

    useEffect(() => {
        const q = params.get("q") || params.get("sku");
        if (q) {
            setBusca(q);
        }
    }, [params]);
    const [refino, setRefino] = useState("");
    const [aba, setAba] = useState("todos");
    const [filtros, setFiltros] = useState(FILTRO_ZERO);
    const [rascunho, setRascunho] = useState(FILTRO_ZERO);
    const [colunas, setColunas] = useState(colunasSalvas);
    const [rascunhoColunas, setRascunhoColunas] = useState(colunasSalvas);
    const [painel, setPainel] = useState("");
    const [pagina, setPagina] = useState(1);
    const [ordem, setOrdem] = useState({ campo: "nome", dir: "asc" });
    const [menuId, setMenuId] = useState(null);
    const [aberto, setAberto] = useState(null);
    const [detalhe, setDetalhe] = useState(null);

    const cache = useMemo(() => lerCacheSaldos(), [cacheTick]);

    useEffect(() => {
        let vivo = true;
        (async () => {
            try {
                const [lista, locais] = await Promise.all([listarProdutos(), listarLocaisEstoque()]);
                if (!vivo) {
                    return;
                }
                setProdutos(Array.isArray(lista) ? lista : []);
                setDepositos(Array.isArray(locais) ? locais : []);
            } catch (erro) {
                if (vivo) {
                    setAviso(erro?.message || "Não foi possível ler o estoque.");
                }
            } finally {
                if (vivo) {
                    setCarregando(false);
                }
            }
        })();
        return () => {
            vivo = false;
        };
    }, []);

    useEffect(() => {
        const flutuante = painel && painel !== "colunas" && painel !== "transferencia";
        if (!flutuante && menuId == null) {
            return undefined;
        }
        function fechar() {
            setPainel("");
            setMenuId(null);
        }
        document.addEventListener("click", fechar);
        return () => document.removeEventListener("click", fechar);
    }, [painel, menuId]);

    useEffect(() => {
        function tecla(evento) {
            if (evento.key === "Escape") {
                setPainel("");
                setMenuId(null);
            }
        }
        document.addEventListener("keydown", tecla);
        return () => document.removeEventListener("keydown", tecla);
    }, []);

    const opcoes = useMemo(() => DEPOSITOS_LOJA.map((item) => {
        const real = localPrincipal(item, depositos);
        return { ...item, localId: real ? String(real.id) : "", codigo: real?.codigo || item.id };
    }), [depositos]);
    const deposito = opcoes.find((item) => item.id === depositoId) || null;
    const temFiltro = Boolean(
        busca.trim()
        || refino
        || aba !== "todos"
        || filtros.categoria
        || filtros.tag
        || filtros.variacao
        || filtros.fornecedor
        || filtros.grupoEmpresas
        || situacao
    );
    const categorias = useMemo(
        () => [...new Set(produtos.map((item) => item.categoria || item.grupo).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
        [produtos]
    );
    const tags = useMemo(
        () => [...new Set(produtos.flatMap(tagsDe))].sort((a, b) => a.localeCompare(b, "pt-BR")),
        [produtos]
    );

    const catalogo = useMemo(() => {
        const termo = texto(busca);
        const lista = produtos
            .filter((produto) => !soAtivos || produto.ativo !== false)
            .map((produto) => {
                const tipo = tipoProduto(produto);
                const fisico = saldoCatalogo(produto, deposito, depositos, cache);
                const reservado = Number(produto.estoqueReservado || 0);
                return {
                    produto,
                    tipo,
                    nome: produto.nome || "Produto",
                    sku: produto.sku || "",
                    precoValor: Number(produto.preco || 0),
                    custo: Number(produto.custo || 0),
                    fisico,
                    reservado,
                    disponivel: fisico - reservado,
                    unidade: produto.unidade || "UN",
                    localizacao: produto.localizacao || "",
                    imagem: produto.imagem || produto.fotos?.[0]?.url || ""
                };
            })
            .filter((item) => (aba === "todos" || item.tipo === aba))
            .filter((item) => passaBusca(item.produto, termo, refino))
            .filter((item) => passaFiltro(item.produto, filtros, item.tipo));
        const campo = ordem.campo;
        lista.sort((a, b) => {
            const va = a[campo];
            const vb = b[campo];
            const cmp = typeof va === "number"
                ? va - vb
                : String(va || "").localeCompare(String(vb || ""), "pt-BR", { sensitivity: "base" });
            return ordem.dir === "asc" ? cmp : -cmp;
        });
        return lista;
    }, [produtos, deposito, depositos, cache, aba, busca, refino, filtros, ordem, soAtivos]);

    const linhas = useMemo(
        () => (situacao ? catalogo.filter((item) => situacaoDe(item) === situacao) : catalogo),
        [catalogo, situacao]
    );
    const resumo = useMemo(() => {
        const total = catalogo.length;
        let em = 0;
        let baixo = 0;
        let sem = 0;
        catalogo.forEach((item) => {
            const classe = situacaoDe(item);
            if (classe === "sem") {
                sem += 1;
            } else if (classe === "baixo") {
                baixo += 1;
            } else {
                em += 1;
            }
        });
        return { total, em, baixo, sem };
    }, [catalogo]);

    const totalPaginas = Math.max(1, Math.ceil(linhas.length / porPagina));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const paginaLinhas = linhas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);
    const numeros = paginasVisiveis(paginaAtual, totalPaginas);

    function alternarPainel(id, evento) {
        evento.stopPropagation();
        setMenuId(null);
        setPainel((atual) => (atual === id ? "" : id));
    }

    function ordenar(campo) {
        setPagina(1);
        setOrdem((atual) => (atual.campo === campo
            ? { campo, dir: atual.dir === "asc" ? "desc" : "asc" }
            : { campo, dir: "asc" }));
    }

    function limparFiltros() {
        setBusca("");
        setRefino("");
        setAba("todos");
        setFiltros(FILTRO_ZERO);
        setRascunho(FILTRO_ZERO);
        setSituacao("");
        setPagina(1);
        setPainel("");
    }

    function abrirFicha(produtoId, abaFicha = "lancamentos") {
        setFichaAba(abaFicha);
        setFichaId(produtoId);
        setMenuId(null);
        setPainel("");
    }

    function alternarMarcado(id) {
        setMarcados((atual) => (atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]));
    }

    function alternarPaginaMarcada() {
        const ids = paginaLinhas.map((item) => item.produto.id);
        const todos = ids.length > 0 && ids.every((id) => marcados.includes(id));
        setMarcados((atual) => (todos
            ? atual.filter((id) => !ids.includes(id))
            : [...new Set([...atual, ...ids])]));
    }

    function aplicarFiltros() {
        setFiltros(rascunho);
        setPagina(1);
        setPainel("");
    }

    function aplicarColunas() {
        const proximo = { ...rascunhoColunas, produto: true };
        setColunas(proximo);
        localStorage.setItem(COL_KEY, JSON.stringify(proximo));
        setPainel("");
    }

    async function abrirSaldo(item) {
        if (aberto === item.produto.id) {
            setAberto(null);
            return;
        }
        setAberto(item.produto.id);
        setDetalhe({ id: item.produto.id, linhas: null, erro: "" });
        try {
            const saldos = await saldosProduto(item.produto);
            setCacheTick((valor) => valor + 1);
            setDetalhe({ id: item.produto.id, linhas: saldos, erro: "" });
        } catch (erro) {
            setDetalhe({ id: item.produto.id, linhas: [], erro: erro.message || "Não foi possível ler os saldos." });
        }
    }

    function Cabeca({ campo, children, numerico }) {
        const ativo = ordem.campo === campo;
        const Icone = ativo && ordem.dir === "desc" ? ChevronDown : ativo ? ChevronUp : ChevronDown;
        return (
            <th className={numerico ? "is-num" : ""}>
                <button type="button" onClick={() => ordenar(campo)}>
                    {children}
                    <Icone size={12} />
                </button>
            </th>
        );
    }

    const colSpan = 2 + COLUNAS.filter((coluna) => colunas[coluna.id]).length;
    const inicioPagina = linhas.length ? (paginaAtual - 1) * porPagina + 1 : 0;
    const fimPagina = Math.min(linhas.length, paginaAtual * porPagina);
    const selecionados = linhas.filter((item) => marcados.includes(item.produto.id));
    const idsPagina = paginaLinhas.map((item) => item.produto.id);
    const paginaMarcada = idsPagina.length > 0 && idsPagina.every((id) => marcados.includes(id));
    const nomeDeposito = deposito ? deposito.nome : "Todos os depósitos";

    return (
        <div className="estq2">
            {fichaId ? (
                <FichaEstoque
                    produto={produtos.find((item) => String(item.id) === String(fichaId))}
                    opcoes={opcoes}
                    reais={depositos}
                    cache={cache}
                    depositoInicial={depositoId || "DEP"}
                    abaInicial={fichaAba}
                    onVoltar={() => setFichaId(null)}
                    onTransferir={() => setPainel("transferencia")}
                    onAtualizado={async () => {
                        const lista = await listarProdutos();
                        setProdutos(Array.isArray(lista) ? lista : []);
                        setCacheTick((valor) => valor + 1);
                    }}
                />
            ) : (
            <>
            <nav className="estq2-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <Link to={ROTAS.DASHBOARD_SUPRIMENTOS}>suprimentos</Link>
                <span>›</span>
                <strong>controle de estoques</strong>
            </nav>

            <header className="estq2-head">
                <div className="estq2-titulo">
                    <span className="estq2-titulo-ico"><Package size={22} /></span>
                    <div>
                        <h1>Controle de estoques</h1>
                        <p>Acompanhe o estoque dos seus produtos por depósito, com informações de saldo, reservas e localização.</p>
                    </div>
                </div>
                <div className="estq2-acoes">
                    <Link className="estq2-ghost" to={ROTAS.INVENTARIO}>
                        <ClipboardList size={15} />
                        Inventário de estoque
                    </Link>
                    <button type="button" className="estq2-ghost" onClick={(evento) => { evento.stopPropagation(); setPainel("transferencia"); }}>
                        <ArrowLeftRight size={15} />
                        Transferir entre depósitos
                    </button>
                    <Link className="estq2-cta" to={ROTAS.PRODUTOS}>Gerenciar produtos</Link>
                    <div className="estq2-ancora">
                        <button type="button" className="estq2-ghost" onClick={(evento) => alternarPainel("acoes", evento)}>
                            Mais ações
                            <ChevronDown size={16} />
                        </button>
                        {painel === "acoes" ? (
                            <div className="estq2-pop estq2-pop-acoes" onClick={(evento) => evento.stopPropagation()}>
                                <button type="button" onClick={() => setPainel("transferencia")}>
                                    <ArrowLeftRight size={15} /> transferir entre depósitos
                                </button>
                                <Link to={ROTAS.INVENTARIO}>
                                    <ClipboardList size={15} /> inventário de estoque
                                </Link>
                                <Link to={ROTAS.AUDITORIA_ESTOQUE}>
                                    <ClipboardList size={15} /> auditoria de estoque
                                </Link>
                                <Link to={ROTAS.NECESSIDADES_COMPRA}>
                                    <AlertTriangle size={15} /> necessidades de compra
                                </Link>
                                <Link to={ROTAS.LOCALIZACOES}>
                                    <MapPin size={15} /> localizações
                                </Link>
                                <button type="button" onClick={() => imprimirRelatorio(linhas, nomeDeposito)}>
                                    <Printer size={15} /> imprimir relatório
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </header>

            <section className="estq2-cards" aria-label="Resumo do depósito">
                {[
                    { id: "", tom: "roxo", icone: Package, titulo: "Produtos cadastrados", valor: resumo.total, texto: nomeDeposito },
                    { id: "estoque", tom: "verde", icone: Warehouse, titulo: "Em estoque", valor: resumo.em, texto: parte(resumo.em, resumo.total) },
                    { id: "baixo", tom: "ambar", icone: AlertTriangle, titulo: "Estoque baixo", valor: resumo.baixo, texto: parte(resumo.baixo, resumo.total) },
                    { id: "sem", tom: "vermelho", icone: PackageX, titulo: "Sem estoque", valor: resumo.sem, texto: parte(resumo.sem, resumo.total) }
                ].map((card) => {
                    const Icone = card.icone;
                    const ativo = Boolean(card.id) && situacao === card.id;
                    return (
                        <button
                            type="button"
                            key={card.titulo}
                            className={ativo ? `estq2-card is-${card.tom} is-on` : `estq2-card is-${card.tom}`}
                            onClick={() => {
                                setSituacao(card.id);
                                setPagina(1);
                            }}
                        >
                            <span className="estq2-card-corpo">
                                <span className="estq2-card-ico"><Icone size={18} /></span>
                                <span>
                                    <small>{card.titulo}</small>
                                    <strong>{inteiro(card.valor)}</strong>
                                    <em>{card.texto}</em>
                                </span>
                            </span>
                            <Curva tom={card.tom} />
                        </button>
                    );
                })}
            </section>

            {aviso ? <p className="estq2-aviso">{aviso}</p> : null}

            <div className="estq2-barra">
                <label className="estq2-busca">
                    <Search size={16} />
                    <input
                        value={busca}
                        onChange={(evento) => {
                            setBusca(evento.target.value);
                            setPagina(1);
                        }}
                        placeholder="Pesquise por nome, código (SKU) ou GTIN/EAN"
                    />
                    <div className="estq2-ancora">
                        <button type="button" aria-label="Refinar Busca" onClick={(evento) => alternarPainel("refino", evento)}>
                            <SlidersHorizontal size={16} />
                        </button>
                        {painel === "refino" ? (
                            <div className="estq2-pop" onClick={(evento) => evento.stopPropagation()}>
                                <strong>Refinar Busca</strong>
                                {REFINOS.map((item) => (
                                    <button
                                        type="button"
                                        key={item.label}
                                        className={refino === item.id ? "is-on" : ""}
                                        onClick={() => {
                                            setRefino(item.id);
                                            setPagina(1);
                                            setPainel("");
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </label>

                <div className="estq2-ancora">
                    <button type="button" className="estq2-chip" onClick={(evento) => alternarPainel("deposito", evento)}>
                        Depósito: {deposito ? deposito.nome : "Todos"}
                        <ChevronDown size={14} />
                    </button>
                    {painel === "deposito" ? (
                        <div className="estq2-pop estq2-pop-dep" onClick={(evento) => evento.stopPropagation()}>
                            <span>Depósito</span>
                            <strong>{deposito ? deposito.nome : "Todos"}</strong>
                            <button
                                type="button"
                                className={!deposito ? "is-on" : ""}
                                onClick={() => {
                                    setDepositoId("");
                                    setPagina(1);
                                    setPainel("");
                                }}
                            >
                                Todos
                            </button>
                            <hr />
                            {opcoes.map((item) => (
                                <button
                                    type="button"
                                    key={item.id}
                                    className={item.id === depositoId ? "is-on" : ""}
                                    onClick={() => {
                                        setDepositoId(item.id);
                                        setPagina(1);
                                        setPainel("");
                                    }}
                                >
                                    {item.nome}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="estq2-ancora">
                    <button
                        type="button"
                        className="estq2-ghost"
                        onClick={(evento) => {
                            evento.stopPropagation();
                            setRascunho(filtros);
                            setMenuId(null);
                            setPainel((atual) => (atual === "filtros" ? "" : "filtros"));
                        }}
                    >
                        <Filter size={15} />
                        Filtros
                    </button>
                    {painel === "filtros" ? (
                        <div className="estq2-pop estq2-pop-filtros" onClick={(evento) => evento.stopPropagation()}>
                            <div className="estq2-filtro-linha">
                                <span>Categoria</span>
                                <button type="button" onClick={() => setRascunho((atual) => ({ ...atual, categoria: "" }))}>remover</button>
                            </div>
                            <label className="estq2-busca estq2-busca-sm">
                                <input
                                    list="estq2-categorias"
                                    value={rascunho.categoria}
                                    placeholder="Buscar categoria"
                                    onChange={(evento) => setRascunho((atual) => ({ ...atual, categoria: evento.target.value }))}
                                />
                                <Search size={14} />
                            </label>
                            <datalist id="estq2-categorias">
                                {categorias.map((item) => <option key={item} value={item} />)}
                            </datalist>
                            <label className="estq2-toggle">
                                <input
                                    type="checkbox"
                                    checked={rascunho.grupoEmpresas}
                                    onChange={(evento) => setRascunho((atual) => ({ ...atual, grupoEmpresas: evento.target.checked }))}
                                />
                                Exibir estoque de todas as empresas do grupo
                            </label>
                            <label>
                                Tags de produtos
                                <select value={rascunho.tag} onChange={(evento) => setRascunho((atual) => ({ ...atual, tag: evento.target.value }))}>
                                    <option value="">Todas</option>
                                    {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                                </select>
                            </label>
                            <label>
                                Variações
                                <select value={rascunho.variacao} onChange={(evento) => setRascunho((atual) => ({ ...atual, variacao: evento.target.value }))}>
                                    <option value="">Sem filtro por variações</option>
                                    <option value="com">Somente com variações</option>
                                    <option value="sem">Somente sem variações</option>
                                </select>
                            </label>
                            <label>
                                Fornecedor
                                <input
                                    value={rascunho.fornecedor}
                                    placeholder="Razão social ou nome fantasia"
                                    onChange={(evento) => setRascunho((atual) => ({ ...atual, fornecedor: evento.target.value }))}
                                />
                            </label>
                            <label className="estq2-toggle">
                                <input type="checkbox" checked={soAtivos} onChange={(evento) => { setSoAtivos(evento.target.checked); setPagina(1); }} />
                                Ocultar produtos inativos
                            </label>
                            <div className="estq2-drawer-acoes">
                                <button type="button" className="estq2-cta" onClick={aplicarFiltros}>aplicar</button>
                                <button type="button" className="estq2-link" onClick={() => setPainel("")}>cancelar</button>
                            </div>
                        </div>
                    ) : null}
                </div>

                {temFiltro ? (
                    <button type="button" className="estq2-limpar" onClick={limparFiltros}>
                        <FilterX size={14} />
                        Limpar filtros
                    </button>
                ) : null}
            </div>

            <div className="estq2-tabs">
                <div>
                    {ABAS.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className={aba === item.id ? "is-on" : ""}
                            onClick={() => {
                                setAba(item.id);
                                setPagina(1);
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className="estq2-icone"
                    aria-label="Informações visíveis"
                    onClick={(evento) => {
                        evento.stopPropagation();
                        setRascunhoColunas(colunas);
                        setPainel("colunas");
                    }}
                >
                    <Columns3 size={16} />
                </button>
            </div>

            <div className="estq2-tabela-wrap">
                <table className="estq2-tabela">
                    <thead>
                        <tr>
                            <th className="estq2-col-check">
                                <input type="checkbox" aria-label="Selecionar página" checked={paginaMarcada} onChange={alternarPaginaMarcada} />
                            </th>
                            {colunas.imagem ? <th>Imagem</th> : null}
                            {colunas.produto ? <Cabeca campo="nome">Produto</Cabeca> : null}
                            {colunas.sku ? <Cabeca campo="sku">Código (SKU)</Cabeca> : null}
                            {colunas.preco ? <Cabeca campo="precoValor" numerico>Preço</Cabeca> : null}
                            {colunas.custo ? <Cabeca campo="custo" numerico>Custo médio</Cabeca> : null}
                            {colunas.fisico ? <Cabeca campo="fisico" numerico>Estoque físico</Cabeca> : null}
                            {colunas.reservado ? <Cabeca campo="reservado" numerico>Estoque reservado</Cabeca> : null}
                            {colunas.disponivel ? <Cabeca campo="disponivel" numerico>Estoque disponível</Cabeca> : null}
                            {colunas.unidade ? <Cabeca campo="unidade">Unidade</Cabeca> : null}
                            {colunas.localizacao ? <Cabeca campo="localizacao">Localização</Cabeca> : null}
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carregando ? (
                            <tr><td colSpan={colSpan}>Carregando estoque...</td></tr>
                        ) : paginaLinhas.length === 0 ? (
                            <tr><td colSpan={colSpan}>Nenhum produto neste depósito.</td></tr>
                        ) : paginaLinhas.map((item) => (
                            <Fragment key={item.produto.id}>
                                <tr className={marcados.includes(item.produto.id) ? "is-marcada" : ""}>
                                    <td className="estq2-col-check">
                                        <input
                                            type="checkbox"
                                            aria-label={`Selecionar ${item.nome}`}
                                            checked={marcados.includes(item.produto.id)}
                                            onChange={() => alternarMarcado(item.produto.id)}
                                        />
                                    </td>
                                    {colunas.imagem ? (
                                        <td>
                                            {item.imagem ? (
                                                <img className="estq2-foto" src={item.imagem} alt="" />
                                            ) : (
                                                <span className="estq2-foto is-vazia"><ImageOff size={14} /></span>
                                            )}
                                        </td>
                                    ) : null}
                                    {colunas.produto ? (
                                        <td>
                                            <button type="button" className="estq2-nome estq2-nome-btn" title={item.nome} onClick={() => abrirFicha(item.produto.id)}>
                                                {item.nome}
                                            </button>
                                        </td>
                                    ) : null}
                                    {colunas.sku ? <td>{item.sku}</td> : null}
                                    {colunas.preco ? <td className="is-num"><span className="estq2-preco">R$ {moeda(item.precoValor)}</span></td> : null}
                                    {colunas.custo ? <td className="is-num"><span className="estq2-preco">R$ {moeda(item.custo)}</span></td> : null}
                                    {colunas.fisico ? (
                                        <td className="is-num">
                                            <button type="button" className="estq2-num" onClick={() => abrirFicha(item.produto.id)}>{qtdLista(item.fisico)}</button>
                                        </td>
                                    ) : null}
                                    {colunas.reservado ? (
                                        <td className="is-num">
                                            <button type="button" className="estq2-reserva" onClick={() => abrirFicha(item.produto.id, "reservas")}>{qtdLista(item.reservado)}</button>
                                        </td>
                                    ) : null}
                                    {colunas.disponivel ? (
                                        <td className="is-num">
                                            <button type="button" className={`estq2-saldo is-${tomSaldo(item)}`} onClick={() => abrirFicha(item.produto.id)}>
                                                {qtdLista(item.disponivel)}
                                            </button>
                                        </td>
                                    ) : null}
                                    {colunas.unidade ? <td>{item.unidade}</td> : null}
                                    {colunas.localizacao ? (
                                        <td className="estq2-loc">
                                            {item.localizacao ? (
                                                <Link to={`${ROTAS.LOCALIZACOES}?localizacao=${encodeURIComponent(item.localizacao)}`}>{item.localizacao}</Link>
                                            ) : (
                                                <span>—</span>
                                            )}
                                        </td>
                                    ) : null}
                                    <td>
                                        <div className="estq2-linha-acoes">
                                            <button type="button" aria-label={`Ver estoque de ${item.nome}`} onClick={() => abrirFicha(item.produto.id)}>
                                                <Eye size={16} />
                                            </button>
                                            <Link aria-label={`Editar ${item.nome}`} to={`${ROTAS.PRODUTOS}?edit=${item.produto.id}`}>
                                                <Pencil size={16} />
                                            </Link>
                                            <div className="estq2-ancora">
                                                <button
                                                    type="button"
                                                    aria-label={`Ações de ${item.nome}`}
                                                    onClick={(evento) => {
                                                        evento.stopPropagation();
                                                        setPainel("");
                                                        setMenuId((atual) => (atual === item.produto.id ? null : item.produto.id));
                                                    }}
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                                {menuId === item.produto.id ? (
                                                    <div className="estq2-pop" onClick={(evento) => evento.stopPropagation()}>
                                                        <button type="button" onClick={() => abrirSaldo(item)}>
                                                            <Warehouse size={15} /> saldos por depósito
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                imprimirEtiquetasGondola([item.produto]);
                                                                setMenuId(null);
                                                            }}
                                                        >
                                                            <Printer size={15} /> imprimir etiquetas
                                                        </button>
                                                        <Link to={`${ROTAS.PRODUTOS}?edit=${item.produto.id}`}>
                                                            <Pencil size={15} /> editar produto
                                                        </Link>
                                                        <Link to={ROTAS.AUDITORIA_ESTOQUE}>
                                                            <ClipboardList size={15} /> auditoria de estoque
                                                        </Link>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                {aberto === item.produto.id ? (
                                    <tr key={`${item.produto.id}-saldo`} className="estq2-detalhe">
                                        <td colSpan={colSpan}>
                                            {detalhe?.id !== item.produto.id || detalhe.linhas == null ? (
                                                <p>Lendo saldos...</p>
                                            ) : detalhe.erro ? (
                                                <p>{detalhe.erro}</p>
                                            ) : (
                                                <ul>
                                                    {detalhe.linhas.map((local) => (
                                                        <li key={local.id}>
                                                            <span>{local.nome}</span>
                                                            <strong>{qtd(local.quantidade)}</strong>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </td>
                                    </tr>
                                ) : null}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="estq2-rodape">
                <div className="estq2-rodape-esq">
                    <span>{marcados.length} selecionados</span>
                    <button
                        type="button"
                        className="estq2-ghost"
                        onClick={() => imprimirRelatorio(selecionados.length ? selecionados : linhas, nomeDeposito)}
                    >
                        <Printer size={14} />
                        Imprimir lista / contagem
                    </button>
                    <div className="estq2-ancora">
                        <button type="button" className="estq2-ghost" onClick={(evento) => alternarPainel("exportar", evento)}>
                            <Download size={14} />
                            Exportar
                            <ChevronDown size={14} />
                        </button>
                        {painel === "exportar" ? (
                            <div className="estq2-pop estq2-pop-cima" onClick={(evento) => evento.stopPropagation()}>
                                <button type="button" onClick={() => { exportarCsv(selecionados.length ? selecionados : linhas, nomeDeposito); setPainel(""); }}>
                                    <Download size={15} /> planilha da lista
                                </button>
                                <button type="button" disabled={!selecionados.length} onClick={() => { exportarCsv(selecionados, nomeDeposito); setPainel(""); }}>
                                    <Download size={15} /> só os selecionados
                                </button>
                            </div>
                        ) : null}
                    </div>
                    <div className="estq2-ancora">
                        <button type="button" className="estq2-ghost" onClick={(evento) => alternarPainel("lote", evento)}>
                            Mais ações
                            <ChevronDown size={14} />
                        </button>
                        {painel === "lote" ? (
                            <div className="estq2-pop estq2-pop-cima" onClick={(evento) => evento.stopPropagation()}>
                                <button
                                    type="button"
                                    disabled={!selecionados.length}
                                    onClick={() => {
                                        imprimirEtiquetasGondola(selecionados.map((item) => item.produto));
                                        setPainel("");
                                    }}
                                >
                                    <Printer size={15} /> imprimir etiquetas
                                </button>
                                <button type="button" onClick={() => { setPainel("transferencia"); }}>
                                    <ArrowLeftRight size={15} /> transferir entre depósitos
                                </button>
                                <button type="button" onClick={() => setMarcados([])}>
                                    <X size={15} /> limpar seleção
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
                <div className="estq2-rodape-dir">
                    <span>Mostrando {inicioPagina} a {fimPagina} de {inteiro(linhas.length)} produtos</span>
                    <div className="estq2-pag">
                        <button
                            type="button"
                            aria-label="Página anterior"
                            disabled={paginaAtual <= 1}
                            onClick={() => setPagina((valor) => Math.max(1, valor - 1))}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {numeros.map((numero, indice) => (
                            numero === "…" ? (
                                <span key={`r-${indice}`}>…</span>
                            ) : (
                                <button
                                    type="button"
                                    key={numero}
                                    className={numero === paginaAtual ? "is-on" : ""}
                                    onClick={() => setPagina(numero)}
                                >
                                    {numero}
                                </button>
                            )
                        ))}
                        <button
                            type="button"
                            aria-label="Próxima página"
                            disabled={paginaAtual >= totalPaginas}
                            onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <label className="estq2-por-pagina">
                        <select
                            value={porPagina}
                            onChange={(evento) => {
                                setPorPagina(Number(evento.target.value));
                                setPagina(1);
                            }}
                        >
                            {PAGINAS.map((valor) => (
                                <option key={valor} value={valor}>{valor} por página</option>
                            ))}
                        </select>
                    </label>
                </div>
            </footer>
            </>
            )}

            {painel === "colunas" && !fichaId ? (
                <div className="estq2-overlay" onClick={() => setPainel("")}>
                    <aside className="estq2-drawer" onClick={(evento) => evento.stopPropagation()} role="dialog" aria-modal="true">
                        <header>
                            <h2>Informações visíveis</h2>
                            <button type="button" onClick={() => setPainel("")}>fechar <X size={16} /></button>
                        </header>
                        <p>Selecione abaixo quais informações deseja que estejam visíveis</p>
                        <h3>Colunas</h3>
                        <ul className="estq2-switches">
                            {COLUNAS.map((coluna) => (
                                <li key={coluna.id}>
                                    <span>{coluna.label}</span>
                                    <button
                                        type="button"
                                        className={rascunhoColunas[coluna.id] ? "estq2-switch is-on" : "estq2-switch"}
                                        role="switch"
                                        aria-checked={Boolean(rascunhoColunas[coluna.id])}
                                        disabled={coluna.id === "produto"}
                                        onClick={() => setRascunhoColunas((atual) => ({ ...atual, [coluna.id]: !atual[coluna.id] }))}
                                    >
                                        <i />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="estq2-drawer-acoes">
                            <button type="button" className="estq2-cta" onClick={aplicarColunas}>aplicar</button>
                            <button type="button" className="estq2-link" onClick={() => setPainel("")}>cancelar</button>
                        </div>
                    </aside>
                </div>
            ) : null}

            {painel === "transferencia" ? (
                <Transferencia
                    produtos={produtos}
                    opcoes={opcoes}
                    onFechar={() => setPainel("")}
                    onConcluido={(mensagem) => {
                        setCacheTick((valor) => valor + 1);
                        setAviso(mensagem);
                        setAberto(null);
                        setPainel("");
                    }}
                />
            ) : null}
        </div>
    );
}

function movimentoDe(item, produto) {
    const tipo = String(item.tipo || "").toUpperCase();
    const efeito = Number(item.efeito ?? 0);
    const quantidade = Math.abs(Number(item.quantidade || 0));
    const entrada = efeito > 0 || tipo === "ENTRADA" || tipo === "PRODUCAO" ? quantidade : 0;
    const saida = efeito < 0 || tipo === "SAIDA" || tipo === "PERDA" ? quantidade : 0;
    const valor = tipo === "BALANCO" ? 0 : quantidade * Number(produto?.custo || produto?.preco || 0);
    const rotulo = TIPOS_LANCAMENTO.find((opcao) => opcao.id === tipo)?.label || item.tipo || "—";
    return { ...item, tipo, entrada: efeito < 0 ? 0 : entrada, saida: efeito > 0 ? 0 : saida, valor, rotulo };
}

function movimentoNoDeposito(item, deposito, reais) {
    if (!deposito) {
        return true;
    }
    const ids = new Set(reais.filter(deposito.casa).map((local) => Number(local.id)));
    const origem = Number(item.localOrigem || 0);
    const destino = Number(item.localDestino || 0);
    if (!origem && !destino) {
        return deposito.id === "DEP";
    }
    if (!ids.size) {
        return deposito.id === "DEP";
    }
    return ids.has(origem) || ids.has(destino);
}

function podeEstornar(item) {
    return String(item.status || "ATIVO").toUpperCase() === "ATIVO" && item.tipo !== "ESTORNO";
}

function FichaEstoque({ produto, opcoes, reais, cache, depositoInicial, abaInicial, onVoltar, onTransferir, onAtualizado }) {
    const [depositoId, setDepositoId] = useState(depositoInicial || "DEP");
    const [aba, setAba] = useState(abaInicial || "lancamentos");
    const [painel, setPainel] = useState("");
    const [periodo, setPeriodo] = useState({ de: "", ate: "" });
    const [rascunhoPeriodo, setRascunhoPeriodo] = useState({ de: "", ate: "" });
    const [tipoFiltro, setTipoFiltro] = useState("");
    const [movimentos, setMovimentos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [aviso, setAviso] = useState("");
    const [lancando, setLancando] = useState(false);
    const [menuLanc, setMenuLanc] = useState(null);
    const [form, setForm] = useState({ tipo: "ENTRADA", quantidade: "", observacao: "" });

    useEffect(() => {
        setAba(abaInicial || "lancamentos");
    }, [abaInicial, produto?.id]);

    const deposito = opcoes.find((item) => item.id === depositoId) || opcoes[0];
    const fisico = produto ? saldoCatalogo(produto, deposito, reais, cache) : 0;
    const reservado = Number(produto?.estoqueReservado || 0);
    const disponivel = fisico - reservado;
    const multi = produto ? saldoCatalogo(produto, null, reais, cache) : 0;
    const temFiltro = Boolean(periodo.de || periodo.ate || tipoFiltro);

    useEffect(() => {
        if (!produto?.id) {
            setCarregando(false);
            return undefined;
        }
        let vivo = true;
        (async () => {
            setCarregando(true);
            try {
                const dados = await consultarAuditoria({ produtoId: produto.id });
                if (vivo) {
                    setMovimentos(Array.isArray(dados) ? dados : []);
                    setAviso("");
                }
            } catch (erro) {
                if (vivo) {
                    setAviso(erro?.response?.data?.mensagem || erro.message || "Não foi possível ler os lançamentos.");
                }
            } finally {
                if (vivo) {
                    setCarregando(false);
                }
            }
        })();
        return () => {
            vivo = false;
        };
    }, [produto?.id]);

    useEffect(() => {
        if ((!painel || painel === "lancar") && menuLanc == null) {
            return undefined;
        }
        function fechar() {
            if (painel !== "lancar") {
                setPainel("");
            }
            setMenuLanc(null);
        }
        document.addEventListener("click", fechar);
        return () => document.removeEventListener("click", fechar);
    }, [painel, menuLanc]);

    const lancamentos = useMemo(() => {
        return movimentos
            .map((item) => movimentoDe(item, produto))
            .filter((item) => movimentoNoDeposito(item, deposito, reais))
            .filter((item) => !tipoFiltro || item.tipo === tipoFiltro)
            .filter((item) => {
                const data = instante(item.dataMovimento);
                if (!data) {
                    return !periodo.de && !periodo.ate;
                }
                if (periodo.de && data < new Date(`${periodo.de}T00:00:00`)) {
                    return false;
                }
                if (periodo.ate && data > new Date(`${periodo.ate}T23:59:59`)) {
                    return false;
                }
                return true;
            });
    }, [movimentos, produto, tipoFiltro, periodo, deposito, reais]);

    const entradas = lancamentos.reduce((soma, item) => soma + Number(item.entrada || 0), 0);
    const saidas = lancamentos.reduce((soma, item) => soma + Number(item.saida || 0), 0);

    async function lancar() {
        if (!produto?.id) {
            return;
        }
        if (form.tipo !== "BALANCO" && !(Number(form.quantidade) > 0)) {
            setAviso("Informe a quantidade do lançamento.");
            return;
        }
        setLancando(true);
        setAviso("");
        try {
            await salvarMovimentacao({
                produtoId: produto.id,
                tipo: form.tipo,
                quantidade: Number(form.quantidade || 0),
                observacao: form.observacao,
                origem: "MANUAL",
                localDestino: deposito?.localId ? Number(deposito.localId) : null
            });
            const dados = await consultarAuditoria({ produtoId: produto.id });
            setMovimentos(Array.isArray(dados) ? dados : []);
            setForm({ tipo: "ENTRADA", quantidade: "", observacao: "" });
            setPainel("");
            await onAtualizado?.();
        } catch (erro) {
            setAviso(erro?.response?.data?.mensagem || erro.message || "Não foi possível incluir o lançamento.");
        } finally {
            setLancando(false);
        }
    }

    async function estornar(item) {
        if (!window.confirm(`Estornar o lançamento #${item.id}?`)) {
            return;
        }
        try {
            await estornarMovimentacao(item.id);
            const dados = await consultarAuditoria({ produtoId: produto.id });
            setMovimentos(Array.isArray(dados) ? dados : []);
            await onAtualizado?.();
        } catch (erro) {
            setAviso(erro?.response?.data?.mensagem || erro.message || "Não foi possível estornar.");
        }
    }

    if (!produto) {
        return (
            <div className="estq2-ficha">
                <button type="button" className="estq2-ghost" onClick={onVoltar}>voltar</button>
                <p>Produto não encontrado.</p>
            </div>
        );
    }

    return (
        <div className="estq2-ficha">
            <div className="estq2-ficha-topo">
                <div className="estq2-ficha-nav">
                    <button type="button" className="estq2-voltar" onClick={onVoltar}>
                        <ArrowLeft size={16} /> voltar
                    </button>
                    <nav className="estq2-crumb">
                        <Link to="/index">início</Link>
                        <span>›</span>
                        <span>suprimentos</span>
                        <span>›</span>
                        <button type="button" onClick={onVoltar}>controle de estoques</button>
                    </nav>
                </div>
                <div className="estq2-acoes">
                    <button type="button" className="estq2-ghost" onClick={onTransferir}>
                        <ArrowLeftRight size={15} />
                        transferir entre depósitos
                    </button>
                    <button type="button" className="estq2-cta" onClick={(evento) => { evento.stopPropagation(); setPainel("lancar"); }}>
                        incluir lançamento
                    </button>
                </div>
            </div>

            <header className="estq2-ficha-nome">
                <h1>{produto.nome}</h1>
                <p>{produto.sku || "—"}</p>
            </header>

            {aviso ? <p className="estq2-aviso">{aviso}</p> : null}

            <div className="estq2-barra">
                <div className="estq2-ancora">
                    <button type="button" className="estq2-chip" onClick={(evento) => { evento.stopPropagation(); setPainel(painel === "deposito" ? "" : "deposito"); }}>
                        <Warehouse size={14} />
                        depósito {deposito?.nome || "Depósito Geral"}
                        <ChevronDown size={14} />
                    </button>
                    {painel === "deposito" ? (
                        <div className="estq2-pop estq2-pop-dep" onClick={(evento) => evento.stopPropagation()}>
                            {opcoes.map((item) => (
                                <button type="button" key={item.id} className={item.id === depositoId ? "is-on" : ""} onClick={() => { setDepositoId(item.id); setPainel(""); }}>
                                    {item.nome}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
                <div className="estq2-ancora">
                    <button type="button" className="estq2-filtro" onClick={(evento) => { evento.stopPropagation(); setRascunhoPeriodo(periodo); setPainel(painel === "periodo" ? "" : "periodo"); }}>
                        <Calendar size={15} />
                        por período
                    </button>
                    {painel === "periodo" ? (
                        <div className="estq2-pop estq2-pop-filtros" onClick={(evento) => evento.stopPropagation()}>
                            <label>
                                De
                                <input type="date" value={rascunhoPeriodo.de} onChange={(evento) => setRascunhoPeriodo((atual) => ({ ...atual, de: evento.target.value }))} />
                            </label>
                            <label>
                                Até
                                <input type="date" value={rascunhoPeriodo.ate} onChange={(evento) => setRascunhoPeriodo((atual) => ({ ...atual, ate: evento.target.value }))} />
                            </label>
                            <div className="estq2-drawer-acoes">
                                <button type="button" className="estq2-cta" onClick={() => { setPeriodo(rascunhoPeriodo); setPainel(""); }}>aplicar</button>
                                <button type="button" className="estq2-link" onClick={() => setPainel("")}>cancelar</button>
                            </div>
                        </div>
                    ) : null}
                </div>
                <div className="estq2-ancora">
                    <button type="button" className="estq2-filtro" onClick={(evento) => { evento.stopPropagation(); setPainel(painel === "tipo" ? "" : "tipo"); }}>
                        <SlidersHorizontal size={15} />
                        por tipo
                    </button>
                    {painel === "tipo" ? (
                        <div className="estq2-pop" onClick={(evento) => evento.stopPropagation()}>
                            <button type="button" className={!tipoFiltro ? "is-on" : ""} onClick={() => { setTipoFiltro(""); setPainel(""); }}>Todos</button>
                            {TIPOS_LANCAMENTO.map((item) => (
                                <button type="button" key={item.id} className={tipoFiltro === item.id ? "is-on" : ""} onClick={() => { setTipoFiltro(item.id); setPainel(""); }}>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
                {temFiltro ? (
                    <button type="button" className="estq2-link" onClick={() => { setPeriodo({ de: "", ate: "" }); setTipoFiltro(""); }}>
                        <FilterX size={14} />
                        limpar filtros
                    </button>
                ) : null}
            </div>

            <div className="estq2-tabs">
                <div>
                    <button type="button" className={aba === "lancamentos" ? "is-on" : ""} onClick={() => setAba("lancamentos")}>lançamentos</button>
                    <button type="button" className={aba === "reservas" ? "is-on" : ""} onClick={() => setAba("reservas")}>reservas</button>
                </div>
            </div>

            <div className="estq2-kpis">
                <article><strong>{qtd(fisico)}</strong><span>saldo físico do depósito</span></article>
                <article><strong>{qtd(reservado)}</strong><span>total reservado</span></article>
                <article><strong>{qtd(disponivel)}</strong><span>total disponível</span></article>
                <article><strong>{qtd(multi)}</strong><span>disponível multiempresa</span></article>
            </div>

            {aba === "reservas" ? (
                <p className="estq2-vazio">Nenhuma reserva para este produto.</p>
            ) : (
                <>
                    <div className="estq2-tabela-wrap estq2-tabela-ficha">
                        <table className="estq2-tabela">
                            <colgroup>
                                <col className="estq2-col-ico" />
                                <col className="estq2-col-data" />
                                <col className="estq2-col-qtd" />
                                <col className="estq2-col-qtd" />
                                <col className="estq2-col-qtd" />
                                <col />
                                <col className="estq2-col-tipo" />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th />
                                    <th>Data e hora</th>
                                    <th className="is-num">Entrada</th>
                                    <th className="is-num">Saída</th>
                                    <th className="is-num">Valor</th>
                                    <th>Observação</th>
                                    <th className="is-fim">Tipo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {carregando ? (
                                    <tr><td className="is-vazio" colSpan={7}>Carregando lançamentos...</td></tr>
                                ) : lancamentos.length === 0 ? (
                                    <tr><td className="is-vazio" colSpan={7}>Nenhum lançamento neste período.</td></tr>
                                ) : lancamentos.map((item) => (
                                    <tr key={item.id}>
                                        <td className="estq2-col-menu">
                                            <div className="estq2-ancora">
                                                <button
                                                    type="button"
                                                    className="estq2-relogio"
                                                    aria-label={`Lançamento ${item.rotulo}`}
                                                    onClick={(evento) => {
                                                        evento.stopPropagation();
                                                        setMenuLanc((atual) => (atual === item.id ? null : item.id));
                                                    }}
                                                >
                                                    <History size={16} />
                                                </button>
                                                {menuLanc === item.id ? (
                                                    <div className="estq2-pop" onClick={(evento) => evento.stopPropagation()}>
                                                        {podeEstornar(item) ? (
                                                            <button type="button" onClick={() => { setMenuLanc(null); estornar(item); }}>estornar</button>
                                                        ) : (
                                                            <span>{item.rotulo}</span>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td>{dataLancamento(item.dataMovimento)}</td>
                                        <td className="is-num">{item.entrada ? qtd(item.entrada) : ""}</td>
                                        <td className="is-num">{item.saida ? qtd(item.saida) : ""}</td>
                                        <td className="is-num">{moeda(item.valor)}</td>
                                        <td className="estq2-obs">{item.observacao || ""}</td>
                                        <td className="is-fim">
                                            <span className="estq2-tipo">
                                                {item.origemRef ? <FileText size={14} /> : null}
                                                {item.origemRef || item.rotulo}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <footer className="estq2-rodape estq2-rodape-ficha">
                        <span>{lancamentos.length} lançamentos</span>
                        <span>{qtd(entradas)} entradas</span>
                        <span>{qtd(saidas)} saídas</span>
                        <button type="button" className="estq2-relogio" aria-label="Voltar ao topo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                            <ChevronUp size={16} />
                        </button>
                    </footer>
                </>
            )}

            {painel === "lancar" ? (
                <div className="estq2-overlay" onClick={() => setPainel("")}>
                    <aside className="estq2-drawer" onClick={(evento) => evento.stopPropagation()} role="dialog" aria-modal="true">
                        <header>
                            <h2>Incluir lançamento</h2>
                            <button type="button" onClick={() => setPainel("")}>fechar <X size={16} /></button>
                        </header>
                        <p>{produto.nome}</p>
                        <label>
                            Tipo
                            <select value={form.tipo} onChange={(evento) => setForm((atual) => ({ ...atual, tipo: evento.target.value }))}>
                                {TIPOS_LANCAMENTO.filter((item) => item.id !== "TRANSFERENCIA" && item.id !== "ESTORNO").map((item) => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Quantidade
                            <input inputMode="decimal" value={form.quantidade} onChange={(evento) => setForm((atual) => ({ ...atual, quantidade: evento.target.value }))} />
                        </label>
                        <label>
                            Observação
                            <textarea rows={3} value={form.observacao} onChange={(evento) => setForm((atual) => ({ ...atual, observacao: evento.target.value }))} />
                        </label>
                        <div className="estq2-drawer-acoes">
                            <button type="button" className="estq2-cta" disabled={lancando} onClick={lancar}>{lancando ? "salvando..." : "salvar"}</button>
                            <button type="button" className="estq2-link" onClick={() => setPainel("")}>cancelar</button>
                        </div>
                    </aside>
                </div>
            ) : null}
        </div>
    );
}

function Transferencia({ produtos, opcoes, onFechar, onConcluido }) {
    const origemPadrao = opcoes.find((item) => item.id === "AL") || opcoes[0];
    const destinoPadrao = opcoes.find((item) => item.id === "DEP" && item.localId !== origemPadrao?.localId) || opcoes[1] || opcoes[0];
    const [passo, setPasso] = useState(1);
    const [origemId, setOrigemId] = useState(origemPadrao?.localId || "");
    const [destinoId, setDestinoId] = useState(destinoPadrao?.localId || "");
    const [observacao, setObservacao] = useState("");
    const [linhas, setLinhas] = useState([novaLinha()]);
    const [erro, setErro] = useState("");
    const [ocupado, setOcupado] = useState(false);

    const origem = opcoes.find((item) => item.localId && item.localId === origemId);
    const destino = opcoes.find((item) => item.localId && item.localId === destinoId);

    function atualizar(chave, patch) {
        setLinhas((atual) => atual.map((linha) => (linha.chave === chave ? { ...linha, ...patch } : linha)));
    }

    async function escolher(linha, produto) {
        atualizar(linha.chave, {
            produto,
            busca: produto.nome,
            valor: produto.preco ? String(produto.preco) : "",
            saldo: null
        });
        try {
            const saldos = await saldosProduto(produto);
            const local = saldos.find((item) => String(item.id) === origemId);
            atualizar(linha.chave, { saldo: Number(local?.quantidade || 0) });
        } catch (falha) {
            setErro(falha.message || "Não foi possível ler o saldo de origem.");
        }
    }

    function continuar() {
        if (!origemId || !destinoId || origemId === destinoId) {
            setErro("Escolha depósitos de origem e destino diferentes.");
            return;
        }
        if (!origem?.localId || !destino?.localId) {
            setErro("Este depósito ainda não está ligado a um local de estoque.");
            return;
        }
        setErro("");
        setObservacao((atual) => atual || (destino ? `Transferência para ${destino.nome}` : ""));
        setPasso(2);
    }

    async function transferir() {
        const prontas = linhas.filter((linha) => linha.produto && Number(linha.quantidade) > 0);
        if (!prontas.length) {
            setErro("Informe ao menos um item e a quantidade.");
            return;
        }
        setOcupado(true);
        setErro("");
        try {
            for (const linha of prontas) {
                await transferirEntreLocais(
                    linha.produto,
                    Number(origemId),
                    Number(destinoId),
                    linha.quantidade,
                    observacao
                );
            }
            onConcluido(`${prontas.length} item(ns) transferido(s) para ${destino?.nome || "o destino"}.`);
        } catch (falha) {
            setErro(falha.message || "Não foi possível transferir.");
        } finally {
            setOcupado(false);
        }
    }

    return (
        <div className="estq2-overlay" onClick={onFechar}>
            <aside className="estq2-drawer is-larga" onClick={(evento) => evento.stopPropagation()} role="dialog" aria-modal="true">
                <header>
                    <h2>Transferência entre depósitos</h2>
                    <button type="button" onClick={onFechar}>fechar <X size={16} /></button>
                </header>

                {passo === 1 ? (
                    <>
                        <div className="estq2-par">
                            <label>
                                Depósito de origem
                                <select value={origemId} onChange={(evento) => setOrigemId(evento.target.value)}>
                                    {opcoes.map((item) => <option key={item.id} value={item.localId}>{item.nome}</option>)}
                                </select>
                            </label>
                            <label>
                                Depósito de destino
                                <select value={destinoId} onChange={(evento) => setDestinoId(evento.target.value)}>
                                    <option value="">Selecione</option>
                                    {opcoes.map((item) => <option key={item.id} value={item.localId}>{item.nome}</option>)}
                                </select>
                            </label>
                        </div>
                        {erro ? <p className="estq2-erro">{erro}</p> : null}
                        <div className="estq2-drawer-acoes">
                            <button type="button" className="estq2-cta" onClick={continuar}>continuar</button>
                            <button type="button" className="estq2-link" onClick={onFechar}>cancelar</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="estq2-par">
                            <label>
                                Depósito de origem
                                <input value={origem?.nome || ""} readOnly />
                            </label>
                            <label>
                                Depósito de destino
                                <input value={destino?.nome || ""} readOnly />
                            </label>
                        </div>
                        <label>
                            Observação
                            <textarea rows={3} value={observacao} onChange={(evento) => setObservacao(evento.target.value)} />
                        </label>
                        <p className="estq2-hint">A observação será aplicada a todas as transferências.</p>
                        <h3>Itens</h3>
                        <div className="estq2-grade">
                            <span>Produto</span>
                            <span>Código (SKU)</span>
                            <span>Saldo na origem</span>
                            <span>Quantidade a transferir</span>
                            <span>Valor unitário</span>
                            <span>Ações</span>
                        </div>
                        {linhas.map((linha) => {
                            const sugestoes = linha.busca.trim().length < 2 || linha.produto?.nome === linha.busca
                                ? []
                                : produtos.filter((produto) => {
                                    const base = `${produto.nome} ${produto.sku || ""}`.toLowerCase();
                                    return base.includes(linha.busca.trim().toLowerCase());
                                }).slice(0, 8);
                            return (
                                <div className="estq2-grade" key={linha.chave}>
                                    <div className="estq2-ancora">
                                        <input
                                            value={linha.busca}
                                            placeholder="Pesquise por descrição, código (SKU) ou GTIN/EAN"
                                            onChange={(evento) => atualizar(linha.chave, { busca: evento.target.value, produto: null, saldo: null })}
                                        />
                                        {sugestoes.length ? (
                                            <div className="estq2-pop estq2-pop-busca">
                                                {sugestoes.map((produto) => (
                                                    <button type="button" key={produto.id} onClick={() => escolher(linha, produto)}>
                                                        {produto.nome}
                                                        {produto.sku ? <small>{produto.sku}</small> : null}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                    <input value={linha.produto?.sku || ""} readOnly />
                                    <input value={linha.saldo == null ? "" : qtd(linha.saldo)} readOnly />
                                    <input
                                        inputMode="decimal"
                                        value={linha.quantidade}
                                        onChange={(evento) => atualizar(linha.chave, { quantidade: evento.target.value, salva: false })}
                                    />
                                    <input
                                        inputMode="decimal"
                                        value={linha.valor}
                                        onChange={(evento) => atualizar(linha.chave, { valor: evento.target.value })}
                                    />
                                    <div className="estq2-item-acoes">
                                        <button
                                            type="button"
                                            className="estq2-link"
                                            onClick={() => {
                                                if (!linha.produto) {
                                                    setErro("Selecione o produto.");
                                                    return;
                                                }
                                                if (!(Number(linha.quantidade) > 0)) {
                                                    setErro("Informe a quantidade a transferir.");
                                                    return;
                                                }
                                                if (linha.saldo != null && Number(linha.quantidade) > Number(linha.saldo)) {
                                                    setErro(`Saldo insuficiente em ${origem?.nome || "origem"}.`);
                                                    return;
                                                }
                                                setErro("");
                                                atualizar(linha.chave, { salva: true });
                                            }}
                                        >
                                            {linha.salva ? <Check size={14} /> : null}
                                            salvar
                                        </button>
                                        <button type="button" aria-label="Remover item" onClick={() => setLinhas((atual) => atual.filter((item) => item.chave !== linha.chave))}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        <button type="button" className="estq2-link" onClick={() => setLinhas((atual) => [...atual, novaLinha()])}>
                            <Plus size={14} /> adicionar item
                        </button>
                        {erro ? <p className="estq2-erro">{erro}</p> : null}
                        <div className="estq2-drawer-acoes">
                            <button type="button" className="estq2-cta" disabled={ocupado} onClick={transferir}>
                                {ocupado ? "transferindo..." : "transferir"}
                            </button>
                            <button type="button" className="estq2-link" onClick={() => setPasso(1)}>voltar</button>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
}
