import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    ChevronLeft,
    Paperclip,
    Plus,
    Printer,
    RefreshCw,
    Search,
    Trash2,
    Wallet,
    X
} from "lucide-react";

import {
    CATEGORIAS_PAGAMENTO,
    FORMAS_RECEBIMENTO,
    LISTAS_PRECO,
    TIPOS_ITEM_OS,
    calcularComissoes,
    itemServicoVazio,
    moeda,
    osVazia,
    parcelaVazia,
    situacaoMeta,
    totalItem,
    totalLiquido,
    totalPorTipo,
    totalServicos
} from "../../../constants/ordensServico";
import {
    SETORES_OS,
    descontoDaForma,
    faixaComissaoPorDesconto,
    precoPelaLista,
    setorPorStatus,
    tecnicosAtivos
} from "../../../constants/tecnicos";
import { produtosLoja } from "../../../constants/catalogoLoja";
import { listarFuncionarios } from "../../../constants/rh";
import { rotuloNatureza, sugerirNatureza } from "../../../constants/naturezasOperacao";
import { listarClientes } from "../../../services/clientes.service";
import { listarNaturezasOperacao } from "../../../services/naturezaOperacao.service";
import { atualizarOS, buscarOS, salvarOS } from "../../../services/os.service";
import { listarMaquinas } from "../../../services/maquina.service";
import { listarProdutos } from "../../../services/produto.service";
import { ouvirPrecos } from "../../../constants/precoPromocional";
import { registrarOsCaixa } from "../../../services/caixa.service";
import ROTAS from "../../../constants/rotas";
import HistoricoAuditoria from "../../../components/HistoricoAuditoria";

import "../../../styles/layout/app-shell.css";
import "../../../styles/pages/indice.css";
import "../../../styles/pages/ferramentas.css";
import "../../../styles/pages/produtos.css";
import "../../../styles/pages/os.css";
import "../../../styles/pages/auditoria.css";

const MAX_ANEXO = 2 * 1024 * 1024;
const REFINOS = [
    { id: "todos", nome: "Todos os campos" },
    { id: "nome", nome: "Nome" },
    { id: "sku", nome: "SKU" },
    { id: "gtin", nome: "GTIN/EAN" },
    { id: "grupo", nome: "Grupo" },
    { id: "marca", nome: "Marca" }
];

function chaveProduto(p) {
    return String(p.id || p.sku || p.gtin || p.nome);
}

function mesclarCatalogo(api, loja) {
    const mapa = new Map();
    (loja || []).forEach((p) => mapa.set(chaveProduto(p), p));
    (api || []).forEach((p) => {
        const k = chaveProduto(p);
        mapa.set(k, { ...(mapa.get(k) || {}), ...p });
    });
    return [...mapa.values()];
}

function passaRefino(p, termo, refino) {
    const t = termo.trim().toLowerCase();
    if (!t) {
        return true;
    }
    const campos = {
        nome: p.nome,
        sku: p.sku,
        gtin: p.gtin || p.codigoBarras,
        grupo: p.grupo || p.categoria,
        marca: p.marca
    };
    if (refino !== "todos") {
        return String(campos[refino] || "").toLowerCase().includes(t);
    }
    return Object.values(campos).join(" ").toLowerCase().includes(t);
}

