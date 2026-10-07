import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    Camera,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
    MoreVertical,
    PenLine,
    Plus,
    Printer,
    ScanLine,
    Search,
    X
} from "lucide-react";

import { agregarItensNfe, parseXmlNota } from "../../constants/notasEntrada";
import { alinharPrecos, emPromocao, ouvirPrecos, rotuloOff } from "../../constants/precoPromocional";
import { atalhosCatalogo, ligacoesProduto } from "../../constants/produtoLigacoes";
import ROTAS from "../../constants/rotas";
import {
    atualizarProduto,
    buscarProduto,
    excluirProduto,
    importarProdutosLote,
    listarProdutos,
    salvarProduto
} from "../../services/produto.service";
import {
    canaisAutoPublicar,
    enviarMidiaProduto,
    enviarUrlVideo,
    excluirMidiaProduto,
    parseMidia,
    publicarAnunciosProduto,
    urlMidia
} from "../../services/produtoMidia.service";
import { listarMarcas } from "../../services/marca.service";
import { acharPorCodigo } from "../../services/reconhecerProduto";
import { imprimirProdutosLocalizacao, passaFiltroEstoque, produtoNaLocalizacao } from "../../services/localizacao";
import { imprimirEtiquetasGondola } from "../../services/etiquetaGondola";
import BuscaLocalizacao from "../../components/BuscaLocalizacao";
import LeitorProduto from "../../components/LeitorProduto";
import HistoricoAuditoria from "../../components/HistoricoAuditoria";
import MidiaProduto from "../../components/MidiaProduto";
import "../../styles/pages/auditoria.css";
import "../../styles/pages/localizacao.css";
import {
    componentesDoProduto,
    kitsQueContemSku,
    lerPlanilhaKits,
    mesclarComponentes,
    produtoTemSku,
    resumoUsos,
    skuChave,
    usosDoComponente
} from "../../services/kitComposicao";
import ImportadorMassa from "./ImportadorMassa";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/promocoes.css";

const TAMANHOS = [10, 20, 50];
const COLUNAS_KEY = "erp-produtos-colunas-v4";

const TIPOS = [
    { id: "todos", label: "Todos" },
    { id: "simples", label: "Simples" },
    { id: "kits", label: "Kits" },
    { id: "variacoes", label: "Variações" },
    { id: "fabricado", label: "Fabricado" },
    { id: "materia-prima", label: "Matéria-prima" },
    { id: "contem", label: "Contém" }
];

const TIPOS_CADASTRO = TIPOS.filter((t) => t.id !== "todos" && t.id !== "contem");

const COLUNAS = [
    { id: "descricao", label: "Descrição", fixa: true },
    { id: "sku", label: "Código (SKU)" },
    { id: "gtin", label: "GTIN/EAN" },
    { id: "unidade", label: "Unidade" },
    { id: "ncm", label: "NCM" },
    { id: "preco", label: "Preço" },
    { id: "precoPromocional", label: "Promocional" },
    { id: "desconto", label: "% OFF" },
    { id: "custo", label: "Custo" },
    { id: "marca", label: "Marca" },
    { id: "localizacao", label: "Localização" },
    { id: "estoqueFisico", label: "Estoque físico" },
    { id: "estoqueDisponivel", label: "Estoque disponível" },
    { id: "situacao", label: "Situação" }
];

const COLUNAS_NUMERICAS = new Set(["preco", "precoPromocional", "desconto", "custo", "estoqueFisico", "estoqueDisponivel"]);

function eanProvavel(valor) {
    const d = String(valor || "").replace(/\D/g, "");
    return /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(d);
}

function skuGtin(produto) {
    const skuBruto = String(produto.sku || "").trim();
    const gtinBruto = String(produto.gtin || produto.codigoBarras || "").trim();
    if (skuBruto && eanProvavel(skuBruto) && (!gtinBruto || skuBruto === gtinBruto)) {
        return { sku: "", gtin: skuBruto.replace(/\D/g, "") };
    }
    return { sku: skuBruto, gtin: gtinBruto.replace(/\D/g, "") || gtinBruto };
}

function classificarTipo(produto) {
    const tipoInformado = produto.tipoCadastro || produto.tipo;
    if (tipoInformado && TIPOS_CADASTRO.some((t) => t.id === tipoInformado)) {
        return tipoInformado;
    }
    if (componentesDoProduto(produto).length) {
        return produto.produtoProducao ? "fabricado" : "kits";
    }
    const nome = String(produto.nome || "").toUpperCase();
    const grupo = String(produto.grupo || produto.categoria || "").toUpperCase();
    if (grupo === "ARTESANATO" || /MAT[EÉ]RIA/.test(grupo) || grupo === "INSUMO" || grupo === "INSUMOS") {
        return "materia-prima";
    }
    if (/\bKITS?\b/.test(nome) || grupo === "KIT" || grupo === "KITS") {
        return "kits";
    }
    if (produto.produtoProducao || /^PERSONALIZ/.test(grupo)) {
        return "fabricado";
    }
    if (produto.variacaoPaiId || /VARIAC|VARIAÇ/.test(nome)) {
        return "variacoes";
    }
    return "simples";
}

function codigoFornecedorDe(produto, sku) {
    if (produto.codigoFornecedor) {
        return produto.codigoFornecedor;
    }
    if (sku && /^\d+$/.test(sku)) {
        return sku;
    }
    return "";
}

function normalizar(produto, origem) {
    const { sku, gtin } = skuGtin(produto);
    const estoque = Number(produto.estoque || 0);
    return {
        ...produto,
        origem,
        sku,
        gtin,
        codigoBarras: gtin,
        unidade: produto.unidade || "UN",
        ncm: produto.ncm || "",
        preco: Number(produto.preco || 0),
        precoPromocional: Number(produto.precoPromocional || 0),
        descontoPercentual: Number(produto.descontoPercentual || 0),
        custo: Number(produto.custo || 0),
        marca: produto.marca || "",
        codigoFornecedor: codigoFornecedorDe(produto, sku),
        estoque,
        estoqueDisponivel: Number(produto.estoqueDisponivel ?? estoque),
        localizacao: produto.localizacao || "",
        grupo: produto.grupo || produto.categoria || "",
        categoria: produto.categoria || produto.grupo || "",
        ativo: produto.ativo !== false,
        observacoes: produto.observacoes || "",
        tipoCadastro: produto.tipoCadastro || "",
        componentes: componentesDoProduto(produto),
        tipo: classificarTipo({ ...produto, sku }),
        imagem: produto.imagem || produto.fotos?.[0]?.url || "",
        fotos: produto.fotos || parseMidia(produto).fotos,
        videos: produto.videos || [],
        anuncios: produto.anuncios || []
    };
}

function mesclarProdutos(api, loja) {
    const mapa = new Map();
    loja.forEach((p) => {
        const n = normalizar(p, "loja");
        mapa.set(`loja:${n.id}`, n);
    });
    api.forEach((p) => {
        const n = normalizar(p, "api");
        const irmao = [...mapa.values()].find((x) =>
            (n.sku && x.sku && n.sku === x.sku)
            || (n.gtin && x.gtin && n.gtin === x.gtin)
        );
        if (irmao) {
            mapa.set(`loja:${irmao.id}`, { ...irmao, ...n, origem: "api", id: irmao.id });
        } else {
            mapa.set(`api:${n.id}`, n);
        }
    });
    return [...mapa.values()];
}

