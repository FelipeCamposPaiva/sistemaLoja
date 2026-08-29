import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";
import Content from "./Content";
import Footer from "./Footer";

import "../../styles/layout/layout.css";

export default function Layout() {

    return (

        <div className="erp-layout">

            {/* ========================= */}
            {/* SIDEBAR */}
            {/* ========================= */}

            <Sidebar />

            {/* ========================= */}
            {/* ÁREA PRINCIPAL */}
            {/* ========================= */}

            <div className="erp-main">

                {/* HEADER */}

                <Header />

                {/* CONTEÚDO */}

                <Content>

                    <Outlet />

                </Content>

                {/* RODAPÉ */}

                <Footer />

            </div>

        </div>

    );

}