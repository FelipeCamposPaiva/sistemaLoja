import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    Building2,
    Calendar,
    Camera,
    Check,
    Lock,
    Mail,
    MapPin,
    Monitor,
    Moon,
    Phone,
    Shield,
    Sun,
    User,
    X
} from "lucide-react";

import useAuth from "../../hooks/useAuth.jsx";
import ROTAS from "../../constants/rotas";
import {
    alterarSenhaApi,
    confirmar2faApi,
    desativar2faApi,
    iniciar2faApi
} from "../../services/auth.service";
import {
    CARGOS_CONTA,
    CORES_SISTEMA,
    dataHoraBr,
    dispositivoAtual,
    EMPRESA_CONTA,
    gravarConta,
    lerConta
} from "../../constants/conta";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/minha-conta.css";

const MENU_FIXO_KEY = "erp-menu-fixo";

function iniciaisNome(nome) {
    const partes = String(nome || "?").trim().split(/\s+/);
    return ((partes[0]?.[0] || "?") + (partes[1]?.[0] || "")).toUpperCase();
}

export default function MinhaConta() {
    const { usuario } = useAuth();
    const fotoRef = useRef(null);
    const [form, setForm] = useState(() => lerConta(usuario));
    const [editando, setEditando] = useState(false);
    const [aviso, setAviso] = useState("");
    const [modal, setModal] = useState(null);
    const [codigo2fa, setCodigo2fa] = useState("");
    const dispositivo = useMemo(() => dispositivoAtual(), []);
    const acesso = dataHoraBr(form.ultimoAcesso);
    const iniciais = iniciaisNome(form.nome);

    useEffect(() => {
        if (usuario?.doisFatores != null) {
            persistir({ doisFatores: Boolean(usuario.doisFatores) });
        }
        if (usuario?.ultimoLogin && !form.ultimoAcesso) {
            persistir({ ultimoAcesso: usuario.ultimoLogin });
        } else if (!form.ultimoAcesso) {
            persistir({ ultimoAcesso: new Date().toISOString() });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function ativar2fa() {
        try {
            const data = await iniciar2faApi();
            setCodigo2fa(data.codigo2fa || "");
            setModal("2fa");
            setAviso("");
        } catch (error) {
            setAviso(error.response?.data?.mensagem || "Não foi possível iniciar o 2FA.");
        }
    }

    function desligar2fa() {
        setModal("off2fa");
    }

    function persistir(parcial) {
        setForm((atual) => {
            const proximo = { ...atual, ...parcial };
            gravarConta(proximo);
            if (parcial.menu) {
                try {
                    localStorage.setItem(MENU_FIXO_KEY, parcial.menu === "expandido" ? "1" : "0");
                } catch {
                    /* ignore */
                }
            }
            return proximo;
        });
    }

    function setCampo(chave, valor) {
        setForm((atual) => ({ ...atual, [chave]: valor }));
        setAviso("");
    }

    function salvarDados() {
        if (!String(form.nome || "").trim() || !String(form.email || "").trim()) {
            setAviso("Informe nome e e-mail.");
            return;
        }
        persistir({
            nome: form.nome.trim(),
            email: form.email.trim(),
            telefone: form.telefone,
            cargo: form.cargo,
            empresa: form.empresa
        });
        setEditando(false);
        setAviso("Dados pessoais atualizados.");
    }

    function escolherFoto(arquivo) {
        if (!arquivo) {
            return;
        }
        if (arquivo.size > 800 * 1024) {
            setAviso("Use uma foto de até 800 KB.");
            return;
        }
        const leitor = new FileReader();
        leitor.onload = () => persistir({ foto: String(leitor.result || "") });
        leitor.readAsDataURL(arquivo);
    }

    return (
        <div className="mc-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <Link to={ROTAS.MINHA_CONTA}>Minha Conta</Link>
            </nav>

            <div className="mc-head">
                <span className="mc-head-ico" aria-hidden>
                    <User size={18} />
                </span>
                <div>
                    <h2>Minha Conta</h2>
                    <p>Gerencie suas informações, preferências e segurança da sua conta.</p>
                </div>
            </div>

            {aviso ? <p className="mc-aviso">{aviso}</p> : null}

            <section className="mc-hero">
                <div className="mc-hero-pessoa">
                    <button type="button" className="mc-avatar" onClick={() => fotoRef.current?.click()} aria-label="Alterar foto">
                        {form.foto ? <img src={form.foto} alt="" /> : <span>{iniciais}</span>}
                        <i><Camera size={12} /></i>
                    </button>
                    <input
                        ref={fotoRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => escolherFoto(e.target.files?.[0])}
                    />
                    <div>
                        <h3>
                            {form.nome || "—"}
                            <em>{form.cargo || "ADMIN"}</em>
                        </h3>
                        <p>
                            <Building2 size={13} />
                            {form.empresa}
                        </p>
                        <span className="mc-ativa">
                            <i />
                            Conta ativa
                        </span>
                    </div>
                </div>
                <div className="mc-kpis">
                    <article>
                        <span className="mc-kpi-ico is-cal"><Calendar size={16} /></span>
                        <div>
                            <small>Último acesso</small>
                            <strong>{acesso.data}</strong>
                            <em>às {acesso.hora}</em>
                        </div>
                    </article>
                    <article>
                        <span className="mc-kpi-ico is-pc"><Monitor size={16} /></span>
                        <div>
                            <small>Dispositivo atual</small>
                            <strong>{dispositivo}</strong>
                            <em>Volta Redonda - RJ</em>
                        </div>
                    </article>
                    <article>
                        <span className="mc-kpi-ico is-ok"><Shield size={16} /></span>
                        <div>
                            <small>Sessões ativas</small>
                            <strong>1 sessão</strong>
                            <button type="button" className="mc-link" onClick={() => setModal("sessoes")}>
                                Gerenciar sessões →
                            </button>
                        </div>
                    </article>
                </div>
            </section>

            <div className="mc-cols">
                <section className="mc-card">
                    <header>
                        <span>
                            <User size={16} />
                            Dados pessoais
                            <small>Suas informações básicas de identificação.</small>
                        </span>
                        {editando ? (
                            <span className="mc-card-acoes">
                                <button type="button" className="mc-ghost" onClick={() => { setForm(lerConta(usuario)); setEditando(false); }}>
                                    Cancelar
                                </button>
                                <button type="button" className="mc-pri" onClick={salvarDados}>Salvar</button>
                            </span>
                        ) : (
                            <button type="button" className="mc-edit" onClick={() => setEditando(true)}>
                                Editar
                            </button>
                        )}
                    </header>
                    <div className="mc-form">
                        <label>
                            Nome completo <i>*</i>
                            <input disabled={!editando} value={form.nome} onChange={(e) => setCampo("nome", e.target.value)} />
                        </label>
                        <label>
                            E-mail <i>*</i>
                            <input disabled={!editando} type="email" value={form.email} onChange={(e) => setCampo("email", e.target.value)} />
                        </label>
                        <label>
                            Telefone
                            <input disabled={!editando} value={form.telefone} onChange={(e) => setCampo("telefone", e.target.value)} placeholder="(24) 00000-0000" />
                        </label>
                        <label>
                            Cargo
                            <select disabled={!editando} value={form.cargo} onChange={(e) => setCampo("cargo", e.target.value)}>
                                {CARGOS_CONTA.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </label>
                        <label className="is-full">
                            Empresa
                            <span className="mc-com-icone">
                                <Building2 size={14} />
                                <input disabled={!editando} value={form.empresa} onChange={(e) => setCampo("empresa", e.target.value)} />
                            </span>
                        </label>
                    </div>
                </section>

                <section className="mc-card">
                    <header>
                        <span>
                            <Shield size={16} />
                            Segurança da conta
                            <small>Mantenha sua conta protegida.</small>
                        </span>
                    </header>
                    <ul className="mc-sec">
                        <li>
                            <span>
                                <small>Senha</small>
                                <strong>••••••••</strong>
                            </span>
                            <button type="button" className="mc-edit" onClick={() => setModal("senha")}>
                                <Lock size={13} />
                                Alterar senha
                            </button>
                        </li>
                        <li>
                            <span>
                                <small>Autenticação em dois fatores (2FA)</small>
                                <strong className={form.doisFatores ? "is-on" : "is-off"}>
                                    {form.doisFatores ? "Ativada" : "Desativada"}
                                </strong>
                            </span>
                            <button
                                type="button"
                                className={form.doisFatores ? "mc-ghost" : "mc-pri"}
                                onClick={() => (form.doisFatores ? desligar2fa() : ativar2fa())}
                            >
                                {form.doisFatores ? "Desativar" : "Ativar"}
                            </button>
                        </li>
                        <li>
                            <span>
                                <small>Último acesso</small>
                                <strong><Calendar size={13} /> {acesso.data} às {acesso.hora}</strong>
                            </span>
                        </li>
                        <li>
                            <span>
                                <small>Dispositivo atual</small>
                                <strong><Monitor size={13} /> {dispositivo}<em>Volta Redonda - RJ</em></strong>
                            </span>
                        </li>
                        <li>
                            <span>
                                <small>Sessões ativas</small>
                                <strong><Shield size={13} /> 1 sessão ativa</strong>
                            </span>
                            <button type="button" className="mc-link" onClick={() => setModal("sessoes")}>
                                Gerenciar sessões →
                            </button>
                        </li>
                    </ul>
                </section>

                <section className="mc-card">
                    <header>
                        <span>
                            <Sun size={16} />
                            Preferências do sistema
                            <small>Personalize sua experiência no ERP.</small>
                        </span>
                    </header>
                    <div className="mc-pref">
                        <p>Tema</p>
                        <div className="mc-pills">
                            {[
                                { id: "claro", nome: "Claro", Icon: Sun },
                                { id: "escuro", nome: "Escuro", Icon: Moon },
                                { id: "automatico", nome: "Automático", Icon: Monitor }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    className={form.tema === t.id ? "is-on" : ""}
                                    onClick={() => persistir({ tema: t.id })}
                                >
                                    <t.Icon size={14} />
                                    {t.nome}
                                </button>
                            ))}
                        </div>
                        <p>Cor do sistema</p>
                        <div className="mc-cores" role="radiogroup" aria-label="Cor do sistema">
                            {CORES_SISTEMA.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={form.cor === c.id ? "is-on" : ""}
                                    style={{ background: c.hex }}
                                    aria-label={c.id}
                                    onClick={() => persistir({ cor: c.id })}
                                >
                                    {form.cor === c.id ? <Check size={12} /> : null}
                                </button>
                            ))}
                        </div>
                        <div className="mc-toggle">
                            <span>
                                Notificações
                                <small>Receba notificações do sistema por aqui.</small>
                            </span>
                            <button
                                type="button"
                                className={`mc-switch${form.notificacoes ? " is-on" : ""}`}
                                aria-pressed={form.notificacoes}
                                onClick={() => persistir({ notificacoes: !form.notificacoes })}
                            >
                                {form.notificacoes ? "Ativadas" : "Desativadas"}
                            </button>
                        </div>
                        <p>Menu lateral</p>
                        <div className="mc-pills">
                            <button
                                type="button"
                                className={form.menu === "expandido" ? "is-on" : ""}
                                onClick={() => persistir({ menu: "expandido" })}
                            >
                                Expandido
                            </button>
                            <button
                                type="button"
                                className={form.menu === "compacto" ? "is-on" : ""}
                                onClick={() => persistir({ menu: "compacto" })}
                            >
                                Compacto
                            </button>
                        </div>
                    </div>
                </section>

                <section className="mc-card">
                    <header>
                        <span>
                            <Building2 size={16} />
                            Informações da empresa
                            <small>Dados da empresa que você faz parte.</small>
                        </span>
                        <Link to={ROTAS.LOJA_ADMIN} className="mc-edit">Configurar empresa</Link>
                    </header>
                    <dl className="mc-empresa">
                        <div>
                            <dt>Razão social</dt>
                            <dd>{EMPRESA_CONTA.razao}</dd>
                        </div>
                        <div>
                            <dt>CNPJ</dt>
                            <dd>{EMPRESA_CONTA.cnpj}</dd>
                        </div>
                        <div>
                            <dt>Endereço</dt>
                            <dd><MapPin size={13} /> {EMPRESA_CONTA.endereco}<br />{EMPRESA_CONTA.cidade}, {EMPRESA_CONTA.cep}</dd>
                        </div>
                        <div>
                            <dt>Telefone</dt>
                            <dd><Phone size={13} /> {EMPRESA_CONTA.telefone}</dd>
                        </div>
                        <div>
                            <dt>E-mail</dt>
                            <dd><Mail size={13} /> {EMPRESA_CONTA.email}</dd>
                        </div>
                        <div>
                            <dt>Loja principal</dt>
                            <dd><MapPin size={13} /> {EMPRESA_CONTA.loja}</dd>
                        </div>
                        <div>
                            <dt>Filiais</dt>
                            <dd>
                                {EMPRESA_CONTA.filiais} filiais cadastradas
                                <Link to={ROTAS.LOCALIZACOES} className="mc-link">Ver filiais →</Link>
                            </dd>
                        </div>
                    </dl>
                </section>
            </div>

            {modal === "senha" ? (
                <ModalSenha
                    fechar={() => setModal(null)}
                    onOk={() => { setModal(null); setAviso("Senha atualizada."); }}
                />
            ) : null}
            {modal === "2fa" ? (
                <Modal2fa
                    codigoGerado={codigo2fa}
                    fechar={() => setModal(null)}
                    onOk={() => {
                        persistir({ doisFatores: true });
                        setModal(null);
                        setAviso("2FA ativado. No próximo login será pedido o código.");
                    }}
                />
            ) : null}
            {modal === "off2fa" ? (
                <ModalOff2fa
                    fechar={() => setModal(null)}
                    onOk={() => {
                        persistir({ doisFatores: false });
                        setModal(null);
                        setAviso("Autenticação em dois fatores desativada.");
                    }}
                />
            ) : null}
            {modal === "sessoes" ? (
                <ModalSessoes
                    dispositivo={dispositivo}
                    acesso={acesso}
                    fechar={() => setModal(null)}
                />
            ) : null}
        </div>
    );
}

function ModalSenha({ fechar, onOk }) {
    const [atual, setAtual] = useState("");
    const [nova, setNova] = useState("");
    const [conf, setConf] = useState("");
    const [erro, setErro] = useState("");

    const [enviando, setEnviando] = useState(false);

    async function enviar(e) {
        e.preventDefault();
        if (!atual || !nova) {
            setErro("Preencha a senha atual e a nova.");
            return;
        }
        if (nova.length < 6) {
            setErro("A nova senha precisa ter ao menos 6 caracteres.");
            return;
        }
        if (nova !== conf) {
            setErro("A confirmação não confere.");
            return;
        }
        try {
            setEnviando(true);
            await alterarSenhaApi(atual, nova);
            onOk();
        } catch (error) {
            setErro(error.response?.data?.mensagem || "Não foi possível alterar a senha.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="mc-overlay" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
            <form className="mc-modal" onSubmit={enviar}>
                <header>
                    <h3>Alterar senha</h3>
                    <button type="button" onClick={fechar} aria-label="Fechar"><X size={16} /></button>
                </header>
                {erro ? <p className="mc-aviso">{erro}</p> : null}
                <label>Senha atual<input type="password" value={atual} onChange={(e) => setAtual(e.target.value)} /></label>
                <label>Nova senha<input type="password" value={nova} onChange={(e) => setNova(e.target.value)} /></label>
                <label>Confirmar nova senha<input type="password" value={conf} onChange={(e) => setConf(e.target.value)} /></label>
                <footer>
                    <button type="button" className="mc-ghost" onClick={fechar}>Cancelar</button>
                    <button type="submit" className="mc-pri" disabled={enviando}>{enviando ? "Salvando..." : "Salvar senha"}</button>
                </footer>
            </form>
        </div>
    );
}

function Modal2fa({ codigoGerado, fechar, onOk }) {
    const [codigo, setCodigo] = useState("");
    const [erro, setErro] = useState("");
    const [enviando, setEnviando] = useState(false);

    async function enviar(e) {
        e.preventDefault();
        if (!codigo.trim()) {
            setErro("Informe o código de 6 dígitos.");
            return;
        }
        try {
            setEnviando(true);
            await confirmar2faApi(codigo.trim());
            onOk();
        } catch (error) {
            setErro(error.response?.data?.mensagem || "Código inválido.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="mc-overlay" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
            <form className="mc-modal" onSubmit={enviar}>
                <header>
                    <h3>Ativar 2FA</h3>
                    <button type="button" onClick={fechar} aria-label="Fechar"><X size={16} /></button>
                </header>
                {codigoGerado ? <p className="mc-aviso">Código de verificação: {codigoGerado}</p> : null}
                {erro ? <p className="mc-aviso" style={{ color: "#be123c" }}>{erro}</p> : null}
                <label>
                    Código
                    <input
                        inputMode="numeric"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                    />
                </label>
                <footer>
                    <button type="button" className="mc-ghost" onClick={fechar}>Cancelar</button>
                    <button type="submit" className="mc-pri" disabled={enviando}>{enviando ? "Validando..." : "Confirmar"}</button>
                </footer>
            </form>
        </div>
    );
}

function ModalOff2fa({ fechar, onOk }) {
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [enviando, setEnviando] = useState(false);

    async function enviar(e) {
        e.preventDefault();
        if (!senha) {
            setErro("Informe a senha da conta.");
            return;
        }
        try {
            setEnviando(true);
            await desativar2faApi(senha);
            onOk();
        } catch (error) {
            setErro(error.response?.data?.mensagem || "Não foi possível desativar o 2FA.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="mc-overlay" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
            <form className="mc-modal" onSubmit={enviar}>
                <header>
                    <h3>Desativar 2FA</h3>
                    <button type="button" onClick={fechar} aria-label="Fechar"><X size={16} /></button>
                </header>
                {erro ? <p className="mc-aviso" style={{ color: "#be123c" }}>{erro}</p> : null}
                <p className="mc-aviso">Confirme com a senha da conta para desligar a verificação em duas etapas.</p>
                <label>
                    Senha
                    <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
                </label>
                <footer>
                    <button type="button" className="mc-ghost" onClick={fechar}>Cancelar</button>
                    <button type="submit" className="mc-pri" disabled={enviando}>{enviando ? "Desativando..." : "Desativar"}</button>
                </footer>
            </form>
        </div>
    );
}

function ModalSessoes({ dispositivo, acesso, fechar }) {
    return (
        <div className="mc-overlay" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
            <div className="mc-modal">
                <header>
                    <h3>Sessões ativas</h3>
                    <button type="button" onClick={fechar} aria-label="Fechar"><X size={16} /></button>
                </header>
                <div className="mc-sessao is-atual">
                    <Monitor size={16} />
                    <span>
                        <strong>{dispositivo}</strong>
                        <small>Volta Redonda - RJ · {acesso.data} às {acesso.hora}</small>
                    </span>
                    <em>Atual</em>
                </div>
                <footer>
                    <button type="button" className="mc-pri" onClick={fechar}>Fechar</button>
                </footer>
            </div>
        </div>
    );
}
