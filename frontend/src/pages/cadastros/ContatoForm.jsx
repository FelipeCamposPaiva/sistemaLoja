import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Clock,
    CreditCard,
    FileText,
    Info,
    MapPin,
    MessageSquare,
    Paperclip,
    Percent,
    Phone,
    Plus,
    Search,
    ShoppingCart,
    Tag,
    TrendingUp,
    UserRound,
    Users,
    Wallet,
    X
} from "lucide-react";

import {
    CONDICOES_PAGAMENTO,
    CONTRIBUINTES,
    contatoVazio,
    LISTAS_PRECO_CONTATO,
    documentoEstrangeiro,
    ehPessoaFisica,
    ESTADOS,
    normalizarTipoPessoa,
    TIPOS,
    TIPOS_PESSOA,
    usaCnpj
} from "../../constants/contatos";
import {
    capitalizarNome,
    formatarCep,
    formatarCnpj,
    formatarCpf,
    formatarIe,
    formatarIm
} from "../../constants/mascarasContato";
import {
    FINALIDADES,
    REGIMES_TRIBUTARIOS,
    rotuloNatureza,
    sugerirNatureza
} from "../../constants/naturezasOperacao";
import { dataHoraLog, listarAuditoria } from "../../services/auditoria.service";
import { listarNaturezasOperacao } from "../../services/naturezaOperacao.service";
import { municipiosPorUf } from "../../services/ibge.service";
import { buscarCep } from "../../services/cep.service";
import { consultarCnpjReceita, consultarCpfReceita } from "../../services/cnpj.service";
import {
    atualizarCliente,
    buscarCliente,
    listarClientes,
    salvarCliente
} from "../../services/clientes.service";
import { listarVendedoresCadastro } from "../../constants/vendedoresCadastro";
import ROTAS from "../../constants/rotas";
import HistoricoAuditoria from "../../components/HistoricoAuditoria";
import PainelFinanceiroContato from "./PainelFinanceiroContato";
import ResumoComplementarPf from "./ResumoComplementarPf";
import "../../styles/pages/auditoria.css";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";

const ABAS = [
    { id: "gerais", nome: "Dados gerais", Icon: UserRound },
    { id: "comp", nome: "Dados complementares", Icon: FileText },
    { id: "financeiro", nome: "Financeiro", Icon: Wallet },
    { id: "anexos", nome: "Anexos", Icon: Paperclip },
    { id: "obs", nome: "Observações", Icon: MessageSquare },
    { id: "historico", nome: "Histórico", Icon: Clock }
];

function textoUltimaAtualizacao(log) {
    if (!log?.criadoEm) {
        return "";
    }
    return dataHoraLog(log.criadoEm);
}

function dataHoraCadastro(valor) {
    if (!valor) {
        return "";
    }
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) {
        return "";
    }
    return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function tituloAtividade(acao) {
    return String(acao || "").toUpperCase() === "CRIAR" ? "Cadastro criado" : "Cadastro atualizado";
}

function motivoErro(erro, padrao) {
    const dados = erro?.response?.data;
    if (typeof dados === "string" && dados.trim()) {
        return dados.trim();
    }
    const texto = dados?.mensagem || dados?.message || dados?.error;
    if (typeof texto === "string" && texto.trim() && !/^internal server error$/i.test(texto.trim())) {
        return texto.trim();
    }
    if (erro?.code === "ECONNABORTED") {
        return "A consulta demorou demais e foi interrompida.";
    }
    if (erro?.message === "Network Error") {
        return "Sem conexão com o servidor.";
    }
    return padrao;
}

function soDigitos(valor) {
    return String(valor || "").replace(/\D/g, "");
}

async function mensagemDocumentoRepetido(contato, idAtual) {
    const digitos = soDigitos(contato.cpfCnpj);
    if (digitos.length < 11) {
        return "";
    }
    const lista = await listarClientes();
    const outro = (Array.isArray(lista) ? lista : []).find((item) => {
        if (idAtual && String(item.id) === String(idAtual)) {
            return false;
        }
        return soDigitos(item.cpfCnpj) === digitos;
    });
    if (!outro) {
        return "";
    }
    const rotulo = digitos.length > 11 ? "CNPJ" : "CPF";
    return `Este ${rotulo} já está cadastrado para ${outro.nome || "outro contato"}.`;
}

