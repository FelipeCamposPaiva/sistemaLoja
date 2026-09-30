import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";

import {
    SETORES_OS,
    excluirTecnico,
    listarTecnicos,
    salvarTecnico
} from "../../constants/tecnicos";
import ROTAS from "../../constants/rotas";
import { registrarAuditoria } from "../../services/auditoria.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/os.css";

const VAZIO = { id: null, nome: "", cargo: "Técnico", setor: "PRODUCAO", comissaoPct: "8", celular: "", ativo: true };

export default function Tecnicos() {
    const [lista, setLista] = useState(listarTecnicos);
    const [form, setForm] = useState(VAZIO);

    function recarregar() {
        setLista(listarTecnicos());
    }

    function salvar() {
        if (!form.nome.trim()) {
            return;
        }
        const acao = form.id ? "ALTERAR" : "CRIAR";
        const salvo = salvarTecnico(form);
        registrarAuditoria({
            entidade: "TECNICO",
            registroId: salvo.id,
            registroNome: salvo.nome,
            acao,
            resumo: form.id ? "cadastro de técnico atualizado" : "técnico cadastrado"
        }).catch(() => null);
        setForm(VAZIO);
        recarregar();
    }

    return (
        <div className="os-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>serviços</span>
                <span>›</span>
                <span>técnicos</span>
            </nav>
            <div className="fer-head">
                <div>
                    <h2>Técnicos</h2>
                    <p className="idx-sub">Cadastro usado nas ordens de serviço, produção e comissão por profissional.</p>
                </div>
                <Link className="os-ghost" to={ROTAS.ORDEM_SERVICO}>
                    <ChevronLeft size={15} /> ordens de serviço
                </Link>
            </div>

            <section className="os-card">
                <h3>{form.id ? "Editar técnico" : "Incluir técnico"}</h3>
                <div className="os-grid-4">
                    <label>
                        Nome
                        <input value={form.nome} onChange={(e) => setForm((a) => ({ ...a, nome: e.target.value }))} />
                    </label>
                    <label>
                        Cargo
                        <input value={form.cargo} onChange={(e) => setForm((a) => ({ ...a, cargo: e.target.value }))} />
                    </label>
                    <label>
                        Setor
                        <select value={form.setor} onChange={(e) => setForm((a) => ({ ...a, setor: e.target.value }))}>
                            {SETORES_OS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </label>
                    <label>
                        Peso na comissão
                        <input value={form.comissaoPct} onChange={(e) => setForm((a) => ({ ...a, comissaoPct: e.target.value }))} />
                    </label>
                    <label>
                        Celular
                        <input value={form.celular} onChange={(e) => setForm((a) => ({ ...a, celular: e.target.value }))} />
                    </label>
                    <label className="os-check">
                        <input type="checkbox" checked={form.ativo} onChange={(e) => setForm((a) => ({ ...a, ativo: e.target.checked }))} />
                        Ativo
                    </label>
                </div>
                <button type="button" className="prd-btn prd-btn-primary" onClick={salvar}>
                    <Plus size={14} /> {form.id ? "atualizar" : "salvar técnico"}
                </button>
            </section>

            <div className="os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Cargo</th>
                            <th>Setor</th>
                            <th>Peso</th>
                            <th>Situação</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {lista.map((t) => (
                            <tr key={t.id}>
                                <td>
                                    <button type="button" className="os-num" onClick={() => setForm({ ...t, comissaoPct: String(t.comissaoPct ?? 8) })}>
                                        {t.nome}
                                    </button>
                                </td>
                                <td>{t.cargo}</td>
                                <td>{SETORES_OS.find((s) => s.id === t.setor)?.label || t.setor}</td>
                                <td>{t.comissaoPct}</td>
                                <td>{t.ativo === false ? "inativo" : "ativo"}</td>
                                <td>
                                    <button type="button" className="os-icon-btn" onClick={() => {
                                        excluirTecnico(t.id);
                                        registrarAuditoria({
                                            entidade: "TECNICO",
                                            registroId: t.id,
                                            registroNome: t.nome,
                                            acao: "EXCLUIR",
                                            resumo: "técnico excluído"
                                        }).catch(() => null);
                                        recarregar();
                                    }} aria-label="Excluir">
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
