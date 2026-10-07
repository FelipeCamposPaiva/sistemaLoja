import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff, MoreHorizontal, Plus, Settings, Star, Trash2 } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";
import "../../styles/pages/multi-empresas.css";

const CHAVE = "erp-multi-empresas-v1";

const CONFIG_PADRAO = {
    enviarPara: [],
    receberDe: [],
    considerarEstoque: true,
    estoqueApi: "grupo",
    saldoKit: "final",
    atualizarCliente: false,
    atualizarProduto: true,
    syncContatos: false,
    syncProdutos: true,
    vinculo: "sku-gtin-descricao",
    opcionais: {
        localizacao: false,
        estoqueMin: false,
        fornecedor: true,
        precoCusto: true,
        precoVenda: true,
        origem: true
    },
    syncFiscal: false,
    validarDuplicidade: true,
    cancelarOrigem: false,
    naturezaDestino: false,
    enviarPedidosAuto: false
};

const SEMENTE = [
    {
        id: "agua-limpa",
        nome: "TEM DE TUDO PAPELARIA, PRESENTES E PERSONALIZADOS LTDA",
        cnpj: "40.424.076/0001-69",
        inicial: "T",
        cor: "#eab308",
        principal: true,
        config: { ...CONFIG_PADRAO, enviarPara: ["santo-agostinho"], receberDe: ["santo-agostinho"] }
    },
    {
        id: "santo-agostinho",
        nome: "49.635.218 FELIPE CAMPOS PAIVA",
        cnpj: "49.635.218/0001-01",
        inicial: "4",
        cor: "#f97316",
        principal: false,
        config: { ...CONFIG_PADRAO, enviarPara: ["agua-limpa"], receberDe: ["agua-limpa"] }
    }
];

const OPCIONAIS = [
    { id: "localizacao", nome: "Localização" },
    { id: "estoqueMin", nome: "Estoque mínimo e máximo" },
    { id: "fornecedor", nome: "Fornecedor" },
    { id: "precoCusto", nome: "Preço de custo e médio" },
    { id: "precoVenda", nome: "Preço de venda e promocional" },
    { id: "origem", nome: "Origem do produto" }
];

function normalizar(item) {
    return {
        ...item,
        config: {
            ...CONFIG_PADRAO,
            ...(item.config || {}),
            opcionais: { ...CONFIG_PADRAO.opcionais, ...(item.config?.opcionais || {}) },
            enviarPara: Array.isArray(item.config?.enviarPara) ? item.config.enviarPara : [],
            receberDe: Array.isArray(item.config?.receberDe) ? item.config.receberDe : []
        }
    };
}

function ler() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (Array.isArray(bruto) && bruto.length) {
            return bruto.map(normalizar);
        }
    } catch {
        /* semente */
    }
    return SEMENTE.map(normalizar);
}

function gravarLista(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
}

