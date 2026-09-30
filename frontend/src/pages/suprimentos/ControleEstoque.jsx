import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Printer } from "lucide-react";

import "../../styles/pages/estoque.css";
import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/os.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/localizacao.css";

import BuscaLocalizacao from "../../components/BuscaLocalizacao";
import ROTAS from "../../constants/rotas";
import {
    listarMovimentacoes,
    salvarMovimentacao as salvarAPI,
    estornarMovimentacao
} from "../../services/movimentacao.service";
import { listarProdutos } from "../../services/produto.service";
import { filtrarPorLocalizacao, imprimirProdutosLocalizacao, passaFiltroEstoque, produtoNaLocalizacao } from "../../services/localizacao";

const ORIGEM_LABEL = {
    MANUAL: "Manual",
    NF: "NF",
    PEDIDO: "Pedido",
    API: "API",
    OS: "OS",
    INVENTARIO: "Inventário",
    AJUSTE: "Ajuste",
    IMPORTACAO: "Importação",
    CADASTRO: "Cadastro"
};

export default function ControleEstoques() {
    const [params] = useSearchParams();
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [produto, setProduto] = useState("");
    const [tipo, setTipo] = useState("ENTRADA");
    const [quantidade, setQuantidade] = useState("");
    const [observacao, setObservacao] = useState("");
    const [aviso, setAviso] = useState("");
    const [localizacao, setLocalizacao] = useState(params.get("localizacao") || "");
    const [filtroEstoque, setFiltroEstoque] = useState(params.get("estoque") || (params.get("comEstoque") === "1" ? "disponivel" : "todos"));

    const produtosFiltrados = useMemo(
        () => (localizacao.trim()
            ? filtrarPorLocalizacao(produtos, localizacao, filtroEstoque)
            : produtos.filter((p) => passaFiltroEstoque(p, filtroEstoque))),
        [produtos, localizacao, filtroEstoque]
    );

    useEffect(() => {
        carregarMovimentacoes();
        carregarProdutos();
    }, []);

    async function carregarMovimentacoes() {
        try {
            const dados = await listarMovimentacoes();
            setMovimentacoes(dados || []);
        } catch (error) {
            console.error(error);
            setAviso("Não foi possível ler as movimentações.");
        }
    }

    async function carregarProdutos() {
        try {
            const dados = await listarProdutos();
            setProdutos(dados || []);
        } catch (error) {
            console.error(error);
        }
    }

    function nomeProduto(item) {
        if (item.produtoNome) {
            return item.produtoNome;
        }
        const encontrado = produtos.find((p) => String(p.id) === String(item.produtoId));
        return encontrado ? encontrado.nome : item.produtoId;
    }

    async function salvarMovimentacao() {
        if (!produto) {
            setAviso("Selecione um produto.");
            return;
        }
        if (!quantidade) {
            setAviso("Informe a quantidade.");
            return;
        }
        try {
            await salvarAPI({
                produtoId: Number(produto),
                tipo,
                quantidade: Number(quantidade),
                observacao,
                origem: "MANUAL"
            });
            setProduto("");
            setQuantidade("");
            setObservacao("");
            setAviso("Movimentação lançada e registrada no log de auditoria.");
            carregarMovimentacoes();
        } catch (error) {
            setAviso(error.response?.data?.mensagem || "Erro ao salvar movimentação.");
        }
    }

    async function estornar(item) {
        if (!window.confirm(`Estornar a movimentação #${item.id}? O registro original permanece no histórico.`)) {
            return;
        }
        try {
            await estornarMovimentacao(item.id);
            setAviso("Estorno lançado. O movimento original permanece no log.");
            carregarMovimentacoes();
        } catch (error) {
            setAviso(error.response?.data?.mensagem || "Não foi possível estornar.");
        }
    }

    return (
        <div className="estoque-page os-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>suprimentos</span>
                <span>›</span>
                <span>estoque</span>
            </nav>
            <div className="estoque-topo fer-head">
                <div>
                    <small>SUPRIMENTOS</small>
                    <h1>Controle de Estoque</h1>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link className="prd-btn" to={ROTAS.AUDITORIA_ESTOQUE}>auditoria de estoque</Link>
                    <Link className="prd-btn" to={ROTAS.LOCALIZACOES}>buscar por localização</Link>
                </div>
            </div>

            <BuscaLocalizacao
                produtos={produtos}
                localizacao={localizacao}
                onLocalizacao={setLocalizacao}
                filtroEstoque={filtroEstoque}
                onFiltroEstoque={setFiltroEstoque}
            />
            {localizacao.trim() ? (
                <div className="loc-acoes">
                    <button
                        type="button"
                        className="prd-btn"
                        disabled={!produtosFiltrados.length}
                        onClick={() => imprimirProdutosLocalizacao(produtosFiltrados, localizacao)}
                    >
                        <Printer size={15} />
                        imprimir produtos desta localização
                    </button>
                    <p className="loc-hint">{produtosFiltrados.length} produto(s) nesta prateleira/setor.</p>
                </div>
            ) : null}

            <div className="estoque-resumo">
                <div className="card-resumo">
                    <span>Movimentações</span>
                    <h2>{movimentacoes.length}</h2>
                </div>
            </div>

            <div className="card-movimento os-card">
                <h3>Nova movimentação</h3>
                <p className="idx-sub">O lançamento grava usuário, data/hora e origem manual. Estornos não apagam o histórico.</p>
                <div className="grid-2">
                    <select value={produto} onChange={(e) => setProduto(e.target.value)}>
                        <option value="">Selecione o produto</option>
                        {produtosFiltrados.map((p) => (
                            <option key={p.id} value={p.id}>{p.nome}{p.localizacao ? ` · ${p.localizacao}` : ""}</option>
                        ))}
                    </select>
                    <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        <option value="ENTRADA">Entrada</option>
                        <option value="SAIDA">Saída</option>
                        <option value="AJUSTE">Ajuste (+ ou -)</option>
                        <option value="PERDA">Perda</option>
                        <option value="TRANSFERENCIA">Transferência</option>
                    </select>
                    <input
                        type="number"
                        placeholder="Quantidade"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                    />
                    <input
                        placeholder="Observação"
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={salvarMovimentacao}>
                    Salvar movimentação
                </button>
            </div>

            <div className="card-tabela os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Data e hora</th>
                            <th>Usuário</th>
                            <th>Produto</th>
                            <th>Tipo</th>
                            <th>Origem</th>
                            <th>Quantidade</th>
                            <th>Situação</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {movimentacoes.length === 0 ? (
                            <tr>
                                <td colSpan="9">Nenhuma movimentação</td>
                            </tr>
                        ) : (
                            movimentacoes
                                .filter((item) => {
                                    if (!localizacao.trim()) {
                                        return true;
                                    }
                                    const encontrado = produtos.find((p) => String(p.id) === String(item.produtoId));
                                    return produtoNaLocalizacao(encontrado || { localizacao: item.produtoNome }, localizacao);
                                })
                                .map((item) => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>
                                        {item.dataMovimento
                                            ? new Date(item.dataMovimento).toLocaleString("pt-BR")
                                            : "—"}
                                    </td>
                                    <td>{item.usuarioNome || "—"}</td>
                                    <td>{nomeProduto(item)}</td>
                                    <td>{item.tipo}</td>
                                    <td>{ORIGEM_LABEL[item.origem] || item.origem || "Manual"}</td>
                                    <td>{item.quantidade}</td>
                                    <td>{item.status || "ATIVO"}</td>
                                    <td>
                                        {String(item.status || "ATIVO").toUpperCase() === "ATIVO"
                                            && String(item.tipo).toUpperCase() !== "ESTORNO" ? (
                                            <button type="button" className="idx-text" onClick={() => estornar(item)}>
                                                estornar
                                            </button>
                                        ) : null}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
