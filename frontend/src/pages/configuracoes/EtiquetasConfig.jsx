import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Copy, Pencil, Printer, Settings, Trash2, X } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";
import "../../styles/pages/etiquetas-config.css";

const CHAVE = "erp-etiquetas-config-v1";
const CHAVE_LOGO = "erp-etiquetas-zpl-logo-v1";

export const TIPOS_ETIQUETA = [
    { id: "C", nome: "Clientes e fornecedores", titulo: "Etiqueta de clientes e fornecedores" },
    { id: "P", nome: "Produtos", titulo: "Etiqueta de produtos" },
    { id: "V", nome: "Volumes", titulo: "Etiqueta de volumes" },
    { id: "T", nome: "Transportadora", titulo: "Etiqueta de transportadora" },
    { id: "S", nome: "Separação", titulo: "Etiqueta de separação" },
    { id: "R", nome: "Correios", titulo: "Etiqueta de correios" }
];

const DIMENSOES = [
    "Pimaco 6080 — 25,4 x 66,7 mm",
    "Pimaco 6081 — 25,4 x 101,6 mm",
    "Pimaco 6181 — 25,4 x 84,7 mm",
    "10 x 5 cm",
    "10 x 15 cm",
    "A4 3 x 8"
];

const SEMENTE = [
    { id: 1, descricao: "Etiqueta padrão para correios", tipo: "R", modo: "Página", orientacao: "Retrato", dimensao: "10 x 15 cm" },
    { id: 2, descricao: "Etiqueta padrão para transportadora", tipo: "T", modo: "Página", orientacao: "Retrato", dimensao: "10 x 15 cm" },
    { id: 3, descricao: "Pimaco", tipo: "P", modo: "Página", orientacao: "Retrato", dimensao: "Pimaco 6080 — 25,4 x 66,7 mm" }
];

function lerLista() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (Array.isArray(bruto)) {
            return bruto;
        }
    } catch {
        /* seed */
    }
    return SEMENTE.map((item) => ({ ...item }));
}

function nomeTipo(id) {
    return TIPOS_ETIQUETA.find((item) => item.id === id)?.nome || id;
}

function tituloTipo(id) {
    return TIPOS_ETIQUETA.find((item) => item.id === id)?.titulo || "Etiqueta";
}

