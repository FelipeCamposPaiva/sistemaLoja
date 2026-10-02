import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
    ArrowDownUp,
    ArrowUp,
    Ban,
    Briefcase,
    Building2,
    CalendarDays,
    Check,
    CircleX,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FileText,
    Filter,
    History,
    Info,
    Link2,
    List,
    Mail,
    MapPin,
    MoreHorizontal,
    MoreVertical,
    Plus,
    Printer,
    Search,
    Send,
    Share2,
    SlidersHorizontal,
    Tag,
    Trash2,
    UserPlus,
    UserRound,
    UserRoundCheck,
    UserRoundMinus,
    UserRoundPlus,
    Users,
    X
} from "lucide-react";

import {
    ESTADOS,
    gravarContatos,
    lerContatos,
    rotuloTipo,
    TIPOS
} from "../../constants/contatos";
import { municipiosPorUf } from "../../services/ibge.service";
import { listarFuncionarios, nomePessoa } from "../../constants/rh";
import {
    atualizarCliente,
    excluirCliente,
    importarClientesLote,
    listarClientes
} from "../../services/clientes.service";
import { lerPlanilhaContatos, mesclarContatos } from "../../services/contatoImport.service";
import { unidadeAtual, unidadesDestino } from "../../constants/empresas";
import ROTAS from "../../constants/rotas";
import ContatoForm from "./ContatoForm";
import ImportadorMassa from "./ImportadorMassa";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";

const ABAS = [
    { id: "todos", label: "todos" },
    { id: "cliente", label: "cliente" },
    { id: "fornecedor", label: "fornecedor" },
    { id: "transportador", label: "transportador" },
    { id: "funcionario", label: "funcionário" },
    { id: "outro", label: "outro" }
];

const REFINOS = [
    { id: "nome-parcial", label: "Nome (parcial)" },
    { id: "nome", label: "Nome" },
    { id: "fantasia", label: "Fantasia" },
    { id: "email", label: "E-mail" },
    { id: "cpf", label: "CPF/CNPJ" },
    { id: "telefone", label: "Telefone" },
    { id: "", label: "Não refinar" }
];

const PLACEHOLDERS = {
    "": "Pesquise por nome, cód., fantasia, email ou CPF/CNPJ",
    "nome-parcial": "Pesquise por nome (parcial)",
    "nome": "Pesquise por nome",
    "fantasia": "Pesquise por nome fantasia",
    "email": "Pesquise por e-mail",
    "cpf": "Pesquise por CPF/CNPJ",
    "telefone": "Pesquise por telefone"
};

function qtdTab(n) {
    const q = Number(n || 0);
    return q < 10 ? String(q).padStart(2, "0") : String(q);
}

function capital(id) {
    const nome = rotuloTipo(id);
    return nome.charAt(0).toUpperCase() + nome.slice(1);
}

function quandoCadastro(iso) {
    if (!iso) {
        return { data: "—", hora: "" };
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
        return { data: "—", hora: "" };
    }
    return {
        data: d.toLocaleDateString("pt-BR"),
        hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
}

function faixasPagina(atual, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => ({ tipo: "pagina", n: i + 1 }));
    }
    let de = 2;
    let ate = 5;
    if (atual > 4 && atual < total - 3) {
        de = atual - 1;
        ate = atual + 1;
    } else if (atual >= total - 3) {
        de = Math.max(2, total - 4);
        ate = total - 1;
    }
    const itens = [{ tipo: "pagina", n: 1 }];
    if (de > 2) {
        itens.push({ tipo: "reticencias", id: "antes" });
    }
    for (let n = de; n <= ate; n += 1) {
        itens.push({ tipo: "pagina", n });
    }
    if (ate < total - 1) {
        itens.push({ tipo: "reticencias", id: "depois" });
    }
    itens.push({ tipo: "pagina", n: total });
    return itens;
}

const COLUNAS_KEY = "erp-contatos-colunas-v1";

const COLUNAS = [
    { id: "nome", label: "Nome", sort: "nome" },
    { id: "cpf", label: "CPF/CNPJ" },
    { id: "contato", label: "Contato" },
    { id: "cidade", label: "Cidade", sort: "cidade" },
    { id: "situacao", label: "Situação" },
    { id: "tipo", label: "Tipo" },
    { id: "cadastro", label: "Cadastro em", sort: "recentes" }
];

const COLUNAS_PADRAO = ["nome", "cpf", "contato", "cidade", "situacao"];

const ORDENS = [
    { id: "nome", label: "nome" },
    { id: "recentes", label: "mais recentes" },
    { id: "codigo", label: "código" }
];

const SITUACOES = [
    { id: "sem", label: "sem filtro" },
    { id: "ativos", label: "ativos" },
    { id: "inativos", label: "inativos" },
    { id: "excluidos", label: "excluídos" }
];

function rotuloCadastros(quantidade) {
    return `${quantidade} ${quantidade === 1 ? "cadastro" : "cadastros"}`;
}

const CONFIRMACOES = {
    excluir: {
        titulo: (n) => `Excluir ${rotuloCadastros(n)}?`,
        texto: "Essa ação não poderá ser desfeita. Os cadastros selecionados serão removidos permanentemente da sua base de dados.",
        acao: (n) => `Excluir ${rotuloCadastros(n)}`,
        Icone: Trash2
    },
    inativar: {
        titulo: (n) => `Inativar ${rotuloCadastros(n)}?`,
        texto: "Os cadastros selecionados serão marcados como inativos e não aparecerão nas listas de seleção da loja. Você poderá reativá-los a qualquer momento.",
        acao: (n) => `Inativar ${rotuloCadastros(n)}`,
        Icone: UserRoundMinus
    },
    ativar: {
        titulo: (n) => `Ativar ${rotuloCadastros(n)}?`,
        texto: "Os cadastros selecionados serão marcados como ativos e voltarão a aparecer nas listas de seleção da loja. Você poderá desativá-los a qualquer momento.",
        acao: (n) => `Ativar ${rotuloCadastros(n)}`,
        Icone: UserRoundCheck
    },
    reativar: {
        titulo: (n) => `Reativar ${rotuloCadastros(n)}?`,
        texto: "Os cadastros selecionados foram excluídos da base de dados e serão restaurados, voltando a aparecer nas listas de seleção da loja. Você poderá inativá-los novamente a qualquer momento.",
        acao: (n) => `Reativar ${rotuloCadastros(n)}`,
        Icone: UserRoundPlus
    }
};

