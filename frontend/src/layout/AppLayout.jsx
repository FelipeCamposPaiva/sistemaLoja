import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, Building2, ChevronDown, GripVertical, LifeBuoy, LogOut, Network, Pin, RotateCcw, Settings, Store, User } from "lucide-react";

import MENU, { itensComRelatorioNoFim, itensPlanos } from "../constants/menu";
import { AVISOS, gravarAvisosLidos, lerAvisosLidos } from "../constants/avisos";
import { CONTA_PREFS_EVT, corDe, lerConta, temaEscuroAtivo } from "../constants/conta";
import { definirUnidade, empresasDaConta, unidadeAtual, unidadePronta, UNIDADE_EVT } from "../constants/empresas";
import ROTAS from "../constants/rotas";
import useAuth from "../hooks/useAuth.jsx";
import logo from "../assets/logo/logo.svg";
import ChatGptWidget from "../components/ChatGptWidget";

import "../styles/layout/layout.css";
import "../styles/layout/content.css";
import "../styles/layout/app-shell.css";
import "../styles/pages/indice.css";
import "../styles/theme/search-focus.css";
import "../styles/theme/pager.css";

const MENU_FIXO_KEY = "erp-menu-fixo";
const MENU_ORDEM_KEY = "erp-menu-ordem";

function lerOrdemMenu() {
    try {
        const bruto = JSON.parse(localStorage.getItem(MENU_ORDEM_KEY) || "{}");
        return {
            travada: bruto.travada !== false,
            grupos: bruto.grupos && typeof bruto.grupos === "object" ? bruto.grupos : {}
        };
    } catch {
        return { travada: true, grupos: {} };
    }
}

function chaveItem(item) {
    return String(item?.rota || item?.nome || "");
}

function itensVisiveis(grupo, prefs) {
    const base = Array.isArray(grupo?.itens) ? grupo.itens : [];
    const salvo = prefs?.grupos?.[grupo?.id];
    if (!Array.isArray(salvo) || !salvo.length) {
        return itensComRelatorioNoFim(base);
    }
    const porChave = new Map(base.map((item) => [chaveItem(item), item]));
    const usados = new Set();
    const ordem = [];
    salvo.forEach((chave) => {
        const item = porChave.get(chave);
        if (item && !usados.has(chave)) {
            ordem.push(item);
            usados.add(chave);
        }
    });
    itensComRelatorioNoFim(base).forEach((item) => {
        const chave = chaveItem(item);
        if (!usados.has(chave)) {
            ordem.push(item);
        }
    });
    return ordem;
}

