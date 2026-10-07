import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Monitor, Trash2, X } from "lucide-react";

import ROTAS from "../../constants/rotas";
import useAuth from "../../hooks/useAuth.jsx";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";
import "../../styles/pages/notificacoes-config.css";

const CHAVE = "erp-notificacoes-config-v1";
const CHAVE_DISPOSITIVOS = "erp-notificacoes-dispositivos-v1";
const CHAVE_ID = "erp-notificacoes-device-id";

const TIPOS = [
    { id: "ml", nome: "Perguntas do Mercado Livre" },
    { id: "separacao", nome: "Novo pedido disponível para separação" },
    { id: "envios", nome: "Pedidos com entrega Mercado Envios Agora" }
];

function padraoTipos() {
    return Object.fromEntries(TIPOS.map((tipo) => [tipo.id, { sistema: true, navegador: true }]));
}

function lerTipos() {
    const base = padraoTipos();
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (bruto && typeof bruto === "object") {
            TIPOS.forEach((tipo) => {
                const item = bruto[tipo.id];
                if (item && typeof item === "object") {
                    base[tipo.id] = {
                        sistema: typeof item.sistema === "boolean" ? item.sistema : true,
                        navegador: typeof item.navegador === "boolean" ? item.navegador : true
                    };
                }
            });
        }
    } catch {
        /* padrão */
    }
    return base;
}

function lerDispositivos() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE_DISPOSITIVOS) || "null");
        if (Array.isArray(bruto)) {
            return bruto.filter((item) => item && item.id && item.nome);
        }
    } catch {
        /* vazio */
    }
    return [];
}

function nomeSugerido(usuario) {
    const agente = navigator.userAgent || "";
    const sistema = /Windows/i.test(agente) ? "Windows"
        : /Mac OS|Macintosh/i.test(agente) ? "Mac"
            : /Android/i.test(agente) ? "Android"
                : /Linux/i.test(agente) ? "Linux"
                    : "Navegador";
    const navegador = /Edg\//.test(agente) ? "Edge"
        : /Chrome\//.test(agente) && !/Edg\//.test(agente) ? "Chrome"
            : /Firefox\//.test(agente) ? "Firefox"
                : "Navegador";
    const pessoa = String(usuario?.nome || "Usuário").trim() || "Usuário";
    return `${sistema} - ${navegador} - ${pessoa}`;
}

