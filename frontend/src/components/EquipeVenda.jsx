import { Plus, Trash2 } from "lucide-react";

import { VENDEDORES, numBr } from "../constants/comissoes";
import { vendedoresPdv } from "../constants/pdv";
import {
    MODOS_COMISSAO,
    PAPEIS_VENDA,
    PCT_COMISSAO_PADRAO,
    calcularComissoes,
    linhaVendedor,
    rotuloPapel
} from "../constants/vendaVendedores";

import "../styles/pages/equipe-venda.css";

function catalogoVendedores() {
    const mapa = new Map();
    for (const v of VENDEDORES) {
        mapa.set(String(v.funcId), {
            id: v.funcId,
            nome: v.nome,
            pct: Number(v.pct || PCT_COMISSAO_PADRAO)
        });
    }
    for (const v of vendedoresPdv()) {
        if (!mapa.has(String(v.id))) {
            mapa.set(String(v.id), {
                id: v.id,
                nome: v.nome,
                pct: PCT_COMISSAO_PADRAO,
                cargo: v.cargo
            });
        }
    }
    return [...mapa.values()].sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"));
}

export default function EquipeVenda({
    equipe,
    onChange,
    valorVenda = 0,
    poolPct = PCT_COMISSAO_PADRAO,
    onPoolPct,
    compacto = false
}) {
    const pessoas = catalogoVendedores();
    const calculado = calcularComissoes(equipe, valorVenda, poolPct);
    const total = calculado.reduce((s, v) => s + Number(v.valor || 0), 0);
    const temRateio = (equipe || []).some((v) => v.modo === "rateio");

    function atualizar(idx, campo, valor) {
        onChange((equipe || []).map((v, i) => (i === idx ? { ...v, [campo]: valor } : v)));
    }

    function adicionar(pessoa) {
        if (!pessoa || (equipe || []).some((v) => String(v.funcId) === String(pessoa.id))) {
            return;
        }
        const atual = equipe || [];
        const novo = linhaVendedor({
            funcId: pessoa.id,
            nome: pessoa.nome,
            pct: pessoa.pct || PCT_COMISSAO_PADRAO,
            modo: atual.length ? "rateio" : "percentual",
            peso: 1
        });
        if (atual.length === 1 && atual[0].modo === "percentual") {
            onChange([{ ...atual[0], modo: "rateio", peso: 1 }, novo]);
            return;
        }
        onChange([...atual, novo]);
    }

    return (
        <div className={`eq-box${compacto ? " is-compact" : ""}`}>
            <div className="eq-head">
                <strong>Vendedores da venda</strong>
                <span>{calculado.length ? `${calculado.length} · comissão ${numBr(total)}` : "adicione 1 ou mais"}</span>
            </div>
            <p className="eq-hint">
                Venda compartilhada: interno + externo, vendedor + gerente ou suporte. Cada um com % ou valor próprio, ou rateio de um pool.
            </p>
            {temRateio ? (
                <label className="eq-pool">
                    Pool da venda (%)
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={poolPct}
                        onChange={(e) => onPoolPct?.(Number(e.target.value) || 0)}
                    />
                </label>
            ) : null}
            <ul className="eq-lista">
                {calculado.map((v, i) => (
                    <li key={`${v.funcId}-${i}`}>
                        <div>
                            <strong>{v.nome}</strong>
                            <small>{rotuloPapel(v.papel)} · {numBr(v.valor)}</small>
                        </div>
                        <select value={v.papel} onChange={(e) => atualizar(i, "papel", e.target.value)}>
                            {PAPEIS_VENDA.map((p) => (
                                <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                        </select>
                        <select value={v.modo} onChange={(e) => atualizar(i, "modo", e.target.value)}>
                            {MODOS_COMISSAO.map((m) => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                            ))}
                        </select>
                        {v.modo === "valor" ? (
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={v.valorFixo}
                                onChange={(e) => atualizar(i, "valorFixo", e.target.value)}
                                aria-label="Valor fixo"
                            />
                        ) : v.modo === "rateio" ? (
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={v.peso}
                                onChange={(e) => atualizar(i, "peso", e.target.value)}
                                aria-label="Peso no rateio"
                            />
                        ) : (
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={v.pct}
                                onChange={(e) => atualizar(i, "pct", e.target.value)}
                                aria-label="Percentual"
                            />
                        )}
                        <button type="button" className="eq-del" onClick={() => onChange((equipe || []).filter((_, n) => n !== i))} aria-label="Remover">
                            <Trash2 size={14} />
                        </button>
                    </li>
                ))}
            </ul>
            <label className="eq-add">
                <Plus size={14} />
                <select
                    value=""
                    onChange={(e) => {
                        const pessoa = pessoas.find((p) => String(p.id) === e.target.value);
                        adicionar(pessoa);
                    }}
                >
                    <option value="">adicionar vendedor</option>
                    {pessoas
                        .filter((p) => !(equipe || []).some((v) => String(v.funcId) === String(p.id)))
                        .map((p) => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                </select>
            </label>
        </div>
    );
}
