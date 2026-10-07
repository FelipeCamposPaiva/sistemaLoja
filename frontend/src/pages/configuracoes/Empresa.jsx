import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Search } from "lucide-react";

import logoPadrao from "../../assets/logo/logo.svg";
import { formatarCnpj, formatarIe } from "../../constants/mascarasContato";
import ROTAS from "../../constants/rotas";
import { buscarCep } from "../../services/cep.service";
import { consultarCnpjReceita } from "../../services/cnpj.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";

const CHAVE = "erp-empresa-v1";
const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const SEGMENTOS = ["Papelaria", "Gráfica", "Presentes", "Livraria", "Informática", "Outros"];
const REGIMES = [
    "Simples nacional",
    "Simples nacional, excesso de sublimite",
    "Regime normal",
    "MEI"
];
const CANAIS = [
    { id: "email", nome: "E-mail" },
    { id: "telefone", nome: "Telefone" }
];

const PADRAO = {
    razao: "TEM DE TUDO PAPELARIA, PRESENTES E PERSONALIZADOS LTDA",
    fantasia: "TEM DE TUDO",
    endereco: "Avenida Visconde do Rio Branco",
    numero: "394",
    bairro: "Água Limpa",
    complemento: "392/Cond: D, E",
    cidade: "Volta Redonda",
    cep: "27.250-250",
    uf: "RJ",
    fone: "(24) 3343-1575",
    fax: "(24) 3343-1575",
    celular: "(24) 99872-1402",
    email: "atendimento@temdetudovr.com.br",
    site: "www.temdetudovr.com.br",
    segmento: "Papelaria",
    tipoPessoa: "juridica",
    cnpj: "40.424.076/0001-69",
    ie: "14.373.66-7",
    ieIsento: false,
    im: "081.296/00-2",
    suframa: "",
    cnae: "4755-5/02",
    regime: "Simples nacional",
    inscricoesSt: [{ uf: "", ie: "" }],
    logo: "",
    chamado: "Tem de Tudo",
    canais: ["email", "telefone"],
    adminNome: "Adeline Campos Silva",
    adminEmail: "adeline.lopes@hotmail.com",
    adminCelular: "(24) 99872-1402"
};

function ler() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (bruto && typeof bruto === "object") {
            return { ...PADRAO, ...bruto, inscricoesSt: bruto.inscricoesSt?.length ? bruto.inscricoesSt : PADRAO.inscricoesSt };
        }
    } catch {
        /* ignore */
    }
    return { ...PADRAO, inscricoesSt: PADRAO.inscricoesSt.map((item) => ({ ...item })) };
}

function formatarFone(valor) {
    const digitos = String(valor || "").replace(/\D/g, "").slice(0, 11);
    if (digitos.length < 3) {
        return digitos ? `(${digitos}` : "";
    }
    const ddd = digitos.slice(0, 2);
    const resto = digitos.slice(2);
    if (digitos.length <= 10) {
        return resto.length > 4 ? `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}` : `(${ddd}) ${resto}`;
    }
    return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
}

