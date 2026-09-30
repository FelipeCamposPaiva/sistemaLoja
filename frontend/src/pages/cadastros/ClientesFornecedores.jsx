import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    Filter,
    MoreVertical,
    Pencil,
    Plus,
    Printer,
    Search,
    Trash2,
    Truck,
    User,
    Users,
    X
} from "lucide-react";

import {
    gravarContatos,
    lerContatos,
    rotuloTipo,
    TIPOS
} from "../../constants/contatos";
import {
    atualizarCliente,
    excluirCliente,
    importarClientesLote,
    listarClientes
} from "../../services/clientes.service";
import { lerPlanilhaContatos, mesclarContatos } from "../../services/contatoImport.service";
import ROTAS from "../../constants/rotas";
import heroPapelaria from "../../assets/images/hero-papelaria.svg";
import ImportadorMassa from "./ImportadorMassa";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";

const CARDS = [
    { id: "todos", label: "Total de Cadastros", ver: "Ver todos", Icon: Users, tom: "rosa" },
    { id: "cliente", label: "Clientes", ver: "Ver clientes", Icon: User, tom: "verde" },
    { id: "fornecedor", label: "Fornecedores", ver: "Ver fornecedores", Icon: Truck, tom: "azul" },
    { id: "transportador", label: "Transportadores", ver: "Ver transportadores", Icon: Truck, tom: "amarelo" },
    { id: "funcionario", label: "Funcionários", ver: "Ver funcionários", Icon: User, tom: "lilas" },
    { id: "outro", label: "Outros", ver: "Ver outros", Icon: MoreVertical, tom: "pink" }
];

function capital(id) {
    const nome = rotuloTipo(id);
    return nome.charAt(0).toUpperCase() + nome.slice(1);
}

