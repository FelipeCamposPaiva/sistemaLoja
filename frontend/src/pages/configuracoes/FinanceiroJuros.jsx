import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ROTAS from "../../constants/rotas";
import { buscarParametrosFinanceiro, salvarParametrosFinanceiro } from "../../services/financeiro.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/os.css";
import "../../styles/pages/pedidos-venda.css";

export default function FinanceiroJuros() {
    const [form, setForm] = useState({ multaPercentual: 2, jurosMesPercentual: 1, carenciaDias: 0 });
    const [aviso, setAviso] = useState("");
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        buscarParametrosFinanceiro()
            .then(setForm)
            .catch(() => setAviso("Não foi possível ler os percentuais de juros e multa."));
    }, []);

    async function salvar() {
        setSalvando(true);
        try {
            const salvo = await salvarParametrosFinanceiro({
                multaPercentual: Number(form.multaPercentual),
                jurosMesPercentual: Number(form.jurosMesPercentual),
                carenciaDias: Number(form.carenciaDias || 0)
            });
            setForm({
                multaPercentual: Number(salvo?.multaPercentual ?? form.multaPercentual),
                jurosMesPercentual: Number(salvo?.jurosMesPercentual ?? form.jurosMesPercentual),
                carenciaDias: Number(salvo?.carenciaDias || 0)
            });
            setAviso("Percentuais salvos. Títulos em aberto são recalculados ao abrir Contas a receber.");
        } catch (error) {
            setAviso(error?.response?.data?.mensagem || "Não foi possível salvar.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <div className="os-page pv-page">
            <nav className="dash-crumb">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <Link to={ROTAS.CONFIGURACOES}>configurações</span>
                <span>›</span>
                <span>juros e multa</span>
            </nav>
            <div className="fer-head">
                <div>
                    <h2>Juros e multa de boletos</h2>
                    <p className="prd-sub">
                        Percentuais usados no Contas a receber e na cobrança bancária. Multa é cobrada uma vez após o vencimento;
                        juros são 1/30 do percentual mensal por dia de atraso.
                    </p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
            </div>
            <div className="pv-modal" style={{ position: "relative", boxShadow: "none", border: "1px solid var(--line)" }}>
                <label>
                    Multa (%)
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.multaPercentual}
                        onChange={(e) => setForm((a) => ({ ...a, multaPercentual: e.target.value }))}
                    />
                </label>
                <label>
                    Juros ao mês (%)
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.jurosMesPercentual}
                        onChange={(e) => setForm((a) => ({ ...a, jurosMesPercentual: e.target.value }))}
                    />
                </label>
                <label>
                    Carência (dias)
                    <input
                        type="number"
                        min="0"
                        value={form.carenciaDias}
                        onChange={(e) => setForm((a) => ({ ...a, carenciaDias: e.target.value }))}
                    />
                </label>
                <div className="ctt-menu-acoes">
                    <button type="button" className="prd-btn prd-btn-primary" disabled={salvando} onClick={salvar}>
                        salvar percentuais
                    </button>
                    <Link className="prd-btn" to={ROTAS.CONTAS_RECEBER}>contas a receber</Link>
                </div>
            </div>
        </div>
    );
}
