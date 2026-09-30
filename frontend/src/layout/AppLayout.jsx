import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LifeBuoy, LogOut, Settings, Store, User } from "lucide-react";

import MENU, { itensPlanos } from "../constants/menu";
import { AVISOS, gravarAvisosLidos, lerAvisosLidos } from "../constants/avisos";
import ROTAS from "../constants/rotas";
import useAuth from "../hooks/useAuth.jsx";
import logo from "../assets/logo/logo.svg";

import "../styles/layout/layout.css";
import "../styles/layout/content.css";
import "../styles/layout/app-shell.css";
import "../styles/pages/indice.css";

const MENU_FIXO_KEY = "erp-menu-fixo";
const CONTA_KEY = "erp-minha-conta-v1";

function rotaAtiva(pathname, rota) {
    if (!rota) {
        return false;
    }
    const caminho = String(rota).split("#")[0] || rota;
    if (caminho === "/" || caminho === "/index") {
        return pathname === "/" || pathname === "/index";
    }
    if (caminho === "/loja-admin") {
        return pathname === "/loja-admin";
    }
    if (pathname === caminho) {
        return true;
    }
    if (caminho === "/ponto" || caminho === "/pdv") {
        return false;
    }
    if (caminho === "/ferramentas_geral" && pathname.startsWith("/ferramentas")) {
        return true;
    }
    return pathname.startsWith(`${caminho}/`) || (caminho === "/ordem_servicos" && pathname.startsWith("/os"));
}

function grupoDaRota(pathname) {
    if (pathname === "/loja-admin" || pathname.startsWith("/loja-admin/")) {
        return MENU.find((grupo) => grupo.id === "loja-virtual") || MENU[0];
    }
    let melhor = null;
    let tamanho = -1;
    MENU.forEach((grupo) => {
        itensPlanos(grupo).forEach((item) => {
            if (item.rota && rotaAtiva(pathname, item.rota) && String(item.rota).length > tamanho) {
                melhor = grupo;
                tamanho = String(item.rota).length;
            }
        });
    });
    return melhor || MENU[0];
}

function iniciaisNome(nome) {
    const partes = String(nome || "?").trim().split(/\s+/);
    return ((partes[0]?.[0] || "?") + (partes[1]?.[0] || "")).toUpperCase();
}

function dadosConta(usuario) {
    try {
        const bruto = JSON.parse(localStorage.getItem(CONTA_KEY) || "{}");
        return {
            nome: bruto.nome || usuario?.nome || "Administrador",
            empresa: bruto.empresa || "Tem de Tudo — Volta Redonda",
            cargo: bruto.cargo || usuario?.perfil || "ADMIN"
        };
    } catch {
        return {
            nome: usuario?.nome || "Administrador",
            empresa: "Tem de Tudo — Volta Redonda",
            cargo: usuario?.perfil || "ADMIN"
        };
    }
}

function FlyoutLoja({ itens, pathname }) {
    const ativoId = itens.find((item) =>
        item.filhos?.some((filho) => rotaAtiva(pathname, filho.rota))
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
                                                `flyout-link${isActive || rotaAtiva(pathname, filho.rota) ? " is-active" : ""}`
                                            }
                                        >
                                            {filho.nome}
                                            {filho.beta ? <em className="flyout-beta">BETA</em> : null}
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
                            `flyout-link${isActive || rotaAtiva(pathname, item.rota) ? " is-active" : ""}`
                        }
                    >
                        {Icon ? <Icon size={16} strokeWidth={1.7} /> : null}
                        {item.nome}
                        {item.beta ? <em className="flyout-beta">BETA</em> : null}
                    </NavLink>
                );
            })}
        </div>
    );
}

export default function AppLayout() {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const pdv = pathname === "/pdv";
    const loja = true;
    const [grupoId, setGrupoId] = useState(() => grupoDaRota(pathname).id);
    const [fixo, setFixo] = useState(() => {
        try {
            return localStorage.getItem(MENU_FIXO_KEY) !== "0";
        } catch {
            return true;
        }
    });
    const [painel, setPainel] = useState(null);
    const [lidos, setLidos] = useState(lerAvisosLidos);
    const shellRef = useRef(null);

    useEffect(() => {
        setGrupoId(grupoDaRota(pathname).id);
        setPainel(null);
    }, [pathname]);

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
    const conta = dadosConta(usuario);
    const iniciais = iniciaisNome(conta.nome);
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
        <div className={`erp-shell${fixo ? " is-pinned" : ""}${pdv ? " is-pdv" : ""}${loja ? " is-loja" : ""}`}>
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
                            <span className="rail-avatar" aria-hidden="true">{iniciais}</span>
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
                            {naoLidos ? <em>{naoLidos > 9 ? "9+" : naoLidos}</em> : null}
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
                                    <FlyoutLoja itens={grupoAtivo.itens} pathname={pathname} />
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
                                                        `flyout-link${isActive || rotaAtiva(pathname, item.rota) ? " is-active" : ""}`
                                                    }
                                                >
                                                    {Icon ? <Icon size={16} strokeWidth={1.7} /> : null}
                                                    {item.nome}
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                )}
                                <button type="button" className="flyout-sair" onClick={sair}>
                                    <LogOut size={16} />
                                    Sair do sistema
                                </button>
                                <p className="flyout-loja">
                                    Tem de Tudo, que vende papelaria,
                                    é parte da sua história!
                                </p>
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
        </div>
    );
}
