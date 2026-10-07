import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";

import { definirUnidade, unidadeAtual, unidadePronta, UNIDADE_EVT, UNIDADE_PRINCIPAL } from "../../constants/empresas";
import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/sistema-unidade.css";

export default function SistemaUnidade() {
    const navigate = useNavigate();
    const [unidade, setUnidade] = useState(unidadeAtual);

    useEffect(() => {
        function sync() {
            setUnidade(unidadeAtual());
        }
        window.addEventListener(UNIDADE_EVT, sync);
        return () => window.removeEventListener(UNIDADE_EVT, sync);
    }, []);

    if (unidadePronta(unidade.id)) {
        return <Navigate to={ROTAS.INDICE} replace />;
    }

    function voltarPrincipal() {
        definirUnidade(UNIDADE_PRINCIPAL);
        navigate(ROTAS.INDICE);
    }

    return (
        <div className="sis-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <span>sistema</span>
            </nav>
            <p className="sis-kicker">{unidade.sigla}</p>
            <h2>{unidade.nome}</h2>
            <p className="sis-lead">A unidade foi trocada. O sistema dela ainda não existe.</p>
            <section className="sis-card">
                <Building2 size={28} strokeWidth={1.6} />
                <strong>Esta tela será criada futuramente</strong>
                <p>
                    Por enquanto a entrada em {unidade.nome} só marca a unidade ativa.
                    Os módulos deste sistema entram numa próxima etapa.
                </p>
                <button type="button" onClick={voltarPrincipal}>
                    Voltar para Água Limpa
                </button>
            </section>
        </div>
    );
}
