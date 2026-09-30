import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Percent, Printer, Search, Tags } from "lucide-react";

import { emPromocao, moedaPreco, rotuloOff } from "../../constants/precoPromocional";
import ROTAS from "../../constants/rotas";
import { aplicarPromocao, listarProdutos, reajustarPrecos } from "../../services/produto.service";
import { imprimirEtiquetasGondola } from "../../services/etiquetaGondola";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/promocoes.css";

const ABAS = [
    { id: "promocao", label: "Promoções" },
    { id: "reajuste", label: "Reajuste de preços" },
    { id: "etiquetas", label: "Etiquetas de gôndola" }
];

export default function Promocoes() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [params] = useSearchParams();
    const aba = pathname.includes("reajuste")
        ? "reajuste"
        : (ABAS.some((a) => a.id === params.get("aba")) ? params.get("aba") : "promocao");
    const [lista, setLista] = useState([]);
    const [busca, setBusca] = useState("");
    const [marcados, setMarcados] = useState([]);
    const [aviso, setAviso] = useState("");
    const [ocupado, setOcupado] = useState(false);
    const [desconto, setDesconto] = useState("50");
    const [precoPromo, setPrecoPromo] = useState("");
    const [reajuste, setReajuste] = useState("10");

    async function carregar() {
        const dados = await listarProdutos();
        setLista(Array.isArray(dados) ? dados : []);
    }

    useEffect(() => {
        carregar().catch(() => setLista([]));
    }, []);

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return lista.filter((p) => {
            if (termo && ![p.nome, p.sku, p.gtin].join(" ").toLowerCase().includes(termo)) {
                return false;
            }
            if (aba === "promocao" && !termo && !emPromocao(p)) {
                return false;
            }
            return true;
        });
    }, [lista, busca, aba]);

    const selecionados = lista.filter((p) => marcados.includes(p.id));

    function escolherAba(id) {
        if (id === "reajuste") {
            navigate("/produtos/reajuste", { replace: true });
        } else if (id === "etiquetas") {
            navigate("/promocoes?aba=etiquetas", { replace: true });
        } else {
            navigate("/promocoes", { replace: true });
        }
        setMarcados([]);
        setAviso("");
    }

    function toggle(id) {
        setMarcados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
    }

    async function aplicarPromo() {
        if (!marcados.length) {
            setAviso("Selecione produtos.");
            return;
        }
        setOcupado(true);
        try {
            await aplicarPromocao(marcados, precoPromo
                ? { precoPromocional: Number(String(precoPromo).replace(",", ".")) }
                : { descontoPercentual: Number(String(desconto).replace(",", ".")) });
            await carregar();
            setAviso(`Promoção aplicada em ${marcados.length} produto(s).`);
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível aplicar a promoção.");
        } finally {
            setOcupado(false);
        }
    }

    async function limparPromo() {
        if (!marcados.length) {
            setAviso("Selecione produtos.");
            return;
        }
        setOcupado(true);
        try {
            await aplicarPromocao(marcados, { limparPromocao: true });
            await carregar();
            setAviso("Promoção removida.");
        } finally {
            setOcupado(false);
        }
    }

    async function aplicarReajuste() {
        if (!marcados.length) {
            setAviso("Selecione produtos.");
            return;
        }
        setOcupado(true);
        try {
            await reajustarPrecos(marcados, Number(String(reajuste).replace(",", ".")));
            await carregar();
            setAviso(`Reajuste de ${reajuste}% aplicado. O % de desconto da promoção foi mantido.`);
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível reajustar os preços.");
        } finally {
            setOcupado(false);
        }
    }

    function imprimir() {
        const alvos = selecionados.length ? selecionados : filtrados;
        if (!alvos.length) {
            setAviso("Selecione produtos ou filtre a lista.");
            return;
        }
        imprimirEtiquetasGondola(alvos);
    }

    return (
        <div className="prd-page promo-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>vendas</span>
                <span>›</span>
                <span>{ABAS.find((a) => a.id === aba)?.label}</span>
            </nav>

            <div className="fer-head">
                <div>
                    <h2>Preço promocional e etiquetas</h2>
                    <p className="prd-sub">
                        Preço normal, preço promocional e % de desconto se calculam juntos. A etiqueta de gôndola mostra
                        De / Por e o % OFF.
                    </p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <Link className="prd-btn" to={`${ROTAS.PRODUTOS}#list`}>voltar aos produtos</Link>
            </div>

            <div className="os-tabs">
                {ABAS.map((item) => (
                    <button key={item.id} type="button" className={aba === item.id ? "is-active" : ""} onClick={() => escolherAba(item.id)}>
                        {item.label}
                    </button>
                ))}
            </div>

            {aba === "promocao" ? (
                <div className="promo-acoes">
                    <label>
                        % de desconto
                        <input value={desconto} onChange={(e) => setDesconto(e.target.value)} />
                    </label>
                    <label>
                        ou preço promocional
                        <input type="number" step="0.01" value={precoPromo} onChange={(e) => setPrecoPromo(e.target.value)} placeholder="Opcional" />
                    </label>
                    <button type="button" className="prd-btn prd-btn-primary" disabled={ocupado} onClick={aplicarPromo}>
                        <Percent size={14} /> aplicar promoção
                    </button>
                    <button type="button" className="prd-btn" disabled={ocupado} onClick={limparPromo}>remover promoção</button>
                </div>
            ) : null}

            {aba === "reajuste" ? (
                <div className="promo-acoes">
                    <label>
                        Reajuste no preço normal (%)
                        <input value={reajuste} onChange={(e) => setReajuste(e.target.value)} />
                    </label>
                    <p className="prd-sub">Positivo aumenta, negativo reduz. O % OFF da promoção permanece e o preço promocional é recalculado.</p>
                    <button type="button" className="prd-btn prd-btn-primary" disabled={ocupado} onClick={aplicarReajuste}>
                        aplicar reajuste
                    </button>
                </div>
            ) : null}

            {aba === "etiquetas" ? (
                <div className="promo-acoes">
                    <p className="prd-sub">Imprime cartões De/Por com o percentual. Sem promoção, sai só o preço normal.</p>
                    <button type="button" className="prd-btn prd-btn-primary" onClick={imprimir}>
                        <Printer size={14} /> imprimir etiquetas
                    </button>
                </div>
            ) : null}

            <label className="fer-search">
                <Search size={15} />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto, SKU ou GTIN" />
            </label>

            <table className="fer-table prd-table">
                <thead>
                    <tr>
                        <th className="ctt-check">
                            <input
                                type="checkbox"
                                checked={filtrados.length > 0 && filtrados.every((p) => marcados.includes(p.id))}
                                onChange={(e) => setMarcados(e.target.checked ? filtrados.map((p) => p.id) : [])}
                            />
                        </th>
                        <th>Produto</th>
                        <th>SKU</th>
                        <th className="is-num">Normal</th>
                        <th className="is-num">Promocional</th>
                        <th className="is-num">% OFF</th>
                        <th>Etiqueta</th>
                    </tr>
                </thead>
                <tbody>
                    {filtrados.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="ctt-vazio">
                                {aba === "promocao" && !busca ? "Nenhum produto em promoção. Busque e aplique um %." : "Nenhum produto nesta lista."}
                            </td>
                        </tr>
                    ) : filtrados.map((p) => (
                        <tr key={p.id} className={marcados.includes(p.id) ? "is-sel" : ""}>
                            <td className="ctt-check">
                                <input type="checkbox" checked={marcados.includes(p.id)} onChange={() => toggle(p.id)} />
                            </td>
                            <td>{p.nome}</td>
                            <td>{p.sku || "—"}</td>
                            <td className="is-num">{moedaPreco(p.preco)}</td>
                            <td className="is-num">{emPromocao(p) ? moedaPreco(p.precoPromocional) : "—"}</td>
                            <td className="is-num">{emPromocao(p) ? `${p.descontoPercentual}%` : "—"}</td>
                            <td>{rotuloOff(p) || "Preço normal"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="prd-sub" style={{ marginTop: 10 }}>
                <Tags size={12} /> {selecionados.length} selecionado(s)
            </p>
        </div>
    );
}
