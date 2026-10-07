import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import {
    Eye,
    EyeOff,
    Heart,
    Lock,
    Mail,
    MapPin,
    Package,
    ShoppingBag,
    UserRound
} from "lucide-react";

import {
    autenticarClienteLoja,
    cadastrarClienteLoja,
    clienteLojaAtual,
    sairClienteLoja
} from "../../constants/loja";
import useAuth from "../../hooks/useAuth.jsx";

function Campo({ tipo, valor, onChange, placeholder, autoComplete, senha, ver, onVer }) {
    return (
        <label className="lj-portal-campo">
            <span className="lj-portal-ico" aria-hidden>
                {senha ? <Lock size={15} /> : <Mail size={15} />}
            </span>
            <input
                type={senha ? (ver ? "text" : "password") : tipo}
                value={valor}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
            />
            {senha ? (
                <button type="button" className="lj-portal-olho" onClick={onVer} aria-label={ver ? "Ocultar senha" : "Mostrar senha"}>
                    {ver ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            ) : null}
        </label>
    );
}

export default function LojaConta() {
    const { cfg } = useOutletContext();
    const { login, autenticado } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const cliente = clienteLojaAtual();
    const [aba, setAba] = useState(() => (window.location.hash === "#colaborador" ? "colab" : "cliente"));
    const [modoCliente, setModoCliente] = useState("entrar");
    const [cli, setCli] = useState({ nome: "", email: "", senha: "", telefone: "" });
    const [colab, setColab] = useState({ usuario: "", senha: "" });
    const [verCli, setVerCli] = useState(false);
    const [verColab, setVerColab] = useState(false);
    const [erroCli, setErroCli] = useState("");
    const [erroColab, setErroColab] = useState("");
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        setAba(location.hash === "#colaborador" ? "colab" : "cliente");
    }, [location.hash]);

    function escolherAba(proxima) {
        setAba(proxima);
        const hash = proxima === "colab" ? "#colaborador" : "";
        window.history.replaceState(null, "", `${location.pathname}${location.search}${hash}`);
    }

    async function enviarCliente(e) {
        e.preventDefault();
        setErroCli("");
        try {
            if (modoCliente === "entrar") {
                autenticarClienteLoja(cli.email, cli.senha);
            } else {
                cadastrarClienteLoja(cli);
            }
        } catch (err) {
            setErroCli(err.message || "Não foi possível continuar.");
        }
    }

    async function enviarColaborador(e) {
        e.preventDefault();
        setErroColab("");
        if (!colab.usuario.trim() || !colab.senha.trim()) {
            setErroColab("Informe e-mail e senha do colaborador.");
            return;
        }
        setCarregando(true);
        try {
            const resultado = await login(colab.usuario.trim(), colab.senha.trim());
            if (resultado.sucesso) {
                navigate("/index", { replace: true });
                return;
            }
            setErroColab(resultado.mensagem || "Usuário ou senha inválidos.");
        } catch {
            setErroColab("Erro ao conectar com o servidor.");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className={`lj-portais ${aba === "colab" ? "is-aba-colab" : "is-aba-cliente"}`}>
            <div className="lj-portais-hero">
                <p className="lj-portais-kicker">Bem-vindo(a)</p>
                <h1>Escolha o seu portal</h1>
                <p className="lj-portais-sub">
                    Acesse sua conta para aproveitar todos os recursos da {cfg.dados.nome}.
                </p>
                <p className="lj-portais-script is-left">Tudo o que você precisa, em um só lugar!</p>
                <p className="lj-portais-script is-right">Mais que produtos, fazemos parte das suas conquistas!</p>
            </div>

            <div className="lj-portal-abas" role="tablist">
                <button type="button" className={aba === "cliente" ? "is-on" : ""} onClick={() => escolherAba("cliente")}>
                    Portal do cliente
                </button>
                <button type="button" className={aba === "colab" ? "is-on" : ""} onClick={() => escolherAba("colab")}>
                    Área do colaborador
                </button>
            </div>
            <div className="lj-portais-cards">
                <article className="lj-portal is-cliente">
                    <span className="lj-portal-badge" aria-hidden>
                        <ShoppingBag size={22} />
                    </span>
                    <h2>Portal do Cliente</h2>
                    <p>Acesse sua conta para acompanhar pedidos, ver seus dados, salvar endereços e muito mais.</p>
                    {cliente ? (
                        <div className="lj-portal-logado">
                            <strong>Olá, {cliente.nome}</strong>
                            <span>{cliente.email}</span>
                            <Link to="/" className="lj-portal-btn">Continuar comprando</Link>
                            <button type="button" className="lj-portal-txt" onClick={() => sairClienteLoja()}>Sair da conta</button>
                        </div>
                    ) : (
                        <form onSubmit={enviarCliente}>
                            {erroCli ? <p className="lj-erro">{erroCli}</p> : null}
                            {modoCliente === "cadastrar" ? (
                                <label className="lj-portal-campo">
                                    <span className="lj-portal-ico" aria-hidden><UserRound size={15} /></span>
                                    <input
                                        placeholder="Nome"
                                        value={cli.nome}
                                        onChange={(e) => setCli({ ...cli, nome: e.target.value })}
                                        autoComplete="name"
                                    />
                                </label>
                            ) : null}
                            <Campo
                                tipo="email"
                                valor={cli.email}
                                onChange={(v) => setCli({ ...cli, email: v })}
                                placeholder="Digite seu e-mail"
                                autoComplete="email"
                            />
                            {modoCliente === "cadastrar" ? (
                                <label className="lj-portal-campo">
                                    <span className="lj-portal-ico" aria-hidden><Mail size={15} /></span>
                                    <input
                                        placeholder="Telefone"
                                        value={cli.telefone}
                                        onChange={(e) => setCli({ ...cli, telefone: e.target.value })}
                                        autoComplete="tel"
                                    />
                                </label>
                            ) : null}
                            <Campo
                                senha
                                valor={cli.senha}
                                onChange={(v) => setCli({ ...cli, senha: v })}
                                placeholder="Digite sua senha"
                                autoComplete="current-password"
                                ver={verCli}
                                onVer={() => setVerCli((v) => !v)}
                            />
                            <button type="submit" className="lj-portal-btn">
                                {modoCliente === "entrar" ? "Entrar" : "Criar conta"}
                            </button>
                        </form>
                    )}
                    {!cliente ? (
                        <button type="button" className="lj-portal-txt" onClick={() => setModoCliente(modoCliente === "entrar" ? "cadastrar" : "entrar")}>
                            {modoCliente === "entrar" ? "Não tem conta? Cadastre-se" : "Já tenho conta"}
                        </button>
                    ) : null}
                    <ul className="lj-portal-atalhos">
                        <li><Package size={14} /> Acompanhe seus pedidos</li>
                        <li><Heart size={14} /> Favoritos e listas</li>
                        <li><MapPin size={14} /> Dados e endereços</li>
                    </ul>
                </article>

                <article className="lj-portal is-colab" id="colaborador">
                    <span className="lj-portal-badge" aria-hidden>
                        <UserRound size={22} />
                    </span>
                    <h2>Portal Área do colaborador</h2>
                    <p>Acesse sua conta para utilizar o ERP da {cfg.dados.nome} e os recursos internos da equipe.</p>
                    {autenticado ? (
                        <div className="lj-portal-logado">
                            <strong>Sessão do ERP ativa</strong>
                            <span>Você já pode abrir o sistema interno.</span>
                            <Link to="/index" className="lj-portal-btn">Ir para o ERP</Link>
                        </div>
                    ) : (
                        <form onSubmit={enviarColaborador}>
                            {erroColab ? <p className="lj-erro">{erroColab}</p> : null}
                            <Campo
                                tipo="text"
                                valor={colab.usuario}
                                onChange={(v) => setColab({ ...colab, usuario: v })}
                                placeholder="Digite seu e-mail"
                                autoComplete="username"
                            />
                            <Campo
                                senha
                                valor={colab.senha}
                                onChange={(v) => setColab({ ...colab, senha: v })}
                                placeholder="Digite sua senha"
                                autoComplete="current-password"
                                ver={verColab}
                                onVer={() => setVerColab((v) => !v)}
                            />
                            <button type="submit" className="lj-portal-btn" disabled={carregando}>
                                {carregando ? "Entrando..." : "Entrar"}
                            </button>
                        </form>
                    )}
                    {!autenticado ? (
                        <Link className="lj-portal-txt" to="/login">Não tem conta? Cadastre-se</Link>
                    ) : null}
                    <ul className="lj-portal-atalhos">
                        <li><Package size={14} /> Acesso ao ERP</li>
                        <li><MapPin size={14} /> Processos internos</li>
                        <li><Heart size={14} /> Trabalho em equipe</li>
                    </ul>
                </article>
            </div>
        </div>
    );
}
