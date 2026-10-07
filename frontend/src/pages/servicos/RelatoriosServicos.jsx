import { Link } from "react-router-dom";
import { BarChart3, ChevronRight } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/os.css";

const RELATORIOS = [
    {
        nome: "Relatório por técnico",
        texto: "Serviços, peças e comissão de cada técnico.",
        rota: ROTAS.RELATORIO_TECNICOS
    }
];

export default function RelatoriosServicos() {
    return (
        <div className="os-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <span>Serviços</span>
                <span>›</span>
                <span>Relatórios</span>
            </nav>
            <div className="fer-head">
                <h2>Relatórios</h2>
                <p className="idx-sub">Consultas do grupo de serviços.</p>
            </div>
            <div className="os-lista">
                {RELATORIOS.map((item) => (
                    <Link key={item.rota} to={item.rota} className="os-relatorio-item">
                        <BarChart3 size={18} />
                        <span>
                            <strong>{item.nome}</strong>
                            <small>{item.texto}</small>
                        </span>
                        <ChevronRight size={16} />
                    </Link>
                ))}
            </div>
        </div>
    );
}
