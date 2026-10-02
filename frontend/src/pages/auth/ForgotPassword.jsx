import { useState } from "react";
import { Link } from "react-router-dom";
import {
    FaEnvelope,
    FaLock,
    FaPaperPlane,
    FaShieldAlt,
    FaBolt,
    FaWhatsapp,
    FaInstagram,
    FaGlobe,
    FaHeadset,
    FaArrowLeft,
    FaPhone
} from "react-icons/fa";

import { recuperarSenhaApi, redefinirSenhaApi } from "../../services/auth.service";
import "../../styles/pages/recover.css";
import logo from "../../assets/logo/logo.svg";
import recoverArt from "../../assets/images/login-recover.svg";

const PASSOS = ["Informar e-mail", "Verificar", "Redefinir senha"];

const PILARES = [
    { titulo: "Seguro", texto: "Seus dados protegidos.", Icon: FaShieldAlt, tom: "pink" },
    { titulo: "Rápido", texto: "Recuperação em segundos.", Icon: FaBolt, tom: "yellow" },
    { titulo: "Confiável", texto: "Código temporário de 6 dígitos.", Icon: FaEnvelope, tom: "cyan" }
];

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [codigo, setCodigo] = useState("");
    const [codigoGerado, setCodigoGerado] = useState("");
    const [senhaNova, setSenhaNova] = useState("");
    const [conf, setConf] = useState("");
    const [enviado, setEnviado] = useState(false);
    const [redefinido, setRedefinido] = useState(false);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);
    const passo = redefinido ? 3 : enviado ? 2 : 1;

    async function recuperar(e) {
        e.preventDefault();
        setErro("");
        if (!email.trim()) {
            setErro("Informe o e-mail cadastrado.");
            return;
        }
        try {
            setLoading(true);
            const data = await recuperarSenhaApi(email.trim());
            setCodigoGerado(data.codigo || "");
            setEnviado(true);
        } catch (error) {
            setErro(error.response?.data?.mensagem || "Não foi possível enviar o código.");
        } finally {
            setLoading(false);
        }
    }

    async function redefinir(e) {
        e.preventDefault();
        setErro("");
        if (!codigo.trim() || senhaNova.length < 6) {
            setErro("Informe o código e uma nova senha com ao menos 6 caracteres.");
            return;
        }
        if (senhaNova !== conf) {
            setErro("A confirmação não confere.");
            return;
        }
        try {
            setLoading(true);
            await redefinirSenhaApi(email.trim(), codigo.trim(), senhaNova);
            setRedefinido(true);
        } catch (error) {
            setErro(error.response?.data?.mensagem || "Código inválido ou expirado.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="recover-page">
            <div className="recover-shell">
                <section className="recover-left">
                    <header className="recover-brand">
                        <img src={logo} alt="Tem de Tudo" />
                        <div>
                            <strong>Tem de Tudo</strong>
                            <span>ERP INTELIGENTE</span>
                        </div>
                    </header>

                    <h1>
                        Recupere o acesso à sua conta com{" "}
                        <em>segurança</em> e <i>rapidez</i>.
                    </h1>
                    <p>
                        Informe o e-mail ou usuário da conta. Enviamos um código
                        de 6 dígitos, válido por 15 minutos, para redefinir a senha.
                    </p>

                    <img src={recoverArt} alt="" className="recover-art" />

                    <ul className="recover-pilares">
                        {PILARES.map(({ titulo, texto, Icon, tom }) => (
                            <li key={titulo} className={`recover-pilar recover-pilar--${tom}`}>
                                <span>
                                    <Icon />
                                </span>
                                <div>
                                    <strong>{titulo}</strong>
                                    <small>{texto}</small>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="recover-right">
                    <div className="recover-card">
                        <div className="recover-lock" aria-hidden="true">
                            <FaLock />
                        </div>
                        <h2>Esqueci minha senha</h2>

                        <ol className="recover-steps">
                            {PASSOS.map((label, index) => {
                                const numero = index + 1;
                                const ativo = numero === passo;
                                const feito = numero < passo;

                                return (
                                    <li
                                        key={label}
                                        className={
                                            ativo
                                                ? "is-active"
                                                : feito
                                                  ? "is-done"
                                                  : ""
                                        }
                                    >
                                        <span>{numero}</span>
                                        {label}
                                    </li>
                                );
                            })}
                        </ol>

                        {redefinido ? (
                            <div className="recover-ok">
                                <p>Senha redefinida. Entre com a nova senha.</p>
                                <Link to="/login" className="recover-submit">Ir para o login</Link>
                            </div>
                        ) : enviado ? (
                            <form onSubmit={redefinir}>
                                <p className="recover-hint">
                                    Enviamos um código para <strong>{email}</strong>. Ele vale por 15 minutos.
                                </p>
                                {codigoGerado ? (
                                    <p className="recover-hint">Código de verificação: <strong>{codigoGerado}</strong></p>
                                ) : null}
                                {erro && <div className="recover-error">{erro}</div>}
                                <label htmlFor="recover-codigo">Código</label>
                                <div className="recover-field">
                                    <FaLock />
                                    <input
                                        id="recover-codigo"
                                        inputMode="numeric"
                                        placeholder="000000"
                                        value={codigo}
                                        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    />
                                </div>
                                <label htmlFor="recover-senha">Nova senha</label>
                                <div className="recover-field">
                                    <FaLock />
                                    <input
                                        id="recover-senha"
                                        type="password"
                                        value={senhaNova}
                                        onChange={(e) => setSenhaNova(e.target.value)}
                                    />
                                </div>
                                <label htmlFor="recover-conf">Confirmar senha</label>
                                <div className="recover-field">
                                    <FaLock />
                                    <input
                                        id="recover-conf"
                                        type="password"
                                        value={conf}
                                        onChange={(e) => setConf(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="recover-submit" disabled={loading}>
                                    {loading ? "Salvando..." : "Redefinir senha"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={recuperar}>
                                <p className="recover-hint">
                                    Informe o e-mail ou usuário da sua conta para receber
                                    o código de recuperação.
                                </p>

                                {erro && <div className="recover-error">{erro}</div>}

                                <label htmlFor="recover-email">E-mail ou usuário</label>
                                <div className="recover-field">
                                    <FaEnvelope />
                                    <input
                                        id="recover-email"
                                        type="text"
                                        autoComplete="username"
                                        placeholder="Digite seu e-mail ou usuário"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <button type="submit" className="recover-submit" disabled={loading}>
                                    <FaPaperPlane />
                                    {loading ? "Enviando..." : "Enviar código de recuperação"}
                                </button>
                            </form>
                        )}

                        {!redefinido && (
                            <>
                                <div className="recover-or">
                                    <span>OU</span>
                                </div>
                                {enviado ? (
                                    <button
                                        type="button"
                                        className="recover-back"
                                        onClick={() => {
                                            setEnviado(false);
                                            setCodigo("");
                                            setErro("");
                                        }}
                                    >
                                        <FaArrowLeft />
                                        Voltar
                                    </button>
                                ) : (
                                    <Link to="/login" className="recover-back">
                                        <FaArrowLeft />
                                        Voltar para o login
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </section>

                <footer className="recover-bar">
                    <div className="recover-contacts">
                        <a
                            href="https://wa.me/5524981285708"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <FaPhone />
                            (24) 98128-5708
                        </a>
                        <a
                            href="https://www.instagram.com/lojatemdetudovr"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <FaInstagram />
                            @lojatemdetudovr
                        </a>
                        <a
                            href="https://www.temdetudovr.com.br"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <FaGlobe />
                            www.temdetudovr.com.br
                        </a>
                    </div>
                    <p>
                        Precisa de ajuda? Entre em{" "}
                        <a
                            href="https://wa.me/5524981285708?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20ERP."
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            contato com o administrador
                        </a>
                        .
                        <span className="recover-help-icon" aria-hidden="true">
                            <FaHeadset />
                        </span>
                    </p>
                </footer>
            </div>

            <p className="recover-legal">
                © {new Date().getFullYear()} Tem de Tudo Papelaria, Presentes,
                Personalizados e Gráfica LTDA. Versão 2.0.0
            </p>
        </div>
    );
}