function ancoraRota(rota) {
    const texto = String(rota || "");
    const i = texto.indexOf("#");
    if (i < 0) {
        return "";
    }
    return texto.slice(i + 1).replace(/^\//, "");
}

function rotaAtiva(pathname, rota, hash = "") {
    if (!rota) {
        return false;
    }
    const caminho = String(rota).split("#")[0] || rota;
    const ancora = ancoraRota(rota);
    if (caminho === "/" || caminho === "/index") {
        return pathname === "/" || pathname === "/index";
    }
    if (caminho === "/loja-admin") {
        return pathname === "/loja-admin";
    }
    if (pathname === caminho) {
        if (!ancora || ancora === "list") {
            return true;
        }
        const atual = String(hash || "").replace(/^#/, "").replace(/^\//, "");
        return atual === ancora || atual.startsWith(`${ancora}/`);
    }
    if (caminho === "/ponto" || caminho === "/pdv") {
        return false;
    }
    if (caminho === "/ferramentas_geral" && pathname.startsWith("/ferramentas")) {
        return true;
    }
    if (caminho === "/preferencias_geral" && (pathname.startsWith("/preferencias") || pathname.startsWith("/configuracoes") || pathname === "/empresa" || pathname === "/dados_usuario" || pathname === "/usuarios_sistema" || pathname === "/parametros_envio_doc_geral" || pathname === "/interface_usuario" || pathname === "/multi_empresas" || pathname === "/aplicativos_api")) {
        return true;
    }
    return pathname.startsWith(`${caminho}/`) || (caminho === "/ordem_servicos" && pathname.startsWith("/os"));
}

function linkAtivo(isActive, pathname, rota, hash) {
    if (ancoraRota(rota)) {
        return rotaAtiva(pathname, rota, hash);
    }
    return Boolean(isActive) || rotaAtiva(pathname, rota, hash);
}

function grupoDaRota(pathname, hash = "") {
    if (pathname === "/loja-admin" || pathname.startsWith("/loja-admin/")) {
        return MENU.find((grupo) => grupo.id === "loja-virtual") || MENU[0];
    }
    let melhor = null;
    let tamanho = -1;
    MENU.forEach((grupo) => {
        itensPlanos(grupo).forEach((item) => {
            if (item.rota && rotaAtiva(pathname, item.rota, hash) && String(item.rota).length > tamanho) {
                melhor = grupo;
                tamanho = String(item.rota).length;
            }
        });
    });
    if (!melhor && pathname === "/dashboard") {
        return MENU.find((grupo) => grupo.id === "inicio") || MENU[0];
    }
    return melhor || MENU[0];
}

function iniciaisNome(nome) {
    const partes = String(nome || "?").trim().split(/\s+/);
    return ((partes[0]?.[0] || "?") + (partes[1]?.[0] || "")).toUpperCase();
}

function dadosConta(usuario) {
    const bruto = lerConta(usuario);
    return {
        nome: bruto.nome,
        empresa: unidadeAtual().nome,
        empresaId: unidadeAtual().id,
        cargo: bruto.cargo,
        foto: bruto.foto,
        cor: bruto.cor,
        tema: bruto.tema,
        notificacoes: bruto.notificacoes !== false
    };
}

function FlyoutLoja({ itens, pathname, hash }) {
    const ativoId = itens.find((item) =>
        item.filhos?.some((filho) => rotaAtiva(pathname, filho.rota, hash))
    )?.id;
    const [abertos, setAbertos] = useState(() => (ativoId ? [ativoId] : []));

    useEffect(() => {
        if (ativoId) {
            setAbertos((atual) => (atual.includes(ativoId) ? atual : [...atual, ativoId]));
        }
    }, [ativoId]);

    function toggle(id) {
        setAbertos((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
    }

    return (
        <div className="flyout-list flyout-loja-menu">
            {itensComRelatorioNoFim(itens).map((item) => {
                const Icon = item.icon;
                if (item.externo) {
                    return (
                        <a
                            key={item.id || item.nome}
                            className="flyout-link flyout-ver-loja"
                            href={item.rota}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {Icon ? <Icon size={16} strokeWidth={1.7} /> : null}
                            {item.nome}
                        </a>
                    );
                }
                if (item.filhos) {
                    const aberto = abertos.includes(item.id);
                    return (
                        <div key={item.id} className={`flyout-acc${aberto ? " is-open" : ""}`}>
                            <button type="button" className="flyout-acc-btn" onClick={() => toggle(item.id)}>
                                <span>
                                    {Icon ? <Icon size={16} strokeWidth={1.7} /> : null}
                                    {item.nome}
                                </span>
                                <ChevronDown size={14} />
                            </button>
                            {aberto ? (
                                <div className="flyout-sub">
                                    {itensComRelatorioNoFim(item.filhos).map((filho) => (
                                        <NavLink
                                            key={filho.rota}
                                            to={filho.rota}
                                            className={({ isActive }) =>
                                                `flyout-link${linkAtivo(isActive, pathname, filho.rota, hash) ? " is-active" : ""}`
                                            }
                                        >
                                            {filho.nome}
                                            <em className="flyout-beta">BETA</em>
                                        </NavLink>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    );
                }
                return (
                    <NavLink
                        key={item.id || item.rota}
                        to={item.rota === "/" ? "/index" : item.rota}
                        end={item.rota === "/loja-admin"}
                        className={({ isActive }) =>
                            `flyout-link${linkAtivo(isActive, pathname, item.rota, hash) ? " is-active" : ""}`
                        }
                    >
                        {Icon ? <Icon size={16} strokeWidth={1.7} /> : null}
                        {item.nome}
                        {item.externo ? null : <em className="flyout-beta">BETA</em>}
                    </NavLink>
                );
            })}
        </div>
    );
}

export default function AppLayout() {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname, hash } = useLocation();
    const pdv = pathname === "/pdv";
    const loja = true;
    const [grupoId, setGrupoId] = useState(() => grupoDaRota(pathname, hash).id);
    const [fixo, setFixo] = useState(() => {
        try {
            return localStorage.getItem(MENU_FIXO_KEY) !== "0";
        } catch {
            return true;
        }
    });
    const [painel, setPainel] = useState(null);
    const [menuOrdem, setMenuOrdem] = useState(lerOrdemMenu);
    const [arraste, setArraste] = useState("");
    const arrasteRef = useRef("");
    const [lidos, setLidos] = useState(lerAvisosLidos);
    const [contaTick, setContaTick] = useState(0);
    const shellRef = useRef(null);

    useEffect(() => {
        setGrupoId(grupoDaRota(pathname, hash).id);
        setPainel(null);
    }, [pathname, hash]);

    useEffect(() => {
        function sync() {
            const contaNova = lerConta(usuario);
            setContaTick((n) => n + 1);
            setFixo(contaNova.menu !== "compacto");
        }
        window.addEventListener(CONTA_PREFS_EVT, sync);
        window.addEventListener(UNIDADE_EVT, sync);
        return () => {
            window.removeEventListener(CONTA_PREFS_EVT, sync);
            window.removeEventListener(UNIDADE_EVT, sync);
        };
    }, [usuario]);

    useEffect(() => {
        function fechar(ev) {
            if (shellRef.current && !shellRef.current.contains(ev.target)) {
                setPainel(null);
            }
        }
        function tecla(ev) {
            if (ev.key === "Escape") {
                setPainel(null);
            }
        }
        document.addEventListener("mousedown", fechar);
        document.addEventListener("keydown", tecla);
        return () => {
            document.removeEventListener("mousedown", fechar);
            document.removeEventListener("keydown", tecla);
        };
    }, []);

    const grupoAtivo = useMemo(
        () => MENU.find((grupo) => grupo.id === grupoId) || MENU[0],
        [grupoId]
    );

    const principais = MENU.filter((grupo) => grupo.id !== "configuracoes");
    const config = MENU.find((grupo) => grupo.id === "configuracoes");
    const naoLidos = AVISOS.filter((a) => !lidos.includes(a.id)).length;
    const conta = useMemo(() => dadosConta(usuario), [usuario, contaTick]);
    const iniciais = iniciaisNome(conta.nome);
    const escuro = temaEscuroAtivo(conta.tema);
    const flyoutConta = painel === "conta";
    const flyoutAvisos = painel === "avisos";

    function sair() {
        logout();
        navigate("/login", { replace: true });
    }

    function abrirAviso(aviso) {
        const ids = lidos.includes(aviso.id) ? lidos : [...lidos, aviso.id];
        setLidos(ids);
        gravarAvisosLidos(ids);
        setPainel(null);
        navigate(aviso.rota);
    }

    function lerTodas() {
        const ids = AVISOS.map((a) => a.id);
        setLidos(ids);
        gravarAvisosLidos(ids);
        setPainel(null);
    }

    function trocarSistema(id) {
        definirUnidade(id);
        navigate(unidadePronta(id) ? ROTAS.INDICE : ROTAS.SISTEMA);
    }

    function abrirGrupo(id) {
        setGrupoId(id);
        setPainel(null);
        if (id === "loja-virtual" && !pathname.startsWith("/loja-admin")) {
            navigate("/loja-admin");
        }
    }

    function gravarOrdem(proximo) {
        setMenuOrdem(proximo);
        try {
            localStorage.setItem(MENU_ORDEM_KEY, JSON.stringify(proximo));
        } catch {
            /* ignore */
        }
    }

    function alternarTrava() {
        gravarOrdem({ ...menuOrdem, travada: !menuOrdem.travada });
    }

    function restaurarOrdem() {
        const grupos = { ...menuOrdem.grupos };
        delete grupos[grupoAtivo.id];
        gravarOrdem({ ...menuOrdem, grupos });
    }

    function iniciarArraste(chave, ev) {
        arrasteRef.current = chave;
        ev.dataTransfer.setData("text/plain", chave);
        ev.dataTransfer.effectAllowed = "move";
        setArraste(chave);
    }

    function soltarItem(destino, ev) {
        ev.preventDefault();
        const origem = ev.dataTransfer.getData("text/plain") || arrasteRef.current;
        arrasteRef.current = "";
        setArraste("");
        if (menuOrdem.travada || !origem || origem === destino) {
            return;
        }
        const itens = itensVisiveis(grupoAtivo, menuOrdem);
        const chaves = itens.map(chaveItem);
        const de = chaves.indexOf(origem);
        const para = chaves.indexOf(destino);
        if (de < 0 || para < 0) {
            return;
        }
        chaves.splice(de, 1);
        chaves.splice(para, 0, origem);
        gravarOrdem({
            ...menuOrdem,
            grupos: { ...menuOrdem.grupos, [grupoAtivo.id]: chaves }
        });
    }

    const itensGrupo = itensVisiveis(grupoAtivo, menuOrdem);
    const ordemCustom = Array.isArray(menuOrdem.grupos?.[grupoAtivo.id]) && menuOrdem.grupos[grupoAtivo.id].length > 0;
    const podeReordenar = grupoAtivo.id !== "loja-virtual" && !flyoutConta && !flyoutAvisos;

    return (
        <div
            className={`erp-shell${fixo ? " is-pinned" : ""}${pdv ? " is-pdv" : ""}${loja ? " is-loja" : ""}${escuro ? " is-escuro" : ""}`}
            style={{ "--accent": corDe(conta.cor) }}
        >
            <div className="shell-nav" ref={shellRef}>
                <nav className="rail" aria-label="Módulos">
                    <button type="button" className="rail-brand" onClick={() => navigate(ROTAS.INDICE)}>
                        <img src={logo} alt="" />
                        <span>Tem de Tudo</span>
                    </button>

                    <div className="rail-list">
                        {principais.map((grupo) => {
                            const Icon = grupo.icon;
                            const ativo = grupo.id === grupoAtivo.id && !flyoutConta && !flyoutAvisos;
                            return (
                                <button
                                    key={grupo.id}
                                    type="button"
                                    className={`rail-item${ativo ? " is-active" : ""}`}
                                    onClick={() => abrirGrupo(grupo.id)}
                                >
                                    {Icon ? <Icon size={20} strokeWidth={1.7} /> : null}
                                    <span>{grupo.titulo}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="rail-bottom">
                        {config && (() => {
                            const ConfigIcon = config.icon;
                            return (
                                <button
                                    type="button"
                                    className={`rail-item${grupoAtivo.id === "configuracoes" && !flyoutConta && !flyoutAvisos ? " is-active" : ""}`}
                                    onClick={() => abrirGrupo("configuracoes")}
                                >
                                    {ConfigIcon ? (
                                        <ConfigIcon size={20} strokeWidth={1.7} />
                                    ) : null}
                                    <span>Configurações</span>
                                </button>
                            );
                        })()}

                        <button
                            type="button"
                            className={`rail-item rail-conta${flyoutConta ? " is-active" : ""}`}
                            title="Minha conta"
                            onClick={() => setPainel(painel === "conta" ? null : "conta")}
                        >
                            <span className="rail-avatar" aria-hidden="true">
                                {conta.foto ? <img src={conta.foto} alt="" /> : iniciais}
                            </span>
                            <span>Minha conta</span>
                        </button>

                        <button
                            type="button"
                            className={`rail-item rail-bell${flyoutAvisos ? " is-active" : ""}`}
                            aria-label="Notificações"
                            title="Notificações"
                            onClick={() => setPainel(painel === "avisos" ? null : "avisos")}
                        >
                            <Bell size={20} strokeWidth={1.7} />
                            {conta.notificacoes && naoLidos ? <em>{naoLidos > 9 ? "9+" : naoLidos}</em> : null}
                            <span>Notificações</span>
                        </button>
                    </div>
                </nav>

                {(fixo || grupoAtivo || flyoutConta || flyoutAvisos) && (
                    <aside className="flyout">
                        {flyoutAvisos ? (
                            <>
                                <header className="flyout-head">
                                    <strong>Notificações</strong>
                                </header>
                                <div className="flyout-list flyout-avisos">
                                    {AVISOS.map((aviso) => (
                                        <button
                                            key={aviso.id}
                                            type="button"
                                            className={lidos.includes(aviso.id) ? "is-read" : ""}
                                            onClick={() => abrirAviso(aviso)}
                                        >
                                            <i />
                                            <span>
                                                <strong>{aviso.titulo}</strong>
                                                <small>{aviso.texto}</small>
                                                <em>{aviso.quando}</em>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <button type="button" className="flyout-sair" onClick={lerTodas}>
                                    ler todas
                                </button>
                            </>
                        ) : flyoutConta ? (
                            <>
                                <header className="flyout-head">
                                    <strong>Minha conta</strong>
                                </header>
                                <div className="flyout-list flyout-conta">
                                    <p className="flyout-sec">Multiempresa</p>
                                    <div className="flyout-empresas">
                                        {empresasDaConta().map((empresa) => {
                                            const ativa = empresa.id === conta.empresaId;
                                            const codigo = empresa.sigla.length <= 4 ? empresa.sigla : "";
                                            const detalhe = ativa
                                                ? [codigo, conta.cargo, conta.nome].filter(Boolean).join(" · ")
                                                : codigo;
                                            return (
                                                <button
                                                    key={empresa.id}
                                                    type="button"
                                                    className={`flyout-empresa${ativa ? " is-on" : ""}`}
                                                    onClick={() => trocarSistema(empresa.id)}
                                                >
                                                    <Building2 size={16} strokeWidth={1.7} />
                                                    <span>
                                                        <strong>{empresa.nome}</strong>
                                                        {detalhe ? <small>{detalhe}</small> : null}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button type="button" className="flyout-link" onClick={() => navigate(ROTAS.MULTI_EMPRESAS)}>
                                        <Network size={16} strokeWidth={1.7} />
                                        Gerenciar Multiempresa
                                    </button>
                                    <p className="flyout-sec">Conta</p>
                                    <button type="button" className="flyout-link" onClick={() => navigate(ROTAS.MINHA_CONTA)}>
                                        <User size={16} strokeWidth={1.7} />
                                        Dados do usuário
                                    </button>
                                    <button type="button" className="flyout-link" onClick={() => abrirGrupo("configuracoes")}>
                                        <Settings size={16} strokeWidth={1.7} />
                                        Configurações
                                    </button>
                                    <button type="button" className="flyout-link" onClick={() => navigate("/")}>
                                        <Store size={16} strokeWidth={1.7} />
                                        Ver loja virtual
                                    </button>
                                    <button
                                        type="button"
                                        className="flyout-link"
                                        onClick={() => window.open("mailto:suporte@temdetudovr.com.br")}
                                    >
                                        <LifeBuoy size={16} strokeWidth={1.7} />
                                        Usuário de suporte
                                    </button>
                                </div>
                                <button type="button" className="flyout-sair" onClick={sair}>
                                    <LogOut size={16} />
                                    Sair do sistema
                                </button>
                            </>
                        ) : (
                            <>
                                <header className="flyout-head">
                                    <strong>{grupoAtivo.titulo}</strong>
                                    {podeReordenar ? (
                                        <span className="flyout-head-acoes">
                                            {!menuOrdem.travada && ordemCustom ? (
                                                <button
                                                    type="button"
                                                    className="flyout-pin"
                                                    title="Restaurar ordem padrão"
                                                    onClick={restaurarOrdem}
                                                >
                                                    <RotateCcw size={14} />
                                                </button>
                                            ) : null}
                                            <button
                                                type="button"
                                                className={`flyout-pin${menuOrdem.travada ? " is-on" : ""}`}
                                                aria-pressed={menuOrdem.travada}
                                                title={menuOrdem.travada ? "Ordem fixa. Clique para reordenar." : "Fixar esta ordem"}
                                                onClick={alternarTrava}
                                            >
                                                <Pin size={14} />
                                            </button>
                                        </span>
                                    ) : null}
                                </header>
                                {grupoAtivo.id === "loja-virtual" ? (
                                    <FlyoutLoja itens={grupoAtivo.itens} pathname={pathname} hash={hash} />
                                ) : (
                                    <div className="flyout-list">
                                        {!menuOrdem.travada ? (
                                            <p className="flyout-dica">Arraste para mudar a ordem</p>
                                        ) : null}
                                        {itensGrupo.map((item) => {
                                            const Icon = item.icon;
                                            const to = item.rota === "/" ? "/index" : item.rota;
                                            const chave = chaveItem(item);
                                            return (
                                                <div
                                                    key={`${grupoAtivo.id}-${chave}`}
                                                    className={`flyout-row${arraste === chave ? " is-drag" : ""}`}
                                                    onDragOver={(ev) => {
                                                        if (!menuOrdem.travada) {
                                                            ev.preventDefault();
                                                        }
                                                    }}
                                                    onDrop={(ev) => soltarItem(chave, ev)}
                                                >
                                                    {!menuOrdem.travada ? (
                                                        <button
                                                            type="button"
                                                            className="flyout-grip"
                                                            draggable
                                                            title="Arrastar"
                                                            aria-label={`Mover ${item.nome}`}
                                                            onDragStart={(ev) => iniciarArraste(chave, ev)}
                                                            onDragEnd={() => {
                                                                arrasteRef.current = "";
                                                                setArraste("");
                                                            }}
                                                        >
                                                            <GripVertical size={14} />
                                                        </button>
                                                    ) : null}
                                                    <NavLink
                                                        to={to}
                                                        end
                                                        className={({ isActive }) =>
                                                            `flyout-link${linkAtivo(isActive, pathname, item.rota, hash) ? " is-active" : ""}`
                                                        }
                                                    >
                                                        {Icon ? <Icon size={16} strokeWidth={1.7} /> : null}
                                                        <span className="flyout-nome">{item.nome}</span>
                                                        <em className="flyout-beta">BETA</em>
                                                    </NavLink>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <button type="button" className="flyout-sair" onClick={sair}>
                                    <LogOut size={16} />
                                    Sair do sistema
                                </button>
                            </>
                        )}
                    </aside>
                )}
            </div>

            <div className="erp-main">
                <main className="erp-content shell-content">
                    <div className="erp-content-wrapper">
                        <Outlet />
                    </div>
                </main>
            </div>
            <ChatGptWidget oculto={pdv} />
        </div>
    );
}
