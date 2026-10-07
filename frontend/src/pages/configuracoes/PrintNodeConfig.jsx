import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";
import "../../styles/pages/print-node.css";

const CHAVE = "erp-print-node-v1";

function ler() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (bruto && typeof bruto.apiKey === "string") {
            return bruto.apiKey;
        }
    } catch {
        /* vazio */
    }
    return "";
}

export default function PrintNodeConfig() {
    const navigate = useNavigate();
    const [apiKey, setApiKey] = useState(ler);
    const [visivel, setVisivel] = useState(false);
    const [aviso, setAviso] = useState("");
    const [erro, setErro] = useState(false);

    function gravar(valor) {
        localStorage.setItem(CHAVE, JSON.stringify({ apiKey: valor }));
    }

    function testar() {
        const chave = apiKey.trim();
        if (!chave) {
            setErro(true);
            setAviso("Informe a API key.");
            return;
        }
        gravar(chave);
        setApiKey(chave);
        setErro(false);
        setAviso("API key guardada. O teste com o PrintNode ainda não sai por este ERP.");
    }

    return (
        <div className="emp-page pn-page">
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
                    <span>impressão automática</span>
                </nav>
            </div>
            <h2>Configurações para impressão automática</h2>
            <div className="pn-texto">
                <p>A impressão automática é possível através da integração com o serviço PrintNode</p>
                <p>
                    Para poder utilizar este serviço, acesse{" "}
                    <a href="https://www.printnode.com" target="_blank" rel="noreferrer">www.printnode.com</a>
                    {" "}e crie uma nova conta, caso ainda não possua.
                </p>
                <p>
                    Ao se conectar, será instruído que faça o download do cliente responsável por se conectar com suas impressoras disponíveis. Após instalado, faça o login pelo aplicativo. A partir deste momento, suas impressoras estarão disponíveis para o PrintNode
                </p>
                <p>
                    Para concluir, acesse a página para{" "}
                    <a href="https://app.printnode.com/account/apikey" target="_blank" rel="noreferrer">criação de uma apikey</a>
                    . Após gerada, cole a api key no campo abaixo
                </p>
                <p>
                    As etiquetas de envio são enviadas a impressora no formato ZPL, sendo necessário uma impressora do tipo ZEBRA para imprimi-las.
                </p>
            </div>
            <label className="pn-campo">
                API Key
                <span>
                    <input
                        type={visivel ? "text" : "password"}
                        value={apiKey}
                        autoComplete="off"
                        onChange={(evento) => {
                            setApiKey(evento.target.value);
                            setAviso("");
                        }}
                        onBlur={() => gravar(apiKey.trim())}
                    />
                    <button
                        type="button"
                        aria-label={visivel ? "Ocultar API key" : "Mostrar API key"}
                        onClick={() => setVisivel((atual) => !atual)}
                    >
                        {visivel ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </span>
            </label>
            {aviso ? <p className={erro ? "emp-erro" : "emp-ok"}>{aviso}</p> : null}
            <button type="button" className="pn-testar" onClick={testar}>testar integração</button>
        </div>
    );
}
