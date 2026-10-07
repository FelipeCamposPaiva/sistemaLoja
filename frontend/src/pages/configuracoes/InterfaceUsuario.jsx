import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/empresa.css";
import "../../styles/pages/envio-documentos.css";
import "../../styles/pages/interface-usuario.css";

const CHAVE = "erp-interface-usuario-v1";

const PADRAO = {
    aoSalvar: "cadastro",
    aoAcessar: "edicao",
    porPagina: 50,
    lembrarTela: true
};

const GRUPOS = [
    {
        id: "aoSalvar",
        titulo: "Ao salvar",
        opcoes: [
            { valor: "cadastro", nome: "Visualizar cadastro" },
            { valor: "listagem", nome: "Voltar para a listagem" }
        ]
    },
    {
        id: "aoAcessar",
        titulo: "Ao acessar um cadastro",
        opcoes: [
            { valor: "edicao", nome: "Acessar no modo de edição" },
            { valor: "visualizacao", nome: "Acessar no modo de visualização" }
        ]
    },
    {
        id: "porPagina",
        titulo: "Número de registros por página",
        opcoes: [
            { valor: 20, nome: "20 registros" },
            { valor: 50, nome: "50 registros" }
        ]
    }
];

function ler() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE) || "null");
        if (bruto && typeof bruto === "object") {
            const porPagina = Number(bruto.porPagina);
            return {
                aoSalvar: bruto.aoSalvar === "listagem" ? "listagem" : PADRAO.aoSalvar,
                aoAcessar: bruto.aoAcessar === "visualizacao" ? "visualizacao" : PADRAO.aoAcessar,
                porPagina: porPagina === 20 ? 20 : PADRAO.porPagina,
                lembrarTela: typeof bruto.lembrarTela === "boolean" ? bruto.lembrarTela : PADRAO.lembrarTela
            };
        }
    } catch {
        /* padrão */
    }
    return { ...PADRAO };
}

export default function InterfaceUsuario() {
    const navigate = useNavigate();
    const [form, setForm] = useState(ler);
    const [aviso, setAviso] = useState("");

    function voltar() {
        navigate(ROTAS.CONFIGURACOES);
    }

    function alterar(campo, valor) {
        setForm((atual) => ({ ...atual, [campo]: valor }));
        setAviso("");
    }

    function salvar(evento) {
        evento.preventDefault();
        localStorage.setItem(CHAVE, JSON.stringify(form));
        setAviso("Interface do usuário salva.");
    }

    return (
        <form className="emp-page iu-page" onSubmit={salvar}>
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
                    <span>interface do usuário</span>
                </nav>
            </div>
            <h2>Interface do usuário</h2>
            {aviso ? <p className="emp-ok">{aviso}</p> : null}
            {GRUPOS.map((grupo) => (
                <fieldset key={grupo.id} className="iu-grupo">
                    <legend>{grupo.titulo}</legend>
                    {grupo.opcoes.map((opcao) => (
                        <label key={opcao.valor} className="iu-radio">
                            <input
                                type="radio"
                                name={grupo.id}
                                checked={form[grupo.id] === opcao.valor}
                                onChange={() => alterar(grupo.id, opcao.valor)}
                            />
                            {opcao.nome}
                        </label>
                    ))}
                </fieldset>
            ))}
            <label className="env-opcao iu-lembrar">
                <input
                    type="checkbox"
                    role="switch"
                    checked={form.lembrarTela}
                    onChange={(evento) => alterar("lembrarTela", evento.target.checked)}
                />
                Lembrar última tela ao logar novamente
            </label>
            <div className="emp-acoes">
                <button type="submit" className="emp-salvar">salvar</button>
                <button type="button" className="emp-cancelar" onClick={voltar}>cancelar</button>
            </div>
        </form>
    );
}
