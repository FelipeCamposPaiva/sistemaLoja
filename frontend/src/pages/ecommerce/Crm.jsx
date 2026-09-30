import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    ChevronDown,
    Filter,
    Mail,
    MapPin,
    MoreVertical,
    Phone,
    Plus,
    Search,
    Send,
    Smile,
    Star,
    UserPlus,
    Wifi,
    WifiOff,
    Globe,
    Smartphone
} from "lucide-react";

import {
    FaInstagram,
    FaFacebook,
    FaTelegramPlane,
    FaWhatsapp,
    FaFacebookMessenger
} from "react-icons/fa";

import { lerContatos } from "../../constants/contatos";
import {
    ATENDENTE_CRM,
    TEMPLATES_WABA,
    STATUS_CONVERSA,
    contatosComWhatsApp,
    conversaDeContato,
    gravarAssuntos,
    gravarContaWaba,
    gravarInbox,
    lerAssuntos,
    lerContaWaba,
    lerInbox,
    linkWhatsApp,
    marcarIntegracaoWhatsapp,
    mesclarMensagensZapi,
    novoId
} from "../../constants/crm";
import ROTAS from "../../constants/rotas";
import {
    desconectarWhatsapp,
    enviarWhatsapp,
    mensagensWhatsapp,
    qrCodeWhatsapp,
    salvarCredenciaisZapi,
    statusWhatsapp
} from "../../services/whatsapp.service";

import "../../styles/pages/indice.css";
import "../../styles/pages/crm.css";

const CANAIS_CRM = [
    { id: "whatsapp", nome: "WhatsApp", icone: FaWhatsapp, classe: "whatsapp" },
    { id: "instagram", nome: "Instagram", icone: FaInstagram, classe: "instagram" },
    { id: "facebook", nome: "Facebook", icone: FaFacebook, classe: "facebook" },
    { id: "telegram", nome: "Telegram", icone: FaTelegramPlane, classe: "telegram" },
    { id: "email", nome: "E-mail", icone: Mail, classe: "email" },
    { id: "chat-site", nome: "Chat Site", icone: Globe, classe: "chat-site" },
    { id: "telefone", nome: "Telefone", icone: Phone, classe: "telefone" },
    { id: "messenger", nome: "Messenger", icone: FaFacebookMessenger, classe: "messenger" },
    { id: "sms", nome: "SMS", icone: Smartphone, classe: "sms" }
];

function horaLista(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
        return "";
    }
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);
    if (d.toDateString() === hoje.toDateString()) {
        return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    if (d.toDateString() === ontem.toDateString()) {
        return "Ontem";
    }
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function horaMsg(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
        return "";
    }
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function rotuloDia(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
        return "";
    }
    const hoje = new Date();
    const prefixo = d.toDateString() === hoje.toDateString() ? "Hoje" : d.toLocaleDateString("pt-BR", { weekday: "long" });
    const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
    return `${prefixo} - ${data}`;
}

function ultima(conversa) {
    return conversa.mensagens[conversa.mensagens.length - 1];
}

