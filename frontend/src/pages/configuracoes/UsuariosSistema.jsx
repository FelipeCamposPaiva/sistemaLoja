import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, MoreHorizontal, Plus, Search } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/usuarios-sistema.css";

const CHAVE = "erp-usuarios-sistema-v1";
const LIMITE = 10;
const PERFIS = ["ADMIN", "GERENTE", "VENDEDOR", "GRAFICA"];
const AMARELO = "#f5c518";

const SEMENTE = [
    { id: 1, nome: "Adeline", email: "adeline.lopes@hotmail.com", perfil: "ADMIN", cor: "#f4a4b0" },
    { id: 2, nome: "Arthur", email: "thurgb@gmail.com", perfil: "VENDEDOR", cor: AMARELO },
    { id: 3, nome: "Canella & Santos Contabilidade LTDA", email: "fscontabil@canellasa.com.br", perfil: "CANELLA & SANTOS CONTABIL", cor: "#e11d48" },
    { id: 4, nome: "Elen", email: "elenlacerda0201@gmail.com", perfil: "VENDEDOR", cor: AMARELO },
    { id: 5, nome: "Felipe", email: "atendimento@temdetudovr.com.br", perfil: "GERENTE", cor: AMARELO },
    { id: 6, nome: "Gabriel", email: "GabrielivanL90004@gmail.com", perfil: "GRAFICA", cor: AMARELO },
    { id: 7, nome: "Gabriela", email: "gabriela@temdetudovr.com.br", perfil: "VENDEDOR", cor: AMARELO },
    { id: 8, nome: "Maria Antonia", email: "maria.antonia@temdetudovr.com.br", perfil: "VENDEDOR", cor: AMARELO },
    { id: 9, nome: "Miguel", email: "Miguel.campos.lopes@gmail.com", perfil: "GERENTE", cor: AMARELO },
    { id: 10, nome: "Nadia", email: "nadia.carmo24@gmail.com", perfil: "VENDEDOR", cor: AMARELO }
];

function ler() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (Array.isArray(bruto) && bruto.length) {
            return bruto;
        }
    } catch {
        /* seed */
    }
    return SEMENTE.map((item) => ({ ...item }));
}

function gravar(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
}

function inicial(nome) {
    return String(nome || "?").trim().charAt(0).toUpperCase() || "?";
}

function classePerfil(perfil) {
    if (perfil === "ADMIN") {
        return "is-admin";
    }
    if (perfil === "VENDEDOR") {
        return "is-vend";
    }
    if (perfil === "GERENTE") {
        return "is-ger";
    }
    if (perfil === "GRAFICA") {
        return "is-graf";
    }
    return "is-ext";
}

const VAZIO = { nome: "", email: "", perfil: "VENDEDOR" };

