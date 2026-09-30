import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { camposDe, dataHoraLog, listarAuditoria, rotuloAcao } from "../services/auditoria.service";
import ROTAS from "../constants/rotas";
import "../styles/pages/auditoria.css";

export default function HistoricoAuditoria({ entidade, registroId }) {
    const [lista, setLista] = useState([]);
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        if (!entidade || !registroId) {
            setLista([]);
            return;
        }
        let vivo = true;
        listarAuditoria({ entidade, registroId })
            .then((dados) => {
                if (vivo) {
                    setLista(dados);
                }
            })
            .catch(() => {
                if (vivo) {
                    setLista([]);
                    setAviso("Não foi possível ler o histórico. Confira se a API está no ar.");
                }
            });
        return () => {
            vivo = false;
        };
    }, [entidade, registroId]);

    if (!registroId) {
        return <p className="aud-hint">O histórico aparece depois do primeiro salvamento.</p>;
    }

    return (
        <div className="aud-ficha">
            {aviso ? <p className="prd-aviso">{aviso}</p> : null}
            {lista.length === 0 ? (
                <p className="aud-hint">Nenhuma alteração registrada neste cadastro ainda.</p>
            ) : (
                <ol className="aud-linha-tempo">
                    {lista.map((log) => (
                        <li key={log.id}>
                            <strong>{rotuloAcao(log.acao)}</strong>
                            <span>{dataHoraLog(log.criadoEm)} · {log.usuarioNome || log.usuarioLogin || "sistema"}</span>
                            <ul>
                                {camposDe(log).map((c, i) => (
                                    <li key={`${log.id}-${i}`}>
                                        <em>{c.campo}</em>
                                        {c.de ? <> de <code>{c.de}</code></> : null}
                                        {c.para ? <> para <code>{c.para}</code></> : null}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ol>
            )}
            <Link className="idx-text" to={ROTAS.AUDITORIA}>ver log completo do sistema</Link>
        </div>
    );
}
