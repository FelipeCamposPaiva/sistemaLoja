import { useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Search } from "lucide-react";

import { PREFERENCIAS, PREFERENCIAS_ABAS, abaPorRota } from "../../constants/preferencias";
import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/preferencias.css";

function textoBusca(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase();
}

function Selo({ texto, tom }) {
    if (!texto) {
        return null;
    }
    return <span className={`pref-selo${tom === "alerta" ? " is-alerta" : " is-info"}`}>{texto}</span>;
}

function Linha({ item }) {
    const miolo = (
        <>
            <span>{item.nome}</span>
            {item.ajuda ? (
                <span className="pref-ajuda" title={item.ajuda} aria-label={item.ajuda}>?</span>
            ) : null}
            <Selo texto={item.selo} tom={item.seloTom} />
        </>
    );
    if (!item.rota) {
        return <div className="pref-linha is-estatica">{miolo}</div>;
    }
    return (
        <Link className="pref-linha" to={item.rota}>
            {miolo}
        </Link>
    );
}

export default function Configuracoes() {
    const { pathname } = useLocation();
    const aba = abaPorRota(pathname);
    const [busca, setBusca] = useState("");
    const [rtcAberto, setRtcAberto] = useState(false);
    const termo = textoBusca(busca.trim());

    const resultados = useMemo(() => {
        if (!termo) {
            return null;
        }
        return PREFERENCIAS_ABAS.map((grupo) => ({
            ...grupo,
            itens: (PREFERENCIAS[grupo.id] || []).filter((item) => item.tipo !== "secao" && textoBusca(item.nome).includes(termo))
        })).filter((grupo) => grupo.itens.length);
    }, [termo]);

    if (!aba) {
        return <Navigate to="/preferencias_geral" replace />;
    }

    const itens = PREFERENCIAS[aba.id] || [];

    return (
        <div className="pref-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>início</Link>
                {aba.trilha.map((passo) => (
                    <span key={passo}>
                        <span>›</span>
                        <span>{passo}</span>
                    </span>
                ))}
                <span>›</span>
                <span>configurações</span>
            </nav>
            <h2>Configurações do Sistema ERP</h2>
            <label className="pref-busca">
                <span className="sr-only">Buscar configuração</span>
                <input
                    value={busca}
                    onChange={(evento) => setBusca(evento.target.value)}
                    placeholder="Busque pela funcionalidade ou dúvida"
                />
                <Search size={16} aria-hidden="true" />
            </label>
            <nav className="pref-abas" aria-label="Áreas de configuração">
                {PREFERENCIAS_ABAS.map((item) => (
                    <Link key={item.id} to={item.rota} className={item.id === aba.id && !termo ? "is-active" : ""}>
                        {item.nome}
                        {item.selo ? <Selo texto={item.selo} tom="info" /> : null}
                    </Link>
                ))}
            </nav>

            {termo ? (
                <div className="pref-lista">
                    {resultados.length ? resultados.map((grupo) => (
                        <section key={grupo.id}>
                            <h3 className="pref-secao">{grupo.nome}</h3>
                            {grupo.itens.map((item, indice) => (
                                <Linha key={`${grupo.id}-${indice}-${item.nome}`} item={item} />
                            ))}
                        </section>
                    )) : (
                        <p className="pref-vazio">Nenhuma configuração encontrada.</p>
                    )}
                </div>
            ) : (
                <div className="pref-lista">
                    {aba.id === "tributacao" ? (
                        <aside className="pref-rtc">
                            <p><strong>Configure sua empresa para a Reforma Tributária do Consumo (RTC)</strong></p>
                            <p>
                                Para ajudar você nessa transição, o cálculo de CBS e IBS fica desligado até a loja concluir o cadastro dos códigos de classificação.
                            </p>
                            <button type="button" onClick={() => setRtcAberto((aberto) => !aberto)}>
                                {rtcAberto ? "Ocultar detalhes" : "Veja mais detalhes"}
                            </button>
                            {rtcAberto ? (
                                <p>
                                    As opções de NF-e, NFC-e e NFS-e desta aba mostram o estado atual. O selo desabilitado indica que a emissão ainda usa a tributação vigente.
                                </p>
                            ) : null}
                        </aside>
                    ) : null}
                    {itens.map((item, indice) => (
                        item.tipo === "secao"
                            ? <h3 key={`${item.nome}-${indice}`} className="pref-secao">{item.nome}</h3>
                            : <Linha key={`${item.nome}-${indice}`} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
