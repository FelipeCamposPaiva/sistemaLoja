import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronLeft } from "lucide-react";

import { ESTADOS } from "../../constants/contatos";
import {
    INTEGRACOES,
    STATUS,
    formatarData,
    formatarMoeda,
    formatarPreco,
    formatarQtd,
    gravarNotas,
    lerNotas,
    notaVazia,
    parseXmlNota,
    proximoId
} from "../../constants/notasEntrada";
import ROTAS from "../../constants/rotas";
import { registrarAuditoria } from "../../services/auditoria.service";
import HistoricoAuditoria from "../../components/HistoricoAuditoria";
import ModalDataEstoqueNf from "../../components/ModalDataEstoqueNf";
import {
    aplicarEstoqueNaNota,
    estornarNotaEntrada,
    lancarEstoqueNotaEntrada
} from "../../services/notasEntrada.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/notas-entrada.css";

function traco(valor) {
    const t = String(valor ?? "").trim();
    return t ? t : "—";
}

function Campo({ rotulo, valor, span }) {
    return (
        <div className={`nfe-campo${span ? ` span-${span}` : ""}`}>
            <span>{rotulo}</span>
            <strong>{traco(valor)}</strong>
        </div>
    );
}

function foneFmt(valor) {
    const d = String(valor || "").replace(/\D/g, "");
    if (d.length === 10) {
        return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    }
    if (d.length === 11) {
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }
    return valor || "";
}

