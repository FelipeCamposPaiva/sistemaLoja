import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowRight,
    Banknote,
    Barcode,
    Check,
    ChevronDown,
    ChevronUp,
    CreditCard,
    Landmark,
    Link2,
    List,
    MessageSquare,
    Percent,
    Plus,
    Printer,
    QrCode,
    Receipt,
    Search,
    Share2,
    ShoppingCart,
    Smartphone,
    Star,
    UserRound,
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
import { emPromocao, pctOff, precoVigente, rotuloOff, ouvirPrecos } from "../../constants/precoPromocional";
import { osVazia } from "../../constants/ordensServico";
import ROTAS from "../../constants/rotas";
import { registrarVendaCaixa, salvarMovimento } from "../../services/caixa.service";
import { listarClientes } from "../../services/clientes.service";
import { listarContasReceber, receberConta, salvarContaReceber } from "../../services/contaReceber.service";
import { listarNaturezasOperacao } from "../../services/naturezaOperacao.service";
import { salvarOS } from "../../services/os.service";
import { lancarEstoquePedido, salvarPedidoVenda } from "../../services/pedidoVenda.service";
import { buscarProdutos as buscarProdutosApi, listarProdutos } from "../../services/produto.service";
import EquipeVenda from "../../components/EquipeVenda";
import { produtosLoja } from "../../constants/catalogoLoja";
import { PCT_COMISSAO_PADRAO, linhaVendedor, rotuloEquipe } from "../../constants/vendaVendedores";
import { motivoErro, mostrarAlerta as publicarAlerta, mostrarErro as publicarErro } from "../../components/avisoErro";

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

function descreverClique(ev) {
    const bruto = ev.target;
    const alvo = bruto?.closest?.("button, a, input, textarea, select, label, [role='button']") || bruto;
    const tag = String(alvo?.tagName || "área").toLowerCase();
    const classe = typeof alvo?.className === "string"
        ? alvo.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".")
        : "";
    const texto = String(
        alvo?.getAttribute?.("aria-label")
        || (["button", "a", "input", "textarea", "select", "label"].includes(tag) ? alvo?.innerText || alvo?.placeholder : "")
        || ""
    ).replace(/\s+/g, " ").trim().slice(0, 72);
    const onde = texto ? `${tag} “${texto}”` : (classe ? `${tag}.${classe}` : tag);
    return {
        x: Math.round(ev.clientX),
        y: Math.round(ev.clientY),
        quando: Date.now(),
        onde
    };
}

function idServidor(valor) {
    const id = Number(valor);
    return Number.isFinite(id) && id > 0 && id < 1e11 ? id : null;
}

function contaEmAberto(conta) {
    const status = String(conta?.status || "ABERTO").toUpperCase();
    return status === "ABERTO" || status === "PARCIAL";
}

