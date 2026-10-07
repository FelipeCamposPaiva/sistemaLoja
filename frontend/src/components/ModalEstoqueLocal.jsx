import { useEffect, useState } from "react";
import { ArrowRightLeft, MapPinOff, X } from "lucide-react";

import { catalogoLocalizacoes, sugerirLocalizacao } from "../services/localizacao";
import { lojasDeposito, saldosProduto, transferirEntreLocais } from "../services/estoqueLocais";

function qtd(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export default function ModalEstoqueLocal({
    produto,
    modo,
    prateleiraAtual,
    produtos = [],
    onFechar,
    onPrateleira,
    onAviso
}) {
    const [saldos, setSaldos] = useState([]);
    const [origem, setOrigem] = useState("");
    const [destino, setDestino] = useState("");
    const [quantidade, setQuantidade] = useState("1");
    const [prateleira, setPrateleira] = useState(prateleiraAtual || "");
    const [ocupado, setOcupado] = useState(false);
    const [erro, setErro] = useState("");

    const prateleiras = catalogoLocalizacoes(produtos);
    const lojas = lojasDeposito(saldos);

    useEffect(() => {
        let vivo = true;
        (async () => {
            try {
                const lista = await saldosProduto(produto);
                if (!vivo) {
                    return;
                }
                setSaldos(lista);
                const comSaldo = lista.find((l) => Number(l.quantidade) > 0 && l.tipo === "LOJA") || lista.find((l) => Number(l.quantidade) > 0);
                const outra = lista.find((l) => l.tipo === "LOJA" && String(l.id) !== String(comSaldo?.id));
                setOrigem(String(comSaldo?.id || lista[0]?.id || ""));
                setDestino(String(outra?.id || ""));
            } catch (falha) {
                if (vivo) {
                    setErro(falha.message || "Não foi possível ler os saldos.");
                }
            }
        })();
        return () => {
            vivo = false;
        };
    }, [produto]);

    async function confirmarLoja() {
        setErro("");
        setOcupado(true);
        try {
            const lista = await transferirEntreLocais(
                produto,
                Number(origem),
                Number(destino),
                quantidade,
                `Transferência instantânea de ${produto?.nome || "produto"}`
            );
            setSaldos(lista);
            onAviso?.(`Transferido ${qtd(quantidade)} para a loja de destino.`);
            onFechar();
        } catch (falha) {
            setErro(falha.message || "Não foi possível transferir.");
        } finally {
            setOcupado(false);
        }
    }

    const titulo = {
        ver: "Onde está o estoque",
        prateleira: "Prateleira",
        loja: "Transferência instantânea"
    }[modo] || "Estoque";

    return (
        <div className="loc-modal-overlay" onClick={onFechar}>
            <div className="loc-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <header>
                    <div>
                        <span>ESTOQUE POR LOCAL</span>
                        <h3>{titulo}</h3>
                        <p>{produto?.nome}</p>
                    </div>
                    <button type="button" onClick={onFechar} aria-label="Fechar">
                        <X size={16} />
                    </button>
                </header>

                {modo === "ver" || modo === "loja" ? (
                    <ul className="loc-saldos">
                        {saldos.map((local) => (
                            <li key={local.id}>
                                <span>{local.nome}</span>
                                <strong className={Number(local.quantidade) < 0 ? "is-neg" : ""}>{qtd(local.quantidade)}</strong>
                            </li>
                        ))}
                    </ul>
                ) : null}

                {modo === "prateleira" ? (
                    <div className="loc-modal-form">
                        <label>
                            Prateleira atual
                            <input value={prateleiraAtual || "—"} readOnly />
                        </label>
                        <label>
                            Nova prateleira
                            <input
                                list="locs-prateleira-modal"
                                value={prateleira}
                                onChange={(e) => setPrateleira(e.target.value)}
                                placeholder="Ex.: AR-02-B"
                            />
                            <datalist id="locs-prateleira-modal">
                                {prateleiras.map((item) => (
                                    <option key={item} value={item} />
                                ))}
                            </datalist>
                        </label>
                        <div className="loc-modal-acoes">
                            <button
                                type="button"
                                className="loc-btn"
                                onClick={() => setPrateleira(sugerirLocalizacao(produto))}
                            >
                                Sugerir pelo grupo
                            </button>
                            <button
                                type="button"
                                className="loc-btn"
                                onClick={() => onPrateleira("")}
                            >
                                <MapPinOff size={15} /> Não está mais nesta prateleira
                            </button>
                            <button
                                type="button"
                                className="loc-btn-pri"
                                disabled={!prateleira.trim() || prateleira.trim() === prateleiraAtual}
                                onClick={() => onPrateleira(prateleira.trim())}
                            >
                                Transferir de prateleira
                            </button>
                        </div>
                    </div>
                ) : null}

                {modo === "loja" ? (
                    <div className="loc-modal-form">
                        <label>
                            Origem
                            <select value={origem} onChange={(e) => setOrigem(e.target.value)}>
                                {saldos.map((local) => (
                                    <option key={local.id} value={local.id}>
                                        {local.nome} ({qtd(local.quantidade)})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Destino (loja)
                            <select value={destino} onChange={(e) => setDestino(e.target.value)}>
                                {(lojas.length ? lojas : saldos).filter((l) => String(l.id) !== String(origem)).map((local) => (
                                    <option key={local.id} value={local.id}>
                                        {local.nome}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Quantidade
                            <input
                                type="number"
                                min="0.01"
                                step="1"
                                value={quantidade}
                                onChange={(e) => setQuantidade(e.target.value)}
                            />
                        </label>
                        {erro ? <p className="loc-modal-erro">{erro}</p> : null}
                        <div className="loc-modal-acoes">
                            <button type="button" className="loc-btn" onClick={onFechar}>Cancelar</button>
                            <button type="button" className="loc-btn-pri" disabled={ocupado} onClick={confirmarLoja}>
                                <ArrowRightLeft size={15} /> Transferir agora
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