function rotuloTipoCapital(id) {
    const nome = TIPOS.find((t) => t.id === id)?.nome || id;
    return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export default function ContatoForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(() => contatoVazio());
    const [aba, setAba] = useState("gerais");
    const [tiposAbertos, setTiposAbertos] = useState(false);
    const [carregando, setCarregando] = useState(Boolean(id));
    const [naoEncontrado, setNaoEncontrado] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [naturezas, setNaturezas] = useState([]);
    const [cidades, setCidades] = useState([]);
    const [cidadesCobranca, setCidadesCobranca] = useState([]);
    const [cobrancaDif, setCobrancaDif] = useState(false);
    const [criandoTipo, setCriandoTipo] = useState(false);
    const [nomeTipo, setNomeTipo] = useState("");
    const [consultandoCnpj, setConsultandoCnpj] = useState(false);
    const [avisoCnpj, setAvisoCnpj] = useState("");
    const [avisoCep, setAvisoCep] = useState({ campo: "", texto: "" });
    const [avisoAnexo, setAvisoAnexo] = useState("");
    const [erroPopup, setErroPopup] = useState("");
    const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
    const [logsAuditoria, setLogsAuditoria] = useState([]);
    const [buscandoCep, setBuscandoCep] = useState("");
    const cepTicket = useRef(0);
    const docTicket = useRef(0);
    const arquivoRef = useRef(null);
    const fotoRef = useRef(null);
    const vendedores = useMemo(
        () => listarVendedoresCadastro()
            .filter((v) => !v.excluido && v.status !== "excluido")
            .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR")),
        []
    );

    useEffect(() => {
        if (!id) {
            setForm({ ...contatoVazio(), dataCadastro: new Date().toISOString(), limiteCredito: "0,00" });
            setCobrancaDif(false);
            setCarregando(false);
            return;
        }
        let vivo = true;
        setCarregando(true);
        buscarCliente(id)
            .then((contato) => {
                if (vivo) {
                    const tipo = normalizarTipoPessoa(contato.tipoPessoa) || "PF";
                    setForm({
                        ...contato,
                        tipoPessoa: tipo,
                        cpfCnpj: documentoEstrangeiro(tipo)
                            ? contato.cpfCnpj
                            : usaCnpj(tipo)
                                ? formatarCnpj(contato.cpfCnpj)
                                : formatarCpf(contato.cpfCnpj),
                        ie: formatarIe(contato.ie, contato.uf),
                        inscricaoMunicipal: formatarIm(contato.inscricaoMunicipal),
                        cep: formatarCep(contato.cep)
                    });
                    setCobrancaDif(Boolean(contato.cobrancaDif));
                }
            })
            .catch(() => {
                if (vivo) {
                    setNaoEncontrado(true);
                }
            })
            .finally(() => {
                if (vivo) {
                    setCarregando(false);
                }
            });
        return () => {
            vivo = false;
        };
    }, [id]);

    useEffect(() => {
        listarNaturezasOperacao().then(setNaturezas).catch(() => setNaturezas([]));
    }, []);

    useEffect(() => {
        if (!erroPopup) {
            return undefined;
        }
        const timer = setTimeout(() => setErroPopup(""), 8000);
        return () => clearTimeout(timer);
    }, [erroPopup]);

    function mostrarErro(texto) {
        const msg = String(texto || "").trim();
        if (msg) {
            setErroPopup(msg);
        }
    }

    useEffect(() => {
        if (!id) {
            setUltimaAtualizacao(null);
            setLogsAuditoria([]);
            return undefined;
        }
        let vivo = true;
        listarAuditoria({ entidade: "CLIENTE", registroId: id })
            .then((lista) => {
                if (!vivo) {
                    return;
                }
                const logs = Array.isArray(lista) ? lista : [];
                setLogsAuditoria(logs);
                setUltimaAtualizacao(logs.length ? logs[0] : null);
            })
            .catch(() => {
                if (vivo) {
                    setUltimaAtualizacao(null);
                    setLogsAuditoria([]);
                }
            });
        return () => {
            vivo = false;
        };
    }, [id]);

    useEffect(() => {
        let vivo = true;
        if (!form.uf) {
            setCidades((atual) => (atual.length ? [] : atual));
            return undefined;
        }
        municipiosPorUf(form.uf)
            .then((nomes) => {
                if (vivo) {
                    setCidades(nomes);
                }
            })
            .catch(() => {
                if (vivo) {
                    setCidades([]);
                }
            });
        return () => {
            vivo = false;
        };
    }, [form.uf]);

    useEffect(() => {
        let vivo = true;
        if (!form.ufCobranca) {
            setCidadesCobranca((atual) => (atual.length ? [] : atual));
            return undefined;
        }
        municipiosPorUf(form.ufCobranca)
            .then((nomes) => {
                if (vivo) {
                    setCidadesCobranca(nomes);
                }
            })
            .catch(() => {
                if (vivo) {
                    setCidadesCobranca([]);
                }
            });
        return () => {
            vivo = false;
        };
    }, [form.ufCobranca]);

    if (naoEncontrado) {
        return (
            <div className="ctt-page">
                <p>Cadastro não encontrado.</p>
                <Link to="/contatos#/">voltar</Link>
            </div>
        );
    }

    if (carregando) {
        return (
            <div className="ctt-page">
                <p>Carregando cadastro...</p>
            </div>
        );
    }

    function setCampo(chave, valor) {
        setForm((atual) => {
            const next = { ...atual, [chave]: valor };
            if (chave === "tipoPessoa" || chave === "contribuinte") {
                const icms = String(next.contribuinte) === "1";
                const pf = ehPessoaFisica(next.tipoPessoa);
                next.consumidorFinal = pf || !icms;
                next.finalidade = next.consumidorFinal ? "CONSUMO" : "REVENDA";
            }
            return next;
        });
    }

    function aoNome(chave, evento) {
        const campo = evento.target;
        const posicao = campo.selectionStart;
        const formatado = capitalizarNome(campo.value);
        setCampo(chave, formatado);
        requestAnimationFrame(() => {
            const ponto = Math.min(formatado.length, posicao ?? formatado.length);
            try {
                campo.setSelectionRange(ponto, ponto);
            } catch {
                /* campo pode ter sido recriado */
            }
        });
    }

    function toggleTipo(tipoId) {
        setForm((atual) => {
            const tipos = atual.tipos || [];
            return {
                ...atual,
                tipos: tipos.includes(tipoId)
                    ? tipos.filter((t) => t !== tipoId)
                    : [...tipos, tipoId]
            };
        });
    }

    function confirmarTipo() {
        const nome = nomeTipo.trim();
        if (!nome) {
            return;
        }
        const id = nome.toLowerCase();
        setForm((atual) => {
            const tipos = atual.tipos || [];
            if (tipos.includes(id)) {
                return atual;
            }
            return { ...atual, tipos: [...tipos, id] };
        });
        setNomeTipo("");
        setCriandoTipo(false);
    }

    async function salvar() {
        const pronto = {
            ...form,
            cobrancaDif,
            nome: capitalizarNome(form.nome),
            fantasia: capitalizarNome(form.fantasia),
            nomePai: capitalizarNome(form.nomePai),
            nomeMae: capitalizarNome(form.nomeMae)
        };
        if (!pronto.nome.trim()) {
            setAba("gerais");
            mostrarErro("Informe o nome do contato.");
            return;
        }
        try {
            const repetido = await mensagemDocumentoRepetido(pronto, id);
            if (repetido) {
                setAba("gerais");
                mostrarErro(repetido);
                return;
            }
        } catch {
            /* se a lista não carregar, o servidor ainda recusa o documento repetido */
        }
        setSalvando(true);
        try {
            if (id) {
                await atualizarCliente(id, pronto);
            } else {
                await salvarCliente(pronto);
            }
            navigate("/contatos#/");
        } catch (erro) {
            mostrarErro(motivoErro(erro, "Não foi possível salvar o contato."));
        } finally {
            setSalvando(false);
        }
    }

    function lerArquivo(file) {
        return new Promise((resolve, reject) => {
            const leitor = new FileReader();
            leitor.onload = () => resolve({
                nome: file.name,
                tam: file.size,
                tipo: file.type,
                conteudo: String(leitor.result || "")
            });
            leitor.onerror = () => reject(new Error("leitura"));
            leitor.readAsDataURL(file);
        });
    }

    async function anexarArquivos(lista) {
        const arquivos = [...(lista || [])];
        if (!arquivos.length) {
            return;
        }
        const grandes = arquivos.filter((file) => file.size > 2 * 1024 * 1024).map((file) => file.name);
        const aceitos = arquivos.filter((file) => file.size <= 2 * 1024 * 1024);
        const avisoGrande = grandes.length ? `O arquivo não deve ultrapassar 2Mb: ${grandes.join(", ")}` : "";
        setAvisoAnexo(avisoGrande);
        if (avisoGrande) {
            mostrarErro(avisoGrande);
        }
        if (!aceitos.length) {
            return;
        }
        try {
            const novos = (await Promise.all(aceitos.map(lerArquivo))).map((arquivo, indice) => ({
                ...arquivo,
                id: `${arquivo.nome}-${arquivo.tam}-${Date.now()}-${indice}`
            }));
            setForm((atual) => {
                const ids = new Set((atual.anexos || []).map((item) => item.id));
                const extras = novos.filter((item) => !ids.has(item.id));
                return { ...atual, anexos: [...(atual.anexos || []), ...extras] };
            });
        } catch {
            setAvisoAnexo("Não foi possível ler o arquivo.");
            mostrarErro("Não foi possível ler o arquivo.");
        }
    }

    function escolherFoto(file) {
        if (!file) {
            return;
        }
        if (!String(file.type || "").startsWith("image/")) {
            setAvisoAnexo("Selecione uma imagem para a foto de perfil.");
            mostrarErro("Selecione uma imagem para a foto de perfil.");
            return;
        }
        const url = URL.createObjectURL(file);
        const imagem = new Image();
        imagem.onload = () => {
            const max = 256;
            const escala = Math.min(1, max / Math.max(imagem.width, imagem.height));
            const tela = document.createElement("canvas");
            tela.width = Math.max(1, Math.round(imagem.width * escala));
            tela.height = Math.max(1, Math.round(imagem.height * escala));
            tela.getContext("2d").drawImage(imagem, 0, 0, tela.width, tela.height);
            setCampo("foto", tela.toDataURL("image/jpeg", 0.85));
            URL.revokeObjectURL(url);
        };
        imagem.onerror = () => {
            URL.revokeObjectURL(url);
            setAvisoAnexo("Não foi possível ler a foto.");
            mostrarErro("Não foi possível ler a foto.");
        };
        imagem.src = url;
    }

    function addPessoa() {
        setForm((atual) => ({
            ...atual,
            pessoasContato: [...(atual.pessoasContato || []), { nome: "", setor: "", email: "", telefone: "", ramal: "" }]
        }));
    }

    const tipoPessoa = normalizarTipoPessoa(form.tipoPessoa) || "PF";
    const ehFisica = ehPessoaFisica(tipoPessoa);
    const ehCnpj = usaCnpj(tipoPessoa);
    const ehEstrangeiro = documentoEstrangeiro(tipoPessoa);

    async function completarCep(mascarado, cobranca) {
        const ticket = ++cepTicket.current;
        const chave = cobranca ? "cepCobranca" : "cep";
        setBuscandoCep(chave);
        setAvisoCep({ campo: "", texto: "" });
        try {
            const dados = await buscarCep(mascarado);
            if (ticket !== cepTicket.current) {
                return;
            }
            if (!dados) {
                const incompleto = String(mascarado || "").replace(/\D/g, "").length !== 8;
                const textoCep = incompleto ? "Informe os 8 dígitos do CEP." : "CEP não encontrado.";
                setAvisoCep({ campo: chave, texto: textoCep });
                mostrarErro(textoCep);
                return;
            }
            setForm((atual) => {
                const next = { ...atual, [chave]: dados.cep || mascarado };
                if (dados.endereco) {
                    next[cobranca ? "enderecoCobranca" : "endereco"] = dados.endereco;
                }
                if (dados.bairro) {
                    next[cobranca ? "bairroCobranca" : "bairro"] = dados.bairro;
                }
                if (dados.municipio) {
                    next[cobranca ? "municipioCobranca" : "municipio"] = dados.municipio;
                }
                if (dados.uf) {
                    next[cobranca ? "ufCobranca" : "uf"] = dados.uf;
                }
                if (dados.complemento) {
                    next[cobranca ? "complementoCobranca" : "complemento"] = dados.complemento;
                }
                if (!cobranca && next.ie) {
                    next.ie = formatarIe(next.ie, next.uf);
                }
                return next;
            });
        } catch {
            if (ticket === cepTicket.current) {
                setAvisoCep({ campo: chave, texto: "Não foi possível consultar o CEP." });
                mostrarErro("Não foi possível consultar o CEP.");
            }
        } finally {
            if (ticket === cepTicket.current) {
                setBuscandoCep("");
            }
        }
    }

    function aoCep(valor, cobranca) {
        const mascarado = formatarCep(valor);
        setCampo(cobranca ? "cepCobranca" : "cep", mascarado);
        if (mascarado.replace(/\D/g, "").length === 8) {
            completarCep(mascarado, cobranca);
        }
    }

    async function consultarReceita(documento) {
        const doc = documento ?? form.cpfCnpj;
        const ticket = ++docTicket.current;
        setConsultandoCnpj(true);
        setAvisoCnpj("");
        try {
            if (ehFisica) {
                const dados = await consultarCpfReceita(doc);
                if (ticket !== docTicket.current) {
                    return;
                }
                if (!dados || !dados.valido) {
                    setAvisoCnpj("CPF inválido.");
                    mostrarErro("CPF inválido.");
                    return;
                }
                if (dados.ufs.length === 1) {
                    setForm((atual) => (atual.uf ? atual : { ...atual, uf: dados.ufs[0] }));
                }
                const regiao = dados.ufs.length ? ` Região fiscal: ${dados.ufs.join(" ou ")}.` : "";
                setAvisoCnpj(`CPF válido.${regiao} Preencha o nome e o endereço.`);
                return;
            }
            const dados = await consultarCnpjReceita(doc);
            if (ticket !== docTicket.current) {
                return;
            }
            if (!dados) {
                setAvisoCnpj("CNPJ não encontrado na Receita Federal.");
                mostrarErro("CNPJ não encontrado na Receita Federal.");
                return;
            }
            setForm((atual) => ({
                ...atual,
                cpfCnpj: dados.cpfCnpj || atual.cpfCnpj,
                nome: dados.nome || atual.nome,
                fantasia: dados.fantasia || atual.fantasia,
                cep: dados.cep || atual.cep,
                endereco: dados.endereco || atual.endereco,
                numero: dados.numero || atual.numero,
                complemento: dados.complemento || atual.complemento,
                bairro: dados.bairro || atual.bairro,
                municipio: dados.municipio || atual.municipio,
                uf: dados.uf || atual.uf,
                telefone: atual.telefone || dados.telefone || "",
                ie: atual.ie ? formatarIe(atual.ie, dados.uf || atual.uf) : atual.ie
            }));
            setAvisoCnpj("Dados preenchidos com a consulta à Receita Federal.");
        } catch (erro) {
            if (ticket !== docTicket.current) {
                return;
            }
            const textoCnpj = motivoErro(erro, "Não foi possível consultar a Receita Federal.");
            setAvisoCnpj(textoCnpj);
            mostrarErro(textoCnpj);
        } finally {
            if (ticket === docTicket.current) {
                setConsultandoCnpj(false);
            }
        }
    }
    const sugestaoFiscal = sugerirNatureza(form, naturezas);
    const novo = !id;
    const titulo = novo ? "Novo Contato" : (form.nome || "Contato");
    const cidadesOpcoes = form.municipio && !cidades.includes(form.municipio)
        ? [form.municipio, ...cidades]
        : cidades;

    return (
        <div className="ctt-page ctt-form-page nct">
            {erroPopup ? (
                <div className="nct-erro" role="alert">
                    <div>
                        <strong>Erro</strong>
                        <p>{erroPopup}</p>
                    </div>
                    <button type="button" onClick={() => setErroPopup("")} aria-label="Fechar aviso">
                        <X size={16} />
                    </button>
                </div>
            ) : null}
            <nav className="nct-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>Início</Link>
                <ChevronRight size={14} />
                <span>Cadastros</span>
                <ChevronRight size={14} />
                <Link to="/contatos#/">Clientes e Fornecedores</Link>
                <ChevronRight size={14} />
                <span className="is-current">{novo ? "Novo contato" : titulo}</span>
            </nav>

            <button type="button" className="nct-voltar" onClick={() => navigate("/contatos#/")}>
                <ChevronLeft size={16} />
                Voltar
            </button>

            <header className="nct-head">
                <div className="nct-title">
                    <button type="button" className="nct-avatar" onClick={() => fotoRef.current?.click()} aria-label="Foto de perfil">
                        {form.foto ? <img src={form.foto} alt="" /> : <UserRound size={22} />}
                        <span className="nct-plus"><Plus size={12} /></span>
                    </button>
                    <input
                        ref={fotoRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                            escolherFoto(e.target.files?.[0]);
                            e.target.value = "";
                        }}
                    />
                    <div>
                        <h2>{titulo}</h2>
                        <p>
                            {novo
                                ? "Adicione um novo contato para cliente, fornecedor ou parceiro comercial da sua loja."
                                : "Atualize os dados deste contato."}
                        </p>
                    </div>
                </div>
                <aside className="nct-banner">
                    <span className="nct-banner-art" aria-hidden="true">
                        <UserRound size={28} />
                        <span><Plus size={14} /></span>
                    </span>
                    <div>
                        <strong>Organize seus contatos</strong>
                        <p>Mantenha os dados sempre atualizados para facilitar o relacionamento com seus clientes e fornecedores.</p>
                    </div>
                </aside>
            </header>

            <nav className="nct-ligacoes" aria-label="Ligações do contato">
                {id ? (
                    <>
                        <Link to={`${ROTAS.CRM}?contato=${id}`}>CRM</Link>
                        <Link to={`${ROTAS.PDV}?contato=${id}`}>PDV</Link>
                        <Link to={`${ROTAS.PEDIDO_VENDA}?contato=${id}&novo=1`}>Novo pedido</Link>
                        <Link to={`${ROTAS.PEDIDO_VENDA}?contato=${id}`}>Últimas vendas</Link>
                        <Link to={`${ROTAS.NOTAS_ENTRADA}?contato=${id}`}>Últimas compras</Link>
                        <Link to={`${ROTAS.NFS}?contato=${id}`}>Notas de serviço</Link>
                        <Link to={`${ROTAS.ORDEM_SERVICO}?contato=${id}#add`}>Nova ordem de serviço</Link>
                        <Link to={`${ROTAS.ORDEM_SERVICO}?contato=${id}`}>Últimos serviços</Link>
                        <Link to={`${ROTAS.CONTAS_RECEBER}?contato=${id}`}>Contas a receber</Link>
                        <Link to={`/vendedores?contato=${id}#list`}>Tornar vendedor</Link>
                    </>
                ) : (
                    <span>Pedido, PDV, contas e ordem de serviço ficam ligados a este contato depois de salvar.</span>
                )}
            </nav>

            <div className="nct-tabs" role="tablist">
                {ABAS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={aba === item.id}
                        className={aba === item.id ? "is-active" : ""}
                        onClick={() => setAba(item.id)}
                    >
                        <item.Icon size={16} />
                        {item.nome}
                    </button>
                ))}
            </div>

            {aba === "gerais" ? (
                <>
                    <section className="nct-card">
                        <header className="nct-card-head">
                            <span className="nct-ico"><UserRound size={18} /></span>
                            <div>
                                <h3>Dados principais</h3>
                                <p>Informações básicas do contato.</p>
                            </div>
                        </header>
                        <div className="ctt-grid">
                            <label className="span-5">
                                <span>Nome <em>*</em></span>
                                <input value={form.nome} onChange={(e) => aoNome("nome", e)} onBlur={(e) => setCampo("nome", capitalizarNome(e.target.value))} placeholder="Nome ou razão social do contato" />
                            </label>
                            <label className="span-5">
                                Fantasia
                                <input value={form.fantasia} onChange={(e) => aoNome("fantasia", e)} onBlur={(e) => setCampo("fantasia", capitalizarNome(e.target.value))} placeholder="Nome fantasia (opcional)" />
                            </label>
                            <label className="span-2">
                                Código
                                <input value={form.id ? String(form.id) : ""} readOnly disabled placeholder="Automático" title="Sequência automática. Este código não pode ser alterado." />
                                <small>Sequencial e inalterável</small>
                            </label>
                            <label className="span-3">
                                Tipo de pessoa
                                <select value={tipoPessoa} onChange={(e) => { setCampo("tipoPessoa", e.target.value); setAvisoCnpj(""); }}>
                                    {TIPOS_PESSOA.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                </select>
                            </label>
                            <label className="span-3">
                                <span>{ehEstrangeiro ? "Documento" : ehFisica ? "CPF" : "CNPJ"} {ehEstrangeiro ? null : <em>*</em>}</span>
                                <span className="nct-campo-acao">
                                    <input
                                        value={form.cpfCnpj}
                                        onChange={(e) => {
                                            const valor = ehEstrangeiro
                                                ? e.target.value
                                                : ehCnpj
                                                    ? formatarCnpj(e.target.value)
                                                    : formatarCpf(e.target.value);
                                            setCampo("cpfCnpj", valor);
                                            setAvisoCnpj("");
                                            const digitos = valor.replace(/\D/g, "");
                                            if (ehFisica && digitos.length === 11) {
                                                consultarReceita(valor);
                                            }
                                        }}
                                        placeholder={ehEstrangeiro ? "Documento" : ehFisica ? "000.000.000-00" : "00.000.000/0000-00"}
                                    />
                                    {ehEstrangeiro ? null : (
                                        <button type="button" className="nct-consulta" onClick={() => consultarReceita()} disabled={consultandoCnpj}>
                                            {consultandoCnpj ? "Consultando..." : "Receita Federal"}
                                        </button>
                                    )}
                                </span>
                                {avisoCnpj ? <small>{avisoCnpj}</small> : null}
                            </label>
                            <label className="span-3">
                                {ehFisica ? "RG" : "Inscrição Estadual"}
                                <input
                                    value={ehFisica ? form.rg : form.ie}
                                    onChange={(e) => setCampo(ehFisica ? "rg" : "ie", ehFisica ? e.target.value : formatarIe(e.target.value, form.uf))}
                                    placeholder={ehFisica ? "Digite o RG" : "Digite a inscrição estadual (opcional)"}
                                />
                            </label>
                            <label className="span-3">
                                Contribuinte
                                <select value={form.contribuinte} onChange={(e) => setCampo("contribuinte", e.target.value)}>
                                    {CONTRIBUINTES.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                </select>
                            </label>
                            {ehFisica ? null : (
                                <label className="span-4">
                                    Inscrição Municipal
                                    <input value={form.inscricaoMunicipal || ""} onChange={(e) => setCampo("inscricaoMunicipal", formatarIm(e.target.value))} placeholder="Digite a inscrição municipal (opcional)" />
                                </label>
                            )}
                        </div>
                    </section>

                    <section className="nct-card">
                        <header className="nct-card-head">
                            <span className="nct-ico"><Percent size={18} /></span>
                            <div>
                                <h3>Fiscal — natureza de operação</h3>
                                <p>Defina a natureza e as informações fiscais utilizadas na venda.</p>
                            </div>
                        </header>
                        <div className="ctt-grid">
                            <label className="span-3">
                                Consumidor final
                                <select
                                    value={form.consumidorFinal ? "1" : "0"}
                                    onChange={(e) => setCampo("consumidorFinal", e.target.value === "1")}
                                >
                                    <option value="1">Sim</option>
                                    <option value="0">Não</option>
                                </select>
                            </label>
                            <label className="span-3">
                                Finalidade
                                <select value={form.finalidade} onChange={(e) => setCampo("finalidade", e.target.value)}>
                                    {FINALIDADES.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                </select>
                            </label>
                            <label className="span-3">
                                Regime tributário
                                <select value={form.regimeTributario} onChange={(e) => setCampo("regimeTributario", e.target.value)}>
                                    {REGIMES_TRIBUTARIOS.map((t) => <option key={t.id || "nao"} value={t.id}>{t.nome}</option>)}
                                </select>
                            </label>
                            <label className="span-3">
                                Natureza padrão
                                <select value={form.naturezaOperacaoId || ""} onChange={(e) => setCampo("naturezaOperacaoId", e.target.value)}>
                                    <option value="">Automática (pelas características)</option>
                                    {naturezas.map((n) => (
                                        <option key={n.id || n.codigo} value={n.id}>{n.nome} ({n.cfopInterno}/{n.cfopInterestadual})</option>
                                    ))}
                                </select>
                            </label>
                            <p className="span-12 nct-hint">
                                {sugestaoFiscal.origem === "CADASTRO" ? "Cadastro: " : "Automática: "}
                                {rotuloNatureza(sugestaoFiscal)}
                                {sugestaoFiscal.motivo ? ` — ${sugestaoFiscal.motivo}` : ""}
                            </p>
                        </div>
                    </section>

                    <section className="nct-card">
                        <header className="nct-card-head">
                            <span className="nct-ico"><Tag size={18} /></span>
                            <div>
                                <h3>Tipo de contato</h3>
                                <p>Selecione os tipos de contato deste registro. É possível adicionar mais de um.</p>
                            </div>
                        </header>
                        <div className="nct-tipos-row">
                            <div className="ctt-tipos nct-tipos">
                                <button type="button" className="nct-select" onClick={() => setTiposAbertos((v) => !v)}>
                                    <span>{(form.tipos || []).length ? `${form.tipos.length} selecionada(s)` : "Selecione os tipos de contato"}</span>
                                    <ChevronDown size={16} />
                                </button>
                                {tiposAbertos ? (
                                    <div className="ctt-menu ctt-tipos-menu nct-tipos-menu">
                                        {TIPOS.map((t) => (
                                            <label key={t.id} className={(form.tipos || []).includes(t.id) ? "is-sel" : ""}>
                                                <input type="checkbox" checked={(form.tipos || []).includes(t.id)} onChange={() => toggleTipo(t.id)} />
                                                {rotuloTipoCapital(t.id)}
                                            </label>
                                        ))}
                                        {(form.tipos || []).filter((id) => !TIPOS.some((t) => t.id === id)).map((id) => (
                                            <label key={id} className="is-sel">
                                                <input type="checkbox" checked onChange={() => toggleTipo(id)} />
                                                {rotuloTipoCapital(id)}
                                            </label>
                                        ))}
                                        {criandoTipo ? (
                                            <label className="nct-novo-tipo">
                                                Novo tipo
                                                <input
                                                    value={nomeTipo}
                                                    autoFocus
                                                    placeholder="Nome do tipo"
                                                    onChange={(e) => setNomeTipo(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            confirmarTipo();
                                                        }
                                                    }}
                                                />
                                            </label>
                                        ) : (
                                            <button type="button" className="ctt-link" onClick={() => setCriandoTipo(true)}>+ Criar novo tipo de contato</button>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                            <div className="ctt-tags">
                                {(form.tipos || []).map((t) => (
                                    <span key={t}>
                                        {rotuloTipoCapital(t)}
                                        <button type="button" onClick={() => toggleTipo(t)} aria-label={`Remover ${rotuloTipoCapital(t)}`}><X size={12} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="nct-card">
                        <header className="nct-card-head">
                            <span className="nct-ico nct-ico-pin"><MapPin size={18} /></span>
                            <div>
                                <h3>Endereço</h3>
                            </div>
                            <label className="nct-switch">
                                <span>Possui endereço de cobrança diferente do endereço principal?</span>
                                <input type="checkbox" checked={cobrancaDif} onChange={(e) => setCobrancaDif(e.target.checked)} />
                                <i />
                            </label>
                        </header>
                        <div className="ctt-grid">
                            <label className="span-3">
                                CEP
                                <span className="nct-cep">
                                    <input value={form.cep} onChange={(e) => aoCep(e.target.value, false)} placeholder="00000-000" />
                                    <button
                                        type="button"
                                        className="nct-lupa"
                                        aria-label="Buscar CEP"
                                        disabled={buscandoCep === "cep"}
                                        onClick={() => completarCep(form.cep, false)}
                                    >
                                        <Search size={16} />
                                    </button>
                                </span>
                                {buscandoCep === "cep" ? <small>Buscando endereço...</small> : null}
                                {avisoCep.campo === "cep" ? <small>{avisoCep.texto}</small> : null}
                            </label>
                            <label className="span-6">
                                Município
                                <select
                                    value={form.municipio}
                                    disabled={!form.uf}
                                    onChange={(e) => setCampo("municipio", e.target.value)}
                                >
                                    <option value="">{form.uf ? "Selecione o município" : "Selecione a UF"}</option>
                                    {cidadesOpcoes.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                                </select>
                            </label>
                            <label className="span-3">
                                UF
                                <select
                                    value={form.uf}
                                    onChange={(e) => {
                                        setCampo("uf", e.target.value);
                                        setCampo("municipio", "");
                                    }}
                                >
                                    <option value="">Selecione</option>
                                    {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                                </select>
                            </label>
                            <label className="span-6">
                                Endereço
                                <input value={form.endereco} onChange={(e) => setCampo("endereco", e.target.value)} placeholder="Digite o endereço" />
                            </label>
                            <label className="span-2">
                                Número
                                <input value={form.numero} onChange={(e) => setCampo("numero", e.target.value)} placeholder="Nº" />
                            </label>
                            <label className="span-4">
                                Complemento
                                <input value={form.complemento} onChange={(e) => setCampo("complemento", e.target.value)} placeholder="Complemento (opcional)" />
                            </label>
                            <label className="span-6">
                                Bairro
                                <input value={form.bairro} onChange={(e) => setCampo("bairro", e.target.value)} placeholder="Digite o bairro" />
                            </label>
                            {cobrancaDif ? (
                                <>
                                    <h4 className="span-12 nct-end-titulo">Endereço de cobrança</h4>
                                    <label className="span-3">
                                        CEP
                                        <span className="nct-cep">
                                            <input value={form.cepCobranca || ""} onChange={(e) => aoCep(e.target.value, true)} placeholder="00000-000" />
                                            <button
                                                type="button"
                                                className="nct-lupa"
                                                aria-label="Buscar CEP de cobrança"
                                                disabled={buscandoCep === "cepCobranca"}
                                                onClick={() => completarCep(form.cepCobranca, true)}
                                            >
                                                <Search size={16} />
                                            </button>
                                        </span>
                                        {buscandoCep === "cepCobranca" ? <small>Buscando endereço...</small> : null}
                                        {avisoCep.campo === "cepCobranca" ? <small>{avisoCep.texto}</small> : null}
                                    </label>
                                    <label className="span-6">
                                        Município
                                        <select
                                            value={form.municipioCobranca || ""}
                                            disabled={!form.ufCobranca}
                                            onChange={(e) => setCampo("municipioCobranca", e.target.value)}
                                        >
                                            <option value="">{form.ufCobranca ? "Selecione o município" : "Selecione a UF"}</option>
                                            {(form.municipioCobranca && !cidadesCobranca.includes(form.municipioCobranca)
                                                ? [form.municipioCobranca, ...cidadesCobranca]
                                                : cidadesCobranca
                                            ).map((nome) => <option key={nome} value={nome}>{nome}</option>)}
                                        </select>
                                    </label>
                                    <label className="span-3">
                                        UF
                                        <select
                                            value={form.ufCobranca || ""}
                                            onChange={(e) => {
                                                setCampo("ufCobranca", e.target.value);
                                                setCampo("municipioCobranca", "");
                                            }}
                                        >
                                            <option value="">Selecione</option>
                                            {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                                        </select>
                                    </label>
                                    <label className="span-6">
                                        Endereço
                                        <input value={form.enderecoCobranca || ""} onChange={(e) => setCampo("enderecoCobranca", e.target.value)} placeholder="Digite o endereço" />
                                    </label>
                                    <label className="span-2">
                                        Número
                                        <input value={form.numeroCobranca || ""} onChange={(e) => setCampo("numeroCobranca", e.target.value)} placeholder="Nº" />
                                    </label>
                                    <label className="span-4">
                                        Complemento
                                        <input value={form.complementoCobranca || ""} onChange={(e) => setCampo("complementoCobranca", e.target.value)} placeholder="Complemento (opcional)" />
                                    </label>
                                    <label className="span-6">
                                        Bairro
                                        <input value={form.bairroCobranca || ""} onChange={(e) => setCampo("bairroCobranca", e.target.value)} placeholder="Digite o bairro" />
                                    </label>
                                </>
                            ) : null}
                        </div>
                    </section>

                    <section className="nct-card">
                        <header className="nct-card-head">
                            <span className="nct-ico nct-ico-phone"><Phone size={18} /></span>
                            <div>
                                <h3>Contato</h3>
                            </div>
                        </header>
                        <div className="ctt-grid">
                            <label className="span-4">
                                Telefone
                                <input value={form.telefone} onChange={(e) => setCampo("telefone", e.target.value)} placeholder="(00) 0000-0000" />
                            </label>
                            <label className="span-4">
                                Telefone adicional
                                <input value={form.telefone2} onChange={(e) => setCampo("telefone2", e.target.value)} placeholder="(00) 0000-0000" />
                            </label>
                            <label className="span-4">
                                Celular
                                <input value={form.celular} onChange={(e) => setCampo("celular", e.target.value)} placeholder="(00) 00000-0000" />
                            </label>
                            <label className="span-4">
                                Website
                                <input value={form.website} onChange={(e) => setCampo("website", e.target.value)} placeholder="https://site/" />
                            </label>
                            <label className="span-4">
                                E-mail
                                <input value={form.email} onChange={(e) => setCampo("email", e.target.value)} placeholder="email@exemplo.com" />
                            </label>
                            <label className="span-4">
                                E-mail para envio de NFe
                                <input value={form.emailNfe} onChange={(e) => setCampo("emailNfe", e.target.value)} placeholder="email@exemplo.com" />
                            </label>
                            <label className="span-12">
                                Observações do contato
                                <textarea rows={3} value={form.observacoes} onChange={(e) => setCampo("observacoes", e.target.value)} placeholder="Observações do contato" />
                            </label>
                        </div>
                    </section>

                    <section className="nct-card">
                        <header className="nct-card-head">
                            <span className="nct-ico"><Users size={18} /></span>
                            <div>
                                <h3>Pessoas de contato</h3>
                                <p>Cadastre as pessoas de contato associadas a este cliente/fornecedor.</p>
                            </div>
                            <button type="button" className="nct-add" onClick={addPessoa}>
                                <Plus size={14} />
                                Adicionar contato
                            </button>
                        </header>
                        {(form.pessoasContato || []).length ? (
                            <table className="nct-pessoas">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Setor</th>
                                        <th>Email</th>
                                        <th>Telefone</th>
                                        <th>Ramal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(form.pessoasContato || []).map((p, i) => (
                                        <tr key={i}>
                                            {["nome", "setor", "email", "telefone", "ramal"].map((k) => (
                                                <td key={k}>
                                                    <input
                                                        value={p[k]}
                                                        placeholder={k === "nome" ? "Nome" : k === "setor" ? "Setor" : k === "email" ? "Email" : k === "telefone" ? "Telefone" : "Ramal"}
                                                        onChange={(e) => {
                                                            const next = [...form.pessoasContato];
                                                            next[i] = { ...next[i], [k]: e.target.value };
                                                            setCampo("pessoasContato", next);
                                                        }}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="nct-vazio">
                                <Users size={16} />
                                Nenhum contato cadastrado.
                            </p>
                        )}
                    </section>
                </>
            ) : null}

            {aba === "comp" && ehFisica ? (
                <>
                    <ResumoComplementarPf
                        contatoId={id || form.id}
                        nome={form.nome}
                        limite={form.limiteCredito}
                    />
                    <section className="nct-card">
                        <header className="nct-card-head">
                            <span className="nct-ico"><UserRound size={18} /></span>
                            <div>
                                <h3>Informações pessoais e fiscais</h3>
                                <p>Dados adicionais para identificação e tributação.</p>
                            </div>
                        </header>
                        <div className="ctt-grid">
                            <label className="span-4">
                                Estado Civil
                                <select value={form.estadoCivil || ""} onChange={(e) => setCampo("estadoCivil", e.target.value)}>
                                    <option value="">Selecione</option>
                                    <option>Solteiro(a)</option>
                                    <option>Casado(a)</option>
                                    <option>Divorciado(a)</option>
                                    <option>Viúvo(a)</option>
                                    <option>União estável</option>
                                </select>
                            </label>
                            <label className="span-4">
                                Profissão
                                <input value={form.profissao || ""} onChange={(e) => setCampo("profissao", e.target.value)} placeholder="Digite a profissão" />
                            </label>
                            <label className="span-4">
                                Sexo
                                <select value={form.sexo || ""} onChange={(e) => setCampo("sexo", e.target.value)}>
                                    <option value="">Selecione</option>
                                    <option>Feminino</option>
                                    <option>Masculino</option>
                                    <option>Outro</option>
                                </select>
                            </label>
                            <label className="span-3">
                                Data de nascimento
                                <input type="date" value={form.nascimento || ""} onChange={(e) => setCampo("nascimento", e.target.value)} />
                            </label>
                            <label className="span-3">
                                Naturalidade
                                <input value={form.naturalidade || ""} onChange={(e) => setCampo("naturalidade", e.target.value)} placeholder="Digite a naturalidade" />
                            </label>
                            <label className="span-3">
                                Nome do pai
                                <input value={form.nomePai || ""} onChange={(e) => aoNome("nomePai", e)} onBlur={(e) => setCampo("nomePai", capitalizarNome(e.target.value))} placeholder="Digite o nome do pai" />
                            </label>
                            <label className="span-3">
                                CPF do pai
                                <input value={form.cpfPai || ""} onChange={(e) => setCampo("cpfPai", formatarCpf(e.target.value))} placeholder="000.000.000-00" />
                            </label>
                            <label className="span-6">
                                Nome da mãe
                                <input value={form.nomeMae || ""} onChange={(e) => aoNome("nomeMae", e)} onBlur={(e) => setCampo("nomeMae", capitalizarNome(e.target.value))} placeholder="Digite o nome da mãe" />
                            </label>
                            <label className="span-6">
                                CPF da mãe
                                <input value={form.cpfMae || ""} onChange={(e) => setCampo("cpfMae", formatarCpf(e.target.value))} placeholder="000.000.000-00" />
                            </label>
                        </div>
                    </section>
                    <section className="nct-card">
                        <header className="nct-card-head">
                            <span className="nct-ico"><ShoppingCart size={18} /></span>
                            <div>
                                <h3>Informações de relacionamento</h3>
                                <p>Dados comerciais e de gestão do relacionamento.</p>
                            </div>
                        </header>
                        <div className="ctt-grid">
                            <label className="span-3">
                                Status no CRM
                                <select value={form.statusCrm} onChange={(e) => setCampo("statusCrm", e.target.value)}>
                                    <option>Cliente</option>
                                    <option>Lead</option>
                                    <option>Prospect</option>
                                </select>
                                <small>Estágio deste cliente na gestão do relacionamento com clientes (CRM).</small>
                            </label>
                            <label className="span-3">
                                Vendedor
                                <select
                                    value={form.vendedorId ? String(form.vendedorId) : ""}
                                    onChange={(e) => {
                                        const vend = vendedores.find((v) => String(v.id) === e.target.value);
                                        setForm((atual) => ({
                                            ...atual,
                                            vendedorId: vend ? vend.id : "",
                                            vendedor: vend ? vend.nome : ""
                                        }));
                                    }}
                                >
                                    <option value="">Selecione</option>
                                    {form.vendedor && !vendedores.some((v) => String(v.id) === String(form.vendedorId)) ? (
                                        <option value={form.vendedorId || form.vendedor}>{form.vendedor}</option>
                                    ) : null}
                                    {vendedores.map((v) => (
                                        <option key={v.id} value={v.id}>{v.nome}</option>
                                    ))}
                                </select>
                                <small>Vendedor padrão para este cliente</small>
                            </label>
                            <label className="span-3">
                                Condição de pagamento
                                <select value={form.condicaoPagamento || ""} onChange={(e) => setCampo("condicaoPagamento", e.target.value)}>
                                    <option value="">Selecione</option>
                                    {CONDICOES_PAGAMENTO.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                    {form.condicaoPagamento && !CONDICOES_PAGAMENTO.some((c) => c.id === form.condicaoPagamento) ? (
                                        <option value={form.condicaoPagamento}>{form.condicaoPagamento}</option>
                                    ) : null}
                                </select>
                                <small>Número de parcelas ou prazos padrão. Exemplo: 30 60, 3x ou 15 + 2x</small>
                            </label>
                            <label className="span-3">
                                Dia do pagamento
                                <select value={form.diaPagamento || ""} onChange={(e) => setCampo("diaPagamento", e.target.value)}>
                                    <option value="">Selecione</option>
                                    {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((dia) => (
                                        <option key={dia} value={dia}>{dia}</option>
                                    ))}
                                </select>
                                <small>Dia do mês em que o cliente costuma pagar</small>
                            </label>
                        </div>
                    </section>
                    <div className="nct-comp-rodape">
                        <section className="nct-card">
                            <header className="nct-card-head">
                                <span className="nct-ico"><Calendar size={18} /></span>
                                <div>
                                    <h3>Datas importantes</h3>
                                </div>
                            </header>
                            <div className="ctt-grid">
                                <label className="span-6">
                                    Data de criação
                                    <span className="nct-data">
                                        <input
                                            value={form.dataCadastro
                                                ? new Date(form.dataCadastro).toLocaleString("pt-BR", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    second: "2-digit"
                                                })
                                                : ""}
                                            disabled
                                        />
                                        <Calendar size={14} />
                                    </span>
                                </label>
                                <label className="span-6">
                                    Última atualização
                                    <span className="nct-data">
                                        <input value={textoUltimaAtualizacao(ultimaAtualizacao)} disabled />
                                        <Calendar size={14} />
                                    </span>
                                    <small>
                                        {id
                                            ? (ultimaAtualizacao?.usuarioNome || ultimaAtualizacao?.usuarioLogin || "Sem registro de quem alterou")
                                            : "Disponível após salvar"}
                                    </small>
                                </label>
                            </div>
                        </section>
                        <section className="nct-card">
                            <header className="nct-card-head">
                                <span className="nct-ico"><Tag size={18} /></span>
                                <div>
                                    <h3>Informações comerciais</h3>
                                </div>
                            </header>
                            <label>
                                Lista de preço
                                <select value={form.listaPreco} onChange={(e) => setCampo("listaPreco", e.target.value)}>
                                    <option value="">Selecione</option>
                                    {LISTAS_PRECO_CONTATO.map((lista) => <option key={lista.id} value={lista.id}>{lista.nome}</option>)}
                                </select>
                                <small>Lista de preços padrão para este cliente</small>
                            </label>
                        </section>
                        <button type="button" className="nct-comp-atalho" onClick={() => setAba("financeiro")}>
                            <span className="nct-ico"><TrendingUp size={18} /></span>
                            <span>
                                <strong>Histórico de compras</strong>
                                <p>Acesse o histórico completo de compras e movimentações deste cliente.</p>
                            </span>
                            <ChevronRight className="seta" size={18} />
                        </button>
                    </div>
                </>
            ) : null}

            {aba === "comp" && !ehFisica ? (
                <div className="nct-pj">
                    <div className="nct-pj-main">
                        <section className="nct-card">
                            <header className="nct-card-head">
                                <span className="nct-ico"><FileText size={18} /></span>
                                <div>
                                    <h3>Informações fiscais e tributárias</h3>
                                    <p>Dados relacionados ao regime tributário e inscrição.</p>
                                </div>
                            </header>
                            <div className="ctt-grid">
                                <label className="span-6">
                                    <span className="nct-rotulo">
                                        Código do regime tributário
                                        <Info size={14} title="Regime tributário usado na emissão fiscal deste cliente." />
                                    </span>
                                    <select value={form.regimeTributario} onChange={(e) => setCampo("regimeTributario", e.target.value)} title="Regime tributário usado na emissão fiscal deste cliente.">
                                        {REGIMES_TRIBUTARIOS.map((t) => <option key={t.id || "nao"} value={t.id}>{t.nome}</option>)}
                                    </select>
                                </label>
                                <label className="span-6">
                                    <span className="nct-rotulo">
                                        Inscrição Suframa
                                        <Info size={14} title="Inscrição na Suframa, quando o cliente possuir." />
                                    </span>
                                    <input value={form.inscricaoSuframa || ""} onChange={(e) => setCampo("inscricaoSuframa", e.target.value)} title="Inscrição na Suframa, quando o cliente possuir." />
                                </label>
                            </div>
                        </section>
                        <section className="nct-card">
                            <header className="nct-card-head">
                                <span className="nct-ico"><Users size={18} /></span>
                                <div>
                                    <h3>Dados de relacionamento</h3>
                                    <p>Informações de relacionamento comercial deste cliente.</p>
                                </div>
                            </header>
                            <div className="ctt-grid">
                                <label className="span-6">
                                    Data de fundação
                                    <input type="date" value={form.fundacao || ""} onChange={(e) => setCampo("fundacao", e.target.value)} />
                                </label>
                                <label className="span-6">
                                    Status no CRM
                                    <select id="pj-crm" value={form.statusCrm} onChange={(e) => setCampo("statusCrm", e.target.value)}>
                                        <option>Cliente</option>
                                        <option>Lead</option>
                                        <option>Prospect</option>
                                    </select>
                                    <small>Estágio deste cliente na gestão do relacionamento com clientes (CRM)</small>
                                </label>
                                <label className="span-6">
                                    Vendedor
                                    <select
                                        id="pj-vendedor"
                                        value={form.vendedorId ? String(form.vendedorId) : ""}
                                        onChange={(e) => {
                                            const vend = vendedores.find((v) => String(v.id) === e.target.value);
                                            setForm((atual) => ({
                                                ...atual,
                                                vendedorId: vend ? vend.id : "",
                                                vendedor: vend ? vend.nome : ""
                                            }));
                                        }}
                                    >
                                        <option value="">Selecione</option>
                                        {form.vendedor && !vendedores.some((v) => String(v.id) === String(form.vendedorId)) ? (
                                            <option value={form.vendedorId || form.vendedor}>{form.vendedor}</option>
                                        ) : null}
                                        {vendedores.map((v) => (
                                            <option key={v.id} value={v.id}>{v.nome}</option>
                                        ))}
                                    </select>
                                    <small>Vendedor padrão para este cliente</small>
                                </label>
                                <label className="span-6">
                                    Condição de pagamento
                                    <select id="pj-condicao" value={form.condicaoPagamento || ""} onChange={(e) => setCampo("condicaoPagamento", e.target.value)}>
                                        <option value="">Selecione</option>
                                        {CONDICOES_PAGAMENTO.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                        {form.condicaoPagamento && !CONDICOES_PAGAMENTO.some((c) => c.id === form.condicaoPagamento) ? (
                                            <option value={form.condicaoPagamento}>{form.condicaoPagamento}</option>
                                        ) : null}
                                    </select>
                                    <small>Número de parcelas ou prazos padrão. Exemplo: 30 60, 3x ou 15 + 2x</small>
                                </label>
                            </div>
                        </section>
                        <section className="nct-card">
                            <header className="nct-card-head">
                                <span className="nct-ico"><Tag size={18} /></span>
                                <div>
                                    <h3>Informações comerciais e controle</h3>
                                    <p>Defina o dia de pagamento, lista de preço e acompanhe as datas do cadastro.</p>
                                </div>
                            </header>
                            <div className="ctt-grid">
                                <label className="span-6">
                                    <span className="nct-rotulo">
                                        Dia do pagamento
                                        <Info size={14} title="Dia do mês em que o cliente costuma pagar." />
                                    </span>
                                    <select value={form.diaPagamento || ""} onChange={(e) => setCampo("diaPagamento", e.target.value)} title="Dia do mês em que o cliente costuma pagar">
                                        <option value="">Selecione</option>
                                        {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((dia) => (
                                            <option key={dia} value={dia}>{dia}</option>
                                        ))}
                                    </select>
                                    <small>Dia do mês em que o cliente costuma pagar</small>
                                </label>
                                <label className="span-6">
                                    Lista de preço
                                    <select id="pj-lista" value={form.listaPreco} onChange={(e) => setCampo("listaPreco", e.target.value)}>
                                        <option value="">Selecione</option>
                                        {LISTAS_PRECO_CONTATO.map((lista) => <option key={lista.id} value={lista.id}>{lista.nome}</option>)}
                                    </select>
                                </label>
                                <label className="span-6">
                                    Data de criação
                                    <input value={dataHoraCadastro(form.dataCadastro)} disabled />
                                </label>
                                <label className="span-6">
                                    <span className="nct-rotulo">
                                        Última atualização
                                        <Info size={14} title="Data, hora e usuário da última alteração deste cadastro." />
                                    </span>
                                    <input value={textoUltimaAtualizacao(ultimaAtualizacao)} disabled title="Data e hora da última alteração deste cadastro." />
                                    <small>
                                        {id
                                            ? (ultimaAtualizacao?.usuarioNome || ultimaAtualizacao?.usuarioLogin || "Sem registro de quem alterou")
                                            : "Disponível após salvar"}
                                    </small>
                                </label>
                            </div>
                        </section>
                    </div>
                    <aside className="nct-pj-side">
                        <section className="nct-card">
                            <header className="nct-card-head">
                                <span className="nct-ico"><FileText size={18} /></span>
                                <div>
                                    <h3>Resumo do cadastro</h3>
                                    <p>Visão geral das principais informações preenchidas.</p>
                                </div>
                            </header>
                            <ul className="nct-pj-resumo">
                                <li>
                                    <button type="button" onClick={() => document.getElementById("pj-crm")?.focus()}>
                                        <span className="nct-ico is-rosa"><UserRound size={15} /></span>
                                        <span>Status no CRM</span>
                                        <b className="is-crm">{form.statusCrm || "Selecione"}</b>
                                        <ChevronRight size={16} />
                                    </button>
                                </li>
                                <li>
                                    <button type="button" onClick={() => document.getElementById("pj-vendedor")?.focus()}>
                                        <span className="nct-ico is-verde"><CircleDollarSign size={15} /></span>
                                        <span>Vendedor</span>
                                        <b className={form.vendedor ? "" : "is-vazio"}>{form.vendedor || "Selecione"}</b>
                                        <ChevronRight size={16} />
                                    </button>
                                </li>
                                <li>
                                    <button type="button" onClick={() => document.getElementById("pj-condicao")?.focus()}>
                                        <span className="nct-ico is-azul"><CreditCard size={15} /></span>
                                        <span>Condição de pagamento</span>
                                        <b className={form.condicaoPagamento ? "" : "is-vazio"}>{form.condicaoPagamento || "Selecione"}</b>
                                        <ChevronRight size={16} />
                                    </button>
                                </li>
                                <li>
                                    <button type="button" onClick={() => document.getElementById("pj-lista")?.focus()}>
                                        <span className="nct-ico is-roxo"><Tag size={15} /></span>
                                        <span>Lista de preço</span>
                                        <b className={form.listaPreco ? "" : "is-vazio"}>{form.listaPreco || "Selecione"}</b>
                                        <ChevronRight size={16} />
                                    </button>
                                </li>
                            </ul>
                        </section>
                        <section className="nct-card">
                            <header className="nct-card-head">
                                <span className="nct-ico"><Clock size={18} /></span>
                                <div>
                                    <h3>Atividade recente</h3>
                                    <p>Últimas atualizações realizadas neste cadastro.</p>
                                </div>
                            </header>
                            <ol className="nct-pj-tempo">
                                {(logsAuditoria.length ? logsAuditoria.slice(0, 4) : [{ id: "novo", acao: "CRIAR", criadoEm: form.dataCadastro }]).map((log) => (
                                    <li key={log.id || log.criadoEm}>
                                        <span className="nct-ico"><Calendar size={14} /></span>
                                        <span>
                                            <strong>{tituloAtividade(log.acao)}</strong>
                                            <small>{log.criadoEm && log.id !== "novo" ? dataHoraLog(log.criadoEm) : dataHoraCadastro(form.dataCadastro)}</small>
                                        </span>
                                        <em>{log.usuarioNome || log.usuarioLogin || (id ? "Sem registro" : "Disponível após salvar")}</em>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </aside>
                </div>
            ) : null}

            {aba === "financeiro" ? (
                <PainelFinanceiroContato
                    contatoId={id || form.id}
                    nome={form.nome}
                    limite={form.limiteCredito}
                    onLimite={(valor) => setCampo("limiteCredito", valor)}
                />
            ) : null}

            {aba === "anexos" ? (
                <section className="nct-card">
                    <div className="nct-anexos">
                        <button type="button" className="idx-pill int-add" onClick={() => arquivoRef.current?.click()}>
                            + procurar arquivo
                        </button>
                        <input
                            ref={arquivoRef}
                            type="file"
                            multiple
                            hidden
                            onChange={(e) => {
                                anexarArquivos(e.target.files);
                                e.target.value = "";
                            }}
                        />
                        <p>O tamanho do arquivo não deve ultrapassar 2Mb</p>
                        {avisoAnexo ? <p className="nct-anexo-erro">{avisoAnexo}</p> : null}
                        {(form.anexos || []).length ? (
                            <ul>
                                {(form.anexos || []).map((a, i) => (
                                    <li key={`${a.nome}-${i}`} className="nct-anexo">
                                        <span>
                                            {a.conteudo ? (
                                                <a href={a.conteudo} download={a.nome}>{a.nome}</a>
                                            ) : a.nome}
                                            <small>{a.tam ? ` · ${(a.tam / 1024).toFixed(0)} KB` : ""}</small>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setCampo("anexos", (form.anexos || []).filter((_, idx) => idx !== i))}
                                        >
                                            Remover
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="nct-vazio">Nenhum arquivo anexado.</p>
                        )}
                    </div>
                </section>
            ) : null}

            {aba === "obs" ? (
                <section className="nct-card">
                <label className="ctt-obs">
                    Observações
                    <textarea rows={10} value={form.observacoes} onChange={(e) => setCampo("observacoes", e.target.value)} />
                </label>
                </section>
            ) : null}

            {aba === "historico" ? (
                <section className="nct-card">
                    <HistoricoAuditoria entidade="CLIENTE" registroId={id} />
                </section>
            ) : null}

            <footer className="nct-footer">
                <button type="button" className="nct-cancel" onClick={() => navigate("/contatos#/")}>
                    <X size={14} />
                    Cancelar
                </button>
                <button type="button" className="nct-save" onClick={salvar} disabled={salvando}>
                    {salvando ? "Salvando..." : "Salvar contato"}
                </button>
            </footer>
        </div>
    );
}
