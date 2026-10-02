import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LifeBuoy, LogOut, Settings, Store, User } from "lucide-react";

import MENU, { itensPlanos } from "../constants/menu";
import { AVISOS, gravarAvisosLidos, lerAvisosLidos } from "../constants/avisos";
import { CONTA_PREFS_EVT, corDe, lerConta, temaEscuroAtivo } from "../constants/conta";
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
        if (!ancora) {
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
        empresa: bruto.empresa,
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
            {itens.map((item) => {
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
                                    {item.filhos.map((filho) => (
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
        return () => window.removeEventListener(CONTA_PREFS_EVT, sync);
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

    function alternarFixo() {
        setFixo((atual) => {
            const proximo = !atual;
            try {
                localStorage.setItem(MENU_FIXO_KEY, proximo ? "1" : "0");
            } catch {
                /* ignore */
            }
            return proximo;
        });
    }

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

    function abrirGrupo(id) {
        setGrupoId(id);
        setPainel(null);
        if (id === "loja-virtual" && !pathname.startsWith("/loja-admin")) {
            navigate("/loja-admin");
        }
    }

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

                        <label className="rail-pin">
                            <input
                                type="checkbox"
                                checked={fixo}
                                onChange={alternarFixo}
                            />
                            Fixar menu
                        </label>
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
                                    <p className="flyout-sec">Empresa</p>
                                    <div className="flyout-empresa">
                                        <strong>{conta.empresa}</strong>
                                        <small>{conta.cargo} · {conta.nome}</small>
                                    </div>
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
                                </header>
                                {grupoAtivo.id === "loja-virtual" ? (
                                    <FlyoutLoja itens={grupoAtivo.itens} pathname={pathname} hash={hash} />
                                ) : (
                                    <div className="flyout-list">
                                        {grupoAtivo.itens.map((item) => {
                                            const Icon = item.icon;
                                            const to = item.rota === "/" ? "/index" : item.rota;
                                            return (
                                                <NavLink
                                                    key={`${grupoAtivo.id}-${item.nome}`}
                                                    to={to}
                                                    end
                                                    className={({ isActive }) =>
                                                        `flyout-link${linkAtivo(isActive, pathname, item.rota, hash) ? " is-active" : ""}`
                                                    }
                                                >
                                                    {Icon ? <Icon size={16} strokeWidth={1.7} /> : null}
                                                    {item.nome}
                                                    <em className="flyout-beta">BETA</em>
                                                </NavLink>
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
