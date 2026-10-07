import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Boxes,
    CalendarClock,
    Droplets,
    FileText,
    History,
    Home,
    MapPin,
    Plus,
    Search,
    Printer,
    QrCode,
    Trash2,
    Wrench,
    X,
    Zap
} from "lucide-react";

import { GRUPOS_TIPO, LOCAIS_MAQUINA, STATUS_MAQUINA, perfilTipo, rotuloStatus } from "../../constants/maquinas";
import ROTAS from "../../constants/rotas";
import { listarClientes } from "../../services/clientes.service";
import QrImagem from "../../components/QrImagem";
import { API_URL } from "../../services/api";
import { buscarFichaMaquina, persistirFichaMaquina } from "../../services/maquina.service";
import { listarNotasEntrada } from "../../services/notasEntrada.service";

const ABAS = [
    { id: "geral", label: "Visão geral", icon: Home },
    { id: "manutencao", label: "Manutenção", icon: Wrench },
    { id: "consumo", label: "Consumo", icon: Zap },
    { id: "suprimentos", label: "Suprimentos / Peças", icon: Boxes },
    { id: "documentos", label: "Documentos", icon: FileText },
    { id: "historico", label: "Histórico", icon: History }
];

const TIPOS_MANUT = ["Preventiva", "Corretiva", "Troca de peça", "Limpeza", "Instalação"];
const STATUS_MANUT = ["Agendada", "Em andamento", "Concluída"];

function dataBr(valor) {
    if (!valor) {
        return "—";
    }
    const [ano, mes, dia] = String(valor).slice(0, 10).split("-");
    if (!dia) {
        return valor;
    }
    return `${dia}/${mes}/${ano}`;
}

function rotuloPeriodo(valor) {
    return { diaria: "Diária", semanal: "Semanal", mensal: "Mensal", trimestral: "Trimestral" }[valor] || "Mensal";
}

function dataHoraBr(valor) {
    if (!valor) {
        return "—";
    }
    const [data, hora] = String(valor).split("T");
    return hora ? `${dataBr(data)} ${hora.slice(0, 5)}` : dataBr(data);
}

