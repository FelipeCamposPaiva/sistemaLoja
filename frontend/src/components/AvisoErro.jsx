import { Component, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

import {
    fecharAvisos,
    fecharErro,
    inscreverAvisos,
    instalarAvisos,
    marcarTela,
    mostrarAlerta,
    mostrarErro,
    mostrarSucesso
} from "./avisoErro";

import "../styles/components/aviso-erro.css";

function tipoDoAviso(texto, classe) {
    const nome = classe.toLowerCase();
    const mensagem = texto.toLowerCase();
    if (/is-warn|alerta/.test(nome) || /informe|selecione|marque|atenção|confira|escolha|precisa/.test(mensagem)) {
        if (!/não foi possível|nao foi possivel|falha ao|erro ao/.test(mensagem)) {
            return /informe|selecione|marque|atenção|confira|escolha|precisa|is-warn|alerta/.test(`${nome} ${mensagem}`) ? "alerta" : null;
        }
    }
    if (/(\b|-)(erro|error)(\b|-)|is-err|is-errado/.test(nome) || /não foi possível|nao foi possivel|falha|inválid|sem ligação|sem permissão/.test(mensagem)) {
        return "erro";
    }
    if (/(\b|-)ok(\b|-)|is-ok|sucesso/.test(nome) || /salvo|gravad|lançad|aplica|removid|conclu|atualizad|importad|enviad|recebid|despachad|gerad/.test(mensagem)) {
        return "ok";
    }
    return null;
}

export default function AvisoErro() {
    const { pathname } = useLocation();
    const [avisos, setAvisos] = useState([]);

    useEffect(() => {
        instalarAvisos();
        return inscreverAvisos(setAvisos);
    }, []);

    useLayoutEffect(() => {
        marcarTela();
        fecharAvisos();
    }, [pathname]);

    useEffect(() => {
        const raiz = document.getElementById("root");
        if (!raiz) {
            return undefined;
        }
        let espera = 0;
        function ler() {
            document.querySelectorAll("[class*='erro'], [class*='error'], [class*='aviso'], [class*='-ok']").forEach((el) => {
                if (el.closest(".erp-erro-pilha, .flyout-avisos, .flyout-list, .err-page, .lj-erro, .login-error, .recover-error")) {
                    return;
                }
                if (el.querySelector("[class*='erro'], [class*='error'], [class*='aviso'], [class*='-ok']")) {
                    return;
                }
                const estilo = window.getComputedStyle(el);
                if (estilo.display === "none" || estilo.visibility === "hidden") {
                    return;
                }
                const texto = String(el.innerText || "").replace(/\s+/g, " ").trim();
                if (texto.length < 4 || texto.length > 280) {
                    return;
                }
                const tipo = tipoDoAviso(texto, String(el.className || ""));
                if (tipo === "erro") {
                    mostrarErro(texto);
                } else if (tipo === "alerta") {
                    mostrarAlerta(texto);
                } else if (tipo === "ok") {
                    mostrarSucesso(texto);
                }
            });
        }
        function agendar() {
            window.clearTimeout(espera);
            espera = window.setTimeout(ler, 60);
        }
        agendar();
        const observer = new MutationObserver(agendar);
        observer.observe(raiz, { childList: true, subtree: true, characterData: true });
        return () => {
            window.clearTimeout(espera);
            observer.disconnect();
        };
    }, [pathname]);

    if (!avisos.length) {
        return null;
    }

    return createPortal(
        <div className="erp-erro-pilha">
            {avisos.map((aviso) => (
                <div className={`erp-erro is-${aviso.tipo || "erro"}`} role={aviso.tipo === "ok" ? "status" : "alert"} key={aviso.id}>
                    <strong>{aviso.tipo === "ok" ? "Confirmação" : aviso.tipo === "alerta" ? "Alerta" : "Erro"}</strong>
                    <p>{aviso.motivo}</p>
                    {aviso.onde ? <small>{aviso.onde}</small> : null}
                    <button type="button" onClick={() => fecharErro(aviso.id)}>fechar</button>
                </div>
            ))}
        </div>,
        document.body
    );
}

export class LimiteErro extends Component {
    constructor(props) {
        super(props);
        this.state = { erro: null };
    }

    static getDerivedStateFromError() {
        return { erro: true };
    }

    componentDidCatch(erro) {
        mostrarErro(erro);
    }

    render() {
        if (!this.state.erro) {
            return this.props.children;
        }
        return (
            <div className="erp-erro-queda">
                <p>A tela parou por um erro.</p>
                <button type="button" onClick={() => this.setState({ erro: null })}>tentar de novo</button>
            </div>
        );
    }
}
