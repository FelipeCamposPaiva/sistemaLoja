import { Link, useLocation } from "react-router-dom";

import ROTAS from "../../constants/rotas";
import {
    AVISOS_RH,
    DOCUMENTOS_RH,
    EMPRESA_RH,
    FERIAS,
    FOLHAS_PONTO,
    GUIAS_FGTS,
    GUIAS_INSS,
    HOLERITES,
    INFORMES,
    RESCISOES,
    TIPO_HOLERITE,
    brl,
    competenciaBr,
    funcionarioPorId
} from "../../constants/rh";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/rh.css";

function dataBr(iso) {
    if (!iso) {
        return "—";
    }
    return iso.split("-").reverse().join("/");
}

function viewDe(pathname) {
    const mapa = {
        "/rescisoes": "rescisoes",
        "/informes": "informes",
        "/rh-avisos": "avisos",
        "/holerite": "holerites",
        "/guias": "guias",
        "/rh-documentos": "documentos"
    };
    return mapa[pathname] || "ferias";
}

const ABAS = [
    { id: "ferias", to: "/ferias", nome: "Férias" },
    { id: "rescisoes", to: "/rescisoes", nome: "Rescisões" },
    { id: "informes", to: "/informes", nome: "Informes" },
    { id: "holerites", to: "/holerite", nome: "Holerites" },
    { id: "guias", to: "/guias", nome: "Guias" },
    { id: "documentos", to: "/rh-documentos", nome: "Documentos" },
    { id: "avisos", to: "/rh-avisos", nome: "Avisos" }
];

const TITULO = {
    ferias: "Férias",
    rescisoes: "Rescisões",
    informes: "Informes de rendimentos",
    avisos: "Avisos RH",
    holerites: "Holerites",
    guias: "Guias INSS e FGTS",
    documentos: "Documentos da pasta RH"
};

