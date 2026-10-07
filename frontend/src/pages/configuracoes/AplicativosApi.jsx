import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, KeyRound, Plus } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";
import "../../styles/pages/aplicativos-api.css";

const CHAVE = "erp-aplicativos-api-v1";

const MODULOS = [
    { id: "contatos", nome: "Contatos", texto: "Gerencie contatos" },
    { id: "produtos", nome: "Produtos", texto: "Gerencie produtos" },
    { id: "notas", nome: "Notas fiscais", texto: "Gerencie notas fiscais" },
    { id: "expedicao", nome: "Expedição", texto: "Gerencie expedições de produtos e acompanhe envios" },
    { id: "pedidos", nome: "Pedidos", texto: "Gerencie pedidos" },
    { id: "separacao", nome: "Separação", texto: "Organize a separação de produtos" },
    { id: "marcas", nome: "Marcas", texto: "Gerencie marcas" },
    { id: "estoque", nome: "Estoque", texto: "Gerencie estoque de produtos" },
    { id: "precos", nome: "Lista de Preços", texto: "Gerencie listas de preços" },
    { id: "envio", nome: "Forma de Envio", texto: "Consulte formas de envio disponíveis" },
    { id: "pagamento", nome: "Forma de Pagamento", texto: "Consulte formas de pagamento disponíveis" },
    { id: "intermediadores", nome: "Intermediadores", texto: "Consulte intermediadores" },
    { id: "categorias", nome: "Categorias", texto: "Gerencie categorias de produtos" },
    { id: "conta", nome: "Informações da Conta", texto: "Consulte informações da sua conta" },
    { id: "gatilhos", nome: "Gatilhos", texto: "Acompanhe gatilhos automáticos de contas e estoque" },
    { id: "receber", nome: "Contas a Receber", texto: "Gerencie contas a receber e acompanhe recebimentos" },
    { id: "pagar", nome: "Contas a Pagar", texto: "Gerencie contas a pagar e acompanhe pagamentos" },
    { id: "os", nome: "Ordem de Serviço", texto: "Gerencie ordens de serviço" },
    { id: "oc", nome: "Ordem de Compra", texto: "Gerencie ordens de compra" },
    { id: "servicos", nome: "Serviços", texto: "Gerencie serviços disponíveis" },
    { id: "recebimento", nome: "Forma de Recebimento", texto: "Consulte formas de recebimento disponíveis" },
    { id: "crm", nome: "CRM", texto: "Gerencie dados do CRM: relacionamento com clientes e oportunidades" },
    { id: "usuarios", nome: "Usuários", texto: "Consulte dados dos usuários do sistema" },
    { id: "depositos", nome: "Depósitos", texto: "Gerencie depósitos de produtos" },
    { id: "orcamentos", nome: "Orçamentos", texto: "Gerencie propostas comerciais (orçamentos)" },
    { id: "anuncios", nome: "Anúncios", texto: "Gerencie seus anúncios" },
    { id: "caixa", nome: "Caixa", texto: "Gerencie o caixa da empresa" },
    { id: "extrato", nome: "Extrato bancário", texto: "Consulte e trate os extratos bancários importados" }
];

const ACOES = [
    { id: "leitura", nome: "Leitura" },
    { id: "incluir", nome: "Incluir e editar" },
    { id: "excluir", nome: "Excluir" }
];

const VAZIO = { leitura: false, incluir: false, excluir: false };

const SEMENTE = [
    {
        id: "tiny",
        nome: "Tiny",
        url: "",
        criadoEm: "2025-08-31",
        clientId: "local-tiny-id",
        clientSecret: "local-tiny-secret",
        permissoes: {}
    }
];

function permissoesDe(bruto) {
    const base = {};
    MODULOS.forEach((modulo) => {
        const item = bruto?.[modulo.id] || {};
        base[modulo.id] = {
            leitura: Boolean(item.leitura),
            incluir: Boolean(item.incluir),
            excluir: Boolean(item.excluir)
        };
    });
    return base;
}

function ler() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (Array.isArray(bruto)) {
            return bruto.filter((item) => item && item.id && item.nome);
        }
    } catch {
        /* semente */
    }
    return SEMENTE.map((item) => ({ ...item }));
}

function gravar(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
}

