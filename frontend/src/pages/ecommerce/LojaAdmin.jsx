import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ChevronLeft,
    Download,
    ExternalLink,
    Info,
    Plus,
    Trash2,
    Upload
} from "lucide-react";

import ROTAS from "../../constants/rotas";
import {
    LOJA_PADRAO,
    LOJA_SECOES,
    gerarApiKey,
    gravarArquivosLoja,
    gravarLoja,
    lerArquivosLoja,
    lerClientesLoja,
    lerLoja
} from "../../constants/loja";
import { FaFacebook, FaInstagram, FaPinterest, FaYoutube } from "react-icons/fa";
import { FaTiktok, FaXTwitter } from "react-icons/fa6";
import LogoMarca from "../loja/LogoMarca";
import Modulo from "../shared/Modulo";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/integracoes.css";
import "../../styles/pages/ferramentas.css";
import "../../styles/pages/loja-admin.css";

const REDES_CAMPOS = [
    { id: "facebook", nome: "Facebook", Icon: FaFacebook, placeholder: "facebook.com/" },
    { id: "twitter", nome: "X", Icon: FaXTwitter, placeholder: "twitter.com/" },
    { id: "pinterest", nome: "Pinterest", Icon: FaPinterest, placeholder: "pinterest.com/" },
    {
        id: "instagram",
        nome: "Instagram",
        Icon: FaInstagram,
        placeholder: "instagram.com/lojatemdetudovr",
        dica: "Informe o perfil do Instagram da loja. Pode ser só o usuário ou o endereço completo."
    },
    { id: "youtube", nome: "YouTube", Icon: FaYoutube, placeholder: "youtube.com/" },
    { id: "tiktok", nome: "TikTok", Icon: FaTiktok, placeholder: "tiktok.com/@" }
];

const TODAS = [...LOJA_SECOES.personalize, ...LOJA_SECOES.configuracoes];

function baixarArquivo(url, nome) {
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
}

function CardImagem({ titulo, dicas = [], acao, preview, padrao, onFile, onRemover, onBaixar }) {
    const inputRef = useRef(null);
    return (
        <article className="lja-midia">
            <header>
                <h3>
                    {titulo}
                    <span className="lja-tip" tabIndex={0}>
                        <Info size={14} />
                        <em className="lja-tip-box">
                            {dicas.map((texto) => <p key={texto}>{texto}</p>)}
                        </em>
                    </span>
                </h3>
                <button type="button" className="lja-ghost" onClick={() => inputRef.current?.click()}>
                    <Upload size={14} /> {acao}
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,.png,.jpg,.jpeg,.svg,.webp,.ico"
                    hidden
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) {
                            onFile(file);
                        }
                    }}
                />
            </header>
            <div className="lja-midia-stage">
                {preview ? (
                    <img src={preview} alt="" />
                ) : padrao}
                <div className="lja-midia-tools">
                    <button type="button" aria-label="Excluir" onClick={onRemover} disabled={!preview}>
                        <Trash2 size={16} />
                    </button>
                    <button type="button" aria-label="Baixar" onClick={onBaixar} disabled={!preview && !padrao}>
                        <Download size={16} />
                    </button>
                </div>
            </div>
        </article>
    );
}

function Campo({ label, hint, children }) {
    return (
        <label className="lja-campo">
            <span>{label}</span>
            {children}
            {hint ? <em>{hint}</em> : null}
        </label>
    );
}

