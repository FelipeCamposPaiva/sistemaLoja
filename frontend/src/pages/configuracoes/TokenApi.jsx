import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronLeft } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";
import "../../styles/pages/token-api.css";

const CHAVE = "erp-token-api-v1";

function ler() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (bruto && typeof bruto.token === "string") {
            return bruto.token;
        }
    } catch {
        /* vazio */
    }
    return "";
}

function segmento(bytes) {
    const lista = new Uint8Array(bytes);
    crypto.getRandomValues(lista);
    return [...lista].map((item) => item.toString(16).padStart(2, "0")).join("");
}

export default function TokenApi() {
    const navigate = useNavigate();
    const [token, setToken] = useState(ler);
    const [aviso, setAviso] = useState("");

    function gravar(valor) {
        setToken(valor);
        localStorage.setItem(CHAVE, JSON.stringify({ token: valor }));
    }

    function gerar() {
        gravar(`${segmento(4)}/${segmento(12)}/${segmento(6)}/${segmento(4)}`);
        setAviso(token ? "Novo token gerado. O anterior deixa de valer neste ERP." : "Token gerado. Ele identifica a conta só neste ERP.");
    }

    function remover() {
        gravar("");
        setAviso("Token removido.");
    }

    return (
        <div className="emp-page tok-page">
            <div className="emp-top">
                <button type="button" className="emp-voltar" onClick={() => navigate(ROTAS.CONFIGURACOES)}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <nav className="dash-crumb" aria-label="Trilha">
                    <Link to={ROTAS.INDICE}>início</Link>
                    <span>›</span>
                    <Link to={ROTAS.CONFIGURACOES}>configurações</Link>
                    <span>›</span>
                    <span>token API</span>
                </nav>
            </div>
            <h2>Token API</h2>
            <p className="tok-sub">Interface de programação de aplicativos</p>
            {aviso ? <p className="emp-ok">{aviso}</p> : null}
            <label className="tok-campo">
                Token
                <input readOnly value={token} aria-label="Token" />
            </label>
            <p className="tok-ajuda">
                O Token é o identificador único de sua conta no Sistema ERP e permite operações nesta conta através das{" "}
                <Link to={ROTAS.APLICATIVOS_API}>APIs</Link>.
            </p>
            <aside className="tok-alerta">
                <AlertTriangle size={18} />
                <div>
                    <strong>Atenção</strong> O Token é o identificador único de sua conta neste ERP.
                    <p>Compartilhando seu Token de API com serviços de terceiros, estes terão acesso aos dados presentes em sua conta neste ERP por meio da API.</p>
                    <p>Consulte as políticas e os termos desses terceiros antes de enviar informações ou compartilhar seu Token de API.</p>
                </div>
            </aside>
            <div className="emp-acoes">
                <button type="button" className="emp-salvar" onClick={gerar}>gerar token API</button>
                <button type="button" className="tok-remover" onClick={remover} disabled={!token}>remover token API</button>
            </div>
        </div>
    );
}