function quandoCadastro(iso) {
    if (!iso) {
        return { data: "—", hora: "" };
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
        return { data: "—", hora: "" };
    }
    return {
        data: d.toLocaleDateString("pt-BR"),
        hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
}

const EMPRESAS = [
    { id: "matriz", nome: "49.635.218 FELIPE CAMPOS PAIVA - @49635218000101" },
    { id: "centro", nome: "Tem de Tudo Centro" },
    { id: "norte", nome: "Tem de Tudo Norte" }
];

const LISTAS_PRECO = [];
const POR_PAGINA = 10;
const TAMANHOS = [10, 20, 50];
const MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

function iniciais(nome) {
    const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
    if (!partes.length) {
        return "?";
    }
    if (partes.length === 1) {
        return partes[0].slice(0, 2).toUpperCase();
    }
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const CORES_AVATAR = ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#db2777", "#0891b2"];

function corAvatar(id) {
    return CORES_AVATAR[Number(id) % CORES_AVATAR.length];
}

function textoDe(contato) {
    return [
        contato.nome,
        contato.fantasia,
        contato.cpfCnpj,
        contato.email,
        contato.celular,
        contato.telefone,
        String(contato.id)
    ].join(" ").toLowerCase();
}

function exportarCsv(lista) {
    const linhas = [
        ["ID", "Nome", "Tipo", "CPF/CNPJ", "Cidade", "UF", "Telefone", "E-mail"].join(";")
    ];
    lista.forEach((c) => {
        linhas.push([
            c.id,
            c.nome,
            (c.tipos || []).map(rotuloTipo).join(" "),
            c.cpfCnpj || "",
            c.municipio || "",
            c.uf || "",
            c.celular || c.telefone || "",
            c.email || ""
        ].map((v) => `"${String(v).replaceAll("\"", "\"\"")}"`).join(";"));
    });
    const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes-fornecedores.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function ListaContatos() {
    const navigate = useNavigate();
    const { hash } = useLocation();
    const [lista, setLista] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroApi, setErroApi] = useState("");
    const [busca, setBusca] = useState("");
    const [aba, setAba] = useState("todos");
    const [ordem, setOrdem] = useState("nome");
    const [situacao, setSituacao] = useState("sem");
    const [periodo, setPeriodo] = useState("sem");
    const [mes, setMes] = useState(new Date().getMonth());
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(POR_PAGINA);
    const [marcados, setMarcados] = useState([]);
    const [menuLinha, setMenuLinha] = useState(null);
    const [aberto, setAberto] = useState(null);
    const [filtros, setFiltros] = useState({ vendedor: "", municipio: "", uf: "" });
    const [rascunho, setRascunho] = useState({ vendedor: "", municipio: "", uf: "" });
    const [inativoDesde, setInativoDesde] = useState("2026-08-01");
    const [painel, setPainel] = useState(null);
    const [vendedorLote, setVendedorLote] = useState("");
    const [tipoLote, setTipoLote] = useState("cliente");
    const [empresasLote, setEmpresasLote] = useState([]);
    const [aviso, setAviso] = useState("");
    const [importando, setImportando] = useState(false);
    const [importadorMassa, setImportadorMassa] = useState(false);
    const xlsRef = useRef(null);
    const raiz = useRef(null);

    useEffect(() => {
        if (hash === "#/add" || hash === "#add") {
            navigate("/contatos/novo", { replace: true });
        }
    }, [hash, navigate]);

    async function carregarContatos() {
        setCarregando(true);
        try {
            const dados = await listarClientes();
            setLista(dados);
            gravarContatos(dados);
            setErroApi("");
        } catch {
            setErroApi("Não foi possível carregar os cadastros do servidor.");
            setLista(lerContatos());
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarContatos();
    }, []);

    async function importarExcel(arquivo) {
        if (!arquivo) {
            return;
        }
        setImportando(true);
        setAberto(null);
        try {
            const lido = await lerPlanilhaContatos(arquivo);
            if (!lido.itens.length) {
                setAviso("A planilha não tem contatos com nome.");
                return;
            }
            const resumo = await importarClientesLote(lido.itens);
            const falhas = resumo.erros ? `, ${resumo.erros} com erro` : "";
            setAviso(`${arquivo.name}: ${resumo.total} cadastros gravados (${resumo.novos} novos, ${resumo.atualizados} atualizados${falhas}).`);
            await carregarContatos();
        } catch (erro) {
            setAviso(erro?.response?.data?.mensagem || erro?.message || "Não foi possível importar a planilha.");
        } finally {
            setImportando(false);
            if (xlsRef.current) {
                xlsRef.current.value = "";
            }
        }
    }

    useEffect(() => {
        if (!carregando) {
            gravarContatos(lista);
        }
    }, [lista, carregando]);

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

    const contagens = useMemo(() => {
        const base = lista.filter((c) => !c.excluido);
        const por = (id) => base.filter((c) => (c.tipos || []).includes(id)).length;
        return {
            todos: base.length,
            cliente: por("cliente"),
            fornecedor: por("fornecedor"),
            transportador: por("transportador"),
            funcionario: por("funcionario"),
            outro: por("outro")
        };
    }, [lista]);

    const visiveis = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        let itens = lista.filter((c) => {
            if (situacao === "excluidos") {
                return c.excluido;
            }
            if (c.excluido) {
                return false;
            }
            if (situacao === "inativos") {
                if (c.ativo !== false) {
                    return false;
                }
                if (!inativoDesde) {
                    return true;
                }
                return new Date(c.dataCadastro) <= new Date(`${inativoDesde}T23:59:59`);
            }
            return true;
        });

        if (aba !== "todos") {
            itens = itens.filter((c) => (c.tipos || []).includes(aba));
        }
        if (termo) {
            itens = itens.filter((c) => textoDe(c).includes(termo));
        }
        if (filtros.vendedor) {
            const v = filtros.vendedor.toLowerCase();
            itens = itens.filter((c) => (c.vendedor || "").toLowerCase().includes(v));
        }
        if (filtros.municipio) {
            const m = filtros.municipio.toLowerCase();
            itens = itens.filter((c) => (c.municipio || "").toLowerCase().includes(m));
        }
        if (filtros.uf) {
            itens = itens.filter((c) => c.uf === filtros.uf);
        }
        if (periodo === "mes") {
            itens = itens.filter((c) => new Date(c.dataCadastro).getMonth() === Number(mes));
        }

        itens = [...itens].sort((a, b) => {
            if (ordem === "recentes") {
                return new Date(b.dataCadastro) - new Date(a.dataCadastro);
            }
            if (ordem === "codigo") {
                return Number(a.id) - Number(b.id);
            }
            return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
        });
        return itens;
    }, [lista, busca, aba, ordem, situacao, periodo, mes, filtros, inativoDesde]);

    const totalPaginas = Math.max(1, Math.ceil(visiveis.length / porPagina));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const inicio = (paginaAtual - 1) * porPagina;
    const fatia = visiveis.slice(inicio, inicio + porPagina);

    useEffect(() => {
        setPagina(1);
    }, [busca, aba, ordem, situacao, periodo, mes, filtros, porPagina]);

    function toggleMarca(id) {
        setMarcados((atual) => (
            atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]
        ));
    }

    function marcarPagina(ev) {
        const ids = fatia.map((c) => c.id);
        if (ev.target.checked) {
            setMarcados((atual) => [...new Set([...atual, ...ids])]);
        } else {
            setMarcados((atual) => atual.filter((id) => !ids.includes(id)));
        }
    }

    async function excluir(id) {
        try {
            await excluirCliente(id);
            setLista((atual) => atual.filter((c) => c.id !== id));
        } catch {
            setLista((atual) => atual.map((c) => (c.id === id ? { ...c, excluido: true } : c)));
        }
        setMenuLinha(null);
        setMarcados((atual) => atual.filter((x) => x !== id));
    }

    function selecionados() {
        return lista.filter((c) => marcados.includes(c.id) && !c.excluido);
    }

    async function excluirLote() {
        if (!marcados.length) {
            return;
        }
        if (!window.confirm(`Excluir ${marcados.length} cadastro(s)?`)) {
            return;
        }
        await Promise.all(marcados.map((id) => excluirCliente(id).catch(() => null)));
        setLista((atual) => atual.filter((c) => !marcados.includes(c.id)));
        setMarcados([]);
        setAberto(null);
        setPainel(null);
    }

    function imprimirEtiquetas() {
        const nomes = selecionados().map((c) => `${c.nome}\n${c.cpfCnpj || ""}\n${c.municipio || ""}`).join("\n\n");
        const janela = window.open("", "_blank");
        if (janela) {
            janela.document.write(`<pre style="font:14px sans-serif;padding:24px">${nomes || "Nenhum contato selecionado."}</pre>`);
            janela.document.close();
            janela.print();
        }
        setAberto(null);
    }

    async function vincularVendedor() {
        if (!vendedorLote.trim()) {
            return;
        }
        const nome = vendedorLote.trim();
        await Promise.all(
            selecionados().map((c) => atualizarCliente(c.id, { ...c, vendedor: nome }).catch(() => null))
        );
        setLista((atual) => atual.map((c) => (
            marcados.includes(c.id) ? { ...c, vendedor: nome } : c
        )));
        setPainel(null);
        setVendedorLote("");
    }

    async function definirTipo() {
        await Promise.all(
            selecionados().map((c) => atualizarCliente(c.id, { ...c, tipos: [tipoLote] }).catch(() => null))
        );
        setLista((atual) => atual.map((c) => (
            marcados.includes(c.id) ? { ...c, tipos: [tipoLote] } : c
        )));
        setPainel(null);
    }

    async function unificar() {
        const grupo = selecionados();
        if (grupo.length < 2) {
            return;
        }
        const [principal, ...restantes] = grupo;
        const ids = restantes.map((c) => c.id);
        await Promise.all(ids.map((id) => excluirCliente(id).catch(() => null)));
        setLista((atual) => atual.filter((c) => !ids.includes(c.id)));
        setMarcados([principal.id]);
        setPainel(null);
        setAberto(null);
    }

    function limparFiltros() {
        setBusca("");
        setSituacao("sem");
        setPeriodo("sem");
        setFiltros({ vendedor: "", municipio: "", uf: "" });
        setRascunho({ vendedor: "", municipio: "", uf: "" });
        setInativoDesde("2026-08-01");
    }

    const temFiltro = busca || situacao !== "sem" || periodo !== "sem" || filtros.uf || filtros.municipio || filtros.vendedor;
    const cidades = useMemo(() => (
        [...new Set(lista.map((c) => c.municipio).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"))
    ), [lista]);

    const filtroInativos = situacao === "inativos"
        ? `inativos desde ${new Date(`${inativoDesde}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}`
        : null;

    function imprimirFicha(c) {
        const janela = window.open("", "_blank");
        if (janela) {
            janela.document.write(`
                <html><head><title>Ficha ${c.nome}</title>
                <style>body{font:14px sans-serif;padding:32px} h1{font-size:20px} p{margin:6px 0}</style></head>
                <body>
                <h1>Ficha cadastral</h1>
                <p><strong>${c.nome}</strong> ${c.fantasia ? `/ ${c.fantasia}` : ""}</p>
                <p>Código #${c.id}</p>
                <p>CPF/CNPJ: ${c.cpfCnpj || "—"}</p>
                <p>Cidade: ${c.municipio || "—"} ${c.uf || ""}</p>
                <p>Contato: ${c.celular || c.telefone || "—"}</p>
                <p>E-mail: ${c.email || "—"}</p>
                </body></html>
            `);
            janela.document.close();
            janela.print();
        }
        setMenuLinha(null);
    }

    function tornarVendedor(c) {
        setLista((atual) => atual.map((item) => (
            item.id === c.id ? { ...item, vendedor: item.nome } : item
        )));
        setMenuLinha(null);
        navigate("/vendedores#list");
    }

    function vincularRegistro(c) {
        const alvo = window.prompt("Informe o código do cadastro para vincular:", "");
        if (!alvo) {
            setMenuLinha(null);
            return;
        }
        setLista((atual) => atual.map((item) => (
            item.id === c.id ? { ...item, vinculadoId: alvo } : item
        )));
        setMenuLinha(null);
    }

    const paginas = [];
    for (let i = 1; i <= totalPaginas && i <= 8; i += 1) {
        paginas.push(i);
    }

    return (
        <div className="ctt-page ctt-loja" ref={raiz}>
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <span>Cadastros</span>
                <span>›</span>
                <span>Clientes e Fornecedores</span>
            </nav>

            <div className="ctt-hero">
                <div>
                    <h2>Clientes e Fornecedores</h2>
                    <p className="ctt-sub">
                        {carregando
                            ? "Carregando cadastros do servidor..."
                            : "Cadastre e gerencie clientes, fornecedores e parceiros comerciais da sua loja."}
                    </p>
                    {erroApi ? <p className="ctt-sub ctt-erro">{erroApi}</p> : null}
                    {aviso ? <p className="ctt-sub ctt-ok">{aviso}</p> : null}
                </div>
                <img className="ctt-hero-art" src={heroPapelaria} alt="" />
                <div className="ctt-acoes">
                    <div className="ctt-drop">
                        <button
                            type="button"
                            className="ctt-btn-incluir"
                            onClick={() => navigate("/contatos/novo")}
                        >
                            <Plus size={16} />
                            Incluir cadastro
                        </button>
                        <button
                            type="button"
                            className={`ctt-btn-incluir-mais${aberto === "mais" ? " is-on" : ""}`}
                            aria-label="Mais ações de cadastro"
                            onClick={() => setAberto(aberto === "mais" ? null : "mais")}
                        >
                            <ChevronDown size={16} />
                        </button>
                        {aberto === "mais" ? (
                            <div className="ctt-menu">
                                <button type="button" onClick={() => navigate("/contatos/novo")}>Novo cadastro</button>
                                <button type="button" onClick={() => window.print()}>Imprimir</button>
                                <button type="button" onClick={() => { exportarCsv(visiveis); setAberto(null); }}>
                                    Exportar para planilha
                                </button>
                                <button type="button" disabled={importando} onClick={() => { xlsRef.current?.click(); setAberto(null); }}>
                                    {importando ? "Importando planilha…" : "Importar planilha Tiny (.xls)"}
                                </button>
                                <button type="button" disabled={importando} onClick={() => { setImportadorMassa(true); setAberto(null); }}>
                                    Importar em massa (vários Excel)
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <input
                ref={xlsRef}
                type="file"
                hidden
                accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => importarExcel(e.target.files?.[0])}
            />

            <div className="ctt-tabs">
                <button type="button" className={aba === "todos" ? "is-active" : ""} onClick={() => setAba("todos")}>
                    Todos
                </button>
                {TIPOS.map((tipo) => (
                    <button
                        key={tipo.id}
                        type="button"
                        className={aba === tipo.id ? "is-active" : ""}
                        onClick={() => setAba(tipo.id)}
                    >
                        {capital(tipo.id)}
                    </button>
                ))}
            </div>

            <div className="ctt-cards">
                {CARDS.map((card) => {
                    const Icon = card.Icon;
                    const qtd = card.id === "todos" ? contagens.todos : contagens[card.id];
                    return (
                        <button
                            key={card.id}
                            type="button"
                            className={`ctt-card ctt-card-${card.tom}${aba === card.id ? " is-active" : ""}`}
                            onClick={() => setAba(card.id)}
                        >
                            <span className="ctt-card-ico"><Icon size={18} /></span>
                            <strong>{qtd}</strong>
                            <small>{card.label}</small>
                            <em>{card.ver} →</em>
                        </button>
                    );
                })}
            </div>

            <div className="fer-filtros ctt-filtros">
                <label className="fer-search">
                    <Search size={15} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Pesquisar por nome, CPF/CNPJ, cidade, contato..."
                    />
                </label>

                <div className="ctt-drop">
                    <button
                        type="button"
                        className={`fer-chip${aba !== "todos" ? " is-active" : ""}`}
                        onClick={() => setAberto(aberto === "tipo" ? null : "tipo")}
                    >
                        Tipo de cadastro
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "tipo" ? (
                        <div className="ctt-menu">
                            <button type="button" className={aba === "todos" ? "is-sel" : ""} onClick={() => { setAba("todos"); setAberto(null); }}>Todos</button>
                            {TIPOS.map((tipo) => (
                                <button
                                    key={tipo.id}
                                    type="button"
                                    className={aba === tipo.id ? "is-sel" : ""}
                                    onClick={() => { setAba(tipo.id); setAberto(null); }}
                                >
                                    {capital(tipo.id)}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="ctt-drop">
                    <button
                        type="button"
                        className={`fer-chip${situacao !== "sem" ? " is-active" : ""}`}
                        onClick={() => setAberto(aberto === "sit" ? null : "sit")}
                    >
                        Situação
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "sit" ? (
                        <div className="ctt-menu">
                            {[["sem", "Todas"], ["excluidos", "Excluídos"], ["inativos", "Inativos"]].map(([id, nome]) => (
                                <button
                                    key={id}
                                    type="button"
                                    className={situacao === id ? "is-sel" : ""}
                                    onClick={() => { setSituacao(id); setAberto(null); }}
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
                        className={`fer-chip${filtros.municipio ? " is-active" : ""}`}
                        onClick={() => setAberto(aberto === "cidade" ? null : "cidade")}
                    >
                        Cidade
                        <ChevronDown size={14} />
                    </button>
                    {aberto === "cidade" ? (
                        <div className="ctt-menu">
                            <button type="button" className={!filtros.municipio ? "is-sel" : ""} onClick={() => { setFiltros((a) => ({ ...a, municipio: "" })); setAberto(null); }}>
                                Todas
                            </button>
                            {cidades.map((cidade) => (
                                <button
                                    key={cidade}
                                    type="button"
                                    className={filtros.municipio === cidade ? "is-sel" : ""}
                                    onClick={() => { setFiltros((a) => ({ ...a, municipio: cidade })); setAberto(null); }}
                                >
                                    {cidade}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="ctt-drop">
                    <button
                        type="button"
                        className={`fer-chip${filtros.uf || filtros.vendedor ? " is-active" : ""}`}
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
                                Vendedor
                                <input
                                    value={rascunho.vendedor}
                                    placeholder="Qualquer vendedor"
                                    onChange={(e) => setRascunho((a) => ({ ...a, vendedor: e.target.value }))}
                                />
                            </label>
                            <label>
                                Estado
                                <select
                                    value={rascunho.uf}
                                    onChange={(e) => setRascunho((a) => ({ ...a, uf: e.target.value }))}
                                >
                                    <option value="">Selecione</option>
                                    {["RJ", "SP", "MG", "ES"].map((uf) => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="ctt-menu-acoes">
                                <button type="button" className="idx-pill int-add" onClick={() => { setFiltros(rascunho); setAberto(null); }}>
                                    aplicar
                                </button>
                                <button type="button" className="ctt-ghost" onClick={() => setAberto(null)}>
                                    cancelar
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
                {temFiltro ? (
                    <button type="button" className="idx-text" onClick={limparFiltros}>
                        Limpar filtros
                    </button>
                ) : null}
                <button type="button" className="ctt-ghost ctt-export" onClick={() => exportarCsv(visiveis)}>
                    <Download size={15} />
                    Exportar
                </button>
            </div>

            <table className="fer-table ctt-table">
                <thead>
                    <tr>
                        <th className="ctt-check">
                            <input
                                type="checkbox"
                                checked={fatia.length > 0 && fatia.every((c) => marcados.includes(c.id))}
                                onChange={marcarPagina}
                                aria-label="Selecionar página"
                            />
                        </th>
                        <th>Tipo</th>
                        <th>
                            <button type="button" className="ctt-th" onClick={() => setOrdem("nome")}>
                                Nome {ordem === "nome" ? "↓" : ""}
                            </button>
                        </th>
                        <th>CPF/CNPJ</th>
                        <th>Cidade</th>
                        <th>Contato</th>
                        <th>Situação</th>
                        <th>
                            <button type="button" className="ctt-th" onClick={() => setOrdem("recentes")}>
                                Cadastro em
                            </button>
                        </th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {fatia.length ? fatia.map((c) => {
                        const quando = quandoCadastro(c.dataCadastro);
                        const tipo = (c.tipos || ["cliente"])[0];
                        return (
                        <tr key={c.id} className={marcados.includes(c.id) ? "is-sel" : ""}>
                            <td className="ctt-check">
                                <input
                                    type="checkbox"
                                    checked={marcados.includes(c.id)}
                                    onChange={() => toggleMarca(c.id)}
                                    aria-label={`Selecionar ${c.nome}`}
                                />
                            </td>
                            <td>
                                <span className={`ctt-tipo ctt-tipo-${tipo}`}>{capital(tipo)}</span>
                            </td>
                            <td className="ctt-nome-cell">
                                <Link to={`/contatos/${c.id}`} className="ctt-nome">
                                    {c.nome}
                                    {c.fantasia ? <small> / {c.fantasia}</small> : null}
                                </Link>
                            </td>
                            <td>
                                <span>{c.cpfCnpj || "—"}</span>
                                <small>#{c.id}</small>
                            </td>
                            <td>{c.municipio ? `${c.municipio}${c.uf ? ` - ${c.uf}` : ""}` : "—"}</td>
                            <td>
                                {c.celular || c.telefone || "—"}
                                {c.email ? <small>{c.email}</small> : null}
                            </td>
                            <td>
                                <span className={`ctt-sit ${c.ativo === false ? "is-off" : "is-on"}`}>
                                    {c.ativo === false ? "Inativo" : "Ativo"}
                                </span>
                            </td>
                            <td className="ctt-quando">
                                <span>{quando.data}</span>
                                <small>{quando.hora}</small>
                            </td>
                            <td className="ctt-row-menu">
                                <button type="button" onClick={() => navigate(`/contatos/${c.id}`)} aria-label="Ver">
                                    <Eye size={16} />
                                </button>
                                <button type="button" onClick={() => navigate(`/contatos/${c.id}`)} aria-label="Editar">
                                    <Pencil size={16} />
                                </button>
                                <button type="button" onClick={() => setMenuLinha(menuLinha === c.id ? null : c.id)} aria-label="Ações">
                                    <MoreVertical size={16} />
                                </button>
                                {menuLinha === c.id ? (
                                    <div className="ctt-menu is-row is-right">
                                        <button type="button" onClick={() => navigate(`/crm?contato=${c.id}`)}>incluir assunto no CRM</button>
                                        <button type="button" onClick={() => navigate("/orcamentos")}>fazer uma proposta</button>
                                        <button type="button" onClick={() => navigate(`${ROTAS.PEDIDO_VENDA}#list`)}>criar um pedido de venda</button>
                                        <button type="button" onClick={() => imprimirFicha(c)}>imprimir ficha cadastral</button>
                                        <hr />
                                        <button type="button" onClick={() => navigate(`/contatos/${c.id}`)}>editar</button>
                                        <button type="button" onClick={() => excluir(c.id)}>excluir</button>
                                    </div>
                                ) : null}
                            </td>
                        </tr>
                        );
                    }) : (
                        <tr>
                            <td colSpan={9} className="ctt-vazio">Nenhum cadastro encontrado.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="ctt-foot">
                <p>
                    Mostrando {visiveis.length ? inicio + 1 : 0} a {Math.min(inicio + porPagina, visiveis.length)} de {visiveis.length} registros
                </p>
                <label>
                    <select value={porPagina} onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }}>
                        {TAMANHOS.map((n) => (
                            <option key={n} value={n}>{n} por página</option>
                        ))}
                    </select>
                </label>
                <nav className="ctt-pag" aria-label="Páginas">
                    <button type="button" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)} aria-label="Anterior">
                        <ChevronLeft size={16} />
                    </button>
                    {paginas.map((n) => (
                        <button
                            key={n}
                            type="button"
                            className={n === paginaAtual ? "is-active" : ""}
                            onClick={() => setPagina(n)}
                        >
                            {n}
                        </button>
                    ))}
                    <button type="button" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)} aria-label="Próxima">
                        <ChevronRight size={16} />
                    </button>
                </nav>
            </div>

            <footer className="ctt-brand">
                <div>
                    <strong>TEM DE TUDO</strong>
                    <span>Papelaria, Presentes e Personalizados</span>
                </div>
                <p>Organizando ideias, realizando sonhos!</p>
                <em>“Pequenos detalhes fazem grandes histórias!”</em>
            </footer>


            {marcados.length ? (
                <div className="ctt-lote">
                    <button type="button" className="idx-pill int-add" onClick={imprimirEtiquetas}>
                        <Printer size={14} />
                        imprimir etiquetas
                    </button>
                    <button type="button" className="ctt-ghost" onClick={excluirLote}>
                        <Trash2 size={14} />
                        excluir cadastros
                    </button>
                    <div className="ctt-drop">
                        <button
                            type="button"
                            className={`ctt-ghost${aberto === "lote" ? " is-on" : ""}`}
                            onClick={() => setAberto(aberto === "lote" ? null : "lote")}
                        >
                            <MoreVertical size={14} />
                            mais ações
                        </button>
                        {aberto === "lote" ? (
                            <div className="ctt-menu ctt-menu-up">
                                <button type="button" onClick={imprimirEtiquetas}>imprimir etiquetas</button>
                                <button type="button" onClick={excluirLote}>excluir cadastros</button>
                                <button type="button" onClick={() => { setPainel("vendedor"); setAberto(null); }}>vincular a vendedor</button>
                                <button type="button" onClick={() => { setPainel("precos"); setAberto(null); }}>vincular a lista de preços</button>
                                <button type="button" onClick={() => { setPainel("tipo"); setAberto(null); }}>definir tipo de contato</button>
                                <button type="button" onClick={unificar}>unificar cadastros</button>
                                <button type="button" onClick={() => { exportarCsv(selecionados()); setAberto(null); }}>exportar para o SIGEP</button>
                                <button type="button" onClick={() => { setPainel("empresas"); setAberto(null); }}>enviar cadastros para empresas</button>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {painel === "vendedor" ? (
                <div className="ctt-sheet">
                    <h3>Vincular Contatos a Vendedor</h3>
                    <label>
                        Vendedor
                        <input value={vendedorLote} onChange={(e) => setVendedorLote(e.target.value)} />
                    </label>
                    <div className="ctt-menu-acoes">
                        <button type="button" className="idx-pill int-add" onClick={vincularVendedor}>vincular ao vendedor</button>
                        <button type="button" className="ctt-ghost" onClick={() => setPainel(null)}>cancelar</button>
                    </div>
                </div>
            ) : null}

            {painel === "precos" ? (
                <div className="ctt-modal-bg" onClick={() => setPainel(null)}>
                    <div className="ctt-modal" onClick={(e) => e.stopPropagation()}>
                        <header>
                            <h3>Vincular lista de preços</h3>
                            <button type="button" className="ctt-ghost" onClick={() => setPainel(null)}>fechar <X size={14} /></button>
                        </header>
                        <p className="ctt-info">{LISTAS_PRECO.length ? "Selecione uma lista." : "Não há listas de preços cadastradas"}</p>
                        <button type="button" className="idx-pill int-add" onClick={() => setPainel(null)}>vincular</button>
                    </div>
                </div>
            ) : null}

            {painel === "tipo" ? (
                <aside className="ctt-drawer">
                    <header>
                        <h3>Definir tipo de contato</h3>
                        <button type="button" className="ctt-ghost" onClick={() => setPainel(null)}>fechar <X size={14} /></button>
                    </header>
                    <label>
                        Tipo de contato
                        <select value={tipoLote} onChange={(e) => setTipoLote(e.target.value)}>
                            {TIPOS.map((t) => (
                                <option key={t.id} value={t.id}>{t.nome.charAt(0).toUpperCase() + t.nome.slice(1)}</option>
                            ))}
                        </select>
                    </label>
                    <button type="button" className="idx-pill int-add" onClick={definirTipo}>confirmar</button>
                </aside>
            ) : null}

            {painel === "empresas" ? (
                <aside className="ctt-drawer">
                    <header>
                        <h3>Enviar contatos para empresas</h3>
                        <button type="button" className="ctt-ghost" onClick={() => setPainel(null)}>fechar <X size={14} /></button>
                    </header>
                    <label>
                        Enviar contatos para
                        <input placeholder="Selecionar empresas" readOnly />
                    </label>
                    <label className="ctt-check-line">
                        <input
                            type="checkbox"
                            checked={empresasLote.length === EMPRESAS.length}
                            onChange={(e) => setEmpresasLote(e.target.checked ? EMPRESAS.map((x) => x.id) : [])}
                        />
                        Selecionar todas
                    </label>
                    {EMPRESAS.map((emp) => (
                        <label key={emp.id} className="ctt-check-line">
                            <input
                                type="checkbox"
                                checked={empresasLote.includes(emp.id)}
                                onChange={() => setEmpresasLote((atual) => (
                                    atual.includes(emp.id) ? atual.filter((x) => x !== emp.id) : [...atual, emp.id]
                                ))}
                            />
                            {emp.nome}
                        </label>
                    ))}
                    <table className="fer-table">
                        <thead>
                            <tr>
                                <th>Contato</th>
                                <th>CPF/CNPJ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selecionados().map((c) => (
                                <tr key={c.id}>
                                    <td>{c.nome}</td>
                                    <td>{c.cpfCnpj || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="ctt-menu-acoes">
                        <button type="button" className="idx-pill int-add" onClick={() => { setPainel(null); setEmpresasLote([]); }}>enviar contatos</button>
                        <button type="button" className="ctt-ghost" onClick={() => setPainel(null)}>cancelar</button>
                    </div>
                </aside>
            ) : null}

            <ImportadorMassa
                aberto={importadorMassa}
                ocupado={importando}
                onFechar={() => setImportadorMassa(false)}
                titulo="Importar contatos Tiny"
                descricao="Selecione várias planilhas de contatos do Tiny (.xls/.xlsx) de uma vez."
                dica="Vários Excel: contatos_1-500.xls, contatos_501-1000.xls…"
                aceitos=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                permitirXml={false}
                rotuloItem="cadastros"
                lerExcel={lerPlanilhaContatos}
                mesclar={mesclarContatos}
                importarLote={importarClientesLote}
                onConcluido={async (mensagem) => {
                    setAviso(mensagem);
                    await carregarContatos();
                }}
            />
        </div>
    );
}

export default function ClientesFornecedores() {
    const { hash, pathname } = useLocation();
    if (pathname === "/contatos" && (!hash || hash === "#")) {
        return <Navigate to="/contatos#/" replace />;
    }
    return <ListaContatos />;
}