function formatarData(iso) {
    const [ano, mes, dia] = String(iso || "").split("-");
    if (!ano || !mes || !dia) {
        return "";
    }
    return `${dia}/${mes}/${ano}`;
}

function hojeIso() {
    const data = new Date();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${data.getFullYear()}-${mes}-${dia}`;
}

function chaveLocal() {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return [...bytes].map((item) => item.toString(16).padStart(2, "0")).join("");
}

function linhaCheia(perm) {
    return ACOES.every((acao) => perm[acao.id]);
}

export default function AplicativosApi() {
    const navigate = useNavigate();
    const { hash } = useLocation();
    const [lista, setLista] = useState(ler);
    const [aviso, setAviso] = useState("");
    const editId = hash.startsWith("#edit=") ? decodeURIComponent(hash.slice("#edit=".length)) : "";
    const existente = editId ? lista.find((item) => item.id === editId) : null;
    const formulario = hash === "#add" || Boolean(editId);

    function irLista() {
        setAviso("");
        navigate("/aplicativos_api");
    }

    if (!formulario) {
        return (
            <div className="emp-page api-page">
                <Topo onVoltar={() => navigate(ROTAS.CONFIGURACOES)} />
                <header className="api-head">
                    <div>
                        <h2>Aplicativos API</h2>
                        <p>Por meio dos aplicativos, é possível conectar o Sistema ERP a aplicações externas, compartilhando informações via API (Application Programming Interface). Ao cadastrar um aplicativo, você pode gerenciar os níveis de permissão que deseja conceder e gerar chaves de acesso para realizar a conexão com sua conta neste ERP.</p>
                    </div>
                    <button type="button" className="emp-salvar" onClick={() => navigate({ pathname: "/aplicativos_api", hash: "add" })}>
                        <Plus size={14} />
                        novo aplicativo
                    </button>
                </header>
                <div className="api-cards">
                    {lista.map((item) => (
                        <article key={item.id}>
                            <i aria-hidden="true"><KeyRound size={16} /></i>
                            <div>
                                <strong>{item.nome}</strong>
                                <small>criado em {formatarData(item.criadoEm)}</small>
                            </div>
                            <button type="button" className="emp-link" onClick={() => navigate({ pathname: "/aplicativos_api", hash: `edit=${item.id}` })}>
                                detalhes
                            </button>
                        </article>
                    ))}
                </div>
            </div>
        );
    }

    if (editId && !existente) {
        return (
            <div className="emp-page api-page">
                <Topo onVoltar={irLista} />
                <p className="emp-erro">Aplicativo não encontrado.</p>
            </div>
        );
    }

    return (
        <Formulario
            existente={existente}
            aviso={aviso}
            setAviso={setAviso}
            onVoltar={irLista}
            onSalvar={(item) => {
                const proxima = existente
                    ? lista.map((atual) => atual.id === existente.id ? item : atual)
                    : [item, ...lista];
                setLista(proxima);
                gravar(proxima);
                navigate({ pathname: "/aplicativos_api", hash: `edit=${item.id}` });
                setAviso("Aplicativo salvo. As chaves abaixo valem só neste ERP.");
            }}
        />
    );
}

function Formulario({ existente, aviso, setAviso, onVoltar, onSalvar }) {
    const [nome, setNome] = useState(existente?.nome || "");
    const [url, setUrl] = useState(existente?.url || "");
    const [permissoes, setPermissoes] = useState(() => permissoesDe(existente?.permissoes));
    const todos = MODULOS.every((modulo) => linhaCheia(permissoes[modulo.id]));

    function definir(id, parcial) {
        setPermissoes((atual) => ({ ...atual, [id]: { ...atual[id], ...parcial } }));
        setAviso("");
    }

    function marcarLinha(id, ligado) {
        definir(id, ligado ? { leitura: true, incluir: true, excluir: true } : { ...VAZIO });
    }

    function marcarTodos(ligado) {
        const proximo = {};
        MODULOS.forEach((modulo) => {
            proximo[modulo.id] = ligado ? { leitura: true, incluir: true, excluir: true } : { ...VAZIO };
        });
        setPermissoes(proximo);
        setAviso("");
    }

    function salvar(evento) {
        evento.preventDefault();
        if (!nome.trim()) {
            setAviso("Informe o nome do aplicativo.");
            return;
        }
        if (url.trim() && !/^https?:\/\//i.test(url.trim())) {
            setAviso("A URL de redirecionamento precisa começar com http:// ou https://.");
            return;
        }
        const alguma = MODULOS.some((modulo) => ACOES.some((acao) => permissoes[modulo.id][acao.id]));
        if (!alguma) {
            setAviso("Marque ao menos uma permissão.");
            return;
        }
        onSalvar({
            id: existente?.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
            nome: nome.trim(),
            url: url.trim(),
            criadoEm: existente?.criadoEm || hojeIso(),
            clientId: existente?.clientId || `local-${chaveLocal()}`,
            clientSecret: existente?.clientSecret || `local-${chaveLocal()}`,
            permissoes
        });
    }

    return (
        <form className="emp-page api-page" onSubmit={salvar}>
            <div className="api-top">
                <Topo onVoltar={onVoltar} />
                <a className="emp-link" href="https://tiny.com.br/ajuda" target="_blank" rel="noreferrer">documentação</a>
            </div>
            {aviso ? <p className={aviso.startsWith("Aplicativo salvo") ? "emp-ok" : "emp-erro"}>{aviso}</p> : null}
            <label className="api-campo">
                <span>Nome do aplicativo</span>
                <input value={nome} onChange={(evento) => { setNome(evento.target.value); setAviso(""); }} />
                <small>Utilize um nome para identificar o aplicativo em sua lista</small>
            </label>
            <label className="api-campo">
                <span>URL de Redirecionamento</span>
                <input value={url} onChange={(evento) => { setUrl(evento.target.value); setAviso(""); }} placeholder="https://" />
                <small>Endereço de redirecionamento para autenticação do aplicativo</small>
            </label>
            <section className="api-chaves">
                <h3>Chaves de acesso</h3>
                {existente?.clientId ? (
                    <div className="api-chave-box">
                        <p><KeyRound size={14} /> Identificador: {existente.clientId}</p>
                        <p>Chave: {existente.clientSecret}</p>
                        <small>Estas chaves identificam o aplicativo só neste ERP. Elas não autenticam na API da Olist.</small>
                    </div>
                ) : (
                    <div className="api-chave-box">
                        <KeyRound size={14} />
                        Suas chaves de acesso serão geradas após definir as permissões e salvar
                    </div>
                )}
            </section>
            <section>
                <h3>Permissões do aplicativo</h3>
                <button type="button" className="api-todos" onClick={() => marcarTodos(!todos)}>
                    <span className={todos ? "is-on" : ""} role="switch" aria-checked={todos} />
                    Marcar todos
                </button>
                <table className="api-tabela">
                    <thead>
                        <tr>
                            <th>Acesso ao módulo</th>
                            {ACOES.map((acao) => <th key={acao.id}>{acao.nome}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {MODULOS.map((modulo) => {
                            const perm = permissoes[modulo.id];
                            return (
                                <tr key={modulo.id}>
                                    <td>
                                        <label>
                                            <input type="checkbox" checked={linhaCheia(perm)} onChange={(evento) => marcarLinha(modulo.id, evento.target.checked)} />
                                            <span>
                                                <strong>{modulo.nome}</strong>
                                                <small>{modulo.texto}</small>
                                            </span>
                                        </label>
                                    </td>
                                    {ACOES.map((acao) => (
                                        <td key={acao.id}>
                                            <input
                                                type="checkbox"
                                                aria-label={`${modulo.nome}: ${acao.nome}`}
                                                checked={perm[acao.id]}
                                                onChange={(evento) => definir(modulo.id, { [acao.id]: evento.target.checked })}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>
            <div className="emp-acoes">
                <button type="submit" className="emp-salvar">salvar</button>
                <button type="button" className="emp-cancelar" onClick={onVoltar}>cancelar</button>
            </div>
        </form>
    );
}

function Topo({ onVoltar }) {
    return (
        <div className="emp-top">
            <button type="button" className="emp-voltar" onClick={onVoltar}>
                <ChevronLeft size={16} />
                voltar
            </button>
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <Link to={ROTAS.CONFIGURACOES}>configurações</Link>
                <span>›</span>
                <span>aplicativos api</span>
            </nav>
        </div>
    );
}
