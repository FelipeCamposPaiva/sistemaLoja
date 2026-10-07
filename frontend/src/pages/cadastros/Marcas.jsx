import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowUpDown,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Download,
    Factory,
    FileSpreadsheet,
    Globe,
    History,
    Package,
    PauseCircle,
    Phone,
    Plus,
    Search,
    Tags,
    Upload,
    X
} from "lucide-react";

import ROTAS from "../../constants/rotas";
import { MARCAS_CATALOGO, nomesDeArquivoMarcas } from "../../constants/marcasCatalogo";
import useAuth from "../../hooks/useAuth";
import { listarProdutos } from "../../services/produto.service";
import { urlMidia } from "../../services/produtoMidia.service";
import {
    atualizarMarca,
    buscarLogosNaWeb,
    enviarLogoMarca,
    importarMarcas,
    listarMarcas,
    removerLogoMarca,
    salvarMarca
} from "../../services/marca.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/marcas.css";

const TAMANHOS = [10, 20, 50];
const HIST_KEY = "erp-marcas-import-hist-v1";

function codigoDe(marca) {
    if (marca.codigo) {
        return marca.codigo;
    }
    return `M-${marca.id}`;
}

function lerHistoricoImport() {
    try {
        const bruto = JSON.parse(localStorage.getItem(HIST_KEY) || "[]");
        return Array.isArray(bruto) ? bruto : [];
    } catch {
        return [];
    }
}

function gravarHistoricoImport(item) {
    const lista = [item, ...lerHistoricoImport()].slice(0, 20);
    localStorage.setItem(HIST_KEY, JSON.stringify(lista));
    return lista;
}

