import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Search, X } from "lucide-react";

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
    { id: "gerais", nome: "dados gerais" },
    { id: "comp", nome: "dados complementares" },
    { id: "anexos", nome: "anexos" },
    { id: "obs", nome: "observações" },
    { id: "historico", nome: "histórico" }
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

    return (
        <div className="ctt-page ctt-form-page">
            <nav className="dash-crumb" aria-label="Trilha">
                <button type="button" className="int-voltar" onClick={() => navigate("/contatos#/")}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <span>cadastros</span>
                <span>›</span>
                <Link to="/contatos#/">clientes e fornecedores</Link>
            </nav>

            <h2>Contato</h2>

            <div className="ctt-form-tabs">
                {ABAS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={aba === item.id ? "is-active" : ""}
                        onClick={() => setAba(item.id)}
                    >
                        {item.nome}
                    </button>
                ))}
            </div>

            {aba === "gerais" ? (
                <>
                    <div className="ctt-grid">
                        <label className="span-6">
                            Nome
                            <input value={form.nome} onChange={(e) => setCampo("nome", e.target.value)} placeholder="Nome ou Razão Social do contato" />
                        </label>
                        <label className="span-4">
                            Fantasia
                            <input value={form.fantasia} onChange={(e) => setCampo("fantasia", e.target.value)} />
                        </label>
                        <label className="span-2">
                            Código
                            <input value={form.id || ""} disabled />
                            <small>Sequencial</small>
                        </label>
                        <label className="span-3">
                            Tipo de pessoa
                            <select value={form.tipoPessoa} onChange={(e) => setCampo("tipoPessoa", e.target.value)}>
                                {TIPOS_PESSOA.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                            </select>
                        </label>
                        <label className="span-3">
                            {ehFisica ? "CPF" : "CNPJ"}
                            <input value={form.cpfCnpj} onChange={(e) => setCampo("cpfCnpj", e.target.value)} />
                        </label>
                        <label className="span-3">
                            {ehFisica ? "RG" : "IE"}
                            <input value={ehFisica ? form.rg : form.ie} onChange={(e) => setCampo(ehFisica ? "rg" : "ie", e.target.value)} />
                        </label>
                        <label className="span-3">
                            Contribuinte
                            <select value={form.contribuinte} onChange={(e) => setCampo("contribuinte", e.target.value)}>
                                {CONTRIBUINTES.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                            </select>
                        </label>
                        <label className="span-3">
                            Inscrição Estadual
                            <input value={form.ie} onChange={(e) => setCampo("ie", e.target.value)} />
                        </label>

                    <h3 className="span-12">Fiscal — natureza de operação</h3>
                    <p className="idx-sub span-12" style={{ margin: "0 0 8px" }}>
                        Ao vender, o pedido e a nota usam esta natureza. Se deixar em automático, o CFOP sai do estado, CPF/CNPJ, contribuinte e finalidade.
                    </p>
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
                    <p className="span-12 ctt-fiscal-preview">
                        {sugestaoFiscal.origem === "CADASTRO" ? "Cadastro: " : "Automática: "}
                        {rotuloNatureza(sugestaoFiscal)}
                        {sugestaoFiscal.motivo ? ` — ${sugestaoFiscal.motivo}` : ""}
                    </p>
                        <div className="span-5 ctt-tipos">
                            <span>Tipo de contato</span>
                            <button type="button" className="ctt-select" onClick={() => setTiposAbertos((v) => !v)}>
                                {(form.tipos || []).length} selecionada(s)
                            </button>
                            {tiposAbertos ? (
                                <div className="ctt-menu ctt-tipos-menu">
                                    {TIPOS.map((t) => (
                                        <label key={t.id} className={(form.tipos || []).includes(t.id) ? "is-sel" : ""}>
                                            <input type="checkbox" checked={(form.tipos || []).includes(t.id)} onChange={() => toggleTipo(t.id)} />
                                            {rotuloTipoCapital(t.id)}
                                        </label>
                                    ))}
                                    <button type="button" className="ctt-link">+ Criar novo tipo de contato</button>
                                </div>
                            ) : null}
                            <div className="ctt-tags">
                                {(form.tipos || []).map((t) => (
                                    <span key={t}>
                                        {rotuloTipoCapital(t)}
                                        <button type="button" onClick={() => toggleTipo(t)} aria-label="Remover tipo"><X size={12} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <h3>Endereço</h3>
                    <div className="ctt-grid">
                        <label className="span-3">
                            CEP
                            <span className="ctt-cep">
                                <input value={form.cep} onChange={(e) => setCampo("cep", e.target.value)} />
                                <Search size={15} />
                            </span>
                        </label>
                        <label className="span-5">
                            Município
                            <input value={form.municipio} onChange={(e) => setCampo("municipio", e.target.value)} />
                        </label>
                        <label className="span-2">
                            UF
                            <select value={form.uf} onChange={(e) => setCampo("uf", e.target.value)}>
                                <option value="">Selecione</option>
                                {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                            </select>
                        </label>
                        <label className="span-8">
                            Endereço
                            <input value={form.endereco} onChange={(e) => setCampo("endereco", e.target.value)} />
                        </label>
                        <label className="span-4">
                            Bairro
                            <input value={form.bairro} onChange={(e) => setCampo("bairro", e.target.value)} />
                        </label>
                        <label className="span-3">
                            Número
                            <input value={form.numero} onChange={(e) => setCampo("numero", e.target.value)} />
                        </label>
                        <label className="span-5">
                            Complemento
                            <input value={form.complemento} onChange={(e) => setCampo("complemento", e.target.value)} />
                        </label>
                        <label className="span-12 ctt-check-line">
                            <input type="checkbox" />
                            Possui endereço de cobrança diferente do endereço principal
                        </label>
                    </div>

                    <h3>Contato</h3>
                    <div className="ctt-grid">
                        <label className="span-4">
                            Telefone
                            <input value={form.telefone} onChange={(e) => setCampo("telefone", e.target.value)} />
                        </label>
                        <label className="span-4">
                            Telefone Adicional
                            <input value={form.telefone2} onChange={(e) => setCampo("telefone2", e.target.value)} />
                        </label>
                        <label className="span-4">
                            Celular
                            <input value={form.celular} onChange={(e) => setCampo("celular", e.target.value)} />
                        </label>
                        <label className="span-4">
                            WebSite
                            <input value={form.website} onChange={(e) => setCampo("website", e.target.value)} />
                        </label>
                        <label className="span-4">
                            E-mail
                            <input value={form.email} onChange={(e) => setCampo("email", e.target.value)} />
                        </label>
                        <label className="span-4">
                            E-mail para envio de NFe
                            <input value={form.emailNfe} onChange={(e) => setCampo("emailNfe", e.target.value)} />
                        </label>
                        <label className="span-12">
                            Observações do contato
                            <textarea rows={3} value={form.observacoes} onChange={(e) => setCampo("observacoes", e.target.value)} />
                        </label>
                    </div>

                    <h3>Pessoas de contato</h3>
                    <table className="fer-table">
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
                    <button type="button" className="ctt-link" onClick={addPessoa}>+ adicionar contato</button>
                </>
            ) : null}

            {aba === "comp" ? (
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
            ) : null}

            {aba === "anexos" ? (
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
            ) : null}

            {aba === "obs" ? (
                <label className="ctt-obs">
                    Observações
                    <textarea rows={10} value={form.observacoes} onChange={(e) => setCampo("observacoes", e.target.value)} />
                </label>
            ) : null}

            {aba === "historico" ? (
                <HistoricoAuditoria entidade="CLIENTE" registroId={id} />
            ) : null}

            <footer className="ctt-footer">
                <button type="button" className="idx-pill int-add" onClick={salvar} disabled={salvando}>
                    {salvando ? "salvando..." : "salvar"}
                </button>
                <button type="button" className="ctt-ghost" onClick={() => navigate("/contatos#/")}>cancelar</button>
            </footer>
        </div>
    );
}
