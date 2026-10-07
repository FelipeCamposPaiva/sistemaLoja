import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";
import "../../styles/pages/envio-documentos.css";
import "../../styles/pages/webhooks.css";

const CHAVE = "erp-webhooks-v1";

const PADRAO = {
    vendas: false,
    pedidosEnviados: false,
    estoque: false,
    notasAutorizadas: false
};

function ler() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (bruto && typeof bruto === "object") {
            return {
                vendas: bruto.vendas === true,
                pedidosEnviados: bruto.pedidosEnviados === true,
                estoque: bruto.estoque === true,
                notasAutorizadas: bruto.notasAutorizadas === true
            };
        }
    } catch {
        /* padrão */
    }
    return { ...PADRAO };
}

const OPCOES = [
    { id: "vendas", nome: "Receber notificações de vendas" },
    { id: "pedidosEnviados", nome: "Receber notificações de pedidos enviados" },
    { id: "estoque", nome: "Receber notificações de lançamentos de estoque" },
    { id: "notasAutorizadas", nome: "Receber notificações de notas fiscais autorizadas" }
];

export default function WebhooksConfig() {
    const navigate = useNavigate();
    const [form, setForm] = useState(ler);
    const [aviso, setAviso] = useState("");

    function voltar() {
        navigate(ROTAS.CONFIGURACOES);
    }

    function salvar(evento) {
        evento.preventDefault();
        localStorage.setItem(CHAVE, JSON.stringify(form));
        setAviso("Webhooks salvos.");
    }

    return (
        <form className="emp-page wh-page" onSubmit={salvar}>
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
                    <span>webhooks</span>
                </nav>
            </div>
            <h2>Webhooks</h2>
            {aviso ? <p className="emp-ok">{aviso}</p> : null}
            <div className="wh-opcoes">
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
