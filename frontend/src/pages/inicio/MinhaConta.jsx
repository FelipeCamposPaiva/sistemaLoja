import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import useAuth from "../../hooks/useAuth.jsx";
import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";

const CONTA_KEY = "erp-minha-conta-v1";

function lerConta(usuario) {
    try {
        const bruto = localStorage.getItem(CONTA_KEY);
        if (bruto) {
            return { ...JSON.parse(bruto) };
        }
    } catch {
        /* ignore */
    }
    return {
        nome: usuario?.nome || "Administrador",
        email: usuario?.email || "admin@temdetudovr.com.br",
        telefone: "(24) 98128-5708",
        empresa: "Tem de Tudo — Volta Redonda",
        cargo: usuario?.perfil || "ADMIN"
    };
}

export default function MinhaConta() {
    const { usuario } = useAuth();
    const [form, setForm] = useState(() => lerConta(usuario));
    const [salvo, setSalvo] = useState(false);
    const iniciais = useMemo(() => {
        const partes = String(form.nome || "?").trim().split(/\s+/);
        return ((partes[0]?.[0] || "?") + (partes[1]?.[0] || "")).toUpperCase();
    }, [form.nome]);

    function setCampo(chave, valor) {
        setForm((atual) => ({ ...atual, [chave]: valor }));
        setSalvo(false);
    }

    function salvar() {
        localStorage.setItem(CONTA_KEY, JSON.stringify(form));
        setSalvo(true);
    }

    return (
        <div className="ctt-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <span>minha conta</span>
            </nav>
            <div className="fer-head">
                <h2>Minha Conta</h2>
            </div>
            <div className="conta-card">
                <span className="ctt-avatar" style={{ background: "#ff2f92", width: 48, height: 48, fontSize: 16 }}>
                    {iniciais}
                </span>
                <div>
                    <strong>{form.nome}</strong>
                    <p className="ctt-sub">{form.cargo} · {form.empresa}</p>
                </div>
            </div>
            <div className="ctt-grid">
                <label className="span-6">
                    Nome
                    <input value={form.nome} onChange={(e) => setCampo("nome", e.target.value)} />
                </label>
                <label className="span-6">
                    E-mail
                    <input value={form.email} onChange={(e) => setCampo("email", e.target.value)} />
                </label>
                <label className="span-4">
                    Telefone
                    <input value={form.telefone} onChange={(e) => setCampo("telefone", e.target.value)} />
                </label>
                <label className="span-4">
                    Cargo
                    <input value={form.cargo} onChange={(e) => setCampo("cargo", e.target.value)} />
                </label>
                <label className="span-4">
                    Empresa
                    <input value={form.empresa} onChange={(e) => setCampo("empresa", e.target.value)} />
                </label>
            </div>
            <div className="ctt-footer">
                <button type="button" className="idx-pill int-add" onClick={salvar}>salvar</button>
                <Link to={ROTAS.INDICE} className="idx-text">voltar ao índice</Link>
                {salvo ? <span className="erp-ok">Dados da conta atualizados.</span> : null}
            </div>
        </div>
    );
}