function isoLocal(data) {
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${data.getFullYear()}-${mes}-${dia}`;
}

function formatarDataBr(iso) {
    const [ano, mes, dia] = String(iso || "").split("-");
    if (!ano || !mes || !dia) {
        return "";
    }
    return `${dia}/${mes}/${ano}`;
}

function celulasMes(ano, mes) {
    const inicio = new Date(ano, mes, 1).getDay();
    const total = new Date(ano, mes + 1, 0).getDate();
    const anterior = new Date(ano, mes, 0).getDate();
    const celulas = [];
    for (let i = 0; i < inicio; i += 1) {
        const dia = anterior - inicio + 1 + i;
        celulas.push({ dia, iso: isoLocal(new Date(ano, mes - 1, dia)), fora: true });
    }
    for (let dia = 1; dia <= total; dia += 1) {
        celulas.push({ dia, iso: isoLocal(new Date(ano, mes, dia)), fora: false });
    }
    let extra = 1;
    while (celulas.length % 7 !== 0) {
        celulas.push({ dia: extra, iso: isoLocal(new Date(ano, mes + 1, extra)), fora: true });
        extra += 1;
    }
    return celulas;
}

function periodoVazio() {
    const agora = new Date();
    return {
        modo: "sem",
        mes: agora.getMonth(),
        ano: agora.getFullYear(),
        dia: isoLocal(agora),
        de: isoLocal(new Date(agora.getFullYear(), agora.getMonth(), 1)),
        ate: isoLocal(new Date(agora.getFullYear(), agora.getMonth() + 1, 0))
    };
}

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

function Calendario({ iso, onEscolher }) {
    const base = iso ? new Date(`${iso}T12:00:00`) : new Date();
    const [visao, setVisao] = useState({ mes: base.getMonth(), ano: base.getFullYear() });
    const hoje = isoLocal(new Date());
    const celulas = celulasMes(visao.ano, visao.mes);

    function mudar(delta) {
        const data = new Date(visao.ano, visao.mes + delta, 1);
        setVisao({ mes: data.getMonth(), ano: data.getFullYear() });
    }

    return (
        <div className="ctt-cal">
            <header>
                <button type="button" aria-label="Mês anterior" onClick={() => mudar(-1)}>‹</button>
                <strong>{MESES[visao.mes]} {visao.ano}</strong>
                <button type="button" aria-label="Próximo mês" onClick={() => mudar(1)}>›</button>
            </header>
            <div className="ctt-cal-sem">
                {SEMANA.map((letra, indice) => <span key={`${letra}-${indice}`}>{letra}</span>)}
            </div>
            <div className="ctt-cal-dias">
                {celulas.map((celula) => {
                    const classe = [
                        celula.iso === iso ? "is-sel" : "",
                        celula.iso === hoje ? "is-hoje" : "",
                        celula.fora ? "is-fora" : ""
                    ].filter(Boolean).join(" ");
                    return (
                        <button key={celula.iso} type="button" className={classe} onClick={() => onEscolher(celula.iso)}>
                            {celula.dia}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function mascaraData(valor) {
    const digitos = String(valor || "").replace(/\D/g, "").slice(0, 8);
    if (digitos.length <= 2) {
        return digitos;
    }
    if (digitos.length <= 4) {
        return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    }
    return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function isoDeBr(texto) {
    const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto || "");
    if (!partes) {
        return "";
    }
    const dia = Number(partes[1]);
    const mes = Number(partes[2]);
    const ano = Number(partes[3]);
    const data = new Date(ano, mes - 1, dia);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
        return "";
    }
    return isoLocal(data);
}

function IlustracaoBusca() {
    return (
        <svg className="ctt-vazio-arte" viewBox="0 0 280 170" width="250" height="152" aria-hidden="true">
            <ellipse cx="132" cy="132" rx="78" ry="22" fill="#ffe4f3" />
            <ellipse cx="168" cy="138" rx="46" ry="14" fill="#fff0f7" />
            <circle cx="62" cy="58" r="8" fill="#ffd0e6" />
            <circle cx="214" cy="46" r="5" fill="#ffd6ea" />
            <path d="M188 34c7 1 11 7 9 13" fill="none" stroke="#ff7eb6" strokeWidth="3" strokeLinecap="round" />
            <path d="M204 26c5 1 8 5 6 10" fill="none" stroke="#ff7eb6" strokeWidth="3" strokeLinecap="round" />
            <path d="M78 46h92a8 8 0 0 1 8 8v74a8 8 0 0 1-8 8H78a8 8 0 0 1-8-8V54a8 8 0 0 1 8-8z" fill="#fff" stroke="#d4c6f2" strokeWidth="3" />
            <path d="M148 46v18a6 6 0 0 0 6 6h24" fill="#f7f1ff" stroke="#d4c6f2" strokeWidth="3" />
            <path d="M92 84h52M92 98h44M92 112h34" fill="none" stroke="#eadff8" strokeWidth="5" strokeLinecap="round" />
            <circle cx="186" cy="108" r="30" fill="#fff" stroke="#ff2f92" strokeWidth="9" />
            <path d="M208 130l20 20" fill="none" stroke="#ff2f92" strokeWidth="9" strokeLinecap="round" />
        </svg>
    );
}

function CampoData({ rotulo, prefixo, iso, onChange, onLimpar, iconeEsquerda }) {
    const [aberto, setAberto] = useState(false);
    const [texto, setTexto] = useState(() => formatarDataBr(iso));
    const caixa = useRef(null);

    useEffect(() => {
        setTexto(formatarDataBr(iso));
    }, [iso]);

    useEffect(() => {
        if (!aberto) {
            return undefined;
        }
        function fechar(ev) {
            if (caixa.current && !caixa.current.contains(ev.target)) {
                setAberto(false);
            }
        }
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, [aberto]);

    function digitar(valor) {
        const mascarado = mascaraData(valor);
        setTexto(mascarado);
        if (!mascarado) {
            onChange("");
            return;
        }
        const convertido = isoDeBr(mascarado);
        if (convertido) {
            onChange(convertido);
        }
    }

    return (
        <label className="ctt-data-campo">
            {rotulo}
            <div className={`ctt-data-caixa${aberto ? " is-aberto" : ""}${iconeEsquerda ? " is-dia" : ""}`} ref={caixa}>
                {iconeEsquerda ? (
                    <button type="button" aria-label={`Abrir calendário de ${rotulo}`} onClick={() => setAberto((atual) => !atual)}>
                        <CalendarDays size={16} />
                    </button>
                ) : (
                    <span>{prefixo}</span>
                )}
                <input
                    className="ctt-data-valor"
                    inputMode="numeric"
                    placeholder="dd/mm/aaaa"
                    value={texto}
                    aria-label={rotulo}
                    onChange={(ev) => digitar(ev.target.value)}
                    onBlur={() => {
                        const convertido = isoDeBr(texto);
                        setTexto(convertido ? formatarDataBr(convertido) : formatarDataBr(iso));
                    }}
                />
                {onLimpar && iso ? (
                    <button type="button" aria-label="Limpar data" onClick={() => { onLimpar(); setAberto(false); }}>
                        <X size={14} />
                    </button>
                ) : null}
                {iconeEsquerda ? null : (
                    <button type="button" aria-label={`Abrir calendário de ${rotulo}`} onClick={() => setAberto((atual) => !atual)}>
                        <CalendarDays size={16} />
                    </button>
                )}
                {aberto ? <Calendario iso={iso} onEscolher={(valor) => { onChange(valor); setAberto(false); }} /> : null}
            </div>
        </label>
    );
}

function mudarMesPeriodo(atual, delta) {
    const data = new Date(atual.ano, atual.mes + delta, 1);
    return { ...atual, mes: data.getMonth(), ano: data.getFullYear() };
}

function noPeriodo(iso, periodo) {
    if (!periodo || periodo.modo === "sem") {
        return true;
    }
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) {
        return false;
    }
    if (periodo.modo === "dia") {
        if (!periodo.dia) {
            return true;
        }
        return isoLocal(data) === periodo.dia;
    }
    if (periodo.modo === "mes") {
        return data.getMonth() === periodo.mes && data.getFullYear() === periodo.ano;
    }
    const de = periodo.de ? new Date(`${periodo.de}T00:00:00`) : null;
    const ate = periodo.ate ? new Date(`${periodo.ate}T23:59:59`) : null;
    if (de && data < de) {
        return false;
    }
    if (ate && data > ate) {
        return false;
    }
    return true;
}

function colunasSalvas() {
    try {
        const bruto = JSON.parse(localStorage.getItem(COLUNAS_KEY) || "null");
        if (Array.isArray(bruto) && bruto.length) {
            const ordem = COLUNAS.map((c) => c.id).filter((id) => bruto.includes(id));
            if (ordem.length) {
                return ordem;
            }
        }
    } catch {
        /* preferência inválida volta ao padrão */
    }
    return [...COLUNAS_PADRAO];
}

function ordenarColunas(ids) {
    const marcar = new Set(ids);
    const ordem = COLUNAS.map((c) => c.id).filter((id) => marcar.has(id));
    return ordem.length ? ordem : [...COLUNAS_PADRAO];
}

const LISTAS_PRECO = [];
const POR_PAGINA = 10;
const TAMANHOS = [10, 20, 50];
const MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

function soDigitos(valor) {
    return String(valor || "").replace(/\D/g, "");
}

function textoDe(contato) {
    return [
        contato.nome,
        contato.fantasia,
        contato.cpfCnpj,
        soDigitos(contato.cpfCnpj),
        contato.email,
        contato.celular,
        soDigitos(contato.celular),
        contato.telefone,
        soDigitos(contato.telefone),
        contato.municipio,
        contato.uf,
        contato.vendedor,
        String(contato.id)
    ].join(" ").toLowerCase();
}

function campoBusca(contato, refino) {
    if (refino === "nome" || refino === "nome-parcial") {
        return String(contato.nome || "");
    }
    if (refino === "fantasia") {
        return String(contato.fantasia || "");
    }
    if (refino === "email") {
        return String(contato.email || "");
    }
    if (refino === "cpf") {
        return `${contato.cpfCnpj || ""} ${soDigitos(contato.cpfCnpj)}`;
    }
    if (refino === "telefone") {
        return [contato.celular, contato.telefone, soDigitos(contato.celular), soDigitos(contato.telefone)].join(" ");
    }
    return textoDe(contato);
}

function passaBusca(contato, termo, refino) {
    if (!termo) {
        return true;
    }
    const texto = campoBusca(contato, refino).toLowerCase();
    if (refino === "nome") {
        return texto === termo || texto.startsWith(termo) || texto.split(/\s+/).some((parte) => parte.startsWith(termo));
    }
    if (texto.includes(termo)) {
        return true;
    }
    const digitos = termo.replace(/\D/g, "");
    return digitos.length >= 3 && texto.includes(digitos);
}

function gruposAcao(id) {
    return [
        [
            { label: "incluir assunto no CRM", icon: UserPlus, to: `/crm?contato=${id}` },
            { label: "fazer uma proposta", icon: Briefcase, aviso: "Propostas comerciais ainda não estão disponíveis neste cadastro." },
            { label: "criar um pedido de venda", icon: Mail, to: `${ROTAS.PEDIDO_VENDA}?contato=${id}` },
            { label: "cadastrar uma nota fiscal", icon: FileText, to: `${ROTAS.NFS}?contato=${id}` },
            { label: "histórico de cashback", icon: History, aviso: "Histórico de cashback ainda não está disponível neste cadastro." }
        ],
        [
            { label: "tornar vendedor", icon: UserRound, to: ROTAS.VENDEDORES },
            { label: "vincular a outro registro", icon: Link2, aviso: "Vínculo entre cadastros ainda não está disponível." },
            { label: "imprimir ficha cadastral", icon: Printer, to: `/contatos/${id}` },
            { label: "enviar cadastro para outras empresas", icon: Share2, acao: "empresas" }
        ],
        [
            { label: "consultar últimas vendas", icon: Info, to: `${ROTAS.PEDIDO_VENDA}?contato=${id}` },
            { label: "consultar últimas compras", icon: Info, to: `${ROTAS.NOTAS_ENTRADA}?contato=${id}` },
            { label: "consultar últimos serviços", icon: Info, to: `${ROTAS.ORDEM_SERVICO}?contato=${id}` }
        ]
    ];
}

function nomeCidade(valor) {
    return String(valor || "").replace(/\s+-\s+[A-Za-z]{2}$/, "").trim();
}

function rotuloCidade(contato) {
    const cidade = nomeCidade(contato.municipio);
    const uf = String(contato.uf || "").trim();
    if (cidade && uf) {
        return `${cidade} - ${uf}`;
    }
    return cidade || uf || "Sem cidade";
}

function dataNascimento(valor) {
    const texto = String(valor || "").trim();
    if (!texto) {
        return null;
    }
    const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
        return { ano: Number(iso[1]), mes: Number(iso[2]), dia: Number(iso[3]) };
    }
    const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (br) {
        return { dia: Number(br[1]), mes: Number(br[2]), ano: Number(br[3]) };
    }
    return null;
}

function idadeDe(nasc, hoje = new Date()) {
    let idade = hoje.getFullYear() - nasc.ano;
    const mes = hoje.getMonth() + 1;
    if (mes < nasc.mes || (mes === nasc.mes && hoje.getDate() < nasc.dia)) {
        idade -= 1;
    }
    return Math.max(idade, 0);
}

const ETIQUETA_TAMANHOS = [
    { id: "avery5160", nome: "Avery 5160 (63,5 x 25,4 mm)", cols: 3, rows: 10, largura: 63.5, altura: 25.4 },
    { id: "pimaco6081", nome: "Pimaco 6081 (101,6 x 25,4 mm)", cols: 2, rows: 10, largura: 101.6, altura: 25.4 },
    { id: "pimaco6082", nome: "Pimaco 6082 (101,6 x 33,9 mm)", cols: 2, rows: 7, largura: 101.6, altura: 33.9 }
];

function escaparHtml(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    }[ch]));
}

function linhasEtiqueta(contato, campos) {
    const linhas = [];
    if (campos.nome) {
        linhas.push({ tipo: "nome", texto: String(contato.nome || "—").toUpperCase() });
    }
    if (campos.doc) {
        const doc = String(contato.cpfCnpj || "").trim();
        const digitos = doc.replace(/\D/g, "");
        linhas.push({ tipo: "doc", texto: doc ? `${digitos.length > 11 ? "CNPJ" : "CPF"}: ${doc}` : "—" });
    }
    if (campos.telefone) {
        linhas.push({ tipo: "tel", texto: contato.celular || contato.telefone || "—" });
    }
    if (campos.cidade) {
        const cidade = nomeCidade(contato.municipio);
        const uf = String(contato.uf || "").trim();
        linhas.push({ tipo: "cidade", texto: cidade && uf ? `${cidade} - ${uf}` : cidade || uf || "—" });
    }
    if (campos.endereco) {
        const rua = [contato.endereco, contato.numero].filter(Boolean).join(", ");
        const extra = [contato.complemento, contato.bairro, contato.cep].filter(Boolean).join(" · ");
        linhas.push({ tipo: "end", texto: [rua, extra].filter(Boolean).join(" — ") || "—" });
    }
    return linhas;
}

const CAMPOS_ETIQUETA = [
    { id: "nome", label: "Nome / Razão Social" },
    { id: "doc", label: "CPF / CNPJ" },
    { id: "telefone", label: "Telefone" },
    { id: "cidade", label: "Cidade / UF" },
    { id: "endereco", label: "Endereço completo" }
];

function MiniEtiqueta({ contato, campos }) {
    if (!contato) {
        return <p className="ctt-etiq-vazia">Nenhum contato selecionado.</p>;
    }
    return (
        <div className="ctt-etiq-carta">
            {linhasEtiqueta(contato, campos).map((linha) => (
                <p key={linha.tipo} className={linha.tipo === "nome" ? "is-nome" : ""}>{linha.texto}</p>
            ))}
        </div>
    );
}

function exportarCsv(lista) {
    const linhas = [
        ["ID", "Nome", "Tipo", "CPF/CNPJ", "Cidade", "UF", "Telefone", "E-mail"].join(";")
    ];
    lista.forEach((c) => {
        linhas.push([
            c.id,
            c.nome,
            (c.tipos || []).map(rotuloTipo).join(" "),
            c.cpfCnpj || "",
            c.municipio || "",
            c.uf || "",
            c.celular || c.telefone || "",
            c.email || ""
        ].map((v) => `"${String(v).replaceAll("\"", "\"\"")}"`).join(";"));
    });
    const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes-fornecedores.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function exportarXlsx(lista) {
    const cabecalho = ["ID", "Nome", "Tipo", "CPF/CNPJ", "Cidade", "UF", "Telefone", "E-mail"];
    const linhas = lista.map((c) => [
        c.id,
        c.nome,
        (c.tipos || []).map(rotuloTipo).join(" "),
        c.cpfCnpj || "",
        c.municipio || "",
        c.uf || "",
        c.celular || c.telefone || "",
        c.email || ""
    ]);
    const planilha = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, "Contatos");
    XLSX.writeFile(livro, "clientes-fornecedores.xlsx");
}

function mesclarExcluidos(remotos, locais) {
    const guardados = new Map(
        (Array.isArray(locais) ? locais : [])
            .filter((c) => c && c.excluido && c.id != null)
            .map((c) => [String(c.id), c])
    );
    const vistos = new Set();
    const lista = (Array.isArray(remotos) ? remotos : []).map((c) => {
        vistos.add(String(c.id));
        const local = guardados.get(String(c.id));
        return local ? { ...c, excluido: true } : c;
    });
    guardados.forEach((c, id) => {
        if (!vistos.has(id)) {
            lista.push(c);
        }
    });
    return lista;
}

