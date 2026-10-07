import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowUp,
    Check,
    Download,
    File,
    FileSpreadsheet,
    Lightbulb,
    RefreshCw,
    Trash2,
    Upload,
    Users,
    X
} from "lucide-react";

import { agregarItensNfe, parseXmlNota } from "../../constants/notasEntrada";
import { importarProdutosLote } from "../../services/produto.service";
import { lerPlanilhaProdutos, mesclarLeituras } from "../../services/produtoImport.service";

import "../../styles/pages/produtos.css";

const ACEITOS = ".xls,.xlsx,.csv,.xml,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/xml,application/xml";
const MAX_MB = 10;

function tipoArquivo(arquivo) {
    const nome = String(arquivo?.name || "").toLowerCase();
    if (nome.endsWith(".xml")) {
        return "xml";
    }
    if (/\.(xls|xlsx|csv)$/.test(nome)) {
        return "excel";
    }
    return "outro";
}

function chaveArquivo(arquivo) {
    return `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`;
}

function itensDoXml(parsed) {
    return agregarItensNfe(parsed.itens || []).map((item) => ({
        sku: item.sku || item.gtin || "",
        codigoBarras: item.gtin || "",
        nome: item.nome,
        unidade: item.unidade || "UN",
        ncm: item.ncm || "",
        cest: item.cest || "",
        categoria: item.categoria || item.grupo || "",
        custo: Number(item.custo || item.preco || 0),
        estoque: Number(item.estoque ?? item.qtd ?? 0),
        preco: Number(item.preco || item.custo || 0),
        ativo: true
    })).filter((p) => p.nome);
}

function ordenarEntradas(lista) {
    return [...lista].sort((a, b) => a.arquivo.name.localeCompare(b.arquivo.name, "pt-BR", { numeric: true }));
}

function formatarTamanho(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) {
        return `${n} B`;
    }
    if (n < 1024 * 1024) {
        return `${Math.max(1, Math.round(n / 1024)).toLocaleString("pt-BR")} KB`;
    }
    return `${(n / (1024 * 1024)).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`;
}

function textoNumero(valor) {
    if (valor == null || Number.isNaN(Number(valor))) {
        return "—";
    }
    return Number(valor).toLocaleString("pt-BR");
}