export default function UsuariosSistema() {
    const navigate = useNavigate();
    const [lista, setLista] = useState(ler);
    const [busca, setBusca] = useState("");
    const [menu, setMenu] = useState(null);
    const [mais, setMais] = useState(false);
    const [perfis, setPerfis] = useState(false);
    const [form, setForm] = useState(null);
    const [aviso, setAviso] = useState("");

    const termo = busca.trim().toLowerCase();
    const visiveis = useMemo(() => {
        if (!termo) {
            return lista;
        }
        return lista.filter((item) => `${item.nome} ${item.email}`.toLowerCase().includes(termo));
    }, [lista, termo]);

    const vendedores = lista.filter((item) => item.perfil === "VENDEDOR").length;
    const ocupacao = Math.min(100, Math.round((lista.length / LIMITE) * 100));

    function salvarLista(proxima) {
        setLista(proxima);
        gravar(proxima);
    }

    function abrirNovo() {
        setMais(false);
        setMenu(null);
        setForm({ ...VAZIO, id: null });
        setAviso("");
    }

    function abrirEdicao(usuario) {
        setMenu(null);
        setForm({ id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: PERFIS.includes(usuario.perfil) ? usuario.perfil : "VENDEDOR" });
        setAviso("");
    }

    function salvarForm(evento) {
        evento.preventDefault();
        const nome = form.nome.trim();
        const email = form.email.trim();
        if (!nome || !email) {
            setAviso("Informe nome e e-mail.");
            return;
        }
        if (form.id) {
            salvarLista(lista.map((item) => item.id === form.id ? { ...item, nome, email, perfil: form.perfil } : item));
        } else {
            salvarLista([{
                id: Date.now(),
                nome,
                email,
                perfil: form.perfil,
                cor: AMARELO
            }, ...lista]);
        }
        setForm(null);
        setAviso("");
    }

    function excluir(id) {
        salvarLista(lista.filter((item) => item.id !== id));
        setMenu(null);
    }

    return (
        <div className="us-page">
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
                    <span>usuários do sistema</span>
                </nav>
            </div>

            <header className="us-head">
                <h2>Usuários do sistema</h2>
                <div className="us-acoes">
                    <Link to={ROTAS.VENDEDORES}>gerenciar vendedores</Link>
                    <button type="button" onClick={() => { setPerfis(true); setMais(false); }}>perfil de usuários</button>
                    <button type="button" className="us-incluir" onClick={abrirNovo}>
                        <Plus size={15} />
                        incluir usuário
                    </button>
                    <div className="us-mais">
                        <button type="button" onClick={() => setMais((aberto) => !aberto)}>mais ações</button>
                        {mais ? (
                            <div className="us-pop">
                                <button type="button" onClick={() => { setPerfis(true); setMais(false); }}>perfil de usuários</button>
                                <Link to={ROTAS.VENDEDORES} onClick={() => setMais(false)}>gerenciar vendedores</Link>
                            </div>
                        ) : null}
                    </div>
                </div>
            </header>

            <label className="us-busca">
                <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Pesquise por nome ou login"
                />
                <Search size={16} aria-hidden="true" />
            </label>

            <section className="us-resumo">
                <span
                    className="us-donut"
                    style={{ background: `conic-gradient(var(--accent) ${ocupacao}%, #e7d5df 0)` }}
                    aria-hidden="true"
                />
                <p><small>Usuários</small><strong>{lista.length} de {LIMITE}</strong></p>
                <p><small>Usuários cadastrados</small><strong>{lista.length}</strong></p>
                <p><small>Vendedores</small><strong>{vendedores}</strong></p>
            </section>

            <div className="us-grade">
                {visiveis.map((usuario) => (
                    <article key={usuario.id} className="us-card">
                        <span className="us-avatar" style={{ background: usuario.cor }}>{inicial(usuario.nome)}</span>
                        <div>
                            <strong>{usuario.nome}</strong>
                            <em>{usuario.email}</em>
                            <span className={`us-badge ${classePerfil(usuario.perfil)}`}>{usuario.perfil}</span>
                        </div>
                        <div className="us-card-menu">
                            <button type="button" aria-label={`Ações de ${usuario.nome}`} onClick={() => setMenu(menu === usuario.id ? null : usuario.id)}>
                                <MoreHorizontal size={16} />
                            </button>
                            {menu === usuario.id ? (
                                <div className="us-pop">
                                    <button type="button" onClick={() => abrirEdicao(usuario)}>editar</button>
                                    <button type="button" onClick={() => excluir(usuario.id)}>excluir</button>
                                </div>
                            ) : null}
                        </div>
                        <button type="button" className="us-gerenciar" onClick={() => abrirEdicao(usuario)}>gerenciar</button>
                    </article>
                ))}
            </div>
            {!visiveis.length ? <p className="us-vazio">Nenhum usuário encontrado.</p> : null}

            {form ? (
                <div className="mc-overlay" onMouseDown={(e) => e.target === e.currentTarget && setForm(null)}>
                    <form className="mc-modal" onSubmit={salvarForm}>
                        <header>
                            <h3>{form.id ? "Gerenciar usuário" : "Incluir usuário"}</h3>
                            <button type="button" onClick={() => setForm(null)} aria-label="Fechar">×</button>
                        </header>
                        {aviso ? <p className="emp-erro">{aviso}</p> : null}
                        <label>Nome<input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
                        <label>E-mail ou login<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
                        <label>
                            Perfil
                            <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })}>
                                {PERFIS.map((perfil) => <option key={perfil}>{perfil}</option>)}
                            </select>
                        </label>
                        <footer>
                            <button type="button" className="mc-ghost" onClick={() => setForm(null)}>Cancelar</button>
                            <button type="submit" className="mc-pri">Salvar</button>
                        </footer>
                    </form>
                </div>
            ) : null}

            {perfis ? (
                <div className="mc-overlay" onMouseDown={(e) => e.target === e.currentTarget && setPerfis(false)}>
                    <div className="mc-modal">
                        <header>
                            <h3>Perfil de usuários</h3>
                            <button type="button" onClick={() => setPerfis(false)} aria-label="Fechar">×</button>
                        </header>
                        <ul className="us-perfis">
                            <li><b>ADMIN</b> Acesso total às configurações e aos cadastros.</li>
                            <li><b>GERENTE</b> Libera desconto e acompanha a equipe de vendas.</li>
                            <li><b>VENDEDOR</b> Opera pedidos, PDV e o próprio caixa.</li>
                            <li><b>GRAFICA</b> Acompanha produção e ordens de serviço.</li>
                        </ul>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
