import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FaUser,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaWhatsapp,
    FaInstagram,
    FaGlobe,
    FaBoxes,
    FaShoppingBag,
    FaDollarSign,
    FaIndustry,
    FaUsers,
    FaChartLine,
    FaShieldAlt,
    FaBolt,
    FaCheckCircle,
    FaHeadset
} from "react-icons/fa";

import "../../styles/pages/login.css";
import logo from "../../assets/logo/logo.svg";
import dashboardArt from "../../assets/images/login-dashboard.svg";
import useAuth from "../../hooks/useAuth.jsx";

const MODULOS = [
    { titulo: "Vendas", tom: "pink", Icon: FaShoppingBag },
    { titulo: "Estoque", tom: "blue", Icon: FaBoxes },
    { titulo: "Financeiro", tom: "green", Icon: FaDollarSign },
    { titulo: "Produção", tom: "purple", Icon: FaIndustry },
    { titulo: "Clientes & CRM", tom: "orange", Icon: FaUsers },
    { titulo: "Relatórios", tom: "cyan", Icon: FaChartLine }
];

const SELOS = [
    { titulo: "Seguro", Icon: FaShieldAlt },
    { titulo: "Rápido", Icon: FaBolt },
    { titulo: "Confiável", Icon: FaCheckCircle },
    { titulo: "Suporte", Icon: FaHeadset }
];

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, confirmar2fa } = useAuth();
    const [usuario, setUsuario] = useState(
        () => (import.meta.env.DEV ? "admin" : "")
    );
    const [senha, setSenha] = useState(
        () => (import.meta.env.DEV ? "123456" : "")
    );
    const [codigo, setCodigo] = useState("");
    const [codigoGerado, setCodigoGerado] = useState("");
    const [etapa, setEtapa] = useState("senha");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [lembrar, setLembrar] = useState(false);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    useEffect(() => {
        const usuarioSalvo = localStorage.getItem("usuarioLogin");

        if (usuarioSalvo) {
            setUsuario(usuarioSalvo);
            setLembrar(true);
        } else if (import.meta.env.DEV) {
            setUsuario("admin");
            setSenha("123456");
        }
    }, []);

    async function entrar() {
        setErro("");

        if (!usuario.trim()) {
            setErro("Informe seu usuário ou e-mail.");
            return;
        }

        if (!senha.trim()) {
            setErro("Informe sua senha.");
            return;
        }

        try {
            setLoading(true);

            if (lembrar) {
                localStorage.setItem("usuarioLogin", usuario);
            } else {
                localStorage.removeItem("usuarioLogin");
            }

            const resultado = await login(usuario.trim(), senha.trim());

            if (resultado.precisa2fa) {
                setEtapa("2fa");
                setCodigo("");
                setCodigoGerado(resultado.codigo || "");
                setErro("");
                return;
            }

            if (resultado.sucesso) {
                const destino = location.state?.from?.pathname;
                navigate(
                    destino && destino !== "/login" ? destino : "/index",
                    { replace: true }
                );
                return;
            }

            setErro(resultado.mensagem || "Usuário ou senha inválidos.");
        } catch (error) {
            console.error(error);
            setErro("Erro ao conectar com o servidor.");
        } finally {
            setLoading(false);
        }
    }

    async function confirmarCodigo() {
        setErro("");
        if (!codigo.trim()) {
            setErro("Informe o código de 6 dígitos.");
            return;
        }
        try {
            setLoading(true);
            const resultado = await confirmar2fa(usuario.trim(), codigo.trim());
            if (resultado.sucesso) {
                const destino = location.state?.from?.pathname;
                navigate(
                    destino && destino !== "/login" ? destino : "/index",
                    { replace: true }
                );
                return;
            }
            setErro(resultado.mensagem || "Código inválido.");
        } catch {
            setErro("Erro ao validar o código.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <section className="login-left">
                    <header className="login-brand-row">
                        <img src={logo} alt="Tem de Tudo" className="login-logo" />
                        <div>
                            <strong>TEM DE TUDO</strong>
                            <span>ERP INTELIGENTE</span>
                        </div>
                    </header>

                    <div className="login-left-body">
                        <div className="login-copy">
                            <h1>
                                A gestão completa do seu negócio,{" "}
                                <em>em um só lugar.</em>
                            </h1>
                            <p>
                                ERP moderno, intuitivo e 100% integrado para
                                papelaria, gráfica, presentes e produção.
                            </p>
                        </div>

                        <img
                            src={dashboardArt}
                            alt=""
                            className="login-hero"
                        />
                    </div>

                    <div className="login-modulos">
                        {MODULOS.map(({ titulo, tom, Icon }) => (
                            <article key={titulo} className={`login-modulo login-modulo--${tom}`}>
                                <span className="login-modulo-icon">
                                    <Icon />
                                </span>
                                <strong>{titulo}</strong>
                            </article>
                        ))}
                    </div>

                    <ul className="login-selos">
                        {SELOS.map(({ titulo, Icon }) => (
                            <li key={titulo}>
                                <Icon />
                                {titulo}
                            </li>
                        ))}
                    </ul>

                    <footer className="login-footer">
                        <a
                            href="https://wa.me/5524981285708?text=Olá!%20Gostaria%20de%20conhecer%20o%20ERP%20Tem%20de%20Tudo."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-item"
                        >
                            <FaWhatsapp />
                            <span>(24) 98128-5708</span>
                        </a>
                        <a
                            href="https://www.instagram.com/lojatemdetudovr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-item"
                        >
                            <FaInstagram />
                            <span>@lojatemdetudovr</span>
                        </a>
                        <a
                            href="https://www.temdetudovr.com.br"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-item"
                        >
                            <FaGlobe />
                            <span>www.temdetudovr.com.br</span>
                        </a>
                    </footer>
                </section>

                <section className="login-right">
                    <div className="login-card">
                        <img src={logo} alt="Logo" className="login-logo-small" />
                        <h2 className="login-title">Bem-vindo!</h2>
                        <p className="login-subtitle">
                            Faça login para acessar o ERP Tem de Tudo.
                        </p>
                        <p className="login-subtitle">
                            <Link to="/">Voltar à loja virtual</Link>
                        </p>

                        {erro && <div className="login-error">{erro}</div>}

                        {etapa === "2fa" ? (
                            <>
                                <p className="login-subtitle">
                                    Digite o código de 6 dígitos enviado para a sua conta.
                                </p>
                                {codigoGerado ? (
                                    <p className="login-2fa-dica">Código de verificação: <strong>{codigoGerado}</strong></p>
                                ) : null}
                                <div className="form-group">
                                    <label htmlFor="login-2fa">Código 2FA</label>
                                    <div className="input-wrapper">
                                        <FaLock className="input-icon" />
                                        <input
                                            id="login-2fa"
                                            className="input-login"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            placeholder="000000"
                                            value={codigo}
                                            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    confirmarCodigo();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn-login"
                                    onClick={confirmarCodigo}
                                    disabled={loading}
                                >
                                    {loading ? "Validando..." : "Confirmar código"}
                                </button>
                                <button
                                    type="button"
                                    className="btn-google"
                                    onClick={entrar}
                                    disabled={loading}
                                >
                                    Reenviar código
                                </button>
                                <button
                                    type="button"
                                    className="btn-google"
                                    onClick={() => { setEtapa("senha"); setCodigo(""); setErro(""); }}
                                >
                                    Voltar
                                </button>
                            </>
                        ) : (
                            <>
                        <div className="form-group">
                            <label htmlFor="login-usuario">Usuário ou E-mail</label>
                            <div className="input-wrapper">
                                <FaUser className="input-icon" />
                                <input
                                    id="login-usuario"
                                    className="input-login"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="Digite seu usuário ou e-mail"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            entrar();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="login-senha">Senha</label>
                            <div className="input-wrapper">
                                <FaLock className="input-icon" />
                                <input
                                    id="login-senha"
                                    className="input-login"
                                    type={mostrarSenha ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="Digite sua senha"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            entrar();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="btn-show-password"
                                    onClick={() => setMostrarSenha(!mostrarSenha)}
                                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div className="login-options">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    className="checkbox-login"
                                    checked={lembrar}
                                    onChange={(e) => setLembrar(e.target.checked)}
                                />
                                Lembrar-me
                            </label>
                            <Link to="/esqueci-senha" className="forgot-password">
                                Esqueceu sua senha?
                            </Link>
                        </div>

                        <button
                            type="button"
                            className="btn-login"
                            onClick={entrar}
                            disabled={loading}
                        >
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                            </>
                        )}

                        <div className="login-bottom">
                            <p>Não possui acesso ao sistema?</p>
                            <a
                                href="https://wa.me/5524981285708?text=Olá!%20Gostaria%20de%20solicitar%20acesso%20ao%20ERP%20Tem%20de%20Tudo."
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Entre em contato com o administrador
                            </a>
                        </div>

                        <div className="copyright">
                            <strong>ERP Tem de Tudo</strong>
                            <span>Versão 3.1.9</span>
                            <span>
                                © {new Date().getFullYear()} Tem de Tudo Papelaria,
                                Presentes, Personalizados e Gráfica LTDA.
                            </span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