function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseMoeda(texto) {
    const limpo = String(texto || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const n = Number(limpo);
    return Number.isFinite(n) ? n : 0;
}

function dinheiro(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function diasAte(iso) {
    if (!iso) {
        return null;
    }
    const alvo = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

function hojeIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mensagemErro(erro, fallback) {
    return erro?.response?.data?.mensagem || fallback;
}

function formularioDe(maquina) {
    return {
        nome: maquina?.nome || "",
        detalhe: maquina?.detalhe || "",
        tipo: maquina?.tipo || "Impressora",
        modelo: maquina?.modelo || "",
        marca: maquina?.marca || "",
        numeroSerie: maquina?.numeroSerie || "",
        localizacao: maquina?.localizacao || LOCAIS_MAQUINA[0],
        status: maquina?.status || "operacao",
        proxManutencao: maquina?.proxManutencao || "",
        previsaoRetorno: maquina?.previsaoRetorno || "",
        horasUso: maquina?.horasUso ?? 0,
        ultimaUtilizacao: maquina?.ultimaUtilizacao || "",
        bemId: maquina?.bemId || null,
        valorCompra: maquina?.valorCompra ?? 0,
        dataCompra: maquina?.dataCompra || "",
        fornecedor: maquina?.fornecedor || "",
        fornecedorId: maquina?.fornecedorId || null,
        notaEntradaId: maquina?.notaEntradaId || null,
        notaFiscal: maquina?.notaFiscal || "",
        garantiaAte: maquina?.garantiaAte || "",
        energiaKwh: maquina?.energiaKwh ?? 0,
        energiaValor: maquina?.energiaValor ?? 0,
        materialMedia: maquina?.materialMedia ?? 0,
        materialUnidade: maquina?.materialUnidade || "",
        materialValor: maquina?.materialValor ?? 0,
        observacao: maquina?.observacao || "",
        codigoPublico: maquina?.codigoPublico || ""
    };
}

function percent(item) {
    const cap = Number(item.capacidade || 0);
    if (cap <= 0) {
        return 0;
    }
    return Math.max(0, Math.min(100, Math.round((Number(item.atual || 0) / cap) * 100)));
}

function CampoMoeda({ valor, aoMudar }) {
    const [texto, setTexto] = useState(() => dinheiro(valor));
    useEffect(() => {
        setTexto(dinheiro(valor));
    }, [valor]);
    return (
        <input
            inputMode="decimal"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => {
                const n = parseMoeda(texto);
                aoMudar(n);
                setTexto(dinheiro(n));
            }}
        />
    );
}

export default function MaquinaEditor({ maquina, locais, marcas, online, fechar, aoSalvo, excluir, abrirOs }) {
    const [form, setForm] = useState(() => formularioDe(maquina));
    const [fotos, setFotos] = useState([]);
    const [fotosNovas, setFotosNovas] = useState([]);
    const [fotosRemovidas, setFotosRemovidas] = useState([]);
    const [fotoAtiva, setFotoAtiva] = useState(0);
    const [consumiveis, setConsumiveis] = useState([]);
    const [manutencoes, setManutencoes] = useState([]);
    const [manutRemovidas, setManutRemovidas] = useState([]);
    const [documentos, setDocumentos] = useState([]);
    const [docsNovos, setDocsNovos] = useState([]);
    const [docsRemovidos, setDocsRemovidos] = useState([]);
    const [vinculos, setVinculos] = useState({ nota: null, bem: null, ordens: [] });
    const [notas, setNotas] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [buscaNota, setBuscaNota] = useState(false);
    const [aba, setAba] = useState("geral");
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(Boolean(online && maquina?.id));
    const [checklist, setChecklist] = useState([]);
    const [nomeCheck, setNomeCheck] = useState(() => localStorage.getItem("erp-manut-nome") || "");
    const [marcando, setMarcando] = useState(null);

    const perfil = perfilTipo(form.tipo);

    useEffect(() => {
        function tecla(ev) {
            if (ev.key === "Escape") {
                fechar();
            }
        }
        document.addEventListener("keydown", tecla);
        return () => document.removeEventListener("keydown", tecla);
    }, [fechar]);

    useEffect(() => {
        let vivo = true;
        listarNotasEntrada().then((lista) => vivo && setNotas(lista)).catch(() => {});
        listarClientes()
            .then((lista) => {
                if (!vivo) {
                    return;
                }
                setFornecedores(lista.filter((c) => (c.tipos || []).some((t) => String(t).toLowerCase().includes("fornecedor"))));
            })
            .catch(() => {});
        if (!online || !maquina?.id) {
            setConsumiveis(Array.isArray(maquina?.consumiveis) ? maquina.consumiveis : []);
            setManutencoes(Array.isArray(maquina?.manutencoes) ? maquina.manutencoes : []);
            setCarregando(false);
            return undefined;
        }
        buscarFichaMaquina(maquina.id)
            .then((ficha) => {
                if (!vivo) {
                    return;
                }
                setForm(formularioDe(ficha.maquina));
                setFotos(ficha.fotos || []);
                setConsumiveis(ficha.consumiveis || []);
                setManutencoes(ficha.manutencoes || []);
                setDocumentos(ficha.documentos || []);
                setChecklist(ficha.checklist || []);
                setVinculos(ficha.vinculos || { nota: null, bem: null, ordens: [] });
            })
            .catch((falha) => vivo && setErro(mensagemErro(falha, "Não foi possível abrir a ficha.")))
            .finally(() => vivo && setCarregando(false));
        return () => {
            vivo = false;
        };
    }, [maquina, online]);

    const galeria = [
        ...fotos.map((foto) => ({ key: `s-${foto.id}`, src: foto.arquivo, servidor: foto })),
        ...fotosNovas.map((foto) => ({ key: foto.key, src: foto.preview, nova: foto }))
    ];
    const capa = galeria[Math.min(fotoAtiva, Math.max(galeria.length - 1, 0))] || null;

    const niveis = consumiveis.filter((item) => Number(item.capacidade) > 0 && String(item.nome || "").trim());
    const mediaNivel = niveis.length
        ? Math.round(niveis.reduce((soma, item) => soma + percent(item), 0) / niveis.length)
        : null;
    const dias = diasAte(form.previsaoRetorno);
    const emGarantia = form.garantiaAte && String(form.garantiaAte) >= hojeIso();

    const notasFiltradas = useMemo(() => {
        const termo = String(form.notaFiscal || "").toLowerCase();
        return notas
            .filter((nota) => !termo || `${nota.numero} ${nota.remetente}`.toLowerCase().includes(termo))
            .slice(0, 8);
    }, [notas, form.notaFiscal]);

    function abrirFichaQr(imprimir) {
        if (!form.codigoPublico) {
            return;
        }
        const url = `${window.location.origin}/m/${form.codigoPublico}${imprimir ? "?imprimir=1" : ""}`;
        window.open(url, "_blank", "noopener");
    }

    async function marcarChecklist(item) {
        if (!form.codigoPublico || !item?.id) {
            return;
        }
        const nome = nomeCheck.trim();
        localStorage.setItem("erp-manut-nome", nome);
        setMarcando(item.id);
        try {
            const res = await fetch(`${API_URL}/publico/maquinas/${form.codigoPublico}/checklist/${item.id}`, {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ responsavel: nome })
            });
            const corpo = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(corpo.mensagem || "Não foi possível marcar o item.");
            }
            setChecklist(corpo.checklist || []);
        } catch (falha) {
            setErro(falha.message || "Não foi possível marcar o item.");
        } finally {
            setMarcando(null);
        }
    }

    function alterar(campo, valor) {
        setForm((atual) => {
            const proximo = { ...atual, [campo]: valor };
            if (campo === "tipo" && !atual.materialUnidade) {
                proximo.materialUnidade = perfilTipo(valor).unidade;
            }
            if (campo === "fornecedor") {
                const achou = fornecedores.find((c) => c.nome === valor || c.fantasia === valor);
                proximo.fornecedorId = achou?.id || null;
            }
            return proximo;
        });
    }

    function escolherNota(nota) {
        setForm((atual) => ({
            ...atual,
            notaEntradaId: nota.id,
            notaFiscal: nota.numero || atual.notaFiscal,
            dataCompra: atual.dataCompra || nota.dataEntrada || nota.dataEmissao || "",
            fornecedor: atual.fornecedor || nota.remetente || "",
            fornecedorId: atual.fornecedorId || nota.fornecedorId || null,
            valorCompra: Number(atual.valorCompra) > 0 ? atual.valorCompra : Number(nota.valor || 0)
        }));
        setBuscaNota(false);
    }

    function adicionarFotos(lista) {
        const novas = [...lista].filter((arquivo) => arquivo.type.startsWith("image/")).map((arquivo) => ({
            key: `${arquivo.name}-${arquivo.size}-${Math.random()}`,
            file: arquivo,
            preview: URL.createObjectURL(arquivo)
        }));
        setFotosNovas((atual) => [...atual, ...novas]);
    }

    function removerCapa() {
        if (!capa) {
            return;
        }
        if (capa.servidor) {
            setFotosRemovidas((atual) => [...atual, capa.servidor.id]);
            setFotos((atual) => atual.filter((foto) => foto.id !== capa.servidor.id));
        } else if (capa.nova) {
            URL.revokeObjectURL(capa.nova.preview);
            setFotosNovas((atual) => atual.filter((foto) => foto.key !== capa.nova.key));
        }
        setFotoAtiva(0);
    }

    function sugerirNiveis() {
        if (perfil.rotulo === "resina") {
            setConsumiveis([
                { nome: "Resina cinza", atual: 0, capacidade: 1000, unidade: "ml", cor: "#6b7280" },
                { nome: "Resina preta", atual: 0, capacidade: 1000, unidade: "ml", cor: "#111827" }
            ]);
            return;
        }
        if (perfil.rotulo === "filamento") {
            setConsumiveis([{ nome: "Filamento", atual: 0, capacidade: 1000, unidade: "g", cor: "#ff2f92" }]);
            return;
        }
        if (perfil.rotulo === "tinta") {
            setConsumiveis([
                { nome: "Ciano", atual: 0, capacidade: 70, unidade: "ml", cor: "#06b6d4" },
                { nome: "Magenta", atual: 0, capacidade: 70, unidade: "ml", cor: "#ff2f92" },
                { nome: "Amarelo", atual: 0, capacidade: 70, unidade: "ml", cor: "#eab308" },
                { nome: "Preto", atual: 0, capacidade: 70, unidade: "ml", cor: "#111827" }
            ]);
            return;
        }
        setConsumiveis([{ nome: "Peça reserva", atual: 1, capacidade: 1, unidade: "un", cor: "#9d174d" }]);
    }

    function atualizarManut(indice, campo, valor) {
        setManutencoes((atual) => atual.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)));
    }

    function removerManut(indice) {
        setManutencoes((atual) => {
            const item = atual[indice];
            if (item?.id) {
                setManutRemovidas((ids) => [...ids, item.id]);
            }
            return atual.filter((_, i) => i !== indice);
        });
    }

    function incluirManutencao() {
        setManutencoes((atual) => [
            {
                data: hojeIso(),
                tipo: "Corretiva",
                descricao: "",
                responsavel: "",
                custo: 0,
                status: "Em andamento",
                previsaoRetorno: form.previsaoRetorno || "",
                peca: "",
                fotos: [],
                fotosNovas: [],
                fotosRemovidas: []
            },
            ...atual
        ]);
        setAba("manutencao");
    }

    async function enviar(e) {
        e.preventDefault();
        if (!form.nome.trim()) {
            setErro("Informe o nome da máquina.");
            return;
        }
        if (!form.tipo) {
            setErro("Informe o tipo.");
            return;
        }
        if (!form.localizacao) {
            setErro("Informe a localização.");
            return;
        }
        if (form.status === "manutencao" && !form.previsaoRetorno) {
            setErro("Com status em manutenção, informe a previsão de retorno.");
            setAba("geral");
            return;
        }
        const regs = manutencoes.filter((item) => String(item.descricao || "").trim() || (item.fotosNovas || []).length || (item.fotos || []).length);
        if (regs.some((item) => !String(item.descricao || "").trim())) {
            setErro("Descreva a manutenção antes de anexar as fotos.");
            setAba("manutencao");
            return;
        }
        setSalvando(true);
        setErro("");
        const pacote = {
            consumiveis,
            fotosNovas: fotosNovas.map((foto) => foto.file),
            fotosRemovidas,
            manutencoes: regs.map((item) => ({
                ...item,
                fotosNovas: (item.fotosNovas || []).map((foto) => foto.file || foto)
            })),
            manutencoesRemovidas: manutRemovidas,
            documentosNovos: docsNovos,
            documentosRemovidos: docsRemovidos
        };
        try {
            if (online) {
                await persistirFichaMaquina({ ...form, id: maquina?.id || null }, pacote);
                await aoSalvo();
            } else {
                await aoSalvo({
                    ...form,
                    consumiveis,
                    manutencoes: regs.map((item) => ({ ...item, fotosNovas: [], fotos: item.fotos || [] }))
                });
            }
        } catch (falha) {
            setErro(mensagemErro(falha, "Não foi possível salvar a máquina."));
        } finally {
            setSalvando(false);
        }
    }

    return (
        <div className="mq-ed-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(); }}>
            <form className="mq-ed" onSubmit={enviar}>
                <header className="mq-ed-head">
                    <div className="mq-ed-title">
                        <span className="mq-titulo-ico" aria-hidden><Home size={18} /></span>
                        <div>
                            <h2>{maquina?.id ? "Editar máquina" : "Nova máquina"}</h2>
                            <p>Cadastre e gerencie os detalhes do equipamento.</p>
                        </div>
                    </div>
                    <button type="button" className="mq-ed-x" onClick={fechar} aria-label="Fechar">
                        <X size={18} />
                    </button>
                </header>

                {!online ? <p className="mq-ed-erro">O servidor não respondeu. Os campos ficam neste navegador; fotos e anexos entram quando o banco estiver no ar.</p> : null}
                {erro ? <p className="mq-ed-erro">{erro}</p> : null}
                {carregando ? <p className="mq-ed-load">Carregando a ficha da máquina...</p> : null}

                <div className="mq-ed-topo">
                    <section className="mq-ed-galeria">
                        <h3>Imagem do equipamento</h3>
                        <div className="mq-ed-capa">
                            {capa ? <img src={capa.src} alt="" /> : <span>Adicione a foto da máquina</span>}
                            {capa ? (
                                <button type="button" className="mq-ed-lixo" onClick={removerCapa} aria-label="Remover foto">
                                    <Trash2 size={14} />
                                </button>
                            ) : null}
                        </div>
                        <div className="mq-ed-thumbs">
                            {galeria.map((foto, indice) => (
                                <button
                                    key={foto.key}
                                    type="button"
                                    className={indice === fotoAtiva ? "is-on" : ""}
                                    onClick={() => setFotoAtiva(indice)}
                                >
                                    <img src={foto.src} alt="" />
                                </button>
                            ))}
                            <label className="mq-ed-add">
                                <Plus size={16} />
                                Adicionar foto
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    multiple
                                    onChange={(e) => {
                                        adicionarFotos(e.target.files || []);
                                        e.target.value = "";
                                    }}
                                />
                            </label>
                        </div>
                    </section>

                    <section className="mq-ed-campos">
                        <label className="is-full">
                            Nome da máquina *
                            <input autoFocus value={form.nome} onChange={(e) => alterar("nome", e.target.value)} placeholder="Ex.: Creality MAGE S 14K" />
                        </label>
                        <label className="is-full">
                            Descrição
                            <textarea rows={2} value={form.detalhe} onChange={(e) => alterar("detalhe", e.target.value)} placeholder="Para que esta máquina é usada na produção" />
                        </label>
                        <label>
                            Tipo *
                            <select value={form.tipo} onChange={(e) => alterar("tipo", e.target.value)}>
                                {form.tipo && !GRUPOS_TIPO.some((g) => g.itens.includes(form.tipo)) ? (
                                    <option value={form.tipo}>{form.tipo}</option>
                                ) : null}
                                {GRUPOS_TIPO.map((grupo) => (
                                    <optgroup key={grupo.grupo} label={grupo.grupo}>
                                        {grupo.itens.map((item) => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>
                        <label>
                            Modelo
                            <input value={form.modelo} onChange={(e) => alterar("modelo", e.target.value)} />
                        </label>
                        <label>
                            Marca
                            <input list="mq-ed-marcas" value={form.marca} onChange={(e) => alterar("marca", e.target.value)} placeholder="Marca cadastrada" />
                            <datalist id="mq-ed-marcas">
                                {marcas.map((nome) => <option key={nome} value={nome} />)}
                            </datalist>
                        </label>
                        <label>
                            Número de série
                            <input value={form.numeroSerie} onChange={(e) => alterar("numeroSerie", e.target.value)} placeholder="Opcional" />
                        </label>
                        <label>
                            Localização *
                            <select value={form.localizacao} onChange={(e) => alterar("localizacao", e.target.value)}>
                                {(locais?.length ? locais : LOCAIS_MAQUINA).map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Status *
                            <select value={form.status} onChange={(e) => alterar("status", e.target.value)}>
                                {STATUS_MAQUINA.map((item) => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                            </select>
                        </label>
                        {form.status === "manutencao" ? (
                            <label className="is-full mq-ed-retorno">
                                Previsão de retorno *
                                <input type="date" value={form.previsaoRetorno} onChange={(e) => alterar("previsaoRetorno", e.target.value)} />
                            </label>
                        ) : null}
                        <label className="is-full">
                            {perfil.peca ? "Compatível com" : "Observação"}
                            <input
                                value={form.observacao}
                                onChange={(e) => alterar("observacao", e.target.value)}
                                placeholder={perfil.peca ? "Ex.: Epson L1800, cabeça da L3150" : "Anotação interna do equipamento"}
                            />
                        </label>
                    </section>

                    <aside className="mq-ed-compra">
                        <h3>Informações de compra</h3>
                        <label>
                            Nota fiscal
                            <span className="mq-ed-nota">
                                <input
                                    value={form.notaFiscal}
                                    placeholder="NF-001234"
                                    onFocus={() => setBuscaNota(true)}
                                    onChange={(e) => {
                                        alterar("notaFiscal", e.target.value);
                                        alterar("notaEntradaId", null);
                                        setBuscaNota(true);
                                    }}
                                />
                                <button type="button" aria-label="Buscar nota" onClick={() => setBuscaNota((v) => !v)}>
                                    <Search size={14} />
                                </button>
                            </span>
                            {buscaNota ? (
                                <div className="mq-ed-notas">
                                    {notasFiltradas.length === 0 ? <p>Nenhuma nota encontrada.</p> : notasFiltradas.map((nota) => (
                                        <button key={nota.id} type="button" onClick={() => escolherNota(nota)}>
                                            <strong>{nota.numero || `Nota #${nota.id}`}</strong>
                                            <small>{nota.remetente || "Sem fornecedor"} · {moeda(nota.valor)}</small>
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </label>
                        {form.notaEntradaId ? (
                            <Link className="mq-ed-link" to={ROTAS.NOTAS_ENTRADA}>Abrir nota de entrada</Link>
                        ) : null}
                        <label>
                            Data da compra
                            <input type="date" value={form.dataCompra} onChange={(e) => alterar("dataCompra", e.target.value)} />
                        </label>
                        <label>
                            Fornecedor
                            <input
                                list="mq-ed-forn"
                                value={form.fornecedor}
                                onChange={(e) => alterar("fornecedor", e.target.value)}
                                placeholder="Fornecedor do equipamento"
                            />
                            <datalist id="mq-ed-forn">
                                {fornecedores.map((c) => <option key={c.id} value={c.fantasia || c.nome} />)}
                            </datalist>
                        </label>
                        <label>
                            Valor de compra (R$)
                            <CampoMoeda valor={form.valorCompra} aoMudar={(n) => alterar("valorCompra", n)} />
                        </label>
                        <label>
                            Garantia até
                            <input type="date" value={form.garantiaAte} onChange={(e) => alterar("garantiaAte", e.target.value)} />
                        </label>
                    </aside>
                </div>

                <nav className="mq-ed-abas" aria-label="Seções da máquina">
                    {ABAS.map((item) => {
                        const Icone = item.icon;
                        const extra = item.id === "manutencao" ? ` (${manutencoes.length})` : item.id === "documentos" ? ` (${documentos.length + docsNovos.length})` : "";
                        return (
                            <button key={item.id} type="button" className={aba === item.id ? "is-on" : ""} onClick={() => setAba(item.id)}>
                                <Icone size={15} />
                                {item.label}{extra}
                            </button>
                        );
                    })}
                </nav>

                {aba === "geral" ? (
                    <div className="mq-ed-aba">
                        <div className="mq-ed-kpis">
                            <article className="mq-ed-kpi">
                                <header><Wrench size={16} /> Status e operação</header>
                                <span className={`mq-st is-${form.status}`}><i />{rotuloStatus(form.status)}</span>
                                <p>{form.status === "manutencao" ? "Manutenção em andamento." : form.status === "inativa" ? "Fora de operação." : "Equipamento disponível."}</p>
                                {form.status === "manutencao" ? (
                                    <div className="mq-ed-prazo">
                                        <CalendarClock size={16} />
                                        <div>
                                            <strong>Previsão de retorno</strong>
                                            <b>{dataBr(form.previsaoRetorno)}</b>
                                            <small>{dias == null ? "Informe a data" : dias < 0 ? `Prazo vencido há ${Math.abs(dias)} dia(s)` : dias === 0 ? "Retorno previsto para hoje" : `${dias} dia(s) restantes`}</small>
                                        </div>
                                    </div>
                                ) : null}
                                <dl>
                                    <div><dt>Horas de uso total</dt><dd>{Number(form.horasUso || 0).toLocaleString("pt-BR")}h</dd></div>
                                    <div><dt>Última utilização</dt><dd>{dataHoraBr(form.ultimaUtilizacao)}</dd></div>
                                </dl>
                            </article>

                            {perfil.energia ? (
                                <article className="mq-ed-kpi">
                                    <header><Zap size={16} /> Consumo de energia</header>
                                    <strong>{Number(form.energiaKwh) > 0 ? `${Number(form.energiaKwh).toLocaleString("pt-BR")} kWh` : "Sem média lançada"}</strong>
                                    <small>Média mensal</small>
                                    <em>{Number(form.energiaValor) > 0 ? `${moeda(form.energiaValor)}/mês` : "Informe o valor na aba Consumo"}</em>
                                </article>
                            ) : null}

                            {perfil.consumo ? (
                                <article className="mq-ed-kpi">
                                    <header><Droplets size={16} /> {perfil.titulo}</header>
                                    <strong>{Number(form.materialMedia) > 0 ? `${Number(form.materialMedia).toLocaleString("pt-BR")} ${form.materialUnidade || perfil.unidade}` : "Sem média lançada"}</strong>
                                    <small>Média mensal de {perfil.rotulo}</small>
                                    <em>{Number(form.materialValor) > 0 ? `${moeda(form.materialValor)}/mês` : "Lance a média na aba Consumo"}</em>
                                    {mediaNivel != null ? <p>Nível médio atual: {mediaNivel}%</p> : null}
                                </article>
                            ) : (
                                <article className="mq-ed-kpi">
                                    <header><Boxes size={16} /> {perfil.peca ? "Peça avulsa" : "Uso do equipamento"}</header>
                                    <p>{perfil.peca ? "Este cadastro é uma peça. Informe com qual impressora ela é compatível." : "Este tipo não consome tinta. A energia e as horas ficam na aba Consumo."}</p>
                                    {form.observacao ? <strong>{form.observacao}</strong> : null}
                                </article>
                            )}

                            <article className="mq-ed-kpi">
                                <header><Droplets size={16} /> Nível atual de consumíveis</header>
                                <small>Última leitura na ficha</small>
                                {niveis.length === 0 ? <p>Informe o nível real na aba Suprimentos / Peças.</p> : niveis.map((item) => (
                                    <div key={`${item.nome}-${item.cor}`} className="mq-ed-nivel">
                                        <span><i style={{ background: item.cor || "#6b7280" }} />{item.nome}</span>
                                        <div className="mq-ed-barra"><b style={{ width: `${percent(item)}%`, background: item.cor || "#16a34a" }} /></div>
                                        <em>{Number(item.atual).toLocaleString("pt-BR")}{item.unidade} de {Number(item.capacidade).toLocaleString("pt-BR")}{item.unidade} · {percent(item)}%</em>
                                    </div>
                                ))}
                                {mediaNivel != null ? <p>Média do nível: <strong>{mediaNivel}%</strong></p> : null}
                            </article>
                        </div>

                        <div className="mq-ed-rapidas">
                            <article><span>Valor de compra</span><strong>{moeda(form.valorCompra)}</strong></article>
                            <article>
                                <span>Garantia até</span>
                                <strong>{dataBr(form.garantiaAte)}</strong>
                                {form.garantiaAte ? <small className={emGarantia ? "is-ok" : ""}>{emGarantia ? "Em garantia" : "Garantia vencida"}</small> : null}
                            </article>
                            <article><MapPin size={14} /><span>Localização</span><strong>{form.localizacao || "—"}</strong></article>
                            <article><span>Horas de uso</span><strong>{Number(form.horasUso || 0).toLocaleString("pt-BR")}h</strong></article>
                            <article><span>Tipo</span><strong>{form.tipo}</strong></article>
                            <article><span>Nº de série</span><strong>{form.numeroSerie || "—"}</strong></article>
                        </div>
                    </div>
                ) : null}

                {aba === "manutencao" ? (
                    <div className="mq-ed-aba">
                        <div className="mq-ed-aba-head">
                            <div>
                                <h3>Registro de manutenção</h3>
                                <p>Cada registro aceita fotos do serviço, da peça trocada e do equipamento.</p>
                            </div>
                            <button type="button" className="mq-ed-btn mq-ed-btn-primary" onClick={incluirManutencao}>
                                <Plus size={15} /> Registrar manutenção
                            </button>
                        </div>
                        <label className="mq-ed-inline">
                            Próxima preventiva
                            <input type="date" value={form.proxManutencao} onChange={(e) => alterar("proxManutencao", e.target.value)} />
                        </label>
                        <section className="mq-ed-qr">
                            <div>
                                <h3><QrCode size={16} /> Ficha, cronograma e checklist</h3>
                                <p>O QR abre a ficha da máquina no celular, com o cronograma e o checklist para conferir no chão de fábrica.</p>
                                {form.codigoPublico ? (
                                    <QrImagem valor={`${window.location.origin}/m/${form.codigoPublico}`} tamanho={148} alt={`QR Code de ${form.nome || "máquina"}`} />
                                ) : (
                                    <p className="mq-ed-vazio">Salve a máquina para gerar o QR Code.</p>
                                )}
                            </div>
                            <div className="mq-ed-check">
                                <header>
                                    <strong>Checklist de manutenção</strong>
                                    <input
                                        value={nomeCheck}
                                        placeholder="Seu nome"
                                        onChange={(e) => setNomeCheck(e.target.value)}
                                    />
                                </header>
                                {checklist.length === 0 ? <p className="mq-ed-vazio">Nenhum item no checklist.</p> : (
                                    <ul>
                                        {checklist.map((item) => (
                                            <li key={item.id} className={item.atrasado ? "is-atraso" : ""}>
                                                <span>
                                                    <b>{item.titulo}</b>
                                                    <small>
                                                        {rotuloPeriodo(item.periodicidade)}
                                                        {item.ultimaExecucao ? ` · feito em ${dataBr(item.ultimaExecucao)}${item.responsavel ? ` por ${item.responsavel}` : ""}` : " · ainda não conferido"}
                                                        {item.proxima ? ` · próxima ${dataBr(item.proxima)}` : ""}
                                                    </small>
                                                </span>
                                                <button type="button" disabled={marcando === item.id} onClick={() => marcarChecklist(item)}>
                                                    {marcando === item.id ? "..." : "Feito hoje"}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                        {manutencoes.length === 0 ? <p className="mq-ed-vazio">Nenhum registro ainda.</p> : null}
                        {manutencoes.map((item, indice) => (
                            <article key={item.id || `novo-${indice}`} className="mq-ed-reg">
                                <div className="mq-ed-reg-grid">
                                    <label>Data<input type="date" value={item.data || ""} onChange={(e) => atualizarManut(indice, "data", e.target.value)} /></label>
                                    <label>Tipo
                                        <select value={item.tipo} onChange={(e) => atualizarManut(indice, "tipo", e.target.value)}>
                                            {TIPOS_MANUT.map((tipo) => <option key={tipo}>{tipo}</option>)}
                                        </select>
                                    </label>
                                    <label>Status
                                        <select value={item.status} onChange={(e) => atualizarManut(indice, "status", e.target.value)}>
                                            {STATUS_MANUT.map((st) => <option key={st}>{st}</option>)}
                                        </select>
                                    </label>
                                    <label>Previsão
                                        <input type="date" value={item.previsaoRetorno || ""} onChange={(e) => atualizarManut(indice, "previsaoRetorno", e.target.value)} />
                                    </label>
                                    <label>Responsável<input value={item.responsavel || ""} onChange={(e) => atualizarManut(indice, "responsavel", e.target.value)} /></label>
                                    <label>Peça<input value={item.peca || ""} onChange={(e) => atualizarManut(indice, "peca", e.target.value)} placeholder="Peça trocada" /></label>
                                    <label>Custo (R$)
                                        <CampoMoeda valor={item.custo} aoMudar={(n) => atualizarManut(indice, "custo", n)} />
                                    </label>
                                    <label className="is-full">Descrição
                                        <textarea rows={2} value={item.descricao || ""} onChange={(e) => atualizarManut(indice, "descricao", e.target.value)} />
                                    </label>
                                </div>
                                <div className="mq-ed-thumbs">
                                    {(item.fotos || []).map((foto) => (
                                        <span key={foto.id} className="mq-ed-mini">
                                            <img src={foto.arquivo} alt="" />
                                            <button
                                                type="button"
                                                aria-label="Remover foto"
                                                onClick={() => setManutencoes((atual) => atual.map((reg, i) => (i === indice
                                                    ? { ...reg, fotos: (reg.fotos || []).filter((f) => f.id !== foto.id), fotosRemovidas: [...(reg.fotosRemovidas || []), foto.id] }
                                                    : reg)))}
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    {(item.fotosNovas || []).map((foto) => (
                                        <span key={foto.key} className="mq-ed-mini">
                                            <img src={foto.preview} alt="" />
                                        </span>
                                    ))}
                                    <label className="mq-ed-add is-mini">
                                        <Plus size={14} /> Foto
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => {
                                                const novas = [...(e.target.files || [])].map((arquivo) => ({
                                                    key: `${arquivo.name}-${Math.random()}`,
                                                    file: arquivo,
                                                    preview: URL.createObjectURL(arquivo)
                                                }));
                                                setManutencoes((atual) => atual.map((reg, i) => i === indice ? { ...reg, fotosNovas: [...(reg.fotosNovas || []), ...novas] } : reg));
                                                e.target.value = "";
                                            }}
                                        />
                                    </label>
                                </div>
                                <button type="button" className="mq-ed-btn mq-ed-btn-danger" onClick={() => removerManut(indice)}>
                                    <Trash2 size={14} /> Excluir registro
                                </button>
                            </article>
                        ))}
                    </div>
                ) : null}

                {aba === "consumo" ? (
                    <div className="mq-ed-aba mq-ed-form2">
                        <label>Horas de uso<input type="number" min="0" value={form.horasUso} onChange={(e) => alterar("horasUso", e.target.value)} /></label>
                        <label>Última utilização<input type="datetime-local" value={form.ultimaUtilizacao} onChange={(e) => alterar("ultimaUtilizacao", e.target.value)} /></label>
                        {perfil.energia ? (
                            <>
                                <label>Média mensal de energia (kWh)<input type="number" min="0" step="0.1" value={form.energiaKwh} onChange={(e) => alterar("energiaKwh", e.target.value)} /></label>
                                <label>Custo médio de energia (R$)<CampoMoeda valor={form.energiaValor} aoMudar={(n) => alterar("energiaValor", n)} /></label>
                            </>
                        ) : null}
                        {perfil.consumo ? (
                            <>
                                <label>Média mensal de {perfil.rotulo} ({form.materialUnidade || perfil.unidade})
                                    <input type="number" min="0" step="0.1" value={form.materialMedia} onChange={(e) => alterar("materialMedia", e.target.value)} />
                                </label>
                                <label>Unidade
                                    <select value={form.materialUnidade || perfil.unidade} onChange={(e) => alterar("materialUnidade", e.target.value)}>
                                        {["ml", "l", "g", "kg", "un"].map((u) => <option key={u}>{u}</option>)}
                                    </select>
                                </label>
                                <label>Custo médio do material (R$)<CampoMoeda valor={form.materialValor} aoMudar={(n) => alterar("materialValor", n)} /></label>
                                <p className="mq-ed-vazio">A média do nível sai da leitura real: {mediaNivel == null ? "ainda sem níveis lançados" : `${mediaNivel}%`}.</p>
                            </>
                        ) : (
                            <p className="mq-ed-vazio">Este tipo não acompanha gasto de tinta. Peças e suprimentos ficam na aba ao lado.</p>
                        )}
                    </div>
                ) : null}

                {aba === "suprimentos" ? (
                    <div className="mq-ed-aba">
                        <div className="mq-ed-aba-head">
                            <div>
                                <h3>{perfil.consumo ? `Nível real de ${perfil.rotulo}` : "Peças e suprimentos"}</h3>
                                <p>{perfil.consumo ? "Informe quanto ainda há em cada tanque, cartucho ou reservatório." : "Quantidade em mãos e a cor ou identificação da peça."}</p>
                            </div>
                            <div className="mq-ed-botoes">
                                <button type="button" className="mq-ed-btn" onClick={sugerirNiveis}>Sugerir níveis</button>
                                <button type="button" className="mq-ed-btn mq-ed-btn-primary" onClick={() => setConsumiveis((atual) => [...atual, { nome: "", atual: 0, capacidade: perfil.rotulo === "tinta" ? 70 : 1000, unidade: perfil.unidade, cor: "#6b7280" }])}>
                                    <Plus size={14} /> Adicionar
                                </button>
                            </div>
                        </div>
                        {consumiveis.length === 0 ? <p className="mq-ed-vazio">Nenhum nível lançado.</p> : null}
                        {consumiveis.map((item, indice) => (
                            <div key={`${item.id || "c"}-${indice}`} className="mq-ed-cons">
                                <input value={item.nome} placeholder="Nome" onChange={(e) => setConsumiveis((atual) => atual.map((c, i) => i === indice ? { ...c, nome: e.target.value } : c))} />
                                <input type="number" min="0" step="0.1" value={item.atual} aria-label="Nível atual" onChange={(e) => setConsumiveis((atual) => atual.map((c, i) => i === indice ? { ...c, atual: e.target.value } : c))} />
                                <input type="number" min="0" step="0.1" value={item.capacidade} aria-label="Capacidade" onChange={(e) => setConsumiveis((atual) => atual.map((c, i) => i === indice ? { ...c, capacidade: e.target.value } : c))} />
                                <select value={item.unidade} aria-label="Unidade" onChange={(e) => setConsumiveis((atual) => atual.map((c, i) => i === indice ? { ...c, unidade: e.target.value } : c))}>
                                    {["ml", "l", "g", "kg", "un"].map((u) => <option key={u}>{u}</option>)}
                                </select>
                                <input type="color" value={item.cor || "#6b7280"} aria-label="Cor" onChange={(e) => setConsumiveis((atual) => atual.map((c, i) => i === indice ? { ...c, cor: e.target.value } : c))} />
                                <div className="mq-ed-barra"><b style={{ width: `${percent(item)}%`, background: item.cor || "#16a34a" }} /></div>
                                <button type="button" className="mq-ed-btn mq-ed-btn-danger" onClick={() => setConsumiveis((atual) => atual.filter((_, i) => i !== indice))} aria-label="Remover">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}

                {aba === "documentos" ? (
                    <div className="mq-ed-aba">
                        <div className="mq-ed-aba-head">
                            <div>
                                <h3>Documentos</h3>
                                <p>Manual, nota fiscal digital e certificado de garantia.</p>
                            </div>
                            <label className="mq-ed-btn mq-ed-btn-primary">
                                <Plus size={15} /> Anexar
                                <input
                                    type="file"
                                    accept="application/pdf,image/*"
                                    multiple
                                    hidden
                                    onChange={(e) => {
                                        setDocsNovos((atual) => [...atual, ...e.target.files]);
                                        e.target.value = "";
                                    }}
                                />
                            </label>
                        </div>
                        {documentos.length + docsNovos.length === 0 ? <p className="mq-ed-vazio">Nenhum anexo. A nota de compra continua ligada no painel ao lado.</p> : null}
                        <ul className="mq-ed-docs">
                            {documentos.map((doc) => (
                                <li key={doc.id}>
                                    <a href={doc.arquivo} target="_blank" rel="noreferrer">{doc.nome || "Documento"}</a>
                                    <button type="button" onClick={() => { setDocsRemovidos((atual) => [...atual, doc.id]); setDocumentos((atual) => atual.filter((item) => item.id !== doc.id)); }}>remover</button>
                                </li>
                            ))}
                            {docsNovos.map((arquivo, indice) => (
                                <li key={`${arquivo.name}-${indice}`}>
                                    <span>{arquivo.name}</span>
                                    <button type="button" onClick={() => setDocsNovos((atual) => atual.filter((_, i) => i !== indice))}>remover</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                {aba === "historico" ? (
                    <div className="mq-ed-aba">
                        <div className="mq-ed-links">
                            <Link to={ROTAS.NOTAS_ENTRADA}>Notas de entrada</Link>
                            <Link to={ROTAS.BALANCO_PATRIMONIAL}>Patrimônio {vinculos.bem ? `· ${vinculos.bem.status || "ATIVO"}` : ""}</Link>
                            <button type="button" onClick={() => abrirOs?.(true)}>Nova ordem de serviço</button>
                            <Link to={ROTAS.ORDEM_SERVICO}>Ordens de serviço</Link>
                            <Link to={ROTAS.PAINEL_PRODUCAO}>Painel de produção</Link>
                            <Link to={ROTAS.ESTOQUE}>Estoque</Link>
                        </div>
                        {vinculos.bem ? <p>Bem patrimonial #{vinculos.bem.id} · {moeda(vinculos.bem.valor)} · {vinculos.bem.status}</p> : <p>Ao salvar, a máquina entra no imobilizado com o valor de compra.</p>}
                        <ul className="mq-ed-linha">
                            {form.dataCompra ? <li><b>{dataBr(form.dataCompra)}</b> Compra {form.notaFiscal ? `· ${form.notaFiscal}` : ""} · {moeda(form.valorCompra)}</li> : null}
                            {form.ultimaUtilizacao ? <li><b>{dataHoraBr(form.ultimaUtilizacao)}</b> Última utilização</li> : null}
                            {manutencoes.map((item) => (
                                <li key={item.id || item.descricao}><b>{dataBr(item.data)}</b> {item.tipo} · {item.descricao} · {item.status}</li>
                            ))}
                            {(vinculos.ordens || []).map((os) => (
                                <li key={os.id}>
                                    <b>{dataBr(os.dataAbertura)}</b>
                                    <Link to={`${ROTAS.ORDEM_SERVICO}#edit/${os.id}`}> OS #{os.numero || os.id}</Link>
                                    {" · "}{os.cliente || "sem cliente"} · {os.status || ""}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                <footer className="mq-ed-foot">
                    {maquina?.id ? (
                        <button type="button" className="mq-ed-btn mq-ed-btn-danger" onClick={excluir}>
                            <Trash2 size={16} /> Excluir máquina
                        </button>
                    ) : <span />}
                    <div className="mq-ed-botoes">
                        {form.codigoPublico ? (
                            <button type="button" className="mq-ed-btn" onClick={() => abrirFichaQr(true)}>
                                <Printer size={16} /> Imprimir / QR
                            </button>
                        ) : null}
                        <button type="button" className="mq-ed-btn" onClick={fechar}>Cancelar</button>
                        <button type="submit" className="mq-ed-btn mq-ed-btn-primary" disabled={salvando || carregando}>
                            {salvando ? "Salvando..." : maquina?.id ? "Salvar alterações" : "Cadastrar máquina"}
                        </button>
                    </div>
                </footer>
            </form>
        </div>
    );
}

