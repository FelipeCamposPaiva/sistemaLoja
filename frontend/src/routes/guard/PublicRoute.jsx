import { Navigate, Outlet } from "react-router-dom";

import Loader from "../../components/Loader";
import useAuth from "../../hooks/useAuth.jsx";

export default function PublicRoute() {
    const { autenticado, inicializando } = useAuth();

    if (inicializando) {
        return <Loader />;
    }

    if (autenticado) {
        return <Navigate to="/index" replace />;
    }

    return <Outlet />;
}
