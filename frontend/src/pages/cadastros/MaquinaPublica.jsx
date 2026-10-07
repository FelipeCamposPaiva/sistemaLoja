import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Printer } from "lucide-react";

import QrImagem from "../../components/QrImagem";
import { API_URL } from "../../services/api";
import "../../styles/pages/maquinas.css";

const STATUS = {
    operacao: "Em operação",
    manutencao: "Em manutenção",
    inativa: "Inativa"
};

const PERIODO = {
    diaria: "Diária",
    semanal: "Semanal",
    mensal: "Mensal",
    trimestral: "Trimestral"
};

function dataBr(valor) {
    if (!valor) {
        return "—";
    }
    const texto = Array.isArray(valor)
        ? `${valor[0]}-${String(valor[1]).padStart(2, "0")}-${String(valor[2]).padStart(2, "0")}`
        : String(valor).slice(0, 10);
    const [ano, mes, dia] = texto.split("-");
    if (!dia || !mes) {
        return String(valor);
    }
    return `${dia}/${mes}/${ano}`;
}

function dataHoraBr(valor) {
    if (!valor) {
        return "—";
    }
    const [data, hora] = String(valor).split("T");
    return hora ? `${dataBr(data)} ${hora.slice(0, 5)}` : dataBr(data);
}

function detalheCron(item) {
    const texto = String(item?.detalhe || "");
    if (item?.origem === "checklist") {
        const chave = texto.replace(/^Checklist\s+/, "");
        return `Checklist ${PERIODO[chave] || chave}`;
    }
    return texto;
}

function percent(item) {
    const cap = Number(item.capacidade || 0);
    if (cap <= 0) {
        return 0;
    }
    return Math.max(0, Math.min(100, Math.round((Number(item.atual || 0) / cap) * 100)));
}

