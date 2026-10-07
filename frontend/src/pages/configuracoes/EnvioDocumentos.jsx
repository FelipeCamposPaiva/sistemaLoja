import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";
import "../../styles/pages/envio-documentos.css";

const CHAVE = "erp-envio-documentos-v1";

function ler() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (bruto && typeof bruto.whatsapp === "boolean") {
            return bruto.whatsapp;
        }
    } catch {
        /* ignore */
    }
    return true;
}

export default function EnvioDocumentos() {
    const navigate = useNavigate();
    const [whatsapp, setWhatsapp] = useState(ler);
    const [aviso, setAviso] = useState("");

    function voltar() {
        navigate(ROTAS.CONFIGURACOES);
    }

    function salvar(evento) {
        evento.preventDefault();
        localStorage.setItem(CHAVE, JSON.stringify({ whatsapp }));
        setAviso("Configuração do envio de documentos salva.");
    }

    return (
        <form className="emp-page env-page" onSubmit={salvar}>
            <div className="emp-top">
                <button type="button" className="emp-voltar" onClick={voltar}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <nav className="dash-crumb" aria-label="Trilha">
                    <Link to={ROTAS.INDICE}>início</Link>
                    <span>›</span>
                    <Link to={ROTAS.CONFIGURACOES}>configurações</Link>
                    <span>›</span>
                    <span>envio de documentos</span>
                </nav>
            </div>
            <h2>Configurações do envio de documentos</h2>
            {aviso ? <p className="emp-ok">{aviso}</p> : null}
            <label className="env-opcao">
                <input
                    type="checkbox"
                    role="switch"
                    checked={whatsapp}
                    onChange={(e) => {
                        setWhatsapp(e.target.checked);
                        setAviso("");
                    }}
                />
                Compartilhar documento via Whatsapp
            </label>
            <div className="emp-acoes">
                <button type="submit" className="emp-salvar">salvar</button>
                <button type="button" className="emp-cancelar" onClick={voltar}>cancelar</button>
            </div>
        </form>
    );
}