export default function NotaEntradaForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const nova = !id || id === "nova";
    const [lista, setLista] = useState(lerNotas);
    const existente = !nova ? lista.find((n) => String(n.id) === String(id)) : null;
    const [form, setForm] = useState(() => existente || notaVazia());
    const [aba, setAba] = useState("produtos");
    const [pagAba, setPagAba] = useState("parcelas");
    const [aberto, setAberto] = useState(null);
    const [aviso, setAviso] = useState("");
    const [modalEstoque, setModalEstoque] = useState(false);
    const [trabalhando, setTrabalhando] = useState(false);

    useEffect(() => {
        if (existente) {
            setForm(existente);
        }
    }, [existente]);

    useEffect(() => {
        if (!existente?.chave || existente.itens?.some((item) => item.cfop)) {
            return;
        }
        fetch(`/data/nfe/${existente.chave}-nfe.xml`)
            .then((resp) => (resp.ok ? resp.text() : null))
            .then((texto) => {
                if (!texto) {
                    return;
                }
                const parsed = parseXmlNota(texto);
                setLista((atual) => {
                    const proxima = atual.map((n) => (String(n.id) === String(id) ? { ...n, ...parsed, id: n.id } : n));
                    gravarNotas(proxima);
                    return proxima;
                });
                setForm((atual) => ({ ...atual, ...parsed, id: existente.id }));
            })
            .catch(() => {});
    }, [existente, id]);

    const lancada = Boolean(existente && existente.status !== "pendente" && (existente.integracoes || []).length);
    const estoqueLancado = (form.integracoes || []).includes("E");
    const itens = form.itens || [];
    const totais = form.totais || {};
    const emitente = form.emitente || {};
    const transporte = form.transporte || {};
    const pagamento = form.pagamento || {};
    const duplicatas = form.duplicatas || [];
    const statusInfo = STATUS.find((s) => s.id === form.status);

    const somaItens = useMemo(
        () => itens.reduce((s, i) => s + Number(i.total || i.qtd * i.preco || 0), 0),
        [itens]
    );

    if (!nova && !existente) {
        return (
            <div className="nfe-page">
                <p>Nota não encontrada.</p>
                <Link to={`${ROTAS.NOTAS_ENTRADA}#list`}>voltar</Link>
            </div>
        );
    }

    function setCampo(chave, valor) {
        setForm((atual) => ({ ...atual, [chave]: valor }));
    }

    function salvar() {
        if (!String(form.numero || "").trim() || !String(form.remetente || "").trim()) {
            setAviso("Informe número e remetente.");
            return;
        }
        const atual = lerNotas();
        const registro = {
            ...form,
            numero: String(form.numero).trim(),
            remetente: form.remetente.trim(),
            valor: Number(String(form.valor).replace(",", ".")) || 0,
            marcadores: form.marcadores || []
        };
        const registroId = existente ? existente.id : proximoId(atual);
        if (existente) {
            gravarNotas(atual.map((n) => (String(n.id) === String(id) ? { ...registro, id: existente.id } : n)));
        } else {
            gravarNotas([{ ...registro, id: registroId, status: "pendente" }, ...atual]);
        }
        registrarAuditoria({
            entidade: "NOTA",
            registroId,
            registroNome: `NF ${registro.numero}`,
            acao: existente ? "ALTERAR" : "CRIAR",
            resumo: existente ? "nota de entrada atualizada" : "nota de entrada cadastrada"
        }).catch(() => null);
        navigate(`${ROTAS.NOTAS_ENTRADA}#list`);
    }

    async function estornar() {
        if (form.backendId) {
            try {
                await estornarNotaEntrada(form.backendId);
            } catch {
                /* local segue */
            }
        }
        setLista((atual) => {
            const proxima = atual.map((n) => (
                String(n.id) === String(id) ? { ...n, integracoes: [], status: "pendente" } : n
            ));
            gravarNotas(proxima);
            return proxima;
        });
        setForm((atual) => ({ ...atual, integracoes: [], status: "pendente" }));
        setAviso("Contas e estoque estornados de uma vez. A nota pode ser editada.");
    }

    async function confirmarDataEstoque(opcoes) {
        setTrabalhando(true);
        try {
            const resultado = await lancarEstoqueNotaEntrada(form, opcoes);
            const atualizado = aplicarEstoqueNaNota(form, resultado);
            setForm(atualizado);
            setLista((atual) => {
                const proxima = atual.map((n) => (String(n.id) === String(id) ? { ...n, ...atualizado, id: n.id } : n));
                gravarNotas(proxima);
                return proxima;
            });
            registrarAuditoria({
                entidade: "NOTA",
                registroId: existente?.id || form.id,
                registroNome: `NF ${form.numero}`,
                acao: "ALTERAR",
                resumo: `estoque lançado em ${resultado.dataEstoque} (${resultado.modoDataEstoque})`
            }).catch(() => null);
            setAviso(`Estoque de todos os itens lançado em ${formatarData(resultado.dataEstoque)}.`);
        } finally {
            setModalEstoque(false);
            setTrabalhando(false);
        }
    }

    return (
        <div className="nfe-page nfe-ficha">
            <nav className="dash-crumb" aria-label="Trilha">
                <button type="button" className="int-voltar" onClick={() => navigate(`${ROTAS.NOTAS_ENTRADA}#list`)}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <span>suprimentos</span>
                <span>›</span>
                <Link to={`${ROTAS.NOTAS_ENTRADA}#list`}>notas de entrada</Link>
            </nav>

            <div className="nfe-ficha-top">
                <div>
                    <h2>Nota fiscal</h2>
                    <div className="nfe-ficha-meta">
                        {(form.integracoes || []).map((cod) => {
                            const info = INTEGRACOES[cod];
                            if (!info) {
                                return null;
                            }
                            return (
                                <span key={cod} className="nfe-int" title={info.nome} style={{ background: info.cor }}>
                                    {info.letra}
                                </span>
                            );
                        })}
                        {statusInfo ? (
                            <span className="nfe-sit">
                                {statusInfo.cor ? <i className="nfe-dot" style={{ background: statusInfo.cor }} /> : null}
                                {statusInfo.nome.replace(/s$/, "")}
                            </span>
                        ) : null}
                    </div>
                </div>
                <div className="nfe-acoes">
                    {existente ? (
                        <button type="button" className="prd-btn prd-btn-primary" disabled={trabalhando} onClick={() => setModalEstoque(true)}>
                            {estoqueLancado ? "corrigir data do estoque" : "lançar estoque"}
                        </button>
                    ) : null}
                    {existente ? (
                        <button type="button" className="prd-btn" onClick={() => setAviso("Manifestação registrada como ciência da emissão.")}>
                            manifestação
                        </button>
                    ) : null}
                    <div className="ctt-drop">
                        <button type="button" className={`prd-btn${aberto === "mais" ? " is-on" : ""}`} onClick={() => setAberto(aberto === "mais" ? null : "mais")}>
                            mais ações
                            <ChevronDown size={14} />
                        </button>
                        {aberto === "mais" ? (
                            <div className="ctt-menu is-right">
                                <button type="button" onClick={() => { window.print(); setAberto(null); }}>imprimir DANFE</button>
                                <button type="button" onClick={() => { navigate("/entrada_de_mercadorias"); setAberto(null); }}>conferir compra</button>
                                {existente ? (
                                    <button type="button" onClick={() => { estornar(); setAberto(null); }}>estornar contas e estoque</button>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                    {nova || !lancada ? (
                        <button type="button" className="prd-btn prd-btn-primary" onClick={salvar}>salvar</button>
                    ) : null}
                </div>
            </div>

            {aviso ? <p className="nfe-aviso">{aviso}</p> : null}

            {lancada ? (
                <div className="nfe-alerta">
                    <span className="nfe-alerta-ico">!</span>
                    <div>
                        <strong>Edição desabilitada</strong>
                        <p>Não é possível editar notas fiscais que possuem contas lançadas e estoque lançado.</p>
                        <button type="button" className="idx-text" onClick={estornar}>estornar contas e estoque para editar</button>
                    </div>
                </div>
            ) : null}

            {nova ? (
                <div className="ctt-grid">
                    <label className="span-3">
                        Número
                        <input value={form.numero} onChange={(e) => setCampo("numero", e.target.value)} />
                    </label>
                    <label className="span-2">
                        Série
                        <input value={form.serie} onChange={(e) => setCampo("serie", e.target.value)} />
                    </label>
                    <label className="span-3">
                        Data de emissão
                        <input type="date" value={form.dataEmissao} onChange={(e) => setCampo("dataEmissao", e.target.value)} />
                    </label>
                    <label className="span-4">
                        Data de entrada
                        <input type="date" value={form.dataEntrada} onChange={(e) => setCampo("dataEntrada", e.target.value)} />
                    </label>
                    <label className="span-8">
                        Remetente
                        <input value={form.remetente} onChange={(e) => setCampo("remetente", e.target.value)} />
                    </label>
                    <label className="span-4">
                        UF
                        <select value={form.uf} onChange={(e) => setCampo("uf", e.target.value)}>
                            {ESTADOS.map((uf) => (
                                <option key={uf} value={uf}>{uf}</option>
                            ))}
                        </select>
                    </label>
                    <label className="span-4">
                        CNPJ
                        <input value={form.cnpj} onChange={(e) => setCampo("cnpj", e.target.value)} />
                    </label>
                    <label className="span-4">
                        Valor (R$)
                        <input value={form.valor} onChange={(e) => setCampo("valor", e.target.value)} />
                    </label>
                    <label className="span-12">
                        Natureza da operação
                        <input value={form.natureza} onChange={(e) => setCampo("natureza", e.target.value)} />
                    </label>
                    <label className="span-12">
                        Observações
                        <textarea rows={3} value={form.observacao} onChange={(e) => setCampo("observacao", e.target.value)} />
                    </label>
                </div>
            ) : (
                <>
                    <div className="nfe-campos">
                        <Campo rotulo="Tipo de Entrada" valor={form.tipoEntrada || (form.xml ? "XML de NFe" : "Manual")} />
                        <Campo rotulo="Série" valor={form.serie} />
                        <Campo rotulo="Número" valor={form.numero} />
                        <Campo rotulo="Data emissão" valor={formatarData(form.dataEmissao)} />
                        <Campo rotulo="Hora emissão" valor={form.horaEmissao || "00:00:00"} />
                        <Campo rotulo="Natureza da operação" valor={form.natureza} span={4} />
                        {lancada ? (
                            <Campo rotulo="Data entrada" valor={formatarData(form.dataEntrada)} />
                        ) : (
                            <div className="nfe-campo">
                                <span>Data entrada</span>
                                <input type="date" value={form.dataEntrada || ""} onChange={(e) => setCampo("dataEntrada", e.target.value)} />
                            </div>
                        )}
                        <Campo rotulo="Data do estoque" valor={form.dataEstoque ? formatarData(form.dataEstoque) : (estoqueLancado ? formatarData(form.dataEntrada) : "ainda não lançado")} />
                        <Campo rotulo="Hora entrada" valor={form.horaEntrada || form.horaEmissao || "00:00:00"} />
                        <Campo rotulo="Finalidade" valor={form.finalidade || "NF-e normal"} />
                        <Campo rotulo="Código de regime tributário" valor={form.regime || "Regime normal"} />
                        <Campo rotulo="Consumidor final" valor={form.consumidorFinal || "Não"} />
                        <Campo rotulo="Intermediador" valor={form.intermediador || "Sem intermediador"} />
                    </div>

                    <h3>Remetente</h3>
                    <div className="nfe-campos">
                        <div className="nfe-campo span-12">
                            <span>Nome</span>
                            <strong className="nfe-link">{traco(emitente.nome || form.remetente)}</strong>
                            <button type="button" className="idx-text" onClick={() => navigate("/clientes-e-fornecedores")}>
                                ver últimas compras
                            </button>
                        </div>
                        <Campo rotulo="Tipo de pessoa" valor={emitente.tipoPessoa || "Jurídica"} />
                        <Campo rotulo="Contribuinte" valor={emitente.contribuinte || "Não informado"} />
                        <Campo rotulo="CNPJ" valor={emitente.cnpj || form.cnpj} />
                        <Campo rotulo="Insc. Estadual" valor={emitente.ie} />
                        <Campo rotulo="CEP" valor={emitente.cep} />
                        <Campo rotulo="Cidade" valor={emitente.cidade} />
                        <Campo rotulo="UF" valor={emitente.uf || form.uf} />
                        <Campo rotulo="Endereço" valor={emitente.endereco} span={4} />
                        <Campo rotulo="Bairro" valor={emitente.bairro} />
                        <Campo rotulo="Número" valor={emitente.numero} />
                        <Campo rotulo="Complemento" valor={emitente.complemento} />
                        <Campo rotulo="Fone / Fax" valor={foneFmt(emitente.fone)} />
                    </div>

                    <div className="nfe-tabs">
                        <button type="button" className={aba === "produtos" ? "is-active" : ""} onClick={() => setAba("produtos")}>
                            Produtos ou serviços
                        </button>
                        <button type="button" className={aba === "impostos" ? "is-active" : ""} onClick={() => setAba("impostos")}>
                            Impostos
                        </button>
                    </div>

                    {aba === "produtos" ? (
                        <table className="fer-table nfe-itens">
                            <thead>
                                <tr>
                                    <th>Nº</th>
                                    <th>Descrição</th>
                                    <th>Código (SKU)</th>
                                    <th>Un</th>
                                    <th>Qtde</th>
                                    <th>Preço un</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itens.length ? itens.map((item) => (
                                    <tr key={item.nItem || item.id}>
                                        <td>{item.nItem}</td>
                                        <td>{item.nome}</td>
                                        <td>{traco(item.sku)}</td>
                                        <td>{item.unidade || "UN"}</td>
                                        <td>{formatarQtd(item.qtd)}</td>
                                        <td>{formatarPreco(item.preco || item.custo)}</td>
                                        <td>{formatarMoeda(item.total || (item.qtd * (item.preco || item.custo || 0)))}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="ctt-vazio">Nenhum item nesta nota.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="fer-table nfe-itens">
                            <thead>
                                <tr>
                                    <th>Nº</th>
                                    <th>Descrição</th>
                                    <th>Código (SKU)</th>
                                    <th>CFOP</th>
                                    <th>ST</th>
                                    <th>ICMS %</th>
                                    <th>ICMS R$</th>
                                    <th>IPI %</th>
                                    <th>IPI R$</th>
                                    <th>COFINS</th>
                                    <th>PIS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itens.length ? itens.map((item) => (
                                    <tr key={`imp-${item.nItem || item.id}`}>
                                        <td>{item.nItem}</td>
                                        <td>{item.nome}</td>
                                        <td>{traco(item.sku)}</td>
                                        <td>{traco(item.cfop)}</td>
                                        <td>{traco(item.cst)}</td>
                                        <td>{formatarPreco(item.pIcms, 4)}</td>
                                        <td>{formatarMoeda(item.vIcms)}</td>
                                        <td>{formatarPreco(item.pIpi, 4)}</td>
                                        <td>{formatarMoeda(item.vIpi)}</td>
                                        <td>{formatarMoeda(item.vCofins)}</td>
                                        <td>{formatarMoeda(item.vPis)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={11} className="ctt-vazio">Nenhum imposto informado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    <h3>Cálculo do imposto</h3>
                    <div className="nfe-impostos">
                        <Campo rotulo="Total Produtos" valor={`R$ ${formatarMoeda(totais.vProd || somaItens)}`} />
                        <Campo rotulo="Total Serviços" valor="R$ 0,00" />
                        <Campo rotulo="Valor do Frete" valor={`R$ ${formatarMoeda(totais.vFrete)}`} />
                        <Campo rotulo="Valor do Seguro" valor={`R$ ${formatarMoeda(totais.vSeg)}`} />
                        <Campo rotulo="Base ICMS" valor={`R$ ${formatarMoeda(totais.vBC)}`} />
                        <Campo rotulo="Valor ICMS" valor={`R$ ${formatarMoeda(totais.vICMS)}`} />
                        <Campo rotulo="Base ICMS ST" valor={`R$ ${formatarMoeda(totais.vBCST)}`} />
                        <Campo rotulo="Valor ICMS ST" valor={`R$ ${formatarMoeda(totais.vST)}`} />
                        <Campo rotulo="Valor IPI" valor={`R$ ${formatarMoeda(totais.vIPI)}`} />
                        <Campo rotulo="Valor ISSQN" valor="R$ 0,00" />
                        <Campo rotulo="Despesas" valor={`R$ ${formatarMoeda(totais.vOutro)}`} />
                        <Campo rotulo="Desconto" valor={`R$ ${formatarMoeda(totais.vDesc)}`} />
                        <Campo rotulo="Valor Funrural" valor="R$ 0,00" />
                        <Campo rotulo="Nº Itens" valor={String(totais.nItens || itens.length || 0)} />
                        <Campo rotulo="Valor aprox. imp." valor="R$ 0,00" />
                        <Campo rotulo="Total do FCP" valor={`R$ ${formatarMoeda(totais.vFCP)}`} />
                        <Campo rotulo="Total do FCP ST" valor={`R$ ${formatarMoeda(totais.vFCPST)}`} />
                        <Campo rotulo="Total FCP ST Ret anteriormente" valor={`R$ ${formatarMoeda(totais.vFCPSTRet)}`} />
                        <Campo rotulo="Total da Nota" valor={`R$ ${formatarMoeda(totais.vNF || form.valor)}`} />
                    </div>

                    <h3>Transportador / Volumes</h3>
                    <p className="nfe-frete">{traco(transporte.frete)}</p>
                    <div className="nfe-campos">
                        <Campo rotulo="Nome" valor={transporte.nome} span={4} />
                        <Campo rotulo="CNPJ/CPF" valor={transporte.cnpj} />
                        <Campo rotulo="Insc. Estadual" valor={transporte.ie} />
                        <Campo rotulo="Endereço" valor={transporte.endereco} span={4} />
                        <Campo rotulo="Município" valor={transporte.municipio} />
                        <Campo rotulo="UF" valor={transporte.uf} />
                        <Campo rotulo="Qtde Volumes" valor={transporte.qVol} />
                        <Campo rotulo="Espécie" valor={transporte.especie} />
                        <Campo rotulo="Número" valor={transporte.nVol} />
                        <Campo rotulo="Peso Bruto" valor={transporte.pesoB ? formatarQtd(transporte.pesoB, 3) : "0,000"} />
                        <Campo rotulo="Peso Líquido" valor={transporte.pesoL ? formatarQtd(transporte.pesoL, 3) : "0,000"} />
                    </div>

                    <h3>Pagamento</h3>
                    <div className="nfe-campos">
                        <Campo rotulo="Condição de pagamento" valor={pagamento.condicao} />
                        <Campo rotulo="Categoria" valor={pagamento.categoria || "Compras"} />
                    </div>
                    <div className="nfe-tabs">
                        <button type="button" className={pagAba === "parcelas" ? "is-active" : ""} onClick={() => setPagAba("parcelas")}>
                            parcelas
                        </button>
                        <button type="button" className={pagAba === "obs" ? "is-active" : ""} onClick={() => setPagAba("obs")}>
                            observações das parcelas
                        </button>
                    </div>
                    {pagAba === "parcelas" ? (
                        <table className="fer-table nfe-itens">
                            <thead>
                                <tr>
                                    <th>Nº</th>
                                    <th>Dias</th>
                                    <th>Data</th>
                                    <th>Valor</th>
                                    <th>Enviar para</th>
                                    <th>Meio de Pagamento da NFe</th>
                                </tr>
                            </thead>
                            <tbody>
                                {duplicatas.length ? duplicatas.map((dup, i) => (
                                    <tr key={dup.numero || i}>
                                        <td>{dup.numero || i + 1}</td>
                                        <td>{dup.dias}</td>
                                        <td>{formatarData(dup.vencimento)}</td>
                                        <td>{formatarMoeda(dup.valor)}</td>
                                        <td>{pagamento.destino || "Contas a Pagar"}</td>
                                        <td>{pagamento.meio || "Boleto Bancário"}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="ctt-vazio">Nenhuma parcela lançada.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <p className="nfe-hint">Sem observações nas parcelas.</p>
                    )}

                    <h3>Dados adicionais</h3>
                    <div className="nfe-campos">
                        <Campo rotulo="Depósito" valor="Estoque em Trânsito" />
                    </div>
                    <div className="nfe-obs">
                        <span>Observações</span>
                        <p>{traco(form.observacao)}</p>
                        <span>Observações do sistema</span>
                        <p>—</p>
                        <span>Informações no fisco</span>
                        <p>{traco(form.infFisco)}</p>
                    </div>
                    {!nova ? (
                        <>
                            <h3>Histórico de alterações</h3>
                            <HistoricoAuditoria entidade="NOTA" registroId={id} />
                        </>
                    ) : null}
                </>
            )}

            {modalEstoque ? (
                <ModalDataEstoqueNf
                    nota={form}
                    trabalhando={trabalhando}
                    onCancel={() => setModalEstoque(false)}
                    onConfirm={confirmarDataEstoque}
                />
            ) : null}
        </div>
    );
}
