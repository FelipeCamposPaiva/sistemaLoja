import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from "lucide-react";

import useAuth from "../../hooks/useAuth.jsx";
import { listarAgenda, salvarAgenda } from "../../services/agenda.service";
import { normalizarEmpresas, unidadeAtual, unidadesDestino } from "../../constants/empresas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/agenda.css";

const AGENDA_KEY = "erp-agenda-v1";
const SYNC_KEY = "erp-agenda-sync-v1";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = ["00", "15", "30", "45"];

const STATUS = [
    { id: "pendente", nome: "Pendente" },
    { id: "em_andamento", nome: "Em andamento" },
    { id: "pronto", nome: "Pronto" },
    { id: "finalizado", nome: "Finalizado" },
    { id: "atrasado", nome: "Atrasado" },
    { id: "cancelado", nome: "Cancelado" }
];

const USUARIOS = [
    "Administrador",
    "Adeline",
    "Arthur",
    "Cancella & Santos Contabilidade LTDA",
    "Elon",
    "Felipe",
    "Gabriela"
];

function inicioDoDia(data) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function mesmaData(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function adicionarDias(data, qtd) {
    const proxima = new Date(data);
    proxima.setDate(proxima.getDate() + qtd);
    return proxima;
}

function inicioSemana(data) {
    return adicionarDias(inicioDoDia(data), -data.getDay());
}

function celulasMes(data) {
    const primeiro = new Date(data.getFullYear(), data.getMonth(), 1);
    const inicio = adicionarDias(primeiro, -primeiro.getDay());
    return Array.from({ length: 42 }, (_, i) => adicionarDias(inicio, i));
}

function isoDia(data) {
    const y = data.getFullYear();
    const m = String(data.getMonth() + 1).padStart(2, "0");
    const d = String(data.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function brDia(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

function parseBr(valor) {
    const [d, m, y] = String(valor).split("/");
    if (!d || !m || !y) {
        return isoDia(new Date());
    }
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function tituloPeriodo(cursor, vista) {
    if (vista === "mensal") {
        return `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    }
    if (vista === "semanal") {
        const inicio = inicioSemana(cursor);
        const fim = adicionarDias(inicio, 6);
        if (inicio.getMonth() === fim.getMonth()) {
            return `${inicio.getDate()} a ${fim.getDate()} de ${MESES[inicio.getMonth()]} ${inicio.getFullYear()}`;
        }
        return `${inicio.getDate()} de ${MESES[inicio.getMonth()]} a ${fim.getDate()} de ${MESES[fim.getMonth()]} ${fim.getFullYear()}`;
    }
    const nome = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(cursor);
    const curto = nome.split("-")[0];
    return `${curto.charAt(0).toUpperCase()}${curto.slice(1)}, ${cursor.getDate()} de ${MESES[cursor.getMonth()]} de ${cursor.getFullYear()}`;
}

function lerJson(chave, padrao) {
    try {
        const bruto = localStorage.getItem(chave);
        return bruto ? JSON.parse(bruto) : padrao;
    } catch {
        return padrao;
    }
}

function nomeStatus(id) {
    return STATUS.find((item) => item.id === id)?.nome || id;
}

function icsDe(itens) {
    const linhas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ERP Tem de Tudo//Agenda//PT"];
    itens.forEach((item) => {
        const stamp = item.data.replaceAll("-", "");
        const hora = `${item.hora || "09"}${item.min || "00"}00`;
        linhas.push(
            "BEGIN:VEVENT",
            `UID:${item.id}@temdetudo`,
            `DTSTART:${stamp}T${hora}`,
            `SUMMARY:${(item.descricao || "Compromisso").replace(/\n/g, " ")}`,
            `DESCRIPTION:Status: ${nomeStatus(item.status)}\\nEmpresas: ${(item.empresas || []).join(", ")}`,
            "END:VEVENT"
        );
    });
    linhas.push("END:VCALENDAR");
    return linhas.join("\r\n");
}

function abrirNoGoogle(item) {
    const stamp = item.data.replaceAll("-", "");
    const ini = `${stamp}T${item.hora || "09"}${item.min || "00"}00`;
    const fimHora = String(Math.min(23, Number(item.hora || "09") + 1)).padStart(2, "0");
    const fim = `${stamp}T${fimHora}${item.min || "00"}00`;
    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", item.descricao || "Compromisso ERP");
    url.searchParams.set("dates", `${ini}/${fim}`);
    url.searchParams.set("details", `Status: ${nomeStatus(item.status)}`);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
}

function formVazio(data, hora = "09") {
    return {
        id: null,
        dataBr: brDia(isoDia(data)),
        hora,
        min: "00",
        usuarios: [],
        descricao: "",
        status: "pendente",
        empresas: [unidadeAtual().id],
        enviarGoogle: false
    };
}

export default function Agenda() {
    const { usuario } = useAuth();
    const meuNome = usuario?.nome || "Administrador";
    const hoje = useMemo(() => inicioDoDia(new Date()), []);
    const [cursor, setCursor] = useState(hoje);
    const [vista, setVista] = useState("mensal");
    const [aba, setAba] = useState("meus");
    const [itens, setItens] = useState([]);
    const [sync, setSync] = useState(() => {
        const bruto = lerJson(SYNC_KEY, {});
        return {
            empresaAtual: unidadeAtual().id,
            empresas: normalizarEmpresas(bruto.empresas || [unidadeAtual().id], { incluirAtual: true }),
            google: Boolean(bruto.google),
            googleQuando: bruto.googleQuando || null
        };
    });
    const [painel, setPainel] = useState(null);
    const [form, setForm] = useState(() => formVazio(hoje));
    const [listaUsuarios, setListaUsuarios] = useState(false);

    useEffect(() => {
        let vivo = true;
        listarAgenda()
            .then((dados) => {
                if (vivo) {
                    setItens(dados);
                }
            })
            .catch(() => {
                const local = lerJson(AGENDA_KEY, []);
                if (vivo) {
                    setItens(local);
                }
            });
        return () => {
            vivo = false;
        };
    }, []);

    useEffect(() => {
        localStorage.setItem(AGENDA_KEY, JSON.stringify(itens));
    }, [itens]);

    useEffect(() => {
        localStorage.setItem(SYNC_KEY, JSON.stringify(sync));
    }, [sync]);

    const usuariosBase = useMemo(
        () => Array.from(new Set([meuNome, ...USUARIOS])),
        [meuNome]
    );

    const visiveis = useMemo(() => {
        return itens.filter((item) => {
            const empresasItem = normalizarEmpresas(item.empresas);
            const nasEmpresas = empresasItem.some((id) => sync.empresas.includes(id));
            if (!nasEmpresas) {
                return false;
            }
            if (aba === "meus") {
                return (item.usuarios || []).includes(meuNome) || item.criadoPor === meuNome;
            }
            return !(item.usuarios || []).includes(meuNome);
        });
    }, [aba, itens, meuNome, sync.empresas]);

    function irHoje() {
        setCursor(hoje);
    }

    function navegar(direcao) {
        if (vista === "mensal") {
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + direcao, 1));
            return;
        }
        setCursor(adicionarDias(cursor, direcao * (vista === "semanal" ? 7 : 1)));
    }

    function compromissosDo(dia) {
        const chave = isoDia(dia);
        return visiveis.filter((item) => item.data === chave);
    }

    function abrirNovo(dia, hora = "09") {
        setCursor(dia);
        setForm({
            ...formVazio(dia, hora),
            usuarios: [meuNome],
            empresas: sync.empresas.length ? sync.empresas : [sync.empresaAtual]
        });
        setPainel("compromisso");
        setListaUsuarios(false);
    }

    function abrirItem(item) {
        setForm({
            id: item.id,
            dataBr: brDia(item.data),
            hora: item.hora,
            min: item.min,
            usuarios: item.usuarios || [],
            descricao: item.descricao || "",
            status: item.status || "pendente",
            empresas: item.empresas || [sync.empresaAtual],
            enviarGoogle: false
        });
        setPainel("compromisso");
        setListaUsuarios(false);
    }

    async function salvar() {
        if (!form.descricao.trim()) {
            return;
        }
        const registro = {
            id: form.id,
            data: parseBr(form.dataBr),
            hora: form.hora,
            min: form.min,
            descricao: form.descricao.trim(),
            usuarios: form.usuarios.length ? form.usuarios : [meuNome],
            status: form.id ? form.status : "pendente",
            empresas: normalizarEmpresas(form.empresas, { incluirAtual: true }),
            criadoPor: meuNome,
            google: Boolean(form.id && itens.find((i) => i.id === form.id)?.google) || form.enviarGoogle || sync.google
        };

        try {
            const salvo = await salvarAgenda(registro);
            setItens((atual) => {
                const resto = atual.filter((item) => item.id !== registro.id && item.id !== salvo.id);
                return [...resto, salvo];
            });
        } catch {
            setItens((atual) => {
                const fallback = { ...registro, id: registro.id || `evt-${Date.now()}` };
                const resto = atual.filter((item) => item.id !== fallback.id);
                return [...resto, fallback];
            });
        }

        if (registro.google || form.enviarGoogle) {
            abrirNoGoogle(registro);
            setSync((atual) => ({ ...atual, googleQuando: new Date().toISOString() }));
        }

        setPainel(null);
    }

    function sincronizarGoogle() {
        const blob = new Blob([icsDe(visiveis)], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "agenda-temdetudo.ics";
        a.click();
        URL.revokeObjectURL(url);
        setSync((atual) => ({
            ...atual,
            google: true,
            googleQuando: new Date().toISOString()
        }));
        if (visiveis[0]) {
            abrirNoGoogle(visiveis[0]);
        }
    }

    const diasMes = useMemo(() => celulasMes(cursor), [cursor]);
    const diasSemana = useMemo(() => {
        const inicio = inicioSemana(cursor);
        return Array.from({ length: 7 }, (_, i) => adicionarDias(inicio, i));
    }, [cursor]);
    const editando = Boolean(form.id);

    return (
        <div className={`agenda-shell${painel ? " has-drawer" : ""}`}>
            <div className="agenda-page">
                <nav className="dash-crumb" aria-label="Trilha">
                    <Link to="/index">início</Link>
                    <span>›</span>
                    <Link to="/home_agenda">agenda</Link>
                </nav>
                <div className="agenda-title-row">
                    <h2>Agenda</h2>
                    <div className="agenda-title-actions">
                        <button type="button" className="agenda-ghost" onClick={() => setPainel("sync")}>
                            <RefreshCw size={14} />
                            sincronizar
                        </button>
                        <button type="button" className="idx-pill" onClick={() => abrirNovo(cursor)}>
                            + compromisso
                        </button>
                    </div>
                </div>

                <div className="agenda-tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={aba === "meus"}
                        className={aba === "meus" ? "is-active" : ""}
                        onClick={() => setAba("meus")}
                    >
                        meus compromissos
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={aba === "outros"}
                        className={aba === "outros" ? "is-active" : ""}
                        onClick={() => setAba("outros")}
                    >
                        agendados para outros usuários
                    </button>
                </div>

                <div className="agenda-toolbar">
                    <div className="agenda-nav">
                        <button type="button" aria-label="Anterior" onClick={() => navegar(-1)}>
                            <ChevronLeft size={16} />
                        </button>
                        <button type="button" aria-label="Próximo" onClick={() => navegar(1)}>
                            <ChevronRight size={16} />
                        </button>
                        <button type="button" onClick={irHoje}>hoje</button>
                    </div>
                    <h3>{tituloPeriodo(cursor, vista)}</h3>
                    <div className="agenda-views">
                        {["mensal", "semanal", "diario"].map((opcao) => (
                            <button
                                key={opcao}
                                type="button"
                                className={vista === opcao ? "is-active" : ""}
                                onClick={() => setVista(opcao)}
                            >
                                {opcao === "diario" ? "diário" : opcao}
                            </button>
                        ))}
                    </div>
                </div>

                {vista === "mensal" ? (
                    <div className="agenda-month">
                        {DIAS.map((dia) => (
                            <div key={dia} className="agenda-head">{dia}</div>
                        ))}
                        {diasMes.map((dia) => {
                            const fora = dia.getMonth() !== cursor.getMonth();
                            const atual = mesmaData(dia, hoje);
                            const lista = compromissosDo(dia);
                            return (
                                <div
                                    key={dia.toISOString()}
                                    className={`agenda-cell${fora ? " is-out" : ""}${atual ? " is-today" : ""}`}
                                    onClick={() => abrirNovo(dia)}
                                >
                                    <button type="button" className="agenda-daynum" onClick={() => abrirNovo(dia)}>
                                        {dia.getDate()}
                                    </button>
                                    <div className="agenda-chips">
                                        {lista.slice(0, 3).map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                className={`st-${item.status}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    abrirItem(item);
                                                }}
                                            >
                                                {item.hora}:{item.min} {item.descricao}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={`agenda-time${vista === "diario" ? " is-day" : ""}`}>
                        <div className="agenda-time-head">
                            <span />
                            {(vista === "diario" ? [cursor] : diasSemana).map((dia) => (
                                <div
                                    key={dia.toISOString()}
                                    className={mesmaData(dia, hoje) ? "is-today" : ""}
                                >
                                    {DIAS[dia.getDay()]} {dia.getDate()}/{dia.getMonth() + 1}
                                </div>
                            ))}
                        </div>
                        <div className="agenda-time-body">
                            <div className="agenda-hours">
                                {HORAS.map((hora) => (
                                    <div key={hora}>{Number(hora)}:00</div>
                                ))}
                            </div>
                            {(vista === "diario" ? [cursor] : diasSemana).map((dia) => (
                                <div
                                    key={dia.toISOString()}
                                    className={`agenda-col${mesmaData(dia, hoje) ? " is-today" : ""}`}
                                >
                                    {HORAS.map((hora) => (
                                        <button
                                            key={hora}
                                            type="button"
                                            className="agenda-slot"
                                            onClick={() => abrirNovo(dia, hora)}
                                        >
                                            {compromissosDo(dia)
                                                .filter((item) => item.hora === hora)
                                                .map((item) => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        className={`st-${item.status}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            abrirItem(item);
                                                        }}
                                                    >
                                                        {item.min} {item.descricao}
                                                    </button>
                                                ))}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {painel === "compromisso" ? (
                <aside className="agenda-drawer" aria-label="Compromisso">
                    <header>
                        <h3>Compromisso</h3>
                        <button type="button" className="idx-text" onClick={() => setPainel(null)}>
                            fechar x
                        </button>
                    </header>

                    <label>
                        Data
                        <span className="agenda-date">
                            <input
                                value={form.dataBr}
                                onChange={(e) => setForm({ ...form, dataBr: e.target.value })}
                            />
                            <CalendarDays size={16} />
                        </span>
                    </label>

                    <div className="agenda-hora">
                        <label>
                            Hora
                            <select value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })}>
                                {HORAS.map((hora) => (
                                    <option key={hora} value={hora}>{hora}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Min
                            <select value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })}>
                                {MINUTOS.map((min) => (
                                    <option key={min} value={min}>{min}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label>
                        Para o usuário
                        <button
                            type="button"
                            className="agenda-select"
                            onClick={() => setListaUsuarios((v) => !v)}
                        >
                            {form.usuarios.length ? form.usuarios.join(", ") : "Selecionar"}
                        </button>
                    </label>
                    {listaUsuarios ? (
                        <ul className="agenda-checks">
                            {usuariosBase.map((nome) => (
                                <li key={nome}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={form.usuarios.includes(nome)}
                                            onChange={() => {
                                                setForm((atual) => {
                                                    const tem = atual.usuarios.includes(nome);
                                                    return {
                                                        ...atual,
                                                        usuarios: tem
                                                            ? atual.usuarios.filter((n) => n !== nome)
                                                            : [...atual.usuarios, nome]
                                                    };
                                                });
                                            }}
                                        />
                                        {nome}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    {editando ? (
                        <label>
                            Status
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                            >
                                {STATUS.map((item) => (
                                    <option key={item.id} value={item.id}>{item.nome}</option>
                                ))}
                            </select>
                        </label>
                    ) : (
                        <p className="agenda-hint">Depois de salvar, o compromisso recebe status (pendente, em andamento, pronto, finalizado…).</p>
                    )}

                    <label>
                        Empresas
                        <p className="agenda-hint">Você está em {unidadeAtual().nome}. Marque só as outras unidades.</p>
                        <ul className="agenda-checks is-compact">
                            {unidadesDestino().map((empresa) => (
                                <li key={empresa.id}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={form.empresas.includes(empresa.id)}
                                            onChange={() => {
                                                setForm((atual) => {
                                                    const tem = atual.empresas.includes(empresa.id);
                                                    const destinos = atual.empresas.filter((id) => id !== unidadeAtual().id && id !== empresa.id);
                                                    if (!tem) {
                                                        destinos.push(empresa.id);
                                                    }
                                                    return {
                                                        ...atual,
                                                        empresas: [unidadeAtual().id, ...destinos]
                                                    };
                                                });
                                            }}
                                        />
                                        {empresa.nome}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </label>

                    <label>
                        Descrição
                        <textarea
                            rows={6}
                            value={form.descricao}
                            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                        />
                    </label>

                    <label className="agenda-checkline">
                        <input
                            type="checkbox"
                            checked={form.enviarGoogle}
                            onChange={(e) => setForm({ ...form, enviarGoogle: e.target.checked })}
                        />
                        Enviar ao Google Agenda ao salvar
                    </label>

                    <div className="idx-drawer-actions">
                        <button type="button" className="idx-pill" onClick={salvar}>salvar</button>
                        <button type="button" className="idx-text" onClick={() => setPainel(null)}>cancelar</button>
                    </div>
                </aside>
            ) : null}

            {painel === "sync" ? (
                <aside className="agenda-drawer" aria-label="Sincronização">
                    <header>
                        <h3>Sincronização</h3>
                        <button type="button" className="idx-text" onClick={() => setPainel(null)}>
                            fechar x
                        </button>
                    </header>

                    <p className="agenda-hint">Espelhe a agenda nas outras unidades e exporte para o Google Agenda. {unidadeAtual().nome} já é a unidade atual.</p>

                    <h4>Outras unidades</h4>
                    <ul className="agenda-checks">
                        {unidadesDestino().map((empresa) => (
                            <li key={empresa.id}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={sync.empresas.includes(empresa.id)}
                                        onChange={() => {
                                            setSync((atual) => {
                                                const tem = atual.empresas.includes(empresa.id);
                                                const destinos = atual.empresas.filter((id) => id !== unidadeAtual().id && id !== empresa.id);
                                                if (!tem) {
                                                    destinos.push(empresa.id);
                                                }
                                                return {
                                                    ...atual,
                                                    empresaAtual: unidadeAtual().id,
                                                    empresas: [unidadeAtual().id, ...destinos]
                                                };
                                            });
                                        }}
                                    />
                                    {empresa.nome}
                                </label>
                            </li>
                        ))}
                    </ul>

                    <h4>Google Agenda</h4>
                    <p className="agenda-hint">
                        {sync.google
                            ? `Conectado. Última sincronização: ${sync.googleQuando ? new Date(sync.googleQuando).toLocaleString("pt-BR") : "agora"}.`
                            : "Gera um arquivo .ics e abre o Google Agenda para importar os compromissos visíveis."}
                    </p>
                    <button type="button" className="idx-pill" onClick={sincronizarGoogle}>
                        {sync.google ? "sincronizar agora" : "conectar Google Agenda"}
                    </button>
                </aside>
            ) : null}
        </div>
    );
}
