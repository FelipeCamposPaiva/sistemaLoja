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

import "../../styles/pages/recover.css";
import logo from "../../assets/logo/logo.svg";
import recoverArt from "../../assets/images/login-recover.svg";

const PASSOS = ["Informar e-mail", "Verificar", "Redefinir senha"];

const PILARES = [
    { titulo: "Seguro", texto: "Seus dados protegidos.", Icon: FaShieldAlt, tom: "pink" },
    { titulo: "Rápido", texto: "Recuperação em segundos.", Icon: FaBolt, tom: "yellow" },
    { titulo: "Confiável", texto: "Link enviado por e-mail.", Icon: FaEnvelope, tom: "cyan" }
];

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [enviado, setEnviado] = useState(false);
    const [erro, setErro] = useState("");
    const passo = enviado ? 2 : 1;

    function recuperar(e) {
        e.preventDefault();
        setErro("");

        if (!email.trim()) {
            setErro("Informe o e-mail cadastrado.");
            return;
        }

        // TODO integração backend
        setEnviado(true);
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
                        Informe seu e-mail cadastrado que enviaremos um link
                        seguro para redefinir sua senha.
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

                        {enviado ? (
                            <div className="recover-ok">
                                <p>
                                    Se existir uma conta para <strong>{email}</strong>,
                                    enviaremos as instruções de recuperação.
                                </p>
                                <Link to="/login" className="recover-submit">
                                    Voltar para o login
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={recuperar}>
                                <p className="recover-hint">
                                    Informe o e-mail da sua conta para receber
                                    instruções de recuperação.
                                </p>

                                {erro && <div className="recover-error">{erro}</div>}

                                <label htmlFor="recover-email">E-mail</label>
                                <div className="recover-field">
                                    <FaEnvelope />
                                    <input
                                        id="recover-email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="Digite seu e-mail cadastrado"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <button type="submit" className="recover-submit">
                                    <FaPaperPlane />
                                    Enviar link de recuperação
                                </button>
                            </form>
                        )}

                        {!enviado && (
                            <>
                                <div className="recover-or">
                                    <span>OU</span>
                                </div>
                                <Link to="/login" className="recover-back">
                                    <FaArrowLeft />
                                    Voltar para o login
                                </Link>
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