export default function LojaAdmin() {
    const { secao = "logo" } = useParams();
    const navigate = useNavigate();
    const [cfg, setCfg] = useState(lerLoja);
    const [aviso, setAviso] = useState("");
    const [clientes] = useState(lerClientesLoja);
    const [arquivos, setArquivos] = useState(lerArquivosLoja);
    const atual = TODAS.find((s) => s.id === secao);

    if (!atual) {
        return <Modulo />;
    }

    function patch(parte) {
        setCfg((atualCfg) => ({ ...atualCfg, ...parte }));
    }

    function salvar() {
        gravarLoja(cfg);
        setAviso("Alterações publicadas na vitrine.");
    }

    function restaurar() {
        const padrao = structuredClone(LOJA_PADRAO);
        setCfg(padrao);
        gravarLoja(padrao);
        setAviso("Visual padrão da Tem de Tudo restaurado.");
    }

    return (
        <div className={secao === "redes" ? "lja-page lja-page-redes" : "lja-page"}>
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <span>loja virtual</span>
                <span>›</span>
                <span>{atual.nome.toLowerCase()}</span>
            </nav>
            <div className="lja-head">
                <div>
                    <button type="button" className="int-voltar" onClick={() => navigate("/loja-admin")}>
                        <ChevronLeft size={16} /> voltar
                    </button>
                    {secao === "redes" ? (
                        <div className="lja-head-row">
                            <h2>Redes sociais</h2>
                            <span className="lja-como lja-tip" tabIndex={0}>
                                <Info size={16} /> Como configurar
                                <em className="lja-tip-box">
                                    <p>Preencha o endereço de cada rede social da loja.</p>
                                    <p>Clique em Salvar alterações para publicar os ícones no rodapé da vitrine.</p>
                                </em>
                            </span>
                        </div>
                    ) : (
                        <>
                            <h2>{secao === "logo" ? "Alterar logo e ícone da loja" : atual.nome}</h2>
                            <p className="idx-sub">
                                {secao === "logo"
                                    ? "A logo aparece no topo da vitrine. O ícone é o favicon da aba do navegador."
                                    : "O que você salvar aqui aparece na vitrine pública, antes do login do ERP."}
                            </p>
                        </>
                    )}
                </div>
                {secao === "redes" ? null : (
                    <div className="lja-head-actions">
                        <a className="lja-ver" href="/" target="_blank" rel="noreferrer">
                            <ExternalLink size={16} /> ver loja
                        </a>
                        <button type="button" className="lja-ghost" onClick={restaurar}>restaurar padrão</button>
                        <button type="button" className="lja-save" onClick={salvar}>salvar</button>
                    </div>
                )}
            </div>
            {aviso ? <p className="int-aviso">{aviso}</p> : null}

            <div className="lja-body">
                <section className={secao === "redes" ? "lja-main lja-main-solto" : "lja-main"}>
                    {secao === "logo" ? (
                        <div className="lja-midias">
                            <CardImagem
                                titulo="Logo"
                                dicas={[
                                    "Tamanho mínimo recomendado: 200 x 200px.",
                                    "A logo será mostrada no topo da sua loja, em todas as páginas."
                                ]}
                                acao="Alterar logo"
                                preview={cfg.logo.url}
                                padrao={<LogoMarca url="" nome={cfg.dados.nome} />}
                                onFile={(file) => {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        const proximo = { ...cfg, logo: { ...cfg.logo, url: String(reader.result || "") } };
                                        setCfg(proximo);
                                        gravarLoja(proximo);
                                        setAviso("Logo publicada na vitrine.");
                                    };
                                    reader.readAsDataURL(file);
                                }}
                                onRemover={() => {
                                    const proximo = { ...cfg, logo: { ...cfg.logo, url: "" } };
                                    setCfg(proximo);
                                    gravarLoja(proximo);
                                    setAviso("Logo removida. Usamos o wordmark padrão.");
                                }}
                                onBaixar={() => baixarArquivo(cfg.logo.url || "/src/assets/logo/logo.svg", "logo-tem-de-tudo")}
                            />
                            <CardImagem
                                titulo="Ícone da página (Favicon)"
                                dicas={[
                                    "É recomendado o envio de um ícone no formato .ico para que seja suportado em todos os navegadores.",
                                    "O ícone, ou favicon, será mostrado no navegador do seu cliente ao lado do endereço da loja ou na aba, ao lado do título."
                                ]}
                                acao="Alterar ícone"
                                preview={cfg.logo.icone}
                                padrao={<img src="/favicon.svg" alt="" />}
                                onFile={(file) => {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        const proximo = { ...cfg, logo: { ...cfg.logo, icone: String(reader.result || "") } };
                                        setCfg(proximo);
                                        gravarLoja(proximo);
                                        setAviso("Favicon publicado na vitrine.");
                                    };
                                    reader.readAsDataURL(file);
                                }}
                                onRemover={() => {
                                    const proximo = { ...cfg, logo: { ...cfg.logo, icone: "" } };
                                    setCfg(proximo);
                                    gravarLoja(proximo);
                                    setAviso("Favicon restaurado.");
                                }}
                                onBaixar={() => baixarArquivo(cfg.logo.icone || "/favicon.svg", "favicon-tem-de-tudo")}
                            />
                        </div>
                    ) : null}

                    {secao === "visual" ? (
                        <div className="lja-grid2">
                            {[
                                ["corPrimaria", "Cor primária / botões"],
                                ["corPreco", "Cor do preço"],
                                ["corFundo", "Fundo"],
                                ["corTexto", "Texto"],
                                ["corMenu", "Menu"],
                                ["corMenuTxt", "Texto do menu"],
                                ["corIcone", "Ícones do cabeçalho"],
                                ["corWhatsapp", "Botão WhatsApp"]
                            ].map(([k, label]) => (
                                <Campo key={k} label={label}>
                                    <input
                                        type="color"
                                        value={cfg.visual[k] || "#000000"}
                                        onChange={(e) => patch({ visual: { ...cfg.visual, [k]: e.target.value } })}
                                    />
                                </Campo>
                            ))}
                            <Campo label="Fonte">
                                <input value={cfg.visual.fonte || ""} onChange={(e) => patch({ visual: { ...cfg.visual, fonte: e.target.value } })} />
                            </Campo>
                        </div>
                    ) : null}

                    {secao === "banners" ? (
                        <div className="lja-stack">
                            {cfg.banners.map((banner, idx) => (
                                <article key={banner.id} className="lja-card">
                                    <Campo label="Título">
                                        <input value={banner.titulo} onChange={(e) => {
                                            const banners = cfg.banners.map((b, i) => (i === idx ? { ...b, titulo: e.target.value } : b));
                                            patch({ banners });
                                        }} />
                                    </Campo>
                                    <Campo label="Subtítulo">
                                        <input value={banner.subtitulo} onChange={(e) => {
                                            const banners = cfg.banners.map((b, i) => (i === idx ? { ...b, subtitulo: e.target.value } : b));
                                            patch({ banners });
                                        }} />
                                    </Campo>
                                    <Campo label="Link">
                                        <input value={banner.link} onChange={(e) => {
                                            const banners = cfg.banners.map((b, i) => (i === idx ? { ...b, link: e.target.value } : b));
                                            patch({ banners });
                                        }} />
                                    </Campo>
                                    <label className="lja-check">
                                        <input
                                            type="checkbox"
                                            checked={banner.ativo}
                                            onChange={(e) => {
                                                const banners = cfg.banners.map((b, i) => (i === idx ? { ...b, ativo: e.target.checked } : b));
                                                patch({ banners });
                                            }}
                                        />
                                        ativo na home
                                    </label>
                                </article>
                            ))}
                        </div>
                    ) : null}

                    {secao === "html" ? (
                        <Campo label="HTML extra (rodapé / pixels)" hint="Entra no final da vitrine. Use com cuidado.">
                            <textarea rows={12} value={cfg.htmlExtra} onChange={(e) => patch({ htmlExtra: e.target.value })} />
                        </Campo>
                    ) : null}

                    {secao === "css" ? (
                        <Campo label="CSS da vitrine" hint="Aplicado só no site público, não no ERP.">
                            <textarea rows={14} value={cfg.cssExtra} onChange={(e) => patch({ cssExtra: e.target.value })} />
                        </Campo>
                    ) : null}

                    {secao === "redes" ? (
                        <>
                            <article className="lja-links">
                                <h3>
                                    Links
                                    <span className="lja-tip" tabIndex={0}>
                                        <Info size={14} />
                                        <em className="lja-tip-box">
                                            <p>Preencha os campos abaixo com os dados das Redes Sociais da sua empresa para deixá-las disponíveis na loja virtual.</p>
                                        </em>
                                    </span>
                                </h3>
                                <div className="lja-links-grid">
                                    {REDES_CAMPOS.map((rede) => (
                                        <label key={rede.id} className="lja-rede">
                                            <span>
                                                {rede.nome}
                                                {rede.dica ? (
                                                    <span className="lja-tip" tabIndex={0}>
                                                        <Info size={13} />
                                                        <em className="lja-tip-box"><p>{rede.dica}</p></em>
                                                    </span>
                                                ) : null}
                                            </span>
                                            <span className="lja-rede-in">
                                                <rede.Icon aria-hidden />
                                                <input
                                                    value={cfg.redes[rede.id] || ""}
                                                    placeholder={rede.placeholder}
                                                    onChange={(e) => patch({ redes: { ...cfg.redes, [rede.id]: e.target.value } })}
                                                />
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </article>
                            <div className="lja-foot-acoes">
                                <button
                                    type="button"
                                    className="lja-cancel"
                                    onClick={() => {
                                        patch({ redes: { ...lerLoja().redes } });
                                        setAviso("");
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button type="button" className="lja-save-li" onClick={salvar}>
                                    Salvar alterações
                                </button>
                            </div>
                        </>
                    ) : null}

                    {secao === "selos" ? (
                        <div className="lja-stack">
                            {cfg.selos.map((selo, idx) => (
                                <article key={selo.id} className="lja-card">
                                    <Campo label="Título">
                                        <input value={selo.titulo} onChange={(e) => {
                                            const selos = cfg.selos.map((s, i) => (i === idx ? { ...s, titulo: e.target.value } : s));
                                            patch({ selos });
                                        }} />
                                    </Campo>
                                    <Campo label="Texto">
                                        <input value={selo.texto} onChange={(e) => {
                                            const selos = cfg.selos.map((s, i) => (i === idx ? { ...s, texto: e.target.value } : s));
                                            patch({ selos });
                                        }} />
                                    </Campo>
                                </article>
                            ))}
                        </div>
                    ) : null}

                    {secao === "paginas" ? (
                        <div className="lja-stack">
                            {cfg.paginas.map((pagina, idx) => (
                                <article key={pagina.slug} className="lja-card">
                                    <Campo label="Título">
                                        <input value={pagina.titulo} onChange={(e) => {
                                            const paginas = cfg.paginas.map((p, i) => (i === idx ? { ...p, titulo: e.target.value } : p));
                                            patch({ paginas });
                                        }} />
                                    </Campo>
                                    <Campo label="Slug">
                                        <input value={pagina.slug} onChange={(e) => {
                                            const paginas = cfg.paginas.map((p, i) => (i === idx ? { ...p, slug: e.target.value } : p));
                                            patch({ paginas });
                                        }} />
                                    </Campo>
                                    <Campo label="Conteúdo HTML">
                                        <textarea rows={5} value={pagina.html} onChange={(e) => {
                                            const paginas = cfg.paginas.map((p, i) => (i === idx ? { ...p, html: e.target.value } : p));
                                            patch({ paginas });
                                        }} />
                                    </Campo>
                                    <a href={`/p/${pagina.slug}`} target="_blank" rel="noreferrer">abrir na vitrine</a>
                                </article>
                            ))}
                            <button
                                type="button"
                                className="lja-ghost"
                                onClick={() => patch({
                                    paginas: [...cfg.paginas, { slug: `pagina-${cfg.paginas.length + 1}`, titulo: "Nova página", html: "<p></p>" }]
                                })}
                            >
                                <Plus size={14} /> nova página
                            </button>
                        </div>
                    ) : null}

                    {secao === "email" ? (
                        <div className="lja-stack">
                            <Campo label="Remetente">
                                <input value={cfg.email.remetente} onChange={(e) => patch({ email: { ...cfg.email, remetente: e.target.value } })} />
                            </Campo>
                            <Campo label="Assunto de boas-vindas">
                                <input value={cfg.email.assuntoBoasVindas} onChange={(e) => patch({ email: { ...cfg.email, assuntoBoasVindas: e.target.value } })} />
                            </Campo>
                            <Campo label="HTML" hint="Use {{nome}} para o cliente.">
                                <textarea rows={8} value={cfg.email.htmlBoasVindas} onChange={(e) => patch({ email: { ...cfg.email, htmlBoasVindas: e.target.value } })} />
                            </Campo>
                        </div>
                    ) : null}

                    {secao === "video" ? (
                        <div className="lja-stack">
                            <label className="lja-check">
                                <input
                                    type="checkbox"
                                    checked={!!cfg.video?.ativo}
                                    onChange={(e) => patch({ video: { ...cfg.video, ativo: e.target.checked } })}
                                />
                                vídeo em destaque na home
                            </label>
                            <Campo label="Título">
                                <input value={cfg.video?.titulo || ""} onChange={(e) => patch({ video: { ...cfg.video, titulo: e.target.value } })} />
                            </Campo>
                            <Campo label="Link do YouTube">
                                <input value={cfg.video?.link || ""} onChange={(e) => patch({ video: { ...cfg.video, link: e.target.value } })} />
                            </Campo>
                            <Campo label="Texto dos produtos no vídeo">
                                <input value={cfg.video?.produtosTxt || ""} onChange={(e) => patch({ video: { ...cfg.video, produtosTxt: e.target.value } })} />
                            </Campo>
                            <Campo label="Busca dos produtos" hint="Regex simples, ex.: copa|fifa|album">
                                <input value={cfg.video?.busca || ""} onChange={(e) => patch({ video: { ...cfg.video, busca: e.target.value } })} />
                            </Campo>
                        </div>
                    ) : null}

                    {secao === "gerais" ? (
                        <div className="lja-stack">
                            <Campo label="Título do site">
                                <input value={cfg.gerais.tituloSite} onChange={(e) => patch({ gerais: { ...cfg.gerais, tituloSite: e.target.value } })} />
                            </Campo>
                            <Campo label="Descrição">
                                <input value={cfg.gerais.descricao} onChange={(e) => patch({ gerais: { ...cfg.gerais, descricao: e.target.value } })} />
                            </Campo>
                            <Campo label="Produtos por página">
                                <input
                                    type="number"
                                    min="8"
                                    max="60"
                                    value={cfg.gerais.produtosPorPagina}
                                    onChange={(e) => patch({ gerais: { ...cfg.gerais, produtosPorPagina: Number(e.target.value) } })}
                                />
                            </Campo>
                            <label className="lja-check">
                                <input
                                    type="checkbox"
                                    checked={cfg.gerais.mostrarEstoque}
                                    onChange={(e) => patch({ gerais: { ...cfg.gerais, mostrarEstoque: e.target.checked } })}
                                />
                                mostrar estoque na vitrine
                            </label>
                            <label className="lja-check">
                                <input
                                    type="checkbox"
                                    checked={cfg.gerais.vitrineAtiva}
                                    onChange={(e) => patch({ gerais: { ...cfg.gerais, vitrineAtiva: e.target.checked } })}
                                />
                                vitrine no ar (antes do login)
                            </label>
                        </div>
                    ) : null}

                    {secao === "dados" ? (
                        <div className="lja-grid2">
                            {Object.entries({
                                nome: "Nome fantasia",
                                razao: "Razão social",
                                cnpj: "CNPJ",
                                email: "E-mail",
                                telefone: "Telefone",
                                whatsapp: "WhatsApp (DDI+DDD+número)",
                                endereco: "Endereço",
                                cidade: "Cidade",
                                uf: "UF",
                                cep: "CEP",
                                horario: "Horário",
                                horarioSab: "Sábado",
                                dominio: "Domínio público"
                            }).map(([k, label]) => (
                                <Campo key={k} label={label}>
                                    <input value={cfg.dados[k] || ""} onChange={(e) => patch({ dados: { ...cfg.dados, [k]: e.target.value } })} />
                                </Campo>
                            ))}
                        </div>
                    ) : null}

                    {secao === "atendimento" ? (
                        <div className="lja-stack">
                            {(cfg.atendimento || []).map((contato, idx) => (
                                <article key={contato.id} className="lja-card">
                                    <Campo label="Tipo">
                                        <select
                                            value={contato.tipo}
                                            onChange={(e) => {
                                                const atendimento = cfg.atendimento.map((c, i) => (i === idx ? { ...c, tipo: e.target.value } : c));
                                                patch({ atendimento });
                                            }}
                                        >
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="telefone">Telefone</option>
                                        </select>
                                    </Campo>
                                    <Campo label="Número">
                                        <input
                                            value={contato.numero}
                                            onChange={(e) => {
                                                const atendimento = cfg.atendimento.map((c, i) => (i === idx ? { ...c, numero: e.target.value } : c));
                                                patch({ atendimento });
                                            }}
                                        />
                                    </Campo>
                                    <Campo label="Nome">
                                        <input
                                            value={contato.nome}
                                            onChange={(e) => {
                                                const atendimento = cfg.atendimento.map((c, i) => (i === idx ? { ...c, nome: e.target.value } : c));
                                                patch({ atendimento });
                                            }}
                                        />
                                    </Campo>
                                    <Campo label="Setor">
                                        <input
                                            value={contato.setor || ""}
                                            onChange={(e) => {
                                                const atendimento = cfg.atendimento.map((c, i) => (i === idx ? { ...c, setor: e.target.value } : c));
                                                patch({ atendimento });
                                            }}
                                        />
                                    </Campo>
                                    <Campo label="Foto (URL)">
                                        <input
                                            value={contato.foto || ""}
                                            onChange={(e) => {
                                                const atendimento = cfg.atendimento.map((c, i) => (i === idx ? { ...c, foto: e.target.value } : c));
                                                patch({ atendimento });
                                            }}
                                        />
                                    </Campo>
                                </article>
                            ))}
                            <button
                                type="button"
                                className="lja-ghost"
                                onClick={() => patch({
                                    atendimento: [...(cfg.atendimento || []), {
                                        id: `wp-${Date.now()}`,
                                        tipo: "whatsapp",
                                        numero: "",
                                        nome: "",
                                        setor: "Venda",
                                        foto: ""
                                    }]
                                })}
                            >
                                <Plus size={14} /> novo contato
                            </button>
                            <Campo label="Pix (%)">
                                <input
                                    type="number"
                                    min="0"
                                    max="90"
                                    value={cfg.pix?.desconto || 0}
                                    onChange={(e) => patch({ pix: { ...cfg.pix, ativo: true, desconto: Number(e.target.value) } })}
                                />
                            </Campo>
                        </div>
                    ) : null}

                    {secao === "usuarios" ? (
                        <div>
                            <p className="idx-sub">Clientes que se cadastraram na vitrine. Colaboradores do ERP continuam em Equipe.</p>
                            <table className="fer-table">
                                <thead>
                                    <tr><th>Nome</th><th>E-mail</th><th>Telefone</th></tr>
                                </thead>
                                <tbody>
                                    {clientes.map((c) => (
                                        <tr key={c.id}><td>{c.nome}</td><td>{c.email}</td><td>{c.telefone}</td></tr>
                                    ))}
                                    {!clientes.length ? <tr><td colSpan={3}>Nenhum cadastro na vitrine ainda.</td></tr> : null}
                                </tbody>
                            </table>
                            <p><Link to="/funcionarios">abrir usuários do ERP</Link></p>
                        </div>
                    ) : null}

                    {secao === "pagamentos" || secao === "envios" ? (
                        <div className="lja-stack">
                            {(secao === "pagamentos" ? cfg.pagamentos : cfg.envios).map((item, idx) => (
                                <label key={item.id} className="lja-check">
                                    <input
                                        type="checkbox"
                                        checked={item.ativo}
                                        onChange={(e) => {
                                            const lista = (secao === "pagamentos" ? cfg.pagamentos : cfg.envios)
                                                .map((x, i) => (i === idx ? { ...x, ativo: e.target.checked } : x));
                                            patch(secao === "pagamentos" ? { pagamentos: lista } : { envios: lista });
                                        }}
                                    />
                                    {item.nome}
                                </label>
                            ))}
                        </div>
                    ) : null}

                    {secao === "dominio" ? (
                        <div className="lja-stack">
                            <Campo label="Domínio próprio" hint="A vitrine hoje roda neste ERP. O domínio lembra o endereço público da loja.">
                                <input
                                    value={cfg.dominioProprio.host}
                                    onChange={(e) => patch({ dominioProprio: { ...cfg.dominioProprio, host: e.target.value } })}
                                />
                            </Campo>
                            <label className="lja-check">
                                <input
                                    type="checkbox"
                                    checked={cfg.dominioProprio.ssl}
                                    onChange={(e) => patch({ dominioProprio: { ...cfg.dominioProprio, ssl: e.target.checked } })}
                                />
                                HTTPS
                            </label>
                            <p className="idx-sub">Endereço atual desta instalação: {window.location.origin}</p>
                        </div>
                    ) : null}

                    {secao === "api" ? (
                        <div className="lja-stack">
                            <Campo label="Chave da API da loja" hint="Use para integrar a vitrine a outros sistemas.">
                                <input value={cfg.apiKey} readOnly />
                            </Campo>
                            <button
                                type="button"
                                className="lja-ghost"
                                onClick={() => patch({ apiKey: gerarApiKey() })}
                            >
                                gerar nova chave
                            </button>
                        </div>
                    ) : null}

                    {secao === "arquivos" ? (
                        <div className="lja-stack">
                            <Campo label="Enviar arquivo" hint="Fica no navegador para usar em logo, banners e páginas.">
                                <input
                                    type="file"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) {
                                            return;
                                        }
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            const lista = [{
                                                id: `arq-${Date.now()}`,
                                                nome: file.name,
                                                tipo: file.type,
                                                url: String(reader.result || "")
                                            }, ...arquivos];
                                            setArquivos(lista);
                                            gravarArquivosLoja(lista);
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                />
                            </Campo>
                            <ul className="lja-files">
                                {arquivos.map((arq) => (
                                    <li key={arq.id}>
                                        <span>{arq.nome}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const lista = arquivos.filter((a) => a.id !== arq.id);
                                                setArquivos(lista);
                                                gravarArquivosLoja(lista);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {secao !== "logo" && secao !== "redes" ? (
                    <div className="int-save">
                        <span>Publica na vitrine em /</span>
                        <button type="button" className="lja-save" onClick={salvar}>salvar alterações</button>
                    </div>
                    ) : null}
                </section>
            </div>
        </div>
    );
}
