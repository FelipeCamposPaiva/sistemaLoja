import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";
import "../../styles/pages/envio-documentos.css";
import "../../styles/pages/agenda-config.css";

const CHAVE = "erp-agenda-config-v1";

const PADRAO = {
    contasPagar: true,
    ordensServico: false,
    aniversario: false
};

function ler() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (bruto && typeof bruto === "object") {
            return {
                contasPagar: typeof bruto.contasPagar === "boolean" ? bruto.contasPagar : PADRAO.contasPagar,
                ordensServico: typeof bruto.ordensServico === "boolean" ? bruto.ordensServico : PADRAO.ordensServico,
                aniversario: typeof bruto.aniversario === "boolean" ? bruto.aniversario : PADRAO.aniversario
            };
        }
    } catch {
        /* padrão */
    }
    return { ...PADRAO };
}

const OPCOES = [
    { id: "contasPagar", nome: "Exibir Contas a Pagar" },
    { id: "ordensServico", nome: "Exibir Ordens de Serviço" },
    { id: "aniversario", nome: "Exibir clientes de aniversário" }
];

export default function AgendaConfig() {
    const navigate = useNavigate();
    const [form, setForm] = useState(ler);
    const [aviso, setAviso] = useState("");

    function voltar() {
        navigate(ROTAS.CONFIGURACOES);
    }

    function salvar(evento) {
        evento.preventDefault();
        localStorage.setItem(CHAVE, JSON.stringify(form));
        setAviso("Configuração da agenda salva.");
    }

    return (
        <form className="emp-page ag-page" onSubmit={salvar}>
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
                    <span>agenda</span>
                </nav>
            </div>
            <h2>Configurações da agenda</h2>
            {aviso ? <p className="emp-ok">{aviso}</p> : null}
            <div className="ag-opcoes">
                {OPCOES.map((opcao) => (
                    <label key={opcao.id} className="env-opcao">
                        <input
                            type="checkbox"
                            role="switch"
                            checked={form[opcao.id]}
                            onChange={(evento) => {
                                setForm((atual) => ({ ...atual, [opcao.id]: evento.target.checked }));
                                setAviso("");
                            }}
                        />
                        {opcao.nome}
                    </label>
                ))}
            </div>
            <div className="emp-acoes">
                <button type="submit" className="emp-salvar">salvar</button>
                <button type="button" className="emp-cancelar" onClick={voltar}>cancelar</button>
            </div>
        </form>
    );
}
