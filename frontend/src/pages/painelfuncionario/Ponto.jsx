import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ArrowRightLeft,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Coffee,
    Download,
    Fingerprint,
    LogIn,
    LogOut,
    MapPin,
    Printer,
    Send
} from "lucide-react";

import { lerContatos } from "../../constants/contatos";
import ROTAS from "../../constants/rotas";
import useAuth from "../../hooks/useAuth.jsx";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/ponto.css";

const PONTO_KEY = "erp-ponto-v4";
const JORNADA_UTIL = 8 * 60;
const JORNADA_SAB = 4 * 60;
const SEMANA = JORNADA_UTIL * 5 + JORNADA_SAB;
const EMPRESA = {
    nome: "TEM DE TUDO PAPELARIA, PRESENTES E PERSONALIZADOS",
    cnpj: "40.424.076/0001-69",
    atividade: "Comércio varejista de artigos de armarinho",
    endereco: "Av. Visconde do Rio Branco",
    local: "Av. Visconde do Rio Branco · Volta Redonda/RJ"
};
const DIAS_PT = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES_PT = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
const MARCACOES = [
    { campo: "e1", nome: "Entrada", classe: "entrada", Icon: LogIn },
    { campo: "s1", nome: "Intervalo", classe: "intervalo", Icon: Coffee },
    { campo: "e2", nome: "Retorno", classe: "retorno", Icon: ArrowRightLeft },
    { campo: "s2", nome: "Saída", classe: "saida", Icon: LogOut }
];
const FERIADOS = [
    { mes: 8, dia: 7, nome: "Independência do Brasil" },
    { mes: 9, dia: 12, nome: "Nossa Senhora Aparecida" },
    { mes: 10, dia: 2, nome: "Finados" },
    { mes: 10, dia: 15, nome: "Proclamação da República" },
    { mes: 11, dia: 25, nome: "Natal" }
];
function tipoDia(data) {
    const sem = data.getDay();
    if (sem === 0) {
        return "domingo";
    }
    if (sem === 6) {
        return "sabado";
    }
    return "util";
}

function jornadaDoDia(data) {
    const tipo = tipoDia(data);
    if (tipo === "domingo") {
        return 0;
    }
    if (tipo === "sabado") {
        return JORNADA_SAB;
    }
    return JORNADA_UTIL;
}

function rotuloJornada(data) {
    const tipo = tipoDia(data);
    if (tipo === "domingo") {
        return "Folga";
    }
    if (tipo === "sabado") {
        return "08:30–12:30";
    }
    return "08:30–18:30";
}

function minutos(hora) {
    if (!hora || hora === "00:00:00" || hora === "00:00") {
        return null;
    }
    const [h, m, s] = hora.split(":").map(Number);
    return h * 60 + m + Math.floor((s || 0) / 60);
}

