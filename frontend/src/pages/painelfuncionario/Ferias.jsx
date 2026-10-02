import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    FileText,
    Palmtree,
    Plane,
    Plus,
    Search,
    X
} from "lucide-react";

import ROTAS from "../../constants/rotas";
import {
    brl,
    funcionarioPorId,
    listarFerias,
    listarFuncionarios,
    salvarFerias
} from "../../constants/rh";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/ferias.css";

const ABAS = [
    { id: "todas", nome: "Todas" },
    { id: "programadas", nome: "Programadas" },
    { id: "em-ferias", nome: "Em férias" },
    { id: "encerradas", nome: "Encerradas" },
    { id: "proporcionais", nome: "Proporcionais" }
];

const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const STATUS = {
    programado: { nome: "Programado", classe: "prog" },
    aquisitivo: { nome: "Aquisitivo", classe: "aq" },
    encerrado: { nome: "Encerrado", classe: "enc" },
    "proporcional-rescisao": { nome: "Proporcional · Rescisão", classe: "prop" }
};

const AVATAR = ["#fb7185", "#f59e0b", "#38bdf8", "#a78bfa", "#34d399", "#f472b6", "#fb923c", "#60a5fa"];

function hojeISO() {
    const d = new Date();
    return isoDe(d);
}

function isoDe(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseISO(iso) {
    if (!iso) {
        return null;
    }
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function dataBr(iso) {
    const d = parseISO(iso);
    if (!d) {
        return "—";
    }
    return d.toLocaleDateString("pt-BR");
}

function diasEntre(ini, fim) {
    const a = parseISO(ini);
    const b = parseISO(fim);
    if (!a || !b) {
        return 0;
    }
    return Math.round((b - a) / 86400000) + 1;
}

function tituloNome(nome) {
    if (!nome) {
        return "—";
    }
    return nome.toLowerCase().replace(/(^|\s)\S/g, (s) => s.toUpperCase());
}

function nomeCurto(nome) {
    const partes = tituloNome(nome).split(" ").filter(Boolean);
    if (partes.length <= 2) {
        return partes.join(" ");
    }
    return `${partes[0]} ${partes[1]}`;
}

function iniciais(nome) {
    return tituloNome(nome)
        .split(" ")
        .filter((p) => p.length > 2)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase() || "—";
}

function corAvatar(nome) {
    let n = 0;
    for (const c of nome || "") {
        n += c.charCodeAt(0);
    }
    return AVATAR[n % AVATAR.length];
}

function emGozo(item, dia) {
    return Boolean(item.gozoIni && item.gozoFim && dia >= item.gozoIni && dia <= item.gozoFim);
}

function pessoaDe(item) {
    const f = funcionarioPorId(item.funcId);
    return {
        id: item.funcId,
        nome: item.nome || f?.nome || "—",
        cargo: item.cargo || f?.cargo || "—",
        admissao: item.admissao || f?.admissao,
        ctps: f?.ctps,
        ctpsSerie: f?.ctpsSerie
    };
}

function peso(item) {
    let n = 0;
    if (item.gozoIni) {
        n += 4;
    }
    if (item.liquido) {
        n += 2;
    }
    if (item.status === "programado") {
        n += 2;
    }
    if (item.status === "aquisitivo" || item.status === "encerrado") {
        n += 1;
    }
    return n;
}

function principais(lista) {
    const mapa = new Map();
    lista.forEach((item, i) => {
        const chave = item.id || `${item.funcId}-${item.aquisitivoIni || i}`;
        const atual = mapa.get(item.funcId);
        if (!atual || peso(item) > peso(atual.item)) {
            mapa.set(item.funcId, { item, chave });
        }
    });
    return [...mapa.values()].map(({ item, chave }) => ({ ...item, chave }));
}

function Avatar({ nome }) {
    return (
        <span className="ferias-av" style={{ background: corAvatar(nome) }}>{iniciais(nome)}</span>
    );
}

function Pill({ status }) {
    const meta = STATUS[status] || { nome: status, classe: "aq" };
    return <span className={`ferias-pill is-${meta.classe}`}>{meta.nome}</span>;
}

export default function Ferias() {
    const [tick, setTick] = useState(0);
    const [aba, setAba] = useState("todas");
    const [busca, setBusca] = useState("");
    const [ano, setAno] = useState(2026);
    const [mes, setMes] = useState(8);
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);
    const [sel, setSel] = useState(null);
    const [modal, setModal] = useState(false);

    const hoje = hojeISO();
    const todos = useMemo(() => listarFerias(), [tick]);
    const linhas = useMemo(() => principais(todos), [todos]);

    const kpis = useMemo(() => {
        const doAno = (p) => (p.gozoIni && p.gozoIni.startsWith(String(ano))) || (p.aquisitivoIni && p.aquisitivoIni.startsWith(String(ano)));
        const horizonte = parseISO(hoje);
        horizonte.setDate(horizonte.getDate() + 30);
        const ate = isoDe(horizonte);
        return {
            programadas: todos.filter((p) => p.status === "programado" && doAno(p)).length,
            emFerias: todos.filter((p) => emGozo(p, hoje)).length,
            proximas: todos.filter((p) => p.gozoIni && p.gozoIni >= hoje && p.gozoIni <= ate).length,
            aquisitivos: todos.filter((p) => p.status === "aquisitivo").length
        };
    }, [todos, ano, hoje]);

    const proximas = useMemo(() => {
        return linhas
            .filter((p) => p.gozoIni && p.gozoFim && p.gozoFim >= hoje)
            .sort((a, b) => a.gozoIni.localeCompare(b.gozoIni))
            .slice(0, 4);
    }, [linhas, hoje]);

    const filtradas = useMemo(() => {
        const q = busca.trim().toLowerCase();
        return linhas.filter((item) => {
            const p = pessoaDe(item);
            const noAno = [item.gozoIni, item.gozoFim, item.aquisitivoIni, item.aquisitivoFim, item.limite]
                .filter(Boolean)
                .some((d) => d.startsWith(String(ano)));
            if (!noAno) {
                return false;
            }
            if (aba === "programadas" && item.status !== "programado") {
                return false;
            }
            if (aba === "em-ferias" && !emGozo(item, hoje)) {
                return false;
            }
            if (aba === "encerradas" && item.status !== "encerrado") {
                return false;
            }
            if (aba === "proporcionais" && item.status !== "proporcional-rescisao") {
                return false;
            }
            if (q && ![p.nome, p.cargo, p.admissao].join(" ").toLowerCase().includes(q)) {
                return false;
            }
            return true;
        }).sort((a, b) => {
            const pesoData = (item) => {
                if (emGozo(item, hoje)) {
                    return `0-${item.gozoIni}`;
                }
                if (item.gozoIni && item.gozoIni >= hoje) {
                    return `1-${item.gozoIni}`;
                }
                if (item.gozoIni) {
                    return `2-${item.gozoIni}`;
                }
                return "3";
            };
            return pesoData(a).localeCompare(pesoData(b));
        });
    }, [linhas, aba, busca, ano, hoje]);

    const totalPag = Math.max(1, Math.ceil(filtradas.length / porPagina));
    const pageAtual = Math.min(pagina, totalPag);
    const fatia = filtradas.slice((pageAtual - 1) * porPagina, pageAtual * porPagina);
    const recibo = linhas.find((x) => (sel ? String(x.funcId) === String(sel) : x.liquido)) || fatia[0];
    const reciboPessoa = recibo ? pessoaDe(recibo) : null;

    const grade = useMemo(() => {
        const primeiro = new Date(ano, mes, 1);
        const start = new Date(primeiro);
        start.setDate(1 - primeiro.getDay());
        return Array.from({ length: 42 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }, [ano, mes]);

    function classeDia(d) {
        const iso = isoDe(d);
        const hits = todos.filter((p) => emGozo(p, iso));
        if (!hits.length) {
            return "";
        }
        if (hits.some((p) => emGozo(p, hoje)) && iso >= hoje) {
            return "is-gozo";
        }
        if (hits.some((p) => p.status === "programado")) {
            return "is-prog";
        }
        return "is-outra";
    }

    function daqui(item) {
        if (emGozo(item, hoje)) {
            return "Em férias";
        }
        const n = diasEntre(hoje, item.gozoIni) - 1;
        if (n === 1) {
            return "Daqui 1 dia";
        }
        if (n > 1) {
            return `Daqui ${n} dias`;
        }
        return "Hoje";
    }

    function mudarMes(delta) {
        const d = new Date(ano, mes + delta, 1);
        setAno(d.getFullYear());
        setMes(d.getMonth());
        setPagina(1);
    }

    return (
        <div className="ferias-page">
            <nav className="ferias-crumb">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <Link to={ROTAS.FUNCIONARIOS}>Funcionários</Link>
                <span>›</span>
                <span>Férias</span>
            </nav>

            <header className="ferias-head">
                <div>
                    <h1><Palmtree size={28} /> Gestão de Férias</h1>
                    <p>Controle os períodos de férias da sua equipe, consulte saldos e gere os documentos.</p>
                </div>
                <button type="button" className="ferias-cta" onClick={() => setModal(true)}>
                    <Plus size={16} /> Programar férias
                </button>
            </header>

            <section className="ferias-kpis">
                <article className="is-rosa">
                    <span className="ferias-kpi-ico"><CalendarDays size={18} /></span>
                    <div>
                        <strong>{kpis.programadas}</strong>
                        <b>Férias programadas</b>
                        <em>para este ano</em>
                    </div>
                </article>
                <article className="is-laranja">
                    <span className="ferias-kpi-ico"><Plane size={18} /></span>
                    <div>
                        <strong>{kpis.emFerias}</strong>
                        <b>Funcionários em férias</b>
                        <em>no momento</em>
                    </div>
                </article>
                <article className="is-roxa">
                    <span className="ferias-kpi-ico"><Clock3 size={18} /></span>
                    <div>
                        <strong>{kpis.proximas}</strong>
                        <b>Próximas férias</b>
                        <em>nos próximos 30 dias</em>
                    </div>
                </article>
                <article className="is-amarela">
                    <span className="ferias-kpi-ico"><FileText size={18} /></span>
                    <div>
                        <strong>{kpis.aquisitivos}</strong>
                        <b>Períodos aquisitivos</b>
                        <em>em andamento</em>
                    </div>
                </article>
            </section>

            <div className="ferias-topo">
                <article className="ferias-card">
                    <header>
                        <h2>Próximas férias</h2>
                        <p>Funcionários que sairão de férias em breve.</p>
                    </header>
                    {proximas.length === 0 ? (
                        <p className="ferias-vazio">Nenhuma saída programada a partir de hoje.</p>
                    ) : (
                        <ul className="ferias-prox">
                            {proximas.map((item) => {
                                const p = pessoaDe(item);
                                return (
                                    <li key={item.chave}>
                                        <Avatar nome={p.nome} />
                                        <div>
                                            <strong>{nomeCurto(p.nome)}</strong>
                                            <span>{dataBr(item.gozoIni)}</span>
                                            <em>{daqui(item)}</em>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </article>

                <article className="ferias-card ferias-cal-card">
                    <header>
                        <h2>Calendário de Férias</h2>
                        <div className="ferias-cal-nav">
                            <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior"><ChevronLeft size={16} /></button>
                            <strong>{MESES[mes]} {ano}</strong>
                            <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês"><ChevronRight size={16} /></button>
                        </div>
                        <ul className="ferias-legenda">
                            <li><i className="is-prog" /> Programadas</li>
                            <li><i className="is-gozo" /> Em férias</li>
                            <li><i className="is-outra" /> Outras</li>
                        </ul>
                    </header>
                    <div className="ferias-cal">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => <span key={d} className="ferias-dow">{d}</span>)}
                        {grade.map((d) => {
                            const iso = isoDe(d);
                            const fora = d.getMonth() !== mes;
                            return (
                                <span
                                    key={iso}
                                    className={`ferias-day ${fora ? "is-fora" : classeDia(d)} ${iso === hoje ? "is-hoje" : ""}`}
                                >
                                    {d.getDate()}
                                </span>
                            );
                        })}
                    </div>
                </article>
            </div>

            <div className="ferias-toolbar">
                <div className="ferias-tabs">
                    {ABAS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            className={aba === t.id ? "is-on" : ""}
                            onClick={() => { setAba(t.id); setPagina(1); }}
                        >
                            {t.nome}
                        </button>
                    ))}
                </div>
                <label className="ferias-busca">
                    <Search size={16} />
                    <input
                        value={busca}
                        onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                        placeholder="Pesquisar por nome, cargo ou departamento..."
                    />
                </label>
                <label className="ferias-ano">
                    Ano:
                    <select value={ano} onChange={(e) => { setAno(Number(e.target.value)); setPagina(1); }}>
                        {[2025, 2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                </label>
            </div>

            <div className="ferias-table-wrap">
                <table className="ferias-table">
                    <thead>
                        <tr>
                            <th />
                            <th>Funcionário</th>
                            <th>Admissão</th>
                            <th>Período aquisitivo</th>
                            <th>Período de férias</th>
                            <th>Dias</th>
                            <th>Limite p/ gozo</th>
                            <th>Gozo</th>
                            <th>Líquido</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fatia.map((item) => {
                            const p = pessoaDe(item);
                            const dias = item.gozoIni ? diasEntre(item.gozoIni, item.gozoFim) : (item.gozo || 0);
                            const on = String(sel || recibo?.funcId) === String(item.funcId);
                            return (
                                <tr key={item.chave} className={on ? "is-on" : ""} onClick={() => setSel(item.funcId)}>
                                    <td><input type="checkbox" checked={on} readOnly /></td>
                                    <td>
                                        {funcionarioPorId(item.funcId) ? (
                                            <Link to={`/funcionarios/${item.funcId}`}>
                                                <Avatar nome={p.nome} />
                                                <span>
                                                    <b>{tituloNome(p.nome)}</b>
                                                    <small>{p.cargo}</small>
                                                </span>
                                            </Link>
                                        ) : (
                                            <div className="ferias-nome">
                                                <Avatar nome={p.nome} />
                                                <span>
                                                    <b>{tituloNome(p.nome)}</b>
                                                    <small>{p.cargo}</small>
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td>{dataBr(p.admissao)}</td>
                                    <td>{dataBr(item.aquisitivoIni)} a {dataBr(item.aquisitivoFim)}</td>
                                    <td>{item.gozoIni ? `${dataBr(item.gozoIni)} a ${dataBr(item.gozoFim)}` : "—"}</td>
                                    <td>{dias || "—"}</td>
                                    <td>{dataBr(item.limite)}</td>
                                    <td>{item.gozoIni ? `${dataBr(item.gozoIni)} a ${dataBr(item.gozoFim)}` : "—"}</td>
                                    <td>{item.liquido ? brl(item.liquido) : "—"}</td>
                                    <td><Pill status={item.status} /></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <footer className="ferias-pag">
                <span>Mostrando {(pageAtual - 1) * porPagina + (fatia.length ? 1 : 0)} a {(pageAtual - 1) * porPagina + fatia.length} de {filtradas.length} funcionários</span>
                <div>
                    <button type="button" disabled={pageAtual <= 1} onClick={() => setPagina(pageAtual - 1)}><ChevronLeft size={14} /></button>
                    <strong>{pageAtual}</strong>
                    <button type="button" disabled={pageAtual >= totalPag} onClick={() => setPagina(pageAtual + 1)}><ChevronRight size={14} /></button>
                    <select value={porPagina} onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }}>
                        {[8, 10, 20].map((n) => <option key={n} value={n}>{n} por página</option>)}
                    </select>
                </div>
            </footer>

            {recibo && reciboPessoa && (
                <aside className="ferias-recibo">
                    <FileText size={18} />
                    <div>
                        <strong>Aviso e recibo de férias — {reciboPessoa.nome}</strong>
                        <span>
                            {reciboPessoa.ctps ? `CTPS ${reciboPessoa.ctps}/${reciboPessoa.ctpsSerie}` : "Sem CTPS no cadastro"}
                            {recibo.gozoIni ? ` · Período ${dataBr(recibo.gozoIni)} a ${dataBr(recibo.gozoFim)} (${diasEntre(recibo.gozoIni, recibo.gozoFim)} dias)` : ""}
                        </span>
                    </div>
                    <dl>
                        <div><dt>Base de cálculo</dt><dd>{recibo.salarioBase ? brl(recibo.salarioBase) : "—"}</dd></div>
                        <div><dt>Férias (1/3)</dt><dd>{recibo.terco ? brl(recibo.terco) : "—"}</dd></div>
                        <div><dt>INSS</dt><dd>{recibo.inss != null ? brl(recibo.inss) : "—"}</dd></div>
                        <div><dt>Proventos</dt><dd>{recibo.proventos ? brl(recibo.proventos) : "—"}</dd></div>
                        <div><dt>Líquido</dt><dd>{recibo.liquido ? brl(recibo.liquido) : "—"}</dd></div>
                    </dl>
                    <Link to={funcionarioPorId(recibo.funcId) ? `/funcionarios/${recibo.funcId}` : "/funcionarios"}>Ver detalhes </Link>
                </aside>
            )}

            {modal ? (
                <ModalProgramar
                    onFechar={() => setModal(false)}
                    onSalvar={() => { setModal(false); setTick((n) => n + 1); }}
                />
            ) : null}
        </div>
    );
}

function ModalProgramar({ onFechar, onSalvar }) {
    const equipe = listarFuncionarios().filter((f) => f.situacao !== "desligado");
    const [form, setForm] = useState({
        funcId: String(equipe[0]?.id || ""),
        gozoIni: "",
        gozoFim: "",
        aquisitivoIni: "",
        aquisitivoFim: ""
    });
    const [erro, setErro] = useState("");
    const dias = diasEntre(form.gozoIni, form.gozoFim);

    function setCampo(campo, valor) {
        setForm((atual) => ({ ...atual, [campo]: valor }));
    }

    function salvar(ev) {
        ev.preventDefault();
        if (!form.funcId || !form.gozoIni || !form.gozoFim) {
            setErro("Informe o funcionário e o período de gozo.");
            return;
        }
        if (form.gozoFim < form.gozoIni) {
            setErro("A data final precisa ser igual ou posterior à inicial.");
            return;
        }
        const f = funcionarioPorId(form.funcId);
        const aIni = form.aquisitivoIni || f?.admissao || form.gozoIni;
        const aFim = form.aquisitivoFim || isoDe(new Date(parseISO(aIni).getFullYear() + 1, parseISO(aIni).getMonth(), parseISO(aIni).getDate() - 1));
        const limite = isoDe(new Date(parseISO(aFim).getFullYear(), parseISO(aFim).getMonth() + 11, parseISO(aFim).getDate()));
        salvarFerias({
            id: Date.now(),
            funcId: Number(form.funcId) || form.funcId,
            aquisitivoIni: aIni,
            aquisitivoFim: aFim,
            gozoIni: form.gozoIni,
            gozoFim: form.gozoFim,
            gozo: dias,
            vencidas: dias,
            limite,
            status: "programado"
        });
        onSalvar();
    }

    return (
        <div className="ferias-overlay" onClick={onFechar}>
            <form className="ferias-modal" onClick={(e) => e.stopPropagation()} onSubmit={salvar}>
                <header>
                    <h2>Programar férias</h2>
                    <button type="button" onClick={onFechar} aria-label="Fechar"><X size={16} /></button>
                </header>
                <label>
                    <span>Funcionário</span>
                    <select value={form.funcId} onChange={(e) => setCampo("funcId", e.target.value)}>
                        {equipe.map((f) => (
                            <option key={f.id} value={f.id}>{tituloNome(f.nome)}</option>
                        ))}
                    </select>
                </label>
                <div className="ferias-modal-grid">
                    <label>
                        <span>Início do gozo</span>
                        <input type="date" value={form.gozoIni} onChange={(e) => setCampo("gozoIni", e.target.value)} />
                    </label>
                    <label>
                        <span>Fim do gozo</span>
                        <input type="date" value={form.gozoFim} onChange={(e) => setCampo("gozoFim", e.target.value)} />
                    </label>
                    <label>
                        <span>Aquisitivo início</span>
                        <input type="date" value={form.aquisitivoIni} onChange={(e) => setCampo("aquisitivoIni", e.target.value)} />
                    </label>
                    <label>
                        <span>Aquisitivo fim</span>
                        <input type="date" value={form.aquisitivoFim} onChange={(e) => setCampo("aquisitivoFim", e.target.value)} />
                    </label>
                </div>
                <p className="ferias-dias">{dias ? `${dias} dias corridos` : "Informe as datas para calcular os dias."}</p>
                {erro ? <p className="ferias-erro">{erro}</p> : null}
                <footer>
                    <button type="button" className="ferias-ghost" onClick={onFechar}>Cancelar</button>
                    <button type="submit" className="ferias-cta">Salvar programação</button>
                </footer>
            </form>
        </div>
    );
}