export default function MaquinaPublica() {
    const { codigo } = useParams();
    const [params] = useSearchParams();
    const imprimir = params.get("imprimir") === "1";
    const impresso = useRef(false);
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState("");
    const [nome, setNome] = useState(() => localStorage.getItem("erp-manut-nome") || "");
    const [marcando, setMarcando] = useState(null);

    useEffect(() => {
        let vivo = true;
        setDados(null);
        setErro("");
        fetch(`${API_URL}/publico/maquinas/${encodeURIComponent(codigo)}`, { headers: { Accept: "application/json" } })
            .then(async (res) => {
                const corpo = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(corpo.mensagem || "Ficha não encontrada.");
                }
                return corpo;
            })
            .then((corpo) => vivo && setDados(corpo))
            .catch((falha) => vivo && setErro(falha.message || "Ficha não encontrada."));
        return () => {
            vivo = false;
        };
    }, [codigo]);

    useEffect(() => {
        if (!dados || !imprimir || impresso.current) {
            return undefined;
        }
        const timer = setTimeout(() => {
            impresso.current = true;
            window.print();
        }, 700);
        return () => clearTimeout(timer);
    }, [dados, imprimir]);

    async function marcar(item) {
        const responsavel = nome.trim();
        localStorage.setItem("erp-manut-nome", responsavel);
        setMarcando(item.id);
        setErro("");
        try {
            const res = await fetch(`${API_URL}/publico/maquinas/${encodeURIComponent(codigo)}/checklist/${item.id}`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ responsavel })
            });
            const corpo = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(corpo.mensagem || "Não foi possível marcar o item.");
            }
            setDados(corpo);
        } catch (falha) {
            setErro(falha.message || "Não foi possível marcar o item.");
        } finally {
            setMarcando(null);
        }
    }

    const link = `${window.location.origin}/m/${codigo}`;
    const niveis = (dados?.consumiveis || []).filter((item) => Number(item.capacidade) > 0 && item.nome);

    return (
        <main className="mq-pub">
            {!dados ? (
                <p className="mq-pub-estado">{erro || "Carregando ficha da máquina..."}</p>
            ) : (
                <article className="mq-pub-folha">
                    <header className="mq-pub-topo">
                        <div>
                            <p className="mq-pub-marca">Tem de Tudo · Ficha da máquina</p>
                            <h1>{dados.nome}</h1>
                            <p>{[dados.detalhe, dados.marca, dados.modelo].filter(Boolean).join(" · ")}</p>
                            <span className={`mq-st is-${dados.status || "operacao"}`}>
                                <i />
                                {STATUS[dados.status] || dados.status || "Em operação"}
                            </span>
                        </div>
                        <div className="mq-pub-qr">
                            <QrImagem valor={link} tamanho={168} alt={`QR Code de ${dados.nome}`} />
                            <small>Escaneie para abrir esta ficha</small>
                        </div>
                    </header>

                    {dados.fotoCapa ? <img className="mq-pub-foto" src={dados.fotoCapa} alt="" /> : null}

                    <dl className="mq-pub-dados">
                        <div><dt>Tipo</dt><dd>{dados.tipo || "—"}</dd></div>
                        <div><dt>Nº de série</dt><dd>{dados.numeroSerie || "—"}</dd></div>
                        <div><dt>Local</dt><dd>{dados.localizacao || "—"}</dd></div>
                        <div><dt>Horas de uso</dt><dd>{Number(dados.horasUso || 0).toLocaleString("pt-BR")}h</dd></div>
                        <div><dt>Último uso</dt><dd>{dataHoraBr(dados.ultimaUtilizacao)}</dd></div>
                        <div><dt>Garantia até</dt><dd>{dataBr(dados.garantiaAte)}</dd></div>
                        <div><dt>Próxima preventiva</dt><dd>{dataBr(dados.proxManutencao)}</dd></div>
                        <div><dt>Retorno</dt><dd>{dados.status === "manutencao" ? dataBr(dados.previsaoRetorno) : "—"}</dd></div>
                        <div><dt>Energia média</dt><dd>{Number(dados.energiaKwh || 0).toLocaleString("pt-BR")} kWh</dd></div>
                        <div><dt>Material médio</dt><dd>{Number(dados.materialMedia || 0).toLocaleString("pt-BR")} {dados.materialUnidade || ""}</dd></div>
                    </dl>

                    {niveis.length > 0 ? (
                        <section>
                            <h2>Nível dos consumíveis {dados.nivelMedio == null ? "" : `· média ${dados.nivelMedio}%`}</h2>
                            {niveis.map((item) => (
                                <div key={`${item.nome}-${item.cor}`} className="mq-ed-nivel">
                                    <span><i style={{ background: item.cor || "#6b7280" }} />{item.nome}</span>
                                    <div className="mq-ed-barra"><b style={{ width: `${percent(item)}%`, background: item.cor || "#16a34a" }} /></div>
                                    <em>{percent(item)}% · {Number(item.atual).toLocaleString("pt-BR")}{item.unidade} de {Number(item.capacidade).toLocaleString("pt-BR")}{item.unidade}</em>
                                </div>
                            ))}
                        </section>
                    ) : null}

                    {dados.observacao ? <p className="mq-pub-obs">{dados.observacao}</p> : null}

                    <section>
                        <h2>Cronograma de manutenção</h2>
                        {(dados.cronograma || []).length === 0 ? <p>Nenhuma data programada.</p> : (
                            <table className="mq-pub-tabela">
                                <thead>
                                    <tr><th>Data</th><th>Atividade</th><th>Detalhe</th></tr>
                                </thead>
                                <tbody>
                                    {(dados.cronograma || []).map((item, indice) => (
                                        <tr key={`${item.data}-${item.titulo}-${indice}`}>
                                            <td>{dataBr(item.data)}</td>
                                            <td>{item.titulo}</td>
                                            <td>{detalheCron(item)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>

                    <section>
                        <h2>Checklist de manutenção</h2>
                        <label className="mq-pub-nome">
                            Conferido por
                            <input value={nome} placeholder="Seu nome" onChange={(e) => setNome(e.target.value)} />
                        </label>
                        <ul className="mq-pub-check">
                            {(dados.checklist || []).map((item) => (
                                <li key={item.id} className={item.atrasado ? "is-atraso" : ""}>
                                    <span className="mq-pub-caixa" aria-hidden="true" />
                                    <span>
                                        <b>{item.titulo}</b>
                                        <small>
                                            {PERIODO[item.periodicidade] || "Mensal"}
                                            {item.ultimaExecucao ? ` · feito em ${dataBr(item.ultimaExecucao)}${item.responsavel ? ` por ${item.responsavel}` : ""}` : " · ainda não conferido"}
                                            {item.proxima ? ` · próxima ${dataBr(item.proxima)}` : ""}
                                        </small>
                                    </span>
                                    <button type="button" className="mq-pub-feito" disabled={marcando === item.id} onClick={() => marcar(item)}>
                                        {marcando === item.id ? "..." : "Feito hoje"}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {(dados.manutencoes || []).length > 0 ? (
                        <section>
                            <h2>Histórico</h2>
                            <ul className="mq-pub-hist">
                                {dados.manutencoes.map((item, indice) => (
                                    <li key={`${item.data}-${indice}`}>
                                        <b>{dataBr(item.data)}</b> {item.tipo} · {item.descricao} · {item.status}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    {erro ? <p className="mq-pub-erro">{erro}</p> : null}

                    <footer className="mq-pub-acoes">
                        <button type="button" onClick={() => window.print()}>
                            <Printer size={16} /> Imprimir ficha
                        </button>
                        <small>{link}</small>
                    </footer>
                </article>
            )}
        </main>
    );
}
