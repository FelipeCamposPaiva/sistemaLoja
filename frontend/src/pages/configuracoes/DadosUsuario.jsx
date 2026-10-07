import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";

import useAuth from "../../hooks/useAuth.jsx";
import ROTAS from "../../constants/rotas";
import { gravarConta, lerConta } from "../../constants/conta";
import {
    alterarSenhaApi,
    confirmar2faApi,
    desativar2faApi,
    iniciar2faApi
} from "../../services/auth.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/minha-conta.css";
import "../../styles/pages/dados-usuario.css";

const CORES = ["#f5c518", "#ff2f92", "#38bdf8", "#22c55e", "#f97316", "#a78bfa"];

function inicialDe(nome) {
    return String(nome || "?").trim().charAt(0).toUpperCase() || "?";
}

export default function DadosUsuario() {
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const fotoRef = useRef(null);
    const [form, setForm] = useState(() => {
        const conta = lerConta(usuario);
        return {
            ...conta,
            corAvatar: conta.corAvatar || CORES[0],
            codigoDesconto: conta.codigoDesconto || ""
        };
    });
    const [aviso, setAviso] = useState("");
    const [coresAbertas, setCoresAbertas] = useState(false);
    const [painel, setPainel] = useState(null);
    const [codigo2fa, setCodigo2fa] = useState("");

    function persistir(parcial) {
        setForm((atual) => {
            const proximo = { ...atual, ...parcial };
            gravarConta(proximo);
            return proximo;
        });
    }

    function escolherFoto(arquivo) {
        if (!arquivo) {
            return;
        }
        if (arquivo.size > 2 * 1024 * 1024) {
            setAviso("O tamanho do arquivo não deve ultrapassar 2Mb.");
            return;
        }
        const leitor = new FileReader();
        leitor.onload = () => persistir({ foto: String(leitor.result || "") });
        leitor.readAsDataURL(arquivo);
    }

    async function ativar2fa() {
        try {
            const data = await iniciar2faApi();
            setCodigo2fa(data.codigo2fa || "");
            setPainel("2fa");
            setAviso("");
        } catch (error) {
            setAviso(error.response?.data?.mensagem || "Não foi possível iniciar a verificação em duas etapas.");
        }
    }

    return (
        <div className="du-page">
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
                    <span>dados do usuário</span>
                </nav>
            </div>
            <h2>Dados do usuário</h2>
            {aviso ? <p className={aviso.includes("Não") || aviso.includes("inválid") ? "emp-erro" : "emp-ok"}>{aviso}</p> : null}

            <div className="du-ident">
                <div className="du-avatar" style={{ background: form.corAvatar }}>
                    {form.foto ? <img src={form.foto} alt="" /> : <span>{inicialDe(form.nome)}</span>}
                </div>
                <div className="du-campos">
                    <label>
                        Nome
                        <input
                            value={form.nome}
                            onChange={(e) => setForm((atual) => ({ ...atual, nome: e.target.value }))}
                            onBlur={() => persistir({ nome: form.nome.trim() })}
                        />
                    </label>
                    <label>
                        E-mail
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((atual) => ({ ...atual, email: e.target.value }))}
                            onBlur={() => persistir({ email: form.email.trim() })}
                        />
                    </label>
                </div>
            </div>
            <div className="du-foto">
                <button
                    type="button"
                    className="du-cor"
                    style={{ background: form.corAvatar }}
                    aria-label="Cor do avatar"
                    onClick={() => setCoresAbertas((aberto) => !aberto)}
                />
                {coresAbertas ? (
                    <div className="du-paleta">
                        {CORES.map((cor) => (
                            <button
                                key={cor}
                                type="button"
                                style={{ background: cor }}
                                aria-label={cor}
                                onClick={() => {
                                    persistir({ corAvatar: cor });
                                    setCoresAbertas(false);
                                }}
                            />
                        ))}
                    </div>
                ) : null}
                <button type="button" className="emp-link" onClick={() => fotoRef.current?.click()}>
                    escolher foto
                </button>
                <input
                    ref={fotoRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => escolherFoto(e.target.files?.[0])}
                />
            </div>

            <section className="du-bloco">
                <h3>Verificação em duas etapas</h3>
                <p>
                    A verificação em duas etapas através do Google Authenticator está {form.doisFatores ? "ativada" : "desativada"}.
                </p>
                <p>Esta verificação é uma etapa adicional ao entrar no sistema ERP que ajuda a manter a segurança da sua conta.</p>
                <button
                    type="button"
                    className="emp-link"
                    onClick={() => (form.doisFatores ? setPainel("off2fa") : ativar2fa())}
                >
                    {form.doisFatores ? "desativar verificação em duas etapas" : "ativar verificação em duas etapas"}
                </button>
            </section>

            <section className="du-bloco">
                <h3>Código para liberação de desconto em vendas</h3>
                <p>Código utilizado pelo gerente para liberar descontos em vendas acima do permitido</p>
                <button type="button" className="du-codigo" onClick={() => setPainel("codigo")}>
                    {form.codigoDesconto ? "alterar código" : "definir código"}
                </button>
            </section>

            <button type="button" className="emp-link du-senha" onClick={() => setPainel("senha")}>
                alterar senha de acesso
            </button>

            {painel === "senha" ? (
                <ModalSenha
                    fechar={() => setPainel(null)}
                    onOk={() => {
                        setPainel(null);
                        setAviso("Senha de acesso atualizada.");
                    }}
                />
            ) : null}
            {painel === "2fa" ? (
                <Modal2fa
                    codigoGerado={codigo2fa}
                    fechar={() => setPainel(null)}
                    onOk={() => {
                        persistir({ doisFatores: true });
                        setPainel(null);
                        setAviso("Verificação em duas etapas ativada.");
                    }}
                />
            ) : null}
            {painel === "off2fa" ? (
                <ModalOff2fa
                    fechar={() => setPainel(null)}
                    onOk={() => {
                        persistir({ doisFatores: false });
                        setPainel(null);
                        setAviso("Verificação em duas etapas desativada.");
                    }}
                />
            ) : null}
            {painel === "codigo" ? (
                <ModalCodigo
                    atual={form.codigoDesconto}
                    fechar={() => setPainel(null)}
                    onOk={(codigo) => {
                        persistir({ codigoDesconto: codigo });
                        setPainel(null);
                        setAviso("Código de desconto definido.");
                    }}
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
                    <h3>Alterar senha de acesso</h3>
                    <button type="button" onClick={fechar} aria-label="Fechar"><X size={16} /></button>
                </header>
                {erro ? <p className="emp-erro">{erro}</p> : null}
                <label>Senha atual<input type="password" value={atual} onChange={(e) => setAtual(e.target.value)} autoComplete="current-password" /></label>
                <label>Nova senha<input type="password" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" /></label>
                <label>Confirmar nova senha<input type="password" value={conf} onChange={(e) => setConf(e.target.value)} autoComplete="new-password" /></label>
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
                    <h3>Ativar verificação em duas etapas</h3>
                    <button type="button" onClick={fechar} aria-label="Fechar"><X size={16} /></button>
                </header>
                {codigoGerado ? <p>Código de verificação: {codigoGerado}</p> : null}
                {erro ? <p className="emp-erro">{erro}</p> : null}
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
            setErro(error.response?.data?.mensagem || "Não foi possível desativar a verificação.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="mc-overlay" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
            <form className="mc-modal" onSubmit={enviar}>
                <header>
                    <h3>Desativar verificação em duas etapas</h3>
                    <button type="button" onClick={fechar} aria-label="Fechar"><X size={16} /></button>
                </header>
                {erro ? <p className="emp-erro">{erro}</p> : null}
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

function ModalCodigo({ atual, fechar, onOk }) {
    const [codigo, setCodigo] = useState(atual || "");
    const [erro, setErro] = useState("");

    function enviar(e) {
        e.preventDefault();
        const texto = codigo.trim();
        if (texto.length < 4) {
            setErro("O código precisa ter ao menos 4 caracteres.");
            return;
        }
        onOk(texto);
    }

    return (
        <div className="mc-overlay" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
            <form className="mc-modal" onSubmit={enviar}>
                <header>
                    <h3>Código para liberação de desconto</h3>
                    <button type="button" onClick={fechar} aria-label="Fechar"><X size={16} /></button>
                </header>
                {erro ? <p className="emp-erro">{erro}</p> : null}
                <label>
                    Código
                    <input value={codigo} onChange={(e) => setCodigo(e.target.value)} autoComplete="off" />
                </label>
                <footer>
                    <button type="button" className="mc-ghost" onClick={fechar}>Cancelar</button>
                    <button type="submit" className="mc-pri">Salvar código</button>
                </footer>
            </form>
        </div>
    );
}