function vencimentoCrediario() {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${dia}`;
}

function FotoProduto({ produto }) {
    const [falhou, setFalhou] = useState(false);
    const src = produto?.imagem;
    if (!src || falhou) {
        return <span className="pdv-card-foto is-vazia">{String(produto?.nome || "?").trim().slice(0, 1)}</span>;
    }
    return <img className="pdv-card-foto" src={src} alt="" onError={() => setFalhou(true)} />;
}

export default function PDV() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const pageRef = useRef(null);
    const ultimoClique = useRef(null);
    const mostrarErroRef = useRef(() => {});
    const buscaRef = useRef(null);
    const buscaAvancadaRef = useRef(null);
    const clienteRef = useRef(null);
    const vendedorRef = useRef(null);
    const crediarioRef = useRef(null);
    const devolucaoRef = useRef(null);
    const livreRef = useRef(null);
    const descontoRef = useRef(null);
    const obsRef = useRef(null);
    const itemQtdRef = useRef(null);
    const ultimoItemId = useRef(null);
    const [agora, setAgora] = useState(() => new Date());
    const [store, setStore] = useState(lerPdv);
    const [busca, setBusca] = useState(() => params.get("sku") || params.get("q") || "");
    const [categoriaPdv, setCategoriaPdv] = useState(() => (params.get("vitrine") === "promocoes" ? "promocoes" : "todos"));
    const [observacao, setObservacao] = useState("");
    const [sugestoesApi, setSugestoesApi] = useState([]);
    const [buscandoProduto, setBuscandoProduto] = useState(false);
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
    const [editando, setEditando] = useState(null);
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
    const [contasCrediario, setContasCrediario] = useState([]);
    const [preVendas, setPreVendas] = useState([]);
    const [pedidoVinculo, setPedidoVinculo] = useState(null);

    const vendedores = useMemo(vendedoresPdv, [store]);
    const rotuloVendedores = rotuloEquipe(equipe);
    const total = totalItens(itens);
    const quant = qtdItens(itens);
    const caixa = store.caixa;
    const formasResumo = resumoFormas(caixa, store.vendas);
    const atalhos = useMemo(() => {
        const escolhidos = (store.atalhos || [])
            .map((id) => produtoPorId(id) || catalogo.find((p) => String(p.id) === String(id)))
            .filter(Boolean);
        if (escolhidos.length) {
            return escolhidos;
        }
        return catalogo.filter((p) => p && p.ativo !== false && p.nome).slice(0, 8);
    }, [store.atalhos, catalogo]);
    const baseAtalhos = (catalogo.length ? catalogo : PRODUTOS_PDV).slice(0, 80);
    const encontradosAvancados = buscarProdutos(buscaAvancada, refino, { catalogo, soEstoque });
    const sugestoes = useMemo(() => {
        const q = busca.trim();
        if (!q) {
            return [];
        }
        const locais = buscarProdutos(q, "nao", { catalogo, soEstoque: false });
        const mapa = new Map();
        for (const produto of [...sugestoesApi, ...locais]) {
            if (produto && produto.id != null && produto.nome) {
                mapa.set(String(produto.id), produto);
            }
        }
        return [...mapa.values()].slice(0, 12);
    }, [busca, catalogo, sugestoesApi]);
    const categoriasVitrine = useMemo(() => {
        const nomes = new Set();
        for (const produto of catalogo) {
            const nome = String(produto?.grupo || produto?.categoria || "").trim();
            if (nome) {
                nomes.add(nome);
            }
        }
        return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR")).slice(0, 6);
    }, [catalogo]);
    const vitrine = useMemo(() => {
        let lista = catalogo.filter((p) => p && p.ativo !== false && p.nome);
        if (categoriaPdv === "promocoes") {
            lista = lista.filter(emPromocao);
        } else if (categoriaPdv !== "todos") {
            lista = lista.filter((p) => String(p.grupo || p.categoria || "") === categoriaPdv);
        }
        if (busca.trim()) {
            lista = buscarProdutos(busca, "nao", { catalogo: lista });
        }
        return lista.slice(0, 8);
    }, [catalogo, categoriaPdv, busca]);
    const liquido = Number((total - parseBr(desconto) + parseBr(frete)).toFixed(2));
    const pago = parseBr(recebido || numBr(liquido));
    const troco = Number(Math.max(0, pago - liquido).toFixed(2));
    const sugestaoFiscal = useMemo(
        () => sugerirNatureza(cliente?.id ? cliente : CONSUMIDOR_FINAL, naturezas),
        [cliente, naturezas]
    );

    function mostrarErro(motivo, clique) {
        publicarErro(motivo, clique || ultimoClique.current);
    }

    mostrarErroRef.current = mostrarErro;

    useEffect(() => {
        document.title = "ERP Tem de Tudo - PDV";
        const t = setInterval(() => setAgora(new Date()), 1000);
        listarProdutos()
            .then((lista) => {
                if (Array.isArray(lista) && lista.length) {
                    setCatalogo(lista);
                }
            })
            .catch((erro) => mostrarErroRef.current(motivoErro(erro)));
        const pararPrecos = ouvirPrecos(() => {
            listarProdutos()
                .then((lista) => {
                    if (Array.isArray(lista) && lista.length) {
                        setCatalogo(lista);
                    }
                })
                .catch(() => {});
        });
        listarClientes()
            .then((lista) => {
                const ativos = (lista || []).filter((c) => c.ativo !== false);
                setClientes(ativos);
                const contatoId = params.get("contato");
                const contato = ativos.find((c) => String(c.id) === String(contatoId));
                if (!contato) {
                    return;
                }
                setCliente(contato);
                if (contato.vendedor) {
                    setEquipe([linhaVendedor({ funcId: contato.vendedorId || contato.vendedor, nome: contato.vendedor })]);
                }
            })
            .catch((erro) => {
                setClientes(clientesPdv());
                mostrarErroRef.current(motivoErro(erro));
            });
        listarNaturezasOperacao()
            .then(setNaturezas)
            .catch((erro) => {
                setNaturezas([]);
                mostrarErroRef.current(motivoErro(erro));
            });
        return () => {
            clearInterval(t);
            document.title = "ERP Tem de Tudo";
            pararPrecos();
        };
    }, []);

    useEffect(() => {
        function noClique(ev) {
            ultimoClique.current = descreverClique(ev);
        }
        document.addEventListener("click", noClique, true);
        return () => {
            document.removeEventListener("click", noClique, true);
        };
    }, []);

    useEffect(() => {
        if (painel !== "crediario") {
            return undefined;
        }
        let vivo = true;
        listarContasReceber()
            .then((lista) => {
                if (vivo) {
                    setContasCrediario((lista || []).filter(contaEmAberto));
                }
            })
            .catch((erro) => mostrarErroRef.current(motivoErro(erro), ultimoClique.current));
        return () => {
            vivo = false;
        };
    }, [painel]);

    useEffect(() => {
        const q = busca.trim();
        if (q.length < 1) {
            setSugestoesApi([]);
            setBuscandoProduto(false);
            return undefined;
        }
        let vivo = true;
        setBuscandoProduto(true);
        const t = window.setTimeout(() => {
            buscarProdutosApi(q)
                .then((lista) => {
                    if (!vivo) {
                        return;
                    }
                    const achados = Array.isArray(lista) ? lista.filter((p) => p && p.nome) : [];
                    setSugestoesApi(achados);
                    if (achados.length) {
                        setCatalogo((atual) => {
                            const ids = new Set(atual.map((p) => String(p.id)));
                            const novos = achados.filter((p) => !ids.has(String(p.id)));
                            return novos.length ? [...novos, ...atual] : atual;
                        });
                    }
                })
                .catch((erro) => {
                    if (!vivo) {
                        return;
                    }
                    setSugestoesApi([]);
                    const locais = buscarProdutos(q, "nao", { catalogo, soEstoque: false });
                    if (!locais.length) {
                        mostrarErroRef.current(motivoErro(erro));
                    }
                })
                .finally(() => {
                    if (vivo) {
                        setBuscandoProduto(false);
                    }
                });
        }, 180);
        return () => {
            vivo = false;
            window.clearTimeout(t);
        };
    }, [busca]);

    useEffect(() => {
        const mapa = {
            busca: buscaAvancadaRef,
            clientes: clienteRef,
            vendedores: vendedorRef,
            crediario: crediarioRef,
            livre: livreRef,
            item: itemQtdRef,
            desconto: descontoRef,
            obs: obsRef
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

            if (ev.shiftKey && k === "Enter") {
                ev.preventDefault();
                editarUltimo();
                return;
            }
            if (ctrl && k === "Enter") {
                ev.preventDefault();
                if (painel === "item") {
                    salvarEdicao();
                    return;
                }
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
            if (k === "F11" || k === "F9") {
                ev.preventDefault();
                setPainel("vendedores");
                return;
            }
            if (k === "F10" || k === "F8" || (ctrl && (k === "q" || k === "Q"))) {
                ev.preventDefault();
                setPainel("clientes");
                return;
            }
            if (k === "F12") {
                ev.preventDefault();
                setPainel("desconto");
                return;
            }
            if (k === "F3") {
                ev.preventDefault();
                setBuscaAvancada(busca);
                setPainel("busca");
                return;
            }
            if (k === "F2" && etapa === "checkout") {
                ev.preventDefault();
                concluir();
                return;
            }
            if (k === "F2") {
                ev.preventDefault();
                buscaRef.current?.focus();
                buscaRef.current?.select();
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

    async function ligarCaixa(movimento) {
        const clique = ultimoClique.current;
        try {
            await salvarMovimento({
                origem: "PDV",
                categoria: CATEGORIA,
                ...movimento,
                valor: Number(movimento.valor || 0)
            });
        } catch (erro) {
            mostrarErro(motivoErro(erro), clique);
        }
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
        void ligarCaixa({
            tipo: "ENTRADA",
            valor: Number(store.caixa.trocoInicial || 0),
            descricao: `Abertura de caixa PDV · ${OPERADOR_PADRAO.nome}`
        });
    }

    function fecharCaixa() {
        persist({
            ...store,
            caixa: { ...store.caixa, aberto: false }
        });
        setPainel(null);
        setItens([]);
        setEtapa("venda");
        void ligarCaixa({
            tipo: "SAIDA",
            valor: 0,
            descricao: "Fechamento de caixa PDV"
        });
    }

    function adicionar(produto, quantidade = parseBr(qtd) || 1) {
        if (!produto) {
            return;
        }
        const semEstoque = produto.consomeEstoque !== false
            && !String(produto.id).startsWith("livre")
            && Number(produto.estoque || 0) <= 0;
        if (semEstoque) {
            publicarAlerta(`${produto.nome} está sem estoque. O item entra na venda, mas o lançamento no estoque pode falhar.`);
        }
        ultimoItemId.current = produto.id;
        setItens((atual) => {
            const idx = atual.findIndex((i) => i.id === produto.id);
            if (idx >= 0) {
                return atual.map((i, n) => (n === idx ? { ...i, qtd: i.qtd + quantidade } : i));
            }
            return [...atual, { id: produto.id, nome: produto.nome, qtd: quantidade, preco: precoVigente(produto), unidade: produto.unidade || "UN", sku: produto.sku || "" }];
        });
        setBusca("");
        setQtd("1,00");
        setPainel(null);
        buscaRef.current?.focus();
    }

    function abrirEdicao(item) {
        if (!item) {
            publicarAlerta("Não há produto na venda para editar.");
            return;
        }
        ultimoItemId.current = item.id;
        setEditando({
            id: item.id,
            nome: item.nome || "",
            qtd: numBr(item.qtd, 4),
            preco: numBr(item.preco, 2),
            unidade: item.unidade || "UN"
        });
        setPainel("item");
    }

    function editarUltimo() {
        const atual = itens.find((i) => i.id === ultimoItemId.current) || itens[itens.length - 1];
        abrirEdicao(atual);
    }

    function salvarEdicao(ev) {
        ev?.preventDefault();
        if (!editando) {
            return;
        }
        const nome = editando.nome.trim();
        const qtdNova = parseBr(editando.qtd);
        const precoNovo = parseBr(editando.preco);
        if (!nome) {
            publicarAlerta("Informe a descrição do produto.");
            return;
        }
        if (!qtdNova) {
            publicarAlerta("Informe a quantidade do produto.");
            return;
        }
        setItens((atual) => atual.map((i) => (
            i.id === editando.id
                ? { ...i, nome, qtd: qtdNova, preco: precoNovo }
                : i
        )));
        setPainel(null);
        buscaRef.current?.focus();
    }

    function removerEditando() {
        if (!editando) {
            return;
        }
        setItens((atual) => atual.filter((i) => i.id !== editando.id));
        setEditando(null);
        setPainel(null);
        buscaRef.current?.focus();
    }

    function ajustarQtd(delta) {
        const proxima = Math.max(1, (parseBr(qtd) || 1) + delta);
        setQtd(numBr(proxima, 2));
    }

    function confirmarBusca(ev) {
        ev?.preventDefault();
        const q = busca.trim().toLowerCase();
        if (!q) {
            return;
        }
        const exato = sugestoes.find((p) => {
            const sku = String(p.sku || "").toLowerCase();
            const gtin = String(p.gtin || p.codigoBarras || "").toLowerCase();
            return sku === q || gtin === q;
        });
        if (exato || sugestoes.length === 1) {
            adicionar(exato || sugestoes[0]);
            return;
        }
        if (!sugestoes.length && !buscandoProduto) {
            setBuscaAvancada(busca);
            setPainel("busca");
        }
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

    async function concluir() {
        if (!itens.length) {
            publicarAlerta("Não há itens na venda para finalizar.");
            return;
        }
        if (forma === "crediario" && !clientePdvId()) {
            publicarAlerta("Selecione um cliente cadastrado para vender no crediário.");
            return;
        }
        const clique = ultimoClique.current;
        const vendidos = itens;
        const formaNome = FORMAS.find((f) => f.id === forma)?.nome || "Dinheiro";
        const { store: proximo, registro } = finalizarVendaPdv(store, {
            itens,
            total: liquido,
            forma,
            formaNome,
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
        const falhas = [];
        try {
            const pedido = await salvarPedidoVenda({
                cliente: cliente.nome,
                clienteId: clientePdvId(),
                origem: "PDV",
                vendedor: rotuloVendedores,
                vendedores: equipe,
                poolPct,
                valor: liquido,
                status: "FATURADO",
                formaPagamento: formaNome,
                pagamento: formaNome,
                estoqueLancado: false,
                contasLancadas: false,
                itens: itensDoCarrinho(vendidos),
                observacoes: [observacao, parseBr(desconto) ? `Desconto ${brl(parseBr(desconto))}` : "", parseBr(frete) ? `Frete ${brl(parseBr(frete))}` : ""].filter(Boolean).join(" · ")
            });
            const pedidoId = idServidor(pedido?.id);
            setPedidoVinculo({ id: pedido?.id || null, numero: pedido?.numero || registro.numero });
            if (!pedidoId) {
                falhas.push("O pedido ficou só neste computador. O servidor de vendas não confirmou a gravação.");
            } else {
                const estoque = await lancarEstoquePedido(pedidoId);
                if (estoque?.ok === false) {
                    falhas.push(estoque.mensagem || "O estoque da venda não foi lançado.");
                }
                if (forma === "crediario") {
                    await salvarContaReceber({
                        clienteId: clientePdvId(),
                        descricao: `Venda PDV ${registro.numero} · ${cliente.nome}`,
                        valor: liquido,
                        vencimento: vencimentoCrediario(),
                        status: "ABERTO",
                        categoria: CATEGORIA
                    });
                } else {
                    await registrarVendaCaixa({
                        valor: liquido,
                        descricao: `Venda PDV ${registro.numero} · ${formaNome} · ${cliente.nome}`,
                        referenciaId: pedidoId
                    });
                }
                await marcarFlagsPedido(pedidoId, { contasLancadas: true });
                const atual = lerPdv();
                persist({
                    ...atual,
                    vendas: (atual.vendas || []).map((v) => (
                        String(v.numero) === String(registro.numero) && v.data === registro.data
                            ? { ...v, pedidoId: pedido.id, pedidoNumero: pedido.numero }
                            : v
                    ))
                });
            }
        } catch (erro) {
            falhas.push(motivoErro(erro));
        }
        if (falhas.length) {
            mostrarErro(falhas.join(" "), clique);
        }
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
        setObservacao("");
        setPedidoVinculo(null);
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
            publicarAlerta("Informe o valor da sangria ou do reforço.");
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
        void ligarCaixa({
            tipo: tipo === "sangria" ? "SAIDA" : "ENTRADA",
            valor,
            descricao: movDraft.obs || (tipo === "sangria" ? "Sangria de caixa PDV" : "Reforço de caixa PDV")
        });
    }

    function itemLivre() {
        if (!livre.nome.trim() || !parseBr(livre.preco)) {
            publicarAlerta("Informe a descrição e o preço do item não cadastrado.");
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

    function itensDoCarrinho(lista = itens) {
        return lista.map((item) => ({
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
        } catch (erro) {
            mostrarErro(motivoErro(erro));
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
        } catch (erro) {
            mostrarErro(motivoErro(erro));
        }
    }

    async function abrirPreVendas() {
        setPainel("prevenda");
        try {
            const lista = await listarPedidosVenda();
            setPreVendas((lista || []).filter((p) => String(p.status || "").toUpperCase() === "ORCAMENTO"));
        } catch (erro) {
            mostrarErro(motivoErro(erro));
        }
    }

    function aplicarPreVenda(pedido) {
        const linhas = (pedido.itens || []).map((item) => ({
            id: item.produtoId || item.sku || item.codigo || `prev-${item.descricao}`,
            nome: item.descricao || item.nome || "Item",
            qtd: Number(item.quantidade || item.qtd || 1),
            preco: Number(item.valorUnitario || item.preco || 0),
            unidade: item.unidade || "UN",
            sku: item.sku || ""
        })).filter((item) => item.nome);
        if (!linhas.length) {
            publicarAlerta("Esse orçamento não tem itens para faturar.");
            return;
        }
        setItens(linhas);
        ultimoItemId.current = linhas[linhas.length - 1].id;
        if (pedido.cliente) {
            setCliente({ id: pedido.clienteId, nome: pedido.cliente });
        }
        setPainel(null);
        setAviso(`pré-venda ${pedido.numero || ""} carregada no PDV`);
    }

    async function baixarCrediario(conta) {
        const clique = ultimoClique.current;
        try {
            await receberConta(conta.id);
            setContasCrediario((atual) => atual.filter((c) => c.id !== conta.id));
            setCliente(clientes.find((c) => String(c.id) === String(conta.clienteId)) || cliente);
            setAviso(`crediário ${conta.descricao || conta.id} recebido`);
            setPainel(null);
        } catch (erro) {
            mostrarErro(motivoErro(erro), clique);
        }
    }

    const sangriaTotal = (caixa.sangrias || []).reduce((s, x) => s + x.valor, 0);
    const reforcoTotal = (caixa.reforcos || []).reduce((s, x) => s + x.valor, 0);

    const contasVisiveis = contasCrediario.filter((c) => {
        const q = buscaCrediario.trim().toLowerCase();
        if (!q) {
            return true;
        }
        const dono = clientes.find((cli) => String(cli.id) === String(c.clienteId));
        return [c.id, c.descricao, c.status, c.clienteId, dono?.nome, dono?.fantasia].join(" ").toLowerCase().includes(q);
    });

    return (
        <div className="pdv-page" ref={pageRef}>
            {aviso ? <div className="pdv-aviso">{aviso}</div> : null}

            {etapa === "ok" && vendaOk ? (
                <div className="pdv-done">
                    <h2>Venda nº {vendaOk.numero} finalizada por {vendaOk.vendedorNome}</h2>
                    <p>total da venda {brl(vendaOk.total)}</p>
                    <p>total recebido em {String(vendaOk.formaNome || "dinheiro").toLowerCase()} {brl(vendaOk.recebido)}</p>
                    <div className="pdv-done-grid">
                        <button type="button" onClick={imprimir}><Printer size={18} /><br />Imprimir recibo<br /><small>CTRL+1</small></button>
                        <button type="button" onClick={() => navigate(`${ROTAS.PEDIDO_VENDA}?filtro=todas#list`)}><Receipt size={18} /><br />Abrir pedido de venda<br /><small>{pedidoVinculo?.numero || "vendas"}</small></button>
                        <button type="button" onClick={() => navigate("/financeiro")}><Share2 size={18} /><br />Abrir caixa<br /><small>financeiro</small></button>
                        <button type="button" onClick={() => navigate(ROTAS.CONTAS_RECEBER)}><Smartphone size={18} /><br />Contas a receber<br /><small>crediário</small></button>
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
                                <button key={i.id} type="button" className="pdv-item-mini" onClick={() => abrirEdicao(i)}>
                                    <strong>{i.nome}</strong>
                                    <p className="pdv-muted">{numBr(i.qtd, 4)} · {brl(i.preco)}</p>
                                </button>
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
                    <header className="pdv-head pdv-head-loja">
                        <div className="pdv-marca">
                            <span className="pdv-marca-ico"><ShoppingCart size={18} /></span>
                            <h1>PDV</h1>
                            <span className="pdv-caixa-pill">Caixa aberto • {hora(new Date(caixa.abertoEm))}</span>
                        </div>
                        <div className="pdv-head-acoes">
                            <button type="button" className="pdv-chip-btn" onClick={() => setPainel("caixa")}>
                                Detalhes do caixa
                                <small>CTRL+Y</small>
                            </button>
                            <button type="button" className="pdv-chip-btn" onClick={() => { setBuscaAvancada(busca); setPainel("busca"); }}>
                                <Search size={15} />
                                Busca avançada
                                <small>CTRL+B</small>
                            </button>
                            <button type="button" className="pdv-mais" onClick={() => setPainel(painel === "acoes" ? null : "acoes")}>
                                Mais ações
                                <ChevronDown size={16} />
                            </button>
                        </div>
                    </header>
                    <form className="pdv-busca-row pdv-busca-loja" onSubmit={confirmarBusca}>
                        <div className="pdv-field is-busca">
                            <div className="pdv-field-busca">
                                <Search size={16} />
                                <input
                                    ref={buscaRef}
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    placeholder="Pesquise por descrição, código (SKU) ou GTIN..."
                                    autoComplete="off"
                                />
                            </div>
                            {busca.trim() ? (
                                <div className="pdv-sugestoes" role="listbox">
                                    {sugestoes.map((p) => (
                                        <button key={p.id} type="button" onClick={() => adicionar(p)}>
                                            <strong>{p.nome}</strong>
                                            <span>{p.sku ? `${p.sku} · ` : ""}{brl(precoVigente(p))}</span>
                                        </button>
                                    ))}
                                    {!sugestoes.length ? (
                                        <p>{buscandoProduto ? "Buscando produtos…" : `Nenhum produto encontrado para “${busca.trim()}”`}</p>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                        <div className="pdv-qtd-step">
                            <input aria-label="Quantidade" value={qtd} onChange={(e) => setQtd(e.target.value)} />
                            <span>
                                <button type="button" aria-label="aumentar quantidade" onClick={() => ajustarQtd(1)}><ChevronUp size={14} /></button>
                                <button type="button" aria-label="diminuir quantidade" onClick={() => ajustarQtd(-1)}><ChevronDown size={14} /></button>
                            </span>
                        </div>
                    </form>
                    <div className="pdv-cats">
                        <button type="button" className={categoriaPdv === "todos" ? "is-on" : ""} onClick={() => setCategoriaPdv("todos")}>Todos</button>
                        {categoriasVitrine.map((nome) => (
                            <button key={nome} type="button" className={categoriaPdv === nome ? "is-on" : ""} onClick={() => setCategoriaPdv(nome)}>{nome}</button>
                        ))}
                        <button type="button" className={categoriaPdv === "promocoes" ? "is-on" : ""} onClick={() => setCategoriaPdv("promocoes")}>Promoções</button>
                    </div>
                    <div className="pdv-palco">
                    <div className="pdv-vitrine">
                        {vitrine.map((p) => {
                            const off = emPromocao(p) ? Math.round(pctOff(p.preco, p.precoPromocional) || Number(p.descontoPercentual) || 0) : 0;
                            return (
                                <article key={p.id} className="pdv-card">
                                    <div className="pdv-card-midia">
                                        {off > 0 ? <em>{off}% OFF</em> : null}
                                        <FotoProduto produto={p} />
                                    </div>
                                    <strong>{p.nome}</strong>
                                    <small>{p.sku ? `SKU ${p.sku}` : "sem código"} · est. {Number(p.estoque || 0)}</small>
                                    <div className="pdv-card-preco">
                                        <b>{brl(precoVigente(p))}</b>
                                        <button type="button" aria-label={`adicionar ${p.nome}`} onClick={() => adicionar(p)}><Plus size={16} /></button>
                                    </div>
                                </article>
                            );
                        })}
                        {!vitrine.length ? <p className="pdv-muted">Nenhum produto nesta categoria.</p> : null}
                    </div>

                    <aside className="pdv-sacola">
                        <header>
                            <strong>Carrinho</strong>
                            <span>{cliente.nome}</span>
                        </header>
                        <div className="pdv-sacola-lista">
                            {itens.length ? itens.map((i) => (
                                <button
                                    key={i.id}
                                    type="button"
                                    className={editando?.id === i.id && painel === "item" ? "is-on" : ""}
                                    onClick={() => abrirEdicao(i)}
                                >
                                    <strong>{i.nome}</strong>
                                    <small>{numBr(i.qtd, 2)} {i.unidade} · {brl(i.preco)}</small>
                                    <b>{brl(i.qtd * i.preco)}</b>
                                </button>
                            )) : (
                                <div className="pdv-vazio">
                                    <div className="pdv-vazio-arte" aria-hidden="true"><ShoppingCart size={32} /></div>
                                    <strong>Adicione produtos ao carrinho</strong>
                                    <p>Clique no + do card ou leia o código de barras.</p>
                                </div>
                            )}
                        </div>
                        <footer>
                            <p>Desconto {brl(parseBr(desconto))} · {itens.length} item</p>
                            <strong>{brl(liquido || total)}</strong>
                            <button type="button" className="pdv-btn" disabled={!itens.length} onClick={continuar}>Continuar para recebimento</button>
                            <small>Clique no item para editar · Shift+Enter no último</small>
                        </footer>
                    </aside>
                    </div>
                    <div className="pdv-acoes-rapidas">
                        <button type="button" onClick={() => { setBuscaAvancada(busca); setPainel("busca"); }}>
                            <Search size={16} />
                            Buscar produto
                            <small>CTRL + B</small>
                        </button>
                        <button type="button" onClick={() => { buscaRef.current?.focus(); buscaRef.current?.select(); }}>
                            <Barcode size={16} />
                            Ler código de barras
                            <small>F2</small>
                        </button>
                        <button type="button" onClick={() => { setBuscaAvancada(""); setPainel("busca"); }}>
                            <List size={16} />
                            Selecionar da lista
                            <small>F3</small>
                        </button>
                    </div>
                    <footer className="pdv-atalhos-venda">
                        <span>Atalhos da venda</span>
                        <button type="button" onClick={() => setPainel("clientes")}>
                            <UserRound size={16} />
                            <em>Cliente<small>F10</small></em>
                        </button>
                        <button type="button" onClick={() => setPainel("vendedores")}>
                            <UserRound size={16} />
                            <em>Vendedor<small>F11</small></em>
                        </button>
                        <button type="button" onClick={() => setPainel("desconto")}>
                            <Percent size={16} />
                            <em>Desconto<small>F12</small></em>
                        </button>
                        <button type="button" onClick={() => setPainel("obs")}>
                            <MessageSquare size={16} />
                            <em>Observação</em>
                        </button>
                        <button type="button" onClick={() => setPainel("atalhos")}>
                            <Star size={16} />
                            <em>Atalhos personalizados</em>
                        </button>
                        {itens.length ? (
                            <button type="button" className="pdv-btn pdv-ir-pagamento" onClick={continuar}>
                                Continuar
                                <small>{brl(liquido || total)} · CTRL+ENTER</small>
                            </button>
                        ) : null}
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
                        ["lista de preços", "", () => navigate(ROTAS.PRODUTOS)],
                        ["pedidos de venda", "", () => navigate(ROTAS.PEDIDO_VENDA)],
                        ["caixa financeiro", "", () => navigate("/financeiro")],
                        ["contas a receber", "", () => navigate(ROTAS.CONTAS_RECEBER)],
                        ["devolver produtos", "", () => { setPainel("caixa"); setCaixaTab("dev"); }],
                        ["orçamento", "", gerarOrcamento],
                        ["gerar OS", "", gerarOs],
                        ["faturar pré-venda", "", abrirPreVendas],
                        ["receber crediário", "", () => setPainel("crediario")],
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
                            <button type="button" className="pdv-link" onClick={() => navigate(ROTAS.DEVOLUCOES)}>abrir devoluções de venda</button>
                            <label className="pdv-drawer-busca">
                                <Search size={16} />
                                <input
                                    ref={devolucaoRef}
                                    value={buscaDev}
                                    onChange={(e) => setBuscaDev(e.target.value)}
                                    placeholder="Pesquise pelo cliente, nº do pedido ou chave de acesso"
                                />
                            </label>
                            {(store.caixa?.devolucoes || []).length ? (store.caixa.devolucoes || []).map((d) => (
                                <button key={d.numero} type="button" onClick={() => navigate(`${ROTAS.DEVOLUCOES}?q=${encodeURIComponent(d.numero)}`)}>
                                    {d.numero} · {d.cliente || "Consumidor final"}
                                    <small>{brl(d.valor)}</small>
                                </button>
                            )) : null}
                            {(store.vendas || []).filter((v) => {
                                if (v.rascunho) {
                                    return false;
                                }
                                const q = buscaDev.trim().toLowerCase();
                                if (!q) {
                                    return true;
                                }
                                return [v.numero, v.clienteNome, v.vendedorNome, v.pedidoNumero].join(" ").toLowerCase().includes(q);
                            }).length === 0 ? (
                                <p>Nenhuma venda deste caixa para devolver</p>
                            ) : (store.vendas || []).filter((v) => {
                                if (v.rascunho) {
                                    return false;
                                }
                                const q = buscaDev.trim().toLowerCase();
                                if (!q) {
                                    return true;
                                }
                                return [v.numero, v.clienteNome, v.vendedorNome, v.pedidoNumero].join(" ").toLowerCase().includes(q);
                            }).map((v) => (
                                <button
                                    key={v.numero + String(v.data)}
                                    type="button"
                                    onClick={() => navigate(v.pedidoId ? `${ROTAS.DEVOLUCOES}?pedido=${v.pedidoId}` : `${ROTAS.DEVOLUCOES}?q=${encodeURIComponent(v.clienteNome || v.numero || "")}`)}
                                >
                                    Devolver pedido {v.pedidoNumero || v.numero} · {v.clienteNome || "Consumidor final"}
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
                        {vendedores.filter((v) => String(v.nome || "").toLowerCase().includes(filtroVendedor.trim().toLowerCase())).map((v) => (
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

            {painel === "prevenda" ? (
                <aside className="pdv-drawer">
                    <div className="pdv-drawer-head">
                        <div>
                            <h2>Faturar pré-venda</h2>
                            <p>Orçamentos do pedido de venda. O clique carrega os itens neste caixa.</p>
                        </div>
                        <button type="button" className="pdv-fechar" onClick={() => setPainel(null)}>fechar ×</button>
                    </div>
                    <div className="pdv-lista">
                        {!preVendas.length ? <p>Nenhum orçamento em aberto.</p> : null}
                        {preVendas.map((p) => (
                            <button key={p.id || p.numero} type="button" onClick={() => aplicarPreVenda(p)}>
                                {p.numero || "Orçamento"} · {p.cliente || "Consumidor final"}
                                <small>{brl(p.valor)} · {(p.itens || []).length} item</small>
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
                        {contasVisiveis.length === 0 ? <p>Nenhum crediário em aberto para esta busca.</p> : null}
                        {contasVisiveis.map((c) => {
                            const dono = clientes.find((cli) => String(cli.id) === String(c.clienteId));
                            return (
                                <button key={c.id} type="button" onClick={() => baixarCrediario(c)}>
                                    {dono?.nome || c.descricao || `Conta ${c.id}`}
                                    <small>{c.descricao || "Conta a receber"} · {brl(c.valor)} · {c.status || "ABERTO"}</small>
                                </button>
                            );
                        })}
                    </div>
                    <div className="pdv-drawer-foot">
                        <button type="button" className="pdv-link" onClick={() => setPainel(null)}>cancelar ESC</button>
                    </div>
                </aside>
            ) : null}

            {painel === "item" && editando ? (
                <aside className="pdv-drawer">
                    <div className="pdv-drawer-head">
                        <div>
                            <h2>Editar produto</h2>
                            <p>Altere descrição, quantidade ou preço. Shift+Enter abre o último item.</p>
                        </div>
                        <button type="button" className="pdv-fechar" onClick={() => setPainel(null)}>fechar ×</button>
                    </div>
                    <form onSubmit={salvarEdicao}>
                        <div className="pdv-field">
                            <label>Descrição</label>
                            <input value={editando.nome} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} />
                        </div>
                        <div className="pdv-chk">
                            <div className="pdv-field">
                                <label>Quantidade</label>
                                <input ref={itemQtdRef} value={editando.qtd} onChange={(e) => setEditando({ ...editando, qtd: e.target.value })} />
                            </div>
                            <div className="pdv-field">
                                <label>Preço un.</label>
                                <input value={editando.preco} onChange={(e) => setEditando({ ...editando, preco: e.target.value })} />
                            </div>
                        </div>
                        <p className="pdv-muted">total da linha {brl(parseBr(editando.qtd) * parseBr(editando.preco))}</p>
                        <div className="pdv-drawer-foot">
                            <button type="submit" className="pdv-btn">salvar</button>
                            <button type="button" className="pdv-link" onClick={removerEditando}>remover da venda</button>
                        </div>
                    </form>
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
                        {baseAtalhos.map((p) => {
                            const on = (store.atalhos || []).some((id) => String(id) === String(p.id));
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    className={on ? "is-on" : ""}
                                    onClick={() => persist({
                                        ...store,
                                        atalhos: on
                                            ? (store.atalhos || []).filter((id) => String(id) !== String(p.id))
                                            : [...(store.atalhos || []), p.id]
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

            {painel === "desconto" ? (
                <aside className="pdv-drawer">
                    <div className="pdv-drawer-head">
                        <h2>Desconto</h2>
                        <button type="button" className="pdv-fechar" onClick={() => setPainel(null)}>fechar ×</button>
                    </div>
                    <div className="pdv-field">
                        <label>Valor do desconto</label>
                        <input ref={descontoRef} value={desconto} onChange={(e) => setDesconto(e.target.value)} />
                    </div>
                    <div className="pdv-drawer-foot">
                        <button type="button" className="pdv-btn" onClick={() => setPainel(null)}>aplicar</button>
                    </div>
                </aside>
            ) : null}

            {painel === "obs" ? (
                <aside className="pdv-drawer">
                    <div className="pdv-drawer-head">
                        <h2>Observação</h2>
                        <button type="button" className="pdv-fechar" onClick={() => setPainel(null)}>fechar ×</button>
                    </div>
                    <div className="pdv-field">
                        <label>Anotação da venda</label>
                        <textarea ref={obsRef} rows={4} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
                    </div>
                    <div className="pdv-drawer-foot">
                        <button type="button" className="pdv-btn" onClick={() => setPainel(null)}>salvar</button>
                    </div>
                </aside>
            ) : null}

            {etapa === "pagamento" ? (
                <aside className="pdv-drawer pdv-pay">
                    <div className="pdv-drawer-head">
                        <h2>Escolha uma forma de recebimento</h2>
                        <button type="button" className="pdv-pay-x" aria-label="fechar" onClick={() => setEtapa("venda")}>×</button>
                    </div>
                    <p className="pdv-pay-total">Total da venda: <strong>{brl(liquido || total)}</strong></p>
                    <div className="pdv-formas">
                        {FORMAS.map((f) => {
                            const Icon = ICONE_FORMA[f.id];
                            const ativo = forma === f.id;
                            return (
                                <button key={f.id} type="button" className={`pdv-forma${ativo ? " is-on" : ""}${f.id === "link" ? " is-full" : ""}`} onClick={() => setForma(f.id)}>
                                    <b>{f.atalho}</b>
                                    <span>{Icon ? <Icon size={18} /> : null} {f.nome}</span>
                                    {ativo ? <Check size={16} /> : null}
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
                        Não exibir esta janela novamente
                    </label>
                    <div className="pdv-pay-foot">
                        <button type="button" className="pdv-btn" onClick={irCheckout}>
                            <ArrowRight size={16} />
                            Continuar
                            <small>CTRL + ENTER</small>
                        </button>
                        <button type="button" className="pdv-pay-cancel" onClick={() => setEtapa("venda")}>
                            Cancelar
                            <small>ESC</small>
                        </button>
                    </div>
                </aside>
            ) : null}
        </div>
    );
}