function ListaContatos() {
    const navigate = useNavigate();
    const [lista, setLista] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroApi, setErroApi] = useState("");
    const [busca, setBusca] = useState("");
    const [refino, setRefino] = useState("");
    const [aba, setAba] = useState("todos");
    const [ordem, setOrdem] = useState("nome");
    const [situacao, setSituacao] = useState("sem");
    const [periodo, setPeriodo] = useState(periodoVazio);
    const [rascunhoPeriodo, setRascunhoPeriodo] = useState(periodoVazio);
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(POR_PAGINA);
    const [marcados, setMarcados] = useState([]);
    const [menuLinha, setMenuLinha] = useState(null);
    const [aberto, setAberto] = useState(null);
    const [subFiltro, setSubFiltro] = useState(null);
    const [filtros, setFiltros] = useState({ vendedor: "", municipio: "", uf: "" });
    const [rascunho, setRascunho] = useState({ vendedor: "", municipio: "", uf: "" });
    const [cidadesIbge, setCidadesIbge] = useState([]);
    const [cidadesStatus, setCidadesStatus] = useState("");
    const [painel, setPainel] = useState(null);
    const [confirma, setConfirma] = useState(null);
    const [irPagina, setIrPagina] = useState(false);
    const [numeroPagina, setNumeroPagina] = useState("");
    const [colunas, setColunas] = useState(colunasSalvas);
    const [rascunhoColunas, setRascunhoColunas] = useState(COLUNAS_PADRAO);
    const [vendedorLote, setVendedorLote] = useState("");
    const [tipoLote, setTipoLote] = useState("cliente");
    const [listaPrecoLote, setListaPrecoLote] = useState("");
    const [etiquetas, setEtiquetas] = useState(null);
    const [niverAberto, setNiverAberto] = useState(false);
    const [niverMes, setNiverMes] = useState(() => new Date().getMonth() + 1);
    const [empresasLote, setEmpresasLote] = useState([]);
    const [envioBase, setEnvioBase] = useState([]);
    const [envioMarcados, setEnvioMarcados] = useState([]);
    const [buscaEnvio, setBuscaEnvio] = useState("");
    const [ordemEnvio, setOrdemEnvio] = useState("asc");
    const [empresasAberto, setEmpresasAberto] = useState(false);
    const [envioAviso, setEnvioAviso] = useState("");
    const [aviso, setAviso] = useState("");
    const [importando, setImportando] = useState(false);
    const [importadorMassa, setImportadorMassa] = useState(false);
    const xlsRef = useRef(null);
    const raiz = useRef(null);

    async function carregarContatos() {
        setCarregando(true);
        try {
            const dados = mesclarExcluidos(await listarClientes(), lerContatos());
            setLista(dados);
            gravarContatos(dados);
            setErroApi("");
        } catch {
            setErroApi("Não foi possível carregar os cadastros do servidor.");
            setLista(lerContatos());
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarContatos();
    }, []);

    async function importarExcel(arquivo) {
        if (!arquivo) {
            return;
        }
        setImportando(true);
        setAberto(null);
        try {
            const lido = await lerPlanilhaContatos(arquivo);
            if (!lido.itens.length) {
                setAviso("A planilha não tem contatos com nome.");
                return;
            }
            const resumo = await importarClientesLote(lido.itens);
            const falhas = resumo.erros ? `, ${resumo.erros} com erro` : "";
            setAviso(`${arquivo.name}: ${resumo.total} cadastros gravados (${resumo.novos} novos, ${resumo.atualizados} atualizados${falhas}).`);
            await carregarContatos();
        } catch (erro) {
            setAviso(erro?.response?.data?.mensagem || erro?.message || "Não foi possível importar a planilha.");
        } finally {
            setImportando(false);
            if (xlsRef.current) {
                xlsRef.current.value = "";
            }
        }
    }

    useEffect(() => {
        if (!carregando) {
            gravarContatos(lista);
        }
    }, [lista, carregando]);

    useEffect(() => {
        function fechar(ev) {
            const alvo = ev.target;
            if (!(alvo instanceof Element)) {
                return;
            }
            if (alvo.closest(".ctt-drop, .ctt-row-menu, .ctt-ir-pagina, .ctt-cols")) {
                return;
            }
            setAberto(null);
            setSubFiltro(null);
            setMenuLinha(null);
        }
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, []);

    useEffect(() => {
        if (!irPagina) {
            return undefined;
        }
        function tecla(ev) {
            if (ev.key === "Escape") {
                setIrPagina(false);
            }
        }
        document.addEventListener("keydown", tecla);
        return () => document.removeEventListener("keydown", tecla);
    }, [irPagina]);

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return lista.filter((c) => {
            if (situacao === "excluidos") {
                if (!c.excluido) {
                    return false;
                }
            } else if (c.excluido) {
                return false;
            } else if (situacao === "ativos" && c.ativo === false) {
                return false;
            } else if (situacao === "inativos" && c.ativo !== false) {
                return false;
            }
            if (termo && !passaBusca(c, termo, refino)) {
                return false;
            }
            if (filtros.vendedor && !(c.vendedor || "").toLowerCase().includes(filtros.vendedor.toLowerCase())) {
                return false;
            }
            if (filtros.municipio) {
                const m = nomeCidade(filtros.municipio).toLocaleLowerCase("pt-BR");
                if (nomeCidade(c.municipio).toLocaleLowerCase("pt-BR") !== m) {
                    return false;
                }
            }
            if (filtros.uf && (c.uf || "").trim().toUpperCase() !== filtros.uf.toUpperCase()) {
                return false;
            }
            if (periodo.modo !== "sem" && !noPeriodo(c.dataCadastro, periodo)) {
                return false;
            }
            return true;
        });
    }, [lista, busca, refino, situacao, periodo, filtros]);

    const contagens = useMemo(() => {
        const por = (id) => filtrados.filter((c) => (c.tipos || []).includes(id)).length;
        return {
            todos: filtrados.length,
            cliente: por("cliente"),
            fornecedor: por("fornecedor"),
            transportador: por("transportador"),
            funcionario: por("funcionario"),
            outro: por("outro")
        };
    }, [filtrados]);

    const visiveis = useMemo(() => {
        let itens = aba === "todos"
            ? filtrados
            : filtrados.filter((c) => (c.tipos || []).includes(aba));

        itens = [...itens].sort((a, b) => {
            if (ordem === "recentes") {
                return new Date(b.dataCadastro) - new Date(a.dataCadastro);
            }
            if (ordem === "cidade") {
                return String(a.municipio || "").localeCompare(String(b.municipio || ""), "pt-BR");
            }
            if (ordem === "codigo") {
                return Number(a.id) - Number(b.id);
            }
            return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
        });
        return itens;
    }, [filtrados, aba, ordem]);

    const totalPaginas = Math.max(1, Math.ceil(visiveis.length / porPagina));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const inicio = (paginaAtual - 1) * porPagina;
    const fatia = visiveis.slice(inicio, inicio + porPagina);

    useEffect(() => {
        setPagina(1);
    }, [busca, refino, aba, ordem, situacao, periodo, filtros, porPagina]);

    function toggleMarca(id) {
        setMarcados((atual) => (
            atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]
        ));
    }

    function marcarPagina(ev) {
        const ids = fatia.map((c) => c.id);
        if (ev.target.checked) {
            setMarcados((atual) => [...new Set([...atual, ...ids])]);
        } else {
            setMarcados((atual) => atual.filter((id) => !ids.includes(id)));
        }
    }

    function selecionados() {
        return lista.filter((c) => marcados.includes(c.id) && !c.excluido);
    }

    function abrirEnvioEmpresas(ids) {
        const base = Array.isArray(ids) ? ids : marcados;
        const escolhidos = lista.filter((c) => base.includes(c.id) && !c.excluido).map((c) => c.id);
        setEnvioBase(escolhidos);
        setEnvioMarcados(escolhidos);
        setBuscaEnvio("");
        setOrdemEnvio("asc");
        setEmpresasLote([]);
        setEmpresasAberto(false);
        setEnvioAviso("");
        setPainel("empresas");
        setAberto(null);
        setMenuLinha(null);
    }

    function enviarContatosEmpresas() {
        if (!empresasLote.length) {
            setEnvioAviso("Selecione ao menos uma empresa.");
            setEmpresasAberto(true);
            return;
        }
        if (!envioMarcados.length) {
            setEnvioAviso("Selecione ao menos um contato.");
            return;
        }
        const n = envioMarcados.length;
        const emp = empresasLote.length;
        setAviso(`${n} ${n === 1 ? "contato enviado" : "contatos enviados"} para ${emp} ${emp === 1 ? "empresa" : "empresas"}.`);
        setMarcados([]);
        setPainel(null);
        setEmpresasLote([]);
        setEnvioAviso("");
    }

    function pedirConfirmacao(tipo) {
        const grupo = lista.filter((c) => marcados.includes(c.id));
        if (!grupo.length) {
            return;
        }
        let alvo = grupo;
        if (tipo === "ativar") {
            alvo = grupo.filter((c) => !c.excluido && c.ativo === false);
        } else if (tipo === "inativar") {
            alvo = grupo.filter((c) => !c.excluido && c.ativo !== false);
        } else if (tipo === "reativar") {
            alvo = grupo.filter((c) => c.excluido);
        } else if (tipo === "excluir") {
            alvo = grupo.filter((c) => !c.excluido);
        }
        if (!alvo.length) {
            return;
        }
        setConfirma({ tipo, ids: alvo.map((c) => c.id) });
        setAberto(null);
    }

    async function executarConfirmacao() {
        if (!confirma) {
            return;
        }
        const { tipo, ids } = confirma;
        const grupo = lista.filter((c) => ids.includes(c.id));
        const patch = (c) => {
            if (tipo === "excluir") {
                return { ...c, excluido: true };
            }
            if (tipo === "reativar") {
                return { ...c, ativo: true, excluido: false };
            }
            return { ...c, ativo: tipo === "ativar" };
        };
        if (tipo !== "excluir") {
            await Promise.all(grupo.map((c) => atualizarCliente(c.id, patch(c)).catch(() => null)));
        }
        setLista((atual) => atual.map((c) => (ids.includes(c.id) ? patch(c) : c)));
        setMarcados([]);
        setConfirma(null);
        setAberto(null);
        setPainel(null);
    }

    async function excluirAnexos() {
        const grupo = selecionados();
        if (!grupo.length) {
            return;
        }
        if (!window.confirm(`Excluir os anexos de ${grupo.length} contato(s)?`)) {
            return;
        }
        await Promise.all(
            grupo.map((c) => atualizarCliente(c.id, { ...c, anexos: [] }).catch(() => null))
        );
        setLista((atual) => atual.map((c) => (
            marcados.includes(c.id) ? { ...c, anexos: [] } : c
        )));
        setMarcados([]);
        setAberto(null);
    }

    function imprimirLista() {
        setAberto(null);
        const campo = (valor) => {
            const texto = String(valor || "").trim();
            return texto ? escaparHtml(texto) : "—";
        };
        const linhas = visiveis.map((contato) => `
            <tr>
                <td>${campo(contato.nome)}</td>
                <td>${campo(contato.fantasia)}</td>
                <td>${campo(contato.cpfCnpj)}</td>
                <td>${campo(nomeCidade(contato.municipio))}</td>
                <td>${campo(contato.celular || contato.telefone || contato.telefone2)}</td>
                <td>${campo(contato.email)}</td>
            </tr>`).join("");
        const porCidade = new Map();
        visiveis.forEach((contato) => {
            const cidade = nomeCidade(contato.municipio) || "Sem cidade";
            porCidade.set(cidade, (porCidade.get(cidade) || 0) + 1);
        });
        let cidadeTopo = "—";
        let qtdCidade = 0;
        porCidade.forEach((qtd, cidade) => {
            if (qtd > qtdCidade) {
                qtdCidade = qtd;
                cidadeTopo = cidade;
            }
        });
        const emails = visiveis.filter((contato) => String(contato.email || "").trim()).length;
        const numero = (valor) => String(valor).padStart(2, "0");
        const janela = window.open("", "_blank");
        if (!janela) {
            setAviso("O navegador bloqueou a janela de impressão.");
            return;
        }
        janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Tem de Tudo - Contatos</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #1c1c1c; font: 11px Arial, sans-serif; }
  .faixa { display: flex; justify-content: space-between; color: #777; font-size: 10px; margin-bottom: 14px; }
  .marca { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 16px; }
  .loja { display: flex; gap: 10px; align-items: center; }
  .selo { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 999px; background: #111; color: #fff; font-weight: 700; }
  .loja strong { display: block; font-size: 16px; letter-spacing: 0.04em; }
  .loja small { color: #555; }
  .docu { text-align: right; }
  .docu strong { display: block; font-size: 13px; letter-spacing: 0.08em; }
  h1 { margin: 0; font-size: 20px; }
  .resumo { margin: 2px 0 14px; color: #666; }
  .totais { display: flex; gap: 10px; margin-bottom: 16px; }
  .totais div { min-width: 120px; padding: 10px 12px; border: 1px solid #e6e6e6; border-radius: 8px; }
  .totais b { display: block; font-size: 18px; }
  .totais span { color: #666; font-size: 10px; letter-spacing: 0.06em; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 7px 8px; text-align: left; vertical-align: top; border-bottom: 1px solid #ececec; }
  th { font-size: 10px; border-bottom: 2px solid #222; }
  tr { break-inside: avoid; }
  .rodape { margin-top: 18px; color: #888; font-size: 9px; }
  .vazio { color: #666; }
</style>
</head>
<body>
  <div class="faixa"><span>Tem de Tudo • Cadastro de Contatos</span><span>Página 1</span></div>
  <header class="marca">
    <div class="loja">
      <span class="selo">T</span>
      <div>
        <strong>TEM DE TUDO</strong>
        <small>Papelaria, Presentes e Personalizados • Gráfica LTDA</small>
      </div>
    </div>
    <div class="docu"><strong>CADASTRO DE CONTATOS</strong></div>
  </header>
  <h1>Contatos</h1>
  <p class="resumo">Relação de contatos extraída do cadastro enviado.</p>
  <div class="totais">
    <div><b>${numero(visiveis.length)}</b><span>CONTATOS</span></div>
    <div><b>${numero(qtdCidade)}</b><span>${escaparHtml(cidadeTopo.toUpperCase())}</span></div>
    <div><b>${numero(emails)}</b><span>E-MAILS</span></div>
  </div>
  ${linhas
        ? `<table><thead><tr><th>Nome / Razão Social</th><th>Nome Fantasia</th><th>CPF / CNPJ</th><th>Cidade</th><th>Telefone / Celular</th><th>E-mail</th></tr></thead><tbody>${linhas}</tbody></table>`
        : `<p class="vazio">Nenhum contato para imprimir.</p>`}
  <p class="rodape">Documento gerado a partir do arquivo de contatos fornecido. Campos sem informação foram apresentados como “—”.</p>
</body>
</html>`);
        janela.document.close();
        janela.focus();
        setTimeout(() => janela.print(), 250);
    }

    function imprimirAgrupados() {
        setAberto(null);
        const grupos = new Map();
        visiveis.forEach((contato) => {
            const chave = rotuloCidade(contato);
            if (!grupos.has(chave)) {
                grupos.set(chave, []);
            }
            grupos.get(chave).push(contato);
        });
        const blocos = [...grupos.entries()]
            .sort((a, b) => a[0].localeCompare(b[0], "pt-BR", { sensitivity: "base" }))
            .map(([cidade, contatos]) => {
                const ordenados = [...contatos].sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" }));
                const linhas = ordenados.map((contato) => `
                    <tr>
                        <td>${escaparHtml(contato.nome)}</td>
                        <td>${escaparHtml(contato.fantasia)}</td>
                        <td>${escaparHtml(contato.cpfCnpj)}</td>
                        <td>${escaparHtml(contato.celular || contato.telefone || "")}</td>
                        <td>${escaparHtml(contato.email)}</td>
                    </tr>`).join("");
                return `<section><h2>${escaparHtml(cidade)} <span>${ordenados.length}</span></h2><table><thead><tr><th>Nome</th><th>Fantasia</th><th>CPF/CNPJ</th><th>Telefone / Celular</th><th>E-mail</th></tr></thead><tbody>${linhas}</tbody></table></section>`;
            }).join("");
        const janela = window.open("", "_blank");
        if (!janela) {
            setAviso("O navegador bloqueou a janela de impressão.");
            return;
        }
        janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>ERP da Olist - Cadastros agrupados</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #222; font: 11px Arial, sans-serif; }
  h1 { margin: 0 0 16px; font-size: 18px; }
  h2 { margin: 18px 0 8px; font-size: 14px; }
  h2 span { color: #666; font-size: 12px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6px 8px; text-align: left; vertical-align: top; border-bottom: 1px solid #e4e4e4; }
  th { border-bottom: 2px solid #222; }
  tr, section { break-inside: avoid; }
  .vazio { color: #666; }
</style>
</head>
<body>
  <h1>Cadastros agrupados</h1>
  ${blocos || `<p class="vazio">Nenhum contato para imprimir.</p>`}
</body>
</html>`);
        janela.document.close();
        janela.focus();
        setTimeout(() => janela.print(), 250);
    }

    function abrirEtiquetas() {
        const ids = visiveis.filter((c) => marcados.includes(c.id) && !c.excluido).map((c) => c.id);
        if (!ids.length) {
            return;
        }
        setEtiquetas({
            modelo: "padrao",
            tamanho: "avery5160",
            campos: { nome: true, doc: true, telefone: false, cidade: true, endereco: false },
            ordem: "lista",
            ids
        });
        setAberto(null);
    }

    function contatosDaEtiqueta() {
        if (!etiquetas) {
            return [];
        }
        const porId = new Map(lista.map((c) => [c.id, c]));
        const itens = etiquetas.ids.map((id) => porId.get(id)).filter(Boolean);
        if (etiquetas.ordem === "alfa") {
            return [...itens].sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" }));
        }
        return itens;
    }

    function imprimirEtiquetas() {
        if (!etiquetas) {
            return;
        }
        const tamanho = ETIQUETA_TAMANHOS.find((item) => item.id === etiquetas.tamanho) || ETIQUETA_TAMANHOS[0];
        const contatos = contatosDaEtiqueta();
        const porPagina = tamanho.cols * tamanho.rows;
        const paginas = [];
        for (let i = 0; i < contatos.length; i += porPagina) {
            paginas.push(contatos.slice(i, i + porPagina));
        }
        const miolo = paginas.map((pagina) => {
            const celulas = pagina.map((contato) => {
                const linhas = linhasEtiqueta(contato, etiquetas.campos).map((linha) => (
                    `<div class="${linha.tipo}">${escaparHtml(linha.texto)}</div>`
                )).join("");
                return `<article class="etiqueta">${linhas}</article>`;
            }).join("");
            return `<section class="pagina">${celulas}</section>`;
        }).join("");
        const janela = window.open("", "_blank");
        if (!janela) {
            setAviso("O navegador bloqueou a janela de impressão.");
            return;
        }
        janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Etiquetas - Contatos</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, sans-serif; color: #1c1c1c; }
  .pagina {
    display: grid;
    grid-template-columns: repeat(${tamanho.cols}, ${tamanho.largura}mm);
    grid-auto-rows: ${tamanho.altura}mm;
    justify-content: center;
    gap: 0;
    break-after: page;
  }
  .pagina:last-child { break-after: auto; }
  .etiqueta {
    overflow: hidden;
    padding: 1.4mm 2.2mm;
    border: 0.2mm solid transparent;
  }
  .nome { font-size: 8pt; font-weight: 700; line-height: 1.15; text-transform: uppercase; }
  .doc, .tel, .cidade, .end { font-size: 7pt; line-height: 1.2; }
</style>
</head>
<body>${miolo}</body>
</html>`);
        janela.document.close();
        janela.focus();
        setTimeout(() => janela.print(), 250);
        setMarcados([]);
        setEtiquetas(null);
        setAberto(null);
    }

    async function vincularVendedor() {
        if (!vendedorLote.trim()) {
            return;
        }
        const nome = vendedorLote.trim();
        await Promise.all(
            selecionados().map((c) => atualizarCliente(c.id, { ...c, vendedor: nome }).catch(() => null))
        );
        setLista((atual) => atual.map((c) => (
            marcados.includes(c.id) ? { ...c, vendedor: nome } : c
        )));
        setMarcados([]);
        setPainel(null);
        setVendedorLote("");
    }

    async function definirTipo() {
        await Promise.all(
            selecionados().map((c) => atualizarCliente(c.id, { ...c, tipos: [tipoLote] }).catch(() => null))
        );
        setLista((atual) => atual.map((c) => (
            marcados.includes(c.id) ? { ...c, tipos: [tipoLote] } : c
        )));
        setMarcados([]);
        setPainel(null);
    }

    async function vincularListaPreco() {
        const lista = LISTAS_PRECO.find((item) => item.id === listaPrecoLote);
        if (!lista) {
            return;
        }
        await Promise.all(
            selecionados().map((c) => atualizarCliente(c.id, { ...c, listaPreco: lista.nome }).catch(() => null))
        );
        setLista((atual) => atual.map((c) => (
            marcados.includes(c.id) ? { ...c, listaPreco: lista.nome } : c
        )));
        setAviso(`Lista ${lista.nome} vinculada a ${marcados.length} ${marcados.length === 1 ? "contato" : "contatos"}.`);
        setMarcados([]);
        setListaPrecoLote("");
        setPainel(null);
        setAberto(null);
    }

    async function unificar() {
        const grupo = selecionados();
        if (grupo.length < 2) {
            return;
        }
        const restantes = grupo.slice(1);
        const ids = restantes.map((c) => c.id);
        await Promise.all(ids.map((id) => excluirCliente(id).catch(() => null)));
        setLista((atual) => atual.filter((c) => !ids.includes(c.id)));
        setMarcados([]);
        setPainel(null);
        setAberto(null);
    }

    function limparFiltros() {
        setBusca("");
        setRefino("");
        setSituacao("sem");
        setPeriodo(periodoVazio());
        setFiltros({ vendedor: "", municipio: "", uf: "" });
        setRascunho({ vendedor: "", municipio: "", uf: "" });
        setSubFiltro(null);
        setAberto(null);
    }

    const temFiltro = busca || refino || situacao !== "sem" || periodo.modo !== "sem" || filtros.uf || filtros.municipio || filtros.vendedor;
    const rotuloOrdem = ORDENS.find((item) => item.id === ordem)?.label || "nome";
    const ufSelecionada = (rascunho.uf || "").trim().toUpperCase();
    const vendedores = useMemo(
        () => listarFuncionarios()
            .map((func) => ({ id: func.id, nome: nomePessoa(func.nome) }))
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
        []
    );

    useEffect(() => {
        if (!ufSelecionada) {
            setCidadesIbge([]);
            setCidadesStatus("");
            return undefined;
        }
        let ativo = true;
        setCidadesStatus("carregando");
        municipiosPorUf(ufSelecionada)
            .then((nomes) => {
                if (!ativo) {
                    return;
                }
                setCidadesIbge(nomes);
                setCidadesStatus("");
                setRascunho((atual) => {
                    if ((atual.uf || "").trim().toUpperCase() !== ufSelecionada) {
                        return atual;
                    }
                    const escolhida = (atual.municipio || "").toLocaleLowerCase("pt-BR");
                    if (!escolhida) {
                        return atual;
                    }
                    const existe = nomes.some((cidade) => cidade.toLocaleLowerCase("pt-BR") === escolhida);
                    return existe ? atual : { ...atual, municipio: "" };
                });
            })
            .catch(() => {
                if (!ativo) {
                    return;
                }
                setCidadesIbge([]);
                setCidadesStatus("erro");
            });
        return () => {
            ativo = false;
        };
    }, [ufSelecionada]);

    const paginas = faixasPagina(paginaAtual, totalPaginas);

    function abrirIrPagina() {
        setNumeroPagina(String(paginaAtual));
        setIrPagina(true);
        setAberto(null);
        setMenuLinha(null);
    }

    function confirmarPagina(ev) {
        ev.preventDefault();
        const n = Number(numeroPagina);
        if (!Number.isInteger(n) || n < 1 || n > totalPaginas) {
            return;
        }
        setPagina(n);
        setIrPagina(false);
    }

    const termoEnvio = buscaEnvio.trim().toLowerCase();
    const contatosEnvio = lista
        .filter((c) => envioBase.includes(c.id))
        .filter((c) => {
            if (!termoEnvio) {
                return true;
            }
            const nome = String(c.nome || "").toLowerCase();
            const doc = String(c.cpfCnpj || "").toLowerCase();
            return nome.includes(termoEnvio) || doc.includes(termoEnvio) || soDigitos(c.cpfCnpj).includes(soDigitos(termoEnvio));
        })
        .sort((a, b) => {
            const cmp = String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" });
            return ordemEnvio === "desc" ? -cmp : cmp;
        });
    const todosEnvioMarcados = contatosEnvio.length > 0 && contatosEnvio.every((c) => envioMarcados.includes(c.id));
    const lojaAtual = unidadeAtual();
    const empresasDestino = unidadesDestino();
    const nomesEmpresas = empresasDestino.filter((emp) => empresasLote.includes(emp.id)).map((emp) => emp.nome);
    const rotuloEmpresas = nomesEmpresas.length === 0
        ? "Selecionar empresas"
        : nomesEmpresas.length === 1
            ? nomesEmpresas[0]
            : `${nomesEmpresas.length} empresas selecionadas`;

    function marcarEnvioVisiveis(marcado) {
        const ids = contatosEnvio.map((c) => c.id);
        setEnvioMarcados((atual) => (
            marcado ? [...new Set([...atual, ...ids])] : atual.filter((id) => !ids.includes(id))
        ));
        setEnvioAviso("");
    }

    const marcadosAgora = lista.filter((c) => marcados.includes(c.id));
    const podeAtivar = marcadosAgora.some((c) => !c.excluido && c.ativo === false);
    const podeInativar = marcadosAgora.some((c) => !c.excluido && c.ativo !== false);
    const podeRestaurar = marcadosAgora.some((c) => c.excluido);

    return (
        <div className="ctt-page ctt-loja has-pager" ref={raiz}>
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <Link to="/contatos#/">Cadastros</Link>
                <span>›</span>
                <Link to="/contatos#/" aria-current="page">Clientes e Fornecedores</Link>
            </nav>

            <div className="ctt-hero">
                <div>
                    <h2>Clientes e Fornecedores</h2>
                    <p className="ctt-sub">
                        {carregando
                            ? "Carregando cadastros do servidor..."
                            : "Cadastre e gerencie clientes, fornecedores e parceiros comerciais da sua loja."}
                    </p>
                    {erroApi ? <p className="ctt-sub ctt-erro">{erroApi}</p> : null}
                    {aviso ? <p className="ctt-sub ctt-ok">{aviso}</p> : null}
                </div>
                <div className="ctt-acoes">
                    <div className="ctt-drop">
                        <button
                            type="button"
                            className="ctt-btn-incluir"
                            onClick={() => navigate("/contatos#/add")}
                        >
                            <Plus size={16} />
                            Incluir cadastro
                        </button>
                        <button
                            type="button"
                            className={`ctt-btn-incluir-mais${aberto === "mais" ? " is-on" : ""}`}
                            aria-label="Mais ações de cadastro"
                            onClick={() => setAberto(aberto === "mais" ? null : "mais")}
                        >
                            <ChevronDown size={16} />
                        </button>
                        {aberto === "mais" ? (
                            <div className="ctt-menu">
                                <button type="button" onClick={imprimirLista}>Imprimir</button>
                                <button type="button" onClick={imprimirAgrupados}>Imprimir cadastros agrupados</button>
                                <button type="button" onClick={() => { setNiverAberto(true); setAberto(null); }}>Listar aniversariantes</button>
                                <button type="button" onClick={() => { exportarCsv(visiveis); setAberto(null); }}>
                                    Exportar (.csv)
                                </button>
                                <button type="button" onClick={() => { exportarXlsx(visiveis); setAberto(null); }}>
                                    Exportar (.xlsx)
                                </button>
                                <button type="button" disabled={importando} onClick={() => { xlsRef.current?.click(); setAberto(null); }}>
                                    {importando ? "Importando planilha…" : "Importar Planilha (.xls)"}
                                </button>
                                <button type="button" disabled={importando} onClick={() => { setImportadorMassa(true); setAberto(null); }}>
                                    Importar Planilha em Massa (.xls)
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <input
                ref={xlsRef}
                type="file"
                hidden
                accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => importarExcel(e.target.files?.[0])}
            />

            <div className="ctt-toolbar">
                <div className="ctt-busca-linha">
                    <label className="fer-search ctt-busca">
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    setBusca("");
                                }
                            }}
                            placeholder={PLACEHOLDERS[refino] || PLACEHOLDERS[""]}
                            aria-label="Pesquisar cadastros"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        {busca ? (
                            <button type="button" className="ctt-busca-limpar" onClick={() => setBusca("")} aria-label="Limpar busca">
                                <X size={14} />
                            </button>
                        ) : null}
                        <Search size={16} />
                    </label>
                    <div className="ctt-drop">
                        <button
                            type="button"
                            className={`ctt-refinar${refino || aberto === "refino" ? " is-on" : ""}`}
                            aria-label="Refinar busca"
                            onClick={() => setAberto(aberto === "refino" ? null : "refino")}
                        >
                            <SlidersHorizontal size={16} />
                            <ChevronDown size={14} />
                        </button>
                        {aberto === "refino" ? (
                            <div className="ctt-menu ctt-menu-refino">
                                <p>Refinar Busca</p>
                                {REFINOS.map((opcao) => (
                                    <button
                                        key={opcao.id || "nao"}
                                        type="button"
                                        className={refino === opcao.id ? "is-sel" : ""}
                                        onClick={() => { setRefino(opcao.id); setAberto(null); }}
                                    >
                                        {opcao.label}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                <div className="ctt-chips">
                    <div className="ctt-drop">
                        <button
                            type="button"
                            className="ctt-filtros-btn"
                            onClick={() => {
                                const abrindo = aberto !== "filtros";
                                setRascunho(filtros);
                                setRascunhoPeriodo(periodo);
                                setSubFiltro(abrindo ? "data" : null);
                                setAberto(abrindo ? "filtros" : null);
                            }}
                        >
                            <Filter size={16} />
                            Filtros
                        </button>
                        {aberto === "filtros" ? (
                            <div className="ctt-menu ctt-menu-form ctt-filtros-painel">
                                <strong>Filtros</strong>
                                <div className="ctt-chips">
                                    <button
                                        type="button"
                                        className={`ctt-chip${subFiltro === "data" ? " is-on" : ""}`}
                                        onClick={() => setSubFiltro("data")}
                                    >
                                        <CalendarDays size={14} />
                                        por data do cadastro
                                    </button>
                                    <button
                                        type="button"
                                        className={`ctt-chip${subFiltro === "ordem" ? " is-on" : ""}`}
                                        onClick={() => setSubFiltro("ordem")}
                                    >
                                        <ArrowDownUp size={14} />
                                        {rotuloOrdem}
                                    </button>
                                    <button
                                        type="button"
                                        className={`ctt-chip${subFiltro === "situacao" ? " is-on" : ""}`}
                                        onClick={() => setSubFiltro("situacao")}
                                    >
                                        <Tag size={14} />
                                        por situação
                                    </button>
                                </div>
                                <div className="ctt-filtros-corpo">
                                    <div className="ctt-filtros-card">
                                        {subFiltro === "ordem" ? (
                                            <>
                                                <p className="ctt-filtros-titulo">Ordenar por</p>
                                                <div className="ctt-pills">
                                                    {ORDENS.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            className={ordem === item.id ? "is-on" : ""}
                                                            onClick={() => setOrdem(item.id)}
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        ) : null}
                                        {subFiltro === "situacao" ? (
                                            <>
                                                <p className="ctt-filtros-titulo">Situação</p>
                                                <div className="ctt-pills">
                                                    {SITUACOES.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            className={situacao === item.id ? "is-on" : ""}
                                                            onClick={() => setSituacao(item.id)}
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        ) : null}
                                        {subFiltro === "data" ? (
                                            <>
                                                <p className="ctt-filtros-titulo">Período</p>
                                                <div className="ctt-pills">
                                                    {[
                                                        ["sem", "sem filtro"],
                                                        ["dia", "dia"],
                                                        ["intervalo", "período"],
                                                        ["mes", "mês"]
                                                    ].map(([id, nome]) => (
                                                        <button
                                                            key={id}
                                                            type="button"
                                                            className={rascunhoPeriodo.modo === id ? "is-on" : ""}
                                                            onClick={() => setRascunhoPeriodo((atual) => ({
                                                                ...atual,
                                                                modo: id,
                                                                dia: id === "dia" ? (atual.dia || isoLocal(new Date())) : atual.dia
                                                            }))}
                                                        >
                                                            {nome}
                                                        </button>
                                                    ))}
                                                </div>
                                                {rascunhoPeriodo.modo === "dia" ? (
                                                    <CampoData
                                                        rotulo="Data"
                                                        iso={rascunhoPeriodo.dia}
                                                        iconeEsquerda
                                                        onLimpar={() => setRascunhoPeriodo((atual) => ({ ...atual, dia: "" }))}
                                                        onChange={(dia) => setRascunhoPeriodo((atual) => ({ ...atual, dia }))}
                                                    />
                                                ) : null}
                                                {rascunhoPeriodo.modo === "mes" ? (
                                                    <label className="ctt-data-campo">
                                                        Mês
                                                        <div className="ctt-mes-caixa">
                                                            <button type="button" aria-label="Mês anterior" onClick={() => setRascunhoPeriodo((atual) => mudarMesPeriodo(atual, -1))}>‹</button>
                                                            <span>{String(rascunhoPeriodo.mes + 1).padStart(2, "0")}/{rascunhoPeriodo.ano}</span>
                                                            <button type="button" aria-label="Próximo mês" onClick={() => setRascunhoPeriodo((atual) => mudarMesPeriodo(atual, 1))}>›</button>
                                                        </div>
                                                    </label>
                                                ) : null}
                                                {rascunhoPeriodo.modo === "intervalo" ? (
                                                    <div className="ctt-datas">
                                                        <CampoData
                                                            rotulo="Data inicial"
                                                            prefixo="De"
                                                            iso={rascunhoPeriodo.de}
                                                            onChange={(de) => setRascunhoPeriodo((atual) => ({ ...atual, de }))}
                                                        />
                                                        <CampoData
                                                            rotulo="Data final"
                                                            prefixo="Até"
                                                            iso={rascunhoPeriodo.ate}
                                                            onChange={(ate) => setRascunhoPeriodo((atual) => ({ ...atual, ate }))}
                                                        />
                                                    </div>
                                                ) : null}
                                            </>
                                        ) : null}
                                    </div>
                                    <div className="ctt-filtros-card">
                                        <label>
                                            Vendedor
                                            <span className="ctt-campo-ico">
                                                <UserRound size={16} />
                                                <select
                                                    value={rascunho.vendedor}
                                                    onChange={(e) => setRascunho((a) => ({ ...a, vendedor: e.target.value }))}
                                                >
                                                    <option value="">Qualquer vendedor</option>
                                                    {vendedores.map((func) => (
                                                        <option key={func.id} value={func.nome}>{func.nome}</option>
                                                    ))}
                                                </select>
                                            </span>
                                        </label>
                                        <label>
                                            Estado
                                            <span className="ctt-campo-ico">
                                                <MapPin size={16} />
                                                <select
                                                    value={rascunho.uf}
                                                    onChange={(e) => {
                                                        const uf = e.target.value;
                                                        setRascunho((a) => ({ ...a, uf, municipio: "" }));
                                                    }}
                                                >
                                                    <option value="">Selecione</option>
                                                    {ESTADOS.map((uf) => (
                                                        <option key={uf} value={uf}>{uf}</option>
                                                    ))}
                                                </select>
                                            </span>
                                        </label>
                                        <label>
                                            Cidade
                                            <span className="ctt-campo-ico">
                                                <Building2 size={16} />
                                                <select
                                                    value={rascunho.municipio}
                                                    disabled={!ufSelecionada || cidadesStatus !== ""}
                                                    title={ufSelecionada ? "Municípios oficiais do IBGE" : "Selecione o estado primeiro"}
                                                    onChange={(e) => setRascunho((a) => ({ ...a, municipio: e.target.value }))}
                                                >
                                                    <option value="">
                                                        {!ufSelecionada
                                                            ? "Selecione o estado"
                                                            : cidadesStatus === "carregando"
                                                                ? "Carregando cidades..."
                                                                : cidadesStatus === "erro"
                                                                    ? "Não foi possível carregar"
                                                                    : "Todas"}
                                                    </option>
                                                    {cidadesIbge.map((cidade) => (
                                                        <option key={cidade} value={cidade}>{cidade}</option>
                                                    ))}
                                                </select>
                                            </span>
                                        </label>
                                        <div className="ctt-filtros-acoes">
                                            <button
                                                type="button"
                                                className="ctt-aplicar"
                                                onClick={() => {
                                                    setFiltros(rascunho);
                                                    setPeriodo(rascunhoPeriodo);
                                                    setSubFiltro(null);
                                                    setAberto(null);
                                                }}
                                            >
                                                <Filter size={14} />
                                                Aplicar filtros
                                            </button>
                                            <button type="button" className="ctt-cancelar" onClick={() => { setSubFiltro(null); setAberto(null); }}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                    {temFiltro ? (
                        <button type="button" className="ctt-limpar" onClick={limparFiltros}>
                            <Ban size={14} />
                            limpar filtros
                        </button>
                    ) : null}
                </div>
                </div>

                <div className="ctt-tabs-linha">
                <div className="ctt-tabs">
                    {ABAS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            className={aba === tab.id ? "is-active" : ""}
                            onClick={() => setAba(tab.id)}
                        >
                            <span>{tab.label}</span>
                            <strong>{qtdTab(contagens[tab.id])}</strong>
                        </button>
                    ))}
                </div>
                <div className="ctt-cols">
                    <button
                        type="button"
                        className={`ctt-cols-btn${aberto === "colunas" ? " is-on" : ""}`}
                        title="Configurar informações visíveis"
                        aria-label="Configurar informações visíveis"
                        onClick={() => {
                            if (aberto === "colunas") {
                                setAberto(null);
                                return;
                            }
                            setRascunhoColunas(colunas);
                            setAberto("colunas");
                        }}
                    >
                        <SlidersHorizontal size={16} />
                    </button>
                    {aberto === "colunas" ? (
                        <div className="ctt-cols-painel" onMouseDown={(e) => e.stopPropagation()}>
                            <header>
                                <strong>Informações visíveis</strong>
                                <button type="button" onClick={() => setAberto(null)}>
                                    fechar <X size={14} />
                                </button>
                            </header>
                            <p>Selecione abaixo quais informações deseja que estejam visíveis</p>
                            <label className="ctt-cols-todas">
                                <input
                                    type="checkbox"
                                    checked={rascunhoColunas.length === COLUNAS.length}
                                    onChange={(e) => setRascunhoColunas(e.target.checked ? COLUNAS.map((c) => c.id) : [...COLUNAS_PADRAO])}
                                />
                                Colunas
                            </label>
                            <ul>
                                {COLUNAS.map((c) => {
                                    const ligada = rascunhoColunas.includes(c.id);
                                    return (
                                        <li key={c.id}>
                                            <span>{c.label}</span>
                                            <button
                                                type="button"
                                                className={`ctt-switch${ligada ? " is-on" : ""}`}
                                                role="switch"
                                                aria-checked={ligada}
                                                aria-label={c.label}
                                                onClick={() => setRascunhoColunas((atual) => (
                                                    ligada ? atual.filter((id) => id !== c.id) : [...atual, c.id]
                                                ))}
                                            >
                                                <i />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="ctt-menu-acoes">
                                <button
                                    type="button"
                                    className="idx-pill int-add"
                                    onClick={() => {
                                        const next = ordenarColunas(rascunhoColunas);
                                        setColunas(next);
                                        localStorage.setItem(COLUNAS_KEY, JSON.stringify(next));
                                        setAberto(null);
                                    }}
                                >
                                    aplicar
                                </button>
                                <button type="button" className="ctt-ghost" onClick={() => setAberto(null)}>
                                    cancelar
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
                </div>
            </div>

            <div className="erp-table-scroll">
            {!fatia.length && temFiltro ? (
                <div className="ctt-vazio-filtros">
                    <IlustracaoBusca />
                    <h3>Nenhum cadastro com esses filtros.</h3>
                    <p>Não encontramos clientes ou fornecedores que atendam aos filtros selecionados.</p>
                    <button type="button" className="ctt-vazio-limpar" onClick={limparFiltros}>
                        <CircleX size={16} />
                        Limpar filtros
                    </button>
                </div>
            ) : (
            <table className="fer-table ctt-table">
                <thead>
                    <tr>
                        <th className="ctt-check">
                            <input
                                type="checkbox"
                                checked={fatia.length > 0 && fatia.every((c) => marcados.includes(c.id))}
                                onChange={marcarPagina}
                                aria-label="Selecionar página"
                            />
                        </th>
                        {COLUNAS.filter((c) => colunas.includes(c.id)).map((c) => (
                            <th key={c.id}>
                                {c.sort ? (
                                    <button type="button" className="ctt-th" onClick={() => setOrdem(c.sort)}>
                                        {c.label} ↕
                                    </button>
                                ) : c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {fatia.length ? fatia.map((c) => {
                        const quando = quandoCadastro(c.dataCadastro);
                        const tipo = (c.tipos || ["cliente"])[0];
                        return (
                        <tr
                            key={c.id}
                            className={`ctt-linha${marcados.includes(c.id) ? " is-sel" : ""}`}
                            onClick={() => navigate(`/contatos/${c.id}`)}
                        >
                            <td className="ctt-check" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={marcados.includes(c.id)}
                                    onChange={() => toggleMarca(c.id)}
                                    aria-label={`Selecionar ${c.nome}`}
                                />
                            </td>
                            {COLUNAS.filter((col) => colunas.includes(col.id)).map((col) => {
                                if (col.id === "nome") {
                                    return (
                                        <td key={col.id} className="ctt-nome-cell" onClick={(e) => e.stopPropagation()}>
                                            <div className="ctt-row-menu">
                                                <button
                                                    type="button"
                                                    onClick={() => setMenuLinha(menuLinha === c.id ? null : c.id)}
                                                    aria-label={`Ações de ${c.nome}`}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                {menuLinha === c.id ? (
                                                    <div className="ctt-menu is-row" role="menu">
                                                        <div className="ctt-menu-cab">
                                                            <span className="ctt-menu-pontos" aria-hidden="true">
                                                                <MoreHorizontal size={14} />
                                                            </span>
                                                            <strong title={c.nome}>{c.nome}</strong>
                                                        </div>
                                                        {gruposAcao(c.id).map((grupo, indice) => (
                                                            <div key={indice} className="ctt-menu-grupo">
                                                                {indice ? <hr /> : null}
                                                                {grupo.map((item) => {
                                                                    const Icone = item.icon;
                                                                    return (
                                                                        <button
                                                                            key={item.label}
                                                                            type="button"
                                                                            role="menuitem"
                                                                            onClick={() => {
                                                                                setMenuLinha(null);
                                                                                if (item.to) navigate(item.to);
                                                                                else if (item.acao === "empresas") abrirEnvioEmpresas([c.id]);
                                                                                else setAviso(item.aviso);
                                                                            }}
                                                                        >
                                                                            <Icone size={16} />
                                                                            {item.label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>
                                            <Link to={`/contatos/${c.id}`} className="ctt-nome">
                                                {c.nome}
                                                {c.fantasia ? <small> / {c.fantasia}</small> : null}
                                            </Link>
                                        </td>
                                    );
                                }
                                if (col.id === "cpf") {
                                    return <td key={col.id}>{c.cpfCnpj || "—"}</td>;
                                }
                                if (col.id === "contato") {
                                    return (
                                        <td key={col.id}>
                                            {c.celular || c.telefone || "—"}
                                            {c.email ? <small>{c.email}</small> : null}
                                        </td>
                                    );
                                }
                                if (col.id === "cidade") {
                                    return <td key={col.id}>{c.municipio ? `${c.municipio}${c.uf ? ` - ${c.uf}` : ""}` : "—"}</td>;
                                }
                                if (col.id === "situacao") {
                                    return (
                                        <td key={col.id}>
                                            <span className={`ctt-sit ${c.excluido || c.ativo === false ? "is-off" : "is-on"}`}>
                                                {c.excluido ? "Excluído" : c.ativo === false ? "Inativo" : "Ativo"}
                                            </span>
                                        </td>
                                    );
                                }
                                if (col.id === "tipo") {
                                    return (
                                        <td key={col.id}>
                                            <span className={`ctt-tipo ctt-tipo-${tipo}`}>{capital(tipo)}</span>
                                        </td>
                                    );
                                }
                                return (
                                    <td key={col.id} className="ctt-quando">
                                        <span>{quando.data}</span>
                                        <small>{quando.hora}</small>
                                    </td>
                                );
                            })}
                        </tr>
                        );
                    }) : (
                        <tr>
                            <td colSpan={1 + colunas.length} className="ctt-vazio">
                                <strong>Nenhum cadastro encontrado.</strong>
                                <button type="button" className="ctt-btn-incluir" onClick={() => navigate("/contatos#/add")}>
                                    <Plus size={16} />
                                    Incluir cadastro
                                </button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            )}
            </div>

            {marcados.length && visiveis.length ? (
                <div className="ctt-lote">
                    <div className="ctt-lote-esq">
                        <span className="ctt-lote-qtd">
                            <ArrowUp size={16} />
                            <strong>{String(marcados.length).padStart(2, "0")}</strong>
                            <span>de {visiveis.length} Contatos</span>
                            <button
                                type="button"
                                className="ctt-lote-limpar"
                                aria-label="Limpar seleção"
                                onClick={() => { setMarcados([]); setAberto(null); }}
                            >
                                <X size={14} />
                            </button>
                        </span>
                        <button type="button" className="ctt-lote-primario" onClick={abrirEtiquetas}>
                            <Printer size={15} />
                            imprimir etiquetas
                        </button>
                        {podeAtivar ? (
                            <button type="button" className="ctt-lote-sec" onClick={() => pedirConfirmacao("ativar")}>
                                <Check size={15} />
                                ativar contatos
                            </button>
                        ) : null}
                        {podeInativar ? (
                            <button type="button" className="ctt-lote-sec" onClick={() => pedirConfirmacao("inativar")}>
                                <X size={15} />
                                inativar contatos
                            </button>
                        ) : null}
                        {podeRestaurar ? (
                            <button type="button" className="ctt-lote-sec" onClick={() => pedirConfirmacao("reativar")}>
                                <UserRoundPlus size={15} />
                                restaurar cadastros
                            </button>
                        ) : null}
                        <button type="button" className="ctt-lote-sec" onClick={() => pedirConfirmacao("excluir")}>
                            <Trash2 size={15} />
                            excluir contato
                        </button>
                    </div>
                    <div className="ctt-drop">
                        <button
                            type="button"
                            className={`ctt-lote-mais${aberto === "lote" ? " is-on" : ""}`}
                            onClick={() => setAberto(aberto === "lote" ? null : "lote")}
                        >
                            mais ações
                            <MoreHorizontal size={16} />
                        </button>
                        {aberto === "lote" ? (
                            <div className="ctt-menu ctt-menu-up ctt-menu-lote">
                                <button type="button" onClick={abrirEtiquetas}>
                                    <Printer size={15} />
                                    imprimir etiquetas
                                </button>
                                <button type="button" onClick={() => { setPainel("vendedor"); setAberto(null); }}>
                                    <UserRound size={15} />
                                    vincular a vendedor
                                </button>
                                <button type="button" onClick={() => { setListaPrecoLote(""); setPainel("precos"); setAberto(null); }}>
                                    <List size={15} />
                                    vincular a lista de preços
                                </button>
                                <button type="button" onClick={() => { setPainel("tipo"); setAberto(null); }}>
                                    <Users size={15} />
                                    definir tipo de contato
                                </button>
                                <button type="button" onClick={unificar}>
                                    <Link2 size={15} />
                                    unificar cadastros
                                </button>
                                <button type="button" onClick={() => { exportarCsv(selecionados()); setMarcados([]); setAberto(null); }}>
                                    <Share2 size={15} />
                                    exportar para o SIGEP
                                </button>
                                <hr />
                                {podeAtivar ? (
                                    <button type="button" onClick={() => pedirConfirmacao("ativar")}>
                                        <Check size={15} />
                                        ativar contatos
                                    </button>
                                ) : null}
                                {podeInativar ? (
                                    <button type="button" onClick={() => pedirConfirmacao("inativar")}>
                                        <X size={15} />
                                        inativar contatos
                                    </button>
                                ) : null}
                                {podeRestaurar ? (
                                    <button type="button" onClick={() => pedirConfirmacao("reativar")}>
                                        <UserRoundPlus size={15} />
                                        restaurar cadastros
                                    </button>
                                ) : null}
                                <button type="button" onClick={excluirAnexos}>
                                    <Trash2 size={15} />
                                    excluir anexos dos contatos
                                </button>
                                <button type="button" onClick={() => pedirConfirmacao("excluir")}>
                                    <Trash2 size={15} />
                                    excluir contato
                                </button>
                                <hr />
                                <button type="button" onClick={abrirEnvioEmpresas}>
                                    <Building2 size={15} />
                                    enviar cadastros para empresas
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}

            <div className="ctt-foot">
                <p>
                    Mostrando {visiveis.length ? inicio + 1 : 0} a {Math.min(inicio + porPagina, visiveis.length)} de {visiveis.length} registros
                </p>
                <nav className="ctt-pag" aria-label="Páginas">
                    <button type="button" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)} aria-label="Anterior">
                        <ChevronLeft size={16} />
                    </button>
                    {paginas.map((item) => (
                        item.tipo === "reticencias" ? (
                            <button
                                key={item.id}
                                type="button"
                                className="ctt-pag-gap"
                                title="Navegar por página"
                                aria-label="Navegar por página"
                                onClick={abrirIrPagina}
                            >
                                …
                            </button>
                        ) : (
                            <button
                                key={item.n}
                                type="button"
                                className={item.n === paginaAtual ? "is-active" : ""}
                                onClick={() => setPagina(item.n)}
                            >
                                {String(item.n).padStart(2, "0")}
                            </button>
                        )
                    ))}
                    <button type="button" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)} aria-label="Próxima">
                        <ChevronRight size={16} />
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


            {irPagina ? (
                <div className="ctt-modal-bg ctt-ir-bg" onClick={() => setIrPagina(false)}>
                    <form className="ctt-modal ctt-ir-pagina" onClick={(e) => e.stopPropagation()} onSubmit={confirmarPagina}>
                        <h3>Navegação por página</h3>
                        <label>
                            Número da página
                            <input
                                type="number"
                                min={1}
                                max={totalPaginas}
                                value={numeroPagina}
                                autoFocus
                                onChange={(e) => setNumeroPagina(e.target.value)}
                            />
                        </label>
                        <div className="ctt-menu-acoes">
                            <button type="submit" className="idx-pill int-add">confirmar</button>
                            <button type="button" className="ctt-ghost" onClick={() => setIrPagina(false)}>
                                cancelar <kbd>ESC</kbd>
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {painel === "vendedor" ? (
                <div className="ctt-envio-bg" onClick={() => setPainel(null)}>
                    <div
                        className="ctt-vend"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ctt-vend-titulo"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button type="button" className="ctt-vend-x" aria-label="Fechar" onClick={() => setPainel(null)}>
                            <X size={16} />
                        </button>
                        <header className="ctt-vend-topo">
                            <span className="ctt-vend-icone" aria-hidden="true">
                                <Users size={22} />
                                <span><Link2 size={11} /></span>
                            </span>
                            <h3 id="ctt-vend-titulo">
                                Vincular Contatos
                                <span>a Vendedor</span>
                            </h3>
                        </header>
                        <label className="ctt-vend-campo">
                            Vendedor
                            <input
                                value={vendedorLote}
                                list="ctt-vendedores"
                                placeholder=""
                                autoFocus
                                onChange={(e) => setVendedorLote(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        vincularVendedor();
                                    }
                                }}
                            />
                            <datalist id="ctt-vendedores">
                                {vendedores.map((vend) => (
                                    <option key={vend.id} value={vend.nome} />
                                ))}
                            </datalist>
                        </label>
                        <footer className="ctt-vend-acoes">
                            <button type="button" className="ctt-envio-ok" onClick={vincularVendedor}>
                                <Link2 size={16} />
                                Vincular ao vendedor
                            </button>
                            <button type="button" className="ctt-envio-cancelar" onClick={() => setPainel(null)}>
                                Cancelar
                            </button>
                        </footer>
                    </div>
                </div>
            ) : null}

            {painel === "precos" ? (
                <div className="ctt-envio-bg" onClick={() => setPainel(null)}>
                    <div
                        className="ctt-precos"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ctt-precos-titulo"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="ctt-precos-topo">
                            <span className="ctt-vend-icone" aria-hidden="true">
                                <Tag size={22} />
                            </span>
                            <div>
                                <h3 id="ctt-precos-titulo">Vincular lista de preços</h3>
                                <p>
                                    {marcados.length === 1
                                        ? "Selecione a lista de preços que deseja vincular ao contato selecionado."
                                        : `Selecione a lista de preços que deseja vincular aos ${marcados.length} contatos selecionados.`}
                                </p>
                            </div>
                            <button type="button" className="ctt-envio-fechar" onClick={() => setPainel(null)}>
                                fechar
                                <X size={14} />
                            </button>
                        </header>
                        {LISTAS_PRECO.length ? (
                            <div className="ctt-precos-listas" role="radiogroup" aria-label="Listas de preços">
                                {LISTAS_PRECO.map((lista) => (
                                    <label key={lista.id}>
                                        <input
                                            type="radio"
                                            name="lista-preco"
                                            checked={listaPrecoLote === lista.id}
                                            onChange={() => setListaPrecoLote(lista.id)}
                                        />
                                        <span>
                                            <strong>{lista.nome}</strong>
                                            {lista.descricao ? <small>{lista.descricao}</small> : null}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="ctt-precos-vazio">
                                <span className="ctt-precos-lupa" aria-hidden="true">
                                    <List size={28} />
                                    <span><Search size={13} /></span>
                                </span>
                                <strong>Não há listas de preços cadastradas.</strong>
                                <p>Cadastre uma lista de preços para poder vincular aos contatos.</p>
                            </div>
                        )}
                        <footer className="ctt-precos-acoes">
                            <button type="button" className="ctt-envio-cancelar" onClick={() => setPainel(null)}>
                                cancelar
                            </button>
                            <button
                                type="button"
                                className="ctt-envio-ok"
                                disabled={!LISTAS_PRECO.length || !listaPrecoLote}
                                onClick={vincularListaPreco}
                            >
                                <Link2 size={16} />
                                vincular lista de preços
                            </button>
                        </footer>
                    </div>
                </div>
            ) : null}

            {painel === "tipo" ? (
                <div className="ctt-envio-bg" onClick={() => setPainel(null)}>
                    <div
                        className="ctt-vend ctt-tipo"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ctt-tipo-titulo"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="ctt-vend-topo">
                            <span className="ctt-vend-icone" aria-hidden="true">
                                <UserRound size={22} />
                            </span>
                            <h3 id="ctt-tipo-titulo">
                                Definir tipo
                                <span>de contato</span>
                            </h3>
                            <button type="button" className="ctt-envio-fechar" onClick={() => setPainel(null)}>
                                fechar
                                <X size={14} />
                            </button>
                        </header>
                        <label className="ctt-vend-campo">
                            Tipo de contato
                            <span className="ctt-tipo-select">
                                <select value={tipoLote} onChange={(e) => setTipoLote(e.target.value)}>
                                    {TIPOS.map((t) => (
                                        <option key={t.id} value={t.id}>{t.nome.charAt(0).toUpperCase() + t.nome.slice(1)}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} />
                            </span>
                        </label>
                        <footer className="ctt-vend-acoes">
                            <button type="button" className="ctt-envio-ok" onClick={definirTipo}>
                                confirmar
                            </button>
                        </footer>
                    </div>
                </div>
            ) : null}

            {niverAberto ? (() => {
                const itens = visiveis
                    .map((contato) => ({ contato, nasc: dataNascimento(contato.nascimento) }))
                    .filter((item) => item.nasc && (!niverMes || item.nasc.mes === niverMes))
                    .sort((a, b) => a.nasc.mes - b.nasc.mes || a.nasc.dia - b.nasc.dia || String(a.contato.nome || "").localeCompare(String(b.contato.nome || ""), "pt-BR"));
                const grupos = [];
                itens.forEach((item) => {
                    const ultimo = grupos[grupos.length - 1];
                    if (!ultimo || ultimo.mes !== item.nasc.mes) {
                        grupos.push({ mes: item.nasc.mes, itens: [item] });
                    } else {
                        ultimo.itens.push(item);
                    }
                });
                return (
                    <div className="ctt-envio-bg" onClick={() => setNiverAberto(false)}>
                        <div
                            className="ctt-niver"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="ctt-niver-titulo"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <header className="ctt-precos-topo">
                                <span className="ctt-vend-icone" aria-hidden="true">
                                    <CalendarDays size={22} />
                                </span>
                                <div>
                                    <h3 id="ctt-niver-titulo">Aniversariantes</h3>
                                    <p>Contatos da lista atual que têm data de nascimento.</p>
                                </div>
                                <button type="button" className="ctt-envio-fechar" onClick={() => setNiverAberto(false)}>
                                    fechar
                                    <X size={14} />
                                </button>
                            </header>
                            <label className="ctt-niver-mes">
                                Mês
                                <select value={niverMes} onChange={(e) => setNiverMes(Number(e.target.value))}>
                                    <option value={0}>Todos os meses</option>
                                    {MESES.map((nome, indice) => (
                                        <option key={nome} value={indice + 1}>{nome}</option>
                                    ))}
                                </select>
                            </label>
                            {itens.length ? (
                                <div className="ctt-niver-lista">
                                    {grupos.map((grupo) => (
                                        <section key={grupo.mes}>
                                            <h4>{MESES[grupo.mes - 1]} <span>{grupo.itens.length}</span></h4>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Nome</th>
                                                        <th>Idade</th>
                                                        <th>Telefone</th>
                                                        <th>Cidade</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {grupo.itens.map(({ contato, nasc }) => (
                                                        <tr key={contato.id}>
                                                            <td>{String(nasc.dia).padStart(2, "0")}/{String(nasc.mes).padStart(2, "0")}</td>
                                                            <td>{contato.nome}</td>
                                                            <td>{idadeDe(nasc)}</td>
                                                            <td>{contato.celular || contato.telefone || "—"}</td>
                                                            <td>{rotuloCidade(contato)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </section>
                                    ))}
                                </div>
                            ) : (
                                <p className="ctt-niver-vazio">Nenhum aniversariante {niverMes ? `em ${MESES[niverMes - 1]}` : "com data de nascimento"} nesta lista.</p>
                            )}
                        </div>
                    </div>
                );
            })() : null}

            {etiquetas ? (() => {
                const tamanho = ETIQUETA_TAMANHOS.find((item) => item.id === etiquetas.tamanho) || ETIQUETA_TAMANHOS[0];
                const contatos = contatosDaEtiqueta();
                const porPagina = tamanho.cols * tamanho.rows;
                const pagina = contatos.slice(0, porPagina);
                const totalPaginasEtiqueta = Math.max(1, Math.ceil(contatos.length / porPagina));
                return (
                    <div className="ctt-envio-bg" onClick={() => setEtiquetas(null)}>
                        <div
                            className="ctt-etiq"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="ctt-etiq-titulo"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <header className="ctt-etiq-topo">
                                <span className="ctt-etiq-icone" aria-hidden="true"><Printer size={18} /></span>
                                <div>
                                    <h3 id="ctt-etiq-titulo">Imprimir etiquetas</h3>
                                    <p>Configure as opções de impressão das etiquetas dos contatos selecionados.</p>
                                </div>
                                <button type="button" className="ctt-vend-x" aria-label="Fechar" onClick={() => setEtiquetas(null)}>
                                    <X size={16} />
                                </button>
                            </header>
                            <div className="ctt-etiq-corpo">
                                <div className="ctt-etiq-form">
                                    <label className="ctt-etiq-campo">
                                        Modelo da etiqueta
                                        <span className="ctt-etiq-modelo">
                                            <span className="ctt-etiq-modelo-ico" aria-hidden="true" />
                                            <span>
                                                <strong>Etiqueta padrão</strong>
                                                <small>Nome, CPF/CNPJ e Cidade</small>
                                            </span>
                                        </span>
                                    </label>
                                    <label className="ctt-etiq-campo">
                                        Tamanho da etiqueta
                                        <span className="ctt-tipo-select">
                                            <select value={etiquetas.tamanho} onChange={(e) => setEtiquetas((atual) => ({ ...atual, tamanho: e.target.value }))}>
                                                {ETIQUETA_TAMANHOS.map((item) => (
                                                    <option key={item.id} value={item.id}>{item.nome}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} />
                                        </span>
                                    </label>
                                    <label className="ctt-etiq-campo">
                                        Quantidade por página
                                        <span className="ctt-tipo-select">
                                            <select value={etiquetas.tamanho} onChange={(e) => setEtiquetas((atual) => ({ ...atual, tamanho: e.target.value }))}>
                                                {ETIQUETA_TAMANHOS.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.cols * item.rows} etiquetas ({item.cols} colunas x {item.rows} linhas)
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} />
                                        </span>
                                    </label>
                                    <fieldset className="ctt-etiq-campo">
                                        <legend>Elementos a exibir</legend>
                                        {CAMPOS_ETIQUETA.map((campo) => (
                                            <label key={campo.id} className="ctt-etiq-check">
                                                <input
                                                    type="checkbox"
                                                    checked={etiquetas.campos[campo.id]}
                                                    onChange={() => setEtiquetas((atual) => ({
                                                        ...atual,
                                                        campos: { ...atual.campos, [campo.id]: !atual.campos[campo.id] }
                                                    }))}
                                                />
                                                {campo.label}
                                            </label>
                                        ))}
                                    </fieldset>
                                    <fieldset className="ctt-etiq-campo">
                                        <legend>Ordem de impressão</legend>
                                        <label className="ctt-etiq-check">
                                            <input
                                                type="radio"
                                                name="ordem-etiqueta"
                                                checked={etiquetas.ordem === "lista"}
                                                onChange={() => setEtiquetas((atual) => ({ ...atual, ordem: "lista" }))}
                                            />
                                            Na mesma ordem da lista
                                        </label>
                                        <label className="ctt-etiq-check">
                                            <input
                                                type="radio"
                                                name="ordem-etiqueta"
                                                checked={etiquetas.ordem === "alfa"}
                                                onChange={() => setEtiquetas((atual) => ({ ...atual, ordem: "alfa" }))}
                                            />
                                            Ordem alfabética (Nome)
                                        </label>
                                    </fieldset>
                                </div>
                                <div className="ctt-etiq-previas">
                                    <section>
                                        <h4>Pré-visualização da etiqueta</h4>
                                        <MiniEtiqueta contato={contatos[0]} campos={etiquetas.campos} />
                                    </section>
                                    <section>
                                        <h4>Pré-visualização da página</h4>
                                        <div
                                            className="ctt-etiq-folha"
                                            style={{ gridTemplateColumns: `repeat(${tamanho.cols}, minmax(0, 1fr))` }}
                                        >
                                            {pagina.map((contato) => (
                                                <MiniEtiqueta key={contato.id} contato={contato} campos={etiquetas.campos} />
                                            ))}
                                        </div>
                                        <p className="ctt-etiq-paginas">Página 1 de {totalPaginasEtiqueta} · {contatos.length} {contatos.length === 1 ? "etiqueta" : "etiquetas"}</p>
                                    </section>
                                </div>
                            </div>
                            <footer className="ctt-etiq-acoes">
                                <button type="button" className="ctt-envio-cancelar" onClick={() => setEtiquetas(null)}>
                                    Cancelar
                                </button>
                                <button type="button" className="ctt-envio-ok" onClick={imprimirEtiquetas}>
                                    <Printer size={16} />
                                    Imprimir etiquetas
                                </button>
                            </footer>
                        </div>
                    </div>
                );
            })() : null}

            {painel === "empresas" ? (
                <div className="ctt-envio-bg" onClick={() => setPainel(null)}>
                    <div
                        className="ctt-envio"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ctt-envio-titulo"
                        onClick={(e) => {
                            e.stopPropagation();
                            setEmpresasAberto(false);
                        }}
                    >
                        <header className="ctt-envio-topo">
                            <span className="ctt-envio-icone" aria-hidden="true">
                                <Send size={22} />
                            </span>
                            <h3 id="ctt-envio-titulo">
                                Enviar contatos
                                <span>para empresas</span>
                            </h3>
                            <button type="button" className="ctt-envio-fechar" onClick={() => setPainel(null)}>
                                <X size={14} />
                                fechar
                            </button>
                        </header>
                        <p className="ctt-envio-sub">Selecione os contatos que deseja enviar para uma ou mais empresas.</p>
                        <p className="ctt-envio-campo">Enviar contatos para</p>
                        <div className="ctt-envio-empresas" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                className={`ctt-envio-select${empresasAberto ? " is-on" : ""}`}
                                onClick={() => setEmpresasAberto((aberto) => !aberto)}
                            >
                                <Building2 size={16} />
                                <span>{rotuloEmpresas}</span>
                                <ChevronDown size={16} />
                            </button>
                            {empresasAberto ? (
                                <div className="ctt-envio-lista-emp">
                                    {empresasDestino.map((emp) => (
                                        <label key={emp.id}>
                                            <input
                                                type="checkbox"
                                                checked={empresasLote.includes(emp.id)}
                                                onChange={() => {
                                                    setEmpresasLote((atual) => (
                                                        atual.includes(emp.id) ? atual.filter((id) => id !== emp.id) : [...atual, emp.id]
                                                    ));
                                                    setEnvioAviso("");
                                                }}
                                            />
                                            <span className="ctt-envio-emp">
                                                <strong>{emp.nome}</strong>
                                                <small>{emp.cnpj ? `${emp.cnpj} · ${emp.razao}` : emp.razao}</small>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                        {lojaAtual ? (
                            <p className="ctt-envio-atual">Você está em {lojaAtual.nome}. Essa unidade não entra na lista.</p>
                        ) : null}
                        <div className="ctt-envio-barra">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={todosEnvioMarcados}
                                    onChange={(e) => marcarEnvioVisiveis(e.target.checked)}
                                />
                                Selecionar todas ({contatosEnvio.length} {contatosEnvio.length === 1 ? "contato" : "contatos"})
                            </label>
                            <label className="ctt-envio-busca">
                                <Search size={15} />
                                <input
                                    value={buscaEnvio}
                                    placeholder="Buscar contato..."
                                    onChange={(e) => setBuscaEnvio(e.target.value)}
                                />
                            </label>
                        </div>
                        <div className="ctt-envio-tabela">
                            <table>
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                aria-label="Selecionar contatos visíveis"
                                                checked={todosEnvioMarcados}
                                                onChange={(e) => marcarEnvioVisiveis(e.target.checked)}
                                            />
                                        </th>
                                        <th>
                                            <button type="button" onClick={() => setOrdemEnvio((atual) => (atual === "asc" ? "desc" : "asc"))}>
                                                Contato
                                                <ArrowDownUp size={13} />
                                            </button>
                                        </th>
                                        <th>CPF/CNPJ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contatosEnvio.map((c) => (
                                        <tr key={c.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Selecionar ${c.nome}`}
                                                    checked={envioMarcados.includes(c.id)}
                                                    onChange={() => {
                                                        setEnvioMarcados((atual) => (
                                                            atual.includes(c.id) ? atual.filter((id) => id !== c.id) : [...atual, c.id]
                                                        ));
                                                        setEnvioAviso("");
                                                    }}
                                                />
                                            </td>
                                            <td>{c.nome}</td>
                                            <td>{c.cpfCnpj || "—"}</td>
                                        </tr>
                                    ))}
                                    {!contatosEnvio.length ? (
                                        <tr>
                                            <td colSpan={3} className="ctt-envio-vazio">Nenhum contato encontrado.</td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                        {envioAviso ? <p className="ctt-envio-erro">{envioAviso}</p> : null}
                        <footer className="ctt-envio-acoes">
                            <button type="button" className="ctt-envio-ok" onClick={enviarContatosEmpresas}>
                                <Send size={16} />
                                Enviar contatos
                            </button>
                            <button type="button" className="ctt-envio-cancelar" onClick={() => setPainel(null)}>
                                Cancelar
                            </button>
                        </footer>
                    </div>
                </div>
            ) : null}

            {confirma ? (
                <div className="ctt-confirma-bg" onClick={() => setConfirma(null)}>
                    <div
                        className="ctt-confirma"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ctt-confirma-titulo"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(() => {
                            const modelo = CONFIRMACOES[confirma.tipo];
                            const Icone = modelo.Icone;
                            const n = confirma.ids.length;
                            return (
                                <>
                                    <button type="button" className="ctt-confirma-x" aria-label="Fechar" onClick={() => setConfirma(null)}>
                                        <X size={16} />
                                    </button>
                                    <span className={`ctt-confirma-icone is-${confirma.tipo}`}>
                                        <Icone size={22} />
                                    </span>
                                    <h3 id="ctt-confirma-titulo">{modelo.titulo(n)}</h3>
                                    <p>{modelo.texto}</p>
                                    <div className="ctt-confirma-acoes">
                                        <button type="button" className="ctt-confirma-cancelar" onClick={() => setConfirma(null)}>
                                            Cancelar
                                        </button>
                                        <button type="button" className="ctt-confirma-ok" onClick={executarConfirmacao}>
                                            <Icone size={16} />
                                            {modelo.acao(n)}
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            ) : null}

            <ImportadorMassa
                aberto={importadorMassa}
                ocupado={importando}
                onFechar={() => setImportadorMassa(false)}
                titulo="Importar contatos Tiny"
                descricao="Selecione várias planilhas de contatos do Tiny (.xls/.xlsx) de uma vez."
                dica="Vários Excel: contatos_1-500.xls, contatos_501-1000.xls…"
                aceitos=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                permitirXml={false}
                rotuloItem="cadastros"
                lerExcel={lerPlanilhaContatos}
                mesclar={mesclarContatos}
                importarLote={importarClientesLote}
                onConcluido={async (mensagem) => {
                    setAviso(mensagem);
                    await carregarContatos();
                }}
            />
        </div>
    );
}

export default function ClientesFornecedores() {
    const { hash, pathname } = useLocation();
    if (pathname === "/contatos" && (!hash || hash === "#")) {
        return <Navigate to="/contatos#/" replace />;
    }
    if (hash === "#/add" || hash === "#add") {
        return <ContatoForm />;
    }
    return <ListaContatos />;
}
