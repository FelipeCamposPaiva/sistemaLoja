import { Link } from "react-router-dom";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/rh.css";

const ATALHOS = [
    { id: "solicitacao", nome: "Solicitação Geral", rota: "/rh/solicitacao", icon: "docs" },
    { id: "empregado", nome: "Cadastro de Empregado", rota: "/rh/cadastro/empregado", icon: "cracha" },
    { id: "contribuinte", nome: "Cadastro de Contribuinte", rota: "/rh/cadastro/contribuinte", icon: "terno" },
    { id: "estagiario", nome: "Cadastro de Estagiário", rota: "/rh/cadastro/estagiario", icon: "oculos" },
    { id: "ferias-aviso", nome: "Aviso Prévio de Férias", rota: "/rh/ferias-aviso", icon: "ferias" },
    { id: "ferias-calculo", nome: "Cálculo de Férias", rota: "/rh/ferias-calculo", icon: "calc-ferias" },
    { id: "rescisao-aviso", nome: "Aviso Prévio de Rescisão", rota: "/rh/rescisao-aviso", icon: "aviso" },
    { id: "rescisao-calculo", nome: "Cálculo de Rescisão", rota: "/rh/rescisao-calculo", icon: "calc-resc" },
    { id: "afastamento", nome: "Afastamento de Empregado", rota: "/rh/afastamento", icon: "afast" },
    { id: "rubricas", nome: "Lançamento de Rubricas", rota: "/rh/rubricas", icon: "rubrica" }
];

function Icone({ tipo }) {
    const stroke = "#334155";
    const fill = "#f97316";
    if (tipo === "docs") {
        return (
            <svg viewBox="0 0 72 72" aria-hidden="true">
                <rect x="18" y="16" width="28" height="38" rx="3" fill="#fff" stroke={stroke} />
                <rect x="24" y="12" width="28" height="38" rx="3" fill="#fff" stroke={stroke} />
                <path d="M30 24h16M30 30h12" stroke={fill} strokeWidth="2" />
            </svg>
        );
    }
    if (tipo === "cracha") {
        return (
            <svg viewBox="0 0 72 72" aria-hidden="true">
                <circle cx="36" cy="22" r="10" fill="#fff" stroke={stroke} />
                <path d="M18 58c2-14 10-20 18-20s16 6 18 20" fill="#fff" stroke={stroke} />
                <rect x="40" y="36" width="16" height="12" rx="2" fill="#fff" stroke={stroke} />
                <circle cx="48" cy="42" r="3" fill={fill} />
            </svg>
        );
    }
    if (tipo === "terno") {
        return (
            <svg viewBox="0 0 72 72" aria-hidden="true">
                <circle cx="36" cy="20" r="10" fill="#fff" stroke={stroke} />
                <path d="M16 58V40l20-6 20 6v18" fill="#fff" stroke={stroke} />
                <path d="M36 34v24" stroke={stroke} />
                <path d="M32 38h8v10h-8z" fill={fill} />
            </svg>
        );
    }
    if (tipo === "oculos") {
        return (
            <svg viewBox="0 0 72 72" aria-hidden="true">
                <circle cx="36" cy="22" r="10" fill="#fff" stroke={stroke} />
                <path d="M24 24h8M40 24h8" stroke={stroke} />
                <circle cx="28" cy="24" r="4" fill="none" stroke={stroke} />
                <circle cx="44" cy="24" r="4" fill="none" stroke={stroke} />
                <path d="M18 58c2-14 10-20 18-20s16 6 18 20" fill="#fff" stroke={stroke} />
                <rect x="40" y="38" width="14" height="10" rx="2" fill="#fff" stroke={stroke} />
                <circle cx="47" cy="43" r="2.5" fill={fill} />
            </svg>
        );
    }
    if (tipo === "ferias") {
        return (
            <svg viewBox="0 0 72 72" aria-hidden="true">
                <rect x="16" y="22" width="32" height="28" rx="3" fill="#fff" stroke={stroke} />
                <path d="M16 30h32" stroke={stroke} />
                <circle cx="32" cy="40" r="5" fill={fill} />
                <path d="M52 40c6 0 10 8 4 14" fill="none" stroke={stroke} />
                <circle cx="58" cy="20" r="6" fill={fill} opacity="0.8" />
            </svg>
        );
    }
    if (tipo === "calc-ferias") {
        return (
            <svg viewBox="0 0 72 72" aria-hidden="true">
                <rect x="18" y="16" width="28" height="40" rx="4" fill="#fff" stroke={stroke} />
                <rect x="24" y="22" width="16" height="8" rx="1" fill="#e2e8f0" />
                <circle cx="28" cy="40" r="3" fill={fill} />
                <circle cx="36" cy="40" r="3" fill="#cbd5e1" />
                <circle cx="28" cy="48" r="3" fill="#cbd5e1" />
                <path d="M52 40c6 0 10 8 4 14" fill="none" stroke={stroke} />
                <circle cx="58" cy="20" r="6" fill={fill} opacity="0.8" />
            </svg>
        );
    }
    if (tipo === "aviso") {
        return (
            <svg viewBox="0 0 72 72" aria-hidden="true">
                <path d="M16 16h22v40H16z" fill="#fff" stroke={stroke} />
                <path d="M38 16l10 40H38V16z" fill="#fff" stroke={stroke} />
                <rect x="46" y="40" width="16" height="14" rx="2" fill="#fff" stroke={stroke} />
                <circle cx="54" cy="47" r="3" fill={fill} />
            </svg>
        );
    }
    if (tipo === "calc-resc") {
        return (
            <svg viewBox="0 0 72 72" aria-hidden="true">
                <path d="M14 16h20v36H14z" fill="#fff" stroke={stroke} />
                <path d="M34 16l8 36H34V16z" fill="#fff" stroke={stroke} />
                <rect x="44" y="22" width="18" height="28" rx="3" fill="#fff" stroke={stroke} />
                <circle cx="53" cy="42" r="3" fill={fill} />
            </svg>
        );
    }
    if (tipo === "afast") {
        return (
            <svg viewBox="0 0 72 72" aria-hidden="true">
                <circle cx="24" cy="18" r="8" fill="#fff" stroke={stroke} />
                <path d="M10 52c1-12 7-16 14-16s13 4 14 16" fill="#fff" stroke={stroke} />
                <path d="M16 36h10v10" fill="none" stroke={fill} strokeWidth="3" />
                <circle cx="50" cy="20" r="8" fill="#fff" stroke={stroke} />
                <path d="M38 54c1-10 6-16 12-16s11 6 12 16" fill="#fff" stroke={stroke} />
                <ellipse cx="50" cy="40" rx="7" ry="9" fill={fill} opacity="0.7" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 72 72" aria-hidden="true">
            <rect x="18" y="12" width="36" height="48" rx="3" fill="#fff" stroke={stroke} />
            <path d="M26 28h20M26 36h20M26 44h14" stroke={stroke} />
            <circle cx="48" cy="18" r="7" fill={fill} />
        </svg>
    );
}

export default function RhHub() {
    return (
        <div className="rh-page rh-hub">
            <nav className="rh-crumb">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <span>Funcionários</span>
                <span>›</span>
                <span>RH</span>
            </nav>
            <header className="rh-head">
                <div>
                    <h2>RH</h2>
                    <p>Cadastros, férias, rescisão, afastamento e rubricas da folha 895.</p>
                </div>
            </header>
            <div className="rh-tiles">
                {ATALHOS.map((a) => (
                    <Link key={a.id} to={a.rota} className="rh-tile">
                        <Icone tipo={a.icon} />
                        <span>{a.nome}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