function moeda(valor) {
    const n = Number(valor);
    if (!Number.isFinite(n)) {
        return "-";
    }
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function qtd(valor) {
    const n = Number(valor);
    if (!Number.isFinite(n)) {
        return "-";
    }
    if (Math.abs(n - Math.round(n)) < 1e-6) {
        return String(Math.round(n));
    }
    return n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

function urlFotoProduto(produto) {
    const capa = produto?.imagem || produto?.fotos?.[0]?.url;
    return capa ? urlMidia(capa) : "";
}

function situacaoEstoque(produto) {
    const estoque = Number(produto?.estoque || 0);
    const minimo = Number(produto?.estoqueMinimo || 0);
    if (estoque <= 0) {
        return "zero";
    }
    if (minimo > 0 && estoque <= minimo) {
        return "baixo";
    }
    return "ok";
}

function visualProduto(produto) {
    const capa = produto.imagem || produto.fotos?.[0]?.url || produto.logoMarca;
    if (capa) {
        return { bg: "#e2e8f0", img: urlMidia(capa), emoji: "" };
    }
    const t = `${produto.nome || ""} ${produto.grupo || ""}`.toUpperCase();
    if (/NATURA|PERFUM|DES COL|DEO PARFUM|SABONETE|SAB BAR|MAQUIAGEM|COSM[EÉ]T/.test(t)) {
        return { bg: "#fce7f3", emoji: "🧴" };
    }
    if (/CANECA|COPO|XICARA/.test(t)) {
        return { bg: "#f4c7b8", emoji: "☕" };
    }
    if (/BLUSA|CAMISA|LUVAS|ENCHARPE|ROUPA|INVERNO|MEIA/.test(t)) {
        return { bg: "#f5c0d4", emoji: "👕" };
    }
    if (/CADERN|CANETA|LAPI|PAPELARIA|BORRACHA/.test(t)) {
        return { bg: "#e8ddd0", emoji: "📒" };
    }
    if (/GARRAFA|SQUEEZE|TERMICA/.test(t)) {
        return { bg: "#cfe0d4", emoji: "🥤" };
    }
    if (/BRINQUEDO|BLOCO|BONECA/.test(t)) {
        return { bg: "#fde68a", emoji: "🧸" };
    }
    if (/MOUSE|USB|ELETRON|CABO|PENDRIVE/.test(t)) {
        return { bg: "#d5dce6", emoji: "🖱️" };
    }
    if (/ETIQUETA|ADESIVO|GRAFICA/.test(t)) {
        return { bg: "#e7e5e4", emoji: "🏷️" };
    }
    if (/PERSONALIZ|CANECA/.test(t)) {
        return { bg: "#fce7f3", emoji: "✨" };
    }
    if (/CHAVEIRO/.test(t)) {
        return { bg: "#fef3c7", emoji: "🔑" };
    }
    if (/BIJUTER|PIERCING/.test(t)) {
        return { bg: "#ede9fe", emoji: "💍" };
    }
    return {
        bg: ["#dbeafe", "#fce7f3", "#dcfce7", "#fef3c7", "#e0e7ff"][Math.abs(Number(produto.id) || 0) % 5],
        emoji: String(produto.nome || "P").charAt(0)
    };
}

function ncmFmt(valor) {
    const d = String(valor || "").replace(/\D/g, "");
    if (d.length !== 8) {
        return valor || "-";
    }
    return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`;
}

function dash(valor) {
    const t = String(valor || "").trim();
    return t || "-";
}

function rotuloTipoUso(tipo) {
    return tipo === "fabricado" ? "Fabricado" : "Kit";
}

function rotuloContem(kit, termo) {
    const tipo = rotuloTipoUso(kit.usoTipo || kit.tipo);
    const comps = (kit.usoComponentes || componentesDoProduto(kit)).filter((c) => skuChave(c.sku).includes(String(termo || "").trim().toLowerCase()) || produtoTemSku({ sku: c.sku, gtin: c.sku }, termo));
    if (comps.length) {
        return `${tipo} · contém ${comps.map((c) => `${c.sku} × ${c.quantidade}`).join(" · ")}`;
    }
    if (kit.usoQuantidade) {
        return `${tipo} · contém ${String(termo || "").trim()} × ${kit.usoQuantidade}`;
    }
    return `${tipo} que contém ${String(termo || "").trim()}`;
}

function textoResumoUsos(usos, termo) {
    const { kits, fabricados, total } = resumoUsos(usos);
    if (!total) {
        return "";
    }
    const partes = [];
    if (kits) {
        partes.push(`${kits} kit${kits === 1 ? "" : "s"}`);
    }
    if (fabricados) {
        partes.push(`${fabricados} fabricado${fabricados === 1 ? "" : "s"}`);
    }
    const rotulo = partes.join(" e ");
    return termo ? `${rotulo} usam ${termo}` : `${rotulo} usam este produto`;
}

function colunasSalvas() {
    try {
        const bruto = JSON.parse(localStorage.getItem(COLUNAS_KEY) || "null");
        if (Array.isArray(bruto) && bruto.length) {
            return bruto;
        }
    } catch {
        /* ignore */
    }
    return COLUNAS.map((c) => c.id);
}

function paginasVisiveis(atual, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (atual <= 4) {
        return [1, 2, 3, 4, 5, "…", total];
    }
    if (atual >= total - 3) {
        return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, "…", atual - 1, atual, atual + 1, "…", total];
}

function textoDe(produto) {
    return [
        produto.nome,
        produto.sku,
        produto.gtin,
        produto.marca,
        produto.codigoFornecedor,
        produto.ncm,
        produto.grupo,
        produto.localizacao
    ].join(" ").toLowerCase();
}

function exportarCsv(lista) {
    const linhas = [[
        "Descrição", "SKU", "GTIN/EAN", "Unidade", "NCM", "Preço", "Preço promocional", "% OFF", "Custo",
        "Marca", "Cód. Fornecedor", "Estoque físico", "Estoque disponível", "Localização"
    ].join(";")];
    lista.forEach((p) => {
        linhas.push([
            p.nome, p.sku, p.gtin, p.unidade, p.ncm, p.preco, p.precoPromocional, p.descontoPercentual, p.custo,
            p.marca, p.codigoFornecedor, p.estoque, p.estoqueDisponivel, p.localizacao
        ].map((v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`).join(";"));
    });
    const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "produtos.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function passaFiltroMarca(produto, marca, marcaId) {
    if (!marca && !marcaId) {
        return true;
    }
    if (marcaId && String(produto.marcaId) === String(marcaId)) {
        return true;
    }
    return Boolean(marca && String(produto.marca || "").toLowerCase().includes(marca.toLowerCase()));
}

