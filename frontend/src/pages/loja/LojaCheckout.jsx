import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";

import {
    brl,
    clienteLojaAtual,
    lerCarrinho,
    limparCarrinho,
    proximoNumeroPedidoLoja,
    resumoCarrinho
} from "../../constants/loja";
import { salvarPedidoVenda } from "../../services/pedidoVenda.service";

export default function LojaCheckout() {
    const { cfg } = useOutletContext();
    const navigate = useNavigate();
    const cliente = clienteLojaAtual();
    const itens = lerCarrinho();
    const resumo = resumoCarrinho(itens, cfg);
    const pagamentos = (cfg.pagamentos || []).filter((p) => p.ativo);
    const envios = (cfg.envios || []).filter((p) => p.ativo);
    const [form, setForm] = useState({
        nome: cliente?.nome || "",
        email: cliente?.email || "",
        telefone: cliente?.telefone || "",
        cidade: cfg.dados.cidade,
        uf: cfg.dados.uf,
        pagamento: pagamentos[0]?.nome || "Pix",
        envio: envios[0]?.nome || "Retirar na loja"
    });
    const [erro, setErro] = useState("");
    const [ok, setOk] = useState("");
    const [salvando, setSalvando] = useState(false);

    if (!itens.length && !ok) {
        return (
            <section className="lj-sec">
                <h1>Checkout</h1>
                <p>Seu carrinho está vazio.</p>
                <Link to="/">Voltar à loja</Link>
            </section>
        );
    }

    async function enviar(e) {
        e.preventDefault();
        setErro("");
        if (!form.nome.trim()) {
            setErro("Informe seu nome.");
            return;
        }
        setSalvando(true);
        try {
            const numero = proximoNumeroPedidoLoja();
            const pix = /pix/i.test(form.pagamento);
            const valor = pix ? resumo.pix : resumo.subtotal;
            const extras = itens
                .filter((i) => i.personalizacao || i.medidas)
                .map((i) => `${i.nome}: ${[i.personalizacao, i.medidas].filter(Boolean).join(" · ")}`)
                .join(" | ");
            const salvo = await salvarPedidoVenda({
                numero,
                cliente: form.nome.trim(),
                origem: "Loja",
                vendedor: "Loja virtual",
                valor,
                status: "APROVADO",
                estoqueLancado: false,
                contasLancadas: false,
                separacao: "PENDENTE",
                expedicao: "PENDENTE",
                pagamento: form.pagamento,
                formaEnvio: form.envio,
                cidade: form.cidade,
                uf: form.uf,
                observacoes: [
                    `Site · ${form.email} · ${form.telefone}`,
                    resumo.atual ? `Cupom ${resumo.atual.codigo} ${resumo.atual.desconto}%` : "",
                    extras
                ].filter(Boolean).join(" · "),
                data: new Date().toISOString(),
                itens: itens.map((i) => ({
                    sku: i.sku,
                    descricao: i.nome,
                    quantidade: i.qtd,
                    valorUnitario: i.preco
                }))
            });
            limparCarrinho();
            setOk(salvo.numero || numero);
        } catch {
            setErro("Não foi possível gravar o pedido. Tente de novo.");
        } finally {
            setSalvando(false);
        }
    }

    if (ok) {
        return (
            <section className="lj-sec lj-center">
                <h1>Pedido {ok} recebido</h1>
                <p>Ele já aparece em Pedidos Ecommerce e Pedidos de Venda no ERP.</p>
                <button type="button" className="lj-add" onClick={() => navigate("/")}>Continuar comprando</button>
            </section>
        );
    }

    return (
        <section className="lj-sec lj-check">
            <h1>Finalizar compra</h1>
            <form onSubmit={enviar} className="lj-form">
                {erro ? <p className="lj-erro">{erro}</p> : null}
                <label>Nome<input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
                <label>E-mail<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
                <label>Telefone<input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></label>
                <label>Cidade<input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></label>
                <label>UF<input value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value })} /></label>
                <label>
                    Pagamento
                    <select value={form.pagamento} onChange={(e) => setForm({ ...form, pagamento: e.target.value })}>
                        {pagamentos.map((p) => <option key={p.id}>{p.nome}</option>)}
                    </select>
                </label>
                <label>
                    Envio
                    <select value={form.envio} onChange={(e) => setForm({ ...form, envio: e.target.value })}>
                        {envios.map((p) => <option key={p.id}>{p.nome}</option>)}
                    </select>
                </label>
                <p>Subtotal {brl(resumo.bruto)}</p>
                {resumo.desconto ? <p>Cupom {resumo.atual.codigo} -{brl(resumo.desconto)}</p> : null}
                <p>Total <strong>{brl(/pix/i.test(form.pagamento) ? resumo.pix : resumo.subtotal)}</strong></p>
                {cfg.pix?.ativo && !/pix/i.test(form.pagamento) ? (
                    <p className="lj-pix">{brl(resumo.pix)} {cfg.textos?.pixTxt || "no pix"}</p>
                ) : null}
                <button type="submit" className="lj-add" disabled={salvando}>
                    {salvando ? "Enviando..." : "Confirmar pedido"}
                </button>
            </form>
        </section>
    );
}
