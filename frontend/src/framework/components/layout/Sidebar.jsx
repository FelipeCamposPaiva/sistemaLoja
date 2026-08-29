import { useState } from "react";

import {

    NavLink

} from "react-router-dom";

import {

    FaBars,

    FaHome,

    FaUsers,

    FaBoxOpen,

    FaShoppingCart,

    FaCashRegister,

    FaPrint,

    FaClipboardList,

    FaCalendarAlt,

    FaChartBar,

    FaCog,

    FaChevronDown,

    FaChevronRight,

    FaStore

} from "react-icons/fa";

import logo from "../../assets/logo/logo.png";

import "../../styles/layout/sidebar.css";

export default function Sidebar() {

    const [collapsed, setCollapsed] = useState(false);

    const [cadastros, setCadastros] = useState(true);

    return (

        <aside

            className={

                collapsed

                    ? "erp-sidebar collapsed"

                    : "erp-sidebar"

            }

        >

            {/*========================================*/}
            {/* LOGO */}
            {/*========================================*/}

            <div className="sidebar-top">

                <button

                    className="collapse-btn"

                    onClick={()=>

                        setCollapsed(

                            !collapsed

                        )

                    }

                >

                    <FaBars />

                </button>

                {

                    !collapsed && (

                        <img

                            src={logo}

                            alt="Tem de Tudo"

                            className="sidebar-logo"

                        />

                    )

                }

            </div>

            {/*========================================*/}
            {/* EMPRESA */}
            {/*========================================*/}

            {

                !collapsed && (

                    <div className="empresa-box">

                        <FaStore />

                        <div>

                            <strong>

                                Tem de Tudo

                            </strong>

                            <small>

                                Loja Principal

                            </small>

                        </div>

                    </div>

                )

            }

            {/*========================================*/}
            {/* MENU */}
            {/*========================================*/}

            <nav className="sidebar-menu">

                <NavLink

                    to="/dashboard"

                    className="menu-item"

                >

                    <FaHome />

                    {

                        !collapsed && (

                            <span>

                                Dashboard

                            </span>

                        )

                    }

                </NavLink>

                {/*========================================*/}
                {/* CADASTROS */}
                {/*========================================*/}

                <button

                    className="menu-item menu-button"

                    onClick={()=>

                        setCadastros(

                            !cadastros

                        )

                    }

                >

                    <FaUsers />

                    {

                        !collapsed && (

                            <>

                                <span>

                                    Cadastros

                                </span>

                                {

                                    cadastros

                                        ?

                                        <FaChevronDown />

                                        :

                                        <FaChevronRight />

                                }

                            </>

                        )

                    }

                </button>

                {

                    cadastros && !collapsed && (

                        <div className="submenu">

                            <NavLink

                                to="/clientes"

                            >

                                Clientes

                            </NavLink>

                            <NavLink

                                to="/fornecedores"

                            >

                                Fornecedores

                            </NavLink>

                            <NavLink

                                to="/funcionarios"

                            >

                                Funcionários

                            </NavLink>

                            <NavLink

                                to="/transportadoras"

                            >

                                Transportadoras

                            </NavLink>

                        </div>

                    )

                }

                <NavLink

                    to="/estoque"

                    className="menu-item"

                >

                    <FaBoxOpen />

                    {

                        !collapsed && (

                            <span>

                                Estoque

                            </span>

                        )

                    }

                </NavLink>

                <NavLink

                    to="/compras"

                    className="menu-item"

                >

                    <FaShoppingCart />

                    {

                        !collapsed && (

                            <span>

                                Compras

                            </span>

                        )

                    }

                </NavLink>

                <NavLink

                    to="/financeiro"

                    className="menu-item"

                >

                    <FaCashRegister />

                    {

                        !collapsed && (

                            <span>

                                Financeiro

                            </span>

                        )

                    }

                </NavLink>

                <NavLink

                    to="/producao"

                    className="menu-item"

                >

                    <FaPrint />

                    {

                        !collapsed && (

                            <span>

                                Produção

                            </span>

                        )

                    }

                </NavLink>

                <NavLink

                    to="/ordens-servico"

                    className="menu-item"

                >

                    <FaClipboardList />

                    {

                        !collapsed && (

                            <span>

                                Ordens de Serviço

                            </span>

                        )

                    }

                </NavLink>

                <NavLink

                    to="/agenda"

                    className="menu-item"

                >

                    <FaCalendarAlt />

                    {

                        !collapsed && (

                            <span>

                                Agenda

                            </span>

                        )

                    }

                </NavLink>

                <NavLink

                    to="/relatorios"

                    className="menu-item"

                >

                    <FaChartBar />

                    {

                        !collapsed && (

                            <span>

                                Relatórios

                            </span>

                        )

                    }

                </NavLink>

                <NavLink

                    to="/configuracoes"

                    className="menu-item"

                >

                    <FaCog />

                    {

                        !collapsed && (

                            <span>

                                Configurações

                            </span>

                        )

                    }

                </NavLink>

            </nav>

        </aside>

    );

}