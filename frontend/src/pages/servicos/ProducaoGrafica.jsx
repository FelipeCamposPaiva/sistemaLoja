import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";

import {
    GRUPOS_LOJA,
    MATERIAIS_M2,
    SERVICOS_PERSONALIZADOS,
    WIREO,
    areaM2,
    comMargem,
    custoLaserPb,
    formatarBRL,
    gravarCustosGrafica,
    lerCustosGrafica,
    sugerirWireo
} from "../../constants/grafica";
import {
    gravarPainelProducao,
    lerPainelProducao,
    novoId
} from "../../constants/kanbanProducao";
import ROTAS from "../../constants/rotas";

import "../../styles/pages/indice.css";
import "../../styles/pages/producao-grafica.css";

const ABAS = [
    { id: "m2", nome: "m² / banner" },
    { id: "wireo", nome: "Wire-O" },
    { id: "laser", nome: "Laser P&B" },
    { id: "servicos", nome: "Personalizados" }
];

export default function ProducaoGrafica() {
    const navigate = useNavigate();
    const [aba, setAba] = useState("m2");
    const [cfg, setCfg] = useState(lerCustosGrafica);
    const [orcamento, setOrcamento] = useState([]);
    const [cliente, setCliente] = useState("");

    const [matId, setMatId] = useState("banner");
    const [largura, setLargura] = useState("100");
    const [altura, setAltura] = useState("80");
    const [unid, setUnid] = useState("cm");
    const [qtd, setQtd] = useState("1");

    const [folhas, setFolhas] = useState("80");
    const [gramatura, setGramatura] = useState("75");
    const [mm, setMm] = useState("");

    const [paginas, setPaginas] = useState("100");
    const [busca, setBusca] = useState("");

    useEffect(() => {
        gravarCustosGrafica(cfg);
    }, [cfg]);

    const material = cfg.materiais.find((m) => m.id === matId) || cfg.materiais[0];
    const m2 = areaM2(largura, altura, unid);
    const unitM2 = m2 * (Number(material?.precoM2) || 0);
    const totalM2 = unitM2 * (Number(qtd) || 0);

    const wire = sugerirWireo({
        folhas: Number(folhas) || 0,
        mm: mm === "" ? null : Number(mm),
        gramatura
    });

    const custoPagina = custoLaserPb(cfg.laserPb, cfg.cobertura);
    const laserTotal = custoPagina * (Number(paginas) || 0);
    const laserVenda = comMargem(laserTotal, cfg.margem);

    const servicos = useMemo(() => {
        const t = busca.trim().toLowerCase();
        return SERVICOS_PERSONALIZADOS.filter((nome) => !t || nome.toLowerCase().includes(t));
    }, [busca]);

    function addLinha(descricao, valor) {
        setOrcamento((atual) => [...atual, { id: novoId("ln"), descricao, valor: Number(valor) || 0 }]);
    }

    function enviarPainel() {
        if (!orcamento.length) {
            return;
        }
        const total = orcamento.reduce((s, i) => s + i.valor, 0);
        const painel = lerPainelProducao();
        gravarPainelProducao({
            ...painel,
            cards: [{
                id: novoId("os"),
                colunaId: "orcamento",
                titulo: orcamento[0].descricao.slice(0, 48),
                cliente: cliente || "Balcão",
                descricao: orcamento.map((i) => `${i.descricao} — ${formatarBRL(i.valor)}`).join("\n"),
                valor: total.toFixed(2).replace(".", ","),
                prazo: "",
                responsavel: "",
                prioridade: "media"
            }, ...painel.cards]
        });
        navigate(ROTAS.PAINEL_PRODUCAO);
    }

    const soma = orcamento.reduce((s, i) => s + i.valor, 0);

    return (
        <div className="pg-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <Link to="/ordem_servicos">serviços</Link>
                <span>›</span>
                <span>produção</span>
            </nav>
            <header className="pg-head">
                <div>
                    <h2>Produção gráfica</h2>
                    <p>Calculadora da Tem de Tudo: m², Wire-O e custo de impressão (planilhas Marcelo Giovanelli).</p>
                </div>
                <Link to={ROTAS.PAINEL_PRODUCAO} className="idx-pill">painel kanban</Link>
            </header>

            <div className="pg-tabs">
                {ABAS.map((item) => (
                    <button key={item.id} type="button" className={aba === item.id ? "is-on" : ""} onClick={() => setAba(item.id)}>
                        {item.nome}
                    </button>
                ))}
            </div>

            <div className="pg-grid">
                <section className="pg-card">
                    {aba === "m2" ? (
                        <>
                            <h3>Calculadora m²</h3>
                            <div className="pg-form">
                                <label>
                                    Material
                                    <select value={matId} onChange={(e) => setMatId(e.target.value)}>
                                        {cfg.materiais.map((m) => (
                                            <option key={m.id} value={m.id}>{m.nome} · {formatarBRL(m.precoM2)}/m²</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Unidade
                                    <select value={unid} onChange={(e) => setUnid(e.target.value)}>
                                        <option value="cm">centímetros</option>
                                        <option value="m">metros</option>
                                    </select>
                                </label>
                                <label>
                                    Largura
                                    <input value={largura} onChange={(e) => setLargura(e.target.value)} />
                                </label>
                                <label>
                                    Altura
                                    <input value={altura} onChange={(e) => setAltura(e.target.value)} />
                                </label>
                                <label>
                                    Quantidade
                                    <input value={qtd} onChange={(e) => setQtd(e.target.value)} />
                                </label>
                                <label>
                                    Preço m² (R$)
                                    <input
                                        value={material?.precoM2 ?? ""}
                                        onChange={(e) => setCfg((c) => ({
                                            ...c,
                                            materiais: c.materiais.map((m) => (m.id === matId ? { ...m, precoM2: Number(e.target.value) || 0 } : m))
                                        }))}
                                    />
                                </label>
                            </div>
                            <div className="pg-result" style={{ marginTop: 16 }}>
                                <span>Área unitária {m2.toFixed(3)} m²</span>
                                <span>Unitário {formatarBRL(unitM2)}</span>
                                <strong>{formatarBRL(totalM2)}</strong>
                            </div>
                            <button type="button" className="idx-pill" style={{ marginTop: 12 }} onClick={() => addLinha(`${material.nome} ${largura}×${altura} ${unid} ×${qtd}`, totalM2)}>
                                <Plus size={14} /> incluir no orçamento
                            </button>
                            <p className="pg-hint">Preços-base: banner/lona R$ 60/m² · adesivo R$ 80/m².</p>
                        </>
                    ) : null}

                    {aba === "wireo" ? (
                        <>
                            <h3>Wire-O — garra duplo anel</h3>
                            <div className="pg-form">
                                <label>
                                    Folhas
                                    <input value={folhas} onChange={(e) => setFolhas(e.target.value)} />
                                </label>
                                <label>
                                    Gramatura (g)
                                    <input value={gramatura} onChange={(e) => setGramatura(e.target.value)} />
                                </label>
                                <label>
                                    Espessura mm (opcional)
                                    <input value={mm} onChange={(e) => setMm(e.target.value)} placeholder="deixa em branco p/ usar folhas" />
                                </label>
                            </div>
                            <div className="pg-result" style={{ marginTop: 16 }}>
                                <span>Equivalente 75 g: {wire.folhasEq?.toFixed?.(0) || folhas} folhas</span>
                                <strong>{wire.diametro} · passo {wire.passo}</strong>
                                <span>Até {wire.folhas} folhas / {wire.mm} mm · furo {wire.furo} mm</span>
                                {wire.acima ? <span>Acima de 270 folhas — não cabe no Wire-O desta tabela.</span> : null}
                            </div>
                            <div className="pg-machines">
                                <span>Perfura</span>
                                <span>Fecha</span>
                                <span>Conjugada</span>
                                <span>{wire.passo === "3x1" ? "3 furos/pol · 6,5–14,5 mm" : "2 furos/pol · 16–31,5 mm"}</span>
                            </div>
                            <div style={{ overflow: "auto", marginTop: 14 }}>
                                <table className="pg-table">
                                    <thead>
                                        <tr>
                                            <th>Passo</th>
                                            <th>Ø</th>
                                            <th>Folhas 75 g</th>
                                            <th>mm</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {WIREO.map((row) => (
                                            <tr key={row.diametro} className={row.diametro === wire.diametro ? "is-on" : ""}>
                                                <td>{row.passo}</td>
                                                <td>{row.diametro}</td>
                                                <td>{row.folhas}</td>
                                                <td>{row.mm}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button type="button" className="idx-pill" style={{ marginTop: 12 }} onClick={() => addLinha(`Wire-O ${wire.diametro} ${wire.passo} (${folhas} fl)`, 0)}>
                                incluir acabamento
                            </button>
                        </>
                    ) : null}

                    {aba === "laser" ? (
                        <>
                            <h3>Custo laser P&amp;B</h3>
                            <div className="pg-form">
                                <label>
                                    Páginas
                                    <input value={paginas} onChange={(e) => setPaginas(e.target.value)} />
                                </label>
                                <label>
                                    Cobertura %
                                    <input
                                        value={cfg.cobertura}
                                        onChange={(e) => setCfg({ ...cfg, cobertura: Number(e.target.value) || 0 })}
                                    />
                                </label>
                                <label>
                                    Margem de venda %
                                    <input
                                        value={cfg.margem}
                                        onChange={(e) => setCfg({ ...cfg, margem: Number(e.target.value) || 0 })}
                                    />
                                </label>
                            </div>
                            <table className="pg-table" style={{ marginTop: 12 }}>
                                <thead>
                                    <tr>
                                        <th>Insumo</th>
                                        <th>Preço</th>
                                        <th>Rendimento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cfg.laserPb.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.nome}</td>
                                            <td>
                                                <input
                                                    value={item.preco}
                                                    onChange={(e) => setCfg((c) => ({
                                                        ...c,
                                                        laserPb: c.laserPb.map((x) => (x.id === item.id ? { ...x, preco: Number(e.target.value) || 0 } : x))
                                                    }))}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    value={item.rendimento}
                                                    onChange={(e) => setCfg((c) => ({
                                                        ...c,
                                                        laserPb: c.laserPb.map((x) => (x.id === item.id ? { ...x, rendimento: Number(e.target.value) || 0 } : x))
                                                    }))}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="pg-result" style={{ marginTop: 16 }}>
                                <span>Custo/página {formatarBRL(custoPagina)}</span>
                                <span>Custo {paginas} p. {formatarBRL(laserTotal)}</span>
                                <strong>Venda {formatarBRL(laserVenda)}</strong>
                            </div>
                            <button type="button" className="idx-pill" style={{ marginTop: 12 }} onClick={() => addLinha(`Impressão laser P&B ${paginas} p. (${cfg.cobertura}% cobertura)`, laserVenda)}>
                                incluir no orçamento
                            </button>
                            <p className="pg-hint">Valores do toner/cilindro da planilha Laser P&amp;B. Papel está zerado — preencha o preço da resma.</p>
                        </>
                    ) : null}

                    {aba === "servicos" ? (
                        <>
                            <h3>Serviços personalizados da loja</h3>
                            <input className="pg-search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar caneca, vinil, camisa…" />
                            <p className="pg-hint">Catálogo do grupo Personalizados (exportação da loja). Clique para lançar no orçamento.</p>
                            <div className="pg-serv">
                                {servicos.map((nome) => (
                                    <button key={nome} type="button" onClick={() => addLinha(nome, 0)}>
                                        {nome}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : null}
                </section>

                <aside className="pg-card">
                    <h3>Orçamento</h3>
                    <label>
                        Cliente
                        <input className="pg-search" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nome no kanban" />
                    </label>
                    <ul className="pg-quote">
                        {orcamento.map((item) => (
                            <li key={item.id}>
                                <span>{item.descricao}</span>
                                <span>
                                    {formatarBRL(item.valor)}
                                    <button type="button" aria-label="remover" onClick={() => setOrcamento((a) => a.filter((x) => x.id !== item.id))}>
                                        <Trash2 size={14} />
                                    </button>
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="pg-result">
                        <strong>{formatarBRL(soma)}</strong>
                    </div>
                    <button type="button" className="idx-pill" disabled={!orcamento.length} onClick={enviarPainel}>
                        enviar ao painel de produção
                    </button>
                    <p className="pg-hint">Grupos da loja: {GRUPOS_LOJA.slice(0, 6).join(", ")}…</p>
                    <p className="pg-hint">Materiais m²: {MATERIAIS_M2.map((m) => m.nome).join(" · ")}</p>
                </aside>
            </div>
        </div>
    );
}
