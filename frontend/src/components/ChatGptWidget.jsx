import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";

import { conversarChatGpt, statusChatGpt } from "../services/ia.service";

import "../styles/layout/chatgpt.css";

export default function ChatGptWidget({ oculto }) {
    const [aberto, setAberto] = useState(false);
    const [texto, setTexto] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [status, setStatus] = useState({ configurado: false });
    const [mensagens, setMensagens] = useState([
        { role: "assistant", content: "Oi! Sou o ChatGPT ligado ao ERP Tem de Tudo. Pergunte sobre cadastros, estoque, vendas ou o que fazer na tela." }
    ]);
    const fim = useRef(null);

    useEffect(() => {
        statusChatGpt()
            .then(setStatus)
            .catch(() => setStatus({ configurado: false }));
    }, [aberto]);

    useEffect(() => {
        fim.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens, aberto]);

    if (oculto) {
        return null;
    }

    async function enviar(evento) {
        evento?.preventDefault();
        const pergunta = texto.trim();
        if (!pergunta || enviando) {
            return;
        }
        const historico = [...mensagens, { role: "user", content: pergunta }].filter((m) => m.role === "user" || m.role === "assistant");
        setTexto("");
        setMensagens(historico);
        setEnviando(true);
        try {
            const res = await conversarChatGpt(historico.slice(-12));
            if (res?.ok) {
                setMensagens((atual) => [...atual, { role: "assistant", content: res.resposta }]);
            } else {
                setMensagens((atual) => [...atual, { role: "assistant", content: res?.mensagem || "Não consegui responder agora." }]);
            }
        } catch {
            setMensagens((atual) => [...atual, { role: "assistant", content: "Falha de rede ao falar com o ChatGPT. Confira se o backend está no ar." }]);
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className={`gpt-widget${aberto ? " is-on" : ""}`}>
            {aberto ? (
                <section className="gpt-box" aria-label="ChatGPT">
                    <header>
                        <strong>ChatGPT</strong>
                        <button type="button" onClick={() => setAberto(false)} aria-label="Fechar">
                            <X size={16} />
                        </button>
                    </header>
                    {!status.configurado ? (
                        <p className="gpt-aviso">
                            Conecte sua conta em{" "}
                            <Link to="/integracoes/chatgpt">Integrações → ChatGPT</Link>
                            {" "}com a chave de platform.openai.com.
                        </p>
                    ) : null}
                    <div className="gpt-msgs">
                        {mensagens.map((m, i) => (
                            <p key={i} className={m.role === "user" ? "is-eu" : "is-bot"}>{m.content}</p>
                        ))}
                        {enviando ? <p className="is-bot is-wait">pensando…</p> : null}
                        <div ref={fim} />
                    </div>
                    <form onSubmit={enviar}>
                        <input
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            placeholder="Pergunte ao ChatGPT…"
                            disabled={enviando}
                        />
                        <button type="submit" disabled={enviando || !texto.trim()}>Enviar</button>
                    </form>
                </section>
            ) : null}
            <button type="button" className="gpt-fab" onClick={() => setAberto((v) => !v)} aria-label="Abrir ChatGPT">
                <Sparkles size={20} />
            </button>
        </div>
    );
}