function TabelaGuias({ titulo, linhas, total }) {
    return (
        <article className="rh-card">
            <h3>{titulo}</h3>
            <div className="rh-table-wrap">
                <table className="rh-table">
                    <thead>
                        <tr>
                            <th>Competência</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Arquivo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.map((g) => (
                            <tr key={g.arquivo}>
                                <td>{competenciaBr(g.competencia)}{g.obs ? ` · ${g.obs}` : ""}</td>
                                <td>{brl(g.valor)}</td>
                                <td>{dataBr(g.vencimento)}</td>
                                <td>{g.arquivo}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p><strong>Total {brl(total)}</strong></p>
        </article>
    );
}

export default function RhFolha() {
    const { pathname } = useLocation();
    const view = viewDe(pathname);
    const titulo = TITULO[view];
    const totalInss = GUIAS_INSS.reduce((s, g) => s + g.valor, 0);
    const totalFgts = GUIAS_FGTS.reduce((s, g) => s + g.valor, 0);

    return (
        <div className="rh-page">
            <nav className="rh-crumb">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <Link to="/funcionarios">Funcionários</Link>
                <span>›</span>
                <span>{titulo}</span>
            </nav>
            <header className="rh-head">
                <div>
                    <h2>{titulo}</h2>
                    <p>{EMPRESA_RH.nome} · CNPJ {EMPRESA_RH.cnpj} · folha {EMPRESA_RH.codigoFolha}</p>
                </div>
            </header>

            <nav className="rh-subnav">
                {ABAS.map((aba) => (
                    <Link key={aba.id} to={aba.to} className={view === aba.id ? "is-on" : ""}>
                        {aba.nome}
                    </Link>
                ))}
            </nav>

            {view === "ferias" && (
                <>
                    <p className="rh-muted">Programação com data-base 31/12/2026 · atualizada em 23/07/2026 · Canella & Santos Contabilidade.</p>
                    <div className="rh-table-wrap">
                        <table className="rh-table">
                            <thead>
                                <tr>
                                    <th>Empregado</th>
                                    <th>Admissão</th>
                                    <th>Aquisitivo</th>
                                    <th>Dias</th>
                                    <th>Limite p/ gozo</th>
                                    <th>Gozo</th>
                                    <th>Líquido</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {FERIAS.map((x, i) => {
                                    const f = funcionarioPorId(x.funcId);
                                    return (
                                        <tr key={i}>
                                            <td><Link to={`/funcionarios/${x.funcId}`}>{f?.nome}</Link></td>
                                            <td>{dataBr(f?.admissao)}</td>
                                            <td>{dataBr(x.aquisitivoIni)} a {dataBr(x.aquisitivoFim)}</td>
                                            <td>{x.vencidas} / gozo {x.gozo}</td>
                                            <td>{dataBr(x.limite)}</td>
                                            <td>{x.gozoIni ? `${dataBr(x.gozoIni)} a ${dataBr(x.gozoFim)}` : "—"}</td>
                                            <td>{x.liquido ? brl(x.liquido) : "—"}</td>
                                            <td>{x.status}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {FERIAS.filter((x) => x.liquido).map((x) => {
                        const f = funcionarioPorId(x.funcId);
                        return (
                            <article key={`rec-${x.funcId}`} className="rh-card rh-recibo">
                                <h3>Aviso e recibo de férias — {f?.nome}</h3>
                                <p>CTPS {f?.ctps}/{f?.ctpsSerie} · aquisitivo {dataBr(x.aquisitivoIni)} a {dataBr(x.aquisitivoFim)} · gozo {dataBr(x.gozoIni)} a {dataBr(x.gozoFim)} = 30 dias</p>
                                <ul>
                                    <li>Base de cálculo {brl(x.salarioBase)}</li>
                                    <li>Férias {brl(x.ferias)} + 1/3 {brl(x.terco)}</li>
                                    <li>INSS {brl(x.inss)}</li>
                                    <li>Proventos {brl(x.proventos)} · líquido {brl(x.liquido)}</li>
                                </ul>
                            </article>
                        );
                    })}
                </>
            )}

            {view === "rescisoes" && RESCISOES.map((r) => {
                const f = funcionarioPorId(r.funcId);
                return (
                    <article key={`${r.funcId}-${r.tipo}`} className="rh-card rh-recibo">
                        <h3>{f?.nome}</h3>
                        <p>{r.causa || "Aviso prévio do empregador"} · admissão {dataBr(f?.admissao)}</p>
                        {r.tipo === "aviso-empregador" && (
                            <>
                                <p>Aviso em {dataBr(r.data)} · permanece até {dataBr(r.termino)} ({r.diasAviso} dias).</p>
                                <p>Opções CLT art. 488: {r.opcoes.join(" ou ")}.</p>
                                {r.guiaFgts && (
                                    <div className="rh-bloco">
                                        <strong>GFD / GRRF competência {r.guiaFgts.competencia}</strong>
                                        <p>Identificador {r.guiaFgts.identificador} · pagar até {dataBr(r.guiaFgts.vencimento)}</p>
                                        <p>Rescisório {brl(r.guiaFgts.rescisório)} + encargos {brl(r.guiaFgts.encargos)} = {brl(r.guiaFgts.total)}</p>
                                    </div>
                                )}
                                <p className="rh-muted">Seguro-desemprego: 895 SEGURO DESEMP NADIA.pdf.</p>
                            </>
                        )}
                        {r.tipo === "trct" && (
                            <>
                                <p>Código {r.codigo} · afastamento {dataBr(r.data)}</p>
                                <div className="rh-table-wrap">
                                    <table className="rh-table">
                                        <thead><tr><th>Rubrica</th><th>Valor</th></tr></thead>
                                        <tbody>
                                            {r.verbas.map((v) => (
                                                <tr key={v.codigo}><td>{v.codigo} {v.nome}</td><td>{brl(v.valor)}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p>Bruto {brl(r.bruto)} · deduções {brl(r.deducoes)}</p>
                                {r.descontos.map((d) => <p key={d.codigo}>{d.codigo} {d.nome}: {brl(d.valor)}</p>)}
                                <p><strong>Líquido {brl(r.liquido)}</strong></p>
                                <p className="rh-muted">
                                    {r.funcId === 3 ? "Extrato FGTS: 895 EXTRATO FGTS LEONAM.pdf." : "Extrato FGTS: 895 EXTRATO FGTS NADIA.pdf · TRCT: 895 TRCT NADIA.pdf."}
                                </p>
                            </>
                        )}
                    </article>
                );
            })}

            {view === "informes" && (
                <div className="rh-informes">
                    {INFORMES.map((inf) => {
                        const f = funcionarioPorId(inf.funcId);
                        return (
                            <article key={inf.funcId} className="rh-card rh-informe">
                                <h3>Comprovante de rendimentos — exercício {inf.exercicio}</h3>
                                <p>Ano-calendário {inf.calendario} · rendimento do trabalho assalariado</p>
                                <p>Fonte: {EMPRESA_RH.nomeCurto} · {EMPRESA_RH.cnpj}</p>
                                <p>Beneficiário: {inf.eSocial} · {f?.cpf} · {f?.nome}</p>
                                <dl>
                                    <div><dt>Total dos rendimentos (inclusive férias)</dt><dd>{brl(inf.tributaveis)}</dd></div>
                                    <div><dt>Contribuição previdenciária oficial</dt><dd>{brl(inf.inss)}</dd></div>
                                    <div><dt>IRRF</dt><dd>{brl(inf.irrf)}</dd></div>
                                    <div><dt>13º salário</dt><dd>{brl(inf.decimo)}</dd></div>
                                    {inf.indenizacao ? <div><dt>Indenizações por rescisão</dt><dd>{brl(inf.indenizacao)}</dd></div> : null}
                                </dl>
                                <p className="rh-muted">Responsável {inf.responsavel} · {dataBr(inf.data)} · IN/SRF 1.215/2011</p>
                            </article>
                        );
                    })}
                </div>
            )}

            {view === "avisos" && (
                <ul className="rh-docs">
                    {AVISOS_RH.map((a) => {
                        const f = funcionarioPorId(a.funcId);
                        return (
                            <li key={a.id} className={`rh-alerta is-${a.gravidade}`}>
                                <strong>{a.titulo}</strong>
                                <span>{a.detalhe}</span>
                                <span>{dataBr(a.inicio)} a {dataBr(a.fim)} · <Link to={`/funcionarios/${a.funcId}`}>{f?.nome}</Link></span>
                            </li>
                        );
                    })}
                </ul>
            )}

            {view === "holerites" && (
                <>
                    <p className="rh-muted">Recibos da pasta 895 (11). Valores detalhados quando o PDF foi extraído; demais competências listam o arquivo.</p>
                    <div className="rh-table-wrap">
                        <table className="rh-table">
                            <thead>
                                <tr>
                                    <th>Competência</th>
                                    <th>Tipo</th>
                                    <th>Empregado</th>
                                    <th>Bruto</th>
                                    <th>INSS</th>
                                    <th>Líquido</th>
                                    <th>Arquivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {HOLERITES.map((h, i) => {
                                    const f = h.funcId ? funcionarioPorId(h.funcId) : null;
                                    return (
                                        <tr key={`${h.competencia}-${h.arquivo || i}`}>
                                            <td>{competenciaBr(h.competencia)}</td>
                                            <td>{TIPO_HOLERITE[h.tipo] || h.tipo}</td>
                                            <td>{f ? <Link to={`/funcionarios/${f.id}`}>{f.nome}</Link> : "Folha"}</td>
                                            <td>{h.bruto != null ? brl(h.bruto) : "—"}</td>
                                            <td>{h.inss != null ? brl(h.inss) : "—"}</td>
                                            <td>{h.liquido != null ? brl(h.liquido) : "—"}</td>
                                            <td>{h.arquivo || "—"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {view === "guias" && (
                <>
                    <section className="rh-kpis">
                        <article><span>INSS (DARF)</span><strong>{brl(totalInss)}</strong></article>
                        <article><span>FGTS Digital</span><strong>{brl(totalFgts)}</strong></article>
                        <article><span>Última competência</span><strong>07/2026</strong></article>
                    </section>
                    <TabelaGuias titulo="INSS / DARF previdenciário" linhas={GUIAS_INSS} total={totalInss} />
                    <TabelaGuias titulo="FGTS Digital" linhas={GUIAS_FGTS} total={totalFgts} />
                </>
            )}

            {view === "documentos" && (
                <>
                    <p className="rh-muted">Catálogo dos PDFs da pasta RH / 895. Os arquivos permanecem no disco original; o ERP guarda o nome e os dados extraídos.</p>
                    <div className="rh-table-wrap">
                        <table className="rh-table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Título</th>
                                    <th>Pessoa</th>
                                    <th>Data</th>
                                    <th>Arquivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DOCUMENTOS_RH.map((d) => {
                                    const f = d.funcId ? funcionarioPorId(d.funcId) : null;
                                    return (
                                        <tr key={d.id}>
                                            <td>{d.tipo}</td>
                                            <td>{d.titulo}</td>
                                            <td>{f ? <Link to={`/funcionarios/${f.id}`}>{f.nome}</Link> : "Empresa"}</td>
                                            <td>{dataBr(d.data)}</td>
                                            <td>{d.arquivo}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <article className="rh-card">
                        <h3>Folhas de ponto mensais</h3>
                        <ul className="rh-docs">
                            {FOLHAS_PONTO.map((p) => (
                                <li key={p.competencia}>
                                    <strong>{competenciaBr(p.competencia)}</strong>
                                    <span>{p.arquivo}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                    <article className="rh-card">
                        <h3>Empresa</h3>
                        <p>Abertura {dataBr(EMPRESA_RH.abertura)} · {EMPRESA_RH.natureza} · Simples desde {dataBr(EMPRESA_RH.simplesDesde)} · IE habilitada em {dataBr(EMPRESA_RH.ieDesde)}</p>
                        <p>CNAEs {EMPRESA_RH.cnaes.join(" · ")}</p>
                        <p className="rh-muted">Cadastro IE: {EMPRESA_RH.enderecoIE}</p>
                    </article>
                </>
            )}
        </div>
    );
}
