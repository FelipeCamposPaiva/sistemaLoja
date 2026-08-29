import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import PublicRoute from "./guard/PublicRoute";
import PrivateRoute from "./guard/PrivateRoute";

const Login = lazy(() => import("../pages/auth/Login"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const DashboardSmoke = lazy(() => import("../pages/inicio/DashboardSmoke"));

function Loader() {
    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            Carregando...
        </div>
    );
}

export default function AppRoutes() {
    return (
        <Suspense fallback={<Loader />}>
            <Routes>
                <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/esqueci-senha" element={<ForgotPassword />} />
                </Route>

                <Route element={<PrivateRoute />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardSmoke />} />
                </Route>

                <Route path="/403" element={<h1>403 - Acesso Negado</h1>} />
                <Route path="/404" element={<h1>404 - Página não encontrada</h1>} />
                <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
        </Suspense>
    );
}