function formatarCepEmpresa(valor) {
    const digitos = String(valor || "").replace(/\D/g, "").slice(0, 8);
    if (digitos.length <= 2) {
        return digitos;
    }
    if (digitos.length <= 5) {
        return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
    }
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}-${digitos.slice(5)}`;
}

function formatarCnae(valor) {
    const digitos = String(valor || "").replace(/\D/g, "").slice(0, 7);
    if (digitos.length <= 4) {
        return digitos;
    }
    if (digitos.length === 5) {
        return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
    }
    return `${digitos.slice(0, 4)}-${digitos.slice(4, 5)}/${digitos.slice(5)}`;
}

function formatarIm(valor) {
    const digitos = String(valor || "").replace(/\D/g, "").slice(0, 9);
    if (digitos.length <= 3) {
        return digitos;
    }
    if (digitos.length <= 6) {
        return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
    }
    if (digitos.length <= 8) {
        return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}/${digitos.slice(6)}`;
    }
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}/${digitos.slice(6, 8)}-${digitos.slice(8)}`;
}

function Campo({ titulo, dica, ajuda, children, className = "" }) {
    return (
        <div className={`emp-campo ${className}`.trim()}>
            <span>
                {titulo}
                {ajuda ? <i className="emp-ajuda" title={ajuda}>?</i> : null}
            </span>
            {children}
            {dica ? <small>{dica}</small> : null}
        </div>
    );
}

export default function Empresa() {
    const navigate = useNavigate();
    const arquivoRef = useRef(null);
    const [form, setForm] = useState(ler);
    const [aviso, setAviso] = useState("");
    const [canaisAberto, setCanaisAberto] = useState(false);

    function setCampo(chave, valor) {
        setForm((atual) => ({ ...atual, [chave]: valor }));
        setAviso("");
    }

    function voltar() {
        navigate(ROTAS.CONFIGURACOES);
    }

    function salvar(evento) {
        evento.preventDefault();
        if (!String(form.razao || "").trim()) {
            setAviso("Informe a razão social.");
            return;
        }
        localStorage.setItem(CHAVE, JSON.stringify(form));
        setAviso("Dados da empresa salvos.");
    }

    async function aoSairCnpj() {
        if (String(form.cnpj || "").replace(/\D/g, "").length !== 14) {
            return;
        }
        try {
            const dados = await consultarCnpjReceita(form.cnpj);
            if (!dados) {
                return;
            }
            setForm((atual) => ({
                ...atual,
                razao: atual.razao || dados.nome,
                fantasia: atual.fantasia || dados.fantasia,
                cep: atual.cep || (dados.cep ? formatarCepEmpresa(dados.cep) : ""),
                endereco: atual.endereco || dados.endereco,
                numero: atual.numero || dados.numero,
                complemento: atual.complemento || dados.complemento,
                bairro: atual.bairro || dados.bairro,
                cidade: atual.cidade || dados.municipio,
                uf: atual.uf || dados.uf
            }));
        } catch {
            /* a consulta é um auxílio; o formulário continua editável */
        }
    }

    async function aoSairCep() {
        try {
            const dados = await buscarCep(form.cep);
            if (!dados) {
                return;
            }
            setForm((atual) => ({
                ...atual,
                endereco: atual.endereco || dados.endereco,
                bairro: atual.bairro || dados.bairro,
                cidade: atual.cidade || dados.municipio,
                uf: atual.uf || dados.uf
            }));
        } catch {
            /* ignore */
        }
    }

    function escolherLogo(evento) {
        const arquivo = evento.target.files?.[0];
        evento.target.value = "";
        if (!arquivo) {
            return;
        }
        if (arquivo.size > 2 * 1024 * 1024) {
            setAviso("O tamanho do arquivo não deve ultrapassar 2Mb.");
            return;
        }
        const leitor = new FileReader();
        leitor.onload = () => setCampo("logo", String(leitor.result || ""));
        leitor.readAsDataURL(arquivo);
    }

    function alternarCanal(id) {
        setForm((atual) => {
            const tem = atual.canais.includes(id);
            const canais = tem ? atual.canais.filter((item) => item !== id) : [...atual.canais, id];
            return { ...atual, canais };
        });
    }

    const textoCanais = form.canais.length === CANAIS.length
        ? `Todas selecionadas (${form.canais.length})`
        : form.canais.map((id) => CANAIS.find((item) => item.id === id)?.nome).filter(Boolean).join(", ") || "Nenhum selecionado";
    const logo = form.logo === "removida" ? "" : form.logo || logoPadrao;

    return (
        <form className="emp-page" onSubmit={salvar}>
            <div className="emp-top">
                <button type="button" className="emp-voltar" onClick={voltar}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <nav className="dash-crumb" aria-label="Trilha">
                    <Link to={ROTAS.INDICE}>início</Link>
                    <span>›</span>
                    <Link to={ROTAS.CONFIGURACOES}>configurações</Link>
                    <span>›</span>
                    <span>dados da empresa</span>
                </nav>
            </div>
            <h2>Dados da empresa</h2>
            <p className="emp-sub">Para facilitar o preenchimento dos dados, o ERP pode realizar consultas à Receita Federal através do CNPJ</p>
            {aviso ? <p className={aviso.startsWith("Dados") ? "emp-ok" : "emp-erro"}>{aviso}</p> : null}

            <Campo titulo="Razão social" dica="Nome completo da empresa">
                <input value={form.razao} onChange={(e) => setCampo("razao", e.target.value)} />
            </Campo>
            <Campo titulo="Fantasia" dica="Nome fantasia da empresa (será exibido no topo das telas do sistema)">
                <input value={form.fantasia} onChange={(e) => setCampo("fantasia", e.target.value)} />
            </Campo>
            <div className="emp-linha emp-end">
                <Campo titulo="Endereço" dica="Endereço completo (Exemplo: Rua Assis Brasil)">
                    <input value={form.endereco} onChange={(e) => setCampo("endereco", e.target.value)} />
                </Campo>
                <Campo titulo="Número">
                    <input value={form.numero} onChange={(e) => setCampo("numero", e.target.value)} />
                </Campo>
            </div>
            <div className="emp-linha emp-bairro">
                <Campo titulo="Bairro">
                    <input value={form.bairro} onChange={(e) => setCampo("bairro", e.target.value)} />
                </Campo>
                <Campo titulo="Complemento">
                    <input value={form.complemento} onChange={(e) => setCampo("complemento", e.target.value)} />
                </Campo>
            </div>
            <div className="emp-linha emp-cidade">
                <Campo titulo="Cidade">
                    <input value={form.cidade} onChange={(e) => setCampo("cidade", e.target.value)} />
                </Campo>
                <Campo titulo="CEP">
                    <input
                        value={form.cep}
                        onChange={(e) => setCampo("cep", formatarCepEmpresa(e.target.value))}
                        onBlur={aoSairCep}
                    />
                </Campo>
                <Campo titulo="UF">
                    <select value={form.uf} onChange={(e) => setCampo("uf", e.target.value)}>
                        {UFS.map((uf) => <option key={uf}>{uf}</option>)}
                    </select>
                </Campo>
            </div>
            <div className="emp-linha emp-3">
                <Campo titulo="Fone">
                    <input value={form.fone} onChange={(e) => setCampo("fone", formatarFone(e.target.value))} />
                </Campo>
                <Campo titulo="Fax">
                    <input value={form.fax} onChange={(e) => setCampo("fax", formatarFone(e.target.value))} />
                </Campo>
                <Campo titulo="Celular">
                    <input value={form.celular} onChange={(e) => setCampo("celular", formatarFone(e.target.value))} />
                </Campo>
            </div>
            <div className="emp-linha emp-2">
                <Campo titulo="E-mail" dica="Exemplo: atendimento@temdetudovr.com.br">
                    <input type="email" value={form.email} onChange={(e) => setCampo("email", e.target.value)} />
                </Campo>
                <Campo titulo="WebSite" dica="Página na web (Exemplo: www.temdetudovr.com.br)">
                    <input value={form.site} onChange={(e) => setCampo("site", e.target.value)} />
                </Campo>
            </div>
            <Campo titulo="Segmento de atuação" dica="Área de atuação que melhor representa sua empresa">
                <select value={form.segmento} onChange={(e) => setCampo("segmento", e.target.value)}>
                    {SEGMENTOS.map((item) => <option key={item}>{item}</option>)}
                </select>
            </Campo>

            <div className="emp-linha emp-fiscal">
                <Campo titulo="Tipo da Pessoa" dica="Pessoa Física ou Pessoa Jurídica">
                    <select value={form.tipoPessoa} onChange={(e) => setCampo("tipoPessoa", e.target.value)}>
                        <option value="juridica">Pessoa Jurídica</option>
                        <option value="fisica">Pessoa Física</option>
                    </select>
                </Campo>
                <Campo titulo="CNPJ">
                    <input
                        value={form.cnpj}
                        onChange={(e) => setCampo("cnpj", formatarCnpj(e.target.value))}
                        onBlur={aoSairCnpj}
                    />
                </Campo>
                <Campo titulo="Inscrição Estadual" dica="Inscrição Estadual do estabelecimento">
                    <span className="emp-ie">
                        <input
                            value={form.ie}
                            disabled={form.ieIsento}
                            onChange={(e) => setCampo("ie", formatarIe(e.target.value, form.uf))}
                        />
                        <label>
                            <input
                                type="checkbox"
                                checked={form.ieIsento}
                                onChange={(e) => setCampo("ieIsento", e.target.checked)}
                            />
                            IE Isento
                        </label>
                    </span>
                </Campo>
            </div>
            <div className="emp-linha emp-4">
                <Campo titulo="Inscrição Municipal">
                    <input value={form.im} onChange={(e) => setCampo("im", formatarIm(e.target.value))} />
                </Campo>
                <Campo titulo="Inscrição Suframa" ajuda="Inscrição na Superintendência da Zona Franca de Manaus.">
                    <input value={form.suframa} onChange={(e) => setCampo("suframa", e.target.value)} />
                </Campo>
                <Campo titulo="CNAE">
                    <input value={form.cnae} onChange={(e) => setCampo("cnae", formatarCnae(e.target.value))} />
                </Campo>
                <Campo titulo="Código de regime tributário" ajuda="Regime usado na emissão das notas fiscais.">
                    <select value={form.regime} onChange={(e) => setCampo("regime", e.target.value)}>
                        {REGIMES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                </Campo>
            </div>

            <section className="emp-bloco">
                <h3>Inscrições Estaduais dos Substitutos Tributários</h3>
                {form.inscricoesSt.map((item, indice) => (
                    <div className="emp-linha emp-st" key={indice}>
                        <Campo titulo="Estado">
                            <select
                                value={item.uf}
                                onChange={(e) => {
                                    const inscricoesSt = form.inscricoesSt.map((atual, i) => i === indice ? { ...atual, uf: e.target.value } : atual);
                                    setCampo("inscricoesSt", inscricoesSt);
                                }}
                            >
                                <option value="">Selecione</option>
                                {UFS.map((uf) => <option key={uf}>{uf}</option>)}
                            </select>
                        </Campo>
                        <Campo titulo="Inscrição Estadual">
                            <span className="emp-ie">
                                <input
                                    value={item.ie}
                                    onChange={(e) => {
                                        const inscricoesSt = form.inscricoesSt.map((atual, i) => (
                                            i === indice ? { ...atual, ie: formatarIe(e.target.value, item.uf || form.uf) } : atual
                                        ));
                                        setCampo("inscricoesSt", inscricoesSt);
                                    }}
                                />
                                <button
                                    type="button"
                                    className="emp-mais"
                                    aria-label="Adicionar outra inscrição"
                                    onClick={() => setCampo("inscricoesSt", [...form.inscricoesSt, { uf: "", ie: "" }])}
                                >
                                    <Plus size={16} />
                                </button>
                            </span>
                        </Campo>
                    </div>
                ))}
                <button
                    type="button"
                    className="emp-link"
                    onClick={() => setCampo("inscricoesSt", [...form.inscricoesSt, { uf: "", ie: "" }])}
                >
                    <Plus size={14} />
                    adicionar outra inscrição
                </button>
            </section>

            <section className="emp-bloco">
                <h3>Dados de cobrança utilizados pelo ERP</h3>
                <p>Configurar dados utilizados pelo ERP para gerar os boletos e as notas de serviço.</p>
                <Link className="emp-link" to={ROTAS.COBRANCA_BANCARIA}>alterar dados de cobrança</Link>
            </section>

            <section className="emp-bloco">
                <h3>Logo da empresa</h3>
                <p>Seu logo será exibido nas suas Notas Fiscais, pedidos, propostas, etc.</p>
                {logo ? <img className="emp-logo" src={logo} alt="Logo da empresa" /> : <div className="emp-logo is-vazio">Sem logo</div>}
                <div className="emp-logo-acoes">
                    <button type="button" className="emp-link" onClick={() => arquivoRef.current?.click()}>
                        <Search size={14} />
                        procurar arquivo
                    </button>
                    <button type="button" className="emp-link is-muted" onClick={() => setCampo("logo", "removida")}>
                        remover logo
                    </button>
                </div>
                <small>O tamanho do arquivo não deve ultrapassar 2Mb</small>
                <input ref={arquivoRef} type="file" accept="image/*" hidden onChange={escolherLogo} />
            </section>

            <section className="emp-bloco">
                <h3>Preferências de contato utilizados pelo ERP</h3>
                <p>Essa será a forma de contato que preferencialmente entraremos em contato com você.</p>
                <div className="emp-linha emp-2">
                    <Campo titulo="Como deseja ser chamado">
                        <input value={form.chamado} onChange={(e) => setCampo("chamado", e.target.value)} />
                    </Campo>
                    <div className="emp-campo">
                        <span>Canal de Comunicação</span>
                        <button type="button" className="emp-select" onClick={() => setCanaisAberto((aberto) => !aberto)}>
                            {textoCanais}
                        </button>
                        {canaisAberto ? (
                            <div className="emp-canais">
                                {CANAIS.map((canal) => (
                                    <label key={canal.id}>
                                        <input
                                            type="checkbox"
                                            checked={form.canais.includes(canal.id)}
                                            onChange={() => alternarCanal(canal.id)}
                                        />
                                        {canal.nome}
                                    </label>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            <section className="emp-bloco">
                <h3>Pessoa administradora da empresa</h3>
                <div className="emp-linha emp-admin">
                    <Campo titulo="Nome do sócio administrador">
                        <input value={form.adminNome} onChange={(e) => setCampo("adminNome", e.target.value)} />
                    </Campo>
                    <Campo titulo="E-mail">
                        <input type="email" value={form.adminEmail} onChange={(e) => setCampo("adminEmail", e.target.value)} />
                    </Campo>
                    <Campo titulo="Celular">
                        <input value={form.adminCelular} onChange={(e) => setCampo("adminCelular", formatarFone(e.target.value))} />
                    </Campo>
                </div>
            </section>

            <div className="emp-acoes">
                <button type="submit" className="emp-salvar">salvar</button>
                <button type="button" className="emp-cancelar" onClick={voltar}>cancelar</button>
            </div>
        </form>
    );
}
