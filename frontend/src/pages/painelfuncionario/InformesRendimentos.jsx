import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Download,
    FileText,
    Mail,
    Printer,
    Search,
    Users,
    X
} from "lucide-react";

import ROTAS from "../../constants/rotas";
import {
    EMPRESA_RH,
    brl,
    funcionarioPorId,
    informesDoExercicio,
    listarFuncionarios,
    nomePessoa,
    setorDoFuncionario
} from "../../constants/rh";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";
import "../../styles/pages/informes.css";

const TAMANHOS = [10, 20, 50];
const ANOS = [2026, 2025, 2024];
const CORES_AVATAR = ["#ec4899", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#14b8a6"];

function iniciais(nome) {
    return String(nome || "?")
        .split(/\s+/)
        .filter((parte) => parte && !["de", "da", "do", "dos", "das", "e"].includes(parte.toLowerCase()))
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");
}

function corAvatar(id) {
    return CORES_AVATAR[Math.abs(Number(id) || 0) % CORES_AVATAR.length];
}

function dataBr(iso) {
    if (!iso) {
        return "—";
    }
    return iso.split("-").reverse().join("/");
}

function money(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function csvValor(valor) {
    return `"${String(valor ?? "").replaceAll("\"", "\"\"")}"`;
}

function baixarCsv(linhas, ano) {
    const cab = ["Funcionário", "CPF", "Setor", "Cargo", "Rendimentos", "INSS", "IRRF", "13º", "Situação", "Ano-calendário"];
    const corpo = linhas.map((linha) => [
        linha.nome,
        linha.cpf,
        linha.setor,
        linha.cargo,
        linha.tributaveis,
        linha.inss,
        linha.irrf,
        linha.decimo,
        linha.status === "disponivel" ? "Disponível" : "Pendente",
        ano
    ].map(csvValor).join(";"));
    const blob = new Blob(["\uFEFF" + [cab.join(";"), ...corpo].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informes-rendimentos-${ano}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function htmlInforme(linha, ano) {
    return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Informe de rendimentos — ${linha.nome}</title>
<style>
  body{font-family:Arial,sans-serif;color:#1f2937;margin:32px;max-width:720px}
  h1{font-size:18px;margin:0 0 4px}
  p,li{font-size:13px;line-height:1.45}
  .muted{color:#6b7280}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  td{border-bottom:1px solid #f3d0e0;padding:8px 0;font-size:13px}
  td:last-child{text-align:right;font-weight:700}
</style></head><body>
  <h1>Comprovante de rendimentos pagos e de imposto sobre a renda retido na fonte</h1>
  <p class="muted">Ano-calendário ${ano} · exercício ${linha.exercicio} · IN/SRF 1.215/2011</p>
  <p><strong>Fonte pagadora:</strong> ${EMPRESA_RH.nome}<br>CNPJ ${EMPRESA_RH.cnpj}</p>
  <p><strong>Beneficiário:</strong> ${linha.nome}<br>CPF ${linha.cpf || "—"}</p>
  <table>
    <tr><td>Total dos rendimentos (inclusive férias)</td><td>${brl(linha.tributaveis)}</td></tr>
    <tr><td>Contribuição previdenciária oficial (INSS)</td><td>${brl(linha.inss)}</td></tr>
    <tr><td>Imposto de Renda Retido na Fonte (IRRF)</td><td>${brl(linha.irrf)}</td></tr>
    <tr><td>13º salário</td><td>${brl(linha.decimo)}</td></tr>
    ${linha.indenizacao ? `<tr><td>Indenizações por rescisão</td><td>${brl(linha.indenizacao)}</td></tr>` : ""}
  </table>
  <p class="muted">Responsável ${nomePessoa(linha.responsavel)} · ${dataBr(linha.data)}</p>
</body></html>`;
}

function abrirDocumento(linha, ano, imprimir) {
    const janela = window.open("", "_blank", "noopener,noreferrer");
    if (!janela) {
        return;
    }
    janela.document.write(htmlInforme(linha, ano));
    janela.document.close();
    if (imprimir) {
        janela.focus();
        janela.print();
    }
}

export default function InformesRendimentos() {
    const [ano, setAno] = useState(2026);
    const [busca, setBusca] = useState("");
    const [situacao, setSituacao] = useState("todas");
    const [setor, setSetor] = useState("todos");
    const [kpi, setKpi] = useState("todas");
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);
    const [marcados, setMarcados] = useState([]);
    const [selecionado, setSelecionado] = useState(32);
    const [aba, setAba] = useState("resumo");
    const [exportarAberto, setExportarAberto] = useState(false);
    const [aviso, setAviso] = useState("");
    const [gerados, setGerados] = useState({});

    const linhas = useMemo(() => {
        const existentes = informesDoExercicio(ano);
        const porFunc = new Map(existentes.map((item) => [String(item.funcId), item]));
        return listarFuncionarios().map((func) => {
            const inf = porFunc.get(String(func.id));
            const status = gerados[`${ano}-${func.id}`] || inf?.status || (inf ? "disponivel" : "pendente");
            return {
                id: func.id,
                nome: nomePessoa(func.nome),
                cargo: func.cargo || "Colaborador",
                cpf: func.cpf || "—",
                email: func.email || "",
                situacaoFunc: func.situacao,
                setor: setorDoFuncionario(func),
                eSocial: inf?.eSocial || func.eSocial || "—",
                tributaveis: inf?.tributaveis ?? 0,
                inss: inf?.inss ?? 0,
                irrf: inf?.irrf ?? 0,
                decimo: inf?.decimo ?? 0,
                indenizacao: inf?.indenizacao ?? 0,
                data: inf?.data || `${ano}-02-24`,
                responsavel: inf?.responsavel || "LEVI CARVALHO CANELLA",
                calendario: inf?.calendario || ano,
                exercicio: inf?.exercicio || ano,
                status
            };
        });
    }, [ano, gerados]);

    const setores = useMemo(() => [...new Set(linhas.map((l) => l.setor))].sort(), [linhas]);

    const filtradas = useMemo(() => {
        const q = busca.trim().toLowerCase();
        return linhas.filter((linha) => {
            if (situacao === "disponivel" && linha.status !== "disponivel") {
                return false;
            }
            if (situacao === "pendente" && linha.status !== "pendente") {
                return false;
            }
            if (setor !== "todos" && linha.setor !== setor) {
                return false;
            }
            if (kpi === "ativos" && !["ativo", "experiencia", "estagiario", "prolabore"].includes(linha.situacaoFunc)) {
                return false;
            }
            if (kpi === "disponiveis" && linha.status !== "disponivel") {
                return false;
            }
            if (kpi === "pendentes" && linha.status !== "pendente") {
                return false;
            }
            if (kpi === "processados" && linha.status !== "disponivel") {
                return false;
            }
            if (!q) {
                return true;
            }
            return [linha.nome, linha.cpf, linha.setor, linha.cargo].join(" ").toLowerCase().includes(q);
        });
    }, [linhas, busca, situacao, setor, kpi]);

    const kpis = useMemo(() => {
        const disponiveis = linhas.filter((l) => l.status === "disponivel").length;
        const ativos = linhas.filter((l) => ["ativo", "experiencia", "estagiario", "prolabore"].includes(l.situacaoFunc)).length;
        const pendentes = linhas.filter((l) => l.status === "pendente").length;
        const processados = disponiveis;
        const pct = linhas.length ? Math.round((processados / linhas.length) * 100) : 0;
        return { disponiveis, ativos, processados, pendentes, pct, total: linhas.length };
    }, [linhas]);

    const paginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
    const paginaAtual = Math.min(pagina, paginas);
    const inicio = (paginaAtual - 1) * porPagina;
    const visiveis = filtradas.slice(inicio, inicio + porPagina);
    const atual = linhas.find((l) => l.id === selecionado) || null;

    useEffect(() => {
        setPagina(1);
        setMarcados([]);
    }, [busca, situacao, setor, ano, kpi]);

    function limparFiltros() {
        setBusca("");
        setSituacao("todas");
        setSetor("todos");
        setKpi("todas");
        setPagina(1);
    }

    function toggleMarca(id) {
        setMarcados((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    }

    function gerarInformes() {
        const alvos = marcados.length ? marcados : linhas.filter((l) => l.status === "pendente").map((l) => l.id);
        if (!alvos.length) {
            setAviso("Não há informes pendentes para gerar.");
            return;
        }
        setGerados((atualMapa) => {
            const proximo = { ...atualMapa };
            alvos.forEach((id) => {
                proximo[`${ano}-${id}`] = "disponivel";
            });
            return proximo;
        });
        setKpi("todas");
        setSituacao("todas");
        setAviso(`${alvos.length} informe(s) gerado(s) para o ano-calendário ${ano}.`);
        setMarcados([]);
    }

    function exportar(lista) {
        baixarCsv(lista, ano);
        setExportarAberto(false);
        setAviso("Arquivo CSV exportado.");
    }

    function enviarEmail(linha) {
        const destino = linha.email || "";
        const assunto = encodeURIComponent(`Informe de rendimentos ${ano} — ${linha.nome}`);
        const corpo = encodeURIComponent(`Segue o informe de rendimentos de ${linha.nome} referente ao ano-calendário ${ano}.\n\nTotal dos rendimentos: ${brl(linha.tributaveis)}\nINSS: ${brl(linha.inss)}\nIRRF: ${brl(linha.irrf)}\n13º salário: ${brl(linha.decimo)}\n\n${EMPRESA_RH.nome}`);
        window.location.href = `mailto:${destino}?subject=${assunto}&body=${corpo}`;
    }

    return (
        <div className="ctt-page ctt-loja inf-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <Link to={ROTAS.FUNCIONARIOS}>Funcionários</Link>
                <span>›</span>
                <span>Informes de rendimentos</span>
            </nav>

            <div className="ctt-hero inf-hero">
                <div>
                    <h2>
                        <span className="inf-title-ico" aria-hidden><FileText size={18} /></span>
                        Informes de Rendimentos
                    </h2>
                    <p className="ctt-sub">Consulte, visualize e emita os Informes de rendimentos dos funcionários.</p>
                    {aviso ? <p className="ctt-sub ctt-ok">{aviso}</p> : null}
                </div>
                <div className="inf-hero-acoes">
                    <label className="inf-ano">
                        <span>Ano-calendário</span>
                        <select value={ano} onChange={(e) => setAno(Number(e.target.value))} aria-label="Ano-calendário">
                            {ANOS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </label>
                    <button type="button" className="ctt-btn-incluir inf-gerar" onClick={gerarInformes}>
                        <FileText size={15} /> Gerar informes
                    </button>
                    <div className="ctt-drop">
                        <button type="button" className="ctt-ghost inf-exportar" onClick={() => setExportarAberto((v) => !v)}>
                            <Download size={15} /> Exportar <ChevronDown size={14} />
                        </button>
                        {exportarAberto ? (
                            <div className="ctt-menu is-right inf-menu">
                                <button type="button" onClick={() => exportar(marcados.length ? linhas.filter((l) => marcados.includes(l.id)) : filtradas)}>
                                    Exportar CSV da lista
                                </button>
                                <button type="button" onClick={() => exportar(linhas)}>
                                    Exportar todos do ano
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <section className="inf-kpis" aria-label="Resumo">
                <button type="button" className={`inf-kpi${kpi === "disponiveis" ? " is-on" : ""}`} onClick={() => setKpi(kpi === "disponiveis" ? "todas" : "disponiveis")}>
                    <span className="inf-kpi-ico is-doc"><FileText size={16} /></span>
                    <strong>{kpis.disponiveis}</strong>
                    <small>Informes disponíveis</small>
                    <em>ano-calendário {ano}</em>
                </button>
                <button type="button" className={`inf-kpi${kpi === "ativos" ? " is-on" : ""}`} onClick={() => setKpi(kpi === "ativos" ? "todas" : "ativos")}>
                    <span className="inf-kpi-ico is-team"><Users size={16} /></span>
                    <strong>{kpis.ativos}</strong>
                    <small>Funcionários ativos</small>
                </button>
                <button type="button" className={`inf-kpi${kpi === "processados" ? " is-on" : ""}`} onClick={() => setKpi(kpi === "processados" ? "todas" : "processados")}>
                    <span className="inf-kpi-ico is-ok"><CheckCircle2 size={16} /></span>
                    <strong>{kpis.processados}</strong>
                    <small>Processados</small>
                    <em>{kpis.pct}%</em>
                </button>
                <button type="button" className={`inf-kpi is-warn${kpi === "pendentes" ? " is-on" : ""}`} onClick={() => setKpi(kpi === "pendentes" ? "todas" : "pendentes")}>
                    <span className="inf-kpi-ico is-wait"><Clock3 size={16} /></span>
                    <strong>{kpis.pendentes}</strong>
                    <small>Pendentes para gerar</small>
                </button>
                <aside className="inf-banner">
                    <div className="inf-banner-art" aria-hidden>
                        <FileText size={36} />
                        <span>INFORME DE RENDIMENTOS {ano}</span>
                    </div>
                    <div>
                        <h3>Informes de Rendimentos {ano}</h3>
                        <p>Os comprovantes referentes ao ano-calendário estão disponíveis para consulta e impressão.</p>
                    </div>
                </aside>
            </section>

            <div className="fer-filtros ctt-filtros inf-filtros">
                <label className="fer-search">
                    <Search size={16} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Pesquisar por nome, CPF ou setor..."
                        aria-label="Pesquisar informes"
                    />
                </label>
                <label className="inf-sel">
                    <span>Situação</span>
                    <select value={situacao} onChange={(e) => setSituacao(e.target.value)} aria-label="Situação">
                        <option value="todas">Todas</option>
                        <option value="disponivel">Disponível</option>
                        <option value="pendente">Pendente</option>
                    </select>
                </label>
                <label className="inf-sel">
                    <span>Setor</span>
                    <select value={setor} onChange={(e) => setSetor(e.target.value)} aria-label="Setor">
                        <option value="todos">Todos</option>
                        {setores.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </label>
                <button type="button" className="inf-limpar" onClick={limparFiltros}>
                    Limpar filtros
                </button>
            </div>

            <div className={`inf-split${atual ? " has-panel" : ""}`}>
                <div className="inf-lista has-pager">
                    <div className="inf-lista-head">Funcionários ({filtradas.length})</div>
                    <div className="erp-table-scroll inf-scroll">
                        <table className="fer-table os-table inf-table">
                            <thead>
                                <tr>
                                    <th className="ctt-check">
                                        <input
                                            type="checkbox"
                                            checked={visiveis.length > 0 && visiveis.every((l) => marcados.includes(l.id))}
                                            onChange={() => {
                                                const ids = visiveis.map((l) => l.id);
                                                const todos = ids.every((id) => marcados.includes(id));
                                                setMarcados(todos ? marcados.filter((id) => !ids.includes(id)) : [...new Set([...marcados, ...ids])]);
                                            }}
                                            aria-label="Selecionar visíveis"
                                        />
                                    </th>
                                    <th>Funcionários</th>
                                    <th>CPF</th>
                                    <th>Rendimentos (R$)</th>
                                    <th>INSS (R$)</th>
                                    <th>IRRF (R$)</th>
                                    <th>13º Salário (R$)</th>
                                    <th>Situação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visiveis.length === 0 ? (
                                    <tr><td colSpan={8} className="ctt-vazio">Nenhum informe encontrado para os filtros atuais.</td></tr>
                                ) : visiveis.map((linha) => (
                                    <tr
                                        key={linha.id}
                                        className={`${atual?.id === linha.id ? "is-sel" : ""}${marcados.includes(linha.id) ? " is-check" : ""}`}
                                        onClick={() => { setSelecionado(linha.id); setAba("resumo"); }}
                                    >
                                        <td className="ctt-check" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={marcados.includes(linha.id)}
                                                onChange={() => toggleMarca(linha.id)}
                                                aria-label={`Selecionar ${linha.nome}`}
                                            />
                                        </td>
                                        <td>
                                            <span className="inf-pessoa">
                                                <i style={{ background: corAvatar(linha.id) }}>{iniciais(linha.nome)}</i>
                                                <span>
                                                    <strong>{linha.nome}</strong>
                                                    <em>{linha.cargo}</em>
                                                </span>
                                            </span>
                                        </td>
                                        <td>{linha.cpf}</td>
                                        <td>{money(linha.tributaveis)}</td>
                                        <td>{money(linha.inss)}</td>
                                        <td>{money(linha.irrf)}</td>
                                        <td>{money(linha.decimo)}</td>
                                        <td>
                                            <span className={`inf-sit is-${linha.status}`}>
                                                {linha.status === "disponivel" ? "Disponível" : "Pendente"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="loc-pagina">
                        <span>
                            Mostrando {filtradas.length ? inicio + 1 : 0} a {Math.min(inicio + visiveis.length, filtradas.length)} de {filtradas.length} funcionários
                        </span>
                        <nav className="erp-pager-nav" aria-label="Páginas">
                            <button type="button" disabled={paginaAtual <= 1} onClick={() => setPagina(paginaAtual - 1)} aria-label="Anterior">
                                <ChevronLeft size={14} />
                            </button>
                            <button type="button" className="is-on">{paginaAtual}</button>
                            <button type="button" disabled={paginaAtual >= paginas} onClick={() => setPagina(paginaAtual + 1)} aria-label="Próxima">
                                <ChevronRight size={14} />
                            </button>
                        </nav>
                        <label className="erp-pager-size">
                            <select value={porPagina} onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }} aria-label="Itens por página">
                                {TAMANHOS.map((n) => (
                                    <option key={n} value={n}>{n} por página</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                {atual ? (
                    <aside className="inf-painel">
                        <header className="inf-painel-head">
                            <div>
                                <h3>Informe de Rendimentos</h3>
                            </div>
                            <button type="button" className="inf-fechar" onClick={() => setSelecionado(null)} aria-label="Fechar painel">
                                <X size={16} />
                            </button>
                        </header>
                        <div className="inf-perfil">
                            <i style={{ background: corAvatar(atual.id) }}>{iniciais(atual.nome)}</i>
                            <div>
                                <strong>{atual.nome}</strong>
                                <em>{atual.cargo}</em>
                                <span>Ano-calendário {ano}</span>
                            </div>
                            <span className={`inf-sit is-${atual.status}`}>
                                {atual.status === "disponivel" ? "Disponível" : "Pendente"}
                            </span>
                        </div>
                        <div className="inf-tabs">
                            {[
                                ["resumo", "Resumo"],
                                ["documento", "Documento"],
                                ["dados", "Dados do funcionário"]
                            ].map(([id, label]) => (
                                <button key={id} type="button" className={aba === id ? "is-on" : ""} onClick={() => setAba(id)}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {aba === "resumo" ? (
                            <>
                                <section className="inf-bloco">
                                    <h4>Resumo dos valores</h4>
                                    <dl>
                                        <div><dt>Total dos rendimentos (inclusive férias)</dt><dd>{brl(atual.tributaveis)}</dd></div>
                                        <div><dt>Contribuição previdenciária oficial (INSS)</dt><dd>{brl(atual.inss)}</dd></div>
                                        <div><dt>Imposto de Renda Retido na Fonte (IRRF)</dt><dd>{brl(atual.irrf)}</dd></div>
                                        <div><dt>13º salário</dt><dd>{brl(atual.decimo)}</dd></div>
                                        {atual.indenizacao ? <div><dt>Indenizações por rescisão</dt><dd>{brl(atual.indenizacao)}</dd></div> : null}
                                    </dl>
                                </section>
                                <section className="inf-bloco">
                                    <h4>Informações adicionais</h4>
                                    <dl>
                                        <div><dt>CPF</dt><dd>{atual.cpf}</dd></div>
                                        <div><dt>Beneficiário</dt><dd>{atual.nome}</dd></div>
                                        <div><dt>Fonte pagadora</dt><dd>{nomePessoa(EMPRESA_RH.nome)}</dd></div>
                                        <div><dt>CNPJ</dt><dd>{EMPRESA_RH.cnpj}</dd></div>
                                        <div><dt>Ano-calendário</dt><dd>{ano}</dd></div>
                                        <div><dt>Responsável</dt><dd>{nomePessoa(atual.responsavel)} · {dataBr(atual.data)} · IN/SRF 1.215/2011</dd></div>
                                    </dl>
                                </section>
                            </>
                        ) : null}

                        {aba === "documento" ? (
                            <section className="inf-bloco inf-doc">
                                <h4>Comprovante de rendimentos</h4>
                                <p>Rendimento do trabalho assalariado · exercício {atual.exercicio}</p>
                                <p>Fonte: {EMPRESA_RH.nomeCurto} · {EMPRESA_RH.cnpj}</p>
                                <p>Beneficiário: {atual.eSocial} · {atual.cpf} · {atual.nome}</p>
                            </section>
                        ) : null}

                        {aba === "dados" ? (
                            <section className="inf-bloco">
                                <h4>Dados do funcionário</h4>
                                <dl>
                                    <div><dt>Nome</dt><dd>{atual.nome}</dd></div>
                                    <div><dt>Cargo</dt><dd>{atual.cargo}</dd></div>
                                    <div><dt>Setor</dt><dd>{atual.setor}</dd></div>
                                    <div><dt>CPF</dt><dd>{atual.cpf}</dd></div>
                                    <div><dt>eSocial</dt><dd>{atual.eSocial}</dd></div>
                                    <div><dt>E-mail</dt><dd>{atual.email || "—"}</dd></div>
                                </dl>
                            </section>
                        ) : null}

                        <footer className="inf-acoes">
                            <button type="button" className="ctt-ghost" onClick={() => abrirDocumento(atual, ano, false)}>
                                <FileText size={14} /> Visualizar PDF
                            </button>
                            <button type="button" className="ctt-ghost" onClick={() => abrirDocumento(atual, ano, true)}>
                                <Download size={14} /> Baixar PDF
                            </button>
                            <button type="button" className="ctt-ghost" onClick={() => abrirDocumento(atual, ano, true)}>
                                <Printer size={14} /> Imprimir
                            </button>
                            <button type="button" className="ctt-btn-incluir inf-mail" onClick={() => enviarEmail(atual)}>
                                <Mail size={14} /> Enviar por e-mail
                            </button>
                        </footer>
                    </aside>
                ) : null}
            </div>
        </div>
    );
}