function fmt(min, vazio = "00:00") {
    if (min == null || Number.isNaN(min)) {
        return vazio;
    }
    const sinal = min < 0 ? "-" : "";
    const abs = Math.abs(Math.round(min));
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return `${sinal}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fmtSinal(min) {
    if (min == null) {
        return "00:00";
    }
    const abs = fmt(Math.abs(min));
    if (min > 0) {
        return `+${abs}`;
    }
    if (min < 0) {
        return `-${abs}`;
    }
    return abs;
}

function isoDia(data) {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function horaAgora(data = new Date()) {
    return data.toTimeString().slice(0, 8);
}

function inicioSemana(data) {
    const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    const delta = d.getDay() === 0 ? -6 : 1 - d.getDay();
    d.setDate(d.getDate() + delta);
    return d;
}

function funcionarios() {
    const lista = lerContatos().filter((c) => (c.tipos || []).includes("funcionario") && !c.excluido);
    const comFicha = lista.map((c) => {
        if (String(c.id) !== "32") {
            return c;
        }
        return {
            ...c,
            matricula: c.matricula || "001",
            profissao: c.profissao || "Vendedora",
            ctps: c.ctps || "12063091/722",
            depto: c.depto || "001 - GERAL"
        };
    });
    if (comFicha.length) {
        return comFicha;
    }
    return [{ id: 32, nome: "ELEN LACERDA CLARO", celular: "(24) 99984-6374", matricula: "001", profissao: "Vendedora", ctps: "12063091/722", depto: "001 - GERAL" }];
}

function lerStore() {
    try {
        return JSON.parse(localStorage.getItem(PONTO_KEY) || "{}");
    } catch {
        return {};
    }
}

function gravarStore(dados) {
    localStorage.setItem(PONTO_KEY, JSON.stringify(dados));
}

function padraoDia(data) {
    const tipo = tipoDia(data);
    const folga = tipo === "domingo";
    return {
        e1: "",
        s1: "",
        e2: "",
        s2: "",
        justificativa: folga ? "Domingo" : "",
        status: folga ? "descanso" : "pendente",
        local: ""
    };
}

function amostraAgosto(data) {
    const base = padraoDia(data);
    const d = data.getDate();
    const tipo = tipoDia(data);
    if (tipo === "domingo") {
        return base;
    }
    if (d === 15) {
        return { ...base, justificativa: "Feriado municipal", status: "abonado" };
    }
    if (d === 20) {
        return { ...base, justificativa: "Atestado médico", status: "abonado" };
    }
    const i = d % 5;
    if (tipo === "sabado") {
        const inicios = ["08:30:00", "08:32:00", "08:28:00", "08:35:00", "08:31:00"];
        const fins = ["12:30:00", "12:32:00", "12:28:00", "12:35:00", "12:30:00"];
        return {
            ...base,
            e1: inicios[i],
            s2: fins[i],
            status: "ok",
            local: EMPRESA.local
        };
    }
    const entradas = ["08:30:12", "08:32:00", "08:28:00", "08:31:00", "08:35:00"];
    const saidas = ["18:32:00", "18:30:00", "18:28:00", "18:35:00", "18:31:00"];
    return {
        ...base,
        e1: entradas[i],
        s1: "12:00:00",
        e2: "14:00:00",
        s2: saidas[i],
        status: "ok",
        local: EMPRESA.local
    };
}

function amostraPassado(data, hoje) {
    const base = padraoDia(data);
    if (data >= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) {
        return base;
    }
    if (data.getFullYear() === 2026 && data.getMonth() === 7) {
        return amostraAgosto(data);
    }
    const tipo = tipoDia(data);
    if (tipo === "domingo") {
        return base;
    }
    const i = data.getDate() % 5;
    if (tipo === "sabado") {
        return {
            ...base,
            e1: ["08:30:00", "08:33:00", "08:28:00", "08:31:00", "08:36:00"][i],
            s2: ["12:30:00", "12:28:00", "12:32:00", "12:31:00", "12:35:00"][i],
            status: "ok",
            local: EMPRESA.local
        };
    }
    return {
        ...base,
        e1: ["08:32:00", "08:30:00", "08:28:00", "08:35:00", "08:31:00"][i],
        s1: ["12:01:00", "12:00:00", "12:04:00", "11:58:00", "12:02:00"][i],
        e2: ["14:00:00", "14:02:00", "13:59:00", "14:05:00", "14:01:00"][i],
        s2: ["18:32:00", "18:30:00", "18:28:00", "18:35:00", "18:31:00"][i],
        status: "ok",
        local: EMPRESA.local
    };
}

function totalPeriodos(reg, agora) {
    const a = minutos(reg.e1);
    const b = minutos(reg.s1);
    const c = minutos(reg.e2);
    const d = minutos(reg.s2);
    const agoraMin = agora.getHours() * 60 + agora.getMinutes() + agora.getSeconds() / 60;
    if (a == null) {
        return { trabalhado: 0, intervalo: 0, aberto: false };
    }
    if (b == null && c == null) {
        if (d == null) {
            return { trabalhado: Math.max(0, agoraMin - a), intervalo: 0, aberto: true };
        }
        return { trabalhado: Math.max(0, d - a), intervalo: 0, aberto: false };
    }
    if (b == null) {
        return { trabalhado: Math.max(0, agoraMin - a), intervalo: 0, aberto: true };
    }
    const manha = Math.max(0, b - a);
    if (c == null) {
        return { trabalhado: manha, intervalo: Math.max(0, agoraMin - b), aberto: true };
    }
    const pause = Math.max(0, c - b);
    if (d == null) {
        return { trabalhado: manha + Math.max(0, agoraMin - c), intervalo: pause, aberto: true };
    }
    return { trabalhado: manha + Math.max(0, d - c), intervalo: pause, aberto: false };
}

function proximoCampo(reg, data) {
    if (tipoDia(data) === "domingo") {
        return null;
    }
    if (!reg?.e1) {
        return "e1";
    }
    if (tipoDia(data) === "sabado") {
        return reg.s2 ? null : "s2";
    }
    if (!reg?.s1) {
        return "s1";
    }
    if (!reg?.e2) {
        return "e2";
    }
    if (!reg?.s2) {
        return "s2";
    }
    return null;
}

function ultimaMarcacao(reg) {
    for (let i = MARCACOES.length - 1; i >= 0; i -= 1) {
        const item = MARCACOES[i];
        if (reg?.[item.campo]) {
            return { ...item, hora: reg[item.campo] };
        }
    }
    return null;
}

function proximoFeriado(hoje) {
    const ano = hoje.getFullYear();
    const lista = FERIADOS.map((f) => ({
        ...f,
        data: new Date(ano, f.mes, f.dia)
    })).concat(FERIADOS.map((f) => ({
        ...f,
        data: new Date(ano + 1, f.mes, f.dia)
    })));
    return lista.find((f) => f.data >= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
}

function viewDe(pathname) {
    if (pathname.endsWith("/registros")) {
        return "registros";
    }
    if (pathname.endsWith("/espelho")) {
        return "espelho";
    }
    if (pathname.endsWith("/ajustes")) {
        return "ajustes";
    }
    if (pathname.endsWith("/relatorios")) {
        return "relatorios";
    }
    return "marcar";
}

const ABAS = [
    { id: "marcar", to: "/ponto", nome: "Marcar Ponto" },
    { id: "registros", to: "/ponto/registros", nome: "Meus Registros" },
    { id: "espelho", to: "/ponto/espelho", nome: "Espelho de Ponto" },
    { id: "ajustes", to: "/ponto/ajustes", nome: "Ajustes de Ponto" },
    { id: "relatorios", to: "/ponto/relatorios", nome: "Relatórios" }
];

function Pill({ status, aberto }) {
    if (status === "descanso") {
        return <span className="pto-pill is-dsr">Folga</span>;
    }
    if (status === "abonado") {
        return <span className="pto-pill is-abono">Abonado</span>;
    }
    if (aberto) {
        return <span className="pto-pill is-andamento">Em andamento</span>;
    }
    if (status === "ok") {
        return <span className="pto-pill is-fechado">Fechado</span>;
    }
    return <span className="pto-pill is-pendente">Pendente</span>;
}

export default function Ponto() {
    const { usuario } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const view = viewDe(pathname);
    const equipe = useMemo(() => funcionarios(), []);
    const [funcId, setFuncId] = useState(() => {
        const elen = equipe.find((f) => String(f.id) === "32" || /ELEN LACERDA/i.test(f.nome));
        return elen?.id || equipe[0]?.id || 1;
    });
    const [agora, setAgora] = useState(() => new Date());
    const [store, setStore] = useState(lerStore);
    const [ref, setRef] = useState(() => new Date(agora.getFullYear(), agora.getMonth(), 1));
    const [toast, setToast] = useState("");
    const [ajuste, setAjuste] = useState({ data: isoDia(new Date()), tipo: "e1", hora: "08:30", motivo: "" });

    const funcionario = equipe.find((f) => String(f.id) === String(funcId)) || equipe[0];
    const bloco = store[funcId] || { dias: {}, ajustes: [], statusMes: {} };

    useEffect(() => {
        const id = setInterval(() => setAgora(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!toast) {
            return undefined;
        }
        const id = setTimeout(() => setToast(""), 2800);
        return () => clearTimeout(id);
    }, [toast]);

    useEffect(() => {
        const hoje = new Date();
        setStore((atual) => {
            const atualBloco = atual[funcId] || { dias: {}, ajustes: [], statusMes: {} };
            if (Object.keys(atualBloco.dias || {}).length) {
                return atual;
            }
            const dias = {};
            for (let i = 21; i >= 1; i -= 1) {
                const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
                dias[isoDia(d)] = amostraPassado(d, hoje);
            }
            if (hoje.getFullYear() === 2026) {
                for (let dia = 1; dia <= 31; dia += 1) {
                    const d = new Date(2026, 7, dia);
                    if (d.getMonth() !== 7) {
                        break;
                    }
                    const id = isoDia(d);
                    if (!dias[id]) {
                        dias[id] = amostraAgosto(d);
                    }
                }
            }
            const proximo = {
                ...atual,
                [funcId]: { ...atualBloco, dias }
            };
            gravarStore(proximo);
            return proximo;
        });
    }, [funcId]);

    function diaDe(data) {
        const id = isoDia(data);
        const modelo = data.getFullYear() === 2026 && data.getMonth() === 7
            ? amostraAgosto(data)
            : padraoDia(data);
        return { data, id, ...modelo, ...(bloco.dias[id] || {}) };
    }

    function salvarDias(mutator) {
        setStore((atual) => {
            const atualBloco = atual[funcId] || { dias: {}, ajustes: [], statusMes: {} };
            const proximoBloco = mutator(atualBloco);
            const proximo = { ...atual, [funcId]: proximoBloco };
            gravarStore(proximo);
            return proximo;
        });
    }

    function marcar(campo) {
        const hoje = diaDe(agora);
        if (proximoCampo(hoje, agora) !== campo) {
            return;
        }
        salvarDias((atualBloco) => ({
            ...atualBloco,
            dias: {
                ...atualBloco.dias,
                [hoje.id]: {
                    ...hoje,
                    [campo]: horaAgora(agora),
                    local: EMPRESA.local,
                    status: "ok"
                }
            }
        }));
        const nome = MARCACOES.find((m) => m.campo === campo)?.nome;
        setToast(`${nome} registrada às ${horaAgora(agora).slice(0, 5)}`);
    }

    function atualizarCampo(id, campo, valor) {
        salvarDias((atualBloco) => ({
            ...atualBloco,
            dias: {
                ...atualBloco.dias,
                [id]: { ...(atualBloco.dias[id] || {}), [campo]: valor }
            }
        }));
    }

    const hojeReg = diaDe(agora);
    const totaisHoje = totalPeriodos(hojeReg, agora);
    const previstoHoje = jornadaDoDia(agora);
    const saldoHoje = !hojeReg.e1
        ? 0
        : totaisHoje.aberto
            ? previstoHoje - totaisHoje.trabalhado
            : totaisHoje.trabalhado - previstoHoje;
    const proximo = proximoCampo(hojeReg, agora);
    const tipoHoje = tipoDia(agora);
    const ultima = ultimaMarcacao(hojeReg);
    const feriado = proximoFeriado(agora);

    const semana = useMemo(() => {
        const ini = inicioSemana(agora);
        return Array.from({ length: 7 }, (_, i) => {
            const data = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i);
            const reg = diaDe(data);
            const totais = totalPeriodos(reg, agora);
            return { ...reg, totais, hoje: isoDia(data) === isoDia(agora) };
        });
    }, [agora, bloco, funcId]);

    const horasSemana = semana.reduce((acc, d) => acc + d.totais.trabalhado, 0);
    const pctSemana = Math.min(100, Math.round((horasSemana / SEMANA) * 100));

    const ultimos = useMemo(() => {
        return Array.from({ length: 10 }, (_, i) => {
            const data = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - i);
            const reg = diaDe(data);
            const totais = totalPeriodos(reg, agora);
            const previsto = jornadaDoDia(data);
            const util = previsto > 0 && reg.status !== "abonado" && reg.status !== "descanso";
            const hoje = isoDia(data) === isoDia(agora);
            const saldo = !util || (hoje && !(reg.s2 || (tipoDia(data) === "sabado" && reg.s2))) ? 0 : totais.trabalhado - previsto;
            return { ...reg, totais, saldo, hoje };
        });
    }, [agora, bloco, funcId]);

    const ano = ref.getFullYear();
    const mes = ref.getMonth();
    const diasMes = useMemo(() => {
        const ultimo = new Date(ano, mes + 1, 0).getDate();
        return Array.from({ length: ultimo }, (_, i) => diaDe(new Date(ano, mes, i + 1)));
    }, [ano, mes, bloco, funcId]);

    const resumoMes = useMemo(() => {
        let trabalhadas = 0;
        let previstas = 0;
        let faltas = 0;
        let abonos = 0;
        let dsr = 0;
        const hojeNum = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
        diasMes.forEach((d) => {
            const t = totalPeriodos(d, agora).trabalhado;
            if (tipoDia(d.data) === "domingo" || d.status === "descanso") {
                dsr += 1;
                return;
            }
            if (d.data.getTime() > hojeNum) {
                return;
            }
            trabalhadas += t;
            if (d.data.getTime() === hojeNum && !d.s2) {
                return;
            }
            previstas += jornadaDoDia(d.data);
            if (d.status === "abonado") {
                abonos += 1;
            } else if (t === 0 && d.data.getTime() < hojeNum) {
                faltas += 1;
            }
        });
        return { trabalhadas, previstas, saldo: trabalhadas - previstas, faltas, abonos, dsr };
    }, [diasMes, agora]);

    const pendencias = ultimos.filter((d) => {
        const sem = d.data.getDay();
        if (tipoDia(d.data) === "domingo" || d.status === "abonado" || d.hoje) {
            return false;
        }
        return !d.e1 || !d.s2;
    }).length;

    const ajustes = bloco.ajustes || [];
    const statusMes = bloco.statusMes?.[`${ano}-${String(mes + 1).padStart(2, "0")}`] || "rascunho";
    const abaAtual = ABAS.find((a) => a.id === view) || ABAS[0];
    const dataLonga = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(agora);
    const dataLongaFmt = dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1);

    function exportar() {
        const linhas = [["Data", "Dia", "Entrada", "Intervalo", "Retorno", "Saída", "Total", "Saldo", "Justificativa"].join(";")];
        diasMes.forEach((d) => {
            const t = totalPeriodos(d, agora).trabalhado;
            const sem = d.data.getDay();
            const previsto = jornadaDoDia(d.data);
            const util = previsto > 0 && d.status !== "abonado";
            linhas.push([
                d.data.toLocaleDateString("pt-BR"),
                DIAS_PT[sem],
                d.e1, d.s1, d.e2, d.s2,
                fmt(t),
                util ? fmtSinal(t - previsto) : "00:00",
                d.justificativa
            ].join(";"));
        });
        const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `ponto-${funcionario?.nome || "folha"}-${ano}-${mes + 1}.csv`;
        a.click();
    }

    function enviarAjuste(e) {
        e.preventDefault();
        if (!ajuste.motivo.trim()) {
            return;
        }
        salvarDias((atualBloco) => ({
            ...atualBloco,
            ajustes: [
                {
                    id: Date.now(),
                    ...ajuste,
                    status: "pendente",
                    criadoEm: new Date().toISOString()
                },
                ...(atualBloco.ajustes || [])
            ]
        }));
        setAjuste({ ...ajuste, motivo: "" });
        setToast("Ajuste enviado para aprovação");
    }

    function enviarMes() {
        salvarDias((atualBloco) => ({
            ...atualBloco,
            statusMes: { ...(atualBloco.statusMes || {}), [`${ano}-${String(mes + 1).padStart(2, "0")}`]: "enviado" }
        }));
        setToast("Espelho enviado para aprovação");
    }

    const matricula = funcionario?.matricula || String(funcionario?.id || 0).padStart(3, "0");
    const cargo = funcionario?.profissao || "Colaborador";
    const ultimoMesDia = new Date(ano, mes + 1, 0).getDate();
    const periodoFolha = `01/${String(mes + 1).padStart(2, "0")}/${ano} a ${String(ultimoMesDia).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`;

    return (
        <div className="pto-board">
            <nav className="pto-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <span>Ponto</span>
                <span>›</span>
                <span>{abaAtual.nome}</span>
            </nav>

            <header className="pto-top">
                <div>
                    <h2>Meu Ponto</h2>
                    <p>Marcações do dia, jornada, banco de horas e espelho mensal.</p>
                </div>
                <nav className="pto-tabs" aria-label="Seções do ponto">
                    {ABAS.map((aba) => (
                        <NavLink
                            key={aba.id}
                            to={aba.to}
                            end={aba.id === "marcar"}
                            className={({ isActive }) => `pto-tab${isActive ? " is-on" : ""}`}
                        >
                            {aba.nome}
                        </NavLink>
                    ))}
                </nav>
            </header>

            {toast ? <div className="pto-toast" role="status">{toast}</div> : null}

            {view === "marcar" && (
                <>
                    <section className="pto-grid-top">
                        <article className="pto-card pto-clock">
                            <span className="pto-kicker">Data e hora atual</span>
                            <strong className="pto-hora">{agora.toTimeString().slice(0, 8)}</strong>
                            <p>{dataLongaFmt}</p>
                            <em className="pto-sync">✓ Horário sincronizado</em>
                        </article>

                        <article className="pto-card pto-marcar">
                            <header>
                                <h3>Marcar Ponto</h3>
                                <Fingerprint size={22} />
                            </header>
                            <div className="pto-mark-grid">
                                {MARCACOES.map(({ campo, nome, classe, Icon }) => (
                                    <button
                                        key={campo}
                                        type="button"
                                        className={`pto-mark-btn is-${classe}${proximo === campo ? " is-next" : ""}`}
                                        disabled={proximo !== campo}
                                        onClick={() => marcar(campo)}
                                    >
                                        <Icon size={18} />
                                        {nome}
                                    </button>
                                ))}
                            </div>
                            <footer>
                                {tipoHoje === "domingo"
                                    ? "Folga de domingo — sem marcação."
                                    : ultima
                                        ? `Última marcação: ${ultima.nome} às ${ultima.hora.slice(0, 5)}`
                                        : tipoHoje === "sabado"
                                            ? "Sábado: expediente 08:30–12:30, sem intervalo."
                                            : "Nenhuma marcação hoje. Expediente 08:30–18:30, intervalo 12:00–14:00."}
                            </footer>
                        </article>

                        <article className="pto-card pto-resumo">
                            <h3>Resumo do dia</h3>
                            <ul>
                                <li><span>Jornada prevista</span><strong>{fmt(previstoHoje)}</strong></li>
                                <li><span>Trabalhado</span><strong>{fmt(totaisHoje.trabalhado)}</strong></li>
                                <li><span>Intervalo</span><strong>{fmt(totaisHoje.intervalo)}</strong></li>
                                <li>
                                    <span>Saldo do dia</span>
                                    <strong className={saldoHoje >= 0 ? "is-pos" : "is-neg"}>{fmtSinal(saldoHoje)}</strong>
                                </li>
                            </ul>
                        </article>
                    </section>

                    <section className="pto-grid-mid">
                        <article className="pto-card">
                            <h3>Resumo da semana</h3>
                            <div className="pto-week">
                                {semana.map((d) => (
                                    <div key={d.id} className={`pto-week-day${d.hoje ? " is-hoje" : ""}${d.status === "descanso" ? " is-dsr" : ""}`}>
                                        <small>{DIAS_CURTO[d.data.getDay()]}</small>
                                        <em>{String(d.data.getDate()).padStart(2, "0")}/{String(d.data.getMonth() + 1).padStart(2, "0")}</em>
                                        <strong>{d.status === "descanso" ? "Folga" : fmt(d.totais.trabalhado)}</strong>
                                    </div>
                                ))}
                            </div>
                            <div className="pto-week-bar">
                                <span>Horas trabalhadas na semana: {fmt(horasSemana)} / 44:00 ({pctSemana}%)</span>
                                <div className="pto-bar"><i style={{ width: `${pctSemana}%` }} /></div>
                            </div>
                        </article>

                        <article className="pto-card">
                            <header className="pto-card-head">
                                <h3>Jornada de hoje</h3>
                                <em>Total do dia: {fmt(totaisHoje.trabalhado)}</em>
                            </header>
                            <ol className="pto-timeline">
                                {(tipoHoje === "sabado" ? MARCACOES.filter((m) => m.campo === "e1" || m.campo === "s2") : MARCACOES).map(({ campo, classe }) => {
                                    const hora = hojeReg[campo];
                                    const feito = Boolean(hora);
                                    const rotulo = campo === "s1" ? "Início do intervalo" : campo === "e2" ? "Término do intervalo" : campo === "s2" ? "Término" : "Início";
                                    return (
                                        <li key={campo} className={`is-${classe}${feito ? " is-done" : ""}`}>
                                            <span>{feito ? hora.slice(0, 5) : "--:--"}</span>
                                            <p>{rotulo}</p>
                                        </li>
                                    );
                                })}
                            </ol>
                        </article>
                    </section>

                    <section className="pto-grid-bot">
                        <article className="pto-card pto-table-card">
                            <header className="pto-card-head">
                                <h3>Últimos registros</h3>
                                <Link to="/ponto/registros">Ver todos</Link>
                            </header>
                            <div className="pto-table-wrap">
                                <table className="pto-soft">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Entrada</th>
                                            <th>Intervalo</th>
                                            <th>Retorno</th>
                                            <th>Saída</th>
                                            <th>Total</th>
                                            <th>Saldo</th>
                                            <th>Situação</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ultimos.slice(0, 5).map((d) => (
                                            <tr key={d.id} className={d.hoje ? "is-hoje" : ""}>
                                                <td>{d.data.toLocaleDateString("pt-BR")}</td>
                                                <td>{d.e1 ? d.e1.slice(0, 5) : "--:--"}</td>
                                                <td>{d.s1 ? d.s1.slice(0, 5) : "--:--"}</td>
                                                <td>{d.e2 ? d.e2.slice(0, 5) : "--:--"}</td>
                                                <td>{d.s2 ? d.s2.slice(0, 5) : "--:--"}</td>
                                                <td>{fmt(d.totais.trabalhado)}</td>
                                                <td className={d.saldo < 0 ? "is-neg" : d.saldo > 0 ? "is-pos" : ""}>{fmtSinal(d.saldo)}</td>
                                                <td><Pill status={d.status} aberto={d.hoje && d.totais.aberto} /></td>
                                                <td>
                                                    <button type="button" className="pto-link" onClick={() => navigate("/ponto/ajustes")}>
                                                        Ajuste
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </article>

                        <article className="pto-card pto-info">
                            <h3>Informações</h3>
                            <dl>
                                <div>
                                    <dt>Funcionário</dt>
                                    <dd>
                                        <select value={funcId} onChange={(e) => setFuncId(e.target.value)}>
                                            {equipe.map((f) => (
                                                <option key={f.id} value={f.id}>{f.nome}</option>
                                            ))}
                                        </select>
                                    </dd>
                                </div>
                                <div><dt>Matrícula</dt><dd>{matricula}</dd></div>
                                <div><dt>Cargo</dt><dd>{cargo}</dd></div>
                                <div><dt>CTPS/Série</dt><dd>{funcionario?.ctps || "—"}</dd></div>
                                <div><dt>Depto</dt><dd>{funcionario?.depto || "001 - GERAL"}</dd></div>
                                <div><dt>Expediente</dt><dd>{rotuloJornada(agora)}</dd></div>
                                <div><dt>Escala</dt><dd>Seg a Sáb · Domingo folga</dd></div>
                                <div>
                                    <dt>Banco de horas</dt>
                                    <dd className={resumoMes.saldo < 0 ? "is-neg" : "is-pos"}>{fmtSinal(resumoMes.saldo)}</dd>
                                </div>
                                <div>
                                    <dt><MapPin size={13} /> Último local</dt>
                                    <dd>{hojeReg.local || (ultima ? EMPRESA.local : "Sem marcação hoje")}</dd>
                                </div>
                                <div>
                                    <dt><CalendarDays size={13} /> Próximo feriado</dt>
                                    <dd>
                                        {feriado
                                            ? `${feriado.data.toLocaleDateString("pt-BR")} · ${feriado.nome}`
                                            : "—"}
                                    </dd>
                                </div>
                                <div>
                                    <dt><AlertTriangle size={13} /> Pendências</dt>
                                    <dd>{pendencias ? `${pendencias} dia(s) com marcação incompleta` : "Nenhuma pendência"}</dd>
                                </div>
                            </dl>
                            <p className="pto-user">Sessão: {usuario?.nome || "Administrador"}</p>
                        </article>
                    </section>
                </>
            )}

            {view === "registros" && (
                <article className="pto-card pto-table-card">
                    <header className="pto-card-head">
                        <h3>Meus registros</h3>
                        <p>Últimos 10 dias, com saldo e situação de cada jornada.</p>
                    </header>
                    <div className="pto-table-wrap">
                        <table className="pto-soft">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Dia</th>
                                    <th>Entrada</th>
                                    <th>Intervalo</th>
                                    <th>Retorno</th>
                                    <th>Saída</th>
                                    <th>Total</th>
                                    <th>Saldo</th>
                                    <th>Local</th>
                                    <th>Situação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ultimos.map((d) => (
                                    <tr key={d.id} className={d.hoje ? "is-hoje" : ""}>
                                        <td>{d.data.toLocaleDateString("pt-BR")}</td>
                                        <td>{DIAS_PT[d.data.getDay()]}</td>
                                        <td>{d.e1 ? d.e1.slice(0, 5) : "--:--"}</td>
                                        <td>{d.s1 ? d.s1.slice(0, 5) : "--:--"}</td>
                                        <td>{d.e2 ? d.e2.slice(0, 5) : "--:--"}</td>
                                        <td>{d.s2 ? d.s2.slice(0, 5) : "--:--"}</td>
                                        <td>{fmt(d.totais.trabalhado)}</td>
                                        <td className={d.saldo < 0 ? "is-neg" : d.saldo > 0 ? "is-pos" : ""}>{fmtSinal(d.saldo)}</td>
                                        <td>{d.local || "—"}</td>
                                        <td><Pill status={d.status} aberto={d.hoje && d.totais.aberto} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>
            )}

            {view === "espelho" && (
                <>
                    <section className="pto-espelho-head">
                        <div className="pto-mes">
                            <button type="button" onClick={() => setRef(new Date(ano, mes - 1, 1))} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
                            <strong>{MESES_PT[mes]} {ano}</strong>
                            <button type="button" onClick={() => setRef(new Date(ano, mes + 1, 1))} aria-label="Próximo mês"><ChevronRight size={18} /></button>
                            <span className={`pto-status is-${statusMes}`}>{statusMes === "enviado" ? "Enviado" : "Rascunho"}</span>
                        </div>
                        <div className="pto-acoes">
                            <button type="button" className="pto-ghost" onClick={() => window.print()}><Printer size={15} /> Imprimir</button>
                            <button type="button" className="pto-ghost" onClick={exportar}><Download size={15} /> Exportar CSV</button>
                            <button type="button" className="pto-primary" onClick={enviarMes} disabled={statusMes !== "rascunho"}>
                                <Send size={15} /> Enviar para aprovação
                            </button>
                        </div>
                    </section>
                    <section className="pto-kpis">
                        <article><span>Trabalhadas</span><strong>{fmt(resumoMes.trabalhadas)}</strong></article>
                        <article><span>Previstas</span><strong>{fmt(resumoMes.previstas)}</strong></article>
                        <article><span>Banco</span><strong className={resumoMes.saldo < 0 ? "is-neg" : "is-pos"}>{fmtSinal(resumoMes.saldo)}</strong></article>
                        <article><span>Faltas / abonos / folgas</span><strong>{resumoMes.faltas} / {resumoMes.abonos} / {resumoMes.dsr}</strong></article>
                    </section>
                    <article className="pto-folha">
                        <header className="pto-folha-head">
                            <h3>Folha de ponto individual</h3>
                            <p>Período: {periodoFolha}</p>
                        </header>
                        <div className="pto-folha-id">
                            <p><strong>Empresa:</strong> {EMPRESA.nome}</p>
                            <p><strong>CNPJ:</strong> {EMPRESA.cnpj}</p>
                            <p><strong>Atividade:</strong> {EMPRESA.atividade}</p>
                            <p><strong>Endereço:</strong> {EMPRESA.endereco}</p>
                            <p><strong>Funcionário:</strong> {matricula} — {funcionario?.nome}</p>
                            <p><strong>Cargo:</strong> {cargo}</p>
                            <p><strong>CTPS/Série:</strong> {funcionario?.ctps || "—"}</p>
                            <p><strong>Depto:</strong> {funcionario?.depto || "001 - GERAL"}</p>
                        </div>
                        <table className="pto-escala">
                            <thead>
                                <tr>
                                    <th>Dia</th>
                                    <th>Expediente</th>
                                    <th>Intervalo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Segunda à sexta</td><td>08:30 às 18:30</td><td>12:00 às 14:00</td></tr>
                                <tr><td>Sábado</td><td>08:30 às 12:30</td><td>Não possui</td></tr>
                                <tr><td>Domingo</td><td>Folga</td><td>—</td></tr>
                            </tbody>
                        </table>
                        <div className="pto-wrap">
                            <table className="pto-table">
                                <thead>
                                    <tr>
                                        <th>Dia</th>
                                        <th>Horário início</th>
                                        <th>Horário término</th>
                                        <th>Intervalo início</th>
                                        <th>Intervalo término</th>
                                        <th>Normal</th>
                                        <th>Extra</th>
                                        <th>Observação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {diasMes.map((d) => {
                                        const tipo = tipoDia(d.data);
                                        const folga = tipo === "domingo" || d.status === "descanso";
                                        const t = totalPeriodos(d, agora).trabalhado;
                                        const previsto = jornadaDoDia(d.data);
                                        const extra = previsto > 0 && d.status !== "abonado" ? Math.max(0, t - previsto) : 0;
                                        const normal = previsto > 0 ? Math.min(t, previsto) : 0;
                                        const diaCurto = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.data.getDay()];
                                        return (
                                            <tr key={d.id} className={folga ? "is-dsr" : tipo === "sabado" ? "is-sab" : ""}>
                                                <td>{String(d.data.getDate()).padStart(2, "0")} {diaCurto}</td>
                                                <td className={folga ? "" : "is-hora"}>
                                                    <input type="text" value={d.e1 || ""} placeholder={folga ? "" : "08:30"} onChange={(e) => atualizarCampo(d.id, "e1", e.target.value)} />
                                                </td>
                                                <td className={folga ? "" : "is-hora"}>
                                                    <input type="text" value={d.s2 || ""} placeholder={folga ? "" : tipo === "sabado" ? "12:30" : "18:30"} onChange={(e) => atualizarCampo(d.id, "s2", e.target.value)} />
                                                </td>
                                                <td className={folga || tipo === "sabado" ? "" : "is-hora"}>
                                                    <input type="text" value={d.s1 || ""} placeholder={tipo === "util" ? "12:00" : ""} onChange={(e) => atualizarCampo(d.id, "s1", e.target.value)} disabled={tipo === "sabado" || folga} />
                                                </td>
                                                <td className={folga || tipo === "sabado" ? "" : "is-hora"}>
                                                    <input type="text" value={d.e2 || ""} placeholder={tipo === "util" ? "14:00" : ""} onChange={(e) => atualizarCampo(d.id, "e2", e.target.value)} disabled={tipo === "sabado" || folga} />
                                                </td>
                                                <td>{fmt(normal)}</td>
                                                <td className={extra > 0 ? "is-extra" : ""}>{fmt(extra)}</td>
                                                <td className={folga ? "is-just" : ""}>
                                                    <input
                                                        type="text"
                                                        value={d.justificativa || ""}
                                                        placeholder={folga ? "Domingo" : ""}
                                                        onChange={(e) => atualizarCampo(d.id, "justificativa", e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <footer className="pto-assinaturas">
                            <div>
                                <span>Data: ____/____/________</span>
                                <em>Assinatura do supervisor</em>
                            </div>
                            <div>
                                <span>{matricula} — {funcionario?.nome}</span>
                                <em>Assinatura do funcionário</em>
                            </div>
                        </footer>
                    </article>
                </>
            )}

            {view === "ajustes" && (
                <section className="pto-grid-mid">
                    <article className="pto-card">
                        <h3>Solicitar ajuste</h3>
                        <p className="pto-help">Use para atrasos, esquecimento de batida ou atestado. O gestor aprova antes de alterar o espelho.</p>
                        <form className="pto-form" onSubmit={enviarAjuste}>
                            <label>
                                Data
                                <input type="date" value={ajuste.data} onChange={(e) => setAjuste({ ...ajuste, data: e.target.value })} />
                            </label>
                            <label>
                                Tipo
                                <select value={ajuste.tipo} onChange={(e) => setAjuste({ ...ajuste, tipo: e.target.value })}>
                                    {MARCACOES.map((m) => <option key={m.campo} value={m.campo}>{m.nome}</option>)}
                                </select>
                            </label>
                            <label>
                                Horário correto
                                <input type="time" value={ajuste.hora} onChange={(e) => setAjuste({ ...ajuste, hora: e.target.value })} />
                            </label>
                            <label className="is-full">
                                Motivo
                                <textarea value={ajuste.motivo} onChange={(e) => setAjuste({ ...ajuste, motivo: e.target.value })} placeholder="Descreva a justificativa" />
                            </label>
                            <button type="submit" className="pto-primary">Enviar ajuste</button>
                        </form>
                    </article>
                    <article className="pto-card">
                        <h3>Histórico de ajustes</h3>
                        {ajustes.length === 0 ? (
                            <p className="pto-help">Nenhum ajuste solicitado.</p>
                        ) : (
                            <ul className="pto-ajustes">
                                {ajustes.map((item) => (
                                    <li key={item.id}>
                                        <strong>{item.data.split("-").reverse().join("/")}</strong>
                                        <span>{MARCACOES.find((m) => m.campo === item.tipo)?.nome} {item.hora}</span>
                                        <em className="pto-pill is-andamento">{item.status}</em>
                                        <p>{item.motivo}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                </section>
            )}

            {view === "relatorios" && (
                <section className="pto-kpis pto-rel">
                    <article><span>Competência</span><strong>{MESES_PT[mes]} {ano}</strong></article>
                    <article><span>Horas trabalhadas</span><strong>{fmt(resumoMes.trabalhadas)}</strong></article>
                    <article><span>Horas previstas</span><strong>{fmt(resumoMes.previstas)}</strong></article>
                    <article><span>Saldo do banco</span><strong className={resumoMes.saldo < 0 ? "is-neg" : "is-pos"}>{fmtSinal(resumoMes.saldo)}</strong></article>
                    <article><span>Faltas</span><strong>{resumoMes.faltas}</strong></article>
                    <article><span>Abonos</span><strong>{resumoMes.abonos}</strong></article>
                    <article className="pto-rel-acoes">
                        <button type="button" className="pto-ghost" onClick={() => window.print()}><Printer size={15} /> Imprimir</button>
                        <button type="button" className="pto-primary" onClick={exportar}><Download size={15} /> Exportar CSV</button>
                    </article>
                </section>
            )}
        </div>
    );
}
