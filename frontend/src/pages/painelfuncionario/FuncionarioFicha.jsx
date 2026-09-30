import { Link, useParams } from "react-router-dom";

import ROTAS from "../../constants/rotas";
import {
    EMPRESA_RH,
    FERIAS,
    INFORMES,
    RESCISOES,
    SITUACAO,
    TIPO_HOLERITE,
    brl,
    competenciaBr,
    documentosDe,
    documentosEmpresa,
    funcionarioPorId,
    holeritesDe
} from "../../constants/rh";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/rh.css";

function dataBr(iso) {
    if (!iso) {
        return "—";
    }
    if (iso.includes("/")) {
        return iso;
    }
    return iso.split("-").reverse().join("/");
}

export default function FuncionarioFicha() {
    const { id } = useParams();
    const f = funcionarioPorId(id);
    if (!f) {
        return (
            <div className="rh-page">
                <p>Funcionário não encontrado.</p>
                <Link to="/funcionarios">Voltar à equipe</Link>
            </div>
        );
    }
    const sit = SITUACAO[f.situacao] || SITUACAO.ativo;
    const docs = documentosDe(f.id);
    const docsEmpresa = documentosEmpresa();
    const ferias = FERIAS.filter((x) => String(x.funcId) === String(f.id));
    const rescisoes = RESCISOES.filter((x) => String(x.funcId) === String(f.id));
    const informe = INFORMES.find((x) => String(x.funcId) === String(f.id));
    const holerites = holeritesDe(f.id);

    return (
        <div className="rh-page">
            <nav className="rh-crumb">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <Link to="/funcionarios">Equipe</Link>
                <span>›</span>
                <span>{f.nome}</span>
            </nav>
            <header className="rh-head">
                <div>
                    <h2>{f.matricula} — {f.nome}</h2>
                    <p>{f.cargo || "Colaborador"} · {EMPRESA_RH.nomeCurto}</p>
                </div>
                <span className={`rh-pill is-${sit.classe}`}>{sit.nome}</span>
            </header>

            <article className="rh-ficha">
                <h3>Registro de empregado</h3>
                <p className="rh-emp">{EMPRESA_RH.nome} · CNPJ {EMPRESA_RH.cnpj}<br />{EMPRESA_RH.endereco}, {EMPRESA_RH.cidade}/{EMPRESA_RH.uf} · CEP {EMPRESA_RH.cep}</p>
                <dl className="rh-grid">
                    <div><dt>Matrícula / eSocial</dt><dd>{f.matricula} / {f.eSocial || "—"}</dd></div>
                    <div><dt>CPF</dt><dd>{f.cpf || "—"}</dd></div>
                    <div><dt>RG</dt><dd>{f.rg ? `${f.rg} · ${f.rgOrgao || ""}` : "—"}</dd></div>
                    <div><dt>CTPS</dt><dd>{f.ctps ? `${f.ctps}/${f.ctpsSerie} ${f.ctpsUf || ""}` : "—"}</dd></div>
                    <div><dt>PIS</dt><dd>{f.pis || "—"}</dd></div>
                    <div><dt>Nascimento</dt><dd>{dataBr(f.nascimento)} · {f.naturalidade || ""}</dd></div>
                    <div><dt>Sexo / cor / estado civil</dt><dd>{[f.sexo, f.cor, f.estadoCivil].filter(Boolean).join(" · ") || "—"}</dd></div>
                    <div><dt>Instrução</dt><dd>{f.instrucao || "—"}</dd></div>
                    <div><dt>Filiação</dt><dd>Pai: {f.pai || "—"} · Mãe: {f.mae || "—"}</dd></div>
                    <div><dt>Residência</dt><dd>{f.endereco ? `${f.endereco}, ${f.cidade}/${f.uf} · ${f.cep}` : "—"}</dd></div>
                    <div><dt>Celular</dt><dd>{f.celular || "—"}</dd></div>
                    <div><dt>Admissão</dt><dd>{dataBr(f.admissao)}</dd></div>
                    <div><dt>Cargo / CBO</dt><dd>{f.cargo || "—"}{f.cbo ? ` · ${f.cbo}` : ""}</dd></div>
                    <div><dt>Salário</dt><dd>{f.salario ? `${brl(f.salario)} / ${f.salarioPor || "mês"}` : "—"}</dd></div>
                    <div><dt>Expediente</dt><dd>{f.expediente || "—"}{f.intervalo ? ` · intervalo ${f.intervalo}` : ""}{f.sabado ? ` · sáb. ${f.sabado}` : ""}</dd></div>
                    <div><dt>FGTS opção</dt><dd>{dataBr(f.fgtsOpcao)}</dd></div>
                    <div><dt>Depto</dt><dd>{f.depto || "—"}</dd></div>
                    {f.experienciaFim ? <div><dt>Experiência</dt><dd>vence {dataBr(f.experienciaFim)}{f.experienciaProrrogacao ? ` · prorrogação ${dataBr(f.experienciaProrrogacao)}` : ""}</dd></div> : null}
                    {f.contrato ? <div><dt>Contrato</dt><dd>{f.contrato}</dd></div> : null}
                    {f.desligamento ? <div><dt>Desligamento</dt><dd>{dataBr(f.desligamento)} {f.causaAfastamento ? `· ${f.causaAfastamento}` : ""}</dd></div> : null}
                </dl>
                {f.dependentes?.length > 0 && (
                    <div className="rh-dep">
                        <h4>Dependentes / IR</h4>
                        <ul>
                            {f.dependentes.map((d) => (
                                <li key={d.cpf || d.nome}>{d.nome} · CPF {d.cpf} · nasc. {d.nascimento} · {d.parentesco}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </article>

            <section className="rh-cols">
                <article className="rh-card">
                    <h3>Documentos</h3>
                    {docs.length === 0 ? <p className="rh-muted">Nenhum documento individual nesta pasta.</p> : (
                    <ul className="rh-docs">
                        {docs.map((d) => (
                            <li key={d.id}>
                                <strong>{d.titulo}</strong>
                                <span>{dataBr(d.data)} · {d.arquivo}</span>
                                {d.itens ? <em>{d.itens.join(" · ")}</em> : null}
                                {d.observacao ? <em>{d.observacao}</em> : null}
                            </li>
                        ))}
                    </ul>
                    )}
                </article>
                <article className="rh-card">
                    <h3>Férias</h3>
                    {ferias.length === 0 ? <p className="rh-muted">Sem programação neste arquivo.</p> : ferias.map((x, i) => (
                        <div key={i} className="rh-bloco">
                            <p>Aquisitivo {dataBr(x.aquisitivoIni)} a {dataBr(x.aquisitivoFim)}</p>
                            <p>{x.vencidas} dias · limite {dataBr(x.limite)} · {x.status}</p>
                            {x.gozoIni ? <p>Gozo {dataBr(x.gozoIni)} a {dataBr(x.gozoFim)} · líquido {brl(x.liquido)}</p> : null}
                        </div>
                    ))}
                    {informe && (
                        <>
                            <h3>Informe {informe.calendario}</h3>
                            <p>Rendimentos {brl(informe.tributaveis)} · INSS {brl(informe.inss)} · 13º {brl(informe.decimo)}</p>
                            {informe.indenizacao ? <p>Indenização rescisória {brl(informe.indenizacao)}</p> : null}
                        </>
                    )}
                    {holerites.length > 0 && (
                        <>
                            <h3>Holerites</h3>
                            {holerites.map((h, i) => (
                                <p key={i}>{competenciaBr(h.competencia)} · {TIPO_HOLERITE[h.tipo] || h.tipo}{h.liquido != null ? ` · líquido ${brl(h.liquido)}` : ""}</p>
                            ))}
                            <Link to="/holerite">Ver holerites</Link>
                        </>
                    )}
                    {rescisoes.map((rescisao) => (
                        <div key={rescisao.tipo} className="rh-bloco">
                            <h3>Rescisão · {rescisao.tipo}</h3>
                            <p>{rescisao.causa || rescisao.tipo} · {dataBr(rescisao.data)}</p>
                            {rescisao.liquido ? <p>Líquido TRCT {brl(rescisao.liquido)}</p> : null}
                            {rescisao.guiaFgts ? <p>GFD {brl(rescisao.guiaFgts.total)} · venc. {dataBr(rescisao.guiaFgts.vencimento)}</p> : null}
                            <Link to="/rescisoes">Ver rescisões</Link>
                        </div>
                    ))}
                    {docsEmpresa.length > 0 && docs.length === 0 ? (
                        <p className="rh-muted">Documentos gerais da empresa estão em <Link to="/rh-documentos">Documentos RH</Link>.</p>
                    ) : null}
                </article>
            </section>
        </div>
    );
}