export default function ImportadorMassa({
    aberto,
    ocupado,
    onFechar,
    onConcluido,
    titulo = "Importador em massa",
    descricao = "Selecione uma ou mais planilhas (.xls/.xlsx) de uma vez.",
    aceitos = ACEITOS,
    formatosTexto = "",
    permitirXml = true,
    maxMb = MAX_MB,
    rotuloItem = "produtos",
    rotuloArquivo = "arquivo",
    textoVazio = "",
    avisoErro = "",
    dicas = null,
    onBaixarModelo = null,
    classificar = null,
    lerExcel = lerPlanilhaProdutos,
    mesclar = mesclarLeituras,
    importarLote = importarProdutosLote
}) {
    const inputRef = useRef(null);
    const entradasRef = useRef([]);
    const classificarRef = useRef(classificar);
    classificarRef.current = classificar;
    const [entradas, setEntradas] = useState([]);
    const [arrastando, setArrastando] = useState(false);
    const [rodando, setRodando] = useState(false);
    const [progresso, setProgresso] = useState(null);
    const [resultado, setResultado] = useState(null);
    const [previsao, setPrevisao] = useState(null);
    const [detalhes, setDetalhes] = useState(false);

    const formatos = formatosTexto || (permitirXml ? ".xls, .xlsx, .csv, .xml" : ".xls, .xlsx, .csv");
    const dicasVisiveis = dicas || [
        `Utilize arquivos do Excel (.xls ou .xlsx)${permitirXml ? " ou XML de NF-e" : ""}`,
        "A primeira linha da planilha deve ser o cabeçalho",
        `Cada arquivo é conferido antes de gravar os ${rotuloItem}`,
        "Linhas sem identificação válida ficam de fora da importação",
        "Registros duplicados são unidos antes de gravar"
    ];
    const vazioLabel = textoVazio || `Sem ${rotuloItem} válidos`;
    const aviso = avisoErro || `Os ${rotuloItem} com erro não serão importados. Você pode corrigir a planilha e tentar novamente.`;
    const feminino = /a$/i.test(rotuloArquivo);

    useEffect(() => {
        if (aberto) {
            return;
        }
        setEntradas([]);
        setArrastando(false);
        setRodando(false);
        setProgresso(null);
        setResultado(null);
        setPrevisao(null);
        setDetalhes(false);
    }, [aberto]);

    const mesclado = useMemo(() => {
        const leituras = entradas
            .filter((entrada) => entrada.status === "pronto" && entrada.itens?.length)
            .map((entrada) => ({ itens: entrada.itens, origem: entrada.origem }));
        return mesclar(leituras);
    }, [entradas, mesclar]);

    const errosLista = useMemo(() => entradas.flatMap((entrada) => (
        (entrada.erros || []).map((erro) => ({
            arquivo: entrada.arquivo.name,
            linha: erro.linha,
            motivo: erro.motivo
        }))
    )), [entradas]);

    const assinatura = entradas.map((entrada) => (
        `${entrada.chave}:${entrada.status}:${entrada.itens?.length || 0}`
    )).join("|");
    const itensPreview = mesclado.itens || [];
    const itensRef = useRef(itensPreview);
    itensRef.current = itensPreview;
    entradasRef.current = entradas;

    useEffect(() => {
        const fn = classificarRef.current;
        const itens = itensRef.current;
        if (!aberto || !fn || !itens.length) {
            setPrevisao(null);
            return undefined;
        }
        let vivo = true;
        setPrevisao({ carregando: true, novos: null, atualizados: null });
        fn(itens)
            .then((resumo) => {
                if (vivo) {
                    setPrevisao({
                        carregando: false,
                        novos: Number(resumo?.novos || 0),
                        atualizados: Number(resumo?.atualizados || 0)
                    });
                }
            })
            .catch(() => {
                if (vivo) {
                    setPrevisao({ carregando: false, novos: null, atualizados: null });
                }
            });
        return () => {
            vivo = false;
        };
    }, [aberto, assinatura]);

    if (!aberto) {
        return null;
    }

    const lendo = entradas.some((entrada) => entrada.status === "lendo");
    const errosContagem = errosLista.length + Number(resultado?.erros || 0);
    const processados = resultado
        ? Number(resultado.novos || 0) + Number(resultado.atualizados || 0)
        : itensPreview.length;
    const novos = resultado ? resultado.novos : previsao?.novos;
    const atualizados = resultado ? resultado.atualizados : previsao?.atualizados;

    function aplicarLeitura(chave, parcial) {
        setEntradas((atual) => {
            if (!atual.some((entrada) => entrada.chave === chave)) {
                return atual;
            }
            const proxima = atual.map((entrada) => (entrada.chave === chave ? { ...entrada, ...parcial } : entrada));
            entradasRef.current = proxima;
            return proxima;
        });
    }

    async function lerEntrada(arquivo) {
        const chave = chaveArquivo(arquivo);
        try {
            if (permitirXml && tipoArquivo(arquivo) === "xml") {
                const parsed = parseXmlNota(await arquivo.text(), arquivo.name);
                const itens = itensDoXml(parsed);
                aplicarLeitura(chave, {
                    status: itens.length ? "pronto" : "vazio",
                    itens,
                    erros: itens.length ? [] : [{ linha: "—", motivo: "XML sem itens" }],
                    origem: "xml"
                });
                return;
            }
            const lido = await lerExcel(arquivo);
            const itens = lido?.itens || [];
            const erros = Array.isArray(lido?.erros) ? lido.erros : [];
            aplicarLeitura(chave, {
                status: itens.length ? "pronto" : "vazio",
                itens,
                erros,
                origem: lido?.origem || "excel"
            });
        } catch (erro) {
            aplicarLeitura(chave, {
                status: "erro",
                itens: [],
                erros: [{ linha: "—", motivo: erro?.message || "Falha ao ler o arquivo" }],
                origem: tipoArquivo(arquivo)
            });
        }
    }

    function adicionar(lista) {
        const recebidos = Array.from(lista || []);
        const mapa = new Map(entradasRef.current.map((entrada) => [entrada.chave, entrada]));
        const novas = [];
        recebidos.forEach((arquivo) => {
            const tipo = tipoArquivo(arquivo);
            if (tipo === "outro" || (tipo === "xml" && !permitirXml)) {
                return;
            }
            const chave = chaveArquivo(arquivo);
            if (arquivo.size > maxMb * 1024 * 1024) {
                mapa.set(chave, {
                    chave,
                    arquivo,
                    status: "erro",
                    itens: [],
                    erros: [{ linha: "—", motivo: `Arquivo maior que ${maxMb}MB` }],
                    origem: tipo
                });
                return;
            }
            const atual = mapa.get(chave);
            if (atual && atual.status !== "erro") {
                return;
            }
            novas.push(arquivo);
            mapa.set(chave, {
                chave,
                arquivo,
                status: "lendo",
                itens: [],
                erros: [],
                origem: tipo
            });
        });
        const proxima = ordenarEntradas([...mapa.values()]);
        entradasRef.current = proxima;
        setEntradas(proxima);
        setResultado(null);
        setProgresso(null);
        setDetalhes(false);
        novas.forEach((arquivo) => {
            lerEntrada(arquivo);
        });
    }

    function remover(chave) {
        const proxima = entradasRef.current.filter((entrada) => entrada.chave !== chave);
        entradasRef.current = proxima;
        setEntradas(proxima);
        setResultado(null);
        setProgresso(null);
    }

    function limpar() {
        if (rodando) {
            return;
        }
        entradasRef.current = [];
        setEntradas([]);
        setResultado(null);
        setProgresso(null);
        setPrevisao(null);
        setDetalhes(false);
    }

    async function iniciar() {
        const prontas = entradas.filter((entrada) => entrada.status === "pronto" && entrada.itens?.length);
        if (!prontas.length || rodando || lendo) {
            return;
        }
        setRodando(true);
        const porArquivo = entradas.map((entrada) => ({
            nome: entrada.arquivo.name,
            itens: entrada.itens?.length || 0,
            origem: entrada.origem,
            erro: entrada.status === "erro"
                ? (entrada.erros?.[0]?.motivo || "falha ao ler")
                : entrada.itens?.length ? "" : vazioLabel
        }));
        try {
            const gravacao = await importarLote(itensPreview, (lote) => {
                setProgresso({
                    etapa: "gravando",
                    lidos: itensPreview.length,
                    lote: lote.parte,
                    lotes: lote.partes,
                    novos: lote.novos,
                    atualizados: lote.atualizados,
                    erros: lote.erros,
                    porArquivo
                });
                setResultado({
                    novos: lote.novos,
                    atualizados: lote.atualizados,
                    erros: lote.erros,
                    total: lote.total
                });
            });
            const falhas = gravacao.erros ? `, ${gravacao.erros} com erro` : "";
            const origem = mesclado.origem === "pedidos"
                ? `${itensPreview.length} produtos únicos dos pedidos`
                : `${gravacao.total} ${rotuloItem}`;
            const mensagem = `${entradas.length} arquivo(s): ${origem} gravados (${gravacao.novos} novos, ${gravacao.atualizados} atualizados${falhas}).`;
            setResultado(gravacao);
            setProgresso({
                etapa: "ok",
                mensagem,
                lidos: itensPreview.length,
                ...gravacao,
                porArquivo
            });
            await onConcluido?.(mensagem);
        } catch (erro) {
            setProgresso({
                etapa: "erro",
                mensagem: erro?.response?.data?.mensagem || erro?.message || "Falha ao gravar no banco.",
                porArquivo
            });
        } finally {
            setRodando(false);
        }
    }

    const pct = progresso?.lotes
        ? Math.round((progresso.lote / progresso.lotes) * 100)
        : 0;

    function selo(entrada) {
        if (entrada.status === "lendo") {
            return { classe: "is-lendo", texto: "Lendo…" };
        }
        if (entrada.status === "erro") {
            return { classe: "is-erro", texto: entrada.erros?.[0]?.motivo || "Falha na leitura" };
        }
        if (entrada.status === "vazio" || !entrada.itens?.length) {
            return { classe: "is-vazio", texto: vazioLabel };
        }
        return { classe: "is-pronto", texto: "Pronto para importar" };
    }

    return (
        <div
            className="produto-modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !rodando && !ocupado) {
                    onFechar();
                }
            }}
        >
            <div className="produto-modal prd-massa" role="dialog" aria-modal="true" aria-labelledby="prd-massa-titulo">
                <div className="produto-modal-header">
                    <div>
                        <span>IMPORTAÇÃO</span>
                        <h2 id="prd-massa-titulo">{titulo}</h2>
                        <p>{descricao}</p>
                    </div>
                    <button type="button" className="modal-fechar" onClick={onFechar} disabled={rodando} aria-label="Fechar">
                        <X size={16} />
                    </button>
                </div>
                <div className="produto-modal-body">
                    <div className="prd-massa-topo">
                        <div
                            className={`prd-massa-drop${arrastando ? " is-on" : ""}`}
                            onClick={() => !rodando && inputRef.current?.click()}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setArrastando(true);
                            }}
                            onDragLeave={() => setArrastando(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setArrastando(false);
                                if (!rodando) {
                                    adicionar(e.dataTransfer.files);
                                }
                            }}
                        >
                            <div className="prd-massa-ilustra" aria-hidden="true">
                                <span className="prd-massa-folha" />
                                <span className="prd-massa-xls-tag">XLS</span>
                                <span className="prd-massa-seta"><ArrowUp size={14} /></span>
                            </div>
                            <strong>Arraste e solte as planilhas aqui</strong>
                            <span>ou clique para escolher no seu computador</span>
                            <small>Formatos aceitos: {formatos} | Tamanho máximo por arquivo: {maxMb}MB</small>
                            <button
                                type="button"
                                className="prd-massa-escolher"
                                disabled={rodando}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    inputRef.current?.click();
                                }}
                            >
                                <Upload size={16} />
                                Escolher arquivos
                            </button>
                        </div>
                        <aside className="prd-massa-dicas">
                            <h3>
                                <Lightbulb size={16} />
                                Dicas para importação
                            </h3>
                            <ul>
                                {dicasVisiveis.map((dica) => (
                                    <li key={dica}>
                                        <Check size={12} />
                                        {dica}
                                    </li>
                                ))}
                            </ul>
                            {onBaixarModelo ? (
                                <button type="button" onClick={onBaixarModelo}>
                                    <Download size={15} />
                                    Baixar modelo de planilha
                                </button>
                            ) : null}
                        </aside>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        hidden
                        multiple
                        accept={aceitos}
                        onChange={(e) => {
                            adicionar(e.target.files);
                            e.target.value = "";
                        }}
                    />

                    {entradas.length ? (
                        <>
                            <div className="prd-massa-lista-topo">
                                <strong>
                                    {entradas.length} {rotuloArquivo}(s) selecionada{feminino ? "" : "o"}(s)
                                </strong>
                                <button type="button" onClick={limpar} disabled={rodando}>
                                    <Trash2 size={14} />
                                    Limpar lista
                                </button>
                            </div>
                            <ul className="prd-massa-lista">
                                {entradas.map((entrada) => {
                                    const marca = selo(entrada);
                                    return (
                                        <li key={entrada.chave}>
                                            <span className="prd-massa-excel" aria-hidden="true">
                                                <FileSpreadsheet size={16} />
                                            </span>
                                            <div>
                                                <strong>{entrada.arquivo.name}</strong>
                                                <p>
                                                    <span><File size={12} />{formatarTamanho(entrada.arquivo.size)}</span>
                                                    <span><Users size={12} />{(entrada.itens?.length || 0).toLocaleString("pt-BR")} item(ns)</span>
                                                </p>
                                            </div>
                                            <em className={marca.classe}>{marca.texto}</em>
                                            <button
                                                type="button"
                                                onClick={() => remover(entrada.chave)}
                                                disabled={rodando}
                                                aria-label={`Remover ${entrada.arquivo.name}`}
                                            >
                                                <X size={14} />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="prd-massa-stats">
                                <article className="is-rosa">
                                    <Users size={18} />
                                    <div>
                                        <strong>{textoNumero(processados)}</strong>
                                        <span>{rotuloItem === "contatos" ? "Contatos processados" : `${rotuloItem} processados`}</span>
                                    </div>
                                </article>
                                <article className="is-verde">
                                    <Check size={18} />
                                    <div>
                                        <strong>{previsao?.carregando && !resultado ? "…" : textoNumero(novos)}</strong>
                                        <span>{rotuloItem === "contatos" ? "Novos contatos" : "Novos"}</span>
                                    </div>
                                </article>
                                <article className="is-azul">
                                    <RefreshCw size={18} />
                                    <div>
                                        <strong>{previsao?.carregando && !resultado ? "…" : textoNumero(atualizados)}</strong>
                                        <span>{rotuloItem === "contatos" ? "Contatos atualizados" : "Atualizados"}</span>
                                    </div>
                                </article>
                                <article className="is-vermelho">
                                    <AlertCircle size={18} />
                                    <div>
                                        <strong>{textoNumero(errosContagem)}</strong>
                                        <span>Com erro</span>
                                    </div>
                                </article>
                            </div>

                            {errosContagem > 0 ? (
                                <div className="prd-massa-alerta">
                                    <AlertCircle size={16} />
                                    <p>{aviso}</p>
                                    <button type="button" onClick={() => setDetalhes((atual) => !atual)}>
                                        Ver detalhes dos erros
                                        <span aria-hidden="true">{detalhes ? " ▾" : " ›"}</span>
                                    </button>
                                </div>
                            ) : null}
                            {detalhes && errosLista.length ? (
                                <ul className="prd-massa-erros">
                                    {errosLista.map((erro, indice) => (
                                        <li key={`${erro.arquivo}-${erro.linha}-${indice}`}>
                                            <strong>{erro.arquivo}</strong>
                                            <span>{erro.linha === "—" ? erro.motivo : `Linha ${erro.linha}: ${erro.motivo}`}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </>
                    ) : null}

                    {progresso?.etapa === "gravando" ? (
                        <div className="prd-massa-status">
                            <p>
                                Gravando no banco{progresso.lotes ? ` · lote ${progresso.lote}/${progresso.lotes}` : ""}
                                {progresso.lidos ? ` · ${progresso.lidos} ${rotuloItem}` : ""}
                            </p>
                            <div className="prd-massa-barra">
                                <span style={{ width: `${Math.max(pct, 4)}%` }} />
                            </div>
                        </div>
                    ) : null}
                    {progresso?.etapa === "ok" ? <p className="prd-massa-status is-ok">{progresso.mensagem}</p> : null}
                    {progresso?.etapa === "erro" ? <p className="prd-massa-status is-erro">{progresso.mensagem}</p> : null}
                </div>
                <div className="produto-modal-footer">
                    <button type="button" className="btn-secundario" onClick={onFechar} disabled={rodando}>
                        Fechar
                    </button>
                    <button
                        type="button"
                        className="btn-primary prd-massa-importar"
                        disabled={!itensPreview.length || rodando || lendo || ocupado}
                        onClick={iniciar}
                    >
                        <Upload size={16} />
                        {rodando ? "Importando…" : entradas.length ? `Importar ${entradas.length} arquivo(s)` : "Importar arquivo(s)"}
                    </button>
                </div>
            </div>
        </div>
    );
}
