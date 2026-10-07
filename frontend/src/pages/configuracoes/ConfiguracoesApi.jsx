import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";
import "../../styles/pages/envio-documentos.css";
import "../../styles/pages/configuracoes-api.css";

const CHAVE = "erp-configuracoes-api-v1";

const PADRAO = {
    forcarBalanco: true,
    syncAnuncios: true
};

function ler() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (bruto && typeof bruto === "object") {
            return {
                forcarBalanco: typeof bruto.forcarBalanco === "boolean" ? bruto.forcarBalanco : PADRAO.forcarBalanco,
                syncAnuncios: typeof bruto.syncAnuncios === "boolean" ? bruto.syncAnuncios : PADRAO.syncAnuncios
            };
        }
    } catch {
        /* padrão */
    }
    return { ...PADRAO };
}

const OPCOES = [
    {
        id: "forcarBalanco",
        nome: "Forçar criação de novo registro de balanço de estoque quando preço e quantidade são iguais a da última atualização",
        ajuda: "Configuração somente utilizada para registros de balanço de estoque."
    },
    {
        id: "syncAnuncios",
        nome: "Sincronizar estoque de anúncios automaticamente ao gerar balanço via API",
        ajuda: "Quando desabilitado, o estoque dos anúncios não será atualizado ao criar um balanço de estoque pela API."
    }
];

export default function ConfiguracoesApi() {
    const navigate = useNavigate();
    const [form, setForm] = useState(ler);
    const [aviso, setAviso] = useState("");

    function voltar() {
        navigate(ROTAS.CONFIGURACOES);
    }

    function salvar(evento) {
        evento.preventDefault();
        localStorage.setItem(CHAVE, JSON.stringify(form));
        setAviso("Configurações de API salvas.");
    }

    return (
        <form className="emp-page capi-page" onSubmit={salvar}>
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
                    <span>configurações de api</span>
                </nav>
            </div>
            <h2>Configurações de API</h2>
            {aviso ? <p className="emp-ok">{aviso}</p> : null}
            <h3>Estoque API</h3>
            <div className="capi-opcoes">
                {OPCOES.map((opcao) => (
                    <label key={opcao.id} className="env-opcao capi-opcao">
                        <input
                            type="checkbox"
                            role="switch"
                            checked={form[opcao.id]}
                            onChange={(evento) => {
                                setForm((atual) => ({ ...atual, [opcao.id]: evento.target.checked }));
                                setAviso("");
                            }}
                        />
                        <span>
                            {opcao.nome}
                            <small>{opcao.ajuda}</small>
                        </span>
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
