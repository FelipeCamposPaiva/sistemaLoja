import { Navigate, Outlet, useLocation } from "react-router-dom";

import Loader from "../../components/Loader";
import useAuth from "../../hooks/useAuth.jsx";

export default function PrivateRoute() {
    const { autenticado, inicializando } = useAuth();
    const location = useLocation();

    if (inicializando) {
        return <Loader />;
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
