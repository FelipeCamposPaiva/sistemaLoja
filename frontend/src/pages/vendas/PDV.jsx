import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Banknote,
    CreditCard,
    Landmark,
    Link2,
    Printer,
    QrCode,
    Receipt,
    Search,
    Share2,
    Smartphone,
    Wallet
} from "lucide-react";

import {
    CATEGORIA,
    DEPOSITO,
    FORMAS,
    OPERADOR_PADRAO,
    PRODUTOS_PDV,
    REFINOS,
    brl,
    buscarProdutos,
    clientesPdv,
    finalizarVendaPdv,
    gravarPdv,
    lerPdv,
    numBr,
    parseBr,
    produtoPorId,
    qtdItens,
    resumoFormas,
    totalItens,
    vendedoresPdv
} from "../../constants/pdv";
import { CONSUMIDOR_FINAL, rotuloNatureza, sugerirNatureza } from "../../constants/naturezasOperacao";
import { precoVigente, rotuloOff } from "../../constants/precoPromocional";
import { osVazia } from "../../constants/ordensServico";
import ROTAS from "../../constants/rotas";
import { listarClientes } from "../../services/clientes.service";
import { listarNaturezasOperacao } from "../../services/naturezaOperacao.service";
import { salvarOS } from "../../services/os.service";
import { salvarPedidoVenda } from "../../services/pedidoVenda.service";
import { listarProdutos } from "../../services/produto.service";
import EquipeVenda from "../../components/EquipeVenda";
import { produtosLoja } from "../../constants/catalogoLoja";
import { PCT_COMISSAO_PADRAO, linhaVendedor, rotuloEquipe } from "../../constants/vendaVendedores";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/pdv.css";

const ICONE_FORMA = {
    dinheiro: Banknote,
    crediario: Landmark,
    credito: CreditCard,
    debito: CreditCard,
    pix: QrCode,
    multiplas: Wallet,
    link: Link2
};

