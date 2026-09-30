export function saldoConta(conta) {
    const total = conta?.valorAtualizado != null && conta.valorAtualizado !== ""
        ? Number(conta.valorAtualizado)
        : Number(conta?.valor || 0);
    const pago = Number(conta?.valorPago || 0);
    return Math.max(0, Math.round((total - pago) * 100) / 100);
}

export function mensagemErroApi(erro) {
    return erro?.response?.data?.mensagem || erro?.message || "Não foi possível concluir.";
}

export function mesmoParceiro(contas, campo) {
    const ids = [...new Set((contas || []).map((c) => c?.[campo] ?? null))];
    return ids.length <= 1;
}

export function somarSaldos(contas) {
    return (contas || []).reduce((acc, c) => acc + saldoConta(c), 0);
}

export function isoDateLocal(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export function dataBr(valor) {
    if (!valor) {
        return "—";
    }
    const s = String(valor);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const [y, m, d] = s.slice(0, 10).split("-");
        return `${d}/${m}/${y}`;
    }
    return s;
}

export function moedaConta(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function montarParcelas({ total, qtd, jurosPct, primeiro, intervaloDias }) {
    const n = Math.max(1, Number(qtd) || 1);
    const juros = Number(jurosPct) || 0;
    const totalComJuros = Math.round(Number(total || 0) * (1 + juros / 100) * 100) / 100;
    const cents = Math.round(totalComJuros * 100);
    const base = Math.floor(cents / n);
    const inicio = primeiro ? new Date(`${primeiro}T12:00:00`) : new Date();
    const dias = Number(intervaloDias) || 30;
    return Array.from({ length: n }, (_, i) => {
        const fatia = i === n - 1 ? cents - base * (n - 1) : base;
        const d = new Date(inicio);
        d.setDate(d.getDate() + i * dias);
        return {
            parcela: i + 1,
            parcelas: n,
            valor: fatia / 100,
            vencimento: isoDateLocal(d)
        };
    });
}

export function rotuloStatusConta(status, tipo = "receber") {
    const s = String(status || "ABERTO").toUpperCase();
    if (s === "RECEBIDO" || s === "PAGO") {
        return tipo === "pagar" ? "Pago" : "Recebido";
    }
    if (s === "PARCIAL") {
        return "Parcial";
    }
    if (s === "AGRUPADO") {
        return "Agrupada";
    }
    if (s === "CANCELADO") {
        return "Cancelada";
    }
    return "Em aberto";
}

export function contaAberta(conta, tipo = "receber") {
    const s = String(conta?.status || "ABERTO").toUpperCase();
    if (s === "AGRUPADO" || s === "CANCELADO") {
        return false;
    }
    if (tipo === "pagar") {
        return s !== "PAGO";
    }
    return s !== "RECEBIDO";
}

export function abrirBoleto(conta) {
    const valor = conta?.saldo != null && conta.saldo !== ""
        ? Number(conta.saldo)
        : saldoConta(conta);
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Boleto ${conta.id || ""}</title>
<style>body{font-family:Segoe UI,sans-serif;padding:32px;color:#111}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:16px}td{padding:8px 0;border-bottom:1px solid #eee}.v{font-size:28px;font-weight:700}</style></head><body>
<h1>Boleto — saldo restante</h1>
<p>${conta.descricao || conta.observacao || "Conta a receber"}</p>
<table>
<tr><td>Título</td><td>#${conta.id || "—"}</td></tr>
<tr><td>Vencimento</td><td>${dataBr(conta.vencimento)}</td></tr>
<tr><td>Valor original</td><td>${moedaConta(conta.valorOriginal || conta.valor)}</td></tr>
<tr><td>Já recebido</td><td>${moedaConta(conta.valorPago)}</td></tr>
<tr><td>Valor deste boleto</td><td class="v">${moedaConta(valor)}</td></tr>
</table>
<p>Este boleto cobre somente o saldo em aberto, não o valor original do título.</p>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
        return false;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    return true;
}
