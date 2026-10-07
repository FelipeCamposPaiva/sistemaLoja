import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";

const CHAVE = "erp-servidor-email-v1";

const PADRAO = {
    tipo: "SMTP",
    servidor: "smtp.gmail.com",
    porta: "587",
    seguranca: "TLS",
    autenticacao: "Sim",
    usuario: "atendimento@temdetudovr.com.br",
    senha: "",
    remetenteNome: "Tem de Tudo VR",
    remetenteEmail: "atendimento@temdetudovr.com.br",
    responder: "atendimento@temdetudovr.com.br"
};

function ler() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (bruto && typeof bruto === "object") {
            return { ...PADRAO, ...bruto, senha: "" };
        }
    } catch {
        /* ignore */
    }
    return { ...PADRAO };
}

export default function ServidorEmail() {
    const navigate = useNavigate();
    const [form, setForm] = useState(ler);
    const [teste, setTeste] = useState("");
    const [aviso, setAviso] = useState("");
    const [ajuda, setAjuda] = useState(false);

    function setCampo(chave, valor) {
        setForm((atual) => ({ ...atual, [chave]: valor }));
        setAviso("");
    }

    function voltar() {
        navigate(ROTAS.CONFIGURACOES);
    }

    function salvar(evento) {
        evento.preventDefault();
        if (!form.servidor.trim() || !form.porta.trim()) {
            setAviso("Informe o servidor e a porta.");
            return;
        }
        const resto = { ...form };
        delete resto.senha;
        localStorage.setItem(CHAVE, JSON.stringify(resto));
        setAviso(form.senha ? "Configuração salva. A senha fica só nesta sessão." : "Configuração do servidor de e-mail salva.");
    }

    function testar() {
        if (form.autenticacao === "Sim" && (!form.usuario.trim() || !form.senha)) {
            setAviso("Informe usuário e senha para testar a autenticação.");
            return;
        }
        if (!teste.trim() || !teste.includes("@")) {
            setAviso("Informe o e-mail do destinatário do teste.");
            return;
        }
        setAviso(`Campos conferidos para ${teste.trim()}. O disparo do teste ainda não sai por este ERP.`);
    }

    return (
        <form className="emp-page" onSubmit={salvar}>
            <div className="emp-top">
                <button type="button" className="emp-voltar" onClick={voltar}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <nav className="dash-crumb" aria-label="Trilha">
                    <Link to={ROTAS.INDICE}>início</Link>
                    <span>›</span>
                    <Link to={ROTAS.CONFIGURACOES}>configurações</Link>
                    <span>›</span>
                    <span>servidor de e-mail</span>
                </nav>
            </div>
            <h2>Configurações do servidor de e-mail</h2>
            {aviso ? <p className={aviso.startsWith("Informe") ? "emp-erro" : "emp-ok"}>{aviso}</p> : null}

            <div className="emp-campo">
                <span>Tipo de envio</span>
                <select value={form.tipo} onChange={(e) => setCampo("tipo", e.target.value)}>
                    <option>SMTP</option>
                    <option>Não utilizar</option>
                </select>
            </div>
            <div className="emp-linha emp-3">
                <div className="emp-campo">
                    <span>Servidor</span>
                    <input value={form.servidor} onChange={(e) => setCampo("servidor", e.target.value)} />
                </div>
                <div className="emp-campo">
                    <span>Porta</span>
                    <input value={form.porta} onChange={(e) => setCampo("porta", e.target.value.replace(/\D/g, "").slice(0, 5))} />
                </div>
                <div className="emp-campo">
                    <span>Segurança da conexão</span>
                    <select value={form.seguranca} onChange={(e) => setCampo("seguranca", e.target.value)}>
                        <option>Nenhuma</option>
                        <option>TLS</option>
                        <option>SSL</option>
                    </select>
                </div>
            </div>
            <div className="emp-linha emp-3">
                <div className="emp-campo">
                    <span>Servidor requer autenticação</span>
                    <select value={form.autenticacao} onChange={(e) => setCampo("autenticacao", e.target.value)}>
                        <option>Sim</option>
                        <option>Não</option>
                    </select>
                </div>
                <div className="emp-campo">
                    <span>Usuário</span>
                    <input value={form.usuario} onChange={(e) => setCampo("usuario", e.target.value)} autoComplete="off" />
                </div>
                <div className="emp-campo">
                    <span>Senha</span>
                    <input type="password" value={form.senha} onChange={(e) => setCampo("senha", e.target.value)} autoComplete="new-password" />
                </div>
            </div>
            <div className="emp-linha emp-3">
                <div className="emp-campo">
                    <span>Nome remetente</span>
                    <input value={form.remetenteNome} onChange={(e) => setCampo("remetenteNome", e.target.value)} />
                </div>
                <div className="emp-campo">
                    <span>E-mail remetente</span>
                    <input type="email" value={form.remetenteEmail} onChange={(e) => setCampo("remetenteEmail", e.target.value)} />
                </div>
                <div className="emp-campo">
                    <span>Responder para o e-mail</span>
                    <input type="email" value={form.responder} onChange={(e) => setCampo("responder", e.target.value)} />
                </div>
            </div>

            <section className="emp-bloco">
                <h3>
                    Teste de envio de e-mail
                    <button type="button" className="emp-link" onClick={() => setAjuda((aberto) => !aberto)}>ajuda</button>
                </h3>
                {ajuda ? (
                    <p>O teste confere servidor, porta, autenticação e o destinatário. A mensagem só é enviada quando o SMTP estiver ligado no servidor.</p>
                ) : null}
                <div className="emp-campo">
                    <span>Endereço de e-mail do destinatário do teste</span>
                    <input type="email" value={teste} onChange={(e) => setTeste(e.target.value)} />
                </div>
                <button type="button" className="emp-voltar" onClick={testar}>testar configurações</button>
            </section>

            <div className="emp-acoes">
                <button type="submit" className="emp-salvar">salvar</button>
                <button type="button" className="emp-cancelar" onClick={voltar}>cancelar</button>
            </div>
        </form>
    );
}