export default function Crm() {
    const [params, setParams] = useSearchParams();
    const [conta, setConta] = useState(lerContaWaba);
    const [inbox, setInbox] = useState(lerInbox);
    const [assuntos, setAssuntos] = useState(lerAssuntos);
    const [selId, setSelId] = useState(() => params.get("contato") || "cv-testeff");
    const [busca, setBusca] = useState("");
    const [rascunho, setRascunho] = useState("");
    const [conectando, setConectando] = useState(false);
    const [modalConexao, setModalConexao] = useState(false);
    const [zapi, setZapi] = useState({ instanceId: "", token: "", clientToken: "" });
    const [qr, setQr] = useState("");
    const [avisoZapi, setAvisoZapi] = useState("");
    const [nova, setNova] = useState(false);
    const [canalSelecionado, setCanalSelecionado] = useState("whatsapp");
    const [filtroStatus, setFiltroStatus] = useState("todas");
    const [painel, setPainel] = useState("pedidos");
    const [menuMais, setMenuMais] = useState(false);
    const fundo = useRef(null);

    useEffect(() => {
        gravarContaWaba(conta);
    }, [conta]);

    useEffect(() => {
        gravarInbox(inbox);
    }, [inbox]);

    useEffect(() => {
        gravarAssuntos(assuntos);
    }, [assuntos]);

    useEffect(() => {
        const id = params.get("contato");
        if (!id) {
            return;
        }
        const contato = lerContatos().find((c) => String(c.id) === String(id));
        if (!contato) {
            return;
        }
        setInbox((atual) => {
            const existente = atual.find((item) => Number(item.contatoId) === Number(contato.id));
            if (existente) {
                setSelId(existente.id);
                return atual;
            }
            const conversa = conversaDeContato(atual, contato);
            setSelId(conversa.id);
            return [conversa, ...atual];
        });
        setParams((atual) => {
            const proximo = new URLSearchParams(atual);
            proximo.delete("contato");
            return proximo;
        }, { replace: true });
    }, [params, setParams]);

    const doCanal = useMemo(
        () => inbox.filter((item) => (item.canal || "whatsapp") === canalSelecionado),
        [inbox, canalSelecionado]
    );

    const contagens = useMemo(() => ({
        todas: doCanal.length,
        aberta: doCanal.filter((i) => i.status === "aberta").length,
        atendimento: doCanal.filter((i) => i.status === "atendimento").length,
        resolvida: doCanal.filter((i) => i.status === "resolvida").length
    }), [doCanal]);

    const lista = useMemo(() => {
        const texto = busca.trim().toLowerCase();
        return doCanal
            .filter((item) => {
                if (filtroStatus !== "todas" && item.status !== filtroStatus) {
                    return false;
                }
                if (texto && !`${item.nome} ${item.telefone} ${ultima(item)?.texto || ""}`.toLowerCase().includes(texto)) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => (ultima(b)?.em || "").localeCompare(ultima(a)?.em || ""));
    }, [doCanal, busca, filtroStatus]);

    const sel = inbox.find((item) => item.id === selId) || lista[0] || null;

    useEffect(() => {
        if (fundo.current) {
            fundo.current.scrollTop = fundo.current.scrollHeight;
        }
    }, [sel?.id, sel?.mensagens?.length, sel?.digitando]);

    useEffect(() => {
        let vivo = true;
        async function atualizarStatus() {
            try {
                const st = await statusWhatsapp();
                if (!vivo) {
                    return;
                }
                setConta((atual) => ({
                    ...atual,
                    conectado: Boolean(st.conectado),
                    conectadoEm: st.conectado ? (atual.conectadoEm || new Date().toISOString()) : atual.conectadoEm
                }));
                if (st.instanceId && !zapi.instanceId) {
                    setZapi((atual) => ({ ...atual, instanceId: st.instanceId }));
                }
                marcarIntegracaoWhatsapp(Boolean(st.conectado));
                if (modalConexao && st.configurado && !st.conectado) {
                    const codigo = await qrCodeWhatsapp();
                    if (vivo && codigo?.imagem) {
                        setQr(codigo.imagem.startsWith("data:") ? codigo.imagem : `data:image/png;base64,${codigo.imagem}`);
                    }
                    setAvisoZapi(codigo?.mensagem || "");
                }
                if (st.conectado) {
                    setQr("");
                    const eventos = await mensagensWhatsapp();
                    if (vivo) {
                        setInbox((atual) => mesclarMensagensZapi(atual, eventos));
                    }
                }
            } catch {
                if (vivo && modalConexao) {
                    setAvisoZapi("Não foi possível falar com o backend. Confira se a API está no ar.");
                }
            }
        }
        atualizarStatus();
        const id = window.setInterval(atualizarStatus, modalConexao ? 4000 : 12000);
        return () => {
            vivo = false;
            window.clearInterval(id);
        };
    }, [modalConexao]);

    async function salvarZapi(evento) {
        evento.preventDefault();
        setConectando(true);
        setAvisoZapi("");
        try {
            const resp = await salvarCredenciaisZapi(zapi);
            if (!resp?.ok) {
                setAvisoZapi(resp?.mensagem || "Não foi possível salvar as credenciais.");
                return;
            }
            const codigo = await qrCodeWhatsapp();
            if (codigo?.imagem) {
                setQr(codigo.imagem.startsWith("data:") ? codigo.imagem : `data:image/png;base64,${codigo.imagem}`);
            }
            setAvisoZapi(codigo?.mensagem || "Credenciais salvas. Escaneie o QR no WhatsApp do celular.");
        } catch {
            setAvisoZapi("Falha ao salvar. Confira Instance ID, Token e Client-Token.");
        } finally {
            setConectando(false);
        }
    }

    async function desconectar() {
        try {
            await desconectarWhatsapp();
        } catch {
            /* local */
        }
        setConta((atual) => ({ ...atual, conectado: false, conectadoEm: null }));
        setQr("");
        marcarIntegracaoWhatsapp(false);
    }

    async function enviar(textoLivre) {
        const texto = (textoLivre || rascunho).trim();
        if (!texto || !sel) {
            return;
        }
        const msg = { id: novoId("m"), de: "loja", texto, em: new Date().toISOString() };
        setInbox((atual) =>
            atual.map((item) => (item.id === sel.id
                ? { ...item, naoLidas: 0, digitando: false, mensagens: [...item.mensagens, msg] }
                : item))
        );
        setRascunho("");
        if ((sel.canal || "whatsapp") !== "whatsapp") {
            return;
        }
        try {
            const resp = await enviarWhatsapp(sel.telefone, texto);
            if (resp && resp.ok === false) {
                window.alert(resp.mensagem || "WhatsApp não enviou. Conecte pelo QR em Conectar canais.");
            }
        } catch {
            window.alert("WhatsApp não enviou. Conecte a Z-API pelo QR em Conectar canais.");
        }
    }

    function abrirConversa(conversa) {
        setSelId(conversa.id);
        setMenuMais(false);
        setInbox((atual) => atual.map((item) => (item.id === conversa.id ? { ...item, naoLidas: 0 } : item)));
    }

    function iniciarCom(contato) {
        const conversa = conversaDeContato(inbox, contato);
        conversa.canal = canalSelecionado;
        setInbox((atual) => (atual.some((item) => item.id === conversa.id) ? atual : [conversa, ...atual]));
        setSelId(conversa.id);
        setNova(false);
    }

    function incluirAssunto() {
        if (!sel) {
            return;
        }
        setAssuntos((atual) => [{
            id: novoId("as"),
            titulo: `Atendimento — ${sel.nome}`,
            contatoId: sel.contatoId,
            contato: sel.nome,
            estagio: "novo",
            canal: canalSelecionado,
            valor: "",
            atualizado: new Date().toISOString()
        }, ...atual]);
        setMenuMais(false);
    }

    function toggleFavorita() {
        if (!sel) {
            return;
        }
        setInbox((atual) => atual.map((item) => (item.id === sel.id ? { ...item, favorita: !item.favorita } : item)));
    }

    function addTag() {
        const tag = window.prompt("Nova tag");
        if (!tag || !sel) {
            return;
        }
        setInbox((atual) => atual.map((item) => (
            item.id === sel.id ? { ...item, tags: [...new Set([...(item.tags || []), tag.trim()])] } : item
        )));
    }

    const primeiroDia = sel?.mensagens?.[0]?.em;

    return (
        <div className="crm-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <span>E-commerce</span>
                <span>›</span>
                <span>CRM</span>
            </nav>

            <div className="crm-top">
                <div className="crm-canais" role="tablist" aria-label="Canais">
                    {CANAIS_CRM.map((canal) => {
                        const Icone = canal.icone;
                        const ativo = canalSelecionado === canal.id;
                        const naoLidas = inbox
                            .filter((item) => (item.canal || "whatsapp") === canal.id)
                            .reduce((t, item) => t + (item.naoLidas || 0), 0);
                        return (
                            <button
                                key={canal.id}
                                type="button"
                                className={`crm-canal ${canal.classe}${ativo ? " is-active" : ""}`}
                                onClick={() => {
                                    setCanalSelecionado(canal.id);
                                    const primeira = inbox.find((item) => (item.canal || "whatsapp") === canal.id);
                                    if (primeira) {
                                        setSelId(primeira.id);
                                    }
                                }}
                            >
                                <Icone size={15} />
                                {canal.nome}
                                {naoLidas ? <b>{naoLidas}</b> : null}
                            </button>
                        );
                    })}
                </div>
                <div className="crm-top-acoes">
                    <button type="button" className="crm-btn-ghost" onClick={() => setModalConexao(true)}>
                        <Wifi size={14} />
                        Conectar canais
                    </button>
                    <span className={`crm-api${conta.conectado ? " is-on" : ""}`}>
                        <i />
                        {conta.conectado ? "API conectada" : "API desconectada"}
                    </span>
                </div>
            </div>

            <div className="crm-inbox">
                <section className="crm-col crm-lista-col">
                    <header className="crm-col-title">
                        <h3>Conversas</h3>
                        <button type="button" className="crm-icon-btn" onClick={() => setNova(true)} aria-label="Nova conversa">
                            <Plus size={16} />
                        </button>
                    </header>
                    <div className="crm-busca">
                        <Search size={14} />
                        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar conversa..." />
                        <Filter size={14} />
                    </div>
                    <div className="crm-status-tabs">
                        {STATUS_CONVERSA.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                className={filtroStatus === s.id ? "is-on" : ""}
                                onClick={() => setFiltroStatus(s.id)}
                            >
                                {s.label}
                                <em>{contagens[s.id] || 0}</em>
                            </button>
                        ))}
                    </div>
                    <div className="crm-lista">
                        {lista.length ? lista.map((item) => {
                            const fim = ultima(item);
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`crm-item${sel?.id === item.id ? " is-on" : ""}`}
                                    onClick={() => abrirConversa(item)}
                                >
                                    <span className={`crm-avatar is-${(item.iniciais || "C")[0].toLowerCase()}`}>{item.iniciais}</span>
                                    <span className="crm-item-body">
                                        <strong>
                                            {item.nome}
                                            <small>{fim ? horaLista(fim.em) : ""}</small>
                                        </strong>
                                        <em>{fim?.texto || "Sem mensagens"}</em>
                                    </span>
                                    <span className="crm-item-end">
                                        {item.naoLidas ? <b className="crm-badge">{item.naoLidas}</b> : <FaWhatsapp size={14} />}
                                    </span>
                                </button>
                            );
                        }) : (
                            <p className="crm-empty">Nenhuma conversa neste filtro.</p>
                        )}
                    </div>
                </section>

                <section className="crm-col crm-chat-col">
                    {sel ? (
                        <>
                            <header className="crm-chat-head">
                                <div className="crm-chat-client">
                                    <span className="crm-avatar">{sel.iniciais}</span>
                                    <div>
                                        <strong>{sel.nome}</strong>
                                        <span>{sel.telefone}</span>
                                    </div>
                                </div>
                                <div className="crm-chat-tools">
                                    <button type="button" className={sel.favorita ? "is-on" : ""} onClick={toggleFavorita} aria-label="Favoritar">
                                        <Star size={16} />
                                    </button>
                                    <button type="button" aria-label="Atribuir" onClick={incluirAssunto}>
                                        <UserPlus size={16} />
                                    </button>
                                    <button type="button" aria-label="Mais" onClick={() => setMenuMais((v) => !v)}>
                                        <MoreVertical size={16} />
                                    </button>
                                    {menuMais ? (
                                        <div className="crm-mais-menu">
                                            {sel.contatoId ? <Link to={`/contatos/${sel.contatoId}`}>abrir cadastro</Link> : null}
                                            <button type="button" onClick={incluirAssunto}>incluir assunto</button>
                                            <button type="button" onClick={() => setInbox((a) => a.map((i) => i.id === sel.id ? { ...i, status: "resolvida" } : i))}>marcar resolvida</button>
                                        </div>
                                    ) : null}
                                </div>
                            </header>
                            <div className="crm-chat" ref={fundo}>
                                {primeiroDia ? <div className="crm-dia">{rotuloDia(primeiroDia)}</div> : null}
                                {sel.mensagens.map((msg) => (
                                    <article key={msg.id} className={`crm-msg${msg.de === "loja" ? " is-out" : " is-in"}`}>
                                        {msg.texto}
                                        <small>{horaMsg(msg.em)}{msg.de === "loja" ? " ✓✓" : ""}</small>
                                    </article>
                                ))}
                                {sel.digitando ? (
                                    <div className="crm-typing">
                                        <img src={ATENDENTE_CRM.foto} alt="" />
                                        <div>
                                            <strong>{ATENDENTE_CRM.nome}</strong>
                                            <span>{ATENDENTE_CRM.cargo}</span>
                                            <em>digitando...</em>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                            <div className="crm-composer">
                                <div className="crm-chips">
                                    {TEMPLATES_WABA.map((item) => (
                                        <button key={item.id} type="button" onClick={() => enviar(item.texto)}>
                                            {item.nome}
                                        </button>
                                    ))}
                                </div>
                                <form
                                    className="crm-send"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        enviar();
                                    }}
                                >
                                    <button type="button" className="crm-icon-btn" onClick={() => setRascunho((t) => `${t}😊`)} aria-label="Emoji">
                                        <Smile size={16} />
                                    </button>
                                    <input
                                        value={rascunho}
                                        onChange={(e) => setRascunho(e.target.value)}
                                        placeholder="Digite uma mensagem..."
                                    />
                                    <button type="submit" className="crm-send-btn" aria-label="Enviar">
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <p className="crm-empty">Escolha uma conversa.</p>
                    )}
                </section>

                <aside className="crm-col crm-side">
                    <div className="crm-atendente">
                        <div className="crm-atendente-top">
                            <span>Atendente atual</span>
                            <em className={ATENDENTE_CRM.online ? "is-on" : ""}>Online</em>
                        </div>
                        <div className="crm-atendente-card">
                            <span className="crm-atendente-foto" style={{ backgroundImage: `url(${ATENDENTE_CRM.foto})` }} />
                            <div>
                                <strong>{ATENDENTE_CRM.nome}</strong>
                                <small>{ATENDENTE_CRM.cargo}</small>
                                <p>“{ATENDENTE_CRM.frase}”</p>
                            </div>
                        </div>
                    </div>

                    {sel ? (
                        <>
                            <div className="crm-info">
                                <h4>Informações do Cliente</h4>
                                <dl>
                                    <div><dt>Nome</dt><dd>{sel.nome}</dd></div>
                                    <div>
                                        <dt>Telefone</dt>
                                        <dd>{sel.telefone} <FaWhatsapp size={13} /></dd>
                                    </div>
                                    <div>
                                        <dt>E-mail</dt>
                                        <dd>{sel.email || "—"} <Mail size={13} /></dd>
                                    </div>
                                    <div>
                                        <dt>Cidade</dt>
                                        <dd>{sel.cidade || "—"} <MapPin size={13} /></dd>
                                    </div>
                                </dl>
                                <div className="crm-tags">
                                    <span>Tags</span>
                                    <div>
                                        {(sel.tags || []).map((t) => <b key={t}>{t}</b>)}
                                        <button type="button" onClick={addTag}><Plus size={12} /></button>
                                    </div>
                                </div>
                            </div>

                            {[
                                { id: "pedidos", label: `Pedidos (${(sel.pedidos || []).length})` },
                                { id: "historico", label: "Histórico" },
                                { id: "observacoes", label: "Observações" },
                                { id: "acoes", label: "Ações rápidas" }
                            ].map((bloco) => (
                                <button
                                    key={bloco.id}
                                    type="button"
                                    className={`crm-acc${painel === bloco.id ? " is-on" : ""}`}
                                    onClick={() => setPainel(painel === bloco.id ? "" : bloco.id)}
                                >
                                    {bloco.label}
                                    <ChevronDown size={14} />
                                </button>
                            ))}
                            {painel === "pedidos" ? (
                                <ul className="crm-acc-body">
                                    {(sel.pedidos || []).length === 0 ? <li>Nenhum pedido neste atendimento.</li> : null}
                                    {(sel.pedidos || []).map((p) => (
                                        <li key={p.id}><strong>#{p.id}</strong> {p.titulo}<span>R$ {p.valor}</span></li>
                                    ))}
                                </ul>
                            ) : null}
                            {painel === "historico" ? (
                                <ul className="crm-acc-body">
                                    {assuntos.filter((a) => a.contato === sel.nome || Number(a.contatoId) === Number(sel.contatoId)).map((a) => (
                                        <li key={a.id}>{a.titulo}</li>
                                    ))}
                                    <li>{sel.mensagens.length} mensagens neste canal</li>
                                </ul>
                            ) : null}
                            {painel === "observacoes" ? (
                                <textarea
                                    className="crm-acc-obs"
                                    value={sel.observacao || ""}
                                    onChange={(e) => setInbox((atual) => atual.map((i) => i.id === sel.id ? { ...i, observacao: e.target.value } : i))}
                                    placeholder="Anotações internas do atendimento"
                                />
                            ) : null}
                            {painel === "acoes" ? (
                                <div className="crm-acc-body crm-acoes">
                                    <button type="button" onClick={incluirAssunto}>Criar assunto</button>
                                    <button type="button" onClick={() => setInbox((a) => a.map((i) => i.id === sel.id ? { ...i, status: "atendimento" } : i))}>Assumir atendimento</button>
                                    <button type="button" onClick={() => setInbox((a) => a.map((i) => i.id === sel.id ? { ...i, status: "resolvida" } : i))}>Resolver</button>
                                </div>
                            ) : null}

                            <a className="crm-abrir-wa" href={linkWhatsApp(sel.telefone)} target="_blank" rel="noopener noreferrer">
                                <FaWhatsapp size={16} />
                                Abrir no WhatsApp
                            </a>
                        </>
                    ) : (
                        <p className="crm-empty">Selecione um cliente.</p>
                    )}
                </aside>
            </div>

            {modalConexao ? (
                <div className="crm-nova" onClick={() => setModalConexao(false)}>
                    <form className="crm-nova-box crm-connect-box" onClick={(e) => e.stopPropagation()} onSubmit={salvarZapi}>
                        <h3>Conectar WhatsApp (Z-API)</h3>
                        <p>
                            Crie uma instância em{" "}
                            <a href="https://developer.z-api.io" target="_blank" rel="noopener noreferrer">developer.z-api.io</a>
                            , copie Instance ID, Token e Client-Token, salve e escaneie o QR no celular
                            (WhatsApp → Aparelhos conectados).
                        </p>
                        <label>
                            Instance ID
                            <input value={zapi.instanceId} onChange={(e) => setZapi({ ...zapi, instanceId: e.target.value })} required />
                        </label>
                        <label>
                            Token
                            <input value={zapi.token} onChange={(e) => setZapi({ ...zapi, token: e.target.value })} required />
                        </label>
                        <label>
                            Client-Token
                            <input value={zapi.clientToken} onChange={(e) => setZapi({ ...zapi, clientToken: e.target.value })} required />
                        </label>
                        {qr ? <img className="crm-qr" src={qr} alt="QR Code WhatsApp" /> : null}
                        {avisoZapi ? <p className="crm-zapi-aviso">{avisoZapi}</p> : null}
                        <p className="crm-zapi-ajuda">
                            Para receber mensagens neste computador, no painel da Z-API aponte o webhook de
                            recebimento para <code>/api/whatsapp/webhook</code> (use um túnel se estiver em localhost).
                        </p>
                        <div className="crm-head-actions">
                            {conta.conectado ? (
                                <button type="button" className="crm-btn-ghost" onClick={desconectar}>
                                    <WifiOff size={14} /> desconectar aparelho
                                </button>
                            ) : (
                                <button type="submit" className="crm-abrir-wa" disabled={conectando}>
                                    {conectando ? "gerando QR…" : "salvar e gerar QR"}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            ) : null}

            {nova ? (
                <div className="crm-nova" onClick={() => setNova(false)}>
                    <div className="crm-nova-box" onClick={(e) => e.stopPropagation()}>
                        <h3>Nova conversa</h3>
                        <ul>
                            {contatosComWhatsApp().slice(0, 40).map((c) => (
                                <li key={c.id}>
                                    <button type="button" onClick={() => iniciarCom(c)}>
                                        {c.fantasia || c.nome}
                                        <small>{c.celular || c.telefone}</small>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
