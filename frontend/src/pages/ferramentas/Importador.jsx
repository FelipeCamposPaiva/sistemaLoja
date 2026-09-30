import { useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";

import { IMPORTADORES } from "../../constants/ferramentas";
import ROTAS from "../../constants/rotas";
import { importarOSLote } from "../../services/os.service";
import { baixarLayoutOS, COLUNAS_LAYOUT_OS, EXEMPLO_LAYOUT_OS, lerArquivoOS, lerPlanilhaOS, mesclarLeiturasOS } from "../../services/osImport.service";
import { importarPedidosLote } from "../../services/pedidoVenda.service";
import { baixarLayoutPedido, COLUNAS_LAYOUT_PEDIDO, EXEMPLO_LAYOUT_PEDIDO, lerArquivoPedido, lerPlanilhaPedidos, mesclarLeiturasPedidos } from "../../services/pedidoVendaImport.service";
import { lerPlanilhaKits, mesclarComponentes, skuChave } from "../../services/kitComposicao";
import { importarProdutosLote, listarProdutos } from "../../services/produto.service";
import ImportadorMassa from "../cadastros/ImportadorMassa";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/os.css";

export default function Importador() {
    const { tipo } = useParams();
    const navigate = useNavigate();
    const cfg = IMPORTADORES[tipo];
    const fileRef = useRef(null);
    const [drawer, setDrawer] = useState(false);
    const [formato, setFormato] = useState("xls");
    const [aviso, setAviso] = useState("");
    const [ocupado, setOcupado] = useState(false);
    const [massa, setMassa] = useState(false);

    if (!cfg) {
        return <Navigate to="/ferramentas_geral?aba=importacoes" replace />;
    }

    const colunas = tipo === "os" ? COLUNAS_LAYOUT_OS : tipo === "vendas" ? COLUNAS_LAYOUT_PEDIDO : cfg.colunas;
    const exemplo = tipo === "os" ? EXEMPLO_LAYOUT_OS : tipo === "vendas" ? EXEMPLO_LAYOUT_PEDIDO : (cfg.exemplo || [
        cfg.colunas.map((_, i) => (i === 0 ? "1" : i === 1 ? "Exemplo" : "-"))
    ]);

    async function importarArquivo(arquivo) {
        if (!arquivo || (tipo !== "os" && tipo !== "kits" && tipo !== "vendas")) {
            return;
        }
        setOcupado(true);
        try {
            if (tipo === "kits") {
                const lido = await lerPlanilhaKits(arquivo);
                if (!lido.itens.length) {
                    setAviso("A planilha não tem SKU de kit ou componente.");
                    return;
                }
                const atuais = await listarProdutos();
                const payload = lido.itens.map((kit) => {
                    const atual = atuais.find((p) => skuChave(p.sku) === skuChave(kit.sku));
                    return {
                        ...atual,
                        sku: kit.sku,
                        nome: kit.nome || atual?.nome || kit.sku,
                        tipoCadastro: "kits",
                        componentes: mesclarComponentes(atual?.componentes, kit.componentes),
                        observacoes: atual?.observacoes || "",
                        ativo: atual?.ativo !== false
                    };
                });
                const resumo = await importarProdutosLote(payload);
                const falhas = resumo.erros ? `, ${resumo.erros} com erro` : "";
                setAviso(`${arquivo.name}: ${lido.itens.length} kit(s) (${resumo.novos} novos, ${resumo.atualizados} atualizados${falhas}).`);
                navigate(`${ROTAS.PRODUTOS}#list`);
                return;
            }
            if (tipo === "vendas") {
                const lido = await lerPlanilhaPedidos(arquivo);
                if (!lido.length) {
                    setAviso("A planilha não tem pedidos com número ou cliente.");
                    return;
                }
                const resumo = await importarPedidosLote(lido);
                const falhas = resumo.erros ? `, ${resumo.erros} com erro` : "";
                setAviso(`${arquivo.name}: ${resumo.novos} novos, ${resumo.atualizados} atualizados${falhas}.`);
                navigate(`${ROTAS.PEDIDO_VENDA}#list`);
                return;
            }
            const lido = await lerPlanilhaOS(arquivo);
            if (!lido.length) {
                setAviso("A planilha não tem ordens com número ou cliente.");
                return;
            }
            const resumo = await importarOSLote(lido);
            const falhas = resumo.erros ? `, ${resumo.erros} com erro` : "";
            setAviso(`${arquivo.name}: ${resumo.novos} novas, ${resumo.atualizados} atualizadas${falhas}.`);
            navigate(ROTAS.ORDEM_SERVICO);
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível importar a planilha.");
        } finally {
            setOcupado(false);
            if (fileRef.current) {
                fileRef.current.value = "";
            }
        }
    }

    return (
        <div className="fer-main">
            <nav className="dash-crumb" aria-label="Trilha">
                <button type="button" className="int-voltar" onClick={() => navigate("/ferramentas_geral?aba=importacoes")}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <Link to="/index">início</Link>
                <span>›</span>
                <Link to="/ferramentas_geral">ferramentas</Link>
                <span>›</span>
                <span>{cfg.titulo.toLowerCase()}</span>
            </nav>
            <div className="fer-head">
                <h2>{cfg.titulo}</h2>
                <div className="os-topo-acoes">
                    {tipo === "os" || tipo === "vendas" ? (
                        <button
                            type="button"
                            className="prd-btn"
                            disabled={ocupado}
                            onClick={() => setMassa(true)}
                        >
                            importar em massa
                        </button>
                    ) : null}
                    <button
                        type="button"
                        className="idx-pill int-add"
                        disabled={ocupado}
                        onClick={() => {
                            if (tipo === "os" || tipo === "kits" || tipo === "vendas") {
                                fileRef.current?.click();
                                return;
                            }
                            window.alert("Selecione a planilha no computador para iniciar a importação.");
                        }}
                    >
                        {ocupado ? "importando…" : "→ prosseguir com a importação"}
                    </button>
                </div>
            </div>
            {aviso ? <p className="prd-aviso">{aviso}</p> : null}
            <input
                ref={fileRef}
                type="file"
                hidden
                accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => importarArquivo(e.target.files?.[0])}
            />
            <p className="fer-ajuda">Exemplo de planilha compatível com o Sistema ERP</p>
            <div className="fer-scroll">
                <table className="fer-table">
                    <thead>
                        <tr>
                            {colunas.map((col) => (
                                <th key={col}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {exemplo.map((linha, i) => (
                            <tr key={i}>
                                {colunas.map((col, c) => (
                                    <td key={col}>{linha[c] ?? ""}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="fer-ajuda">
                <button type="button" className="idx-text" onClick={() => setDrawer(true)}>
                    ↓ download do arquivo de layout
                </button>
            </p>
            {drawer ? (
                <aside className="os-drawer">
                    <header>
                        <strong>Download do layout</strong>
                        <button type="button" onClick={() => setDrawer(false)} aria-label="fechar"><X size={16} /></button>
                    </header>
                    <label className="os-sw" style={{ display: "block", border: 0 }}>
                        Formato do arquivo
                        <select value={formato} onChange={(e) => setFormato(e.target.value)} style={{ marginTop: 8, width: "100%" }}>
                            <option value="xls">Excel (.xls)</option>
                            <option value="csv">Texto (.csv)</option>
                        </select>
                    </label>
                    <footer>
                        <button
                            type="button"
                            className="prd-btn prd-btn-primary"
                            onClick={() => {
                                if (tipo === "os") {
                                    baixarLayoutOS(formato);
                                } else if (tipo === "vendas") {
                                    baixarLayoutPedido(formato);
                                } else {
                                    const csv = [colunas.join(";"), ...exemplo.map((linha) => linha.join(";"))].join("\n");
                                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `layout-${tipo}.${formato === "xls" ? "csv" : formato}`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }
                                setDrawer(false);
                            }}
                        >
                            download
                        </button>
                        <button type="button" className="prd-btn" onClick={() => setDrawer(false)}>cancelar</button>
                    </footer>
                </aside>
            ) : null}
            {tipo === "os" ? (
                <ImportadorMassa
                    aberto={massa}
                    ocupado={ocupado}
                    onFechar={() => setMassa(false)}
                    titulo="Importar ordens de serviço"
                    descricao="Selecione várias planilhas de OS do Olist (.xls/.xlsx) de uma vez."
                    dica="Vários Excel: ordens_servico_1.xls, ordens_servico_2.xls…"
                    aceitos=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    permitirXml={false}
                    rotuloItem="ordens"
                    lerExcel={lerArquivoOS}
                    mesclar={mesclarLeiturasOS}
                    importarLote={importarOSLote}
                    onConcluido={async (mensagem) => {
                        setAviso(mensagem);
                        setMassa(false);
                        navigate(ROTAS.ORDEM_SERVICO);
                    }}
                />
            ) : null}
            {tipo === "vendas" ? (
                <ImportadorMassa
                    aberto={massa}
                    ocupado={ocupado}
                    onFechar={() => setMassa(false)}
                    titulo="Importar pedidos de venda"
                    descricao="Selecione várias planilhas de pedidos do Olist (.xls/.xlsx/.csv) de uma vez."
                    dica="Vários Excel: pedidos_venda_1-503.xls, pedidos_venda_504-1000.xls…"
                    aceitos=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    permitirXml={false}
                    rotuloItem="pedidos"
                    lerExcel={lerArquivoPedido}
                    mesclar={mesclarLeiturasPedidos}
                    importarLote={importarPedidosLote}
                    onConcluido={async (mensagem) => {
                        setAviso(mensagem);
                        setMassa(false);
                        navigate(`${ROTAS.PEDIDO_VENDA}#list`);
                    }}
                />
            ) : null}
        </div>
    );
}
