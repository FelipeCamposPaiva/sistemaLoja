/**
 * =============================================================================
 * ERP TEM DE TUDO
 * =============================================================================
 *
 * Arquivo.....: AuthGuard.jsx
 * Local.......: src/routes/guard/
 *
 * Responsável.: Protege rotas que exigem autenticação.
 *
 * =============================================================================
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Esta função deverá ser substituída pela autenticação do ERP.
 *
 * Exemplos:
 *
 * Context API
 * Redux
 * Zustand
 * JWT
 * Supabase
 * Firebase
 */

function isAuthenticated() {

    // TODO:
    // Integrar com AuthService

    return localStorage.getItem("token") !== null;

}

export default function AuthGuard({

    children

}) {

    const location = useLocation();

    if (!isAuthenticated()) {

        return (

            <Navigate

                to="/login"

                replace

                state={{

                    from: location

                }}

            />

        );

    }

    return children;

}