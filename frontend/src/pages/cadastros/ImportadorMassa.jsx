import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";

import { agregarItensNfe, parseXmlNota } from "../../constants/notasEntrada";
import { importarProdutosLote } from "../../services/produto.service";
import { lerPlanilhaProdutos, mesclarLeituras } from "../../services/produtoImport.service";

import "../../styles/pages/produtos.css";

const ACEITOS = ".xls,.xlsx,.csv,.xml,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/xml,application/xml";

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

function ordenarArquivos(lista) {
    return [...lista].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }));
}

export default function ImportadorMassa({
    aberto,
    ocupado,
    onFechar,
    onConcluido,
    titulo = "Importador em massa",
    descricao = "Selecione várias planilhas Tiny (.xls/.xlsx) ou XML de NF-e de uma vez.",
    dica = "Vários Excel de uma vez: produtos_1-500.xls, produtos_501-1000.xls…",
    aceitos = ACEITOS,
    permitirXml = true,
    rotuloItem = "produtos",
    lerExcel = lerPlanilhaProdutos,
    mesclar = mesclarLeituras,
    importarLote = importarProdutosLote
}) {
    const inputRef = useRef(null);
    const [arquivos, setArquivos] = useState([]);
    const [arrastando, setArrastando] = useState(false);
    const [rodando, setRodando] = useState(false);
    const [progresso, setProgresso] = useState(null);

    const resumo = useMemo(() => {
        const excel = arquivos.filter((a) => tipoArquivo(a) === "excel").length;
        const xml = arquivos.filter((a) => tipoArquivo(a) === "xml").length;
        const outros = arquivos.length - excel - xml;
        return { excel, xml, outros };
    }, [arquivos]);

    if (!aberto) {
        return null;
    }

    function adicionar(lista) {
        const novos = Array.from(lista || []).filter((arq) => {
            const tipo = tipoArquivo(arq);
            if (tipo === "outro") {
                return false;
            }
            if (tipo === "xml" && !permitirXml) {
                return false;
            }
            return true;
        });
        setArquivos((atual) => {
            const mapa = new Map(atual.map((a) => [`${a.name}-${a.size}-${a.lastModified}`, a]));
            novos.forEach((arq) => mapa.set(`${arq.name}-${arq.size}-${arq.lastModified}`, arq));
            return ordenarArquivos([...mapa.values()]);
        });
        setProgresso(null);
    }

    function remover(indice) {
        setArquivos((atual) => atual.filter((_, i) => i !== indice));
        setProgresso(null);
    }

    async function iniciar() {
        if (!arquivos.length || rodando) {
            return;
        }
        setRodando(true);
        const leituras = [];
        const porArquivo = [];
        try {
            for (let i = 0; i < arquivos.length; i++) {
                const arquivo = arquivos[i];
                setProgresso({
                    etapa: "lendo",
                    arquivo: arquivo.name,
                    indice: i + 1,
                    total: arquivos.length,
                    porArquivo
                });
                try {
                    if (permitirXml && tipoArquivo(arquivo) === "xml") {
                        const parsed = parseXmlNota(await arquivo.text(), arquivo.name);
                        const itens = itensDoXml(parsed);
                        leituras.push({ itens, origem: "xml" });
                        porArquivo.push({ nome: arquivo.name, itens: itens.length, origem: "xml", erro: itens.length ? "" : "sem itens" });
                    } else {
                        const lido = await lerExcel(arquivo);
                        leituras.push(lido);
                        porArquivo.push({
                            nome: arquivo.name,
                            itens: lido.itens.length,
                            origem: lido.origem,
                            erro: lido.itens.length ? "" : `sem ${rotuloItem}`
                        });
                    }
                } catch (erro) {
                    porArquivo.push({
                        nome: arquivo.name,
                        itens: 0,
                        origem: tipoArquivo(arquivo),
                        erro: erro?.message || "falha ao ler"
                    });
                }
            }

            const mesclado = mesclar(leituras);
            if (!mesclado.itens.length) {
                setProgresso({
                    etapa: "erro",
                    mensagem: `Nenhum ${rotuloItem.slice(0, -1)} encontrado nesses arquivos.`,
                    porArquivo
                });
                return;
            }

            setProgresso({
                etapa: "gravando",
                lidos: mesclado.itens.length,
                indice: arquivos.length,
                total: arquivos.length,
                porArquivo
            });

            const gravacao = await importarLote(mesclado.itens, (lote) => {
                setProgresso({
                    etapa: "gravando",
                    lidos: mesclado.itens.length,
                    lote: lote.parte,
                    lotes: lote.partes,
                    novos: lote.novos,
                    atualizados: lote.atualizados,
                    erros: lote.erros,
                    porArquivo
                });
            });

            const falhas = gravacao.erros ? `, ${gravacao.erros} com erro` : "";
            const origem = mesclado.origem === "pedidos"
                ? `${mesclado.itens.length} produtos únicos dos pedidos`
                : `${gravacao.total} ${rotuloItem}`;
            const mensagem = `${arquivos.length} arquivo(s): ${origem} gravados (${gravacao.novos} novos, ${gravacao.atualizados} atualizados${falhas}).`;
            setProgresso({
                etapa: "ok",
                mensagem,
                lidos: mesclado.itens.length,
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
        : progresso?.total
            ? Math.round((progresso.indice / progresso.total) * 100)
            : 0;

    return (
        <div
            className="produto-modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !rodando && !ocupado) {
                    onFechar();
                }
            }}
        >
            <div className="produto-modal prd-massa">
                <div className="produto-modal-header">
                    <div>
                        <span>IMPORTAÇÃO</span>
                        <h2>{titulo}</h2>
                        <p>{descricao}</p>
                    </div>
                    <button type="button" className="modal-fechar" onClick={onFechar} disabled={rodando}>
                        ×
                    </button>
                </div>
                <div className="produto-modal-body">
                    <button
                        type="button"
                        className={`prd-massa-drop${arrastando ? " is-on" : ""}`}
                        disabled={rodando}
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
                        onDragLeave={() => setArrastando(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setArrastando(false);
                            adicionar(e.dataTransfer.files);
                        }}
                    >
                        <Upload size={22} />
                        <strong>Solte os arquivos aqui ou clique para escolher</strong>
                        <span>{dica}</span>
                    </button>
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

                    {arquivos.length > 80 ? (
                        <p className="prd-massa-meta">Muitos arquivos: a leitura pode demorar alguns minutos.</p>
                    ) : null}

                    {arquivos.length ? (
                        <>
                            <p className="prd-massa-meta">
                                {resumo.excel} planilha(s)
                                {resumo.xml ? ` · ${resumo.xml} XML` : ""}
                                {resumo.outros ? ` · ${resumo.outros} ignorado(s)` : ""}
                            </p>
                            <ul className="prd-massa-lista">
                                {arquivos.map((arquivo, i) => {
                                    const info = progresso?.porArquivo?.find((p) => p.nome === arquivo.name);
                                    return (
                                        <li key={`${arquivo.name}-${arquivo.size}-${i}`}>
                                            <FileSpreadsheet size={16} />
                                            <span>
                                                {arquivo.name}
                                                {info ? ` · ${info.itens} item(ns)${info.origem === "pedidos" ? " (pedidos)" : ""}${info.erro ? ` · ${info.erro}` : ""}` : ""}
                                            </span>
                                            <button type="button" onClick={() => remover(i)} disabled={rodando} aria-label="Remover arquivo">
                                                <X size={14} />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    ) : null}

                    {progresso ? (
                        <div className="prd-massa-status">
                            {progresso.etapa === "lendo" ? (
                                <p>Lendo {progresso.indice}/{progresso.total}: {progresso.arquivo}</p>
                            ) : null}
                            {progresso.etapa === "gravando" ? (
                                <p>
                                    Gravando no banco{progresso.lotes ? ` · lote ${progresso.lote}/${progresso.lotes}` : ""}
                                    {progresso.lidos ? ` · ${progresso.lidos} ${rotuloItem}` : ""}
                                </p>
                            ) : null}
                            {progresso.etapa === "ok" ? <p className="is-ok">{progresso.mensagem}</p> : null}
                            {progresso.etapa === "erro" ? <p className="is-erro">{progresso.mensagem}</p> : null}
                            {progresso.etapa === "lendo" || progresso.etapa === "gravando" ? (
                                <div className="prd-massa-barra">
                                    <span style={{ width: `${Math.max(pct, 4)}%` }} />
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                <div className="produto-modal-footer">
                    <button type="button" className="btn-secundario" onClick={onFechar} disabled={rodando}>
                        Fechar
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        disabled={!arquivos.length || rodando}
                        onClick={iniciar}
                    >
                        {rodando ? "Importando…" : `Importar ${arquivos.length || ""} arquivo(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