export default function Produtos() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const raiz = useRef(null);
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState(params.get("q") || "");
    const [tipo, setTipo] = useState("todos");
    const [soAtivos, setSoAtivos] = useState(true);
    const [ordem, setOrdem] = useState("nome");
    const [dir, setDir] = useState("asc");
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);
    const [aberto, setAberto] = useState(null);
    const [menuLinha, setMenuLinha] = useState(null);
    const [marcados, setMarcados] = useState([]);
    const [colunas, setColunas] = useState(colunasSalvas);
    const [modal, setModal] = useState(null);
    const [filtros, setFiltros] = useState({
        marca: params.get("marca") || "",
        grupo: "",
        localizacao: params.get("localizacao") || ""
    });
    const [rascunho, setRascunho] = useState({
        marca: params.get("marca") || "",
        grupo: "",
        localizacao: params.get("localizacao") || ""
    });
    const [filtroEstoque, setFiltroEstoque] = useState(
        params.get("estoque") || (params.get("comEstoque") === "1" ? "disponivel" : "todos")
    );
    const abertoPorUrl = useRef("");
    const [soPromocao, setSoPromocao] = useState(false);
    const [aviso, setAviso] = useState("");
    const xmlRef = useRef(null);
    const xlsRef = useRef(null);
    const kitsRef = useRef(null);
    const [importando, setImportando] = useState(false);
    const [importadorMassa, setImportadorMassa] = useState(false);
    const [leitor, setLeitor] = useState(null);
    const [destaqueId, setDestaqueId] = useState(null);
    const [candidatos, setCandidatos] = useState([]);

    useEffect(() => {
        const q = params.get("q");
        if (q) {
            setBusca(q);
        }
    }, [params]);

    async function carregarProdutos() {
        setLoading(true);
        try {
            const [api, marcas] = await Promise.all([
                listarProdutos(),
                listarMarcas().catch(() => [])
            ]);
            const nomes = new Map();
            const logos = new Map();
            (Array.isArray(marcas) ? marcas : []).forEach((marca) => {
                if (marca?.id != null) {
                    nomes.set(String(marca.id), marca.nome || "");
                }
                if (!marca?.logo) {
                    return;
                }
                logos.set(`id:${marca.id}`, marca.logo);
                logos.set(String(marca.nome || "").trim().toLowerCase(), marca.logo);
            });
            const listaMarcas = (Array.isArray(marcas) ? marcas : [])
                .filter((m) => m?.logo && String(m.nome || "").trim().length >= 3)
                .sort((a, b) => String(b.nome).length - String(a.nome).length);
            setProdutos((Array.isArray(api) ? api : []).map((p) => {
                const n = normalizar(p, "api");
                let logoMarca = logos.get(`id:${p.marcaId}`) || logos.get(String(n.marca || "").trim().toLowerCase());
                if (!logoMarca) {
                    const nome = String(n.nome || "").toLowerCase();
                    const achada = listaMarcas.find((m) => nome.includes(String(m.nome).trim().toLowerCase()));
                    logoMarca = achada?.logo;
                }
                return { ...n, marca: n.marca || nomes.get(String(p.marcaId || n.marcaId || "")) || "", logoMarca };
            }));
        } catch (erro) {
            console.error("Erro ao carregar produtos:", erro);
            setProdutos([]);
            setAviso("Não foi possível ler os produtos do banco.");
        } finally {
            setLoading(false);
        }
    }

    function mensagemErro(erro) {
        return erro?.response?.data?.mensagem
            || erro?.response?.data?.message
            || erro?.message
            || "Falha na API.";
    }

    async function importarXml(arquivo) {
        if (!arquivo) {
            return;
        }
        setImportando(true);
        try {
            const parsed = parseXmlNota(await arquivo.text(), arquivo.name);
            const itens = agregarItensNfe(parsed.itens || []).map((item) => ({
                sku: item.sku || item.gtin || "",
                codigoBarras: item.gtin || "",
                nome: item.nome,
                unidade: item.unidade || "UN",
                ncm: item.ncm || "",
                cest: item.cest || "",
                categoria: item.categoria || item.grupo || "",
                custo: Number(item.custo || item.preco || 0),
                estoque: Number(item.estoque ?? item.qtd ?? 0),
                preco: Number(item.preco || item.custo || 0),
                ativo: true
            })).filter((p) => p.nome);
            if (!itens.length) {
                setAviso(`O XML ${arquivo.name} não tem itens de produto (det/prod).`);
                return;
            }
            const resumo = await importarProdutosLote(itens);
            setSoAtivos(false);
            await carregarProdutos();
            const falhas = resumo.erros ? `, ${resumo.erros} com erro` : "";
            setAviso(`NF-e ${parsed.numero}: ${resumo.novos} novos, ${resumo.atualizados} atualizados${falhas}.`);
        } catch (erro) {
            console.error(erro);
            setAviso(`Não foi possível importar o XML: ${mensagemErro(erro)}`);
        } finally {
            setImportando(false);
            setAberto(null);
            if (xmlRef.current) {
                xmlRef.current.value = "";
            }
        }
    }

    async function importarExcel(arquivo) {
        if (!arquivo) {
            return;
        }
        setImportando(true);
        try {
            const lido = await lerPlanilhaProdutos(arquivo);
            const itens = Array.isArray(lido) ? lido : (lido.itens || []);
            const origem = lido.origem || "produtos";
            if (!itens.length) {
                setAviso("A planilha não tem produtos com descrição.");
                return;
            }
            const resumo = await importarProdutosLote(itens);
            setSoAtivos(false);
            await carregarProdutos();
            const falhas = resumo.erros ? `, ${resumo.erros} com erro` : "";
            const tipo = origem === "pedidos"
                ? `${itens.length} produtos únicos extraídos dos pedidos`
                : `${resumo.total} produtos`;
            setAviso(`${arquivo.name}: ${tipo} gravados (${resumo.novos} novos, ${resumo.atualizados} atualizados${falhas}).`);
        } catch (erro) {
            console.error(erro);
            setAviso(`Não foi possível importar o Excel: ${mensagemErro(erro)}`);
        } finally {
            setImportando(false);
            setAberto(null);
            if (xlsRef.current) {
                xlsRef.current.value = "";
            }
        }
    }

    async function importarKits(arquivo) {
        if (!arquivo) {
            return;
        }
        setImportando(true);
        try {
            const lido = await lerPlanilhaKits(arquivo);
            if (!lido.itens.length) {
                setAviso("A planilha não tem SKU de kit ou componente.");
                return;
            }
            const payload = lido.itens.map((kit) => {
                const atual = produtos.find((p) => skuChave(p.sku) === skuChave(kit.sku));
                return {
                    ...atual,
                    sku: kit.sku,
                    nome: kit.nome || atual?.nome || kit.sku,
                    tipoCadastro: atual?.tipo === "fabricado" || atual?.tipoCadastro === "fabricado" || kit.tipoCadastro === "fabricado" ? "fabricado" : "kits",
                    tipo: atual?.tipo === "fabricado" || kit.tipoCadastro === "fabricado" ? "fabricado" : "kits",
                    componentes: mesclarComponentes(atual?.componentes, kit.componentes),
                    observacoes: atual?.observacoes || "",
                    ativo: atual?.ativo !== false
                };
            });
            const resumo = await importarProdutosLote(payload);
            setSoAtivos(false);
            setTipo("kits");
            await carregarProdutos();
            const falhas = resumo.erros ? `, ${resumo.erros} com erro` : "";
            setAviso(`${arquivo.name}: ${lido.itens.length} composição(ões) de kit/fabricado (${resumo.novos} novos, ${resumo.atualizados} atualizados${falhas}).`);
        } catch (erro) {
            console.error(erro);
            setAviso(`Não foi possível importar os kits: ${mensagemErro(erro)}`);
        } finally {
            setImportando(false);
            setAberto(null);
            if (kitsRef.current) {
                kitsRef.current.value = "";
            }
        }
    }

    useEffect(() => {
        carregarProdutos();
        return ouvirPrecos(() => {
            carregarProdutos();
        });
    }, []);

    useEffect(() => {
        const id = params.get("edit") || params.get("id") || String(window.location.hash).match(/^#edit\/([^/?#]+)/)?.[1];
        if (!id || !produtos.length || abertoPorUrl.current === String(id)) {
            return;
        }
        const achado = produtos.find((p) => String(p.id) === String(id));
        if (achado) {
            abertoPorUrl.current = String(id);
            setModal(achado);
        }
    }, [produtos, params]);

    useEffect(() => {
        function fechar(ev) {
            if (raiz.current && !raiz.current.contains(ev.target)) {
                setAberto(null);
                setMenuLinha(null);
            }
        }
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, []);

    const visiveis = useMemo(() => {
        const termo = busca.toLowerCase().trim();
        const universo = produtos.filter((p) => {
            if (soAtivos && p.ativo === false) {
                return false;
            }
            if (!passaFiltroEstoque(p, filtroEstoque)) {
                return false;
            }
            if (soPromocao && !emPromocao(p)) {
                return false;
            }
            if (!passaFiltroMarca(p, filtros.marca, params.get("marcaId"))) {
                return false;
            }
            if (filtros.grupo && !(p.grupo || "").toLowerCase().includes(filtros.grupo.toLowerCase())) {
                return false;
            }
            if (filtros.localizacao && !produtoNaLocalizacao(p, filtros.localizacao)) {
                return false;
            }
            return true;
        });
        let itens = tipo === "contem"
            ? kitsQueContemSku(universo, busca)
            : universo.filter((p) => {
                if (tipo !== "todos" && p.tipo !== tipo) {
                    return false;
                }
                if (termo && !textoDe(p).includes(termo) && !produtoNaLocalizacao(p, termo)) {
                    return false;
                }
                return true;
            });
        itens = [...itens].sort((a, b) => {
            const campo = ordem === "nome" ? "nome" : ordem;
            const va = a[campo] ?? a.nome ?? "";
            const vb = b[campo] ?? b.nome ?? "";
            const na = Number(va);
            const nb = Number(vb);
            let cmp;
            if (Number.isFinite(na) && Number.isFinite(nb) && String(va) !== "" && COLUNAS_NUMERICAS.has(campo)) {
                cmp = na - nb;
            } else {
                cmp = String(va).localeCompare(String(vb), "pt-BR", { numeric: true, sensitivity: "base" });
            }
            return dir === "desc" ? -cmp : cmp;
        });
        return itens;
    }, [produtos, busca, tipo, soAtivos, filtroEstoque, soPromocao, ordem, dir, filtros, params]);

    const contagens = useMemo(() => {
        const termo = busca.toLowerCase().trim();
        const universo = produtos.filter((p) => {
            if (soAtivos && p.ativo === false) {
                return false;
            }
            if (!passaFiltroEstoque(p, filtroEstoque)) {
                return false;
            }
            if (soPromocao && !emPromocao(p)) {
                return false;
            }
            if (!passaFiltroMarca(p, filtros.marca, params.get("marcaId"))) {
                return false;
            }
            if (filtros.grupo && !(p.grupo || "").toLowerCase().includes(filtros.grupo.toLowerCase())) {
                return false;
            }
            if (filtros.localizacao && !produtoNaLocalizacao(p, filtros.localizacao)) {
                return false;
            }
            return true;
        });
        const pesquisados = termo ? universo.filter((p) => textoDe(p).includes(termo) || produtoNaLocalizacao(p, termo)) : universo;
        const c = { todos: pesquisados.length };
        TIPOS_CADASTRO.forEach((t) => {
            c[t.id] = pesquisados.filter((p) => p.tipo === t.id).length;
        });
        c.contem = kitsQueContemSku(universo, busca).length;
        return c;
    }, [produtos, soAtivos, filtroEstoque, soPromocao, busca, filtros, params]);

    const grupos = useMemo(
        () => [...new Set(produtos.map((p) => p.grupo).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, "pt-BR")),
        [produtos]
    );

    const totalPaginas = Math.max(1, Math.ceil(visiveis.length / porPagina));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const inicio = (paginaAtual - 1) * porPagina;
    const fatia = visiveis.slice(inicio, inicio + porPagina);

    useEffect(() => {
        setPagina(1);
    }, [busca, tipo, soAtivos, filtroEstoque, soPromocao, ordem, dir, filtros, porPagina]);

    function visivel(id) {
        return colunas.includes(id);
    }

    function ordenar(campo) {
        if (ordem === campo) {
            setDir((d) => (d === "asc" ? "desc" : "asc"));
            return;
        }
        setOrdem(campo);
        setDir("asc");
    }

    function toggleMarca(id) {
        setMarcados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
    }

    function marcarPagina(ev) {
        const ids = fatia.map((p) => p.id);
        if (ev.target.checked) {
            setMarcados((atual) => [...new Set([...atual, ...ids])]);
        } else {
            setMarcados((atual) => atual.filter((id) => !ids.includes(id)));
        }
    }

    const temFiltro = busca || !soAtivos || (filtroEstoque && filtroEstoque !== "todos") || soPromocao || tipo !== "todos"
        || filtros.marca || params.get("marcaId") || filtros.grupo || filtros.localizacao;

    function limparFiltros() {
        setBusca("");
        setSoAtivos(true);
        setFiltroEstoque("todos");
        setSoPromocao(false);
        setTipo("todos");
        setFiltros({ marca: "", grupo: "", localizacao: "" });
        setRascunho({ marca: "", grupo: "", localizacao: "" });
        setOrdem("nome");
        setDir("asc");
        setDestaqueId(null);
        setCandidatos([]);
    }

    function focarProdutos(lista, texto) {
        setLeitor(null);
        setCandidatos(lista.map((produto) => ({ produto, score: 1 })));
        if (lista.length === 1) {
            const item = lista[0];
            setBusca(item.sku || item.gtin || item.nome || texto);
            setDestaqueId(item.id);
            setAviso(`Produto encontrado: ${item.nome || texto}.`);
            return;
        }
        setBusca(texto);
        setDestaqueId(null);
        setAviso(`${lista.length} produtos usam o código ${texto}. Escolha o cadastro.`);
    }

    function aplicarCodigo(codigo) {
        const texto = String(codigo || "").trim();
        if (!texto) {
            return;
        }
        const achados = acharPorCodigo(produtos, texto);
        if (!achados.length) {
            setLeitor(null);
            setCandidatos([]);
            setDestaqueId(null);
            setBusca(texto);
            setAviso(`Nenhum produto com o código ${texto}. A busca ficou com esse valor para incluir o cadastro.`);
            return;
        }
        focarProdutos(achados, texto);
    }

    function aplicarFoto({ ranking, totalFotos }) {
        setLeitor(null);
        if (!ranking?.length) {
            setCandidatos([]);
            setAviso(totalFotos
                ? "Não reconheci o produto entre as fotos do cadastro. Tente o código de barras ou uma foto mais parecida com a cadastrada."
                : "Nenhum produto tem foto no cadastro. O reconhecimento visual compara com essas imagens. Cadastre uma foto ou leia o código de barras.");
            return;
        }
        const [primeiro, segundo] = ranking;
        setCandidatos(ranking);
        if (primeiro.score >= 0.84 && (!segundo || primeiro.score - segundo.score >= 0.06)) {
            setBusca(primeiro.produto.sku || primeiro.produto.nome || "");
            setDestaqueId(primeiro.produto.id);
            setAviso(`Parece ${primeiro.produto.nome} (${Math.round(primeiro.score * 100)}% de semelhança). Confira na lista.`);
            return;
        }
        setDestaqueId(null);
        setAviso("Encontrei produtos parecidos com a foto. Escolha o cadastro certo.");
    }

    const atalhos = atalhosCatalogo({
        busca,
        marca: filtros.marca,
        grupo: filtros.grupo,
        localizacao: filtros.localizacao
    });

    async function persistir(dados, editando) {
        const payload = {
            ...editando,
            ...dados,
            preco: Number(dados.preco || 0),
            precoPromocional: Number(dados.precoPromocional || 0),
            descontoPercentual: Number(dados.descontoPercentual || 0),
            custo: Number(dados.custo || 0),
            estoque: Number(dados.estoque || 0),
            tipoCadastro: dados.tipo && dados.tipo !== "contem" ? dados.tipo : (editando?.tipoCadastro || ""),
            componentes: dados.componentes || editando?.componentes || []
        };
        const salvo = editando?.id
            ? await atualizarProduto(editando.id, payload)
            : await salvarProduto(payload);
        let item = normalizar({ ...payload, ...salvo }, "api");
        try {
            for (const arquivo of dados.arquivosFoto || []) {
                await enviarMidiaProduto(item.id, "FOTO", arquivo);
            }
            for (const arquivo of dados.arquivosVideo || []) {
                await enviarMidiaProduto(item.id, "VIDEO", arquivo);
            }
            if (String(dados.urlVideo || "").trim()) {
                await enviarUrlVideo(item.id, dados.urlVideo.trim());
            }
            const canais = dados.canaisPublicar || [];
            const temMidia = (dados.arquivosFoto || []).length
                || (dados.arquivosVideo || []).length
                || String(dados.urlVideo || "").trim()
                || (item.fotos || []).length
                || (item.videos || []).length;
            if (canais.length && temMidia) {
                await publicarAnunciosProduto(item.id, canais);
            }
            if (item.id) {
                item = normalizar(await buscarProduto(item.id), "api");
            }
        } catch (erro) {
            setAviso(erro?.response?.data?.mensagem || erro.message || "Não foi possível enviar a mídia aos marketplaces.");
        }
        setProdutos((atual) => {
            const idx = atual.findIndex((p) => String(p.id) === String(item.id));
            if (idx >= 0) {
                return atual.map((p, i) => (i === idx ? item : p));
            }
            return [item, ...atual];
        });
    }

    async function remover(produto) {
        if (!window.confirm(`Excluir o produto "${produto.nome}"?`)) {
            return;
        }
        await excluirProduto(produto.id);
        setProdutos((atual) => atual.filter((p) => String(p.id) !== String(produto.id)));
        setMenuLinha(null);
        setMarcados((atual) => atual.filter((id) => id !== produto.id));
    }

    async function excluirLote() {
        if (!marcados.length) {
            return;
        }
        if (!window.confirm(`Excluir ${marcados.length} produto(s)?`)) {
            return;
        }
        const alvos = produtos.filter((p) => marcados.includes(p.id));
        await Promise.all(alvos.map((p) => excluirProduto(p.id).catch(() => null)));
        setProdutos((atual) => atual.filter((p) => !marcados.includes(p.id)));
        setMarcados([]);
        setAberto(null);
    }

    if (loading) {
        return (
            <div className="produtos-loading">
                <div className="produtos-spinner" />
                <span>Carregando produtos...</span>
            </div>
        );
    }

    function campoColuna(id) {
        if (id === "descricao") {
            return "nome";
        }
        if (id === "estoqueFisico" || id === "estoqueDisponivel") {
            return "estoque";
        }
        if (id === "situacao") {
            return "ativo";
        }
        if (id === "desconto") {
            return "descontoPercentual";
        }
        return id;
    }

    return (
        <div className="prd-page has-pager" ref={raiz}>
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <span>Cadastros</span>
                <span>›</span>
                <span>Produtos</span>
            </nav>

            <div className="fer-head">
                <div>
                    <h2>Produtos</h2>
                    <p className="prd-sub">Catálogo ligado a estoque, vendas, compras, localização e loja. Leia o código pela câmera ou reconheça o item pela foto.</p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="ctt-acoes">
                    <button type="button" className="prd-btn" onClick={() => navigate(ROTAS.INTEGRACOES)}>
                        <Download size={16} />
                        Receber do e-commerce
                    </button>
                    <button type="button" className="prd-btn prd-btn-primary" onClick={() => setModal({})}>
                        <Plus size={16} />
                        Incluir produto
                    </button>
                    <div className="ctt-drop">
                        <button
                            type="button"
                            className={`prd-btn${aberto === "mais" ? " is-on" : ""}`}
                            onClick={() => setAberto(aberto === "mais" ? null : "mais")}
                        >
                            Mais ações
                            <ChevronDown size={14} />
                        </button>
                        {aberto === "mais" ? (
                            <div className="ctt-menu">
                                <button type="button" onClick={() => { exportarCsv(visiveis); setAberto(null); }}>
                                    exportar produtos para planilha
                                </button>
                                <button type="button" disabled={importando} onClick={() => { xlsRef.current?.click(); setAberto(null); }}>
                                    {importando ? "importando planilha…" : "importar planilha Tiny (.xls)"}
                                </button>
                                <button type="button" disabled={importando} onClick={() => { setImportadorMassa(true); setAberto(null); }}>
                                    importar em massa (vários Excel / XML)
                                </button>
                                <button type="button" disabled={importando} onClick={() => { kitsRef.current?.click(); setAberto(null); }}>
                                    {importando ? "importando composição…" : "importar composição de kits/fabricados (.xls)"}
                                </button>
                                <button type="button" disabled={importando} onClick={() => { xmlRef.current?.click(); setAberto(null); }}>
                                    {importando ? "importando…" : "importar XML NF-e"}
                                </button>
                                <button type="button" onClick={() => { window.print(); setAberto(null); }}>
                                    imprimir
                                </button>
                                <button type="button" onClick={() => {
                                    const alvos = produtos.filter((p) => marcados.includes(p.id));
                                    imprimirEtiquetasGondola(alvos.length ? alvos : visiveis);
                                    setAberto(null);
                                }}>
                                    imprimir etiquetas de gôndola
                                </button>
                                <button type="button" onClick={() => { navigate(ROTAS.PROMOCOES); setAberto(null); }}>
                                    promoções
                                </button>
                                <button type="button" onClick={() => { navigate(ROTAS.REAJUSTE_PRECOS); setAberto(null); }}>
                                    reajuste de preços
                                </button>
                                <button type="button" onClick={() => {
                                    const loc = filtros.localizacao.trim();
                                    navigate(loc ? `${ROTAS.LOCALIZACOES}?localizacao=${encodeURIComponent(loc)}` : ROTAS.LOCALIZACOES);
                                    setAberto(null);
                                }}>
                                    mapa de localizações
                                </button>
                                <button type="button" disabled={!marcados.length} onClick={excluirLote}>
                                    excluir selecionados
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            <input
                ref={xmlRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                hidden
                onChange={(e) => importarXml(e.target.files?.[0])}
            />
            <input
                ref={xlsRef}
                type="file"
                accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                hidden
                onChange={(e) => importarExcel(e.target.files?.[0])}
            />
            <input
                ref={kitsRef}
                type="file"
                accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                hidden
                onChange={(e) => importarKits(e.target.files?.[0])}
            />

            <div className="fer-filtros prd-filtros">
                <label className="fer-search">
                    <Search size={15} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key !== "Enter") {
                                return;
                            }
                            const texto = busca.trim();
                            const achados = acharPorCodigo(produtos, texto);
                            const digitos = texto.replace(/\D/g, "");
                            if (achados.length || digitos.length >= 8) {
                                e.preventDefault();
                                aplicarCodigo(texto);
                            }
                        }}
                        placeholder="SKU, nome, GTIN, localização ou leitor USB"
                        inputMode="search"
                    />
                    <button type="button" className="prd-limpar" onClick={() => setBusca("")} aria-label="Limpar busca">
                        <X size={14} />
                    </button>
                </label>
                <div className="prd-scan-acoes">
                    <button type="button" className="prd-btn" onClick={() => setLeitor("codigo")}>
                        <ScanLine size={16} />
                        Ler código
                    </button>
                    <button type="button" className="prd-btn" onClick={() => setLeitor("foto")}>
                        <Camera size={16} />
                        Reconhecer foto
                    </button>
                </div>

                <div className="ctt-drop">
                    <button
                        type="button"
                        className="fer-chip"
                        onClick={() => setAberto(aberto === "ordem" ? null : "ordem")}
                    >
                        Nome
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "ordem" ? (
                        <div className="ctt-menu">
                            {[["nome", "Nome"], ["sku", "Código (SKU)"], ["preco", "Preço"], ["estoque", "Estoque"]].map(([id, nome]) => (
                                <button
                                    key={id}
                                    type="button"
                                    className={ordem === id ? "is-sel" : ""}
                                    onClick={() => { setOrdem(id); setDir("asc"); setAberto(null); }}
                                >
                                    {nome}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="ctt-drop">
                    <button
                        type="button"
                        className={`fer-chip${soAtivos ? " is-active" : ""}`}
                        onClick={() => setAberto(aberto === "sit" ? null : "sit")}
                    >
                        {soAtivos ? "Produtos ativos" : "Todos os produtos"}
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "sit" ? (
                        <div className="ctt-menu">
                            <button type="button" className={soAtivos ? "is-sel" : ""} onClick={() => { setSoAtivos(true); setAberto(null); }}>
                                Produtos ativos
                            </button>
                            <button type="button" className={!soAtivos ? "is-sel" : ""} onClick={() => { setSoAtivos(false); setAberto(null); }}>
                                Todos os produtos
                            </button>
                        </div>
                    ) : null}
                </div>

                <div className="ctt-drop">
                    <button
                        type="button"
                        className={`fer-chip${filtros.grupo ? " is-active" : ""}`}
                        onClick={() => setAberto(aberto === "cat" ? null : "cat")}
                    >
                        {filtros.grupo || "Todas as categorias"}
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "cat" ? (
                        <div className="ctt-menu is-row">
                            <button type="button" className={!filtros.grupo ? "is-sel" : ""} onClick={() => { setFiltros((a) => ({ ...a, grupo: "" })); setAberto(null); }}>
                                Todas as categorias
                            </button>
                            {grupos.map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    className={filtros.grupo === g ? "is-sel" : ""}
                                    onClick={() => { setFiltros((a) => ({ ...a, grupo: g })); setAberto(null); }}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="ctt-drop">
                    <button
                        type="button"
                        className={`fer-chip${filtros.marca || filtros.localizacao ? " is-active" : ""}`}
                        onClick={() => {
                            setRascunho(filtros);
                            setAberto(aberto === "filtros" ? null : "filtros");
                        }}
                    >
                        <Filter size={14} />
                        Filtros
                    </button>
                    {aberto === "filtros" ? (
                        <div className="ctt-menu ctt-menu-form">
                            <strong>Filtros</strong>
                            <label>
                                Marca
                                <input
                                    value={rascunho.marca}
                                    placeholder="Qualquer marca"
                                    onChange={(e) => setRascunho((a) => ({ ...a, marca: e.target.value }))}
                                />
                            </label>
                            <label>
                                Localização
                                <input
                                    value={rascunho.localizacao}
                                    placeholder="Qualquer localização"
                                    onChange={(e) => setRascunho((a) => ({ ...a, localizacao: e.target.value }))}
                                />
                            </label>
                            <div className="ctt-menu-acoes">
                                <button type="button" className="prd-btn prd-btn-primary" onClick={() => { setFiltros(rascunho); setAberto(null); }}>
                                    aplicar
                                </button>
                                <button type="button" className="prd-btn" onClick={() => setAberto(null)}>
                                    cancelar
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                <button type="button" className="idx-text" onClick={limparFiltros} disabled={!temFiltro}>
                    Limpar filtros
                </button>
            </div>

            <nav className="prd-atalhos" aria-label="Ligações do cadastro">
                {atalhos.map((atalho) => (
                    <Link key={atalho.id} to={atalho.to}>{atalho.label}</Link>
                ))}
            </nav>

            {candidatos.length ? (
                <div className="prd-candidatos">
                    <div>
                        <strong>Produtos reconhecidos</strong>
                        <button type="button" onClick={() => setCandidatos([])} aria-label="Fechar sugestões">
                            <X size={14} />
                        </button>
                    </div>
                    <ul>
                        {candidatos.map(({ produto, score }) => {
                            const foto = visualProduto(produto);
                            return (
                                <li key={produto.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModal(produto);
                                            setDestaqueId(produto.id);
                                            setBusca(produto.sku || produto.gtin || produto.nome || "");
                                        }}
                                    >
                                        <span className="prd-foto" style={{ background: foto.bg }}>
                                            {foto.img ? <img src={foto.img} alt="" /> : foto.emoji}
                                        </span>
                                        <span>
                                            <strong>{produto.nome || "Sem nome"}</strong>
                                            <small>
                                                {[produto.sku, produto.gtin].filter(Boolean).join(" · ") || "sem código"}
                                                {score < 1 ? ` · ${Math.round(score * 100)}%` : ""}
                                            </small>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null}

            <BuscaLocalizacao
                produtos={produtos}
                localizacao={filtros.localizacao}
                onLocalizacao={(valor) => {
                    setFiltros((a) => ({ ...a, localizacao: valor }));
                    setRascunho((a) => ({ ...a, localizacao: valor }));
                }}
                filtroEstoque={filtroEstoque}
                onFiltroEstoque={setFiltroEstoque}
            />
            <label className="os-check" style={{ display: "inline-flex", gap: 8, margin: "0 0 12px", alignItems: "center" }}>
                <input type="checkbox" checked={soPromocao} onChange={(e) => setSoPromocao(e.target.checked)} />
                Só produtos em promoção
            </label>
            {filtros.localizacao.trim() ? (
                <div className="loc-acoes">
                    <button
                        type="button"
                        className="prd-btn"
                        onClick={() => imprimirProdutosLocalizacao(visiveis, filtros.localizacao)}
                    >
                        <Printer size={15} />
                        imprimir produtos desta localização
                    </button>
                    <button
                        type="button"
                        className="prd-btn"
                        onClick={() => imprimirEtiquetasGondola(visiveis)}
                    >
                        <Printer size={15} />
                        etiquetas de gôndola desta localização
                    </button>
                    <Link className="prd-btn" to={`${ROTAS.INVENTARIO}?localizacao=${encodeURIComponent(filtros.localizacao.trim())}`}>
                        contar no inventário
                    </Link>
                    <Link className="prd-btn" to={`${ROTAS.LOCALIZACOES}?localizacao=${encodeURIComponent(filtros.localizacao.trim())}`}>
                        ver no mapa de prateleiras
                    </Link>
                </div>
            ) : null}

            <div className="prd-cards">
                {TIPOS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        className={`prd-card${tipo === t.id ? " is-active" : ""}${t.id === "contem" ? " is-contem" : ""}`}
                        onClick={() => setTipo(t.id)}
                    >
                        <span>{t.label}</span>
                        <strong>{(contagens[t.id] || 0).toLocaleString("pt-BR")}</strong>
                    </button>
                ))}
            </div>

            {tipo === "contem" ? (
                <p className="prd-uso-banner">
                    {busca.trim()
                        ? (visiveis.length
                            ? textoResumoUsos(visiveis.map((p) => ({ tipo: p.usoTipo || p.tipo })), busca.trim())
                            : "Nenhum kit ou produto fabricado usa esse SKU na composição.")
                        : "Pesquise um produto ou SKU para ver onde ele é utilizado — kits e fabricados que o incluem."}
                </p>
            ) : null}

            <div className="prd-scroll">
                <table className="fer-table prd-table">
                    <thead>
                        <tr>
                            <th className="ctt-check">
                                <input
                                    type="checkbox"
                                    checked={fatia.length > 0 && fatia.every((p) => marcados.includes(p.id))}
                                    onChange={marcarPagina}
                                    aria-label="Selecionar página"
                                />
                            </th>
                            {COLUNAS.filter((c) => visivel(c.id)).map((c) => {
                                const campo = campoColuna(c.id);
                                const ativa = ordem === campo;
                                return (
                                    <th key={c.id} className={COLUNAS_NUMERICAS.has(c.id) || c.id === "preco" || c.id === "custo" ? "is-num" : ""}>
                                        <button type="button" onClick={() => ordenar(campo)}>
                                            {c.label}
                                            <span className={ativa ? "is-on" : ""}>{ativa && dir === "desc" ? "▾" : "▴"}</span>
                                        </button>
                                    </th>
                                );
                            })}
                            <th className="prd-th-acoes">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fatia.length === 0 ? (
                            <tr>
                                <td colSpan={2 + colunas.length} className="ctt-vazio">
                                    {tipo === "contem" && !busca.trim()
                                        ? "Digite um SKU ou nome na busca para listar kits e produtos fabricados que o utilizam."
                                        : tipo === "contem"
                                            ? "Nenhum kit ou fabricado contém esse item. Importe a composição em mais ações ou informe os componentes no cadastro."
                                            : "Nenhum produto encontrado. Tente limpar os filtros ou incluir um novo produto."}
                                </td>
                            </tr>
                        ) : fatia.map((produto) => {
                            const foto = visualProduto(produto);
                            return (
                                <tr key={produto.id} className={`${marcados.includes(produto.id) ? "is-sel" : ""} ${String(destaqueId) === String(produto.id) ? "is-hit" : ""}`.trim()}>
                                    <td className="ctt-check">
                                        <input
                                            type="checkbox"
                                            checked={marcados.includes(produto.id)}
                                            onChange={() => toggleMarca(produto.id)}
                                        />
                                    </td>
                                    {visivel("descricao") ? (
                                        <td>
                                            <button type="button" className="prd-nome" onClick={() => setModal(produto)}>
                                                <span className="prd-foto" style={{ background: foto.bg }} aria-hidden>
                                                    {foto.img ? <img src={foto.img} alt="" /> : foto.emoji}
                                                </span>
                                                <span>
                                                    <strong className="prd-desc">{produto.nome || "Sem nome"}</strong>
                                                    <small className="prd-cat">{produto.grupo || produto.categoria || "Sem categoria"}</small>
                                                    {(produto.videos || []).length ? <small className="prd-video-dot">vídeo no anúncio</small> : null}
                                                    {tipo === "contem" ? (
                                                        <small className="prd-contem">
                                                            {rotuloContem(produto, busca)}
                                                        </small>
                                                    ) : null}
                                                </span>
                                            </button>
                                        </td>
                                    ) : null}
                                    {visivel("sku") ? <td>{dash(produto.sku)}</td> : null}
                                    {visivel("gtin") ? <td className="prd-mono">{dash(produto.gtin)}</td> : null}
                                    {visivel("unidade") ? <td>{dash(produto.unidade)}</td> : null}
                                    {visivel("ncm") ? <td>{ncmFmt(produto.ncm)}</td> : null}
                                    {visivel("preco") ? (
                                        <td className="is-num">
                                            {emPromocao(produto) ? <span className="prd-preco-de">{moeda(produto.preco)}</span> : null}
                                            {moeda(emPromocao(produto) ? produto.precoPromocional : produto.preco)}
                                            {emPromocao(produto) ? <span className="prd-off">{produto.descontoPercentual}% OFF</span> : null}
                                        </td>
                                    ) : null}
                                    {visivel("precoPromocional") ? <td className="is-num">{emPromocao(produto) ? moeda(produto.precoPromocional) : "—"}</td> : null}
                                    {visivel("desconto") ? <td className="is-num">{emPromocao(produto) ? `${produto.descontoPercentual}%` : "—"}</td> : null}
                                    {visivel("custo") ? <td className="is-num">{moeda(produto.custo)}</td> : null}
                                    {visivel("marca") ? (
                                        <td>
                                            {produto.marca ? (
                                                <Link className="prd-link" to={`/marcas?q=${encodeURIComponent(produto.marca)}#list`}>{produto.marca}</Link>
                                            ) : "-"}
                                        </td>
                                    ) : null}
                                    {visivel("localizacao") ? (
                                        <td>
                                            {produto.localizacao ? (
                                                <Link className="prd-link" to={`${ROTAS.LOCALIZACOES}?localizacao=${encodeURIComponent(String(produto.localizacao).split(",")[0].trim())}`}>
                                                    {produto.localizacao}
                                                </Link>
                                            ) : "-"}
                                        </td>
                                    ) : null}
                                    {visivel("estoqueFisico") ? (
                                        <td className="is-num">
                                            <Link className={`prd-est is-${situacaoEstoque(produto)}`} to={`${ROTAS.ESTOQUE}?q=${encodeURIComponent(produto.sku || produto.gtin || produto.nome || "")}`}>
                                                {qtd(produto.estoque)}
                                            </Link>
                                        </td>
                                    ) : null}
                                    {visivel("estoqueDisponivel") ? (
                                        <td className="is-num">
                                            <Link className={`prd-est is-${situacaoEstoque(produto)}`} to={`${ROTAS.ESTOQUE}?q=${encodeURIComponent(produto.sku || produto.gtin || produto.nome || "")}`}>
                                                {qtd(produto.estoqueDisponivel)}
                                            </Link>
                                        </td>
                                    ) : null}
                                    {visivel("situacao") ? (
                                        <td>
                                            <span className={`prd-sit${produto.ativo === false ? " is-off" : ""}`}>
                                                {produto.ativo === false ? "Inativo" : "Ativo"}
                                            </span>
                                        </td>
                                    ) : null}
                                    <td>
                                        <div className="prd-acoes">
                                            <button type="button" title="Editar" onClick={() => setModal(produto)}>
                                                <PenLine size={15} />
                                            </button>
                                            <div className="ctt-row-menu">
                                                <button type="button" title="Mais" onClick={() => setMenuLinha(menuLinha === produto.id ? null : produto.id)}>
                                                    <MoreVertical size={15} />
                                                </button>
                                                {menuLinha === produto.id ? (
                                                    <div className="ctt-menu is-row is-right">
                                                        <button type="button" onClick={() => { setModal(produto); setMenuLinha(null); }}>
                                                            editar
                                                        </button>
                                                        <button type="button" onClick={() => {
                                                            setBusca(produto.sku || produto.nome || "");
                                                            setTipo("contem");
                                                            setMenuLinha(null);
                                                        }}>
                                                            onde é utilizado
                                                        </button>
                                                        <button type="button" onClick={() => {
                                                            imprimirEtiquetasGondola([produto]);
                                                            setMenuLinha(null);
                                                        }}>
                                                            etiqueta de gôndola
                                                        </button>
                                                        {produto.grupo ? (
                                                            <button type="button" onClick={() => {
                                                                setFiltros((atual) => ({ ...atual, grupo: produto.grupo }));
                                                                setMenuLinha(null);
                                                            }}>
                                                                filtrar categoria
                                                            </button>
                                                        ) : null}
                                                        <strong>No sistema</strong>
                                                        {ligacoesProduto(produto).map((ligacao) => (
                                                            <button key={ligacao.id} type="button" onClick={() => { navigate(ligacao.to); setMenuLinha(null); }}>
                                                                {ligacao.label}
                                                            </button>
                                                        ))}
                                                        <button type="button" onClick={() => remover(produto)}>
                                                            excluir
                                                        </button>
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

            {visiveis.length > 0 ? (
                <div className="prd-foot">
                    <span>
                        Mostrando {inicio + 1} a {Math.min(inicio + porPagina, visiveis.length)} de {visiveis.length.toLocaleString("pt-BR")} {tipo === "contem" ? "kits/fabricados" : "produtos"}
                    </span>
                    <div className="prd-foot-nav">
                        <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} aria-label="Página anterior">
                            <ChevronLeft size={16} />
                        </button>
                        {paginasVisiveis(paginaAtual, totalPaginas).map((p, i) => (
                            p === "…" ? (
                                <span key={`e${i}`}>–</span>
                            ) : (
                                <button
                                    key={p}
                                    type="button"
                                    className={p === paginaAtual ? "is-active" : ""}
                                    onClick={() => setPagina(p)}
                                >
                                    {p}
                                </button>
                            )
                        ))}
                        <button type="button" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} aria-label="Próxima página">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <label className="erp-pager-size">
                        <select value={porPagina} onChange={(e) => setPorPagina(Number(e.target.value))} aria-label="Itens por página">
                            {TAMANHOS.map((n) => (
                                <option key={n} value={n}>{n} por página</option>
                            ))}
                        </select>
                    </label>
                </div>
            ) : null}

            {modal ? (
                <ModalProdutoInterno
                    key={modal.id || "novo"}
                    produto={modal.id ? modal : null}
                    catalogo={produtos}
                    abrirProduto={(item) => setModal(item)}
                    fechar={() => setModal(null)}
                    salvar={async (dados) => {
                        await persistir(dados, modal.id ? modal : null);
                        setModal(null);
                    }}
                />
            ) : null}

            <ImportadorMassa
                aberto={importadorMassa}
                ocupado={importando}
                onFechar={() => setImportadorMassa(false)}
                onConcluido={async (mensagem) => {
                    setSoAtivos(false);
                    setAviso(mensagem);
                    await carregarProdutos();
                }}
            />

            {leitor ? (
                <LeitorProduto
                    modoInicial={leitor}
                    produtos={produtos}
                    urlFoto={urlFotoProduto}
                    onFechar={() => setLeitor(null)}
                    onCodigo={aplicarCodigo}
                    onFoto={aplicarFoto}
                />
            ) : null}
        </div>
    );
}

function ModalProdutoInterno({ produto, catalogo = [], abrirProduto, fechar, salvar }) {
    const [form, setForm] = useState({
        nome: produto?.nome || "",
        sku: produto?.sku || "",
        gtin: produto?.gtin || produto?.codigoBarras || "",
        unidade: produto?.unidade || "UN",
        ncm: produto?.ncm || "",
        categoria: produto?.categoria || produto?.grupo || "",
        marca: produto?.marca || "",
        codigoFornecedor: produto?.codigoFornecedor || "",
        preco: produto?.preco ?? "",
        precoPromocional: produto?.precoPromocional ?? "",
        descontoPercentual: produto?.descontoPercentual ?? "",
        custo: produto?.custo ?? "",
        estoque: produto?.estoque ?? 0,
        estoqueMinimo: produto?.estoqueMinimo ?? 0,
        localizacao: produto?.localizacao || "",
        tipo: produto?.tipo && produto.tipo !== "todos" && produto.tipo !== "contem" ? produto.tipo : "simples",
        ativo: produto?.ativo ?? true,
        componentes: componentesDoProduto(produto || {})
    });
    const [salvando, setSalvando] = useState(false);
    const [pendentesFoto, setPendentesFoto] = useState([]);
    const [pendentesVideo, setPendentesVideo] = useState([]);
    const [urlVideo, setUrlVideo] = useState("");
    const [canais, setCanais] = useState(canaisAutoPublicar);
    const [fotos, setFotos] = useState(() => produto?.fotos || parseMidia(produto || {}).fotos);
    const [videos, setVideos] = useState(() => produto?.videos || parseMidia(produto || {}).videos);
    const [anuncios] = useState(() => produto?.anuncios || parseMidia(produto || {}).anuncios);
    const usos = useMemo(
        () => (produto?.id || produto?.sku ? usosDoComponente(catalogo, produto) : []),
        [catalogo, produto]
    );
    const resumo = resumoUsos(usos);
    const estoqueBaixo = Number(form.estoque || 0) <= Number(form.estoqueMinimo || 0);
    const inativo = form.ativo === false;

    function alterar(campo, valor) {
        setForm((atual) => {
            const next = { ...atual, [campo]: valor };
            if (campo === "preco" || campo === "precoPromocional" || campo === "descontoPercentual") {
                const origem = campo === "descontoPercentual" ? "desconto" : campo === "preco" ? "preco" : "promocional";
                const alinhado = alinharPrecos(next, origem);
                next.precoPromocional = alinhado.precoPromocional || "";
                next.descontoPercentual = alinhado.descontoPercentual || "";
            }
            return next;
        });
    }

    async function enviar(e) {
        e.preventDefault();
        if (!form.nome.trim()) {
            alert("Informe o nome do produto.");
            return;
        }
        try {
            setSalvando(true);
            await salvar({
                ...form,
                codigoBarras: form.gtin,
                grupo: form.categoria,
                tipoCadastro: form.tipo,
                produtoProducao: form.tipo === "fabricado",
                componentes: (form.componentes || []).filter((c) => String(c.sku || "").trim()),
                arquivosFoto: pendentesFoto,
                arquivosVideo: pendentesVideo,
                urlVideo,
                canaisPublicar: canais
            });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <div
            className="produto-modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !salvando) {
                    fechar();
                }
            }}
        >
            <form className="produto-modal" onSubmit={enviar}>
                <div className="produto-modal-header">
                    <div>
                        <span>CADASTRO</span>
                        <h2>{produto ? "Editar produto" : "Novo produto"}</h2>
                        <p>
                            {resumo.total
                                ? textoResumoUsos(usos, form.sku || form.nome)
                                : "Informe os dados no padrão do catálogo."}
                        </p>
                    </div>
                    <button type="button" className="modal-fechar" onClick={fechar} disabled={salvando}>
                        ×
                    </button>
                </div>
                <div className="produto-modal-body">
                    {produto?.id ? (
                        <nav className="prd-atalhos prd-atalhos-modal" aria-label="Ligações deste produto">
                            {ligacoesProduto({ ...produto, ...form, grupo: form.categoria, localizacao: form.localizacao }).map((ligacao) => (
                                <Link key={ligacao.id} to={ligacao.to} onClick={fechar}>{ligacao.label}</Link>
                            ))}
                        </nav>
                    ) : null}
                    <div className="campo-grande">
                        <label>Nome / descrição *</label>
                        <input
                            autoFocus
                            value={form.nome}
                            onChange={(e) => alterar("nome", e.target.value)}
                            placeholder="Ex.: ABRIDOR MODELO DE GARRAFA"
                        />
                    </div>
                    <div className="modal-grid">
                        <div>
                            <label>Código (SKU)</label>
                            <input value={form.sku} onChange={(e) => alterar("sku", e.target.value)} />
                        </div>
                        <div>
                            <label>GTIN / EAN</label>
                            <input value={form.gtin} onChange={(e) => alterar("gtin", e.target.value)} />
                        </div>
                        <div>
                            <label>Unidade</label>
                            <input value={form.unidade} onChange={(e) => alterar("unidade", e.target.value)} />
                        </div>
                        <div>
                            <label>NCM</label>
                            <input value={form.ncm} onChange={(e) => alterar("ncm", e.target.value)} placeholder="39269090" />
                        </div>
                        <div>
                            <label>Preço normal</label>
                            <input type="number" step="0.01" value={form.preco} onChange={(e) => alterar("preco", e.target.value)} />
                        </div>
                        <div>
                            <label>Preço promocional</label>
                            <input type="number" step="0.01" value={form.precoPromocional} onChange={(e) => alterar("precoPromocional", e.target.value)} />
                        </div>
                        <div>
                            <label>% de desconto</label>
                            <input type="number" step="0.01" value={form.descontoPercentual} onChange={(e) => alterar("descontoPercentual", e.target.value)} />
                        </div>
                        {rotuloOff(form) ? <p className="prd-promo-preview">{rotuloOff(form)}</p> : null}
                        <div>
                            <label>Custo</label>
                            <input type="number" step="0.00001" value={form.custo} onChange={(e) => alterar("custo", e.target.value)} />
                        </div>
                        <div>
                            <label>Marca</label>
                            <input value={form.marca} onChange={(e) => alterar("marca", e.target.value)} />
                        </div>
                        <div>
                            <label>Cód. fornecedor</label>
                            <input value={form.codigoFornecedor} onChange={(e) => alterar("codigoFornecedor", e.target.value)} />
                        </div>
                        <div>
                            <label>Estoque físico</label>
                            <input type="number" step="0.0001" value={form.estoque} onChange={(e) => alterar("estoque", e.target.value)} />
                        </div>
                        <div>
                            <label>Estoque mínimo</label>
                            <input type="number" step="0.0001" value={form.estoqueMinimo} onChange={(e) => alterar("estoqueMinimo", e.target.value)} />
                        </div>
                        <div>
                            <label>Localização</label>
                            <input
                                value={form.localizacao}
                                onChange={(e) => alterar("localizacao", e.target.value)}
                                placeholder="PT-150, CX-12"
                                list="prd-locs"
                            />
                            <small className="prd-sub">Várias localizações: separe por vírgula (prateleira, caixa, corredor).</small>
                        </div>
                        <div>
                            <label>Tipo</label>
                            <select value={form.tipo} onChange={(e) => alterar("tipo", e.target.value)}>
                                {TIPOS_CADASTRO.map((t) => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Grupo / categoria</label>
                            <input value={form.categoria} onChange={(e) => alterar("categoria", e.target.value)} />
                        </div>
                    </div>
                    <label className="produto-ativo">
                        <input
                            type="checkbox"
                            checked={Boolean(form.ativo)}
                            onChange={(e) => alterar("ativo", e.target.checked)}
                        />
                        <span>Produto ativo</span>
                    </label>
                    <MidiaProduto
                        fotos={fotos}
                        videos={videos}
                        anuncios={anuncios}
                        pendentesFoto={pendentesFoto}
                        pendentesVideo={pendentesVideo}
                        canais={canais}
                        urlVideo={urlVideo}
                        onUrlVideo={setUrlVideo}
                        onFotos={setPendentesFoto}
                        onVideos={setPendentesVideo}
                        onCanais={setCanais}
                        onRemoverSalvo={async (item) => {
                            if (!produto?.id || !item.id) {
                                return;
                            }
                            await excluirMidiaProduto(produto.id, item.id);
                            setFotos((atual) => atual.filter((f) => f.id !== item.id));
                            setVideos((atual) => atual.filter((v) => v.id !== item.id));
                        }}
                    />
                    {resumo.total ? (
                        <div className="prd-kit-box prd-uso-box">
                            <strong>Onde este produto é utilizado</strong>
                            <p>
                                {textoResumoUsos(usos, form.sku || "este item")}.
                                {inativo ? " O produto está inativo: esses kits/fabricados ficam afetados." : ""}
                                {estoqueBaixo && !inativo ? " Estoque baixo ou zerado: verifique os kits e fabricados abaixo antes de substituir ou encerrar o item." : ""}
                            </p>
                            <ul className="prd-uso-lista">
                                {usos.map((uso) => (
                                    <li key={uso.produto.id || uso.produto.sku}>
                                        <button type="button" onClick={() => abrirProduto?.(uso.produto)}>
                                            <span className="prd-uso-tipo">{rotuloTipoUso(uso.tipo)}</span>
                                            <strong>{uso.produto.nome || uso.produto.sku}</strong>
                                            <small>
                                                {uso.produto.sku || "sem SKU"}
                                                {uso.quantidade ? ` · qtd ${uso.quantidade}` : ""}
                                                {uso.produto.ativo === false ? " · inativo" : ""}
                                            </small>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : produto?.id ? (
                        <p className="prd-uso-vazio">Este produto não aparece na composição de kits ou fabricados.</p>
                    ) : null}
                    {form.tipo === "kits" || form.tipo === "fabricado" ? (
                        <div className="prd-kit-box">
                            <strong>{form.tipo === "fabricado" ? "Composição do fabricado" : "Composição do kit"}</strong>
                            <p>Informe os SKUs da composição. A aba Contém usa essa lista para responder “onde este produto é utilizado?”.</p>
                            {(form.componentes || []).map((item, i) => (
                                <div key={`${item.sku}-${i}`} className="prd-kit-linha">
                                    <input
                                        placeholder="SKU componente"
                                        value={item.sku}
                                        onChange={(e) => {
                                            const next = [...form.componentes];
                                            next[i] = { ...next[i], sku: e.target.value };
                                            alterar("componentes", next);
                                        }}
                                    />
                                    <input
                                        type="number"
                                        min="0.0001"
                                        step="0.0001"
                                        value={item.quantidade}
                                        onChange={(e) => {
                                            const next = [...form.componentes];
                                            next[i] = { ...next[i], quantidade: e.target.value };
                                            alterar("componentes", next);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="prd-btn"
                                        onClick={() => alterar("componentes", form.componentes.filter((_, idx) => idx !== i))}
                                    >
                                        remover
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="prd-btn"
                                onClick={() => alterar("componentes", [...(form.componentes || []), { sku: "", quantidade: 1 }])}
                            >
                                adicionar componente
                            </button>
                        </div>
                    ) : null}
                    {produto?.id ? (
                        <>
                            <h3 className="aud-titulo">Histórico de alterações</h3>
                            <p className="aud-hint">Quem cadastrou e cada mudança neste produto, com usuário, data e hora.</p>
                            <HistoricoAuditoria entidade="PRODUTO" registroId={produto.id} />
                        </>
                    ) : (
                        <p className="aud-hint">O histórico de quem cadastrou e alterou aparece depois de salvar o produto.</p>
                    )}
                </div>
                <div className="produto-modal-footer">
                    <button type="button" className="btn-secundario" onClick={fechar} disabled={salvando}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary" disabled={salvando}>
                        {salvando ? "Salvando..." : produto ? "Salvar alterações" : "Cadastrar produto"}
                    </button>
                </div>
            </form>
        </div>
    );
}
