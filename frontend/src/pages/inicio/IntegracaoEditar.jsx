import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
    ChevronLeft,
    CloudDownload,
    Link2,
    Package,
    Plug,
    RefreshCw,
    ShoppingBag,
    Shuffle,
    Trash2
} from "lucide-react";

import {
    FORMAS_RECEBIMENTO,
    LANCAMENTOS_ESTOQUE,
    SITUACOES_ERP,
    catalogoPorId,
    ehCanalVenda,
    gravarCfgIntegracao,
    gravarMinhasIntegracoes,
    lerCfgIntegracao,
    lerMinhasIntegracoes,
    padraoCfgIntegracao
} from "../../constants/integracoes";
import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/integracoes.css";

const ABAS_CANAL = [
    { id: "conexao", nome: "Conexão", icon: Plug },
    { id: "produtos", nome: "Produtos", icon: Package },
    { id: "pedidos", nome: "Pedidos", icon: ShoppingBag },
    { id: "mapeamentos", nome: "Mapeamentos", icon: Shuffle }
];

const SUB = {
    produtos: [
        { id: "estoque", nome: "Regras de Estoque" },
        { id: "precos", nome: "Preços" },
        { id: "fluxo", nome: "Fluxo de Produtos" }
    ],
    pedidos: [
        { id: "fluxo", nome: "Fluxo de Pedidos" },
        { id: "fiscais", nome: "Dados Fiscais" },
        { id: "custos", nome: "Custos" },
        { id: "logistica", nome: "Logística do canal" }
    ],
    mapeamentos: [
        { id: "situacoes", nome: "Situações de Pedidos" },
        { id: "recebimento", nome: "Formas de Recebimento" },
        { id: "frete", nome: "Formas de Frete" },
        { id: "categorias", nome: "Categorias" },
        { id: "variacoes", nome: "Variações" }
    ]
};

function Toggle({ checked, onChange, label, hint }) {
    return (
        <label className="int-toggle">
            <span>
                <strong>{label}</strong>
                {hint ? <em>{hint}</em> : null}
            </span>
            <span className="idx-switch">
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <i />
            </span>
        </label>
    );
}

function Campo({ label, hint, children }) {
    return (
        <div className="int-campo">
            <div>
                {label ? <span className="int-label">{label}</span> : null}
                {children}
            </div>
            {hint ? <p className="int-hint">{hint}</p> : null}
        </div>
    );
}

function Radio({ name, value, atual, onChange, label }) {
    return (
        <label className="int-radio">
            <input type="radio" name={name} checked={atual === value} onChange={() => onChange(value)} />
            <span>{label}</span>
        </label>
    );
}