function imprimirTeste(etiqueta) {
    const janela = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
    if (!janela) {
        return false;
    }
    const titulo = etiqueta.descricao || "Etiqueta";
    janela.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Página de testes</title>
<style>
body{font-family:sans-serif;margin:24px}
h1{font-size:16px}
.folha{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.etiq{border:1px dashed #999;height:90px;padding:8px;font-size:12px}
</style></head><body>
<h1>${titulo}</h1>
<div class="folha">${Array.from({ length: 8 }, () => `<article class="etiq">${titulo}<br>${nomeTipo(etiqueta.tipo)} · ${etiqueta.orientacao || "Retrato"}</article>`).join("")}</div>
<script>window.print()<\/script>
</body></html>`);
    janela.document.close();
    return true;
}

export default function EtiquetasConfig() {
    const navigate = useNavigate();
    const { hash } = useLocation();
    const arquivoRef = useRef(null);
    const [lista, setLista] = useState(lerLista);
    const [menu, setMenu] = useState(null);
    const [logoAberto, setLogoAberto] = useState(false);
    const [logo, setLogo] = useState(() => localStorage.getItem(CHAVE_LOGO) || "");
    const [aviso, setAviso] = useState("");
    const [tipoEscolhido, setTipoEscolhido] = useState("P");

    const incluir = hash === "#add" || hash === "#/add";
    const novoTipo = hash.match(/^#add\/([A-Z])$/);
    const edicao = hash.match(/^#edit\/(\d+)$/);
    const registro = edicao ? lista.find((item) => String(item.id) === edicao[1]) : null;
    const formulario = novoTipo?.[1] || registro?.tipo || "";

    function gravar(proxima) {
        setLista(proxima);
        localStorage.setItem(CHAVE, JSON.stringify(proxima));
    }

    function irLista() {
        setAviso("");
        navigate({ pathname: "/configuracoes_etiquetas", hash: "list" });
    }

    function salvarForm(evento) {
        evento.preventDefault();
        const dados = new FormData(evento.currentTarget);
        const descricao = String(dados.get("descricao") || "").trim();
        if (!descricao) {
            setAviso("Informe a descrição da etiqueta.");
            return;
        }
        const item = {
            id: registro?.id || Date.now(),
            descricao,
            tipo: formulario,
            modo: String(dados.get("modo") || "Página"),
            orientacao: String(dados.get("orientacao") || "Retrato"),
            dimensao: String(dados.get("dimensao") || "")
        };
        gravar(registro ? lista.map((atual) => atual.id === registro.id ? item : atual) : [item, ...lista]);
        irLista();
    }

    function clonar(item) {
        gravar([{ ...item, id: Date.now(), descricao: `${item.descricao} (cópia)` }, ...lista]);
        setMenu(null);
    }

    function excluir(id) {
        gravar(lista.filter((item) => item.id !== id));
        setMenu(null);
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
        leitor.onload = () => {
            const url = String(leitor.result || "");
            setLogo(url);
            localStorage.setItem(CHAVE_LOGO, url);
            setAviso("");
        };
        leitor.readAsDataURL(arquivo);
    }

    return (
        <div className="etiq-page">
            <div className="emp-top">
                <button type="button" className="emp-voltar" onClick={() => navigate(ROTAS.CONFIGURACOES)}>
                    <ChevronLeft size={16} />
                    voltar
                </button>
                <nav className="dash-crumb" aria-label="Trilha">
                    <Link to={ROTAS.INDICE}>início</Link>
                    <span>›</span>
                    <Link to={ROTAS.CONFIGURACOES}>configurações</Link>
                    <span>›</span>
                    <span>etiquetas</span>
                </nav>
            </div>

            {formulario ? (
                <form className="etiq-form" onSubmit={salvarForm}>
                    <h2>{tituloTipo(formulario)}</h2>
                    {aviso ? <p className="emp-erro">{aviso}</p> : null}
                    <label>
                        Descrição
                        <input name="descricao" defaultValue={registro?.descricao || ""} />
                    </label>
                    <div className="etiq-dupla">
                        <label>
                            Modo de impressão
                            <select name="modo" defaultValue={registro?.modo || "Página"}>
                                <option>Página</option>
                                <option>Bobina</option>
                            </select>
                        </label>
                        <label>
                            Orientação
                            <select name="orientacao" defaultValue={registro?.orientacao || "Retrato"}>
                                <option>Retrato</option>
                                <option>Paisagem</option>
                            </select>
                        </label>
                    </div>
                    <label>
                        Dimensões da etiqueta
                        <select name="dimensao" defaultValue={registro?.dimensao || ""}>
                            <option value="">Selecione</option>
                            {DIMENSOES.map((item) => <option key={item}>{item}</option>)}
                        </select>
                    </label>
                    <div className="emp-acoes">
                        <button type="submit" className="emp-salvar">salvar</button>
                        <button
                            type="button"
                            className="emp-link"
                            onClick={() => {
                                const dados = new FormData(document.querySelector(".etiq-form"));
                                const ok = imprimirTeste({
                                    descricao: String(dados.get("descricao") || "Etiqueta"),
                                    tipo: formulario,
                                    orientacao: String(dados.get("orientacao") || "Retrato")
                                });
                                if (!ok) {
                                    setAviso("O navegador bloqueou a página de testes.");
                                }
                            }}
                        >
                            <Printer size={14} />
                            imprimir página de testes
                        </button>
                        <button type="button" className="emp-cancelar" onClick={irLista}>cancelar</button>
                    </div>
                </form>
            ) : (
                <>
                    <header className="etiq-head">
                        <h2>Configurações das etiquetas</h2>
                        <div>
                            <button type="button" className="emp-link" onClick={() => { setLogoAberto(true); setMenu(null); }}>
                                alterar logo para ZPL
                            </button>
                            <button type="button" className="emp-salvar" onClick={() => navigate({ pathname: "/configuracoes_etiquetas", hash: "add" })}>
                                incluir etiqueta
                            </button>
                        </div>
                    </header>
                    {aviso ? <p className="emp-erro">{aviso}</p> : null}
                    <table className="etiq-tabela">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Tipo de etiqueta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lista.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <button type="button" className="etiq-menu-btn" aria-label={`Ações de ${item.descricao}`} onClick={() => setMenu(menu === item.id ? null : item.id)}>
                                            <Settings size={14} />
                                        </button>
                                        {item.descricao}
                                        {menu === item.id ? (
                                            <div className="etiq-menu">
                                                <button type="button" onClick={() => navigate({ pathname: "/configuracoes_etiquetas", hash: `edit/${item.id}` })}>
                                                    <Pencil size={14} /> editar
                                                </button>
                                                <button type="button" onClick={() => clonar(item)}>
                                                    <Copy size={14} /> clonar etiqueta
                                                </button>
                                                <button type="button" onClick={() => excluir(item.id)}>
                                                    <Trash2 size={14} /> excluir etiqueta
                                                </button>
                                            </div>
                                        ) : null}
                                    </td>
                                    <td>{nomeTipo(item.tipo)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {incluir ? (
                <aside className="etiq-painel">
                    <h3>Incluir etiqueta</h3>
                    <p>Selecione o tipo de etiqueta que deseja configurar</p>
                    <div className="etiq-tipos" role="radiogroup">
                        {TIPOS_ETIQUETA.filter((item) => item.id !== "R").map((item) => (
                            <label key={item.id} className={tipoEscolhido === item.id ? "is-on" : ""}>
                                {item.nome}
                                <input
                                    type="radio"
                                    name="tipo"
                                    checked={tipoEscolhido === item.id}
                                    onChange={() => setTipoEscolhido(item.id)}
                                />
                            </label>
                        ))}
                    </div>
                    <div className="etiq-painel-acoes">
                        <button type="button" className="emp-salvar" onClick={() => navigate({ pathname: "/configuracoes_etiquetas", hash: `add/${tipoEscolhido}` })}>
                            continuar
                        </button>
                        <button type="button" className="emp-cancelar" onClick={irLista}>cancelar</button>
                    </div>
                </aside>
            ) : null}

            {logoAberto ? (
                <aside className="etiq-painel">
                    <header>
                        <h3>Alterar logo para ZPL</h3>
                        <button type="button" onClick={() => setLogoAberto(false)} aria-label="Fechar"><X size={16} /></button>
                    </header>
                    <p>Utilize um logotipo apenas em preto e branco para obter a melhor qualidade de impressão. Atualmente, este logo só é utilizado para etiquetas de correios.</p>
                    {logo ? <img src={logo} alt="Logo ZPL" className="etiq-logo" /> : null}
                    <button type="button" className="emp-link" onClick={() => arquivoRef.current?.click()}>procurar arquivo</button>
                    <small>O tamanho do arquivo não deve ultrapassar 2Mb</small>
                    <input ref={arquivoRef} type="file" accept="image/*" hidden onChange={escolherLogo} />
                </aside>
            ) : null}
        </div>
    );
}
