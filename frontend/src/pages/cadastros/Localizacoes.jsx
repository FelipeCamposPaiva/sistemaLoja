import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Copy,
    Eye,
    Filter,
    MoreVertical,
    Package,
    PenLine,
    Printer,
    ArrowRightLeft,
    ArrowUpDown,
    MapPinOff
} from "lucide-react";

import BuscaLocalizacao from "../../components/BuscaLocalizacao";
import ModalEstoqueLocal from "../../components/ModalEstoqueLocal";
import { garantirCatalogoLoja, produtosLoja } from "../../constants/catalogoLoja";
import ROTAS from "../../constants/rotas";
import { urlMidia } from "../../services/produtoMidia.service";
import {
    catalogoLocalizacoes,
    filtrarPorLocalizacao,
    gravarLocalProduto,
    imprimirProdutosLocalizacao,
    localizacaoDe,
    passaFiltroEstoque,
    SEM_PRATELEIRA,
    situacaoEstoque
} from "../../services/localizacao";
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

export default function Localizacoes() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [produtos, setProdutos] = useState([]);
    const [localizacao, setLocalizacao] = useState(params.get("localizacao") || "");
    const [filtroEstoque, setFiltroEstoque] = useState(() => filtroDaUrl(params));
    const [aviso, setAviso] = useState("");
    const [categoria, setCategoria] = useState("todas");
    const [ordem, setOrdem] = useState("nome");
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);
    const [sel, setSel] = useState(() => new Set());
    const [menuId, setMenuId] = useState("");
    const [filtrosAberto, setFiltrosAberto] = useState(false);
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
            if (vivo) {
                setProdutos(lista);
            }
        })();
        return () => {
            vivo = false;
        };
    }, []);

    useEffect(() => {
        const next = new URLSearchParams();
        if (localizacao.trim()) {
            next.set("localizacao", localizacao.trim());
        }
        if (filtroEstoque && filtroEstoque !== "todos") {
            next.set("estoque", filtroEstoque);
        }
        setParams(next, { replace: true });
        setPagina(1);
        setSel(new Set());
    }, [localizacao, filtroEstoque, porPagina, setParams]);

    const filtrados = useMemo(() => {
        if (!localizacao.trim()) {
            return [];
        }
        return filtrarPorLocalizacao(produtos, localizacao, filtroEstoque).map((p) => ({
            ...p,
            localizacao: localizacaoDe(p)
        }));
    }, [produtos, localizacao, filtroEstoque]);

    const categorias = useMemo(() => {
        const nomes = [...new Set(filtrados.map((p) => p.grupo || p.categoria).filter(Boolean))];
        return nomes.sort((a, b) => a.localeCompare(b, "pt"));
    }, [filtrados]);

    const lista = useMemo(() => {
        const dados = filtrados.filter((p) => {
            if (categoria === "todas") {
                return true;
            }
            return String(p.grupo || p.categoria) === categoria;
        });
        const chave = {
            nome: (a, b) => nomeExibicao(a).localeCompare(nomeExibicao(b), "pt"),
            sku: (a, b) => String(codigoExibicao(a)).localeCompare(String(codigoExibicao(b)), "pt"),
            estoque: (a, b) => Number(b.estoque || 0) - Number(a.estoque || 0),
            localizacao: (a, b) => String(a.localizacao).localeCompare(String(b.localizacao), "pt", { numeric: true })
        }[ordem] || ((a, b) => nomeExibicao(a).localeCompare(nomeExibicao(b), "pt"));
        return [...dados].sort(chave);
    }, [filtrados, categoria, ordem]);

    const chips = useMemo(() => {
        const todas = catalogoLocalizacoes(produtos);
        const pt = todas.filter((c) => c.startsWith("PT-"));
        return (pt.length ? [...pt, ...todas.filter((c) => !c.startsWith("PT-"))] : todas).slice(0, 10);
    }, [produtos]);
    const resumoLocais = useMemo(() => {
        const mapa = new Map();
        for (const p of produtos) {
            if (!passaFiltroEstoque(p, filtroEstoque)) {
                continue;
            }
            const loc = localizacaoDe(p);
            if (!loc) {
                continue;
            }
            const atual = mapa.get(loc) || { localizacao: loc, qtd: 0, estoque: 0 };
            atual.qtd += 1;
            atual.estoque += Number(p.estoque || 0);
            mapa.set(loc, atual);
        }
        return [...mapa.values()].sort((a, b) => a.localizacao.localeCompare(b.localizacao, "pt-BR", { numeric: true }));
    }, [produtos, filtroEstoque]);
    const modoLocais = !localizacao.trim();
    const fonte = modoLocais ? resumoLocais : lista;
    const paginas = Math.max(1, Math.ceil(fonte.length / porPagina));
    const paginaAtual = Math.min(pagina, paginas);
    const fatia = lista.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);
    const fatiaLocais = resumoLocais.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);
    const imprimiveis = lista.filter((p) => !sel.size || sel.has(String(p.id)));

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

    function toggleTodos() {
        if (fatia.every((p) => sel.has(String(p.id)))) {
            setSel(new Set());
            return;
        }
        setSel(new Set(fatia.map((p) => String(p.id))));
    }

    function copiar(texto) {
        navigator.clipboard?.writeText(texto).then(() => setAviso("Copiado.")).catch(() => {});
        setMenuId("");
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
        setAviso(valor ? `Produto transferido para ${valor}.` : "Produto removido desta prateleira.");
        setModal(null);
        setMenuId("");
    }

    const rotuloVazio = filtroEstoque === "disponivel"
        ? " com estoque disponível"
        : filtroEstoque === "sem"
            ? " sem estoque disponível"
            : filtroEstoque === "negativo"
                ? " com estoque negativo"
                : "";

    const queryProdutos = `${ROTAS.PRODUTOS}?localizacao=${encodeURIComponent(localizacao.trim())}${filtroEstoque === "disponivel" ? "&estoque=disponivel" : filtroEstoque !== "todos" ? `&estoque=${filtroEstoque}` : ""}`;

    return (
        <div className="loc-page has-pager">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>cadastros</span>
                <span>›</span>
                <Link to={ROTAS.LOCALIZACOES}>localizações</Link>
                <span>›</span>
                <span>produtos</span>
            </nav>

            <header className="loc-hero">
                <div>
                    <h2>Localização → produtos</h2>
                    <p>Escolha a prateleira, caixa, corredor ou setor para ver o que está lá. Abaixo, o resumo das localizações do catálogo.</p>
                    {aviso ? <p className="loc-aviso">{aviso}</p> : null}
                </div>
            </header>

            <div className="loc-barra">
                <BuscaLocalizacao
                    produtos={produtos}
                    localizacao={localizacao}
                    onLocalizacao={setLocalizacao}
                    filtroEstoque={filtroEstoque}
                    onFiltroEstoque={setFiltroEstoque}
                />
            </div>

            {chips.length ? (
                <div className="loc-chips">
                    {chips.map((chip) => (
                        <button
                            type="button"
                            key={chip}
                            className={localizacao.trim().toUpperCase() === chip.toUpperCase() ? "is-on" : ""}
                            onClick={() => setLocalizacao(chip)}
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            ) : null}

            <div className="loc-acoes">
                <button
                    type="button"
                    className="loc-btn-pri"
                    disabled={!imprimiveis.length}
                    onClick={() => imprimirProdutosLocalizacao(imprimiveis, localizacao)}
                >
                    <Printer size={16} /> Imprimir lista / contagem
                </button>
                <Link className="loc-btn" to={queryProdutos}>
                    <ClipboardList size={16} /> Abrir no cadastro de produtos
                </Link>
                <Link className="loc-btn" to={`${ROTAS.INVENTARIO}?localizacao=${encodeURIComponent(localizacao.trim())}`}>
                    <Package size={16} /> Contar no inventário
                </Link>
            </div>

            <section className="loc-card">
                <div className="loc-card-head">
                    <h3>{modoLocais ? "Prateleiras e setores" : "Produtos na localização"}</h3>
                    <div className="loc-card-acoes">
                        {modoLocais ? null : (
                            <>
                        <div className="loc-menu-wrap">
                            <button type="button" className="loc-btn-ghost" onClick={() => setFiltrosAberto((v) => !v)}>
                                <Filter size={15} /> Filtros
                            </button>
                            {filtrosAberto ? (
                                <div className="loc-pop">
                                    <button type="button" className={categoria === "todas" ? "is-on" : ""} onClick={() => { setCategoria("todas"); setFiltrosAberto(false); }}>
                                        Todas as categorias
                                    </button>
                                    {categorias.map((c) => (
                                        <button type="button" key={c} className={categoria === c ? "is-on" : ""} onClick={() => { setCategoria(c); setFiltrosAberto(false); }}>
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                        <label className="loc-ordenar">
                            <ArrowUpDown size={15} />
                            <select value={ordem} onChange={(e) => setOrdem(e.target.value)} aria-label="Ordenar por">
                                <option value="nome">Ordenar por</option>
                                <option value="nome">Produto</option>
                                <option value="sku">SKU</option>
                                <option value="localizacao">Localização</option>
                                <option value="estoque">Estoque</option>
                            </select>
                        </label>
                            </>
                        )}
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
                                    <th>Localização</th>
                                    <th>Produtos</th>
                                    <th>Estoque</th>
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
                                    <td colSpan={4} className="loc-vazio">Nenhuma localização no catálogo ainda.</td>
                                </tr>
                            ) : modoLocais ? fatiaLocais.map((item) => (
                                <tr key={item.localizacao} className="loc-click" onClick={() => setLocalizacao(item.localizacao)}>
                                    <td>
                                        <button type="button" className="loc-local-btn" onClick={(e) => { e.stopPropagation(); setLocalizacao(item.localizacao); }}>
                                            {item.localizacao}
                                        </button>
                                    </td>
                                    <td>{qtd(item.qtd)}</td>
                                    <td>{qtd(item.estoque)}</td>
                                    <td>
                                        <div className="loc-row-acoes">
                                            <button type="button" title="Ver produtos" onClick={(e) => { e.stopPropagation(); setLocalizacao(item.localizacao); }}>
                                                <Eye size={15} />
                                            </button>
                                            <button type="button" title="Copiar localização" onClick={(e) => { e.stopPropagation(); copiar(item.localizacao); }}>
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
                                                <button type="button" title="Editar" onClick={() => abrirEdicao(p)}>
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
                        {Array.from({ length: Math.min(paginas, 5) }, (_, i) => i + 1).map((n) => (
                            <button type="button" key={n} className={n === paginaAtual ? "is-on" : ""} onClick={() => setPagina(n)}>
                                {n}
                            </button>
                        ))}
                        <button type="button" disabled={paginaAtual >= paginas} onClick={() => setPagina((n) => n + 1)} aria-label="Próxima página">
                            <ChevronRight size={16} />
                        </button>
                    </nav>
                    <label className="erp-pager-size">
                        <select value={porPagina} onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }} aria-label="Itens por página">
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