export default function IntegracaoEditar() {
    const { id } = useParams();
    const navigate = useNavigate();
    const meta = catalogoPorId(id);
    const canal = ehCanalVenda(meta);
    const instalada = useMemo(() => lerMinhasIntegracoes().some((item) => item.id === id), [id]);
    const [cfg, setCfg] = useState(() => lerCfgIntegracao(id));
    const [ativa, setAtiva] = useState(() => !!lerMinhasIntegracoes().find((item) => item.id === id)?.ativa);
    const [aba, setAba] = useState("conexao");
    const [sub, setSub] = useState("estoque");
    const [salvo, setSalvo] = useState(false);
    const [painel, setPainel] = useState(null);

    useEffect(() => {
        setCfg(lerCfgIntegracao(id));
        setAtiva(!!lerMinhasIntegracoes().find((item) => item.id === id)?.ativa);
        setAba("conexao");
        setSub("estoque");
        setSalvo(false);
    }, [id]);

    if (!meta || !instalada) {
        return <Navigate to={ROTAS.INTEGRACOES} replace />;
    }

    const abas = canal ? ABAS_CANAL : ABAS_CANAL.filter((item) => item.id === "conexao");
    const conectada = ativa;

    function setCampo(chave, valor) {
        setCfg((atual) => ({ ...atual, [chave]: valor }));
        setSalvo(false);
    }

    function setLista(chave, lista) {
        setCampo(chave, lista);
    }

    function salvar() {
        gravarCfgIntegracao(id, cfg);
        setSalvo(true);
    }

    function alternarConexao() {
        const lista = lerMinhasIntegracoes().map((item) => (
            item.id === id ? { ...item, ativa: !item.ativa } : item
        ));
        gravarMinhasIntegracoes(lista);
        setAtiva(!ativa);
        setPainel(null);
        setSalvo(false);
    }

    const subs = SUB[aba] || [];

    return (
        <div className="int-edit">
            <nav className="dash-crumb" aria-label="Trilha">
                <button type="button" className="int-voltar" onClick={() => navigate(ROTAS.INTEGRACOES)}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <Link to="/index">início</Link>
                <span>›</span>
                <Link to={ROTAS.INTEGRACOES}>integrações</Link>
            </nav>

            <header className="int-edit-head">
                <span className="idx-logo" style={{ background: meta.cor, color: meta.tinta }}>
                    {meta.sigla}
                </span>
                <h2>Integração com {cfg.nome || meta.nome}</h2>
            </header>

            <div className="int-tabs" role="tablist">
                {abas.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={aba === item.id}
                            className={aba === item.id ? "is-active" : ""}
                            onClick={() => {
                                setAba(item.id);
                                setSub((SUB[item.id] || [])[0]?.id || "");
                            }}
                        >
                            <Icon size={16} />
                            {item.nome}
                        </button>
                    );
                })}
            </div>

            <div className={`int-edit-body${subs.length ? " has-sub" : ""}`}>
                {subs.length ? (
                    <nav className="int-sub" aria-label="Seções">
                        {subs.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={sub === item.id ? "is-active" : ""}
                                onClick={() => setSub(item.id)}
                            >
                                {item.nome}
                            </button>
                        ))}
                    </nav>
                ) : null}

                <section className="int-panel">
                    {aba === "conexao" ? (
                        <>
                            <Campo label="Nome da integração no ERP">
                                <input
                                    className="int-input"
                                    value={cfg.nome}
                                    onChange={(e) => setCampo("nome", e.target.value)}
                                />
                            </Campo>
                            <article className="int-status-card">
                                <span className="idx-logo" style={{ background: meta.cor, color: meta.tinta }}>
                                    {meta.sigla}
                                </span>
                                <div>
                                    <strong>{meta.nome}</strong>
                                    <em className={conectada ? "is-on" : "is-off"}>
                                        <i />
                                        {conectada ? "conectada" : "desconectada"}
                                    </em>
                                </div>
                                <button type="button" className="idx-text" onClick={() => setPainel("conexao")}>
                                    gerenciar
                                </button>
                            </article>
                            <p className="int-empty">
                                Ficou com alguma dúvida? Acesse a ajuda sobre a integração.
                            </p>
                        </>
                    ) : null}

                    {aba === "produtos" && sub === "estoque" ? (
                        <>
                            <h3>Regras de Estoque</h3>
                            <p>Defina como o estoque do ERP é enviado para a loja virtual.</p>
                            <Campo
                                label="Atualizar estoque na loja virtual a partir do ERP"
                                hint="O saldo disponível considera o estoque físico menos as reservas de pedidos."
                            >
                                <div className="int-radios">
                                    <Radio name="est" value="nao" atual={cfg.estoqueAtualizar} onChange={(v) => setCampo("estoqueAtualizar", v)} label="Não atualizar" />
                                    <Radio name="est" value="fisico" atual={cfg.estoqueAtualizar} onChange={(v) => setCampo("estoqueAtualizar", v)} label="Enviar saldo físico" />
                                    <Radio name="est" value="disponivel" atual={cfg.estoqueAtualizar} onChange={(v) => setCampo("estoqueAtualizar", v)} label="Enviar saldo disponível" />
                                </div>
                            </Campo>
                            <Campo label="Depósito a ser considerado na integração">
                                <select className="int-input" value={cfg.deposito} onChange={(e) => setCampo("deposito", e.target.value)}>
                                    <option value="todos-proprios">Todos próprios</option>
                                    <option value="geral">Depósito geral</option>
                                    <option value="ecommerce">Depósito e-commerce</option>
                                </select>
                            </Campo>
                            <Campo
                                label="Lançamento de estoque para saídas"
                                hint="Com reserva de estoque habilitada, o lançamento automático ao salvar o pedido não é recomendado."
                            >
                                <select className="int-input" value={cfg.lancamento} onChange={(e) => setCampo("lancamento", e.target.value)}>
                                    {LANCAMENTOS_ESTOQUE.map((item) => (
                                        <option key={item.id} value={item.id}>{item.nome}</option>
                                    ))}
                                </select>
                            </Campo>
                            <Toggle
                                checked={cfg.somarReservado}
                                onChange={(v) => setCampo("somarReservado", v)}
                                label="Ao atualizar o estoque na loja virtual, somar estoque disponível do ERP ao estoque reservado da loja"
                                hint="Usa uma consulta adicional na API. Pode haver diferença de saldo até importar todos os pedidos."
                            />
                            <Toggle
                                checked={cfg.estoqueSeguranca}
                                onChange={(v) => setCampo("estoqueSeguranca", v)}
                                label="Utilizar estoque de segurança"
                            />
                        </>
                    ) : null}

                    {aba === "produtos" && sub === "precos" ? (
                        <>
                            <h3>Preços</h3>
                            <p>Realize as definições das regras para a gestão de preços através do Sistema ERP e garanta mais assertividade na precificação do seu negócio.</p>
                            <Campo label="Regra de utilização de preços para o e-commerce">
                                <div className="int-radios">
                                    <Radio name="preco" value="fixo" atual={cfg.precoRegra} onChange={(v) => setCampo("precoRegra", v)} label="Preço fixo" />
                                    <Radio name="preco" value="lista" atual={cfg.precoRegra} onChange={(v) => setCampo("precoRegra", v)} label="Conforme lista de preços" />
                                    <Radio name="preco" value="regras" atual={cfg.precoRegra} onChange={(v) => setCampo("precoRegra", v)} label="Conforme regras de preço" />
                                </div>
                            </Campo>
                        </>
                    ) : null}

                    {aba === "produtos" && sub === "fluxo" ? (
                        <>
                            <h3>Fluxo de Produtos</h3>
                            <p>Realize as definições para a gestão do envio e recebimento de produtos através do Sistema ERP e assegure o melhor desempenho da sua rotina de operações.</p>
                            <Campo
                                label="Ao importar produtos"
                                hint="Define como as imagens dos anúncios são gravadas no ERP."
                            >
                                <div className="int-radios">
                                    <Radio name="img" value="anexos" atual={cfg.importarImagens} onChange={(v) => setCampo("importarImagens", v)} label="Importar imagens como anexos" />
                                    <Radio name="img" value="url" atual={cfg.importarImagens} onChange={(v) => setCampo("importarImagens", v)} label="Apenas importar a URL externa das imagens" />
                                </div>
                            </Campo>
                            <Toggle
                                checked={cfg.atualizarSku}
                                onChange={(v) => setCampo("atualizarSku", v)}
                                label="Na importação de produtos, ao atualizar um produto, atualizar o Código (SKU)"
                                hint="Atualiza o SKU conforme os dados da integração quando o anúncio usa outro código."
                            />
                            <Toggle
                                checked={cfg.exportarCusto}
                                onChange={(v) => setCampo("exportarCusto", v)}
                                label="Exportar e importar o preço de custo"
                            />
                            {(id === "mercado-livre" || id === "shopee") ? (
                                <Toggle
                                    checked={cfg.enviarVideo !== false}
                                    onChange={(v) => setCampo("enviarVideo", v)}
                                    label="Enviar automaticamente o vídeo do produto no anúncio"
                                    hint="Usa o vídeo cadastrado em Produto → Fotos e vídeos. Sem esse envio, o anúncio no marketplace fica só com as fotos."
                                />
                            ) : null}
                        </>
                    ) : null}

                    {aba === "pedidos" && sub === "fluxo" ? (
                        <>
                            <h3>Fluxo de Pedidos</h3>
                            <Toggle checked={cfg.syncPedidos} onChange={(v) => setCampo("syncPedidos", v)} label="Sincronização automática de pedidos" />
                            <Toggle checked={cfg.importarFrete} onChange={(v) => setCampo("importarFrete", v)} label="Importar valor do frete nos pedidos" hint="Identifica e destaca o custo de frete no pedido de venda." />
                            <Toggle checked={cfg.formatarNomes} onChange={(v) => setCampo("formatarNomes", v)} label="Formatar nome dos contatos no recebimento dos pedidos" hint="Capitaliza nome e sobrenome dos clientes importados." />
                            <Toggle checked={cfg.enderecoObs} onChange={(v) => setCampo("enderecoObs", v)} label="Adicionar o endereço do cliente nas observações da venda" />
                            <Toggle checked={cfg.enviarRastreio} onChange={(v) => setCampo("enviarRastreio", v)} label="Enviar rastreamento ao alterar a situação no ERP para enviado" />
                            <Toggle checked={cfg.marcarEntregue} onChange={(v) => setCampo("marcarEntregue", v)} label="Marcar pedido como entregue ao alterar a situação no ERP" />
                            <Campo label="Intermediador">
                                <select className="int-input" value={cfg.intermediador} onChange={(e) => setCampo("intermediador", e.target.value)}>
                                    <option value="sem">Sem intermediador</option>
                                    <option value="pagseguro">PagSeguro</option>
                                    <option value="mercadopago">Mercado Pago</option>
                                </select>
                            </Campo>
                            <label className="int-check">
                                <input
                                    type="checkbox"
                                    checked={cfg.pagamentoCanal}
                                    onChange={(e) => setCampo("pagamentoCanal", e.target.checked)}
                                />
                                Utilizar valor de pagamento integrado enviado pelo canal de venda (Recomendado)
                            </label>
                            <p className="int-hint">Se o ERP identificar divergência entre a nota e o pagamento integrado, o recebimento será considerado não integrado.</p>
                        </>
                    ) : null}

                    {aba === "pedidos" && sub === "fiscais" ? (
                        <>
                            <h3>Dados Fiscais</h3>
                            <Campo
                                label="Natureza de operação para venda"
                                hint="Determine uma natureza padrão para ser aplicada aos pedidos importados."
                            >
                                <select className="int-input" value={cfg.natureza} onChange={(e) => setCampo("natureza", e.target.value)}>
                                    <option value="nfe-terceiros">(NF-e) Venda de mercadorias de terceiros para consumidor final</option>
                                    <option value="nfce-terceiros">(NFC-e) Venda de mercadorias de terceiros para consumidor final</option>
                                    <option value="nfe-propria">(NF-e) Venda de mercadoria própria</option>
                                </select>
                            </Campo>
                            <Toggle
                                checked={cfg.naturezaIcms}
                                onChange={(v) => setCampo("naturezaIcms", v)}
                                label="Definir natureza de operação diferente para destinatários contribuintes do ICMS"
                            />
                        </>
                    ) : null}

                    {aba === "pedidos" && sub === "custos" ? (
                        <>
                            <h3>Custos</h3>
                            <p>Configure os custos para a integração e custos específicos para cada canal de venda que serão aplicados aos pedidos no módulo de custos do e-commerce.</p>
                            <h4>Custos da minha loja virtual</h4>
                            <p className="int-empty">Comissão cobrada pelos pedidos criados diretamente na minha plataforma.</p>
                            <div className="int-custos">
                                <Campo label="Valor fixo (R$)">
                                    <input className="int-input" value={cfg.custoFixo} onChange={(e) => setCampo("custoFixo", e.target.value)} />
                                </Campo>
                                <span className="int-ou">ou</span>
                                <Campo label="Taxa (%)">
                                    <input className="int-input" value={cfg.custoTaxa} onChange={(e) => setCampo("custoTaxa", e.target.value)} />
                                </Campo>
                            </div>
                            <Campo label="Base de cálculo da comissão">
                                <div className="int-radios">
                                    <Radio name="base" value="total" atual={cfg.baseComissao} onChange={(v) => setCampo("baseComissao", v)} label="Total da venda" />
                                    <Radio name="base" value="sem-frete" atual={cfg.baseComissao} onChange={(v) => setCampo("baseComissao", v)} label="Total da venda sem frete" />
                                </div>
                            </Campo>
                        </>
                    ) : null}

                    {aba === "pedidos" && sub === "logistica" ? (
                        <>
                            <h3>Logística do canal</h3>
                            <p>Defina suas preferências relacionadas à logística própria do canal de venda.</p>
                            <Campo
                                label="Modelo de etiquetas para impressão"
                                hint="Escolha o método de impressão de etiquetas utilizado em sua operação."
                            >
                                <select className="int-input" value={cfg.etiqueta} onChange={(e) => setCampo("etiqueta", e.target.value)}>
                                    <option value="PDF">PDF</option>
                                    <option value="ZPL">ZPL</option>
                                </select>
                            </Campo>
                        </>
                    ) : null}

                    {aba === "mapeamentos" && sub === "situacoes" ? (
                        <>
                            <h3>Situações de Pedidos</h3>
                            <p>Mapeamento entre os códigos de situações no e-commerce com as situações no Sistema ERP.</p>
                            <button
                                type="button"
                                className="idx-text"
                                onClick={() => setLista("situacoes", padraoCfgIntegracao(id).situacoes)}
                            >
                                adicionar situações padrão
                            </button>
                            <Toggle
                                checked={cfg.retrocederSituacao}
                                onChange={(v) => setCampo("retrocederSituacao", v)}
                                label="Permite retroceder situação dos pedidos na sincronização de situações"
                            />
                            <table className="int-table">
                                <thead>
                                    <tr>
                                        <th>Código da situação no E-commerce</th>
                                        <th>Situação no Sistema ERP</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {cfg.situacoes.map((linha, i) => (
                                        <tr key={`${linha.eco}-${i}`}>
                                            <td>
                                                <input
                                                    className="int-input"
                                                    value={linha.eco}
                                                    onChange={(e) => {
                                                        const next = cfg.situacoes.map((item, idx) => idx === i ? { ...item, eco: e.target.value } : item);
                                                        setLista("situacoes", next);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    className="int-input"
                                                    value={linha.erp}
                                                    onChange={(e) => {
                                                        const next = cfg.situacoes.map((item, idx) => idx === i ? { ...item, erp: e.target.value } : item);
                                                        setLista("situacoes", next);
                                                    }}
                                                >
                                                    {SITUACOES_ERP.map((op) => <option key={op}>{op}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <button type="button" className="idx-more" aria-label="Remover" onClick={() => setLista("situacoes", cfg.situacoes.filter((_, idx) => idx !== i))}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button type="button" className="idx-text" onClick={() => setLista("situacoes", [...cfg.situacoes, { eco: "", erp: "Aberto" }])}>
                                + adicionar
                            </button>
                        </>
                    ) : null}

                    {aba === "mapeamentos" && sub === "recebimento" ? (
                        <>
                            <h3>Formas de Recebimento</h3>
                            <p>Esse mapeamento é necessário para o ERP identificar e preencher automaticamente a forma de recebimento nas vendas importadas.</p>
                            <Toggle
                                checked={cfg.importarRecebimento}
                                onChange={(v) => setCampo("importarRecebimento", v)}
                                label="Importar forma de recebimento nos pedidos"
                            />
                            <div className="int-custos">
                                <Campo label="Forma de recebimento padrão">
                                    <select className="int-input" value={cfg.formaPadrao} onChange={(e) => setCampo("formaPadrao", e.target.value)}>
                                        {FORMAS_RECEBIMENTO.map((op) => <option key={op}>{op}</option>)}
                                    </select>
                                </Campo>
                                <Campo label="Categoria financeira padrão dos pedidos">
                                    <select className="int-input" value={cfg.categoriaFinanceira} onChange={(e) => setCampo("categoriaFinanceira", e.target.value)}>
                                        <option>Receita</option>
                                        <option>Vendas e-commerce</option>
                                        <option>Marketplace</option>
                                    </select>
                                </Campo>
                            </div>
                            <table className="int-table">
                                <thead>
                                    <tr>
                                        <th>Forma de recebimento</th>
                                        <th>Meio de recebimento</th>
                                        <th>Código na integração</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {cfg.recebimentos.map((linha, i) => (
                                        <tr key={`${linha.codigo}-${i}`}>
                                            <td>
                                                <select className="int-input" value={linha.forma} onChange={(e) => {
                                                    const next = cfg.recebimentos.map((item, idx) => idx === i ? { ...item, forma: e.target.value } : item);
                                                    setLista("recebimentos", next);
                                                }}>
                                                    {FORMAS_RECEBIMENTO.filter((op) => op !== "Não definida").map((op) => <option key={op}>{op}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <input className="int-input" value={`${linha.meio}${linha.detalhe ? `: ${linha.detalhe}` : ""}`} onChange={(e) => {
                                                    const [meio, detalhe = ""] = e.target.value.split(":").map((p) => p.trim());
                                                    const next = cfg.recebimentos.map((item, idx) => idx === i ? { ...item, meio, detalhe } : item);
                                                    setLista("recebimentos", next);
                                                }} />
                                            </td>
                                            <td>
                                                <input className="int-input" value={linha.codigo} onChange={(e) => {
                                                    const next = cfg.recebimentos.map((item, idx) => idx === i ? { ...item, codigo: e.target.value } : item);
                                                    setLista("recebimentos", next);
                                                }} />
                                            </td>
                                            <td>
                                                <button type="button" className="idx-more" aria-label="Remover" onClick={() => setLista("recebimentos", cfg.recebimentos.filter((_, idx) => idx !== i))}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button type="button" className="idx-text" onClick={() => setLista("recebimentos", [...cfg.recebimentos, { forma: "Pix", meio: "Banco", detalhe: "", codigo: "" }])}>
                                + adicionar forma de recebimento
                            </button>
                        </>
                    ) : null}

                    {aba === "mapeamentos" && sub === "frete" ? (
                        <>
                            <h3>Formas de Frete</h3>
                            <p>Esse mapeamento é necessário para o ERP identificar e preencher automaticamente a forma de frete nas vendas importadas.</p>
                            <table className="int-table">
                                <thead>
                                    <tr>
                                        <th>Forma de envio</th>
                                        <th>Forma de frete</th>
                                        <th>Código na integração</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {cfg.fretes.map((linha, i) => (
                                        <tr key={`${linha.codigo}-${i}`}>
                                            <td><input className="int-input" value={linha.envio} onChange={(e) => setLista("fretes", cfg.fretes.map((item, idx) => idx === i ? { ...item, envio: e.target.value } : item))} /></td>
                                            <td><input className="int-input" value={linha.frete} onChange={(e) => setLista("fretes", cfg.fretes.map((item, idx) => idx === i ? { ...item, frete: e.target.value } : item))} /></td>
                                            <td><input className="int-input" value={linha.codigo} onChange={(e) => setLista("fretes", cfg.fretes.map((item, idx) => idx === i ? { ...item, codigo: e.target.value } : item))} /></td>
                                            <td>
                                                <button type="button" className="idx-more" onClick={() => setLista("fretes", cfg.fretes.filter((_, idx) => idx !== i))}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button type="button" className="idx-text" onClick={() => setLista("fretes", [...cfg.fretes, { envio: "", frete: "Correios PAC", codigo: "" }])}>
                                + adicionar
                            </button>
                        </>
                    ) : null}

                    {aba === "mapeamentos" && sub === "categorias" ? (
                        <>
                            <h3>Categorias</h3>
                            <p>Realize o mapeamento entre os códigos de categorias no e-commerce com as respectivas categorias no ERP.</p>
                            <button type="button" className="idx-pill int-add" onClick={() => setLista("categorias", [...cfg.categorias])}>
                                <CloudDownload size={14} />
                                Importar categorias do e-commerce
                            </button>
                            <table className="int-table">
                                <thead>
                                    <tr>
                                        <th>Categoria no Sistema ERP</th>
                                        <th>Código da categoria no E-commerce</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {cfg.categorias.map((linha, i) => (
                                        <tr key={`${linha.erp}-${i}`}>
                                            <td>{linha.erp}</td>
                                            <td>
                                                <input className="int-input" value={linha.eco} onChange={(e) => setLista("categorias", cfg.categorias.map((item, idx) => idx === i ? { ...item, eco: e.target.value } : item))} />
                                            </td>
                                            <td>
                                                <Link2 size={14} />
                                                <button type="button" className="idx-more" onClick={() => setLista("categorias", cfg.categorias.filter((_, idx) => idx !== i))}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    ) : null}

                    {aba === "mapeamentos" && sub === "variacoes" ? (
                        <>
                            <h3>Variações</h3>
                            <p>Selecione a variação que seus produtos devem ser vinculados ao serem sincronizados com o e-commerce.</p>
                            <button type="button" className="idx-pill int-add" onClick={() => {
                                setLista("variacoes", cfg.variacoes.map((item) => (
                                    item.valorEco ? item : { ...item, chaveEco: item.chaveErp, valorEco: item.valorErp }
                                )));
                            }}>
                                <RefreshCw size={14} />
                                relacionar valores pelo nome
                            </button>
                            <table className="int-table">
                                <thead>
                                    <tr>
                                        <th>Chave no Sistema ERP</th>
                                        <th>Chave no e-commerce</th>
                                        <th>Valor no Sistema ERP</th>
                                        <th>Valor no e-commerce</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cfg.variacoes.map((linha, i) => (
                                        <tr key={`${linha.valorErp}-${i}`}>
                                            <td>{linha.chaveErp}</td>
                                            <td>
                                                <select className="int-input" value={linha.chaveEco} onChange={(e) => setLista("variacoes", cfg.variacoes.map((item, idx) => idx === i ? { ...item, chaveEco: e.target.value } : item))}>
                                                    <option>Quantidade</option>
                                                    <option>Cor</option>
                                                    <option>Tamanho</option>
                                                </select>
                                            </td>
                                            <td>{linha.valorErp}</td>
                                            <td>
                                                <select className="int-input" value={linha.valorEco} onChange={(e) => setLista("variacoes", cfg.variacoes.map((item, idx) => idx === i ? { ...item, valorEco: e.target.value } : item))}>
                                                    <option value="">Selecione</option>
                                                    <option>500 unid.</option>
                                                    <option>1000unid</option>
                                                    <option>10 unid.</option>
                                                    <option>25 unid.</option>
                                                    <option>100 unid.</option>
                                                    <option>01 Unid.</option>
                                                    <option>05 Unid.</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    ) : null}
                </section>
            </div>

            <footer className="int-save">
                {salvo ? <span>Configurações salvas.</span> : <span />}
                <button type="button" className="idx-pill int-add" onClick={salvar}>salvar</button>
            </footer>

            {painel === "conexao" ? (
                <aside className="int-drawer" aria-label="Gerenciar conexão">
                    <header>
                        <h3>{meta.nome}</h3>
                        <button type="button" className="idx-text" onClick={() => setPainel(null)}>fechar x</button>
                    </header>
                    <p>{conectada ? "A loja está conectada ao ERP." : "A loja está desconectada."}</p>
                    <div className="idx-drawer-actions">
                        <button type="button" className="idx-pill" onClick={alternarConexao}>
                            {conectada ? "desconectar" : "reconectar"}
                        </button>
                    </div>
                </aside>
            ) : null}
        </div>
    );
}

