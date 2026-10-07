import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    ChevronDown,
    Headset,
    Heart,
    Menu,
    MessageCircle,
    Search,
    ShoppingBag,
    Truck,
    UserRound,
    X
} from "lucide-react";
import { FaFacebook, FaInstagram, FaPinterest, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { FaTiktok, FaXTwitter } from "react-icons/fa6";

import { garantirCatalogoLoja } from "../../constants/catalogoLoja";
import { ouvirPrecos } from "../../constants/precoPromocional";
import {
    clienteLojaAtual,
    brl,
    foneWa,
    gruposLoja,
    hrefRede,
    lerCarrinho,
    lerDesejos,
    lerLoja,
    qtdCarrinho,
    totalCarrinho
} from "../../constants/loja";
import useAuth from "../../hooks/useAuth.jsx";
import LogoMarca from "./LogoMarca";

import "../../styles/pages/loja.css";

function rotuloGrupo(nome) {
    return String(nome || "")
        .toLocaleLowerCase("pt-BR")
        .replace(/(^|[\s/-])(\p{L})/gu, (tudo, sep, letra) => `${sep}${letra.toLocaleUpperCase("pt-BR")}`);
}

export default function LojaLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { autenticado } = useAuth();
    const [cfg, setCfg] = useState(lerLoja);
    const [qtd, setQtd] = useState(() => qtdCarrinho());
    const [total, setTotal] = useState(() => totalCarrinho());
    const [desejos, setDesejos] = useState(() => lerDesejos().length);
    const [cliente, setCliente] = useState(clienteLojaAtual);
    const [busca, setBusca] = useState("");
    const [menuAberto, setMenuAberto] = useState(false);
    const [catsAberto, setCatsAberto] = useState(false);
    const [suporteAberto, setSuporteAberto] = useState(false);
    const [pronto, setPronto] = useState(false);
    const [revisao, setRevisao] = useState(0);

    useEffect(() => {
        document.body.classList.add("is-loja-publica");
        document.title = cfg.gerais.tituloSite || "Tem de Tudo";
        garantirCatalogoLoja().finally(() => setPronto(true));
        function syncCfg() {
            setCfg(lerLoja());
        }
        function syncCart() {
            const itens = lerCarrinho();
            setQtd(qtdCarrinho(itens));
            setTotal(totalCarrinho(itens));
        }
        function syncCli() {
            setCliente(clienteLojaAtual());
        }
        function syncDesejos() {
            setDesejos(lerDesejos().length);
        }
        window.addEventListener("erp-loja-cfg", syncCfg);
        window.addEventListener("erp-loja-carrinho", syncCart);
        window.addEventListener("erp-loja-cliente", syncCli);
        window.addEventListener("erp-loja-desejos", syncDesejos);
        window.addEventListener("storage", syncCfg);
        const pararPrecos = ouvirPrecos(() => setRevisao((n) => n + 1));
        return () => {
            document.body.classList.remove("is-loja-publica");
            document.title = "ERP Tem de Tudo";
            window.removeEventListener("erp-loja-cfg", syncCfg);
            window.removeEventListener("erp-loja-carrinho", syncCart);
            window.removeEventListener("erp-loja-cliente", syncCli);
            window.removeEventListener("erp-loja-desejos", syncDesejos);
            window.removeEventListener("storage", syncCfg);
            pararPrecos();
        };
    }, [cfg.gerais.tituloSite]);

    useEffect(() => {
        const fav = document.querySelector("link[rel='icon']");
        if (!fav) {
            return undefined;
        }
        const original = fav.getAttribute("href") || "/favicon.svg";
        fav.href = cfg.logo?.icone || "/favicon.svg";
        return () => {
            fav.href = original;
        };
    }, [cfg.logo?.icone]);

    useEffect(() => {
        setMenuAberto(false);
        setCatsAberto(false);
        setSuporteAberto(false);
        window.scrollTo(0, 0);
    }, [location.pathname]);

    const grupos = useMemo(() => gruposLoja(), [pronto]);
    const wps = (cfg.atendimento || []).filter((a) => a.tipo === "whatsapp");
    const tels = (cfg.atendimento || []).filter((a) => a.tipo === "telefone");
    const t = cfg.textos || {};
    const vars = {
        "--lj-pink": cfg.visual.corPrimaria || "#f394bd",
        "--lj-price": cfg.visual.corPreco || "#9e6d9a",
        "--lj-text": cfg.visual.corTexto || "#201f1f",
        "--lj-bg": cfg.visual.corFundo || "#fff",
        "--lj-menu": cfg.visual.corMenu || "#ecd6fc",
        "--lj-menu-txt": cfg.visual.corMenuTxt || "#8632c1",
        "--lj-icon": cfg.visual.corIcone || "#8632c1",
        "--lj-wa": cfg.visual.corWhatsapp || "#5ed979"
    };

    function pesquisar(e) {
        e.preventDefault();
        const q = busca.trim();
        navigate(q ? `/busca?q=${encodeURIComponent(q)}` : "/busca");
    }

    if (!cfg.gerais.vitrineAtiva && !autenticado) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="loja-site" style={{ ...vars, fontFamily: `"${cfg.visual.fonte || "Anek Latin"}", sans-serif` }}>
            {cfg.cssExtra ? <style>{cfg.cssExtra}</style> : null}
            {autenticado ? (
                <div className="lj-erp-bar">
                    Você está no ERP ·
                    <Link to="/index">ir para o sistema</Link>
                    <Link to="/loja-admin">editar a loja</Link>
                </div>
            ) : null}

            <div className="lj-head is-sticky">
            <header className="lj-top">
                <div className="lj-top-inner">
                    <Link to="/" className="lj-brand" aria-label={cfg.dados.nome}>
                        <LogoMarca url={cfg.logo.url} nome={cfg.dados.nome} />
                    </Link>
                    <button type="button" className="lj-burger" onClick={() => setMenuAberto(true)} aria-label="Menu">
                        <Menu size={22} />
                    </button>
                    <form className="lj-search" onSubmit={pesquisar}>
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Digite o que você procura..."
                            aria-label="Buscar produtos"
                        />
                        <button type="submit" aria-label="Buscar">
                            <Search size={18} />
                        </button>
                    </form>
                    <div className="lj-top-links">
                        <button type="button" className="lj-atende" onClick={() => setSuporteAberto(true)}>
                            <Headset size={22} />
                            <span>
                                <strong>Central de</strong>
                                Atendimento
                            </span>
                        </button>
                        <Link to="/desejos" className="lj-atende">
                            <span className="lj-atende-ico">
                                <Heart size={22} />
                                {desejos ? <em>{desejos > 99 ? "99+" : desejos}</em> : null}
                            </span>
                            <span>
                                <strong>Lista de</strong>
                                Desejos
                            </span>
                        </Link>
                        <Link to="/conta" className="lj-atende is-conta">
                            <UserRound size={22} />
                            <span>
                                <strong>{cliente ? "Olá" : "Entrar"}</strong>
                                {cliente ? cliente.nome.split(" ")[0] : "ou Cadastrar"}
                            </span>
                        </Link>
                        <Link to="/carrinho" className="lj-bag" aria-label={qtd ? `Carrinho com ${qtd} item(ns)` : "Carrinho"}>
                            <span className="lj-atende-ico">
                                <ShoppingBag size={22} />
                                {qtd ? <em>{qtd > 99 ? "99+" : qtd}</em> : null}
                            </span>
                            <span className="lj-bag-txt">
                                <strong>Meu Carrinho</strong>
                                {brl(total)}
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            <nav className="lj-nav" aria-label="Categorias">
                <div className="lj-nav-inner">
                    <div className="lj-cats">
                        <button type="button" className="lj-cats-btn" onClick={() => setCatsAberto((v) => !v)}>
                            {t.todasCategorias || "Todas as categorias"} <ChevronDown size={14} />
                        </button>
                        {catsAberto ? (
                            <div className="lj-mega">
                                {grupos.map((g) => (
                                    <Link key={g.id || g.nome} to={`/c/${encodeURIComponent(g.nome)}`}>
                                        {rotuloGrupo(g.nome)}
                                    </Link>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    <div className="lj-nav-links">
                        <NavLink to="/p/quem-somos" className="is-soft">Institucional</NavLink>
                        <NavLink to="/busca?q=marca" className="is-soft">Marcas</NavLink>
                        {grupos.slice(0, 6).map((g) => (
                            <NavLink key={g.id || g.nome} to={`/c/${encodeURIComponent(g.nome)}`}>
                                {rotuloGrupo(g.nome)}
                            </NavLink>
                        ))}
                    </div>
                    <Link to="/conta" className="lj-nav-pedido">
                        <Truck size={16} /> Acompanhe seu pedido
                    </Link>
                </div>
            </nav>
            </div>

            {menuAberto ? (
                <div className="lj-drawer-fundo">
                    <button type="button" className="lj-drawer-velo" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />
                    <div className="lj-drawer">
                        <button type="button" className="lj-drawer-close" onClick={() => setMenuAberto(false)} aria-label="Fechar">
                            <X size={20} />
                        </button>
                        <p className="lj-drawer-titulo">Menu</p>
                        <Link to="/conta">{cliente ? `Olá, ${cliente.nome.split(" ")[0]}` : "Entrar ou cadastrar"}</Link>
                        <Link to="/desejos">{t.desejos || "Desejos"}{desejos ? ` · ${desejos}` : ""}</Link>
                        <Link to="/carrinho">Carrinho · {brl(total)}</Link>
                        <Link to="/conta">Acompanhe seu pedido</Link>
                        <p className="lj-drawer-sec">Sistema</p>
                        <Link to="/conta#colaborador">Área do colaborador</Link>
                        {autenticado ? <Link to="/index">Abrir o ERP</Link> : null}
                        <p className="lj-drawer-sec">Categorias</p>
                        {grupos.map((g) => (
                            <Link key={g.id || g.nome} to={`/c/${encodeURIComponent(g.nome)}`}>
                                {rotuloGrupo(g.nome)}
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null}

            <main className="lj-main">
                <Outlet context={{ cfg, pronto, revisao }} />
            </main>

            <footer className="lj-foot">
                <div className="lj-foot-grid">
                    <div>
                        <LogoMarca url={cfg.logo.url} nome={cfg.dados.nome} />
                        <p>
                            Na Tem de Tudo você encontra o que precisa em papelaria, presentes, personalizados
                            e gráfica. Também oferecemos serviços gráficos e personalização a laser.
                        </p>
                        <p className="lj-end">{cfg.dados.endereco}, {cfg.dados.cidade} - {cfg.dados.uf}, {cfg.dados.cep}</p>
                    </div>
                    <div>
                        <h3>{t.telTitulo || "Dúvidas Sobre o Pagamento"}</h3>
                        <p>{t.wpTitulo || "Estamos no WhatsApp"}</p>
                        {wps.map((c) => (
                            <a key={c.id} href={`https://wa.me/${foneWa(c.numero)}`} target="_blank" rel="noopener noreferrer">
                                <FaWhatsapp /> {c.numero} · {c.nome}
                            </a>
                        ))}
                        {tels.map((c) => (
                            <p key={c.id}>{c.numero} · {c.nome}</p>
                        ))}
                        <p>{t.mailTitulo || "Assunto: Site"}</p>
                        <a href={`mailto:${cfg.dados.email}`}>{cfg.dados.email}</a>
                        <p>Horário de atendimento<br />{cfg.dados.horario}<br />{cfg.dados.horarioSab}</p>
                    </div>
                    <div>
                        <h3>Institucional</h3>
                        {cfg.paginas.map((p) => (
                            <Link key={p.slug} to={`/p/${p.slug}`}>{p.titulo}</Link>
                        ))}
                        <div className="lj-redes">
                            {[
                                { id: "instagram", Icon: FaInstagram, label: t.instagram || "Gostou? Segue a gente" },
                                { id: "facebook", Icon: FaFacebook, label: "Facebook" },
                                { id: "twitter", Icon: FaXTwitter, label: "X" },
                                { id: "pinterest", Icon: FaPinterest, label: "Pinterest" },
                                { id: "youtube", Icon: FaYoutube, label: "YouTube" },
                                { id: "tiktok", Icon: FaTiktok, label: "TikTok" }
                            ].map((rede) => {
                                const href = hrefRede(cfg.redes[rede.id]);
                                if (!href) {
                                    return null;
                                }
                                return (
                                    <a key={rede.id} href={href} target="_blank" rel="noopener noreferrer">
                                        <rede.Icon /> {rede.label}
                                    </a>
                                );
                            })}
                        </div>
                        <Link to="/conta#colaborador">Área do colaborador</Link>
                        {autenticado ? <Link to="/index">Abrir o ERP</Link> : null}
                    </div>
                </div>
                <div className="lj-foot-bar">
                    <div>
                        <strong>Formas de Pagamento</strong>
                        <span>{cfg.pagamentos.filter((p) => p.ativo).map((p) => p.nome).join(" · ") || "Pix"}</span>
                    </div>
                    <div>
                        <strong>Selos de Segurança</strong>
                        <span>Site protegido · Compra garantida</span>
                    </div>
                    <div>
                        <strong>Formas de envio</strong>
                        <span>{cfg.envios.filter((p) => p.ativo).map((p) => p.nome).join(" · ")}</span>
                    </div>
                </div>
            </footer>

            {cfg.htmlExtra ? <div className="lj-html-extra" dangerouslySetInnerHTML={{ __html: cfg.htmlExtra }} /> : null}

            {suporteAberto ? (
                <div className="lj-suporte">
                    <button type="button" className="lj-suporte-x" onClick={() => setSuporteAberto(false)} aria-label="Fechar">
                        <X size={16} />
                    </button>
                    <strong>{t.wpTitulo}</strong>
                    {wps.map((c) => (
                        <a key={c.id} href={`https://wa.me/${foneWa(c.numero)}`} target="_blank" rel="noopener noreferrer">
                            {c.foto ? <img src={c.foto} alt="" /> : <FaWhatsapp />}
                            <span>
                                <b>{c.nome}</b>
                                {c.setor} · {c.numero}
                            </span>
                        </a>
                    ))}
                    <a href={`mailto:${cfg.dados.email}`} className="lj-fale">
                        <MessageCircle size={16} /> {t.fale || "Enviar mensagem"}
                    </a>
                </div>
            ) : null}

            <button type="button" className="lj-float-wa" onClick={() => setSuporteAberto((v) => !v)} aria-label="WhatsApp">
                <FaWhatsapp />
            </button>
        </div>
    );
}
