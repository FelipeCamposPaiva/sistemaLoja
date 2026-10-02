import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    MapPin,
    MessageSquare,
    Paperclip,
    Percent,
    Phone,
    Plus,
    Tag,
    UserRound,
    Users,
    X
} from "lucide-react";

import {
    CONTRIBUINTES,
    contatoVazio,
    ESTADOS,
    TIPOS,
    TIPOS_PESSOA
} from "../../constants/contatos";
import {
    FINALIDADES,
    REGIMES_TRIBUTARIOS,
    rotuloNatureza,
    sugerirNatureza
} from "../../constants/naturezasOperacao";
import { listarNaturezasOperacao } from "../../services/naturezaOperacao.service";
import { municipiosPorUf } from "../../services/ibge.service";
import {
    atualizarCliente,
    buscarCliente,
    salvarCliente
} from "../../services/clientes.service";
import ROTAS from "../../constants/rotas";
import HistoricoAuditoria from "../../components/HistoricoAuditoria";
import "../../styles/pages/auditoria.css";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/clientes.css";

const ABAS = [
    { id: "gerais", nome: "Dados gerais", Icon: UserRound },
    { id: "comp", nome: "Dados complementares", Icon: FileText },
    { id: "anexos", nome: "Anexos", Icon: Paperclip },
    { id: "obs", nome: "Observações", Icon: MessageSquare },
    { id: "historico", nome: "Histórico", Icon: Clock }
];

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
    const [cobrancaDif, setCobrancaDif] = useState(false);

    useEffect(() => {
        if (!id) {
            setForm(contatoVazio());
            setCarregando(false);
            return;
        }
        let vivo = true;
        setCarregando(true);
        buscarCliente(id)
            .then((contato) => {
                if (vivo) {
                    setForm(contato);
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
                const pf = next.tipoPessoa === "fisica";
                next.consumidorFinal = pf || !icms;
                next.finalidade = next.consumidorFinal ? "CONSUMO" : "REVENDA";
            }
            return next;
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

    async function salvar() {
        if (!form.nome.trim()) {
            setAba("gerais");
            return;
        }
        setSalvando(true);
        try {
            if (id) {
                await atualizarCliente(id, form);
            } else {
                await salvarCliente(form);
            }
            navigate("/contatos#/");
        } catch {
            setAba("gerais");
        } finally {
            setSalvando(false);
        }
    }

    function addPessoa() {
        setForm((atual) => ({
            ...atual,
            pessoasContato: [...(atual.pessoasContato || []), { nome: "", setor: "", email: "", telefone: "", ramal: "" }]
        }));
    }

    const ehFisica = form.tipoPessoa === "fisica";
    const sugestaoFiscal = sugerirNatureza(form, naturezas);
    const novo = !id;
    const titulo = novo ? "Novo Contato" : (form.nome || "Contato");
    const cidadesOpcoes = form.municipio && !cidades.includes(form.municipio)
        ? [form.municipio, ...cidades]
        : cidades;

    return (
        <div className="ctt-page ctt-form-page nct">
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
                    <span className="nct-avatar" aria-hidden="true">
                        <UserRound size={22} />
                        <span className="nct-plus"><Plus size={12} /></span>
                    </span>
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
                                <input value={form.nome} onChange={(e) => setCampo("nome", e.target.value)} placeholder="Nome ou razão social do contato" />
                            </label>
                            <label className="span-5">
                                Fantasia
                                <input value={form.fantasia} onChange={(e) => setCampo("fantasia", e.target.value)} placeholder="Nome fantasia (opcional)" />
                            </label>
                            <label className="span-2">
                                Código
                                <input value={form.id || ""} disabled placeholder="Sequencial" />
                            </label>
                            <label className="span-3">
                                Tipo de pessoa
                                <select value={form.tipoPessoa} onChange={(e) => setCampo("tipoPessoa", e.target.value)}>
                                    {TIPOS_PESSOA.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                </select>
                            </label>
                            <label className="span-3">
                                <span>{ehFisica ? "CPF" : "CNPJ"} <em>*</em></span>
                                <input value={form.cpfCnpj} onChange={(e) => setCampo("cpfCnpj", e.target.value)} placeholder={ehFisica ? "000.000.000-00" : "00.000.000/0000-00"} />
                            </label>
                            <label className="span-3">
                                {ehFisica ? "RG" : "IE"}
                                <input value={ehFisica ? form.rg : form.ie} onChange={(e) => setCampo(ehFisica ? "rg" : "ie", e.target.value)} placeholder={ehFisica ? "Digite o RG" : "Inscrição estadual"} />
                            </label>
                            <label className="span-3">
                                Contribuinte
                                <select value={form.contribuinte} onChange={(e) => setCampo("contribuinte", e.target.value)}>
                                    {CONTRIBUINTES.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                </select>
                            </label>
                            <label className="span-4">
                                Inscrição Estadual
                                <input value={form.ie} onChange={(e) => setCampo("ie", e.target.value)} placeholder="Digite a inscrição estadual (opcional)" />
                            </label>
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
                        <div className="ctt-tipos nct-tipos">
                            <button type="button" className="nct-select" onClick={() => setTiposAbertos((v) => !v)}>
                                Selecione os tipos de contato
                            </button>
                            {tiposAbertos ? (
                                <div className="ctt-menu ctt-tipos-menu nct-tipos-menu">
                                    {TIPOS.map((t) => (
                                        <label key={t.id} className={(form.tipos || []).includes(t.id) ? "is-sel" : ""}>
                                            <input type="checkbox" checked={(form.tipos || []).includes(t.id)} onChange={() => toggleTipo(t.id)} />
                                            {rotuloTipoCapital(t.id)}
                                        </label>
                                    ))}
                                </div>
                            ) : null}
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
                                <input value={form.cep} onChange={(e) => setCampo("cep", e.target.value)} placeholder="00000-000" />
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
                            <label className="span-6">
                                Bairro
                                <input value={form.bairro} onChange={(e) => setCampo("bairro", e.target.value)} placeholder="Digite o bairro" />
                            </label>
                            <label className="span-3">
                                Número
                                <input value={form.numero} onChange={(e) => setCampo("numero", e.target.value)} placeholder="Nº" />
                            </label>
                            <label className="span-5">
                                Complemento
                                <input value={form.complemento} onChange={(e) => setCampo("complemento", e.target.value)} placeholder="Complemento (opcional)" />
                            </label>
                            {cobrancaDif ? (
                                <>
                                    <label className="span-3">
                                        CEP de cobrança
                                        <input value={form.cepCobranca || ""} onChange={(e) => setCampo("cepCobranca", e.target.value)} placeholder="00000-000" />
                                    </label>
                                    <label className="span-6">
                                        Endereço de cobrança
                                        <input value={form.enderecoCobranca || ""} onChange={(e) => setCampo("enderecoCobranca", e.target.value)} placeholder="Digite o endereço de cobrança" />
                                    </label>
                                    <label className="span-3">
                                        Bairro de cobrança
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

            {aba === "comp" ? (
                <section className="nct-card">
                <div className="ctt-grid">
                    <label className="span-4">
                        Estado Civil
                        <select value={form.estadoCivil} onChange={(e) => setCampo("estadoCivil", e.target.value)}>
                            <option value="">Selecione</option>
                            <option>Solteiro(a)</option>
                            <option>Casado(a)</option>
                            <option>Divorciado(a)</option>
                            <option>Viúvo(a)</option>
                        </select>
                    </label>
                    <label className="span-4">
                        Profissão
                        <input value={form.profissao} onChange={(e) => setCampo("profissao", e.target.value)} />
                    </label>
                    <label className="span-4">
                        Sexo
                        <select value={form.sexo} onChange={(e) => setCampo("sexo", e.target.value)}>
                            <option value="">Selecione</option>
                            <option>Feminino</option>
                            <option>Masculino</option>
                            <option>Outro</option>
                        </select>
                    </label>
                    <label className="span-4">
                        Data de nascimento
                        <input type="date" value={form.nascimento} onChange={(e) => setCampo("nascimento", e.target.value)} />
                    </label>
                    <label className="span-8">
                        Naturalidade
                        <input value={form.naturalidade} onChange={(e) => setCampo("naturalidade", e.target.value)} />
                    </label>
                    <label className="span-6">
                        Nome do pai
                        <input value={form.nomePai} onChange={(e) => setCampo("nomePai", e.target.value)} />
                    </label>
                    <label className="span-6">
                        CPF do pai
                        <input value={form.cpfPai} onChange={(e) => setCampo("cpfPai", e.target.value)} />
                    </label>
                    <label className="span-6">
                        Nome da mãe
                        <input value={form.nomeMae} onChange={(e) => setCampo("nomeMae", e.target.value)} />
                    </label>
                    <label className="span-6">
                        CPF da mãe
                        <input value={form.cpfMae} onChange={(e) => setCampo("cpfMae", e.target.value)} />
                    </label>
                    <label className="span-4">
                        Status no CRM
                        <select value={form.statusCrm} onChange={(e) => setCampo("statusCrm", e.target.value)}>
                            <option>Cliente</option>
                            <option>Lead</option>
                            <option>Prospect</option>
                        </select>
                        <small>Estágio deste cliente na gestão do relacionamento com clientes (CRM)</small>
                    </label>
                    <label className="span-4">
                        Vendedor
                        <input value={form.vendedor} onChange={(e) => setCampo("vendedor", e.target.value)} />
                        <small>Vendedor padrão para este cliente</small>
                    </label>
                    <label className="span-4">
                        Condição de pagamento
                        <input value={form.condicaoPagamento} onChange={(e) => setCampo("condicaoPagamento", e.target.value)} />
                        <small>Número de parcelas ou prazos padrão. Exemplo: 30,60, 3 ou 15, 2x</small>
                    </label>
                    <label className="span-4">
                        Data de criação
                        <input value={form.dataCadastro ? new Date(form.dataCadastro).toLocaleDateString("pt-BR") : ""} disabled />
                    </label>
                    <label className="span-4">
                        Lista de preço
                        <select value={form.listaPreco} onChange={(e) => setCampo("listaPreco", e.target.value)}>
                            <option value="">Selecione</option>
                            <option>Padrão</option>
                            <option>Atacado</option>
                        </select>
                    </label>
                    <h3 className="span-12">Financeiro</h3>
                    <label className="span-4">
                        Limite de crédito
                        <input value={form.limiteCredito} onChange={(e) => setCampo("limiteCredito", e.target.value)} />
                        <small>Para não limitar o crédito do cliente, deixe este campo zerado</small>
                    </label>
                </div>
                </section>
            ) : null}

            {aba === "anexos" ? (
                <section className="nct-card">
                <div className="ctt-anexos">
                    <label className="idx-pill int-add">
                        + procurar arquivo
                        <input
                            type="file"
                            hidden
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setCampo("anexos", [...(form.anexos || []), { nome: file.name, tam: file.size }]);
                                }
                            }}
                        />
                    </label>
                    <p>O tamanho do arquivo não deve ultrapassar 2Mb</p>
                    <ul>
                        {(form.anexos || []).map((a, i) => <li key={i}>{a.nome}</li>)}
                    </ul>
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
