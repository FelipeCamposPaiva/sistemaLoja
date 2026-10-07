import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import AvisoErro, { LimiteErro } from "./components/AvisoErro.jsx";

import "./styles/global.css";

ReactDOM.createRoot(

    document.getElementById("root")

).render(

    <React.StrictMode>

        <BrowserRouter>

            <AvisoErro />

            <LimiteErro>

                <App />

            </LimiteErro>

        </BrowserRouter>

    </React.StrictMode>

);
