import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileText } from "lucide-react";

import { atualizarOS, listarOS } from "../../../services/os.service";
import { moeda, nomesTecnicos } from "../../../constants/ordensServico";
import ROTAS from "../../../constants/rotas";
import { lerContatos } from "../../../constants/contatos";

import "../../../styles/layout/app-shell.css";
import "../../../styles/pages/indice.css";
import "../../../styles/pages/ferramentas.css";
import "../../../styles/pages/os.css";

export default function NfsOs() {
    const [params] = useSearchParams();
    const [lista, setLista] = useState([]);
    const [aviso, setAviso] = useState("");
    const contatoId = params.get("contato");
    const nomeContato = contatoId
        ? (lerContatos().find((item) => String(item.id) === String(contatoId))?.nome || "")
        : "";

    useEffect(() => {
        listarOS().then(setLista).catch(() => setLista([]));
    }, []);

    const prontas = useMemo(
        () => lista.filter((os) => {
            const pronta = ["PRONTO", "ENTREGUE", "FINALIZADA", "SERVICO_CONCLUIDO"].includes(String(os.status || "").toUpperCase()) || os.nfsEmitida;
            if (!pronta) {
                return false;
            }
            if (!contatoId) {
                return true;
            }
            return String(os.clienteId) === String(contatoId)
                || (nomeContato && String(os.cliente || "").toLowerCase() === nomeContato.toLowerCase());
        }),
        [lista, contatoId, nomeContato]
    );

    async function emitir(os) {
        try {
            await atualizarOS(os.id, { ...os, nfsEmitida: true });
            setLista((atual) => atual.map((item) => item.id === os.id ? { ...item, nfsEmitida: true } : item));
            setAviso(`NFS marcada na OS ${os.numero || os.id}.`);
        } catch (erro) {
            console.error(erro);
            setAviso("Não foi possível gravar a emissão da NFS.");
        }
    }

    return (
        <div className="os-page">
            <nav className="dash-crumb">
                <Link to="/index">início</Link>
                <span>›</span>
                <span>serviços</span>
                <span>›</span>
                <span>nota fiscal de serviço</span>
            </nav>
            <div className="fer-head">
                <div>
                    <h2>Nota fiscal de serviço</h2>
                    <p className="idx-sub">
                        {nomeContato ? `Notas do contato ${nomeContato}.` : "OS prontas para faturar, integradas ao caixa e ao dashboard."}
                    </p>
                    {aviso ? <p className="prd-aviso">{aviso}</p> : null}
                </div>
                <Link className="prd-btn prd-btn-primary" to={contatoId ? `${ROTAS.ORDEM_SERVICO}?contato=${contatoId}#add` : `${ROTAS.ORDEM_SERVICO}#add`}>nova OS</Link>
            </div>
            <div className="os-scroll">
                <table className="fer-table os-table">
                    <thead>
                        <tr>
                            <th>OS</th>
                            <th>Cliente</th>
                            <th>Técnicos</th>
                            <th>Pagamento</th>
                            <th className="is-num">Total</th>
                            <th>NFS</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {prontas.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="ctt-vazio">Nenhuma OS pronta para NFS. Finalize o workflow até Pronto ou Entregue.</td>
                            </tr>
                        ) : prontas.map((os) => (
                            <tr key={os.id}>
                                <td>
                                    <Link className="os-num" to={`${ROTAS.ORDEM_SERVICO}#edit/${os.id}`}>{os.numero || os.id}</Link>
                                </td>
                                <td>{os.cliente}</td>
                                <td>{nomesTecnicos(os) || "—"}</td>
                                <td>{os.formaPagamento}</td>
                                <td className="is-num">{moeda(os.valor)}</td>
                                <td>{os.nfsEmitida ? "emitida" : "pendente"}</td>
                                <td>
                                    <button type="button" className="idx-text" disabled={os.nfsEmitida} onClick={() => emitir(os)}>
                                        <FileText size={14} /> {os.nfsEmitida ? "já emitida" : "marcar NFS"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
