import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
    MoreVertical,
    Percent,
    Printer,
    Search,
    ShoppingBag,
    Store,
    Tags,
    Trash2,
    TrendingUp
} from "lucide-react";

import { avisarPrecosAtualizados, emPromocao, moedaPreco, ouvirPrecos, pctOff, rotuloOff, simularReajuste } from "../../constants/precoPromocional";
import { upsertProdutoLoja } from "../../constants/catalogoLoja";
import ROTAS from "../../constants/rotas";
import { imprimirEtiquetasGondola } from "../../services/etiquetaGondola";
import { lerPlanilhaProdutos } from "../../services/produtoImport.service";
import { urlMidia } from "../../services/produtoMidia.service";
import { aplicarPromocao, importarProdutosLote, listarProdutos, reajustarPrecos } from "../../services/produto.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/os.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/promocoes.css";
import "../../styles/theme/pager.css";

const ABAS = [
    { id: "promocao", label: "Promoções" },
    { id: "reajuste", label: "Reajuste de preços" },
    { id: "etiquetas", label: "Etiquetas de gôndola" }
];

const POR_PAGINA = 10;
const PRESETS = ["10", "20", "30", "50"];
const PRESETS_REAJUSTE = ["-10", "-5", "5", "10", "15", "20"];

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

function pctEfetivo(produto) {
    if (!emPromocao(produto)) {
        return 0;
    }
    const informado = Number(produto.descontoPercentual);
    if (informado > 0) {
        return informado;
    }
    return pctOff(produto.preco, produto.precoPromocional);
}

