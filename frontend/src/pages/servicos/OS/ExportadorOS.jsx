import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Download } from "lucide-react";

import { MESES, isoDate } from "../../../constants/ordensServico";
import ROTAS from "../../../constants/rotas";
import { listarOS } from "../../../services/os.service";
import { exportarPlanilhaOS } from "../../../services/osImport.service";

import "../../../styles/layout/app-shell.css";
import "../../../styles/pages/indice.css";
import "../../../styles/pages/ferramentas.css";
import "../../../styles/pages/os.css";

const HOJE = new Date();

export default function ExportadorOS() {
    const navigate = useNavigate();
    const [formato, setFormato] = useState("xls");
    const [mes, setMes] = useState(HOJE.getMonth());
    const [ano, setAno] = useState(HOJE.getFullYear());
    const [lista, setLista] = useState([]);
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        listarOS().then(setLista).catch(() => setAviso("Não foi possível ler as ordens de serviço."));
    }, []);

    function mudarMes(delta) {
        const d = new Date(ano, mes + delta, 1);
        setMes(d.getMonth());
        setAno(d.getFullYear());
    }

    function baixar() {
        const filtradas = lista.filter((os) => {
            const iso = isoDate(os.dataAbertura);
            if (!iso) {
                return false;
            }
            const d = new Date(`${iso}T12:00:00`);
            return d.getMonth() === mes && d.getFullYear() === ano;
        });
        exportarPlanilhaOS(filtradas, formato);
    }

    return (
        <div className="fer-main">
            <nav className="dash-crumb">
                <button type="button" className="int-voltar" onClick={() => navigate(ROTAS.ORDEM_SERVICO)}>
                    <ChevronLeft size={16} /> voltar
                </button>
                <Link to="/index">início</Link>
                <span>›</span>
                <span>serviços</span>
                <span>›</span>
                <span>exportação</span>
            </nav>
            <h2>Exportação de Ordens de Serviço</h2>
            {aviso ? <p className="prd-aviso">{aviso}</p> : null}
            <div className="os-export-ops">
                <label>
                    <input type="radio" name="fmt" checked={formato === "xls"} onChange={() => setFormato("xls")} />
                    Exportar no formato Excel (.xls)
                </label>
                <label>
                    <input type="radio" name="fmt" checked={formato === "csv"} onChange={() => setFormato("csv")} />
                    Exportar no formato texto (.csv)
                </label>
            </div>
            <p className="fer-ajuda">Período</p>
            <div className="os-mes-nav">
                <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior">‹</button>
                <strong>{String(mes + 1).padStart(2, "0")} {ano}</strong>
                <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês">›</button>
            </div>
            <button type="button" className="prd-btn prd-btn-primary" onClick={baixar}>
                <Download size={15} /> download
            </button>
            <p className="os-hint">{MESES[mes]} · {lista.length} ordem(ns) no cadastro</p>
        </div>
    );
}
