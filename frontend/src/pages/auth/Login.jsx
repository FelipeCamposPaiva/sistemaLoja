import { useEffect, useState } from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    FaUser,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaGoogle,
    FaWhatsapp,
    FaInstagram,
    FaGlobe,
    FaBoxes,
    FaMoneyBillWave,
    FaPrint,
    FaChartLine
} from "react-icons/fa";

import "../../styles/pages/login.css";

import logo from "../../assets/logo/logo.svg";
import hero from "../../assets/images/hero.svg";

import useAuth from "../../hooks/useAuth.jsx";

export default function Login() {

    const navigate = useNavigate();

    const { login } = useAuth();

    const [usuario, setUsuario] = useState(
        () => import.meta.env.DEV ? "admin" : ""
    );

    const [senha, setSenha] = useState(
        () => import.meta.env.DEV ? "123456" : ""
    );

    const [mostrarSenha, setMostrarSenha] = useState(false);

    const [lembrar, setLembrar] = useState(false);

    const [loading, setLoading] = useState(false);

    const [erro, setErro] = useState("");

    /*
    |--------------------------------------------------------------------------
    | Carrega usuário salvo
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */

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

                localStorage.setItem(
                    "usuarioLogin",
                    usuario
                );

            } else {

                localStorage.removeItem(
                    "usuarioLogin"
                );

            }

            const resultado = await login(

                usuario,

                senha

            );

            if (resultado.sucesso) {

                navigate("/dashboard");

                return;

            }

            setErro(

                resultado.mensagem ||

                "Usuário ou senha inválidos."

            );

        }

        catch (error) {

            console.error(error);

            setErro(

                "Erro ao conectar com o servidor."

            );

        }

        finally {

            setLoading(false);

        }

    }

    return (

        <div className="login-page">

            <div className="login-container">

                {/*================================================*/}
                {/* LADO ESQUERDO */}
                {/*================================================*/}

                <div className="login-left">

                    <div className="login-brand">

                        <img

                            src={logo}

                            alt="Tem de Tudo"

                            className="login-logo"

                        />

                        <img

                            src={hero}

                            alt="ERP"

                            className="login-hero"

                        />

                        <h1>

                            ERP Tem de Tudo

                        </h1>

                        <p>

                            Gestão completa para Papelaria,
                            Presentes,
                            Personalizados,
                            Gráfica,
                            Financeiro,
                            Estoque,
                            Produção
                            e muito mais.

                        </p>

                        <div className="login-beneficios">

                                                    <div className="beneficio">

                                <div className="beneficio-icon">

                                    <FaBoxes />

                                </div>

                                <div>

                                    <h3>

                                        Estoque Inteligente

                                    </h3>

                                    <span>

                                        Controle completo de produtos,
                                        entradas, saídas, inventário
                                        e movimentações.

                                    </span>

                                </div>

                            </div>

                            <div className="beneficio">

                                <div className="beneficio-icon">

                                    <FaMoneyBillWave />

                                </div>

                                <div>

                                    <h3>

                                        Financeiro

                                    </h3>

                                    <span>

                                        Fluxo de caixa, contas a pagar,
                                        contas a receber e DRE.

                                    </span>

                                </div>

                            </div>

                            <div className="beneficio">

                                <div className="beneficio-icon">

                                    <FaPrint />

                                </div>

                                <div>

                                    <h3>

                                        Produção

                                    </h3>

                                    <span>

                                        Ordem de Serviço,
                                        Kanban e acompanhamento
                                        da produção.

                                    </span>

                                </div>

                            </div>

                            <div className="beneficio">

                                <div className="beneficio-icon">

                                    <FaChartLine />

                                </div>

                                <div>

                                    <h3>

                                        Dashboard

                                    </h3>

                                    <span>

                                        Indicadores em tempo real,
                                        gráficos e desempenho
                                        da empresa.

                                    </span>

                                </div>

                            </div>

                        </div>

                        {/*=============================================*/}
                        {/* RODAPÉ ESQUERDO */}
                        {/*=============================================*/}

                        <div className="login-footer">

                            <a

                                href="https://wa.me/5524981285708?text=Olá!%20Gostaria%20de%20conhecer%20o%20ERP%20Tem%20de%20Tudo."

                                target="_blank"

                                rel="noopener noreferrer"

                                className="footer-item"

                            >

                                <FaWhatsapp />

                                <span>

                                    (24) 98128-5708

                                </span>

                            </a>

                            <a

                                href="https://www.instagram.com/lojatemdetudovr"

                                target="_blank"

                                rel="noopener noreferrer"

                                className="footer-item"

                            >

                                <FaInstagram />

                                <span>

                                    @lojatemdetudovr

                                </span>

                            </a>

                            <a

                                href="https://www.temdetudovr.com.br"

                                target="_blank"

                                rel="noopener noreferrer"

                                className="footer-item"

                            >

                                <FaGlobe />

                                <span>

                                    www.temdetudovr.com.br

                                </span>

                            </a>

                        </div>

                    </div>

                </div>

                {/*================================================*/}
                {/* LADO DIREITO */}
                {/*================================================*/}

                <div className="login-right">

                    <div className="login-card">

                        <img

                            src={logo}

                            alt="Logo"

                            className="login-logo-small"

                        />

                        <h2 className="login-title">

                            Bem-vindo!

                        </h2>

                        <p className="login-subtitle">

                            Faça login para acessar o ERP
                            Tem de Tudo.

                        </p>

                        {

                            erro && (

                                <div className="login-error">

                                    {erro}

                                </div>

                            )

                        }

                                                {/*=============================================*/}
                        {/* USUÁRIO */}
                        {/*=============================================*/}

                        <div className="form-group">

                            <label>

                                Usuário ou E-mail

                            </label>

                            <div className="input-wrapper">

                                <FaUser className="input-icon" />

                                <input

                                    className="input-login"

                                    type="text"

                                    placeholder="Digite seu usuário ou e-mail"

                                    value={usuario}

                                    onChange={(e) =>
                                        setUsuario(e.target.value)
                                    }

                                    onKeyDown={(e) => {

                                        if (e.key === "Enter") {

                                            entrar();

                                        }

                                    }}

                                />

                            </div>

                        </div>

                        {/*=============================================*/}
                        {/* SENHA */}
                        {/*=============================================*/}

                        <div className="form-group">

                            <label>

                                Senha

                            </label>

                            <div className="input-wrapper">

                                <FaLock className="input-icon" />

                                <input

                                    className="input-login"

                                    type={

                                        mostrarSenha

                                            ? "text"

                                            : "password"

                                    }

                                    placeholder="Digite sua senha"

                                    value={senha}

                                    onChange={(e) =>
                                        setSenha(e.target.value)
                                    }

                                    onKeyDown={(e) => {

                                        if (e.key === "Enter") {

                                            entrar();

                                        }

                                    }}

                                />

                                <button

                                    type="button"

                                    className="btn-show-password"

                                    onClick={() =>
                                        setMostrarSenha(
                                            !mostrarSenha
                                        )
                                    }

                                >

                                    {

                                        mostrarSenha

                                            ?

                                            <FaEyeSlash />

                                            :

                                            <FaEye />

                                    }

                                </button>

                            </div>

                        </div>

                        {/*=============================================*/}
                        {/* OPÇÕES */}
                        {/*=============================================*/}

                        <div className="login-options">

                            <label className="remember-me">

                                <input

                                    type="checkbox"

                                    className="checkbox-login"

                                    checked={lembrar}

                                    onChange={(e) =>
                                        setLembrar(
                                            e.target.checked
                                        )
                                    }

                                />

                                Lembrar-me

                            </label>

                            <Link

                                to="/esqueci-senha"

                                className="forgot-password"

                            >

                                Esqueceu sua senha?

                            </Link>

                        </div>

                        {/*=============================================*/}
                        {/* BOTÃO LOGIN */}
                        {/*=============================================*/}

                        <button

                            className="btn-login"

                            onClick={entrar}

                            disabled={loading}

                        >

                            {

                                loading

                                    ?

                                    "Entrando..."

                                    :

                                    "Entrar"

                            }

                        </button>

                        {/*=============================================*/}
                        {/* SEPARADOR */}
                        {/*=============================================*/}

                        <div className="separator">

                            <span>

                                OU

                            </span>

                        </div>

                        {/*=============================================*/}
                        {/* GOOGLE */}
                        {/*=============================================*/}

                        <button

                            type="button"

                            className="btn-google"

                            onClick={() => {

                                console.log(

                                    "Google OAuth"

                                );

                            }}

                        >

                            <FaGoogle />

                            Entrar com Google

                        </button>

                                                {/*=============================================*/}
                        {/* PRIMEIRO ACESSO */}
                        {/*=============================================*/}

                        <div className="login-bottom">

                            <p>

                                Não possui acesso ao sistema?

                            </p>

                            <a

                                href="https://wa.me/5524981285708?text=Olá!%20Gostaria%20de%20solicitar%20acesso%20ao%20ERP%20Tem%20de%20Tudo."

                                target="_blank"

                                rel="noopener noreferrer"

                            >

                                Entre em contato com o administrador

                            </a>

                        </div>

                        {/*=============================================*/}
                        {/* COPYRIGHT */}
                        {/*=============================================*/}

                        <div className="copyright">

                            <strong>

                                ERP Tem de Tudo

                            </strong>

                            <br />

                            Versão 2.0.0

                            <br />

                            © {new Date().getFullYear()} Tem de Tudo Papelaria,
                            Presentes, Personalizados e Gráfica LTDA.

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}