function textoPct(produto) {
    const pct = pctEfetivo(produto);
    return `${pct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

function numeroFlex(valor) {
    const n = Number(String(valor ?? "").trim().replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
}

function textoDelta(valor) {
    const n = Number(valor) || 0;
    if (n > 0) {
        return `+${moedaPreco(n)}`;
    }
    return moedaPreco(n);
}

function textoMargem(atual, nova) {
    const fmt = (v) => (v == null ? "—" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);
    if (atual == null && nova == null) {
        return "sem custo";
    }
    return `${fmt(atual)} → ${fmt(nova)}`;
}

function baixarCsv(nome, linhas) {
    const blob = new Blob([`\uFEFF${linhas.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
}

function mensagemApi(erro, fallback) {
    return erro?.response?.data?.mensagem || fallback;
}

function visualProduto(produto) {
    const capa = produto.imagem || produto.fotos?.[0]?.url;
    if (capa) {
        return { img: urlMidia(capa), emoji: "" };
    }
    const t = `${produto.nome || ""} ${produto.grupo || produto.categoria || ""}`.toUpperCase();
    if (/CANETA|LAPI|CADERN|AGENDA|PAPEL|GIZ/.test(t)) return { emoji: "✏️" };
    if (/BRINQ|BLOCO|BARRACA|BONECA|JOGO/.test(t)) return { emoji: "🧸" };
    if (/CHAVEIRO|CORD/.test(t)) return { emoji: "🔑" };
    if (/CANECA|COPO/.test(t)) return { emoji: "☕" };
    return { emoji: "📦" };
}

function exportarCsv(lista) {
    const linhas = [["Produto", "SKU", "Preço normal", "Preço promocional", "% OFF", "Etiqueta"].join(";")];
    lista.forEach((p) => {
        linhas.push([
            p.nome,
            p.sku,
            p.preco,
            emPromocao(p) ? p.precoPromocional : "",
            pctEfetivo(p),
            rotuloOff(p) || "Preço normal"
        ].map((v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`).join(";"));
    });
    baixarCsv("promocoes.csv", linhas);
}

function exportarReajuste(lista, percentual, opcoes) {
    const linhas = [["Produto", "SKU", "Custo", "Venda atual", "Venda nova", "Atacado atual", "Atacado novo", "Promoção nova", "Margem nova %", "Estoque"].join(";")];
    lista.forEach((p) => {
        const sim = simularReajuste(p, percentual, opcoes);
        linhas.push([
            p.nome,
            p.sku,
            sim.custo,
            sim.precoAtual,
            sim.preco,
            sim.precoAtacadoAtual || "",
            sim.precoAtacado || "",
            sim.precoPromocional || "",
            sim.margemNova ?? "",
            p.estoque
        ].map((v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`).join(";"));
    });
    baixarCsv("reajuste-precos.csv", linhas);
}

export default function Promocoes() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [params] = useSearchParams();
    const arquivoRef = useRef(null);
    const aba = pathname.includes("reajuste")
        ? "reajuste"
        : (ABAS.some((a) => a.id === params.get("aba")) ? params.get("aba") : "promocao");
    const [lista, setLista] = useState([]);
    const [busca, setBusca] = useState(() => params.get("q") || "");

    useEffect(() => {
        const q = params.get("q");
        if (q) {
            setBusca(q);
        }
    }, [params]);
    const [categoria, setCategoria] = useState("");
    const [marca, setMarca] = useState("");
    const [soPromocao, setSoPromocao] = useState(false);
    const [soAtivos, setSoAtivos] = useState(true);
    const [rascunho, setRascunho] = useState({ marca: "", soPromocao: false, soAtivos: true });
    const [marcados, setMarcados] = useState([]);
    const [aviso, setAviso] = useState("");
    const [ocupado, setOcupado] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [desconto, setDesconto] = useState("50");
    const [precoPromo, setPrecoPromo] = useState("");
    const [reajuste, setReajuste] = useState("10");
    const [reajVenda, setReajVenda] = useState(true);
    const [reajAtacado, setReajAtacado] = useState(true);
    const [ordem, setOrdem] = useState("nome");
    const [dir, setDir] = useState("asc");
    const [pagina, setPagina] = useState(1);
    const [aberto, setAberto] = useState(null);
    const [menuLinha, setMenuLinha] = useState(null);

    async function carregar() {
        const dados = await listarProdutos();
        const listaNova = Array.isArray(dados) ? dados : [];
        setLista(listaNova);
        return listaNova;
    }

    function publicar(ids, listaNova) {
        const alvo = new Set((ids || []).map(String));
        (listaNova || []).filter((p) => alvo.has(String(p.id))).forEach((p) => upsertProdutoLoja(p));
        avisarPrecosAtualizados({ ids: [...alvo] });
    }

    useEffect(() => {
        let vivo = true;
        carregar()
            .catch(() => {
                if (vivo) {
                    setLista([]);
                    setAviso("Não foi possível ler os produtos.");
                }
            })
            .finally(() => {
                if (vivo) {
                    setCarregando(false);
                }
            });
        const parar = ouvirPrecos(() => {
            carregar().catch(() => {});
        });
        return () => {
            vivo = false;
            parar();
        };
    }, []);

    useEffect(() => {
        function fechar(evento) {
            if (evento.target.closest(".ctt-drop, .ctt-row-menu")) {
                return;
            }
            setAberto(null);
            setMenuLinha(null);
        }
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, []);

    const categorias = useMemo(() => {
        const nomes = new Set();
        lista.forEach((p) => {
            const nome = String(p.grupo || p.categoria || "").trim();
            if (nome) nomes.add(nome);
        });
        return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [lista]);

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const marcaTermo = marca.trim().toLowerCase();
        const itens = lista.filter((p) => {
            if (termo && ![p.nome, p.sku, p.gtin, p.grupo, p.categoria].join(" ").toLowerCase().includes(termo)) {
                return false;
            }
            if (categoria && String(p.grupo || p.categoria || "") !== categoria) {
                return false;
            }
            if (marcaTermo && !String(p.marca || "").toLowerCase().includes(marcaTermo)) {
                return false;
            }
            if (soPromocao && !emPromocao(p)) {
                return false;
            }
            if (soAtivos && p.ativo === false) {
                return false;
            }
            return true;
        });
        const fator = dir === "desc" ? -1 : 1;
        const valor = (p) => {
            if (ordem === "pct") return pctEfetivo(p);
            if (ordem === "nome" || ordem === "sku") return String(p[ordem] || "");
            const n = Number(p[ordem]);
            return Number.isFinite(n) ? n : 0;
        };
        itens.sort((a, b) => {
            const va = valor(a);
            const vb = valor(b);
            if (typeof va === "string" || typeof vb === "string") {
                return String(va).localeCompare(String(vb), "pt-BR", { numeric: true }) * fator;
            }
            return (va - vb) * fator;
        });
        return itens;
    }, [lista, busca, categoria, marca, soPromocao, soAtivos, ordem, dir]);

    useEffect(() => {
        setPagina(1);
    }, [busca, categoria, marca, soPromocao, soAtivos, aba]);

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const inicio = (paginaAtual - 1) * POR_PAGINA;
    const fatia = filtrados.slice(inicio, inicio + POR_PAGINA);
    const selecionados = lista.filter((p) => marcados.includes(p.id));
    const temFiltro = Boolean(busca.trim() || categoria || marca.trim() || soPromocao || !soAtivos);
    const paginaMarcada = fatia.length > 0 && fatia.every((p) => marcados.includes(p.id));
    const todosMarcados = filtrados.length > 0 && filtrados.every((p) => marcados.includes(p.id));

    function escolherAba(id) {
        if (id === "reajuste") {
            navigate("/produtos/reajuste", { replace: true });
        } else if (id === "etiquetas") {
            navigate("/promocoes?aba=etiquetas", { replace: true });
        } else {
            navigate("/promocoes", { replace: true });
        }
        setAviso("");
        setAberto(null);
    }

    function toggle(id) {
        setMarcados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
    }

    function marcarPagina(ligado) {
        const ids = fatia.map((p) => p.id);
        setMarcados((atual) => (ligado
            ? [...new Set([...atual, ...ids])]
            : atual.filter((id) => !ids.includes(id))));
    }

    function marcarFiltrados(ligado) {
        const ids = filtrados.map((p) => p.id);
        setMarcados((atual) => (ligado
            ? [...new Set([...atual, ...ids])]
            : atual.filter((id) => !ids.includes(id))));
    }

    function ordenar(campo) {
        if (ordem === campo) {
            setDir((atual) => (atual === "asc" ? "desc" : "asc"));
        } else {
            setOrdem(campo);
            setDir("asc");
        }
    }

    function limparFiltros() {
        setBusca("");
        setCategoria("");
        setMarca("");
        setSoPromocao(false);
        setSoAtivos(true);
        setRascunho({ marca: "", soPromocao: false, soAtivos: true });
        setAberto(null);
    }

    function corpoPromocao() {
        return precoPromo
            ? { precoPromocional: Number(String(precoPromo).replace(",", ".")) }
            : { descontoPercentual: Number(String(desconto).replace(",", ".")) };
    }

    async function aplicarPromo(ids = marcados) {
        if (!ids.length) {
            setAviso("Selecione produtos.");
            return;
        }
        setOcupado(true);
        try {
            await aplicarPromocao(ids, corpoPromocao());
            const nova = await carregar();
            publicar(ids, nova);
            setAviso(`Promoção aplicada em ${ids.length} produto(s). O PDV, a loja e a ordem de serviço passam a usar esse preço.`);
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível aplicar a promoção.");
        } finally {
            setOcupado(false);
            setMenuLinha(null);
        }
    }

    async function limparPromo(ids = marcados) {
        if (!ids.length) {
            setAviso("Selecione produtos.");
            return;
        }
        setOcupado(true);
        try {
            await aplicarPromocao(ids, { limparPromocao: true });
            const nova = await carregar();
            publicar(ids, nova);
            setAviso("Promoção removida. O preço normal voltou a valer no PDV, na loja e na ordem de serviço.");
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível remover a promoção.");
        } finally {
            setOcupado(false);
            setMenuLinha(null);
        }
    }

    async function aplicarReajuste(ids = marcados) {
        const alvos = (ids || []).filter((id) => id != null);
        if (!alvos.length) {
            setAviso("Selecione produtos ou use “selecionar filtrados”.");
            return;
        }
        if (!reajVenda && !reajAtacado) {
            setAviso("Marque o preço de venda ou o preço de atacado.");
            return;
        }
        const pct = numeroFlex(reajuste);
        if (!Number.isFinite(pct) || pct === 0) {
            setAviso("Informe um percentual diferente de zero.");
            return;
        }
        if (pct <= -100) {
            setAviso("O reajuste precisa ser maior que -100%.");
            return;
        }
        const escopo = [reajVenda ? "preço de venda" : "", reajAtacado ? "preço de atacado" : ""].filter(Boolean).join(" e de ");
        const sinal = pct > 0 ? "+" : "";
        const confirmar = window.confirm(
            `Aplicar ${sinal}${pct.toLocaleString("pt-BR")}% no ${escopo} de ${alvos.length} produto(s)? O cadastro, o PDV, a loja, os pedidos novos e a ordem de serviço passam a usar esse preço.`
        );
        if (!confirmar) {
            return;
        }
        setOcupado(true);
        try {
            const resumo = await reajustarPrecos(alvos, pct, { reajustarVenda: reajVenda, reajustarAtacado: reajAtacado });
            const nova = await carregar();
            publicar(alvos, nova);
            const gravados = Number(resumo?.ok ?? alvos.length);
            setAviso(`Reajuste de ${sinal}${pct.toLocaleString("pt-BR")}% gravado em ${gravados} produto(s). O % OFF permanece e o preço promocional foi recalculado. PDV, loja, pedidos novos e OS já leem esse preço.`);
        } catch (erro) {
            console.error(erro);
            setAviso(mensagemApi(erro, "Não foi possível reajustar os preços."));
        } finally {
            setOcupado(false);
            setMenuLinha(null);
        }
    }

    function imprimir(alvos) {
        const listaAlvo = alvos?.length ? alvos : (selecionados.length ? selecionados : filtrados);
        if (!listaAlvo.length) {
            setAviso("Selecione produtos ou filtre a lista.");
            return;
        }
        imprimirEtiquetasGondola(listaAlvo);
        setAberto(null);
        setMenuLinha(null);
    }

    async function importarArquivo(arquivo) {
        if (!arquivo) {
            return;
        }
        setOcupado(true);
        try {
            const lido = await lerPlanilhaProdutos(arquivo);
            const itens = Array.isArray(lido) ? lido : (lido.itens || []);
            if (!itens.length) {
                setAviso("A planilha não tem produtos com descrição.");
                return;
            }
            const resumo = await importarProdutosLote(itens);
            const nova = await carregar();
            const chaves = new Set(itens.map((item) => String(item.sku || "").toLowerCase()).filter(Boolean));
            const ids = nova.filter((p) => chaves.has(String(p.sku || "").toLowerCase())).map((p) => p.id);
            publicar(ids, nova);
            const falhas = resumo.erros ? `, ${resumo.erros} com erro` : "";
            setAviso(`${arquivo.name}: ${resumo.novos} novos, ${resumo.atualizados} atualizados${falhas}.`);
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível importar a planilha.");
        } finally {
            setOcupado(false);
            if (arquivoRef.current) {
                arquivoRef.current.value = "";
            }
        }
    }

    function menuMais(id) {
        return aberto === id ? (
            <div className="ctt-menu">
                <button type="button" onClick={() => {
                    const base = selecionados.length ? selecionados : filtrados;
                    if (aba === "reajuste") {
                        exportarReajuste(base, numeroFlex(reajuste), { venda: reajVenda, atacado: reajAtacado });
                    } else {
                        exportarCsv(base);
                    }
                    setAberto(null);
                }}>
                    exportar planilha
                </button>
                <button type="button" onClick={() => { marcarFiltrados(true); setAberto(null); }}>
                    selecionar filtrados
                </button>
                <button type="button" onClick={() => { setMarcados([]); setAberto(null); }}>
                    limpar seleção
                </button>
                <button type="button" onClick={() => imprimir(selecionados.length ? selecionados : fatia)}>
                    imprimir etiquetas
                </button>
                <button type="button" onClick={() => { navigate(`${ROTAS.PDV}?vitrine=promocoes`); setAberto(null); }}>
                    abrir no PDV
                </button>
                <button type="button" onClick={() => { navigate(ROTAS.LOJA); setAberto(null); }}>
                    abrir a loja
                </button>
                <button type="button" onClick={() => { navigate(`${ROTAS.PRODUTOS}#list`); setAberto(null); }}>
                    cadastro de produtos
                </button>
            </div>
        ) : null;
    }

    function cabecaOrdenavel(campo, rotulo) {
        const ativa = ordem === campo;
        return (
            <button type="button" onClick={() => ordenar(campo)}>
                {rotulo}
                <span className={ativa ? "is-on" : ""}>{ativa && dir === "desc" ? "▾" : "▴"}</span>
            </button>
        );
    }

    const emPromo = lista.filter((p) => p.ativo !== false && emPromocao(p));
    const descontoMedio = emPromo.length
        ? emPromo.reduce((soma, p) => soma + pctEfetivo(p), 0) / emPromo.length
        : 0;
    const pctPreview = Number(String(desconto).replace(",", ".")) || 0;
    const precoFixo = Number(String(precoPromo).replace(",", ".")) || 0;
    const exemplo = Math.round(10 * (1 - Math.min(100, Math.max(0, pctPreview)) / 100) * 100) / 100;
    const pctReajuste = numeroFlex(reajuste);
    const pctValido = Number.isFinite(pctReajuste) && pctReajuste !== 0 && pctReajuste > -100;
    const opcoesReajuste = { venda: reajVenda, atacado: reajAtacado };
    const simulados = selecionados.map((p) => ({ produto: p, sim: simularReajuste(p, pctValido ? pctReajuste : 0, opcoesReajuste) }));
    const impactoEstoque = reajVenda
        ? simulados.reduce((soma, item) => soma + item.sim.delta * (Number(item.produto.estoque) || 0), 0)
        : 0;
    const comCusto = simulados.filter((item) => item.sim.custo > 0);
    const margemMedia = comCusto.length
        ? comCusto.reduce((soma, item) => soma + (item.sim.margemNova || 0), 0) / comCusto.length
        : null;
    const emPromoSelecao = simulados.filter((item) => emPromocao(item.produto)).length;
    const comAtacado = selecionados.filter((p) => Number(p.precoAtacado) > 0).length;
    const titulo = aba === "reajuste"
        ? "Reajuste de preços"
        : aba === "etiquetas"
            ? "Etiquetas de gôndola"
            : "Preço promocional e etiquetas";
    const subtitulo = aba === "reajuste"
        ? "O preço novo entra no cadastro e passa a valer no PDV, na loja, nos pedidos novos e na ordem de serviço. O custo fica igual, o % OFF da promoção permanece e o preço promocional é recalculado."
        : "O preço promocional vale no PDV, na loja e na ordem de serviço. A etiqueta de gôndola mostra De / Por e o % OFF.";

    return (
        <div className="prd-page promo-page has-pager">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to="/index">Início</Link>
                <span>›</span>
                <span>Vendas</span>
                <span>›</span>
                <span>{aba === "reajuste" ? "Reajuste de preços" : "Promoções"}</span>
            </nav>

            <div className="fer-head">
                <div>
                    <h2>{titulo}</h2>
                    <p className="prd-sub">{subtitulo}</p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div className="promo-links">
                    <Link className="prd-btn" to={`${ROTAS.PRODUTOS}#list`}>Produtos</Link>
                    {aba === "reajuste" ? <Link className="prd-btn" to={ROTAS.PROMOCOES}>Promoções</Link> : <Link className="prd-btn" to={ROTAS.REAJUSTE_PRECOS}>Reajuste</Link>}
                    <Link className="prd-btn" to={`${ROTAS.PDV}?vitrine=promocoes`}><ShoppingBag size={14} /> PDV</Link>
                    <Link className="prd-btn" to={`${ROTAS.PEDIDO_VENDA}#list`}>Pedidos</Link>
                    <Link className="prd-btn" to={ROTAS.ORDEM_SERVICO}>Ordens de serviço</Link>
                    <Link className="prd-btn" to={ROTAS.LOJA}><Store size={14} /> Loja</Link>
                </div>
            </div>

            {aba === "reajuste" ? (
                <div className="promo-kpis">
                    <article>
                        <span>Selecionados</span>
                        <strong>{selecionados.length.toLocaleString("pt-BR")}</strong>
                    </article>
                    <article>
                        <span>Valorização do estoque</span>
                        <strong className={impactoEstoque < 0 ? "is-down" : ""}>{textoDelta(impactoEstoque)}</strong>
                    </article>
                    <article>
                        <span>Margem média nova</span>
                        <strong>{margemMedia == null ? "—" : `${margemMedia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}</strong>
                    </article>
                    <article>
                        <span>Em promoção / com atacado</span>
                        <strong>{emPromoSelecao.toLocaleString("pt-BR")} / {comAtacado.toLocaleString("pt-BR")}</strong>
                    </article>
                </div>
            ) : (
                <div className="promo-kpis">
                    <article>
                        <span>Em promoção</span>
                        <strong>{emPromo.length.toLocaleString("pt-BR")}</strong>
                    </article>
                    <article>
                        <span>No catálogo</span>
                        <strong>{lista.filter((p) => p.ativo !== false).length.toLocaleString("pt-BR")}</strong>
                    </article>
                    <article>
                        <span>Desconto médio</span>
                        <strong>{descontoMedio.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong>
                    </article>
                    <article>
                        <span>Selecionados</span>
                        <strong>{selecionados.length.toLocaleString("pt-BR")}</strong>
                    </article>
                </div>
            )}
            <div className="os-tabs">
                {ABAS.map((item) => (
                    <button key={item.id} type="button" className={aba === item.id ? "is-active" : ""} onClick={() => escolherAba(item.id)}>
                        {item.label}
                    </button>
                ))}
            </div>

            {aba === "promocao" ? (
                <div className="promo-acoes">
                    <label className="promo-field">
                        % de desconto
                        <span className="promo-affix">
                            <input value={desconto} onChange={(e) => setDesconto(e.target.value)} inputMode="decimal" aria-label="% de desconto" />
                            <em>%</em>
                        </span>
                    </label>
                    <div className="promo-presets" role="group" aria-label="Atalhos de desconto">
                        {PRESETS.map((valor) => (
                            <button
                                key={valor}
                                type="button"
                                className={desconto === valor && !precoPromo ? "is-on" : ""}
                                onClick={() => { setDesconto(valor); setPrecoPromo(""); }}
                            >
                                {valor}%
                            </button>
                        ))}
                    </div>
                    <span className="promo-ou">ou</span>
                    <label className="promo-field">
                        preço promocional
                        <span className="promo-affix">
                            <em>R$</em>
                            <input
                                value={precoPromo}
                                onChange={(e) => setPrecoPromo(e.target.value)}
                                placeholder="Opcional"
                                inputMode="decimal"
                                aria-label="Preço promocional"
                            />
                        </span>
                    </label>
                    <button type="button" className="prd-btn prd-btn-primary" disabled={ocupado} onClick={() => aplicarPromo()}>
                        <Percent size={14} /> Aplicar promoção
                    </button>
                    <button type="button" className="prd-btn" disabled={ocupado} onClick={() => limparPromo()}>
                        <Trash2 size={14} /> Remover promoção
                    </button>
                    <span className="promo-acoes-espaco" />
                    <button type="button" className="prd-btn" disabled={ocupado} onClick={() => arquivoRef.current?.click()}>
                        <Download size={14} /> Importar produtos
                    </button>
                    <div className="ctt-drop">
                        <button type="button" className={`prd-btn${aberto === "mais" ? " is-on" : ""}`} onClick={() => setAberto(aberto === "mais" ? null : "mais")}>
                            Mais ações <ChevronDown size={14} />
                        </button>
                        {menuMais("mais")}
                    </div>
                    <p className="promo-preview">
                        {precoFixo > 0
                            ? `Os selecionados saem a ${moedaPreco(precoFixo)}. O % OFF é calculado sobre o preço normal.`
                            : `Os selecionados ficam ${pctPreview.toLocaleString("pt-BR")}% abaixo do preço normal. Exemplo: ${moedaPreco(10)} passa a ${moedaPreco(exemplo)}.`}
                    </p>
                </div>
            ) : null}

            {aba === "reajuste" ? (
                <div className="reaj-painel">
                    <div className="reaj-linha">
                        <label className="promo-field">
                            Percentual
                            <span className="promo-affix">
                                <input value={reajuste} onChange={(e) => setReajuste(e.target.value)} inputMode="decimal" aria-label="Reajuste percentual" />
                                <em>%</em>
                            </span>
                        </label>
                        <div className="promo-presets" role="group" aria-label="Atalhos de reajuste">
                            {PRESETS_REAJUSTE.map((valor) => (
                                <button
                                    key={valor}
                                    type="button"
                                    className={reajuste === valor ? "is-on" : ""}
                                    onClick={() => setReajuste(valor)}
                                >
                                    {Number(valor) > 0 ? `+${valor}` : valor}%
                                </button>
                            ))}
                        </div>
                        <div className="reaj-escopo" role="group" aria-label="Preços que recebem o reajuste">
                            <button type="button" className={reajVenda ? "is-on" : ""} onClick={() => setReajVenda((atual) => !atual)}>
                                Preço de venda
                            </button>
                            <button type="button" className={reajAtacado ? "is-on" : ""} onClick={() => setReajAtacado((atual) => !atual)}>
                                Preço de atacado
                            </button>
                        </div>
                        <button type="button" className="prd-btn" onClick={() => marcarFiltrados(!todosMarcados)}>
                            <Tags size={14} />
                            {todosMarcados ? "Limpar seleção" : `Selecionar ${filtrados.length.toLocaleString("pt-BR")} filtrados`}
                        </button>
                        <button type="button" className="prd-btn prd-btn-primary" disabled={ocupado || !marcados.length} onClick={() => aplicarReajuste()}>
                            <TrendingUp size={14} /> Aplicar reajuste
                        </button>
                    </div>
                    <p className="reaj-nota">
                        {!selecionados.length
                            ? "Selecione os produtos para ver o preço novo, a margem e o efeito no estoque antes de gravar."
                            : !pctValido
                                ? "Informe um percentual maior que -100% e diferente de zero."
                                : `${selecionados.length.toLocaleString("pt-BR")} produto(s) na prévia. ${
                                    reajVenda
                                        ? `A venda ${pctReajuste > 0 ? "sobe" : "cai"} ${Math.abs(pctReajuste).toLocaleString("pt-BR")}% e o estoque ${impactoEstoque >= 0 ? "valoriza" : "recua"} ${moedaPreco(Math.abs(impactoEstoque))}.`
                                        : "O preço de venda permanece."
                                } ${
                                    reajAtacado
                                        ? `${comAtacado.toLocaleString("pt-BR")} com preço de atacado acompanham o mesmo percentual.`
                                        : "O preço de atacado permanece."
                                }${emPromoSelecao ? ` ${emPromoSelecao.toLocaleString("pt-BR")} em promoção mantêm o % OFF.` : ""}`}
                    </p>
                    <div className="reaj-onde">
                        <span>O preço gravado alimenta</span>
                        <Link to={`${ROTAS.PRODUTOS}#list`}>cadastro</Link>
                        <Link to={ROTAS.PDV}>PDV</Link>
                        <Link to={`${ROTAS.PEDIDO_VENDA}#list`}>pedidos novos</Link>
                        <Link to={ROTAS.ORDEM_SERVICO}>OS (padrão, atacado e promocional)</Link>
                        <Link to={ROTAS.LOJA}>loja</Link>
                        <Link to="/promocoes?aba=etiquetas">etiquetas</Link>
                    </div>
                </div>
            ) : null}

            {aba === "etiquetas" ? (
                <div className="promo-acoes">
                    <p className="prd-sub">Imprime cartões De/Por com o percentual. Sem promoção, sai só o preço normal.</p>
                    <button type="button" className="prd-btn prd-btn-primary" onClick={() => imprimir()}>
                        <Printer size={14} /> Imprimir etiquetas
                    </button>
                </div>
            ) : null}

            <input
                ref={arquivoRef}
                type="file"
                accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                hidden
                onChange={(e) => importarArquivo(e.target.files?.[0])}
            />

            <div className="fer-filtros prd-filtros">
                <label className="fer-search">
                    <Search size={15} />
                    <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto, SKU ou GTIN..." />
                </label>
                <div className="ctt-drop">
                    <button
                        type="button"
                        className={`fer-chip${marca || soPromocao || !soAtivos ? " is-active" : ""}`}
                        onClick={() => {
                            setRascunho({ marca, soPromocao, soAtivos });
                            setAberto(aberto === "filtros" ? null : "filtros");
                        }}
                    >
                        <Filter size={14} /> Filtros
                    </button>
                    {aberto === "filtros" ? (
                        <div className="ctt-menu ctt-menu-form">
                            <strong>Filtros</strong>
                            <label>
                                Marca
                                <input
                                    value={rascunho.marca}
                                    placeholder="Qualquer marca"
                                    onChange={(e) => setRascunho((atual) => ({ ...atual, marca: e.target.value }))}
                                />
                            </label>
                            <label className="promo-check">
                                <input
                                    type="checkbox"
                                    checked={rascunho.soPromocao}
                                    onChange={(e) => setRascunho((atual) => ({ ...atual, soPromocao: e.target.checked }))}
                                />
                                Só produtos em promoção
                            </label>
                            <label className="promo-check">
                                <input
                                    type="checkbox"
                                    checked={rascunho.soAtivos}
                                    onChange={(e) => setRascunho((atual) => ({ ...atual, soAtivos: e.target.checked }))}
                                />
                                Só produtos ativos
                            </label>
                            <div className="ctt-menu-acoes">
                                <button
                                    type="button"
                                    className="prd-btn prd-btn-primary"
                                    onClick={() => {
                                        setMarca(rascunho.marca);
                                        setSoPromocao(rascunho.soPromocao);
                                        setSoAtivos(rascunho.soAtivos);
                                        setAberto(null);
                                    }}
                                >
                                    aplicar
                                </button>
                                <button type="button" className="prd-btn" onClick={() => setAberto(null)}>cancelar</button>
                            </div>
                        </div>
                    ) : null}
                </div>
                <div className="ctt-drop">
                    <button
                        type="button"
                        className={`fer-chip${categoria ? " is-active" : ""}`}
                        onClick={() => setAberto(aberto === "cat" ? null : "cat")}
                    >
                        {categoria || "Todas as categorias"}
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "cat" ? (
                        <div className="ctt-menu is-row">
                            <button type="button" className={!categoria ? "is-sel" : ""} onClick={() => { setCategoria(""); setAberto(null); }}>
                                Todas as categorias
                            </button>
                            {categorias.map((nome) => (
                                <button
                                    key={nome}
                                    type="button"
                                    className={categoria === nome ? "is-sel" : ""}
                                    onClick={() => { setCategoria(nome); setAberto(null); }}
                                >
                                    {nome}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
                <button type="button" className="idx-text" onClick={limparFiltros} disabled={!temFiltro}>
                    Limpar filtros
                </button>
            </div>

            <div className="prd-scroll">
                <table className="fer-table prd-table">
                    <thead>
                        <tr>
                            <th className="ctt-check">
                                <input
                                    type="checkbox"
                                    checked={paginaMarcada}
                                    onChange={(e) => marcarPagina(e.target.checked)}
                                    aria-label="Selecionar página"
                                />
                            </th>
                            <th>Produto</th>
                            <th>{cabecaOrdenavel("sku", "SKU")}</th>
                            {aba === "reajuste" ? (
                                <>
                                    <th className="is-num">{cabecaOrdenavel("custo", "Custo")}</th>
                                    <th className="is-num">{cabecaOrdenavel("preco", "Venda")}</th>
                                    <th className="is-num">{cabecaOrdenavel("precoAtacado", "Atacado")}</th>
                                    <th className="is-num">Margem</th>
                                    <th className="is-num">Variação</th>
                                </>
                            ) : (
                                <>
                                    <th className="is-num">{cabecaOrdenavel("preco", "Normal")}</th>
                                    <th className="is-num">{cabecaOrdenavel("precoPromocional", "Promocional")}</th>
                                    <th className="is-num">{cabecaOrdenavel("pct", "% OFF")}</th>
                                    <th>Etiqueta</th>
                                </>
                            )}
                            <th className="prd-th-acoes">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carregando ? (
                            <tr>
                                <td colSpan={aba === "reajuste" ? 9 : 8} className="ctt-vazio">Carregando produtos...</td>
                            </tr>
                        ) : fatia.length === 0 ? (
                            <tr>
                                <td colSpan={aba === "reajuste" ? 9 : 8} className="ctt-vazio">Nenhum produto nesta lista.</td>
                            </tr>
                        ) : fatia.map((p) => {
                            const foto = visualProduto(p);
                            const promo = emPromocao(p);
                            const sim = aba === "reajuste" ? simularReajuste(p, pctValido ? pctReajuste : 0, opcoesReajuste) : null;
                            const deltaLinha = sim ? (reajVenda ? sim.delta : sim.deltaAtacado) : 0;
                            return (
                                <tr key={p.id} className={marcados.includes(p.id) ? "is-sel" : ""}>
                                    <td className="ctt-check">
                                        <input type="checkbox" checked={marcados.includes(p.id)} onChange={() => toggle(p.id)} aria-label={`Selecionar ${p.nome}`} />
                                    </td>
                                    <td>
                                        <Link className="prd-nome promo-nome" to={`${ROTAS.PRODUTOS}?id=${p.id}`}>
                                            <span className="prd-foto" aria-hidden>
                                                {foto.img ? <img src={foto.img} alt="" /> : foto.emoji}
                                            </span>
                                            <span>
                                                <strong className="prd-desc">{p.nome || "Sem nome"}</strong>
                                                <small className="prd-cat">
                                                    {p.grupo || p.categoria || "Sem categoria"}
                                                    {p.marca ? ` · ${p.marca}` : ""}
                                                    {Number(p.estoque) <= Number(p.estoqueMinimo || 0) ? " · estoque baixo" : ""}
                                                    {promo ? ` · ${textoPct(p)} OFF` : ""}
                                                </small>
                                            </span>
                                        </Link>
                                    </td>
                                    <td>{p.sku || "—"}</td>
                                    {sim ? (
                                        <>
                                            <td className="is-num">{sim.custo > 0 ? moedaPreco(sim.custo) : "—"}</td>
                                            <td className="is-num">
                                                <span className="reaj-par">
                                                    {reajVenda && pctValido && marcados.includes(p.id) ? <s>{moedaPreco(sim.precoAtual)}</s> : null}
                                                    <strong>{moedaPreco(reajVenda && pctValido && marcados.includes(p.id) ? sim.preco : sim.precoAtual)}</strong>
                                                    {sim.precoPromocional > 0 ? <small>promo {moedaPreco(reajVenda && pctValido && marcados.includes(p.id) ? sim.precoPromocional : sim.precoPromocionalAtual)}</small> : null}
                                                </span>
                                            </td>
                                            <td className="is-num">
                                                {sim.precoAtacadoAtual > 0 ? (
                                                    <span className="reaj-par">
                                                        {reajAtacado && pctValido && marcados.includes(p.id) ? <s>{moedaPreco(sim.precoAtacadoAtual)}</s> : null}
                                                        <strong>{moedaPreco(reajAtacado && pctValido && marcados.includes(p.id) ? sim.precoAtacado : sim.precoAtacadoAtual)}</strong>
                                                    </span>
                                                ) : "—"}
                                            </td>
                                            <td className="is-num">{textoMargem(sim.margemAtual, reajVenda && pctValido && marcados.includes(p.id) ? sim.margemNova : sim.margemAtual)}</td>
                                            <td className="is-num">
                                                <span className={`reaj-delta${deltaLinha > 0 ? " is-up" : deltaLinha < 0 ? " is-down" : ""}`}>
                                                    {marcados.includes(p.id) && pctValido ? textoDelta(deltaLinha) : "—"}
                                                </span>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="is-num"><span className="promo-pill">{moedaPreco(p.preco)}</span></td>
                                            <td className="is-num">
                                                <span className={`promo-pill${promo ? "" : " is-zero"}`}>
                                                    {promo ? moedaPreco(p.precoPromocional) : "—"}
                                                </span>
                                            </td>
                                            <td className="is-num">
                                                <span className={`promo-pill${pctEfetivo(p) > 0 ? "" : " is-zero"}`}>{textoPct(p)}</span>
                                            </td>
                                            <td>
                                                <span className={`promo-etiq${promo ? "" : " is-normal"}`}>{rotuloOff(p) || "Preço normal"}</span>
                                            </td>
                                        </>
                                    )}
                                    <td>
                                        <div className="prd-acoes">
                                            <div className="ctt-row-menu">
                                                <button type="button" title="Mais" onClick={() => setMenuLinha(menuLinha === p.id ? null : p.id)}>
                                                    <MoreVertical size={15} />
                                                </button>
                                                {menuLinha === p.id ? (
                                                    <div className="ctt-menu is-right">
                                                        <button type="button" onClick={() => navigate(`${ROTAS.PRODUTOS}?id=${p.id}`)}>abrir cadastro</button>
                                                        <button type="button" onClick={() => navigate(`${ROTAS.PDV}?sku=${encodeURIComponent(p.sku || p.nome || "")}`)}>vender no PDV</button>
                                                        {aba === "reajuste" ? (
                                                            <button type="button" onClick={() => aplicarReajuste([p.id])}>reajustar este produto</button>
                                                        ) : (
                                                            <>
                                                                <button type="button" onClick={() => aplicarPromo([p.id])}>aplicar promoção</button>
                                                                <button type="button" onClick={() => limparPromo([p.id])}>remover promoção</button>
                                                            </>
                                                        )}
                                                        <button type="button" onClick={() => imprimir([p])}>etiqueta de gôndola</button>
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

            <div className="promo-foot">
                <div className="promo-foot-esq">
                    <label className="promo-sel">
                        <input
                            type="checkbox"
                            checked={todosMarcados}
                            onChange={(e) => marcarFiltrados(e.target.checked)}
                            aria-label="Selecionar filtrados"
                        />
                        <Tags size={14} />
                        {selecionados.length} selecionado{selecionados.length === 1 ? "" : "s"}
                    </label>
                    {aba === "reajuste" ? (
                        <button type="button" className="prd-btn prd-btn-primary" disabled={ocupado || !marcados.length} onClick={() => aplicarReajuste()}>
                            <TrendingUp size={14} /> Aplicar reajuste
                        </button>
                    ) : null}
                    <button type="button" className="prd-btn" onClick={() => (selecionados.length ? imprimir(selecionados) : setAviso("Selecione produtos."))}>
                        <Tags size={14} /> Gerar etiquetas
                    </button>
                    <button type="button" className="prd-btn" onClick={() => imprimir(selecionados.length ? selecionados : fatia)}>
                        <Printer size={14} /> Imprimir
                    </button>
                    <div className="ctt-drop">
                        <button type="button" className={`prd-btn${aberto === "mais-foot" ? " is-on" : ""}`} onClick={() => setAberto(aberto === "mais-foot" ? null : "mais-foot")}>
                            Mais ações <ChevronDown size={14} />
                        </button>
                        {menuMais("mais-foot")}
                    </div>
                </div>
                <div className="promo-foot-dir">
                    <span>
                        {filtrados.length
                            ? `${inicio + 1}–${Math.min(inicio + POR_PAGINA, filtrados.length)} de ${filtrados.length.toLocaleString("pt-BR")} produtos`
                            : "0 produtos"}
                    </span>
                    <div className="prd-foot-nav">
                        <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} aria-label="Página anterior">
                            <ChevronLeft size={16} />
                        </button>
                        {paginasVisiveis(paginaAtual, totalPaginas).map((p, i) => (
                            p === "…" ? <span key={`e${i}`}>–</span> : (
                                <button key={p} type="button" className={p === paginaAtual ? "is-active" : ""} onClick={() => setPagina(p)}>
                                    {p}
                                </button>
                            )
                        ))}
                        <button type="button" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} aria-label="Próxima página">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
