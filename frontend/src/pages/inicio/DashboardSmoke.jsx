import { useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth.jsx";

export default function DashboardSmoke() {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    function sair() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <div style={{
            minHeight: "100vh",
            padding: "2rem",
            fontFamily: "Inter, Segoe UI, sans-serif",
            background: "#f6f8fb",
            color: "#2d3748"
        }}>
            <header style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem"
            }}>
                <h1 style={{ margin: 0, fontSize: "1.4rem" }}>
                    ERP Tem de Tudo
                </h1>
                <button type="button" onClick={sair}>
                    Sair
                </button>
            </header>

            <p>
                Ambiente de teste básico. Login ok
                {usuario?.nome ? ` — ${usuario.nome}` : ""}.
            </p>
        </div>
    );
}