function baixarModeloCsv() {
    const csv = "Nome;Fabricante;Descricao;Telefone;Situacao\n3M;3M do Brasil;;;Ativo\nBIC;BIC Brasil;;;Ativo\n";
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-marcas.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function paraData(bruto) {
    if (!bruto) {
        return null;
    }
    const d = bruto instanceof Date ? bruto : new Date(bruto);
    return Number.isNaN(d.getTime()) ? null : d;
}

function formatarQuando(bruto) {
    const d = paraData(bruto);
    if (!d) {
        return { data: "—", hora: "" };
    }
    return {
        data: d.toLocaleDateString("pt-BR"),
        hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
}

function instanteDe(marca, campo) {
    if (campo === "atualizacao") {
        return marca.atualizadoEm || marca.atualizado_em || marca.criadoEm || marca.criado_em || "";
    }
    return marca.criadoEm || marca.criado_em || marca.dataCadastro || "";
}

function csvValor(valor) {
    return `"${String(valor ?? "").replaceAll("\"", "\"\"")}"`;
}

function exportarCsv(lista) {
    const linhas = [[
        "Código",
        "Nome",
        "Fabricante",
        "Descrição",
        "Telefone",
        "Situação",
        "Data de cadastro",
        "Hora de cadastro",
        "Cadastrado por",
        "Data de atualização",
        "Hora de atualização",
        "Atualizado por"
    ].join(";")];
    lista.forEach((marca) => {
        const cadastro = formatarQuando(instanteDe(marca, "cadastro"));
        const atualizacao = formatarQuando(instanteDe(marca, "atualizacao"));
        linhas.push([
            codigoDe(marca),
            marca.nome,
            marca.fabricante,
            marca.descricao,
            marca.telefone,
            ativa(marca) ? "Ativo" : "Inativo",
            cadastro.data,
            cadastro.hora,
            marca.criadoPor || "",
            atualizacao.data,
            atualizacao.hora,
            marca.atualizadoPor || ""
        ].map(csvValor).join(";"));
    });
    const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marcas.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function Quando({ valor, usuario }) {
    const { data, hora } = formatarQuando(valor);
    return (
        <span className="mrc-quando">
            {data}
            {hora ? <small>{hora}</small> : null}
            {usuario ? <small>{usuario}</small> : null}
        </span>
    );
}

function ativa(marca) {
    return marca.ativo !== false && marca.ativo !== 0;
}

const FORM_VAZIO = {
    nome: "",
    fabricante: "",
    descricao: "",
    logo: "",
    site: "",
    email: "",
    telefone: "",
    ativo: true
};

export default function Marcas() {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const { hash, pathname, state } = useLocation();
    const [params] = useSearchParams();
    const [marcas, setMarcas] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aviso, setAviso] = useState("");
    const [busca, setBusca] = useState(() => params.get("q") || "");

    useEffect(() => {
        const q = params.get("q");
        if (q) {
            setBusca(q);
        }
    }, [params]);
    const [situacao, setSituacao] = useState("todas");
    const [ordem, setOrdem] = useState({ campo: "nome", dir: 1 });
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);
    const [marcados, setMarcados] = useState([]);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(FORM_VAZIO);
    const [salvando, setSalvando] = useState(false);
    const [aberto, setAberto] = useState(null);
    const [importando, setImportando] = useState(false);
    const [colar, setColar] = useState("");
    const [historico, setHistorico] = useState(() => lerHistoricoImport());
    const [logoArquivo, setLogoArquivo] = useState(null);
    const [logoPreview, setLogoPreview] = useState("");
    const arquivoRef = useRef(null);
    const logoRef = useRef(null);
    const modalRef = useRef(null);
    modalRef.current = modal;

    async function carregar(autoCatalogo = false) {
        setLoading(true);
        try {
            let dados = await listarMarcas();
            if (autoCatalogo && Array.isArray(dados) && dados.length === 0) {
                await importarMarcas(MARCAS_CATALOGO);
                dados = await listarMarcas();
            }
            setMarcas(Array.isArray(dados) ? dados : []);
            setAviso("");
        } catch {
            setMarcas([]);
            setAviso("Não foi possível ler as marcas no servidor.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregar(true);
        listarProdutos().then((lista) => setProdutos(Array.isArray(lista) ? lista : [])).catch(() => setProdutos([]));
    }, []);

    async function aplicarImportacao(nomes, origem) {
        if (!nomes.length) {
            setAviso("Nenhuma marca para importar.");
            return;
        }
        setImportando(true);
        setAberto(null);
        try {
            const resumo = await importarMarcas(nomes);
            await carregar(false);
            const novos = resumo.novos ?? 0;
            const ignorados = resumo.ignorados ?? 0;
            setHistorico(gravarHistoricoImport({
                quando: new Date().toISOString(),
                origem,
                novos,
                ignorados,
                usuario: usuario?.nome || usuario?.usuario || ""
            }));
            setAviso(novos
                ? `${novos} marca(s) importada(s)${ignorados ? ` · ${ignorados} já existiam` : ""} (${origem}).`
                : `Nenhuma marca nova. ${ignorados} já estavam cadastradas.`);
        } catch {
            setAviso("Não foi possível importar as marcas.");
        } finally {
            setImportando(false);
        }
    }

    function importarArquivo(arquivo) {
        if (!arquivo) {
            return;
        }
        const leitor = new FileReader();
        leitor.onload = () => aplicarImportacao(nomesDeArquivoMarcas(String(leitor.result || "")), arquivo.name);
        leitor.readAsText(arquivo);
    }

    async function buscarLogos() {
        setAberto(null);
        setImportando(true);
        try {
            const resumo = await buscarLogosNaWeb();
            await carregar(false);
            const baixados = resumo.baixados ?? 0;
            const gerados = resumo.gerados ?? 0;
            const produtos = resumo.produtos ?? 0;
            setAviso(`${baixados} logo(s) da internet e ${gerados} gerado(s). ${produtos} produto(s) receberam a imagem da marca.`);
        } catch {
            setAviso("Não foi possível buscar os logos na internet.");
        } finally {
            setImportando(false);
        }
    }

    const contagem = useMemo(() => {
        const porId = new Map();
        const porNome = new Map();
        for (const p of produtos) {
            if (p.marcaId) {
                const chave = String(p.marcaId);
                porId.set(chave, (porId.get(chave) || 0) + 1);
            }
            const nome = String(p.marca || "").trim().toLowerCase();
            if (nome) {
                porNome.set(nome, (porNome.get(nome) || 0) + 1);
            }
        }
        return { porId, porNome };
    }, [produtos]);

    function qtdDe(marca) {
        const porId = contagem.porId.get(String(marca?.id || "")) || 0;
        const porNome = contagem.porNome.get(String(marca?.nome || "").trim().toLowerCase()) || 0;
        return Math.max(porId, porNome, Number(marca?.qtdProdutos || 0));
    }

    const filtradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const lista = marcas.filter((marca) => {
            if (situacao === "ativo" && !ativa(marca)) {
                return false;
            }
            if (situacao === "inativo" && ativa(marca)) {
                return false;
            }
            if (situacao === "com-produtos" && qtdDe(marca) <= 0) {
                return false;
            }
            if (situacao === "sem-produtos" && qtdDe(marca) > 0) {
                return false;
            }
            if (!termo) {
                return true;
            }
            const noCadastro = [marca.nome, marca.descricao, marca.fabricante, marca.telefone]
                .join(" ")
                .toLowerCase()
                .includes(termo);
            if (noCadastro) {
                return true;
            }
            return produtos.some((p) => String(p.marcaId) === String(marca.id) && String(p.nome || "").toLowerCase().includes(termo));
        });
        const { campo, dir } = ordem;
        return [...lista].sort((a, b) => {
            const valor = (marca) => {
                if (campo === "produtos") {
                    return qtdDe(marca);
                }
                if (campo === "fabricante") {
                    return marca.fabricante || "";
                }
                if (campo === "data") {
                    return instanteDe(marca, "cadastro");
                }
                if (campo === "atualizacao") {
                    return instanteDe(marca, "atualizacao");
                }
                if (campo === "situacao") {
                    return Number(ativa(marca));
                }
                return marca.nome || "";
            };
            const va = valor(a);
            const vb = valor(b);
            if (typeof va === "number" && typeof vb === "number") {
                return (va - vb) * dir;
            }
            return String(va).localeCompare(String(vb), "pt-BR", { numeric: true }) * dir;
        });
    }, [marcas, busca, situacao, ordem, produtos, contagem]);

    const total = marcas.length;
    const ativas = marcas.filter(ativa).length;
    const inativas = total - ativas;
    const produtosVinculados = marcas.reduce((s, m) => s + qtdDe(m), 0);
    const paginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
    const paginaAtual = Math.min(pagina, paginas);
    const inicio = (paginaAtual - 1) * porPagina;
    const visiveis = filtradas.slice(inicio, inicio + porPagina);

    function ordenar(campo) {
        setOrdem((atual) => ({
            campo,
            dir: atual.campo === campo ? -atual.dir : 1
        }));
    }

    function irLista(replace = true) {
        navigate({ pathname: "/marcas", hash: "list" }, { replace });
    }

    function limparFormulario() {
        setForm(FORM_VAZIO);
        setLogoArquivo(null);
        setLogoPreview("");
    }

    function abrirNovo() {
        limparFormulario();
        setModal({ modo: "editar" });
        navigate({ pathname: "/marcas", hash: "edit" });
    }

    function abrir(marca, modo) {
        setForm({ ...FORM_VAZIO, ...marca, ativo: ativa(marca) });
        setLogoArquivo(null);
        setLogoPreview(marca.logo || "");
        setModal({ modo, marca });
        navigate({ pathname: "/marcas", hash: `edit/${marca.id}` }, { state: { modo } });
    }

    function fecharModal() {
        setModal(null);
        limparFormulario();
        irLista();
    }

    function aplicarCard(card) {
        setPagina(1);
        setSituacao(card);
    }

    useEffect(() => {
        const bruto = String(hash || "");
        const editar = bruto.match(/^#edit\/([^/?#]+)/);
        if (bruto === "#edit" || bruto === "#novo") {
            const atual = modalRef.current;
            if (atual && !atual.marca) {
                return;
            }
            limparFormulario();
            setModal({ modo: "editar" });
            return;
        }
        if (editar) {
            const id = editar[1];
            const marca = marcas.find((item) => String(item.id) === String(id));
            if (!marca) {
                if (!loading) {
                    setAviso("Marca não encontrada.");
                    irLista();
                }
                return;
            }
            const modo = "editar";
            const atual = modalRef.current;
            if (atual?.marca?.id === marca.id && atual?.modo === modo) {
                return;
            }
            setForm({ ...FORM_VAZIO, ...marca, ativo: ativa(marca) });
            setLogoArquivo(null);
            setLogoPreview(marca.logo || "");
            setModal({ modo, marca });
            return;
        }
        if (modalRef.current) {
            setModal(null);
            limparFormulario();
        }
    }, [hash, marcas, loading, state, pathname]);

    function escolherLogo(arquivo) {
        if (!arquivo) {
            return;
        }
        if (!arquivo.type.startsWith("image/")) {
            setAviso("Selecione uma imagem JPG, PNG ou WEBP.");
            return;
        }
        setLogoArquivo(arquivo);
        setLogoPreview(URL.createObjectURL(arquivo));
    }

    async function salvar() {
        if (!form.nome.trim()) {
            setAviso("Informe o nome da marca.");
            return;
        }
        setSalvando(true);
        try {
            const quem = usuario?.nome || usuario?.usuario || "";
            const payload = {
                ...form,
                nome: form.nome.trim(),
                atualizadoPor: quem,
                criadoPor: form.criadoPor || quem
            };
            let salvo = modal?.marca;
            if (modal?.marca?.id) {
                salvo = await atualizarMarca(modal.marca.id, payload);
            } else {
                salvo = await salvarMarca(payload);
            }
            const id = salvo?.id || modal?.marca?.id;
            if (id && logoArquivo) {
                await enviarLogoMarca(id, logoArquivo);
            } else if (id && modal?.marca?.logo && !logoPreview) {
                await removerLogoMarca(id);
            }
            fecharModal();
            await carregar();
            setAviso("Marca salva.");
        } catch {
            setAviso("Não foi possível salvar a marca.");
        } finally {
            setSalvando(false);
        }
    }

    function toggleMarca(id) {
        setMarcados((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    }

    const leitura = modal?.modo === "ver";

    return (
        <div className="ctt-page ctt-loja mrc-page has-pager">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <Link to="/contatos#/">Cadastros</Link>
                <span>›</span>
                <Link to={ROTAS.MARCAS}>Marcas</Link>
            </nav>

            <div className="ctt-hero">
                <div>
                    <h2>Marcas de Produtos</h2>
                    <p className="ctt-sub">Cadastre e gerencie as marcas dos seus produtos.</p>
                    {aviso ? <p className={`ctt-sub ${aviso.includes("Não") ? "ctt-erro" : "ctt-ok"}`}>{aviso}</p> : null}
                </div>
                <div className="ctt-acoes">
                    <input
                        ref={arquivoRef}
                        type="file"
                        accept=".csv,.txt,.tsv"
                        hidden
                        onChange={(e) => {
                            importarArquivo(e.target.files?.[0]);
                            e.target.value = "";
                        }}
                    />
                    <div className="ctt-drop">
                        <button
                            type="button"
                            className="mrc-acoes-cancelar mrc-importar"
                            disabled={importando}
                            onClick={() => setAberto(aberto === "importar" ? null : "importar")}
                        >
                            <Upload size={15} />
                            {importando ? "importando…" : "Importar"}
                            <ChevronDown size={14} />
                        </button>
                        {aberto === "importar" ? (
                            <div className="ctt-menu is-right">
                                <button type="button" onClick={() => aplicarImportacao(MARCAS_CATALOGO, "catálogo Tem de Tudo")}>
                                    <ClipboardList size={14} /> catálogo Tem de Tudo ({MARCAS_CATALOGO.length})
                                </button>
                                <button type="button" onClick={() => arquivoRef.current?.click()}>
                                    <FileSpreadsheet size={14} /> Importar marcas por CSV
                                </button>
                                <button type="button" onClick={baixarModeloCsv}>
                                    <Download size={14} /> Baixar modelo CSV
                                </button>
                                <button type="button" onClick={() => { setColar(""); setAberto("colar"); }}>
                                    <ClipboardList size={14} /> colar lista de nomes
                                </button>
                                <button type="button" onClick={() => setAberto("historico")}>
                                    <History size={14} /> Histórico de importações
                                </button>
                                <button type="button" onClick={buscarLogos} disabled={importando}>
                                    <Globe size={14} /> buscar logos na internet
                                </button>
                            </div>
                        ) : null}
                    </div>
                    <button type="button" className="ctt-btn-incluir mrc-incluir" onClick={abrirNovo}>
                        <Plus size={16} /> Incluir marca
                    </button>
                </div>
            </div>

            <div className="fer-filtros ctt-filtros mrc-filtros">
                <label className="fer-search mrc-busca">
                    <Search size={16} />
                    <input
                        value={busca}
                        onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                        placeholder="Pesquisar por marca, fabricante ou produto..."
                        aria-label="Pesquisar marcas"
                    />
                    {busca ? (
                        <button type="button" className="mrc-limpar" onClick={() => setBusca("")} aria-label="Limpar busca">
                            <X size={14} />
                        </button>
                    ) : null}
                </label>
                <label className="mrc-sit">
                    <select
                        value={situacao}
                        onChange={(e) => { setSituacao(e.target.value); setPagina(1); }}
                        aria-label="Situação"
                    >
                        <option value="todas">Todas</option>
                        <option value="ativo">Ativas</option>
                        <option value="inativo">Inativas</option>
                        <option value="com-produtos">Com produtos</option>
                        <option value="sem-produtos">Sem produtos</option>
                    </select>
                </label>
                <button
                    type="button"
                    className="ctt-ghost ctt-export"
                    onClick={() => exportarCsv(marcados.length ? marcas.filter((m) => marcados.includes(m.id)) : filtradas)}
                >
                    <Download size={15} />
                    Exportar
                </button>
            </div>

            <div className="ctt-cards mrc-kpis">
                <button
                    type="button"
                    className={`ctt-card ctt-card-rosa${situacao === "todas" ? " is-active" : ""}`}
                    onClick={() => aplicarCard("todas")}
                >
                    <span className="ctt-card-ico"><Tags size={16} /></span>
                    <strong>{total.toLocaleString("pt-BR")}</strong>
                    <small>Total de marcas</small>
                </button>
                <button
                    type="button"
                    className={`ctt-card ctt-card-verde${situacao === "ativo" ? " is-active" : ""}`}
                    onClick={() => aplicarCard("ativo")}
                >
                    <span className="ctt-card-ico"><Tags size={16} /></span>
                    <strong>{ativas.toLocaleString("pt-BR")}</strong>
                    <small>Ativas</small>
                </button>
                <button
                    type="button"
                    className={`ctt-card ctt-card-lilas${situacao === "inativo" ? " is-active" : ""}`}
                    onClick={() => aplicarCard("inativo")}
                >
                    <span className="ctt-card-ico"><PauseCircle size={16} /></span>
                    <strong>{inativas.toLocaleString("pt-BR")}</strong>
                    <small>Inativas</small>
                </button>
                <button
                    type="button"
                    className={`ctt-card ctt-card-pink${situacao === "com-produtos" ? " is-active" : ""}`}
                    onClick={() => aplicarCard("com-produtos")}
                >
                    <span className="ctt-card-ico"><Package size={16} /></span>
                    <strong>{produtosVinculados.toLocaleString("pt-BR")}</strong>
                    <small>Produtos vinculados</small>
                </button>
            </div>

            <div className="os-scroll mrc-tabela">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th className="ctt-check">
                                <input
                                    type="checkbox"
                                    checked={visiveis.length > 0 && visiveis.every((m) => marcados.includes(m.id))}
                                    onChange={() => {
                                        const ids = visiveis.map((m) => m.id);
                                        const todos = ids.every((id) => marcados.includes(id));
                                        setMarcados(todos ? marcados.filter((id) => !ids.includes(id)) : [...new Set([...marcados, ...ids])]);
                                    }}
                                    aria-label="Selecionar todas"
                                />
                            </th>
                            <th>
                                <button type="button" className="mrc-ord" onClick={() => ordenar("nome")}>
                                    Marca <ArrowUpDown size={12} />
                                </button>
                            </th>
                            <th>
                                <button type="button" className="mrc-ord" onClick={() => ordenar("fabricante")}>
                                    Fabricante <ArrowUpDown size={12} />
                                </button>
                            </th>
                            <th>
                                <button type="button" className="mrc-ord" onClick={() => ordenar("produtos")}>
                                    Produtos <ArrowUpDown size={12} />
                                </button>
                            </th>
                            <th>
                                <button type="button" className="mrc-ord" onClick={() => ordenar("situacao")}>
                                    Situação <ArrowUpDown size={12} />
                                </button>
                            </th>
                            <th>
                                <button type="button" className="mrc-ord" onClick={() => ordenar("data")}>
                                    Cadastro <ArrowUpDown size={12} />
                                </button>
                            </th>
                            <th>
                                <button type="button" className="mrc-ord" onClick={() => ordenar("atualizacao")}>
                                    Atualização <ArrowUpDown size={12} />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="ctt-vazio">Carregando marcas...</td></tr>
                        ) : visiveis.length === 0 ? (
                            <tr><td colSpan={7} className="ctt-vazio">Nenhuma marca encontrada.</td></tr>
                        ) : visiveis.map((marca) => (
                            <tr
                                key={marca.id}
                                className={`mrc-linha${marcados.includes(marca.id) ? " is-sel" : ""}`}
                                onClick={() => abrir(marca, "editar")}
                            >
                                <td className="ctt-check" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={marcados.includes(marca.id)}
                                        onChange={() => toggleMarca(marca.id)}
                                    />
                                </td>
                                <td>
                                    <span className="mrc-nome">
                                        {marca.logo ? (
                                            <img src={urlMidia(marca.logo)} alt="" />
                                        ) : (
                                            <i aria-hidden>{String(marca.nome || "?").charAt(0)}</i>
                                        )}
                                        {marca.nome}
                                    </span>
                                </td>
                                <td>{marca.fabricante || marca.nome || "—"}</td>
                                <td>
                                    <span
                                        className="mrc-qtd"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`${ROTAS.PRODUTOS}?marca=${encodeURIComponent(marca.nome || "")}&marcaId=${marca.id}`);
                                        }}
                                    >
                                        {qtdDe(marca).toLocaleString("pt-BR")}
                                    </span>
                                </td>
                                <td>
                                    <span className={`mrc-dot${ativa(marca) ? " is-on" : ""}`}>
                                        {ativa(marca) ? "Ativo" : "Inativo"}
                                    </span>
                                </td>
                                <td>
                                    <Quando valor={instanteDe(marca, "cadastro")} usuario={marca.criadoPor} />
                                </td>
                                <td>
                                    <Quando valor={instanteDe(marca, "atualizacao")} usuario={marca.atualizadoPor} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="loc-pagina">
                <span>
                    Mostrando {filtradas.length ? inicio + 1 : 0} a {Math.min(inicio + visiveis.length, filtradas.length)} de {filtradas.length} marcas
                </span>
                <nav className="erp-pager-nav" aria-label="Páginas">
                    <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina(paginaAtual - 1)} aria-label="Anterior">
                        <ChevronLeft size={14} />
                    </button>
                    <button type="button" className="is-on">{paginaAtual}</button>
                    <button type="button" disabled={paginaAtual >= paginas} onClick={() => setPagina(paginaAtual + 1)} aria-label="Próxima">
                        <ChevronRight size={14} />
                    </button>
                </nav>
                <label className="erp-pager-size">
                    <select value={porPagina} onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }} aria-label="Itens por página">
                        {TAMANHOS.map((n) => (
                            <option key={n} value={n}>{n} por página</option>
                        ))}
                    </select>
                </label>
            </div>

            {aberto === "colar" ? (
                <div className="pv-modal-bg" onClick={() => setAberto(null)}>
                    <div className="pv-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Colar lista de marcas</h3>
                        <p className="ctt-sub">Um nome por linha, ou separado por ponto e vírgula.</p>
                        <label>
                            Nomes
                            <textarea
                                rows={10}
                                value={colar}
                                onChange={(e) => setColar(e.target.value)}
                                placeholder={"BIC\nTILIBRA\nFABER-CASTELL"}
                            />
                        </label>
                        <div className="ctt-menu-acoes">
                            <button
                                type="button"
                                className="ctt-btn-incluir mrc-incluir"
                                disabled={importando}
                                onClick={() => aplicarImportacao(nomesDeArquivoMarcas(colar), "lista colada")}
                            >
                                importar
                            </button>
                            <button type="button" className="mrc-acoes-cancelar" onClick={() => setAberto(null)}>cancelar</button>
                        </div>
                    </div>
                </div>
            ) : null}

            {aberto === "historico" ? (
                <div className="pv-modal-bg" onClick={() => setAberto(null)}>
                    <div className="pv-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Histórico de importações</h3>
                        {historico.length === 0 ? (
                            <p className="ctt-sub">Nenhuma importação registrada neste navegador.</p>
                        ) : (
                            <ul className="mrc-hist">
                                {historico.map((item, i) => (
                                    <li key={`${item.quando}-${i}`}>
                                        <strong>{item.origem}</strong>
                                        <span>{new Date(item.quando).toLocaleString("pt-BR")} · {item.usuario || "—"}</span>
                                        <small>{item.novos} novas · {item.ignorados} já existiam</small>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="ctt-menu-acoes">
                            <button type="button" className="mrc-acoes-cancelar" onClick={() => setAberto(null)}>Fechar</button>
                        </div>
                    </div>
                </div>
            ) : null}

            {modal ? (
                <div className="pv-modal-bg" onClick={fecharModal}>
                    <div className="mrc-modal" onClick={(e) => e.stopPropagation()}>
                        <header className="mrc-modal-head">
                            <button type="button" className="mrc-voltar" onClick={fecharModal} aria-label="Voltar">
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h3>{modal.marca ? "Editar marca" : "Incluir marca"}</h3>
                            </div>
                            <button type="button" className="mrc-modal-x" onClick={fecharModal} aria-label="Fechar">
                                <X size={18} />
                            </button>
                        </header>

                        <div className="mrc-campo">
                            Logo da marca
                            <div className="mrc-logo-edit">
                            <label
                                className={`mrc-logo-mini${leitura ? " is-off" : ""}`}
                                onDragOver={(e) => {
                                    if (!leitura) {
                                        e.preventDefault();
                                    }
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (!leitura) {
                                        escolherLogo(e.dataTransfer.files?.[0]);
                                    }
                                }}
                            >
                                {logoPreview ? (
                                    <img src={urlMidia(logoPreview)} alt="Logo da marca" />
                                ) : (
                                    <span>{String(form.nome || "?").charAt(0)}</span>
                                )}
                                <input
                                    ref={logoRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    hidden
                                    disabled={leitura}
                                    onChange={(e) => {
                                        escolherLogo(e.target.files?.[0]);
                                        e.target.value = "";
                                    }}
                                />
                            </label>
                            {leitura ? null : (
                                <button type="button" className="idx-text" onClick={() => logoRef.current?.click()}>
                                    Alterar imagem
                                </button>
                            )}
                            </div>
                        </div>

                        <label className="mrc-campo">
                            Nome da marca *
                            <span>
                                <Tags size={15} />
                                <input
                                    value={form.nome}
                                    disabled={leitura}
                                    placeholder="Ex.: 3M, ACRILEX, Tilibra..."
                                    onChange={(e) => setForm((a) => ({ ...a, nome: e.target.value }))}
                                />
                            </span>
                        </label>
                        <label className="mrc-campo">
                            Fabricante
                            <span>
                                <Factory size={15} />
                                <input
                                    value={form.fabricante}
                                    disabled={leitura}
                                    placeholder="Pode ser diferente da marca"
                                    onChange={(e) => setForm((a) => ({ ...a, fabricante: e.target.value }))}
                                />
                            </span>
                        </label>
                        <label className="mrc-campo">
                            Descrição
                            <textarea
                                rows={3}
                                value={form.descricao}
                                disabled={leitura}
                                placeholder="Observações da marca"
                                onChange={(e) => setForm((a) => ({ ...a, descricao: e.target.value }))}
                            />
                        </label>
                        <label className="mrc-campo">
                            Telefone
                            <span>
                                <Phone size={15} />
                                <input
                                    value={form.telefone}
                                    disabled={leitura}
                                    placeholder="(00) 00000-0000"
                                    onChange={(e) => setForm((a) => ({ ...a, telefone: e.target.value }))}
                                />
                            </span>
                        </label>
                        <label className="mrc-campo">
                            Situação
                            <select
                                value={form.ativo ? "ativo" : "inativo"}
                                disabled={leitura}
                                onChange={(e) => setForm((a) => ({ ...a, ativo: e.target.value === "ativo" }))}
                            >
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </label>

                        {modal.marca ? (
                            <div className="mrc-vinculos">
                                <strong>Produtos vinculados</strong>
                                <button
                                    type="button"
                                    className="idx-text"
                                    onClick={() => navigate(`${ROTAS.PRODUTOS}?marca=${encodeURIComponent(form.nome || modal.marca.nome || "")}&marcaId=${modal.marca.id}`)}
                                >
                                    {qtdDe(modal.marca).toLocaleString("pt-BR")} produtos
                                </button>
                            </div>
                        ) : null}

                        <div className="mrc-modal-foot">
                            <button type="button" className="mrc-acoes-cancelar" onClick={fecharModal}>
                                Cancelar
                            </button>
                            {leitura ? null : (
                                <button type="button" className="ctt-btn-incluir mrc-incluir" disabled={salvando} onClick={salvar}>
                                    {salvando ? "Salvando…" : "Salvar marca"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
