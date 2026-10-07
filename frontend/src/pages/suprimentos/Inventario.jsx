import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Printer } from "lucide-react";

import BuscaLocalizacao from "../../components/BuscaLocalizacao";
import ROTAS from "../../constants/rotas";
import { filtrarPorLocalizacao, imprimirProdutosLocalizacao, localizacaoDe } from "../../services/localizacao";
import { criarInventario, listarInventarios } from "../../services/inventario.service";
import { listarProdutos } from "../../services/produto.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/os.css";
import "../../styles/pages/produtos.css";
import "../../styles/pages/estoque.css";
import "../../styles/pages/localizacao.css";

function qtd(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 4 });
}

function dataHora(valor) {
    if (!valor) {
        return "—";
    }
    if (Array.isArray(valor) && valor.length >= 3) {
        const [y, m, d, h = 0, min = 0] = valor;
        return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? String(valor) : d.toLocaleString("pt-BR");
}

export default function Inventario() {
    const [params] = useSearchParams();
    const [produtos, setProdutos] = useState([]);
    const [inventarios, setInventarios] = useState([]);
    const [localizacao, setLocalizacao] = useState(params.get("localizacao") || "");
    const [filtroEstoque, setFiltroEstoque] = useState(params.get("estoque") || "todos");
    const [observacao, setObservacao] = useState("");
    const [aviso, setAviso] = useState("");

    async function carregar() {
        try {
            const [lista, regs] = await Promise.all([listarProdutos(), listarInventarios()]);
            setProdutos(Array.isArray(lista) ? lista : []);
            setInventarios(Array.isArray(regs) ? regs : []);
        } catch {
            setAviso("Não foi possível ler inventários ou produtos.");
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    const lista = useMemo(
        () => (localizacao.trim() ? filtrarPorLocalizacao(produtos, localizacao, filtroEstoque) : []),
        [produtos, localizacao, filtroEstoque]
    );

    async function novoInventario() {
        if (!localizacao.trim()) {
            setAviso("Informe a localização da contagem (ex.: PT-150).");
            return;
        }
        try {
            await criarInventario({
                localizacao: localizacao.trim(),
                observacao: observacao.trim() || `Contagem física ${localizacao.trim()}`
            });
            setObservacao("");
            setAviso(`Inventário da localização ${localizacao.trim()} aberto com ${lista.length} produto(s) para contar.`);
            carregar();
        } catch {
            setAviso("Erro ao criar inventário.");
        }
    }

    return (
        <div className="estoque-page os-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>suprimentos</span>
                <span>›</span>
                <span>inventário</span>
            </nav>
            <div className="estoque-topo fer-head">
                <div>
                    <small>SUPRIMENTOS</small>
                    <h1>Inventário por localização</h1>
                    <p className="idx-sub">Filtre a prateleira ou setor, imprima a lista de contagem e registre o inventário.</p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
            </div>

            <div className="card-movimento os-card">
                <h3>Contar uma localização</h3>
                <BuscaLocalizacao
                    produtos={produtos}
                    localizacao={localizacao}
                    onLocalizacao={setLocalizacao}
                    filtroEstoque={filtroEstoque}
                    onFiltroEstoque={setFiltroEstoque}
                />
                <input
                    placeholder="Observação da contagem"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                />
                <div className="loc-acoes">
                    <button type="button" className="btn-primary" onClick={novoInventario}>
                        criar inventário desta localização
                    </button>
                    <button
                        type="button"
                        className="prd-btn"
                        disabled={!lista.length}
                        onClick={() => imprimirProdutosLocalizacao(lista, localizacao)}
                    >
                        <Printer size={15} />
                        imprimir folha de contagem
                    </button>
                    <Link
                        className="prd-btn"
                        to={localizacao.trim() ? `${ROTAS.LOCALIZACOES}?localizacao=${encodeURIComponent(localizacao.trim())}` : ROTAS.LOCALIZACOES}
                    >
                        ver no mapa de prateleiras
                    </Link>
                </div>
            </div>

            <p className="loc-hint">
                {localizacao.trim()
                    ? `${lista.length} produto(s) em “${localizacao.trim()}” para conferir no estoque físico.`
                    : "Pesquise PT-150 (ou caixa/corredor/setor) para ver o que contar."}
            </p>

            <div className="card-tabela os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Produto</th>
                            <th>Localização</th>
                            <th>Estoque sistema</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!localizacao.trim() ? (
                            <tr>
                                <td colSpan={4} className="ctt-vazio">Informe a localização para listar os produtos.</td>
                            </tr>
                        ) : lista.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="ctt-vazio">Nenhum produto nesta localização.</td>
                            </tr>
                        ) : lista.map((p) => (
                            <tr key={p.id}>
                                <td>{p.sku || "—"}</td>
                                <td>{p.nome}</td>
                                <td>{localizacaoDe(p) || "—"}</td>
                                <td>{qtd(p.estoque)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card-tabela os-scroll">
                <h3>Inventários abertos</h3>
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Localização</th>
                            <th>Data</th>
                            <th>Observação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventarios.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="ctt-vazio">Nenhum inventário registrado.</td>
                            </tr>
                        ) : inventarios.map((item) => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td>{item.localizacao || item.localId || "—"}</td>
                                <td>{dataHora(item.dataInventario)}</td>
                                <td>{item.observacao || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