export default function NovaOS({ id: idProp }) {
    const { hash } = useLocation();
    const id = idProp || (String(hash).match(/^#edit\/([^/?#]+)/)?.[1] ?? "");
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const fileRef = useRef(null);
    const [form, setForm] = useState(() => osVazia());
    const [item, setItem] = useState(() => itemServicoVazio());
    const [clientes, setClientes] = useState([]);
    const [naturezas, setNaturezas] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [maquinas, setMaquinas] = useState([]);
    const [buscaCliente, setBuscaCliente] = useState("");
    const [buscaItem, setBuscaItem] = useState("");
    const [mostraCliente, setMostraCliente] = useState(false);
    const [mostraItem, setMostraItem] = useState(false);
    const [buscaAvancada, setBuscaAvancada] = useState(false);
    const [refino, setRefino] = useState("todos");
    const [dadosCliente, setDadosCliente] = useState(false);
    const [carregando, setCarregando] = useState(Boolean(id));
    const [naoEncontrado, setNaoEncontrado] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [aviso, setAviso] = useState("");
    const contatoAplicado = useRef(false);

    useEffect(() => {
        listarClientes().then(setClientes).catch(() => setClientes([]));
        listarMaquinas().then(setMaquinas).catch(() => setMaquinas([]));
        listarNaturezasOperacao().then(setNaturezas).catch(() => setNaturezas([]));
        function atualizarProdutos() {
            listarProdutos()
                .then((api) => setProdutos(mesclarCatalogo(api, produtosLoja())))
                .catch(() => setProdutos(produtosLoja()));
        }
        atualizarProdutos();
        return ouvirPrecos(atualizarProdutos);
    }, []);

    useEffect(() => {
        if (!id) {
            const base = osVazia();
            const equipamento = params.get("equipamento") || sessionStorage.getItem("erp-os-equipamento") || "";
            const maquinaId = params.get("maquinaId") || sessionStorage.getItem("erp-os-maquina-id") || "";
            if (equipamento) {
                base.equipamento = equipamento;
                sessionStorage.removeItem("erp-os-equipamento");
            }
            if (maquinaId) {
                base.maquinaId = Number(maquinaId);
                sessionStorage.removeItem("erp-os-maquina-id");
            }
            setForm(base);
            setCarregando(false);
            return;
        }
        let vivo = true;
        setCarregando(true);
        buscarOS(id)
            .then((os) => {
                if (vivo) {
                    setForm(os);
                    setBuscaCliente(os.cliente || "");
                }
            })
            .catch(() => {
                if (vivo) {
                    setNaoEncontrado(true);
                }
            })
            .finally(() => {
                if (vivo) {
                    setCarregando(false);
                }
            });
        return () => {
            vivo = false;
        };
    }, [id]);

    useEffect(() => {
        const contatoId = params.get("contato");
        if (!contatoId || id || contatoAplicado.current || !clientes.length) {
            return;
        }
        const contato = clientes.find((item) => String(item.id) === String(contatoId));
        if (!contato) {
            return;
        }
        contatoAplicado.current = true;
        escolherCliente(contato);
    }, [clientes, id, params]);

    const clientesFiltrados = useMemo(() => {
        const t = buscaCliente.trim().toLowerCase();
        return clientes.filter((c) => {
            if (!t) {
                return true;
            }
            return [c.nome, c.fantasia, c.cpfCnpj, c.telefone].join(" ").toLowerCase().includes(t);
        }).slice(0, 20);
    }, [clientes, buscaCliente]);

    const termoItem = (item.descricao || buscaItem).trim().toLowerCase();
    const produtosFiltrados = useMemo(() => {
        if (!termoItem) {
            return [];
        }
        return produtos.filter((p) => passaRefino(p, termoItem, "todos")).slice(0, 40);
    }, [produtos, termoItem]);

    const avancados = useMemo(() => {
        return produtos.filter((p) => passaRefino(p, buscaItem, refino)).slice(0, 250);
    }, [produtos, buscaItem, refino]);

    const vendedores = useMemo(
        () => listarFuncionarios().filter((f) => /vend|sóc|socio|pro-labore|pró-labore/i.test(f.cargo || "")),
        []
    );
    const equipe = tecnicosAtivos();
    const clienteSel = clientes.find((c) => String(c.id) === String(form.clienteId));
    const sit = situacaoMeta(form.status);
    const bruto = totalServicos(form.itens);
    const liquido = totalLiquido(form);
    const comissoes = useMemo(
        () => calcularComissoes(form, faixaComissaoPorDesconto),
        [form]
    );

    function setCampo(chave, valor) {
        setForm((atual) => ({ ...atual, [chave]: valor }));
    }

    function aplicarNatureza(os, cliente) {
        const origem = cliente || clientes.find((c) => String(c.id) === String(os.clienteId));
        if (!origem) {
            return os;
        }
        const sugestao = sugerirNatureza(origem, naturezas);
        return {
            ...os,
            naturezaOperacaoId: sugestao.naturezaId || "",
            naturezaOperacao: sugestao.nome || "",
            naturezaCodigo: sugestao.codigo || "",
            cfop: sugestao.cfop || ""
        };
    }

    function escolherCliente(c) {
        setForm((atual) => aplicarNatureza({
            ...atual,
            clienteId: c.id,
            cliente: c.nome,
            fantasia: c.fantasia || "",
            telefone: c.celular || c.telefone || "",
            listaPreco: c.listaPreco || atual.listaPreco,
            vendedor: c.vendedor || atual.vendedor
        }, c));
        setBuscaCliente(c.nome);
        setMostraCliente(false);
    }

    function escolherProduto(p) {
        setItem({
            descricao: p.nome || "",
            codigo: p.sku || "",
            tipo: p.produtoProducao || /servi/i.test(p.grupo || p.categoria || "") ? "servico" : "peca",
            quantidade: "1",
            preco: String(precoPelaLista(p, form.listaPreco)),
            desconto: "0",
            orcar: false,
            ok: false
        });
        setMostraItem(false);
        setBuscaAvancada(false);
        setBuscaItem("");
    }

    function salvarItem() {
        if (!item.descricao.trim()) {
            return;
        }
        setForm((atual) => ({ ...atual, itens: [...atual.itens, item] }));
        setItem(itemServicoVazio());
        setBuscaItem("");
    }

    function removerItem(idx) {
        setForm((atual) => ({ ...atual, itens: atual.itens.filter((_, i) => i !== idx) }));
    }

    function toggleTecnico(tecnico) {
        setForm((atual) => {
            const ja = (atual.tecnicos || []).some((t) => String(t.id) === String(tecnico.id));
            const tecnicos = ja
                ? atual.tecnicos.filter((t) => String(t.id) !== String(tecnico.id))
                : [...(atual.tecnicos || []), { id: tecnico.id, nome: tecnico.nome, pct: tecnico.comissaoPct || 1 }];
            return { ...atual, tecnicos };
        });
    }

    function encaminhar(setor) {
        const agora = new Date().toISOString();
        setForm((atual) => ({
            ...atual,
            status: setor.status,
            setorAtual: setor.id,
            historicoWorkflow: [
                ...(atual.historicoWorkflow || []),
                { setor: setor.id, status: setor.status, em: agora }
            ]
        }));
    }

    function aplicarForma(forma) {
        const pct = descontoDaForma(forma);
        setForm((atual) => {
            if (!atual.descontoAutomatico) {
                return { ...atual, formaPagamento: forma };
            }
            return {
                ...atual,
                formaPagamento: forma,
                desconto: pct ? `${pct}%` : "0"
            };
        });
    }

    function atualizarParcelas() {
        const texto = String(form.condicao || "30").toLowerCase();
        let prazos = [];
        if (texto.includes("x")) {
            const n = Number(texto.replace(/\D/g, "")) || 1;
            prazos = Array.from({ length: n }, (_, i) => (i + 1) * 30);
        } else {
            prazos = texto.split(/[^\d]+/).map(Number).filter((n) => n > 0);
        }
        if (!prazos.length) {
            prazos = [30];
        }
        const valor = liquido / prazos.length;
        setForm((atual) => ({
            ...atual,
            parcelas: prazos.map((dias) => ({ ...parcelaVazia(dias), valor: valor.toFixed(2) }))
        }));
    }

    async function anexar(arquivo) {
        if (!arquivo) {
            return;
        }
        if (arquivo.size > MAX_ANEXO) {
            setAviso("O tamanho do arquivo não deve ultrapassar 2 MB.");
            return;
        }
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(arquivo);
        });
        setForm((atual) => ({
            ...atual,
            anexos: [...atual.anexos, { nome: arquivo.name, dataUrl }]
        }));
        if (fileRef.current) {
            fileRef.current.value = "";
        }
    }

    async function lancarCaixa() {
        if (liquido <= 0) {
            setAviso("Informe itens com valor antes de lançar no caixa.");
            return;
        }
        try {
            await registrarOsCaixa({
                valor: liquido,
                descricao: `OS ${form.numero || id || "nova"} · ${form.cliente} · ${form.formaPagamento}`,
                referenciaId: form.id || null
            });
            setForm((atual) => ({ ...atual, contasLancadas: true }));
            setAviso("Recebimento lançado no caixa.");
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível lançar no caixa. Confira se a API está no ar.");
        }
    }

    async function salvar() {
        if (!form.cliente.trim()) {
            setAviso("Informe o cliente.");
            return;
        }
        setSalvando(true);
        try {
            const payload = aplicarNatureza({
                ...form,
                valor: liquido,
                valorComissao: comissoes.valorVendedor.toFixed(2),
                setorAtual: form.setorAtual || setorPorStatus(form.status).id
            });
            if (id) {
                await atualizarOS(id, payload);
            } else {
                await salvarOS(payload);
            }
            navigate(ROTAS.ORDEM_SERVICO);
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível salvar a ordem de serviço. Confira se a API está no ar.");
        } finally {
            setSalvando(false);
        }
    }

    if (naoEncontrado) {
        return (
            <div className="os-page">
                <p>Ordem de serviço não encontrada.</p>
                <Link to={ROTAS.ORDEM_SERVICO}>voltar</Link>
            </div>
        );
    }

    if (carregando) {
        return (
            <div className="os-page">
                <p>Carregando ordem de serviço...</p>
            </div>
        );
    }

    return (
        <div className="os-form-page">
            <div className="os-form-top">
                <button type="button" className="int-voltar" onClick={() => navigate(ROTAS.ORDEM_SERVICO)}>
                    <ChevronLeft size={16} /> voltar
                </button>
                <nav className="dash-crumb">
                    <Link to="/index">início</Link>
                    <span>›</span>
                    <span>serviços</span>
                    <span>›</span>
                    <Link to={ROTAS.ORDEM_SERVICO}>ordens de serviço</Link>
                </nav>
                <button type="button" className="os-ghost" onClick={() => window.print()}>
                    <Printer size={15} /> imprimir
                </button>
            </div>

            <header className="os-form-head">
                <h2>Ordem de Serviço</h2>
                <div className="os-badges">
                    <em className={form.contasLancadas ? "is-on" : ""}>C</em>
                    <em className={form.estoqueLancado ? "is-on" : ""}>V</em>
                    <em className={form.nfsEmitida ? "is-on" : ""}>NF</em>
                    <span className="os-dot" style={{ background: sit.cor }} />
                    <small>{sit.label}</small>
                </div>
            </header>

            {aviso ? <p className="prd-aviso">{aviso}</p> : null}

            <section className="os-card">
                <h3>Workflow</h3>
                <div className="os-workflow">
                    {SETORES_OS.map((setor) => (
                        <button
                            key={setor.id}
                            type="button"
                            className={form.setorAtual === setor.id || form.status === setor.status ? "is-on" : ""}
                            onClick={() => encaminhar(setor)}
                        >
                            {setor.label}
                        </button>
                    ))}
                </div>
                <p className="os-hint">Encaminhe o atendimento entre setores. O mesmo fluxo aparece no kanban de produção.</p>
            </section>

            <section className="os-card">
                <div className="os-grid-3">
                    <label>
                        Número
                        <input value={form.numero || (id ? form.id : "")} disabled />
                    </label>
                    <label className="os-span-2 os-lookup">
                        Cliente
                        <span>
                            <input
                                value={buscaCliente}
                                placeholder="Buscar cliente"
                                onFocus={() => setMostraCliente(true)}
                                onChange={(e) => {
                                    setBuscaCliente(e.target.value);
                                    setCampo("cliente", e.target.value);
                                    setMostraCliente(true);
                                }}
                            />
                            <Search size={15} />
                        </span>
                        {mostraCliente ? (
                            <ul className="os-sugestao">
                                {clientesFiltrados.map((c) => (
                                    <li key={c.id}>
                                        <button type="button" onClick={() => escolherCliente(c)}>
                                            <strong>{c.nome}</strong>
                                            <small>{c.fantasia || c.cpfCnpj || c.telefone}</small>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </label>
                    <label>
                        Lista de preço
                        <span className="os-preco-row">
                            <select value={form.listaPreco} onChange={(e) => setCampo("listaPreco", e.target.value)}>
                                {LISTAS_PRECO.map((l) => <option key={l}>{l}</option>)}
                            </select>
                            <button type="button" className="os-icon-btn" title="Atualizar" onClick={() => setCampo("listaPreco", "Padrão")}>
                                <RefreshCw size={14} />
                            </button>
                        </span>
                    </label>
                </div>
                {form.cfop || form.naturezaOperacao ? (
                    <p className="os-hint">
                        {rotuloNatureza({ cfop: form.cfop, nome: form.naturezaOperacao })}
                    </p>
                ) : null}
                <button type="button" className="idx-text" onClick={() => setDadosCliente((v) => !v)}>
                    dados do cliente
                </button>
                {dadosCliente && (clienteSel || form.cliente) ? (
                    <p className="os-cli-dados">
                        {form.cliente}
                        {form.fantasia ? ` · ${form.fantasia}` : ""}
                        {form.telefone ? ` · ${form.telefone}` : ""}
                        {clienteSel?.email ? ` · ${clienteSel.email}` : ""}
                        {form.cfop ? ` · CFOP ${form.cfop}` : ""}
                    </p>
                ) : null}

                <label>
                    Descrição do serviço
                    <textarea rows={3} value={form.descricao} onChange={(e) => setCampo("descricao", e.target.value)} />
                </label>
                <label>
                    Considerações finais
                    <textarea rows={2} value={form.consideracoes} onChange={(e) => setCampo("consideracoes", e.target.value)} />
                </label>
                <label className="os-check">
                    <input
                        type="checkbox"
                        checked={form.municipioDiferente}
                        onChange={(e) => setCampo("municipioDiferente", e.target.checked)}
                    />
                    Informar município de prestação do serviço diferente do tomador/prestador
                </label>
            </section>

            <section className="os-card">
                <h3>Técnicos</h3>
                <p className="os-hint">Uma OS pode ter vários profissionais. A comissão de técnico incide só sobre serviços, não sobre peças.</p>
                <div className="os-tecnicos">
                    {equipe.map((t) => {
                        const on = (form.tecnicos || []).some((x) => String(x.id) === String(t.id));
                        return (
                            <button
                                key={t.id}
                                type="button"
                                className={on ? "is-on" : ""}
                                onClick={() => toggleTecnico(t)}
                            >
                                <strong>{t.nome}</strong>
                                <small>{t.cargo} · {setorPorStatus(t.setor).label}</small>
                            </button>
                        );
                    })}
                </div>
                <Link className="idx-text" to={ROTAS.TECNICOS}>cadastrar técnicos</Link>
            </section>

            <section className="os-card">
                <h3>Serviços e produtos</h3>
                <div className="os-scroll">
                    <table className="os-itens">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Cód</th>
                                <th>Tipo</th>
                                <th>Quantidade</th>
                                <th>Preço</th>
                                <th>Desconto %</th>
                                <th>Valor total</th>
                                <th>Orçar</th>
                                <th>OK</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {form.itens.map((linha, idx) => (
                                <tr key={`${linha.codigo}-${idx}`}>
                                    <td>{linha.descricao}</td>
                                    <td>{linha.codigo}</td>
                                    <td>{linha.tipo === "peca" ? "Peça" : "Serviço"}</td>
                                    <td>{linha.quantidade}</td>
                                    <td>{moeda(linha.preco)}</td>
                                    <td>{linha.desconto}</td>
                                    <td>{moeda(totalItem(linha))}</td>
                                    <td>{linha.orcar ? "sim" : ""}</td>
                                    <td>{linha.ok ? "sim" : ""}</td>
                                    <td>
                                        <button type="button" className="os-icon-btn" onClick={() => removerItem(idx)} aria-label="Remover">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr className="os-item-new">
                                <td className="os-lookup">
                                    <input
                                        placeholder="Pesquise por descrição, SKU ou GTIN"
                                        value={item.descricao}
                                        onFocus={() => setMostraItem(true)}
                                        onChange={(e) => {
                                            setItem((a) => ({ ...a, descricao: e.target.value }));
                                            setBuscaItem(e.target.value);
                                            setMostraItem(true);
                                        }}
                                    />
                                    {mostraItem && produtosFiltrados.length ? (
                                        <ul className="os-sugestao is-longa">
                                            {produtosFiltrados.map((p) => (
                                                <li key={chaveProduto(p)}>
                                                    <button type="button" onClick={() => escolherProduto(p)}>
                                                        <strong>{p.nome}</strong>
                                                        <small>{p.sku} · {p.gtin || "sem GTIN"} · {moeda(precoPelaLista(p, form.listaPreco))}</small>
                                                    </button>
                                                </li>
                                            ))}
                                            <li>
                                                <button type="button" onClick={() => { setBuscaAvancada(true); setMostraItem(false); }}>
                                                    ver todos ({produtos.length} no catálogo)
                                                </button>
                                            </li>
                                        </ul>
                                    ) : null}
                                </td>
                                <td>
                                    <input value={item.codigo} onChange={(e) => setItem((a) => ({ ...a, codigo: e.target.value }))} />
                                </td>
                                <td>
                                    <select value={item.tipo} onChange={(e) => setItem((a) => ({ ...a, tipo: e.target.value }))}>
                                        {TIPOS_ITEM_OS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </td>
                                <td>
                                    <input value={item.quantidade} onChange={(e) => setItem((a) => ({ ...a, quantidade: e.target.value }))} />
                                </td>
                                <td>
                                    <input value={item.preco} onChange={(e) => setItem((a) => ({ ...a, preco: e.target.value }))} />
                                </td>
                                <td>
                                    <input value={item.desconto} onChange={(e) => setItem((a) => ({ ...a, desconto: e.target.value }))} />
                                </td>
                                <td>
                                    <input value={moeda(totalItem(item))} disabled />
                                </td>
                                <td>
                                    <input type="checkbox" checked={item.orcar} onChange={(e) => setItem((a) => ({ ...a, orcar: e.target.checked }))} />
                                </td>
                                <td>
                                    <input type="checkbox" checked={item.ok} onChange={(e) => setItem((a) => ({ ...a, ok: e.target.checked }))} />
                                </td>
                                <td>
                                    <button type="button" className="idx-text" onClick={salvarItem}>salvar</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="os-item-links">
                    <button type="button" className="idx-text" onClick={salvarItem}><Plus size={14} /> adicionar serviço</button>
                    <button type="button" className="idx-text" onClick={() => setBuscaAvancada(true)}><Search size={14} /> busca avançada de itens</button>
                    <small>{produtos.length.toLocaleString("pt-BR")} produtos no catálogo</small>
                </div>
            </section>

            <section className="os-card">
                <h3>Detalhes da ordem de serviço</h3>
                <div className="os-grid-4">
                    <label>
                        Equipamento
                        <input
                            list="os-maquinas"
                            value={form.equipamento || ""}
                            placeholder="Máquina da produção"
                            onChange={(e) => {
                                const nome = e.target.value;
                                const achou = maquinas.find((item) => item.nome === nome);
                                setForm((atual) => ({ ...atual, equipamento: nome, maquinaId: achou?.id || null }));
                            }}
                        />
                        <datalist id="os-maquinas">
                            {maquinas.map((m) => (
                                <option key={m.id} value={m.nome}>{m.tipo}</option>
                            ))}
                        </datalist>
                    </label>
                    <label>
                        Data de início
                        <input type="date" value={form.dataAbertura} onChange={(e) => setCampo("dataAbertura", e.target.value)} />
                    </label>
                    <label>
                        Data prevista
                        <input type="date" value={form.dataPrevisao} onChange={(e) => setCampo("dataPrevisao", e.target.value)} />
                    </label>
                    <label>
                        Hora
                        <input type="time" value={form.hora} onChange={(e) => setCampo("hora", e.target.value)} />
                    </label>
                    <label>
                        Data de conclusão
                        <input type="date" value={form.dataConclusao} onChange={(e) => setCampo("dataConclusao", e.target.value)} />
                    </label>
                    <label>
                        Total serviços
                        <input value={`R$ ${moeda(totalPorTipo(form.itens, "servico"))}`} disabled />
                    </label>
                    <label>
                        Total peças
                        <input value={`R$ ${moeda(totalPorTipo(form.itens, "peca"))}`} disabled />
                    </label>
                    <label>
                        Bruto
                        <input value={`R$ ${moeda(bruto)}`} disabled />
                    </label>
                    <label>
                        Desconto
                        <input
                            value={form.desconto}
                            onChange={(e) => setForm((atual) => ({ ...atual, desconto: e.target.value, descontoAutomatico: false }))}
                        />
                        <small>Valor em R$ ou 10%. Pix/Dinheiro aplicam desconto automático.</small>
                    </label>
                </div>
                <label>
                    Observações do serviço
                    <textarea rows={4} value={form.observacoes} onChange={(e) => setCampo("observacoes", e.target.value)} />
                </label>
                <label>
                    Observações internas
                    <textarea rows={3} value={form.observacoesInternas} onChange={(e) => setCampo("observacoesInternas", e.target.value)} />
                </label>
                <div className="os-grid-3">
                    <label>
                        Vendedor
                        <input
                            list="os-vendedores"
                            value={form.vendedor}
                            onChange={(e) => setCampo("vendedor", e.target.value)}
                        />
                        <datalist id="os-vendedores">
                            {vendedores.map((v) => <option key={v.id} value={v.nome} />)}
                        </datalist>
                    </label>
                    <label>
                        Comissão do vendedor %
                        <input value={form.comissaoPct} onChange={(e) => setCampo("comissaoPct", e.target.value)} />
                        <small>Sobre peças. Se não houver peças, sobre o líquido.</small>
                    </label>
                    <label>
                        Valor comissão vendedor
                        <input value={moeda(comissoes.valorVendedor)} disabled />
                    </label>
                </div>
                <div className="os-comissao-box">
                    <p>
                        Comissão de técnicos: <strong>{comissoes.faixa.pct}%</strong> ({comissoes.faixa.label})
                        · desconto da OS {moeda(comissoes.pctDesconto)}%
                        · total <strong>R$ {moeda(comissoes.valorTecnicos)}</strong>
                    </p>
                    {(comissoes.tecnicos || []).length ? (
                        <ul>
                            {comissoes.tecnicos.map((t) => (
                                <li key={t.id}>{t.nome} · R$ {moeda(t.valor)}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="os-hint">Selecione ao menos um técnico para calcular a comissão de serviço.</p>
                    )}
                </div>
            </section>

            <section className="os-card">
                <h3>Pagamento, caixa e nota</h3>
                <div className="os-grid-3">
                    <label>
                        Forma de recebimento
                        <select value={form.formaPagamento} onChange={(e) => aplicarForma(e.target.value)}>
                            {FORMAS_RECEBIMENTO.map((f) => <option key={f}>{f}</option>)}
                        </select>
                    </label>
                    <label>
                        Categoria
                        <select value={form.categoria} onChange={(e) => setCampo("categoria", e.target.value)}>
                            {CATEGORIAS_PAGAMENTO.map((c) => <option key={c}>{c}</option>)}
                        </select>
                    </label>
                    <label>
                        Condição de pagamento
                        <span className="os-preco-row">
                            <input value={form.condicao} onChange={(e) => setCampo("condicao", e.target.value)} placeholder="30,60, 3x ou 15+2x" />
                            <button type="button" className="idx-text" onClick={atualizarParcelas}>atualizar parcelas</button>
                        </span>
                    </label>
                </div>
                <label className="os-check">
                    <input
                        type="checkbox"
                        checked={form.descontoAutomatico}
                        onChange={(e) => setCampo("descontoAutomatico", e.target.checked)}
                    />
                    Aplicar desconto automático da forma de pagamento (Pix 5%, dinheiro 3%)
                </label>
                <p className="os-hint">Líquido: R$ {moeda(liquido)}</p>
                <table className="os-itens">
                    <thead>
                        <tr>
                            <th>Nº</th>
                            <th>Dias</th>
                            <th>Data</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {form.parcelas.map((p, idx) => (
                            <tr key={`p-${idx}`}>
                                <td>{idx + 1}</td>
                                <td>
                                    <input
                                        value={p.dias}
                                        onChange={(e) => setForm((atual) => ({
                                            ...atual,
                                            parcelas: atual.parcelas.map((x, i) => i === idx ? { ...x, dias: e.target.value } : x)
                                        }))}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="date"
                                        value={p.data}
                                        onChange={(e) => setForm((atual) => ({
                                            ...atual,
                                            parcelas: atual.parcelas.map((x, i) => i === idx ? { ...x, data: e.target.value } : x)
                                        }))}
                                    />
                                </td>
                                <td>
                                    <input
                                        value={p.valor}
                                        onChange={(e) => setForm((atual) => ({
                                            ...atual,
                                            parcelas: atual.parcelas.map((x, i) => i === idx ? { ...x, valor: e.target.value } : x)
                                        }))}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="os-item-links">
                    <button
                        type="button"
                        className="idx-text"
                        onClick={() => setForm((atual) => ({ ...atual, parcelas: [...atual.parcelas, parcelaVazia(30)] }))}
                    >
                        <Plus size={14} /> adicionar outra parcela
                    </button>
                    <button type="button" className="idx-text" onClick={lancarCaixa}>
                        <Wallet size={14} /> lançar recebimento no caixa
                    </button>
                    <button
                        type="button"
                        className="idx-text"
                        onClick={() => {
                            setForm((atual) => ({ ...atual, nfsEmitida: true }));
                            navigate(ROTAS.NFS);
                        }}
                    >
                        emitir nota fiscal de serviço
                    </button>
                    <Link className="idx-text" to={`${ROTAS.DASHBOARD}#/vendas`}>ver no dashboard</Link>
                </div>
            </section>

            <section className="os-card">
                <h3>Dados adicionais</h3>
                <label>
                    Campos adicionais para ordens
                    <input value={form.dadosAdicionais} onChange={(e) => setCampo("dadosAdicionais", e.target.value)} />
                </label>
            </section>

            <section className="os-card">
                <h3>Anexos</h3>
                <div className="os-anexos">
                    {form.anexos.map((a, idx) => (
                        <figure key={`${a.nome}-${idx}`}>
                            {String(a.dataUrl || "").startsWith("data:image") ? (
                                <img src={a.dataUrl} alt={a.nome} />
                            ) : (
                                <span>{a.nome}</span>
                            )}
                            <button type="button" onClick={() => setForm((atual) => ({ ...atual, anexos: atual.anexos.filter((_, i) => i !== idx) }))}>
                                <Trash2 size={14} />
                            </button>
                        </figure>
                    ))}
                </div>
                <button type="button" className="idx-text" onClick={() => fileRef.current?.click()}>
                    <Paperclip size={14} /> procurar arquivo
                </button>
                <p className="os-hint">O tamanho do arquivo não deve ultrapassar 2 MB</p>
                <input ref={fileRef} type="file" hidden onChange={(e) => anexar(e.target.files?.[0])} />
            </section>

            <section className="os-card">
                <label>
                    Marcadores
                    <input
                        value={form.marcadores}
                        placeholder="Separados por vírgula ou tab"
                        onChange={(e) => setCampo("marcadores", e.target.value)}
                    />
                </label>
            </section>

            {id ? (
                <section className="os-card">
                    <h3>Histórico de alterações</h3>
                    <HistoricoAuditoria entidade="OS" registroId={id} />
                </section>
            ) : null}

            <div className="os-form-acoes">
                <button type="button" className="prd-btn prd-btn-primary" disabled={salvando} onClick={salvar}>
                    {salvando ? "salvando…" : "salvar"}
                </button>
                <button type="button" className="prd-btn" onClick={() => navigate(ROTAS.ORDEM_SERVICO)}>cancelar</button>
            </div>

            {buscaAvancada ? (
                <div className="os-modal-bg" onClick={() => setBuscaAvancada(false)}>
                    <aside className="os-modal" onClick={(e) => e.stopPropagation()}>
                        <header>
                            <div>
                                <h3>Busca avançada de itens</h3>
                                <p>{produtos.length.toLocaleString("pt-BR")} itens no catálogo · sem limite de 1.000</p>
                            </div>
                            <button type="button" className="os-icon-btn" onClick={() => setBuscaAvancada(false)} aria-label="fechar">
                                <X size={16} />
                            </button>
                        </header>
                        <div className="os-modal-busca">
                            <input
                                autoFocus
                                value={buscaItem}
                                onChange={(e) => setBuscaItem(e.target.value)}
                                placeholder="Nome, SKU, GTIN, grupo ou marca"
                            />
                            <select value={refino} onChange={(e) => setRefino(e.target.value)}>
                                {REFINOS.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                            </select>
                        </div>
                        <div className="os-modal-lista">
                            {avancados.map((p) => (
                                <button key={chaveProduto(p)} type="button" onClick={() => escolherProduto(p)}>
                                    <strong>{p.nome}</strong>
                                    <small>
                                        {p.sku || "sem SKU"} · {p.gtin || "sem GTIN"} · {p.grupo || p.categoria || "sem grupo"} · R$ {moeda(precoPelaLista(p, form.listaPreco))}
                                    </small>
                                </button>
                            ))}
                            {avancados.length === 0 ? <p>Nenhum item encontrado.</p> : null}
                        </div>
                    </aside>
                </div>
            ) : null}
        </div>
    );
}
