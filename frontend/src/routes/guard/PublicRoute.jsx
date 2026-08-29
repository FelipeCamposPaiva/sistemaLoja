import { Navigate, Outlet } from "react-router-dom";

import useAuth from "../../hooks/useAuth.jsx";

function LoaderDev() {
    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            Carregando...
        </div>
    );
}

export default function PublicRoute() {
    const { autenticado, inicializando } = useAuth();

    if (inicializando) {
        return <LoaderDev />;
    }

    if (autenticado) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
