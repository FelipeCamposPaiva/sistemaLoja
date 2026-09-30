import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, MoreVertical, Search } from "lucide-react";

import { ANEXOS_DEMO } from "../../constants/ferramentas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";

const ORIGENS = [
    "Sem filtro",
    "Clientes e fornecedores",
    "Conta a pagar",
    "Conta a receber",
    "Contrato",
    "Lançamento de caixa",
    "Ordem de Serviço",
    "Pedidos de Venda",
    "Produto",
    "Proposta comercial"
];

export default function Anexos() {
    const navigate = useNavigate();
    const [busca, setBusca] = useState("");
    const [origem, setOrigem] = useState("Sem filtro");

    const lista = useMemo(() => {
        const texto = busca.trim().toLowerCase();
        return ANEXOS_DEMO.filter((item) => {
            if (origem !== "Sem filtro" && item.origem !== origem) {
                return false;
            }
            return !texto || item.nome.toLowerCase().includes(texto) || item.id.toLowerCase().includes(texto);
        });
    }, [busca, origem]);

    return (
        <div className="fer-main">
            <nav className="dash-crumb" aria-label="Trilha">
                <button type="button" className="int-voltar" onClick={() => navigate("/ferramentas_geral")}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <Link to="/index">início</Link>
                <span>›</span>
                <Link to="/ferramentas_geral">ferramentas</Link>
                <span>›</span>
                <span>gerenciar anexos</span>
            </nav>
            <h2 className="fer-title">Gerenciar anexos</h2>
            <div className="fer-filtros">
                <label className="fer-search">
                    <Search size={15} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Pesquise por nome ou extensão"
                    />
                </label>
                <select className="fer-chip" value={origem} onChange={(e) => setOrigem(e.target.value)}>
                    {ORIGENS.map((item) => (
                        <option key={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className="fer-scroll">
                <table className="fer-table">
                    <thead>
                        <tr>
                            <th />
                            <th />
                            <th>Nome</th>
                            <th>Tamanho</th>
                            <th>Origem</th>
                            <th>Identificação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.map((item) => (
                            <tr key={item.nome}>
                                <td><input type="checkbox" /></td>
                                <td>
                                    <button type="button" className="idx-more" aria-label="Mais ações">
                                        <MoreVertical size={14} />
                                    </button>
                                </td>
                                <td>
                                    <span className="fer-thumb">{item.nome.split(".").pop()}</span>
                                    {" "}
                                    {item.nome}
                                </td>
                                <td>{item.tam} mb</td>
                                <td>{item.origem}</td>
                                <td>{item.id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="fer-foot">
                <span>01 →</span>
                <span>{lista.length} anexos · 1.665,48 tamanho(mb)</span>
            </div>
        </div>
    );
}
