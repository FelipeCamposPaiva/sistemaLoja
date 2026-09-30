import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";

const MESES = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

export default function Sintegra() {
    const navigate = useNavigate();
    const hoje = new Date();
    const [mes, setMes] = useState(hoje.getMonth());
    const [ano, setAno] = useState(hoje.getFullYear());
    const [cte, setCte] = useState(false);
    const [inventario, setInventario] = useState(false);
    const [ipi, setIpi] = useState(false);
    const [nome, setNome] = useState("");
    const [fone, setFone] = useState("");
    const [msg, setMsg] = useState("");

    function mudarMes(delta) {
        const data = new Date(ano, mes + delta, 1);
        setMes(data.getMonth());
        setAno(data.getFullYear());
    }

    function gerar() {
        setMsg(`Arquivo Sintegra ${String(mes + 1).padStart(2, "0")}/${ano} gerado.`);
    }

    return (
        <div className="fer-main">
            <nav className="dash-crumb" aria-label="Trilha">
                <button type="button" className="int-voltar" onClick={() => navigate("/ferramentas_geral?aba=exportacoes")}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <Link to="/index">início</Link>
                <span>›</span>
                <Link to="/ferramentas_geral">ferramentas</Link>
                <span>›</span>
                <span>Sintegra</span>
            </nav>
            <h2 className="fer-title">Sintegra</h2>
            <form
                className="fer-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    gerar();
                }}
            >
                <label>
                    Mês
                    <span className="fer-mes">
                        <button type="button" onClick={() => mudarMes(-1)}>&lt;</button>
                        {MESES[mes]}/{ano}
                        <button type="button" onClick={() => mudarMes(1)}>&gt;</button>
                    </span>
                </label>
                <label className="fer-check">
                    <input type="checkbox" checked={cte} onChange={(e) => setCte(e.target.checked)} />
                    Exportar dados de CTe (Registro 70)
                </label>
                <label className="fer-check">
                    <input type="checkbox" checked={inventario} onChange={(e) => setInventario(e.target.checked)} />
                    Exportar dados de inventário (Registro 74)
                </label>
                <label>
                    Nome do responsável para contato
                    <input value={nome} onChange={(e) => setNome(e.target.value)} />
                </label>
                <label>
                    Telefone
                    <input value={fone} onChange={(e) => setFone(e.target.value)} />
                </label>
                <label className="fer-check">
                    <input type="checkbox" checked={ipi} onChange={(e) => setIpi(e.target.checked)} />
                    Não contribuinte do IPI
                </label>
                {ipi ? (
                    <p className="fer-ajuda">Ao selecionar esta opção os registros referentes ao IPI (bloco 51) não serão gerados.</p>
                ) : null}
                <button type="button" className="idx-text" onClick={() => navigate("/ferramentas/importar/contatos")}>
                    exportar clientes e fornecedores
                </button>
                <button type="submit" className="idx-pill int-add">gerar arquivo</button>
                {msg ? <p className="int-aviso">{msg}</p> : null}
            </form>
        </div>
    );
}
