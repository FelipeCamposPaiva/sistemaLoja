import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { importarGestorLoja, metaGestor } from "../../constants/catalogoLoja";
import { formatarBRL } from "../../constants/grafica";

import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";

export default function ImportadorGestor() {
    const navigate = useNavigate();
    const [meta, setMeta] = useState(metaGestor);
    const [erro, setErro] = useState("");
    const [ok, setOk] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMeta(metaGestor());
    }, []);

    async function importar() {
        setErro("");
        setOk("");
        setLoading(true);
        try {
            const dados = await importarGestorLoja();
            setMeta(dados);
            setOk(`Catálogo da loja carregado: ${dados.produtos} produtos, ${dados.clientes} clientes, ${dados.fornecedores} fornecedores.`);
        } catch (e) {
            setErro(e.message || "Não foi possível importar.");
        } finally {
            setLoading(false);
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
                <span>exportação gestor</span>
            </nav>
            <div className="fer-head">
                <h2>Exportação Gestor — Tem de Tudo</h2>
                <button type="button" className="idx-pill int-add" onClick={importar} disabled={loading}>
                    {loading ? "importando…" : "importar agora"}
                </button>
            </div>
            <p className="fer-ajuda">
                Lê o JSON gerado da pasta empresa_14225 (produtos, clientes, fornecedores, grupos, marcas e formas de pagamento)
                e alimenta o PDV e o cadastro de contatos. O histórico de 47 mil vendas entra só como resumo de faturamento.
            </p>
            {erro ? <p className="fer-ajuda" style={{ color: "#f87171" }}>{erro}</p> : null}
            {ok ? <p className="fer-ajuda" style={{ color: "#4ade80" }}>{ok}</p> : null}
            {meta ? (
                <table className="fer-table">
                    <tbody>
                        <tr><th>Empresa</th><td>{meta.empresa}</td></tr>
                        <tr><th>Produtos</th><td>{meta.produtos}</td></tr>
                        <tr><th>Clientes</th><td>{meta.clientes}</td></tr>
                        <tr><th>Fornecedores</th><td>{meta.fornecedores}</td></tr>
                        <tr><th>Grupos / marcas</th><td>{meta.grupos} / {meta.marcas}</td></tr>
                        <tr><th>Vendas (resumo)</th><td>{meta.vendas} · {formatarBRL(meta.faturamento)}</td></tr>
                        <tr><th>Importado em</th><td>{meta.importadoEm ? new Date(meta.importadoEm).toLocaleString("pt-BR") : "ainda não"}</td></tr>
                    </tbody>
                </table>
            ) : (
                <p className="fer-ajuda">Nenhuma importação neste navegador. Clique em importar agora.</p>
            )}
            {meta?.porAno?.length ? (
                <table className="fer-table" style={{ marginTop: 16 }}>
                    <thead>
                        <tr>
                            <th>Ano</th>
                            <th>Vendas</th>
                            <th>Faturamento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {meta.porAno.map((ano) => (
                            <tr key={ano.ano}>
                                <td>{ano.ano}</td>
                                <td>{ano.qtd}</td>
                                <td>{formatarBRL(ano.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : null}
        </div>
    );
}
