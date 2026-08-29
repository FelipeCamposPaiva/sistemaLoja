import { Navigate, Outlet, useLocation } from "react-router-dom";

import useAuth from "../../hooks/useAuth.jsx";

function LoaderDev() {
    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            Carregando...
        </div>
    );
}

export default function PrivateRoute() {
    const { autenticado, inicializando } = useAuth();
    const location = useLocation();

    if (inicializando) {
        return <LoaderDev />;
    }

    if (!autenticado) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return <Outlet />;
}
