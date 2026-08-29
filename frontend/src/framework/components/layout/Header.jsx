import { useState } from "react";

import {

    FaBars,

    FaSearch,

    FaBell,

    FaCalendarAlt,

    FaPlus,

    FaMoon,

    FaSun,

    FaUserCircle,

    FaCog,

    FaSignOutAlt,

    FaChevronDown

} from "react-icons/fa";

import useAuth from "../../hooks/useAuth";

import "../../styles/layout/header.css";

export default function Header() {

    const {

        usuario,

        logout

    } = useAuth();

    const [menuUsuario, setMenuUsuario] = useState(false);

    const [temaEscuro, setTemaEscuro] = useState(false);

    function trocarTema() {

        setTemaEscuro(

            !temaEscuro

        );

        document.body.classList.toggle(

            "dark-theme"

        );

    }

    function sair() {

        logout();

        window.location.href = "/login";

    }

    return (

        <header className="erp-header">

            {/*=======================================*/}
            {/* ESQUERDA */}
            {/*=======================================*/}

            <div className="header-left">

                <button className="header-icon-btn">

                    <FaBars />

                </button>

                <div className="header-search">

                    <FaSearch />

                    <input

                        type="text"

                        placeholder="Pesquisar clientes, produtos, pedidos..."

                    />

                </div>

            </div>

            {/*=======================================*/}
            {/* DIREITA */}
            {/*=======================================*/}

            <div className="header-right">

                <button className="btn-novo">

                    <FaPlus />

                    Novo

                </button>

                <button className="header-icon-btn">

                    <FaCalendarAlt />

                </button>

                <button className="header-icon-btn">

                    <FaBell />

                    <span className="badge-notificacao">

                        3

                    </span>

                </button>

                <button

                    className="header-icon-btn"

                    onClick={trocarTema}

                >

                    {

                        temaEscuro

                            ?

                            <FaSun />

                            :

                            <FaMoon />

                    }

                </button>

                {/*=======================================*/}
                {/* USUÁRIO */}
                {/*=======================================*/}

                <div

                    className="header-user"

                    onClick={()=>

                        setMenuUsuario(

                            !menuUsuario

                        )

                    }

                >

                    <FaUserCircle className="avatar-user" />

                    <div>

                        <strong>

                            {

                                usuario?.nome ||

                                "Administrador"

                            }

                        </strong>

                        <small>

                            {

                                usuario?.perfil ||

                                "ADMIN"

                            }

                        </small>

                    </div>

                    <FaChevronDown />

                    {

                        menuUsuario && (

                            <div className="menu-user">

                                <button>

                                    <FaUserCircle />

                                    Meu Perfil

                                </button>

                                <button>

                                    <FaCog />

                                    Configurações

                                </button>

                                <button

                                    onClick={sair}

                                >

                                    <FaSignOutAlt />

                                    Sair

                                </button>

                            </div>

                        )

                    }

                </div>

            </div>

        </header>

    );

}