function hora(d) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function dataExtenso(d) {
    return d.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function dataHoraCaixa(iso) {
    if (!iso) {
        return "—";
    }
    const d = new Date(iso);
    return `${d.toLocaleDateString("pt-BR")} às ${hora(d).replace(":", "h")}`;
}

export default function PDV() {
    const navigate = useNavigate();
    const buscaRef = useRef(null);
    const buscaAvancadaRef = useRef(null);
    const clienteRef = useRef(null);
    const vendedorRef = useRef(null);
    const crediarioRef = useRef(null);
    const devolucaoRef = useRef(null);
    const livreRef = useRef(null);
    const [agora, setAgora] = useState(() => new Date());
    const [store, setStore] = useState(lerPdv);
    const [busca, setBusca] = useState("");
    const [buscaAvancada, setBuscaAvancada] = useState("");
    const [qtd, setQtd] = useState("1,00");
    const [itens, setItens] = useState([]);
    const [equipe, setEquipe] = useState([]);
    const [poolPct, setPoolPct] = useState(PCT_COMISSAO_PADRAO);
    const [cliente, setCliente] = useState(CONSUMIDOR_FINAL);
    const [painel, setPainel] = useState(null);
    const [caixaTab, setCaixaTab] = useState("dados");
    const [etapa, setEtapa] = useState("venda");
    const [refino, setRefino] = useState("nao");
    const [refinoAberto, setRefinoAberto] = useState(false);
    const [forma, setForma] = useState("dinheiro");
    const [recebido, setRecebido] = useState("");
    const [desconto, setDesconto] = useState("0,00");
    const [frete, setFrete] = useState("0,00");
    const [aviso, setAviso] = useState("");
    const [movDraft, setMovDraft] = useState({ valor: "", obs: "" });
    const [livre, setLivre] = useState({ nome: "", preco: "" });
    const [vendaOk, setVendaOk] = useState(null);
    const [filtroCliente, setFiltroCliente] = useState("");
    const [filtroVendedor, setFiltroVendedor] = useState("");
    const [buscaCrediario, setBuscaCrediario] = useState("");
    const [buscaDev, setBuscaDev] = useState("");
    const [catalogo, setCatalogo] = useState(() => {
        const loja = produtosLoja();
        return loja.length ? loja : PRODUTOS_PDV;
    });
    const [soEstoque, setSoEstoque] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [naturezas, setNaturezas] = useState([]);

    const vendedores = useMemo(vendedoresPdv, [store]);
    const rotuloVendedores = rotuloEquipe(equipe);
    const total = totalItens(itens);
    const quant = qtdItens(itens);
    const caixa = store.caixa;
    const formasResumo = resumoFormas(caixa, store.vendas);
    const atalhos = (store.atalhos || []).map((id) => produtoPorId(id) || catalogo.find((p) => String(p.id) === String(id))).filter(Boolean);
    const encontradosAvancados = buscarProdutos(buscaAvancada, refino, { catalogo, soEstoque });
    const liquido = Number((total - parseBr(desconto) + parseBr(frete)).toFixed(2));
    const pago = parseBr(recebido || numBr(liquido));
    const troco = Number(Math.max(0, pago - liquido).toFixed(2));
    const sugestaoFiscal = useMemo(
        () => sugerirNatureza(cliente?.id ? cliente : CONSUMIDOR_FINAL, naturezas),
        [cliente, naturezas]
    );

    useEffect(() => {
        document.title = "ERP Tem de Tudo - PDV";
        const t = setInterval(() => setAgora(new Date()), 1000);
        listarProdutos()
            .then((lista) => {
                if (Array.isArray(lista) && lista.length) {
                    setCatalogo(lista);
                }
            })
            .catch(() => null);
        listarClientes()
            .then((lista) => setClientes((lista || []).filter((c) => c.ativo !== false)))
            .catch(() => setClientes(clientesPdv()));
        listarNaturezasOperacao().then(setNaturezas).catch(() => setNaturezas([]));
        return () => {
            clearInterval(t);
            document.title = "ERP Tem de Tudo";
        };
    }, []);

    useEffect(() => {
        const mapa = {
            busca: buscaAvancadaRef,
            clientes: clienteRef,
            vendedores: vendedorRef,
            crediario: crediarioRef,
            livre: livreRef
        };
        const alvo = mapa[painel];
        const id = window.requestAnimationFrame(() => {
            alvo?.current?.focus();
            if (painel === "caixa" && caixaTab === "dev") {
                devolucaoRef.current?.focus();
            }
        });
        return () => window.cancelAnimationFrame(id);
    }, [painel, caixaTab]);

    useEffect(() => {
        function acaoPrincipal() {
            if (!caixa.aberto) {
                abrirCaixa();
                return;
            }
            if (etapa === "ok") {
                novaVenda();
                return;
            }
            if (etapa === "checkout") {
                concluir();
                return;
            }
            if (etapa === "pagamento") {
                irCheckout();
                return;
            }
            if (itens.length) {
                continuar();
            }
        }

        function onKey(ev) {
            const k = ev.key;
            const ctrl = ev.ctrlKey || ev.metaKey;
            const alvo = ev.target;
            const digitando = alvo && ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName);

            if (ctrl && k === "Enter") {
                ev.preventDefault();
                if (painel === "busca") {
                    if (encontradosAvancados[0]) {
                        adicionar(encontradosAvancados[0]);
                    }
                    return;
                }
                acaoPrincipal();
                return;
            }
            if (k === "Escape") {
                ev.preventDefault();
                if (painel || etapa === "pagamento") {
                    setPainel(null);
                    if (etapa === "pagamento") {
                        setEtapa("venda");
                    }
                    return;
                }
                if (etapa === "ok") {
                    novaVenda();
                    return;
                }
                if (etapa === "checkout") {
                    setEtapa("venda");
                    return;
                }
                if (itens.length) {
                    cancelarVenda();
                }
                return;
            }
            if (ctrl && (k === "y" || k === "Y")) {
                ev.preventDefault();
                setPainel("caixa");
                return;
            }
            if (ctrl && (k === "b" || k === "B")) {
                ev.preventDefault();
                setBuscaAvancada(busca);
                setPainel("busca");
                return;
            }
            if (ctrl && (k === "k" || k === "K")) {
                ev.preventDefault();
                setPainel("livre");
                return;
            }
            if (k === "F9") {
                ev.preventDefault();
                setPainel("vendedores");
                return;
            }
            if (k === "F8" || (ctrl && (k === "q" || k === "Q"))) {
                ev.preventDefault();
                setPainel("clientes");
                return;
            }
            if (k === "F10") {
                ev.preventDefault();
                salvarDepois();
                return;
            }
            if (k === "F2" && etapa === "checkout") {
                ev.preventDefault();
                concluir();
                return;
            }
            if (etapa === "pagamento" && !digitando) {
                const formaHit = FORMAS.find((f) => f.atalho === k);
                if (formaHit) {
                    ev.preventDefault();
                    setForma(formaHit.id);
                    return;
                }
            }
            if (!caixa.aberto || etapa !== "venda" || painel || digitando) {
                return;
            }
            if (k.length === 1 && !ctrl && !ev.altKey) {
                buscaRef.current?.focus();
            }
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    function persist(proximo) {
        setStore(gravarPdv(proximo));
    }

    function abrirCaixa() {
        const proximo = {
            ...store,
            caixa: {
                ...store.caixa,
                aberto: true,
                abertoEm: new Date().toISOString(),
                operadorId: OPERADOR_PADRAO.id,
                operadorNome: OPERADOR_PADRAO.nome,
                sangrias: [],
                reforcos: [],
                devolucoes: []
            }
        };
        persist(proximo);
        setPainel(null);
        setEtapa("venda");
    }

    function fecharCaixa() {
        persist({
            ...store,
            caixa: { ...store.caixa, aberto: false }
        });
        setPainel(null);
        setItens([]);
        setEtapa("venda");
    }

    function adicionar(produto, quantidade = parseBr(qtd) || 1) {
        if (!produto) {
            return;
        }
        setItens((atual) => {
            const idx = atual.findIndex((i) => i.id === produto.id);
            if (idx >= 0) {
                return atual.map((i, n) => (n === idx ? { ...i, qtd: i.qtd + quantidade } : i));
            }
            return [...atual, { id: produto.id, nome: produto.nome, qtd: quantidade, preco: precoVigente(produto), unidade: produto.unidade || "UN" }];
        });
        setBusca("");
        setQtd("1,00");
        setPainel(null);
        buscaRef.current?.focus();
    }

    function confirmarBusca(ev) {
        ev?.preventDefault();
        const lista = buscarProdutos(busca, "nao", { catalogo, soEstoque: false });
        if (lista.length === 1) {
            adicionar(lista[0]);
            return;
        }
        setBuscaAvancada(busca);
        setPainel("busca");
    }

    function continuar() {
        if (!itens.length) {
            return;
        }
        if (store.skipPagamento) {
            setForma("dinheiro");
            setRecebido(numBr(total));
            setEtapa("checkout");
            return;
        }
        setRecebido(numBr(total));
        setEtapa("pagamento");
        setPainel(null);
    }

    function irCheckout() {
        setRecebido((atual) => atual || numBr(liquido || total));
        setEtapa("checkout");
        setPainel(null);
    }

    function toggleVendedorPdv(pessoa) {
        setEquipe((atual) => {
            if (atual.some((v) => String(v.funcId) === String(pessoa.id))) {
                return atual.filter((v) => String(v.funcId) !== String(pessoa.id));
            }
            const novo = linhaVendedor({
                funcId: pessoa.id,
                nome: pessoa.nome,
                modo: atual.length ? "rateio" : "percentual"
            });
            if (atual.length === 1 && atual[0].modo === "percentual") {
                return [{ ...atual[0], modo: "rateio", peso: 1 }, novo];
            }
            return [...atual, novo];
        });
    }

    function concluir() {
        if (!itens.length) {
            return;
        }
        const { store: proximo, registro } = finalizarVendaPdv(store, {
            itens,
            total: liquido,
            forma,
            formaNome: FORMAS.find((f) => f.id === forma)?.nome || "Dinheiro",
            recebido: pago,
            troco,
            vendedorId: equipe[0]?.funcId || "",
            vendedorNome: rotuloVendedores,
            equipe,
            poolPct,
            clienteId: cliente.id,
            clienteNome: cliente.nome,
            naturezaOperacaoId: sugestaoFiscal.naturezaId || null,
            naturezaOperacao: sugestaoFiscal.nome || "",
            cfop: sugestaoFiscal.cfop || "",
            deposito: DEPOSITO,
            categoria: CATEGORIA,
            desconto: parseBr(desconto),
            frete: parseBr(frete)
        });
        setStore(proximo);
        setVendaOk(registro);
        setEtapa("ok");
        setItens([]);
        void salvarPedidoVenda({
            cliente: cliente.nome,
            clienteId: clientePdvId(),
            origem: "PDV",
            vendedor: rotuloVendedores,
            vendedores: equipe,
            poolPct,
            valor: liquido,
            status: "FATURADO",
            estoqueLancado: false,
            contasLancadas: true,
            itens: itensDoCarrinho()
        });
    }

    function novaVenda() {
        setVendaOk(null);
        setEtapa("venda");
        setItens([]);
        setBusca("");
        setForma("dinheiro");
        setRecebido("");
        setDesconto("0,00");
        setFrete("0,00");
    }

    function cancelarVenda() {
        setItens([]);
        setEtapa("venda");
        setPainel(null);
    }

    function salvarDepois() {
        if (!itens.length) {
            return;
        }
        persist({
            ...store,
            vendas: [
                {
                    numero: "rascunho",
                    rascunho: true,
                    itens,
                    total,
                    vendedorId: equipe[0]?.funcId || "",
                    vendedorNome: rotuloVendedores,
                    equipe,
                    poolPct,
                    clienteNome: cliente.nome,
                    data: new Date().toISOString(),
                    caixaAbertoEm: caixa.abertoEm
                },
                ...store.vendas
            ]
        });
        setAviso("venda salva para depois");
        cancelarVenda();
    }

    function lancarMovimento(tipo) {
        const valor = parseBr(movDraft.valor);
        if (!valor) {
            return;
        }
        const item = { id: Date.now(), valor, obs: movDraft.obs, data: new Date().toISOString() };
        persist({
            ...store,
            caixa: {
                ...caixa,
                [tipo === "sangria" ? "sangrias" : "reforcos"]: [...(tipo === "sangria" ? caixa.sangrias : caixa.reforcos), item]
            }
        });
        setMovDraft({ valor: "", obs: "" });
        setPainel("caixa");
        setCaixaTab("mov");
    }

    function itemLivre() {
        if (!livre.nome.trim() || !parseBr(livre.preco)) {
            return;
        }
        adicionar({
            id: `livre-${Date.now()}`,
            nome: livre.nome.trim(),
            preco: parseBr(livre.preco),
            unidade: "UN"
        });
        setLivre({ nome: "", preco: "" });
    }

    function imprimir() {
        window.print();
    }

    function clientePdvId() {
        const id = Number(cliente?.id);
        return id > 0 ? id : null;
    }

    function itensDoCarrinho() {
        return itens.map((item) => ({
            sku: item.sku || item.id,
            descricao: item.nome,
            produtoId: item.id,
            quantidade: item.qtd,
            valorUnitario: item.preco,
            tipo: "peca",
            codigo: item.sku || String(item.id || ""),
            preco: String(item.preco),
            desconto: "0",
            orcar: false,
            ok: false
        }));
    }

    async function gerarOrcamento() {
        if (!itens.length) {
            setPainel(null);
            setAviso("adicione itens à venda para gerar o orçamento");
            return;
        }
        setPainel(null);
        try {
            const salvo = await salvarPedidoVenda({
                cliente: cliente.nome,
                clienteId: clientePdvId(),
                origem: "PDV",
                vendedor: rotuloVendedores,
                vendedores: equipe,
                poolPct,
                valor: total,
                status: "ORCAMENTO",
                estoqueLancado: false,
                contasLancadas: false,
                itens: itensDoCarrinho()
            });
            cancelarVenda();
            setAviso(`orçamento ${salvo.numero || ""} gerado`);
            navigate(`${ROTAS.PEDIDO_VENDA}?filtro=todas#list`);
        } catch {
            setAviso("não foi possível gerar o orçamento");
        }
    }

    async function gerarOs() {
        if (!itens.length) {
            setPainel(null);
            navigate({ pathname: ROTAS.ORDEM_SERVICO, hash: "add" });
            return;
        }
        setPainel(null);
        try {
            const salvo = await salvarOS({
                ...osVazia(),
                clienteId: clientePdvId() || "",
                cliente: cliente.nome,
                descricao: itens.map((item) => `${item.qtd} × ${item.nome}`).join("; "),
                valor: total,
                status: "EM_ABERTO",
                vendedor: equipe.length ? rotuloVendedores : "",
                observacoes: "Gerada pelo PDV",
                itens: itensDoCarrinho()
            });
            cancelarVenda();
            setAviso(`OS ${salvo.numero || salvo.id} gerada`);
            navigate({ pathname: ROTAS.ORDEM_SERVICO, hash: `edit/${salvo.id}` });
        } catch {
            setAviso("não foi possível gerar a OS");
        }
    }

    const sangriaTotal = (caixa.sangrias || []).reduce((s, x) => s + x.valor, 0);
    const reforcoTotal = (caixa.reforcos || []).reduce((s, x) => s + x.valor, 0);

    return (
        <div className="pdv-page">
            {aviso ? <div className="pdv-aviso">{aviso}</div> : null}

            {etapa === "ok" && vendaOk ? (
                <div className="pdv-done">
                    <h2>Venda nº {vendaOk.numero} finalizada por {vendaOk.vendedorNome}</h2>
                    <p>total da venda {brl(vendaOk.total)}</p>
                    <p>total recebido em {String(vendaOk.formaNome || "dinheiro").toLowerCase()} {brl(vendaOk.recebido)}</p>
                    <div className="pdv-done-grid">
                        <button type="button" onClick={imprimir}><Printer size={18} /><br />Imprimir recibo<br /><small>CTRL+1</small></button>
                        <button type="button" onClick={imprimir}><Receipt size={18} /><br />Imprimir recibo para troca<br /><small>CTRL+2</small></button>
                        <button type="button" onClick={() => setAviso("compartilhado com o vendedor do RH")}><Share2 size={18} /><br />Compartilhar<br /><small>CTRL+3</small></button>
                        <button type="button" onClick={imprimir}><Printer size={18} /><br />Imprimir NFC-e<br /><small>CTRL+4</small></button>
                        <button type="button" onClick={() => setAviso("NFe gerada no rascunho")}><Smartphone size={18} /><br />Gerar NFe<br /><small>CTRL+5</small></button>
                    </div>
                    <button type="button" className="pdv-btn" onClick={novaVenda}>iniciar outra venda<small className="pdv-kbd">CTRL+ENTER</small></button>
                    <button type="button" className="pdv-link" onClick={novaVenda}>tudo pronto ESC</button>
                </div>
            ) : null}

            {etapa !== "ok" && !caixa.aberto ? (
                <>
                    <header className="pdv-head">
                        <h1>PDV</h1>
                    </header>
                    <div className="pdv-centro">
                        <div className="pdv-relogio-wrap">
                            <div className="pdv-relogio">{hora(agora)}</div>
                            <div className="pdv-relogio-meta">
                                <div className="pdv-data">{dataExtenso(agora)}</div>
                            </div>
                        </div>
                        <button type="button" className="pdv-abrir" onClick={abrirCaixa}>
                            abrir caixa
                            <small>CTRL+ENTER</small>
                        </button>
                        <button type="button" className="pdv-link" onClick={() => setPainel("caixa")}>ver detalhes do caixa</button>
                    </div>
                </>
            ) : null}

            {etapa === "checkout" ? (
                <>
                    <header className="pdv-head">
                        <h1>PDV</h1>
                    </header>
                    <div className="pdv-checkout">
                        <div>
                            <div className="pdv-field">
                                <label>Cliente</label>
                                <button type="button" className="pdv-select" onClick={() => setPainel("clientes")}>{cliente.nome}</button>
                                <p className="pdv-muted">{rotuloNatureza(sugestaoFiscal)}</p>
                            </div>
                            <p className="pdv-muted">{itens.length} item, {numBr(quant, 4)} unidade · {brl(total)}</p>
                            {itens.map((i) => (
                                <div key={i.id} className="pdv-item-mini">
                                    <strong>{i.nome}</strong>
                                    <p className="pdv-muted">{numBr(i.qtd, 4)} · {brl(i.preco)}</p>
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="pdv-chk">
                                <div className="pdv-field">
                                    <label>Vendedor F9</label>
                                    <button type="button" className="pdv-select" onClick={() => setPainel("vendedores")}>{rotuloVendedores}</button>
                                </div>
                                <div className="pdv-field">
                                    <label>Depósito</label>
                                    <input value={DEPOSITO} readOnly />
                                </div>
                                <div className="pdv-field">
                                    <label>Categoria</label>
                                    <input value={CATEGORIA} readOnly />
                                </div>
                                <div className="pdv-field">
                                    <label>Desconto</label>
                                    <input value={desconto} onChange={(e) => setDesconto(e.target.value)} />
                                </div>
                                <div className="pdv-field">
                                    <label>Frete</label>
                                    <input value={frete} onChange={(e) => setFrete(e.target.value)} />
                                </div>
                                <div className="pdv-field">
                                    <label>{FORMAS.find((f) => f.id === forma)?.nome || "Dinheiro"}</label>
                                    <input value={recebido} onChange={(e) => setRecebido(e.target.value)} />
                                </div>
                            </div>
                            <button type="button" className="pdv-link" onClick={() => setEtapa("pagamento")}>+ adicionar recebimento F4</button>
                        </div>
                    </div>
                    <footer className="pdv-foot">
                        <button type="button" className="pdv-btn" onClick={concluir}>finalizar venda<small className="pdv-kbd">CTRL+ENTER OU F2</small></button>
                        <button type="button" className="pdv-link" onClick={salvarDepois}>salvar para depois F10</button>
                        <div className="pdv-foot-totais">
                            troco: {brl(troco)}
                            <strong>total da venda: {brl(liquido)}</strong>
                        </div>
                    </footer>
                </>
            ) : null}

            {caixa.aberto && (etapa === "venda" || etapa === "pagamento") ? (
                <>
                    <header className="pdv-head">
                        <h1>PDV</h1>
                        <div className="pdv-head-acoes">
                            <button type="button" className="pdv-head-link" onClick={() => setPainel("caixa")}>
                                detalhes do caixa
                                <small>CTRL+Y</small>
                            </button>
                            <button type="button" className="pdv-head-link" onClick={() => { setBuscaAvancada(busca); setPainel("busca"); }}>
                                busca avançada
                                <small>CTRL+B</small>
                            </button>
                            <button type="button" className="pdv-mais" onClick={() => setPainel(painel === "acoes" ? null : "acoes")}>mais ações</button>
                        </div>
                    </header>
                    <form className="pdv-busca-row" onSubmit={confirmarBusca}>
                        <div className="pdv-field">
                            <label>Produto</label>
                            <div className="pdv-field-busca">
                                <Search size={16} />
                                <input
                                    ref={buscaRef}
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    placeholder="Pesquise por descrição, código (SKU) ou GTIN"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                        <div className="pdv-field">
                            <label>Quantidade</label>
                            <input value={qtd} onChange={(e) => setQtd(e.target.value)} />
                        </div>
                    </form>
                    <p className="pdv-hint">Experimente digitar sem clicar no campo de busca ou usar o leitor de código de barras</p>

                    {itens.length ? (
                        <div className="pdv-cart">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Descrição</th>
                                        <th>Quant.</th>
                                        <th>Preço un.</th>
                                        <th>Preço total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itens.map((i) => (
                                        <tr key={i.id}>
                                            <td>{i.nome}</td>
                                            <td>{numBr(i.qtd, 4)} {i.unidade}</td>
                                            <td>{numBr(i.preco, 5)}</td>
                                            <td>{numBr(i.qtd * i.preco)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="pdv-muted">shift + enter para abrir a edição do último produto adicionado</p>
                        </div>
                    ) : (
                        <div className="pdv-centro is-aberto">
                            <div className="pdv-relogio-wrap">
                                <div className="pdv-relogio">{hora(agora)}</div>
                                <div className="pdv-relogio-meta">
                                    <div className="pdv-data">{dataExtenso(agora)}</div>
                                    <div className="pdv-status">caixa aberto às {hora(new Date(caixa.abertoEm))}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pdv-atalhos">
                        <h3>Atalhos (toque para adicionar à venda)</h3>
                        <div className="pdv-atalho-grid">
                            {atalhos.map((p) => (
                                <button key={p.id} type="button" className="pdv-atalho" onClick={() => adicionar(p)}>
                                    <strong>{p.nome}</strong>
                                    <span>{brl(precoVigente(p))}</span>
                                </button>
                            ))}
                            <button type="button" className="pdv-atalho is-add" onClick={() => setPainel("atalhos")}>+ configurar atalhos</button>
                        </div>
                    </div>

                    <footer className="pdv-foot">
                        <div className="pdv-foot-sel">
                            <label>Vendedor</label>
                            <button type="button" onClick={() => setPainel("vendedores")}>
                                <span>{rotuloVendedores}</span>
                                <small>F9</small>
                            </button>
                        </div>
                        <div className="pdv-foot-sel">
                            <label>Cliente</label>
                            <button type="button" onClick={() => setPainel("clientes")}>
                                <span>{cliente.nome}</span>
                                <small>{sugestaoFiscal.cfop ? `CFOP ${sugestaoFiscal.cfop}` : "F8"}</small>
                            </button>
                        </div>
                        {itens.length ? (
                            <div className="pdv-foot-acoes">
                                <button type="button" className="pdv-btn" onClick={continuar}>continuar<small className="pdv-kbd">CTRL+ENTER</small></button>
                                <button type="button" className="pdv-link" onClick={salvarDepois}>salvar para depois F10</button>
                                <button type="button" className="pdv-link" onClick={cancelarVenda}>cancelar venda ESC</button>
                            </div>
                        ) : null}
                        <div className="pdv-foot-totais">
                            itens: {itens.length} · quant: {numBr(quant, 0)}
                            <strong>total da venda: {brl(total)}</strong>
                        </div>
                    </footer>
                </>
            ) : null}

            {painel === "acoes" ? (
                <div className="pdv-mais-menu">
                    {[
                        ["busca avançada", "CTRL+B", () => setPainel("busca")],
                        ["usar item não cadastrado", "CTRL+K", () => setPainel("livre")],
                        ["imprimir última venda", "", () => { setPainel(null); imprimir(); }],
                        ["informar cliente", "F8", () => setPainel("clientes")],
                        ["gerar vale-presente", "", () => { setPainel(null); setAviso("vale-presente em breve"); }],
                        ["gestão de vale-presente", "", () => { setPainel(null); setAviso("gestão de vale-presente em breve"); }],
                        ["selecionar lista de preços", "CTRL+G", () => { setPainel(null); setAviso("lista padrão"); }],
                        ["devolver produtos", "", () => { setPainel("caixa"); setCaixaTab("dev"); }],
                        ["orçamento", "", gerarOrcamento],
                        ["gerar OS", "", gerarOs],
                        ["faturar pré-venda", "", () => { setPainel(null); setAviso("sem pré-venda aberta"); }],
                        ["receber crediário", "", () => setPainel("crediario")],
                        ["campanhas de cashback", "", () => { setPainel(null); setAviso("sem campanha ativa"); }],
                        ["mostrar atalhos", "CTRL+?", () => { setPainel(null); setAviso("F8 cliente · F9 vendedor · CTRL+Y caixa"); }],
                        ["detalhes do caixa", "CTRL+Y", () => setPainel("caixa")],
                        ["lançar sangria de caixa", "", () => { setPainel("sangria"); setCaixaTab("mov"); }],
                        ["lançar reforço de caixa", "", () => { setPainel("reforco"); setCaixaTab("mov"); }],
                        ["fechar caixa", "", fecharCaixa]
                    ].map(([nome, atalho, acao]) => (
                        <button key={nome} type="button" onClick={acao}>
                            {nome}
                            {atalho ? <span>{atalho}</span> : null}
                        </button>
                    ))}
                </div>
            ) : null}

            {painel && painel !== "acoes" ? <button type="button" className="pdv-drawer-bg" aria-label="fechar" onClick={() => setPainel(null)} /> : null}

            {painel === "caixa" || painel === "sangria" || painel === "reforco" ? (
                <aside className="pdv-drawer">
                    <div className="pdv-drawer-head">
                        <div>
                            <h2>Detalhes do caixa</h2>
                            <p>Dados gerais e gestão sobre abertura e fechamento do caixa, histórico de sangrias, reforços e devoluções</p>
                        </div>
                        <button type="button" className="pdv-fechar" onClick={() => setPainel(null)}>fechar ×</button>
                    </div>
                    <div className="pdv-tabs">
                        <button type="button" className={caixaTab === "dados" ? "is-on" : ""} onClick={() => setCaixaTab("dados")}>dados gerais</button>
                        <button type="button" className={caixaTab === "mov" ? "is-on" : ""} onClick={() => setCaixaTab("mov")}>sangrias e reforços</button>
                        <button type="button" className={caixaTab === "dev" ? "is-on" : ""} onClick={() => setCaixaTab("dev")}>devoluções</button>
                    </div>
                    {caixaTab === "dados" ? (
                        <div className="pdv-lista">
                            <p><span className={caixa.aberto ? "pdv-ok-dot" : ""} />{caixa.aberto ? "caixa aberto" : "caixa fechado"}</p>
                            <p className="pdv-muted">{caixa.aberto ? `Caixa aberto em ${dataHoraCaixa(caixa.abertoEm)}` : "Abra o caixa para iniciar as vendas."}</p>
                            <dl className="pdv-dl">
                                <dt>Operador de abertura</dt><dd>{caixa.operadorNome}</dd>
                                <dt>Troco inicial</dt><dd>{brl(caixa.trocoInicial)}</dd>
                                <dt>Sangrias</dt><dd>{brl(sangriaTotal)}</dd>
                                <dt>Reforços</dt><dd>{brl(reforcoTotal)}</dd>
                            </dl>
                            <button type="button" className="pdv-link" onClick={imprimir}>reimprimir cupom de abertura</button>
                            <h3 style={{ marginTop: 24, fontSize: 15 }}>Resumo por forma de recebimento</h3>
                            <dl className="pdv-dl">
                                {formasResumo.map((f) => (
                                    <span key={f.nome} style={{ display: "contents" }}>
                                        <dt>{f.nome}</dt><dd>{brl(f.valor)}</dd>
                                    </span>
                                ))}
                                <dt>Total</dt><dd>{brl(formasResumo.reduce((s, f) => s + f.valor, 0))}</dd>
                            </dl>
                            <p className="pdv-muted">Reajuste do valor de abertura do caixa: lance uma sangria ou um reforço.</p>
                        </div>
                    ) : null}
                    {caixaTab === "mov" ? (
                        <div className="pdv-lista">
                            {!(caixa.sangrias || []).length && !(caixa.reforcos || []).length ? <p>Sem movimentações</p> : null}
                            {(caixa.sangrias || []).map((s) => <p key={s.id}>Sangria {brl(s.valor)} · {s.obs || "—"}</p>)}
                            {(caixa.reforcos || []).map((s) => <p key={s.id}>Reforço {brl(s.valor)} · {s.obs || "—"}</p>)}
                            <div className="pdv-chk">
                                <input placeholder="Valor" value={movDraft.valor} onChange={(e) => setMovDraft({ ...movDraft, valor: e.target.value })} />
                                <input placeholder="Observação" value={movDraft.obs} onChange={(e) => setMovDraft({ ...movDraft, obs: e.target.value })} />
                            </div>
                            <button type="button" className="pdv-link" onClick={() => lancarMovimento("sangria")}>+ lançar nova sangria</button>
                            <button type="button" className="pdv-link" onClick={() => lancarMovimento("reforco")}>+ lançar novo reforço</button>
                        </div>
                    ) : null}
                    {caixaTab === "dev" ? (
                        <div className="pdv-lista">
                            <label className="pdv-drawer-busca">
                                <Search size={16} />
                                <input
                                    ref={devolucaoRef}
                                    value={buscaDev}
                                    onChange={(e) => setBuscaDev(e.target.value)}
                                    placeholder="Pesquise pelo cliente, nº do pedido ou chave de acesso"
                                />
                            </label>
                            {(store.vendas || []).filter((v) => {
                                if (v.rascunho) {
                                    return false;
                                }
                                const q = buscaDev.trim().toLowerCase();
                                if (!q) {
                                    return true;
                                }
                                return [v.numero, v.clienteNome, v.vendedorNome].join(" ").toLowerCase().includes(q);
                            }).length === 0 ? (
                                <p>Sem devoluções de vendas</p>
                            ) : (store.vendas || []).filter((v) => {
                                if (v.rascunho) {
                                    return false;
                                }
                                const q = buscaDev.trim().toLowerCase();
                                if (!q) {
                                    return true;
                                }
                                return [v.numero, v.clienteNome, v.vendedorNome].join(" ").toLowerCase().includes(q);
                            }).map((v) => (
                                <button key={v.numero + String(v.data)} type="button" onClick={() => setAviso(`devolução do pedido ${v.numero}`)}>
                                    Pedido {v.numero} · {v.clienteNome || "Consumidor final"}
                                    <small>{brl(v.total)}</small>
                                </button>
                            ))}
                        </div>
                    ) : null}
                    <div className="pdv-drawer-foot">
                        {caixa.aberto ? <button type="button" className="pdv-btn" onClick={fecharCaixa}>fechar caixa<small className="pdv-kbd">CTRL+ENTER</small></button> : null}
                    </div>
                </aside>
            ) : null}

            {painel === "busca" ? (
                <aside className="pdv-drawer is-wide">
                    <div className="pdv-drawer-head">
                        <div>
                            <h2>Busca avançada de produtos</h2>
                        </div>
                        <button type="button" className="pdv-fechar" onClick={() => setPainel(null)}>fechar ×</button>
                    </div>
                    <div className="pdv-drawer-busca-row">
                        <label className="pdv-drawer-busca">
                            <Search size={16} />
                            <input
                                ref={buscaAvancadaRef}
                                value={buscaAvancada}
                                onChange={(e) => setBuscaAvancada(e.target.value)}
                                placeholder="Pesquise por nome, código (SKU) ou GTIN/EAN"
                            />
                        </label>
                        <button type="button" className="pdv-refino" onClick={() => setRefinoAberto(!refinoAberto)}>
                            refinar
                        </button>
                    </div>
                    <label className="pdv-check">
                        <input type="checkbox" checked={soEstoque} onChange={(e) => setSoEstoque(e.target.checked)} />
                        somente produtos com estoque disponível
                    </label>
                    {refinoAberto ? (
                        <div className="pdv-refino-menu">
                            {REFINOS.map((r) => (
                                <button key={r.id} type="button" className={refino === r.id ? "is-on" : ""} onClick={() => { setRefino(r.id); setRefinoAberto(false); }}>{r.nome}</button>
                            ))}
                        </div>
                    ) : null}
                    <div className="pdv-lista">
                        {encontradosAvancados.map((p) => (
                            <button key={p.id} type="button" onClick={() => adicionar(p)}>
                                {p.nome}
                                <small>{p.sku} · {p.localizacao ? `${p.localizacao} · ` : ""}{brl(precoVigente(p))}{rotuloOff(p) ? ` · ${rotuloOff(p)}` : ""}</small>
                            </button>
                        ))}
                    </div>
                    <div className="pdv-drawer-foot">
                        <button type="button" className="pdv-btn" onClick={() => encontradosAvancados[0] && adicionar(encontradosAvancados[0])}>adicionar item<small className="pdv-kbd">CTRL+ENTER</small></button>
                        <button type="button" className="pdv-link" onClick={() => setPainel(null)}>fechar ESC</button>
                    </div>
                </aside>
            ) : null}

            {painel === "vendedores" ? (
                <aside className="pdv-drawer">
                    <div className="pdv-drawer-head">
                        <h2>Vendedores da venda</h2>
                        <button type="button" className="pdv-fechar" onClick={() => setPainel(null)}>fechar ×</button>
                    </div>
                    <p className="pdv-muted">Inclua 2 ou mais para venda compartilhada. F9 não substitui: soma à equipe.</p>
                    <EquipeVenda
                        compacto
                        equipe={equipe}
                        onChange={setEquipe}
                        valorVenda={liquido || total}
                        poolPct={poolPct}
                        onPoolPct={setPoolPct}
                    />
                    <label className="pdv-drawer-busca">
                        <Search size={16} />
                        <input
                            ref={vendedorRef}
                            placeholder="Pesquise o vendedor"
                            value={filtroVendedor}
                            onChange={(e) => setFiltroVendedor(e.target.value)}
                        />
                    </label>
                    <div className="pdv-lista">
                        <button type="button" onClick={() => { setEquipe([]); setPainel(null); setFiltroVendedor(""); }}>sem vendedor</button>
                        {vendedores.filter((v) => v.nome.toLowerCase().includes(filtroVendedor.trim().toLowerCase())).map((v) => (
                            <button
                                key={v.id}
                                type="button"
                                className={equipe.some((e) => String(e.funcId) === String(v.id)) ? "is-on" : ""}
                                onClick={() => toggleVendedorPdv(v)}
                            >
                                {v.nome}
                                <small>{v.cargo || "clique para incluir na venda"}</small>
                            </button>
                        ))}
                    </div>
                    <div className="pdv-drawer-foot">
                        <button type="button" className="pdv-btn" onClick={() => setPainel(null)}>confirmar equipe</button>
                    </div>
                </aside>
            ) : null}

            {painel === "clientes" ? (
                <aside className="pdv-drawer">
                    <div className="pdv-drawer-head">
                        <h2>Cliente</h2>
                        <button type="button" className="pdv-fechar" onClick={() => setPainel(null)}>fechar ×</button>
                    </div>
                    <label className="pdv-drawer-busca">
                        <Search size={16} />
                        <input
                            ref={clienteRef}
                            placeholder="Pesquise por nome, CNPJ/CPF ou fantasia"
                            value={filtroCliente}
                            onChange={(e) => setFiltroCliente(e.target.value)}
                        />
                    </label>
                    <div className="pdv-lista">
                        <button type="button" onClick={() => { setCliente(CONSUMIDOR_FINAL); setPainel(null); setFiltroCliente(""); }}>Consumidor final</button>
                        {clientes.filter((c) => [c.nome, c.fantasia, c.cpf, c.cnpj, c.documento].join(" ").toLowerCase().includes(filtroCliente.trim().toLowerCase())).map((c) => (
                            <button key={c.id} type="button" onClick={() => { setCliente(c); setPainel(null); setFiltroCliente(""); }}>
                                {c.nome}
                                <small>{c.fantasia || rotuloNatureza(sugerirNatureza(c, naturezas))}</small>
                            </button>
                        ))}
                    </div>
                </aside>
            ) : null}

            {painel === "crediario" ? (
                <aside className="pdv-drawer">
                    <div className="pdv-drawer-head">
                        <h2>Receber crediário</h2>
                        <button type="button" className="pdv-fechar" onClick={() => setPainel(null)}>fechar ×</button>
                    </div>
                    <label className="pdv-drawer-busca">
                        <Search size={16} />
                        <input
                            ref={crediarioRef}
                            placeholder="Pesquise por nome, CNPJ/CPF ou fantasia do cliente"
                            value={buscaCrediario}
                            onChange={(e) => setBuscaCrediario(e.target.value)}
                        />
                    </label>
                    <div className="pdv-lista">
                        {clientes.filter((c) => [c.nome, c.fantasia, c.cpf, c.cnpj, c.documento].join(" ").toLowerCase().includes(buscaCrediario.trim().toLowerCase())).map((c) => (
                            <button key={c.id} type="button" onClick={() => { setCliente(c); setAviso(`crediário de ${c.nome}`); setPainel(null); }}>
                                {c.nome}
                                <small>{c.fantasia || c.cpf || c.cnpj || ""}</small>
                            </button>
                        ))}
                    </div>
                    <div className="pdv-drawer-foot">
                        <button type="button" className="pdv-btn" onClick={() => setAviso("informe o cliente para baixar o crediário")}>baixar por valor</button>
                        <button type="button" className="pdv-link" onClick={() => setPainel(null)}>cancelar ESC</button>
                    </div>
                </aside>
            ) : null}

            {painel === "livre" ? (
                <aside className="pdv-drawer">
                    <div className="pdv-drawer-head">
                        <h2>Item não cadastrado</h2>
                        <button type="button" className="pdv-fechar" onClick={() => setPainel(null)}>fechar ×</button>
                    </div>
                    <div className="pdv-field"><label>Descrição</label><input ref={livreRef} value={livre.nome} onChange={(e) => setLivre({ ...livre, nome: e.target.value })} /></div>
                    <div className="pdv-field" style={{ marginTop: 12 }}><label>Preço</label><input value={livre.preco} onChange={(e) => setLivre({ ...livre, preco: e.target.value })} /></div>
                    <div className="pdv-drawer-foot">
                        <button type="button" className="pdv-btn" onClick={itemLivre}>adicionar</button>
                    </div>
                </aside>
            ) : null}

            {painel === "atalhos" ? (
                <aside className="pdv-drawer">
                    <div className="pdv-drawer-head">
                        <h2>Atalhos do PDV</h2>
                        <button type="button" className="pdv-fechar" onClick={() => setPainel(null)}>fechar ×</button>
                    </div>
                    <div className="pdv-lista">
                        {PRODUTOS_PDV.map((p) => {
                            const on = store.atalhos.includes(p.id);
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    className={on ? "is-on" : ""}
                                    onClick={() => persist({
                                        ...store,
                                        atalhos: on ? store.atalhos.filter((id) => id !== p.id) : [...store.atalhos, p.id]
                                    })}
                                >
                                    {p.nome}
                                    <small>{brl(precoVigente(p))}</small>
                                </button>
                            );
                        })}
                    </div>
                </aside>
            ) : null}

            {etapa === "pagamento" ? (
                <aside className="pdv-drawer">
                    <div className="pdv-drawer-head">
                        <div>
                            <h2>Escolha uma forma de recebimento</h2>
                            <p>total da venda {brl(total)}</p>
                        </div>
                        <button type="button" className="pdv-fechar" onClick={() => setEtapa("venda")}>fechar ×</button>
                    </div>
                    <div className="pdv-formas">
                        {FORMAS.map((f) => {
                            const Icon = ICONE_FORMA[f.id];
                            return (
                                <button key={f.id} type="button" className={`pdv-forma${forma === f.id ? " is-on" : ""}`} onClick={() => setForma(f.id)}>
                                    <b>{f.atalho}</b>
                                    {Icon ? <Icon size={18} /> : null} {f.nome}
                                </button>
                            );
                        })}
                    </div>
                    <label className="pdv-switch">
                        <input
                            type="checkbox"
                            checked={store.skipPagamento}
                            onChange={(e) => persist({ ...store, skipPagamento: e.target.checked })}
                        />
                        não exibir esta janela novamente
                    </label>
                    <div className="pdv-drawer-foot">
                        <button type="button" className="pdv-btn" onClick={irCheckout}>continuar<small className="pdv-kbd">CTRL+ENTER</small></button>
                        <button type="button" className="pdv-link" onClick={() => setEtapa("venda")}>cancelar ESC</button>
                    </div>
                </aside>
            ) : null}
        </div>
    );
}