function formatarData(iso) {
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) {
        return "";
    }
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes}/${data.getFullYear()}`;
}

export default function NotificacoesConfig() {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const [tipos, setTipos] = useState(lerTipos);
    const [dispositivos, setDispositivos] = useState(lerDispositivos);
    const [idAtual, setIdAtual] = useState(() => localStorage.getItem(CHAVE_ID) || "");
    const [painel, setPainel] = useState(false);
    const [folha, setFolha] = useState("");
    const [nome, setNome] = useState("");
    const [aviso, setAviso] = useState("");

    const desteNavegador = dispositivos.some((item) => item.id === idAtual);

    function gravarTipos(proximos) {
        setTipos(proximos);
        localStorage.setItem(CHAVE, JSON.stringify(proximos));
    }

    function gravarDispositivos(proximos) {
        setDispositivos(proximos);
        localStorage.setItem(CHAVE_DISPOSITIVOS, JSON.stringify(proximos));
    }

    function alternar(id, canal) {
        gravarTipos({
            ...tipos,
            [id]: { ...tipos[id], [canal]: !tipos[id][canal] }
        });
    }

    function abrirIdentificar() {
        setPainel(false);
        setAviso("");
        setNome(nomeSugerido(usuario));
        setFolha("identificar");
    }

    function fecharFolha() {
        setFolha("");
        setAviso("");
    }

    async function adicionar(evento) {
        evento.preventDefault();
        const descricao = nome.trim();
        if (!descricao) {
            setAviso("Informe o nome do dispositivo.");
            return;
        }
        const id = idAtual || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
        localStorage.setItem(CHAVE_ID, id);
        setIdAtual(id);
        const jaExiste = dispositivos.some((item) => item.id === id);
        const item = { id, nome: descricao, registradoEm: new Date().toISOString() };
        gravarDispositivos(jaExiste
            ? dispositivos.map((atual) => atual.id === id ? item : atual)
            : [item, ...dispositivos]);
        setFolha("");
        if ("Notification" in window && Notification.permission === "default") {
            try {
                const permissao = await Notification.requestPermission();
                if (permissao !== "granted") {
                    setAviso("O navegador não autorizou as notificações. O dispositivo foi registrado.");
                    return;
                }
            } catch {
                setAviso("O navegador não autorizou as notificações. O dispositivo foi registrado.");
                return;
            }
        }
        setAviso("Dispositivo registrado.");
    }

    function remover(id) {
        gravarDispositivos(dispositivos.filter((item) => item.id !== id));
        setAviso("");
    }

    return (
        <div className="ntf-page">
            <div className="emp-top">
                <button type="button" className="emp-voltar" onClick={() => navigate(ROTAS.CONFIGURACOES)}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <nav className="dash-crumb" aria-label="Trilha">
                    <Link to={ROTAS.INDICE}>início</Link>
                    <span>›</span>
                    <Link to={ROTAS.CONFIGURACOES}>configurações</Link>
                    <span>›</span>
                    <span>central de notificações</span>
                </nav>
            </div>

            <header className="ntf-head">
                <h2>Central de notificações</h2>
                <div>
                    <button
                        type="button"
                        className={desteNavegador ? "emp-salvar" : "emp-link"}
                        onClick={() => { setPainel(true); setFolha(""); }}
                    >
                        <Monitor size={14} />
                        gerenciar dispositivos
                    </button>
                    {desteNavegador ? null : (
                        <button type="button" className="emp-salvar" onClick={() => { setPainel(false); setAviso(""); setFolha("ativar"); }}>
                            ativar notificações
                        </button>
                    )}
                </div>
            </header>
            {aviso && !folha ? <p className={aviso.includes("não") ? "emp-erro" : "emp-ok"}>{aviso}</p> : null}

            <table className="ntf-tabela">
                <thead>
                    <tr>
                        <th>Tipo de notificação</th>
                        <th>Notificação no Sistema ERP</th>
                        <th>Notificação no navegador</th>
                    </tr>
                </thead>
                <tbody>
                    {TIPOS.map((tipo) => (
                        <tr key={tipo.id}>
                            <td>{tipo.nome}</td>
                            <td>
                                <button
                                    type="button"
                                    className={`ntf-switch${tipos[tipo.id].sistema ? " is-on" : ""}`}
                                    role="switch"
                                    aria-checked={tipos[tipo.id].sistema}
                                    aria-label={`${tipo.nome} no sistema`}
                                    onClick={() => alternar(tipo.id, "sistema")}
                                />
                            </td>
                            <td>
                                <button
                                    type="button"
                                    className={`ntf-switch${tipos[tipo.id].navegador ? " is-on" : ""}`}
                                    role="switch"
                                    aria-checked={tipos[tipo.id].navegador}
                                    aria-label={`${tipo.nome} no navegador`}
                                    onClick={() => alternar(tipo.id, "navegador")}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {painel ? (
                <aside className="ntf-painel" aria-label="Dispositivos configurados">
                    <header>
                        <h3>Dispositivos configurados</h3>
                        <button type="button" onClick={() => setPainel(false)} aria-label="Fechar"><X size={16} /></button>
                    </header>
                    {dispositivos.length === 0 ? (
                        <p>Nenhum dispositivo registrado.</p>
                    ) : (
                        <table className="ntf-disp">
                            <thead>
                                <tr>
                                    <th>Dispositivo</th>
                                    <th>Data de registro</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {dispositivos.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.nome}</td>
                                        <td>{formatarData(item.registradoEm)}</td>
                                        <td>
                                            <button type="button" aria-label={`Remover ${item.nome}`} onClick={() => remover(item.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    <div className="ntf-painel-acoes">
                        {dispositivos.length === 0 ? (
                            <button type="button" className="emp-salvar" onClick={abrirIdentificar}>adicionar este dispositivo</button>
                        ) : (
                            <button
                                type="button"
                                className="ntf-remover"
                                disabled={!desteNavegador}
                                onClick={() => remover(idAtual)}
                            >
                                remover este dispositivo
                            </button>
                        )}
                        <button type="button" className="emp-cancelar" onClick={() => setPainel(false)}>fechar</button>
                    </div>
                </aside>
            ) : null}

            {folha ? (
                <div className="ntf-sheet" role="dialog" aria-modal="true">
                    {folha === "ativar" ? (
                        <div className="ntf-sheet-box">
                            <h3>Ativar notificações</h3>
                            <p>Este dispositivo ainda não está configurado para receber notificações no navegador.</p>
                            <div className="ntf-sheet-acoes">
                                <button type="button" className="emp-salvar" onClick={abrirIdentificar}>adicionar dispositivo</button>
                                <button type="button" className="emp-cancelar" onClick={fecharFolha}>cancelar</button>
                            </div>
                        </div>
                    ) : (
                        <form className="ntf-sheet-box" onSubmit={adicionar}>
                            <h3>Identificar dispositivo</h3>
                            <label>
                                Nome do dispositivo
                                <input value={nome} onChange={(evento) => setNome(evento.target.value)} />
                                <small>Utilizado para identificar o dispositivo</small>
                            </label>
                            {aviso ? <p className="emp-erro">{aviso}</p> : null}
                            <div className="ntf-sheet-acoes">
                                <button type="submit" className="emp-salvar">adicionar dispositivo</button>
                                <button type="button" className="emp-cancelar" onClick={fecharFolha}>cancelar</button>
                            </div>
                        </form>
                    )}
                </div>
            ) : null}
        </div>
    );
}
