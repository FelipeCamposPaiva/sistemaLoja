import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import ROTAS from "../../constants/rotas";
import { dashboardSuprimentos, gerarPedidosCompra } from "../../services/dashboard.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/estoque.css";

function brl(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function qtd(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function pct(valor) {
    return `${Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function mensagemErro(error, padrao) {
    return error?.response?.data?.mensagem || padrao;
}

export default function DashboardSuprimentos({ embutido = false, secao }) {
    const { pathname } = useLocation();
    const [dados, setDados] = useState(null);
    const [busca, setBusca] = useState("");
    const [selecionados, setSelecionados] = useState(() => new Set());
    const [aviso, setAviso] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [gerando, setGerando] = useState(false);

    async function carregar() {
        setCarregando(true);
        try {
            const painel = await dashboardSuprimentos();
            setDados(painel);
            setAviso("");
        } catch (error) {
            setAviso(mensagemErro(error, "Não foi possível carregar o dashboard de suprimentos."));
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    useEffect(() => {
        const alvo = secao
            || (pathname.includes("necessidades")
                ? "reposicao"
                : pathname.includes("giro")
                    ? "giro"
                    : null);
        if (!alvo || !dados) {
            return;
        }
        document.getElementById(alvo)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [pathname, dados, secao]);

    const reposicao = dados?.reposicao || [];
    const produtos = dados?.produtos || [];
    const vendasPeriodo = useMemo(() => ([
        { periodo: "15 dias", qtd: Number(dados?.vendas?.qtd15 || 0), valor: Number(dados?.vendas?.valor15 || 0) },
        { periodo: "30 dias", qtd: Number(dados?.vendas?.qtd30 || 0), valor: Number(dados?.vendas?.valor30 || 0) },
        { periodo: "45 dias", qtd: Number(dados?.vendas?.qtd45 || 0), valor: Number(dados?.vendas?.valor45 || 0) }
    ]), [dados]);

    const produtosFiltrados = useMemo(() => {
        const texto = busca.trim().toLowerCase();
        if (!texto) {
            return produtos;
        }
        return produtos.filter((item) =>
            [item.sku, item.nome, item.marca, item.fornecedor, item.localizacao]
                .join(" ")
                .toLowerCase()
                .includes(texto)
        );
    }, [produtos, busca]);

    function alternar(id) {
        setSelecionados((atual) => {
            const proximo = new Set(atual);
            if (proximo.has(id)) {
                proximo.delete(id);
            } else {
                proximo.add(id);
            }
            return proximo;
        });
    }

    function alternarTodos() {
        setSelecionados((atual) => {
            if (atual.size === reposicao.length) {
                return new Set();
            }
            return new Set(reposicao.map((item) => item.id));
        });
    }

    async function gerar() {
        setGerando(true);
        try {
            const ids = selecionados.size ? [...selecionados] : reposicao.map((item) => item.id);
            const resultado = await gerarPedidosCompra(ids);
            setAviso(`${resultado.quantidadeOrdens || 0} pedido(s) de compra gerado(s) com ${resultado.quantidadeItens || 0} item(ns) — ${brl(resultado.valorTotal)}.`);
            setSelecionados(new Set());
            await carregar();
        } catch (error) {
            setAviso(mensagemErro(error, "Não foi possível gerar os pedidos de compra."));
        } finally {
            setGerando(false);
        }
    }

    const marcasChart = (dados?.porMarca || []).slice(0, 8);
    const margensChart = (dados?.margensMarca || []).slice(0, 8);

    return (
        <div className="dash-home dash-sup">
            <header className="dash-vendas-head">
                <div>
                    {embutido ? null : (
                        <>
                            <p className="dash-crumb">
                                <Link to={ROTAS.INDICE}>início</Link>
                                {" › "}
                                <span>suprimentos</span>
                                {" › "}
                                <span>dashboard de estoque</span>
                            </p>
                            <h3>Dashboard de suprimentos e estoque</h3>
                        </>
                    )}
                </div>
                <div className="dash-pills">
                    <button type="button" className="idx-pill" onClick={carregar} disabled={carregando}>
                        {carregando ? "atualizando…" : "atualizar"}
                    </button>
                    <Link className="idx-pill" to="/pedidos_compra#list">ordens de compra</Link>
                    <Link className="idx-pill" to={ROTAS.ESTOQUE}>estoque</Link>
                </div>
            </header>

            {aviso ? <p className="int-aviso">{aviso}</p> : null}

            <div className="dash-kpis dash-kpis-4">
                <article className="dash-kpi">
                    <small>Estoque a custo</small>
                    <strong>{brl(dados?.valorCusto)}</strong>
                    <em>dinheiro parado na compra</em>
                </article>
                <article className="dash-kpi">
                    <small>Estoque a venda</small>
                    <strong>{brl(dados?.valorVenda)}</strong>
                    <em>potencial de faturamento</em>
                </article>
                <article className="dash-kpi">
                    <small>Margem média do estoque</small>
                    <strong>{pct(dados?.margemPercentual)}</strong>
                    <em>{dados?.skuComEstoque || 0} SKUs com saldo</em>
                </article>
                <article className="dash-kpi">
                    <small>Precisam reposição</small>
                    <strong>{dados?.skuReposicao || 0}</strong>
                    <em>
                        <a href="#reposicao">ver lista</a>
                    </em>
                </article>
            </div>

            <div className="dash-overview">
                <div><b>{dados?.skuAtivos || 0}</b><span>SKUs ativos</span></div>
                <div><b>{qtd(dados?.vendas?.qtd15)} / {brl(dados?.vendas?.valor15)}</b><span>vendas 15 dias</span></div>
                <div><b>{qtd(dados?.vendas?.qtd30)} / {brl(dados?.vendas?.valor30)}</b><span>vendas 30 dias</span></div>
                <div><b>{qtd(dados?.vendas?.qtd45)} / {brl(dados?.vendas?.valor45)}</b><span>vendas 45 dias</span></div>
            </div>

            <div className="dash-grid-4" id="giro">
                <article className="dash-box">
                    <h4>Reposições nos últimos 12 meses</h4>
                    <div className="dash-mini-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dados?.reposicoesAno || []}>
                                <defs>
                                    <linearGradient id="fillRepo" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="rotulo" stroke="#9aa0a6" tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Tooltip formatter={(valor) => qtd(valor)} />
                                <Area type="monotone" dataKey="quantidade" stroke="#3b82f6" fill="url(#fillRepo)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="dash-box">
                    <h4>Maior volume de estoque (marca)</h4>
                    <div className="dash-mini-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={marcasChart} layout="vertical" margin={{ left: 8 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="nome" stroke="#9aa0a6" width={90} tickLine={false} axisLine={false} />
                                <Tooltip formatter={(valor) => brl(valor)} />
                                <Bar dataKey="valorCusto" fill="#3b82f6" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="dash-box">
                    <h4>Vendas 15 / 30 / 45 dias</h4>
                    <div className="dash-mini-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={vendasPeriodo}>
                                <XAxis dataKey="periodo" stroke="#9aa0a6" tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Tooltip formatter={(valor, nome) => (nome === "valor" ? brl(valor) : qtd(valor))} />
                                <Bar dataKey="valor" fill="#3b82f6" radius={6} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="dash-box">
                    <h4>Maiores margens por marca</h4>
                    <ul>
                        {margensChart.length ? margensChart.map((item) => (
                            <li key={item.nome}>
                                <span>{item.nome}</span>
                                <strong>{pct(item.margemPercentual)}</strong>
                            </li>
                        )) : <li><span>Sem margem calculada</span></li>}
                    </ul>
                </article>
            </div>

            <div className="dash-grid-4 dash-sup-tables">
                <article className="dash-box">
                    <h4>Estoque por marca</h4>
                    <div className="dash-sup-table-wrap">
                        <table className="fer-table">
                            <thead>
                                <tr>
                                    <th>Marca</th>
                                    <th>Qtd</th>
                                    <th>Custo</th>
                                    <th>Venda</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(dados?.porMarca || []).map((item) => (
                                    <tr key={item.nome}>
                                        <td>{item.nome}</td>
                                        <td>{qtd(item.quantidade)}</td>
                                        <td>{brl(item.valorCusto)}</td>
                                        <td>{brl(item.valorVenda)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>
                <article className="dash-box">
                    <h4>Estoque por fornecedor</h4>
                    <div className="dash-sup-table-wrap">
                        <table className="fer-table">
                            <thead>
                                <tr>
                                    <th>Fornecedor</th>
                                    <th>Qtd</th>
                                    <th>Custo</th>
                                    <th>Itens</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(dados?.porFornecedor || []).map((item) => (
                                    <tr key={item.nome}>
                                        <td>{item.nome}</td>
                                        <td>{qtd(item.quantidade)}</td>
                                        <td>{brl(item.valorCusto)}</td>
                                        <td>{item.itens}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>
            </div>

            <section className="dash-box dash-sup-bloco" id="reposicao">
                <div className="dash-sup-toolbar">
                    <h4>Produtos para reposição</h4>
                    <div>
                        <button type="button" className="idx-text" onClick={alternarTodos}>
                            {selecionados.size === reposicao.length && reposicao.length ? "limpar seleção" : "selecionar todos"}
                        </button>
                        <button type="button" className="idx-pill int-add" onClick={gerar} disabled={gerando || !reposicao.length}>
                            {gerando ? "gerando…" : "gerar pedidos de compra"}
                        </button>
                    </div>
                </div>
                {reposicao.length ? (
                    <div className="dash-sup-table-wrap">
                        <table className="fer-table">
                            <thead>
                                <tr>
                                    <th />
                                    <th>SKU</th>
                                    <th>Produto</th>
                                    <th>Marca</th>
                                    <th>Fornecedor</th>
                                    <th>Estoque</th>
                                    <th>Mín.</th>
                                    <th>15d</th>
                                    <th>30d</th>
                                    <th>45d</th>
                                    <th>Comprar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reposicao.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selecionados.has(item.id)}
                                                onChange={() => alternar(item.id)}
                                            />
                                        </td>
                                        <td>{item.sku || "—"}</td>
                                        <td>{item.nome}</td>
                                        <td>{item.marca}</td>
                                        <td>{item.fornecedor}</td>
                                        <td>{qtd(item.estoque)}</td>
                                        <td>{qtd(item.estoqueMinimo)}</td>
                                        <td>{qtd(item.qtd15)}</td>
                                        <td>{qtd(item.qtd30)}</td>
                                        <td>{qtd(item.qtd45)}</td>
                                        <td>{qtd(item.comprar)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="idx-sub">Nenhum produto abaixo do mínimo ou zerado.</p>
                )}
            </section>

            <section className="dash-box dash-sup-bloco">
                <div className="dash-sup-toolbar">
                    <h4>Estoque em tempo real</h4>
                    <label className="fer-search">
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar SKU, produto, marca, fornecedor ou localização"
                        />
                    </label>
                </div>
                <div className="dash-sup-table-wrap is-tall">
                    <table className="fer-table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Produto / variação</th>
                                <th>Marca</th>
                                <th>Fornecedor</th>
                                <th>Local</th>
                                <th>Estoque</th>
                                <th>Custo</th>
                                <th>Venda</th>
                                <th>Margem</th>
                                <th>45d</th>
                            </tr>
                        </thead>
                        <tbody>
                            {produtosFiltrados.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.sku || "—"}</td>
                                    <td>
                                        {item.nome}
                                        {item.localizacao ? <small className="estq-sku">{item.localizacao}</small> : null}
                                    </td>
                                    <td>{item.marca}</td>
                                    <td>{item.fornecedor}</td>
                                    <td>
                                        {item.localizacao ? (
                                            <Link to={`${ROTAS.LOCALIZACOES}?localizacao=${encodeURIComponent(item.localizacao)}`}>{item.localizacao}</Link>
                                        ) : "—"}
                                    </td>
                                    <td>{qtd(item.estoque)}</td>
                                    <td>{brl(item.valorCusto)}</td>
                                    <td>{brl(item.valorVenda)}</td>
                                    <td>{pct(item.margemPercentual)}</td>
                                    <td>{qtd(item.qtd45)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <article className="dash-box dash-sup-bloco">
                <h4>Mais vendidos (45 dias)</h4>
                <ul>
                    {(dados?.maisVendidos || []).map((item) => (
                        <li key={item.id}>
                            <span>{item.nome} {item.sku ? `(${item.sku})` : ""}</span>
                            <strong>{qtd(item.qtd45)}</strong>
                        </li>
                    ))}
                    {!(dados?.maisVendidos || []).length ? <li><span>Sem vendas no período</span></li> : null}
                </ul>
            </article>
        </div>
    );
}
