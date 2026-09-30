import { useState } from "react";

import { montarParcelas, moedaConta, somarSaldos } from "../constants/parcelamentoContas";

export default function AgruparParcelarModal({
    aberto,
    contas = [],
    tipo = "receber",
    trabalhando,
    onFechar,
    onConfirmar
}) {
    const total = somarSaldos(contas);
    const hoje = new Date();
    const padrao = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    const [parcelas, setParcelas] = useState("3");
    const [jurosPct, setJurosPct] = useState("0");
    const [primeiro, setPrimeiro] = useState(padrao);
    const [intervalo, setIntervalo] = useState("30");

    const preview = montarParcelas({
        total,
        qtd: parcelas,
        jurosPct,
        primeiro,
        intervaloDias: intervalo
    });
    const totalComJuros = preview.reduce((acc, p) => acc + p.valor, 0);

    if (!aberto) {
        return null;
    }

    return (
        <div className="pv-modal-bg" onClick={onFechar}>
            <div className="pv-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Agrupar contas e parcelar o total</h3>
                <p className="prd-sub">
                    {contas.length} título(s) de {tipo === "pagar" ? "fornecedor" : "cliente"} · saldo {moedaConta(total)}.
                    As contas originais saem de aberto e nascem as novas parcelas.
                </p>
                <label>
                    Quantidade de parcelas
                    <input type="number" min="1" max="48" value={parcelas} onChange={(e) => setParcelas(e.target.value)} />
                </label>
                <label>
                    Juros no total (%)
                    <input type="number" step="0.01" min="0" value={jurosPct} onChange={(e) => setJurosPct(e.target.value)} />
                </label>
                <label>
                    Primeiro vencimento
                    <input type="date" value={primeiro} onChange={(e) => setPrimeiro(e.target.value)} />
                </label>
                <label>
                    Intervalo
                    <select value={intervalo} onChange={(e) => setIntervalo(e.target.value)}>
                        <option value="7">semanal (7 dias)</option>
                        <option value="15">quinzenal (15 dias)</option>
                        <option value="30">mensal (30 dias)</option>
                    </select>
                </label>
                <p className="prd-sub">Total com juros: <strong>{moedaConta(totalComJuros)}</strong></p>
                <table className="fer-table">
                    <thead>
                        <tr>
                            <th>Parcela</th>
                            <th>Vencimento</th>
                            <th className="is-num">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {preview.map((p) => (
                            <tr key={p.parcela}>
                                <td>{p.parcela}/{p.parcelas}</td>
                                <td>{p.vencimento.split("-").reverse().join("/")}</td>
                                <td className="is-num">{moedaConta(p.valor)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="ctt-menu-acoes">
                    <button
                        type="button"
                        className="prd-btn prd-btn-primary"
                        disabled={trabalhando || total <= 0}
                        onClick={() => onConfirmar({
                            ids: contas.map((c) => c.id),
                            parcelas: Number(parcelas) || 1,
                            jurosPct: Number(jurosPct) || 0,
                            primeiroVencimento: primeiro,
                            intervaloDias: Number(intervalo) || 30
                        })}
                    >
                        gerar parcelas
                    </button>
                    <button type="button" className="prd-btn" onClick={onFechar}>cancelar</button>
                </div>
            </div>
        </div>
    );
}