export default function MultiEmpresas() {
    const navigate = useNavigate();
    const { hash } = useLocation();
    const [lista, setLista] = useState(ler);
    const [menu, setMenu] = useState("");
    const [aviso, setAviso] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [verSenha, setVerSenha] = useState(false);
    const [recebeAberto, setRecebeAberto] = useState(false);
    const [listaAberta, setListaAberta] = useState(false);
    const [rascunhoId, setRascunhoId] = useState("");
    const [rascunho, setRascunho] = useState(null);

    const editId = hash.startsWith("#edit=") ? decodeURIComponent(hash.slice("#edit=".length)) : "";
    const empresa = editId ? lista.find((item) => item.id === editId) : null;
    if (empresa && rascunhoId !== empresa.id) {
        setRascunhoId(empresa.id);
        setRascunho(empresa.config);
        setRecebeAberto(false);
        setListaAberta(false);
        setAviso("");
    }
    const adicionar = hash === "#add";

    function salvarLista(proxima) {
        setLista(proxima);
        gravarLista(proxima);
    }

    function irLista() {
        setAviso("");
        setMenu("");
        navigate("/multi_empresas");
    }

    function definirPrincipal(id) {
        salvarLista(lista.map((item) => ({ ...item, principal: item.id === id })));
        setMenu("");
    }

    function remover(id) {
        const alvo = lista.find((item) => item.id === id);
        if (!alvo) {
            return;
        }
        if (alvo.principal) {
            setAviso("Defina outra empresa principal antes de remover esta.");
            setMenu("");
            return;
        }
        salvarLista(lista.filter((item) => item.id !== id));
        setMenu("");
    }

    function atualizarConfig(parcial) {
        setRascunho((atual) => ({ ...atual, ...parcial }));
        setAviso("");
    }

    function alternarDestino(campo, id) {
        const atual = (rascunho || empresa?.config)?.[campo] || [];
        const proximo = atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id];
        atualizarConfig({ [campo]: proximo });
    }

    function conectar(evento) {
        evento.preventDefault();
        if (!email.trim() || !senha) {
            setAviso("Informe o e-mail e a senha do administrador.");
            return;
        }
        setSenha("");
        setAviso("O login em outra empresa ainda não sai por este ERP. A senha não foi guardada.");
    }

    function salvarEdicao(evento) {
        evento.preventDefault();
        const proxima = lista.map((item) => item.id === empresa.id ? { ...item, config: rascunho } : item);
        salvarLista(proxima);
        setAviso("Configuração da empresa salva.");
    }

    if (adicionar) {
        return (
            <div className="emp-page me-page">
                <Topo onVoltar={irLista} />
                {aviso ? <p className={aviso.includes("não") || aviso.includes("Informe") ? "emp-erro" : "emp-ok"}>{aviso}</p> : null}
                <div className="me-add">
                    <section>
                        <h2>Configurar Multiempresa</h2>
                        <p>Centralize a operação de todos os seus CNPJs em uma única tela. Ganhe agilidade na troca de contextos, controle estoques de forma integrada e escale seu ecossistema de vendas sem complicações.</p>
                        <div className="me-orbita" aria-hidden="true">
                            <span>T</span>
                        </div>
                    </section>
                    <form onSubmit={conectar}>
                        <h2>Conectar empresa</h2>
                        <p>Para poder utilizar todos os benefícios do multiempresas você precisa realizar o login com o administrador da sua empresa</p>
                        <label>
                            E-mail ou login
                            <input value={email} autoComplete="off" onChange={(evento) => { setEmail(evento.target.value); setAviso(""); }} />
                        </label>
                        <label>
                            Senha
                            <span className="me-senha">
                                <input type={verSenha ? "text" : "password"} value={senha} autoComplete="new-password" onChange={(evento) => { setSenha(evento.target.value); setAviso(""); }} />
                                <button type="button" aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"} onClick={() => setVerSenha((atual) => !atual)}>
                                    {verSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </span>
                        </label>
                        <button type="submit" className="emp-salvar">conectar empresa</button>
                    </form>
                </div>
            </div>
        );
    }

    if (empresa) {
        const outras = lista.filter((item) => item.id !== empresa.id);
        const cfg = rascunho || empresa.config;
        return (
            <form className="emp-page me-page me-edit" onSubmit={salvarEdicao}>
                <Topo onVoltar={irLista} />
                <h2>Configurar Multiempresa</h2>
                <p className="me-intro">Personalize as regras operacionais e o compartilhamento de dados entre empresas para garantir uma gestão precisa e independente. Todas as alterações feitas aqui serão aplicadas exclusivamente a este CNPJ, permitindo que você controle o que deve ser comum ou específico em cada unidade do seu ecossistema.</p>
                {aviso ? <p className="emp-ok">{aviso}</p> : null}
                <div className="me-resumo">
                    <div>
                        <small>Empresa</small>
                        <strong><i style={{ background: empresa.cor }}>{empresa.inicial}</i>{empresa.nome}</strong>
                    </div>
                    <div>
                        <small>CNPJ</small>
                        <strong>{empresa.cnpj}</strong>
                    </div>
                    <div>
                        <small>Status</small>
                        <strong>Conectada</strong>
                    </div>
                </div>

                <section className="me-bloco">
                    <header>
                        <div>
                            <h3>Para quais unidades enviar dados desta empresa?</h3>
                            <p>Escolha as unidades para enviar os dados desta empresa. A sincronização de estoque, produtos e contatos será aplicada apenas aos CNPJs selecionados.</p>
                        </div>
                        <button type="button" className="emp-link" onClick={() => setRecebeAberto((atual) => !atual)}>
                            De quais unidades esta empresa recebe?
                        </button>
                    </header>
                    <ul>
                        {outras.map((item) => (
                            <li key={item.id}>
                                <label>
                                    <input type="checkbox" checked={cfg.enviarPara.includes(item.id)} onChange={() => alternarDestino("enviarPara", item.id)} />
                                    <i style={{ background: item.cor }}>{item.inicial}</i>
                                    {item.nome}
                                    <small>{item.cnpj}</small>
                                </label>
                            </li>
                        ))}
                    </ul>
                    {recebeAberto ? (
                        <ul>
                            {outras.map((item) => (
                                <li key={`r-${item.id}`}>
                                    <label>
                                        <input type="checkbox" checked={cfg.receberDe.includes(item.id)} onChange={() => alternarDestino("receberDe", item.id)} />
                                        <i style={{ background: item.cor }}>{item.inicial}</i>
                                        {item.nome}
                                        <small>{item.cnpj}</small>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </section>

                <Bloco titulo="Compartilhamento de estoque">
                    <Linha texto="Ao habilitar esta opção, o estoque desta empresa será somado ao saldo total enviado para seus canais de venda e ficará visível para as demais unidades selecionadas.">
                        <Switch ligado={cfg.considerarEstoque} onClick={() => atualizarConfig({ considerarEstoque: !cfg.considerarEstoque })} nome="Considerar estoque desta empresa" />
                    </Linha>
                    <Linha texto="Define qual saldo será retornado nas consultas via API: o estoque consolidado de todas as empresas ou apenas o estoque individual desta empresa.">
                        <p>Qual estoque será retornado nas consultas via API?</p>
                        <Radio nome="De todas as empresas do grupo" marcado={cfg.estoqueApi === "grupo"} onChange={() => atualizarConfig({ estoqueApi: "grupo" })} />
                        <Radio nome="Apenas desta empresa" marcado={cfg.estoqueApi === "empresa"} onChange={() => atualizarConfig({ estoqueApi: "empresa" })} />
                    </Linha>
                    <Linha texto="Escolha entre somar o saldo dos kits já montados nas diversas empresas ou calcular com base na soma dos componentes individuais disponíveis em cada empresa.">
                        <p>Qual saldo usar para calcular o estoque dos kits?</p>
                        <Radio nome="Saldo final do kit" marcado={cfg.saldoKit === "final"} onChange={() => atualizarConfig({ saldoKit: "final" })} />
                        <small>Soma apenas as unidades de kits que já foram montadas e estão com saldo positivo em cada uma das empresas.</small>
                        <Radio nome="Saldo dos itens do kit" marcado={cfg.saldoKit === "itens"} onChange={() => atualizarConfig({ saldoKit: "itens" })} />
                        <small>Verifica o estoque de todos os componentes individuais em todas as empresas e calcula quantos kits é possível montar com esse saldo unificado.</small>
                    </Linha>
                </Bloco>

                <Bloco titulo="Compartilhamento de cadastros">
                    <Linha texto="Quando habilitado, os dados serão sincronizados ao enviar um pedido de venda entre empresas conectadas.">
                        <p>Atualizar dados ao enviar pedidos</p>
                        <Switch ligado={cfg.atualizarCliente} onClick={() => atualizarConfig({ atualizarCliente: !cfg.atualizarCliente })} nome="Dados do cliente" />
                        <Switch ligado={cfg.atualizarProduto} onClick={() => atualizarConfig({ atualizarProduto: !cfg.atualizarProduto })} nome="Dados do produto" />
                    </Linha>
                    <Linha texto="Quando habilitado, dados alterados, incluídos e excluídos serão automaticamente sincronizados nas empresas conectadas.">
                        <p>Sincronizar dados automaticamente</p>
                        <Switch ligado={cfg.syncContatos} onClick={() => atualizarConfig({ syncContatos: !cfg.syncContatos })} nome="Dados de contatos" />
                        <Switch ligado={cfg.syncProdutos} onClick={() => atualizarConfig({ syncProdutos: !cfg.syncProdutos })} nome="Dados de produtos" />
                    </Linha>
                    <Linha texto="Marque quais informações serão utilizadas para vincular os produtos entre empresas. O primeiro valor encontrado será utilizado. Com o vínculo criado na primeira sincronização, estas regras valem apenas para a primeira vez que o produto é enviado.">
                        <p>Regras de vínculo para a sincronização de produtos</p>
                        <Radio nome="SKU" marcado={cfg.vinculo === "sku"} onChange={() => atualizarConfig({ vinculo: "sku" })} />
                        <Radio nome="SKU ou GTIN" marcado={cfg.vinculo === "sku-gtin"} onChange={() => atualizarConfig({ vinculo: "sku-gtin" })} />
                        <Radio nome="SKU, GTIN ou descrição do produto" marcado={cfg.vinculo === "sku-gtin-descricao"} onChange={() => atualizarConfig({ vinculo: "sku-gtin-descricao" })} />
                    </Linha>
                    <Linha texto="Marque os dados opcionais de produtos que devem ser compartilhados entre as empresas.">
                        <p>Compartilhamento de informações opcionais de produtos</p>
                        {OPCIONAIS.map((item) => (
                            <label key={item.id} className="me-check">
                                <input
                                    type="checkbox"
                                    checked={cfg.opcionais[item.id]}
                                    onChange={() => atualizarConfig({ opcionais: { ...cfg.opcionais, [item.id]: !cfg.opcionais[item.id] } })}
                                />
                                {item.nome}
                            </label>
                        ))}
                        <button type="button" className="emp-link" onClick={() => setListaAberta((atual) => !atual)}>
                            Lista de dados compartilhados entre empresas
                        </button>
                        {listaAberta ? (
                            <ul className="me-lista">
                                {OPCIONAIS.map((item) => (
                                    <li key={item.id}>{item.nome}: {cfg.opcionais[item.id] ? "compartilhado" : "não compartilhado"}</li>
                                ))}
                            </ul>
                        ) : null}
                    </Linha>
                </Bloco>

                <Bloco titulo="Compartilhamento de dados fiscais">
                    <Linha texto="Obtém os dados da nota fiscal para pedidos faturados em outras empresas do grupo.">
                        <Switch ligado={cfg.syncFiscal} onClick={() => atualizarConfig({ syncFiscal: !cfg.syncFiscal })} nome="Sincronizar dados fiscais automaticamente" />
                    </Linha>
                    <Linha texto="Quando ativo, impede que o mesmo pedido seja faturado em mais de uma empresa do grupo.">
                        <Switch ligado={cfg.validarDuplicidade} onClick={() => atualizarConfig({ validarDuplicidade: !cfg.validarDuplicidade })} nome="Validar duplicidade de faturamento em pedidos compartilhados" />
                    </Linha>
                </Bloco>

                <Bloco titulo="Compartilhamento de pedidos de venda">
                    <Linha texto="Todos os pedidos enviados para empresas do grupo serão cancelados, e a reserva será removida da empresa de origem.">
                        <Switch ligado={cfg.cancelarOrigem} onClick={() => atualizarConfig({ cancelarOrigem: !cfg.cancelarOrigem })} nome="Marcar pedidos transferidos como cancelados na empresa de origem" />
                    </Linha>
                    <Linha texto="Se habilitado, ao compartilhar um pedido entre as empresas é considerada a natureza padrão da empresa de destino para o pedido de venda.">
                        <Switch ligado={cfg.naturezaDestino} onClick={() => atualizarConfig({ naturezaDestino: !cfg.naturezaDestino })} nome="Considerar a natureza de operação padrão da empresa de destino ao enviar pedidos" />
                    </Linha>
                    <Linha texto="Conforme regra por origem, integração ou UF dos pedidos, fará envio automático para empresas do grupo.">
                        <p>Enviar pedidos automaticamente</p>
                        <Switch ligado={cfg.enviarPedidosAuto} onClick={() => atualizarConfig({ enviarPedidosAuto: !cfg.enviarPedidosAuto })} nome="Enviar pedidos de venda automaticamente" />
                    </Linha>
                </Bloco>

                <div className="emp-acoes">
                    <button type="submit" className="emp-salvar">salvar</button>
                    <button type="button" className="emp-cancelar" onClick={irLista}>cancelar</button>
                </div>
            </form>
        );
    }

    return (
        <div className="emp-page me-page">
            <Topo onVoltar={() => navigate(ROTAS.CONFIGURACOES)} />
            <header className="me-head">
                <div>
                    <h2>Multiempresa</h2>
                    <p>Centralize a gestão de todos os seus CNPJs em um único lugar para ganhar agilidade no dia a dia. Aqui, você configura o compartilhamento de estoque, clientes e produtos entre suas unidades, garantindo que o ecossistema do ERP trabalhe a favor da escala do seu negócio com total controle financeiro e operacional.</p>
                </div>
                <button type="button" className="emp-salvar" onClick={() => navigate({ pathname: "/multi_empresas", hash: "add" })}>
                    <Plus size={14} />
                    adicionar empresa
                </button>
            </header>
            {aviso ? <p className="emp-erro">{aviso}</p> : null}
            <div className="me-cards">
                {lista.map((item) => (
                    <article key={item.id}>
                        <i style={{ background: item.cor }}>{item.inicial}</i>
                        <div>
                            <strong title={item.nome}>{item.nome}</strong>
                            <small>{item.cnpj}</small>
                            <button type="button" className="emp-link" onClick={() => navigate({ pathname: "/multi_empresas", hash: `edit=${item.id}` })}>
                                <Settings size={14} />
                                configurar
                            </button>
                        </div>
                        <button type="button" className="me-mais" aria-label={`Ações de ${item.nome}`} onClick={() => setMenu(menu === item.id ? "" : item.id)}>
                            <MoreHorizontal size={16} />
                        </button>
                        {item.principal ? <Star size={14} className="me-estrela" aria-label="empresa principal" /> : null}
                        {menu === item.id ? (
                            <div className="me-menu">
                                <button type="button" onClick={() => definirPrincipal(item.id)}><Star size={14} /> empresa principal</button>
                                <button type="button" onClick={() => remover(item.id)}><Trash2 size={14} /> remover empresa</button>
                            </div>
                        ) : null}
                    </article>
                ))}
            </div>
        </div>
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
                <span>multiempresa</span>
            </nav>
        </div>
    );
}

function Bloco({ titulo, children }) {
    return (
        <section className="me-bloco">
            <h3>{titulo}</h3>
            {children}
        </section>
    );
}

function Linha({ texto, children }) {
    return (
        <div className="me-linha">
            <div>{children}</div>
            <p>{texto}</p>
        </div>
    );
}

function Switch({ ligado, onClick, nome }) {
    return (
        <button type="button" className="me-switch" onClick={onClick}>
            <span className={ligado ? "is-on" : ""} role="switch" aria-checked={ligado} />
            {nome}
        </button>
    );
}

function Radio({ nome, marcado, onChange }) {
    return (
        <label className="me-radio">
            <input type="radio" checked={marcado} onChange={onChange} />
            {nome}
        </label>
    );
}
