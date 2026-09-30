import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import ROTAS from "../../constants/rotas";
import {
    ENTIDADES_AUDITORIA,
    camposDe,
    dataHoraLog,
    listarAuditoria,
    rotuloAcao
} from "../../services/auditoria.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/os.css";
import "../../styles/pages/auditoria.css";

function rotaDoLog(log) {
    if (log.entidade === "PRODUTO") {
        return `${ROTAS.PRODUTOS}#list`;
    }
    if (log.entidade === "CLIENTE") {
        return log.registroId ? `${ROTAS.CLIENTES}/${log.registroId}` : `${ROTAS.CLIENTES}#/`;
    }
    if (log.entidade === "OS") {
        return log.registroId ? `${ROTAS.ORDEM_SERVICO}#edit/${log.registroId}` : ROTAS.ORDEM_SERVICO;
    }
    if (log.entidade === "ESTOQUE") {
        return ROTAS.AUDITORIA_ESTOQUE;
    }
    if (log.entidade === "CAIXA") {
        return "/caixa";
    }
    if (log.entidade === "NOTA") {
        return `${ROTAS.NOTAS_ENTRADA}#list`;
    }
    if (log.entidade === "PEDIDO") {
        return ROTAS.COMPRAS;
    }
    return ROTAS.AUDITORIA;
}

export default function Auditoria() {
    const [lista, setLista] = useState([]);
    const [entidade, setEntidade] = useState("");
    const [busca, setBusca] = useState("");
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        let vivo = true;
        listarAuditoria({ entidade, q: busca })
            .then((dados) => {
                if (vivo) {
                    setLista(dados);
                    setAviso("");
                }
            })
            .catch(() => {
                if (vivo) {
                    setLista([]);
                    setAviso("Não foi possível ler o log. Reinicie o backend se as classes de auditoria acabaram de ser criadas.");
                }
            });
        return () => {
            vivo = false;
        };
    }, [entidade, busca]);

    const criadores = useMemo(() => {
        const mapa = new Map();
        lista.filter((l) => l.acao === "CRIAR").forEach((log) => {
            if (!mapa.has(`${log.entidade}-${log.registroId}`)) {
                mapa.set(`${log.entidade}-${log.registroId}`, log);
            }
        });
        return mapa;
    }, [lista]);

    return (
        <div className="os-page aud-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>configurações</span>
                <span>›</span>
                <span>auditoria</span>
            </nav>
            <div className="fer-head">
                <div>
                    <h2>Auditoria</h2>
                    <p className="idx-sub">Quem cadastrou, quem alterou, quando e o que mudou — produtos, clientes, OS, estoque, pedidos e caixa.</p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <Link className="prd-btn" to={ROTAS.AUDITORIA_ESTOQUE}>auditoria de estoque</Link>
            </div>

            <div className="os-toolbar">
                <label className="fer-search">
                    <Search size={15} />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Usuário, cadastro ou campo alterado"
                    />
                </label>
                <select value={entidade} onChange={(e) => setEntidade(e.target.value)}>
                    {ENTIDADES_AUDITORIA.map((e) => (
                        <option key={e.id || "todas"} value={e.id}>{e.nome}</option>
                    ))}
                </select>
            </div>

            <div className="os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th>Quando</th>
                            <th>Usuário</th>
                            <th>Ação</th>
                            <th>Cadastro</th>
                            <th>O que mudou</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="ctt-vazio">Nenhum evento ainda. Altere um produto ou cliente para gerar o primeiro log.</td>
                            </tr>
                        ) : lista.map((log) => (
                            <tr key={log.id}>
                                <td>{dataHoraLog(log.criadoEm)}</td>
                                <td>
                                    <strong>{log.usuarioNome || log.usuarioLogin || "sistema"}</strong>
                                    <small className="aud-login">{log.usuarioLogin}</small>
                                </td>
                                <td>{rotuloAcao(log.acao)}</td>
                                <td>
                                    <Link to={rotaDoLog(log)}>
                                        {log.entidade} · {log.registroNome || log.registroId || "—"}
                                    </Link>
                                    {log.acao !== "CRIAR" && criadores.get(`${log.entidade}-${log.registroId}`) ? (
                                        <small className="aud-login">
                                            criado por {criadores.get(`${log.entidade}-${log.registroId}`).usuarioNome}
                                        </small>
                                    ) : null}
                                </td>
                                <td>
                                    <ul className="aud-campos">
                                        {camposDe(log).slice(0, 6).map((c, i) => (
                                            <li key={`${log.id}-${i}`}>
                                                <em>{c.campo}</em>
                                                {c.de ? ` ${c.de} → ` : " "}
                                                {c.para}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
