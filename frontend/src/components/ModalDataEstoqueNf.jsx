import { useState } from "react";

const MODO_KEY = "erp-nf-estoque-modo-data";

export const MODOS_DATA_ESTOQUE = [
    { id: "ENTRADA", nome: "Data de entrada da NF" },
    { id: "ATUAL", nome: "Data atual (hoje)" },
    { id: "MANUAL", nome: "Data manual" }
];

export function modoDataEstoquePadrao() {
    try {
        const salvo = localStorage.getItem(MODO_KEY);
        if (MODOS_DATA_ESTOQUE.some((m) => m.id === salvo)) {
            return salvo;
        }
    } catch {
        /* ignore */
    }
    return "ENTRADA";
}

function hojeIso() {
    return new Date().toISOString().slice(0, 10);
}

export default function ModalDataEstoqueNf({ nota, onCancel, onConfirm, trabalhando }) {
    const [modo, setModo] = useState(modoDataEstoquePadrao);
    const [data, setData] = useState(String(nota?.dataEntrada || hojeIso()).slice(0, 10));

    function confirmar() {
        try {
            localStorage.setItem(MODO_KEY, modo);
        } catch {
            /* ignore */
        }
        onConfirm({
            modoData: modo,
            dataMovimento: modo === "MANUAL" ? data : (modo === "ENTRADA" ? String(nota?.dataEntrada || data).slice(0, 10) : hojeIso())
        });
    }

    return (
        <div className="nfe-modal-bg" onClick={onCancel}>
            <div className="nfe-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Data do estoque</h3>
                <p className="prd-sub">
                    O movimento de todos os itens da NF {nota?.numero || ""} usa esta data — não a do clique no sistema.
                </p>
                {MODOS_DATA_ESTOQUE.map((item) => (
                    <label key={item.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                            type="radio"
                            name="modo-data-estoque"
                            checked={modo === item.id}
                            onChange={() => setModo(item.id)}
                        />
                        {item.nome}
                        {item.id === "ENTRADA" ? ` (${String(nota?.dataEntrada || "—").slice(0, 10)})` : null}
                    </label>
                ))}
                {modo === "MANUAL" ? (
                    <label>
                        Data do movimento
                        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
                    </label>
                ) : null}
                <div className="ctt-menu-acoes">
                    <button type="button" className="prd-btn prd-btn-primary" disabled={trabalhando} onClick={confirmar}>
                        lançar estoque
                    </button>
                    <button type="button" className="prd-btn" onClick={onCancel}>cancelar</button>
                </div>
            </div>
        </div>
    );
}
