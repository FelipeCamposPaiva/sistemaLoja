import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import ROTAS from "../../constants/rotas";
import {
    EMPRESA_RH,
    proximaMatricula,
    salvarFuncionario
} from "../../constants/rh";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/rh.css";

const TIPOS = {
    empregado: { titulo: "Cadastro de Empregado", situacao: "ativo", cargo: "Vendedor" },
    contribuinte: { titulo: "Cadastro de Contribuinte", situacao: "prolabore", cargo: "Contribuinte individual" },
    estagiario: { titulo: "Cadastro de Estagiário", situacao: "estagiario", cargo: "Estagiário" }
};

const VAZIO = {
    nome: "",
    cpf: "",
    rg: "",
    nascimento: "",
    sexo: "Feminino",
    estadoCivil: "Solteiro",
    celular: "",
    email: "",
    mae: "",
    endereco: "",
    cidade: "Volta Redonda",
    uf: "RJ",
    cep: "",
    cargo: "",
    salario: "",
    admissao: "2026-09-02",
    expediente: "08:30 às 18:30"
};

export default function RhCadastro() {
    const { tipo } = useParams();
    const navigate = useNavigate();
    const meta = TIPOS[tipo] || TIPOS.empregado;
    const [form, setForm] = useState({ ...VAZIO, cargo: meta.cargo });
    const [erro, setErro] = useState("");

    function setCampo(campo, valor) {
        setForm((atual) => ({ ...atual, [campo]: valor }));
    }

    function salvar(ev) {
        ev.preventDefault();
        if (!form.nome.trim() || !form.cpf.trim()) {
            setErro("Informe nome e CPF.");
            return;
        }
        const matricula = proximaMatricula();
        const ficha = {
            ...form,
            id: Date.now(),
            matricula,
            eSocial: matricula.padStart(6, "0"),
            nome: form.nome.trim().toUpperCase(),
            salario: Number(String(form.salario).replace(",", ".")) || 0,
            situacao: meta.situacao,
            depto: "001 - GERAL",
            dependentes: []
        };
        salvarFuncionario(ficha);
        navigate(`/funcionarios/${ficha.id}`);
    }

    return (
        <div className="rh-page">
            <nav className="rh-crumb">
                <Link to={ROTAS.INDICE}>Início</Link>
                <span>›</span>
                <Link to="/rh">RH</Link>
                <span>›</span>
                <span>{meta.titulo}</span>
            </nav>
            <header className="rh-head">
                <div>
                    <h2>{meta.titulo}</h2>
                    <p>{EMPRESA_RH.nomeCurto} · folha {EMPRESA_RH.codigoFolha}</p>
                </div>
            </header>
            <form className="rh-ficha rh-form" onSubmit={salvar}>
                {erro ? <p className="rh-erro">{erro}</p> : null}
                <div className="rh-grid">
                    <label><span>Nome</span><input value={form.nome} onChange={(e) => setCampo("nome", e.target.value)} required /></label>
                    <label><span>CPF</span><input value={form.cpf} onChange={(e) => setCampo("cpf", e.target.value)} required /></label>
                    <label><span>RG</span><input value={form.rg} onChange={(e) => setCampo("rg", e.target.value)} /></label>
                    <label><span>Nascimento</span><input type="date" value={form.nascimento} onChange={(e) => setCampo("nascimento", e.target.value)} /></label>
                    <label><span>Sexo</span>
                        <select value={form.sexo} onChange={(e) => setCampo("sexo", e.target.value)}>
                            <option>Feminino</option>
                            <option>Masculino</option>
                        </select>
                    </label>
                    <label><span>Estado civil</span>
                        <select value={form.estadoCivil} onChange={(e) => setCampo("estadoCivil", e.target.value)}>
                            <option>Solteiro</option>
                            <option>Casado</option>
                            <option>Divorciado</option>
                            <option>Viúvo</option>
                        </select>
                    </label>
                    <label><span>Celular</span><input value={form.celular} onChange={(e) => setCampo("celular", e.target.value)} /></label>
                    <label><span>E-mail</span><input type="email" value={form.email} onChange={(e) => setCampo("email", e.target.value)} /></label>
                    <label><span>Nome da mãe</span><input value={form.mae} onChange={(e) => setCampo("mae", e.target.value)} /></label>
                    <label><span>Endereço</span><input value={form.endereco} onChange={(e) => setCampo("endereco", e.target.value)} /></label>
                    <label><span>Cidade</span><input value={form.cidade} onChange={(e) => setCampo("cidade", e.target.value)} /></label>
                    <label><span>CEP</span><input value={form.cep} onChange={(e) => setCampo("cep", e.target.value)} /></label>
                    <label><span>Cargo</span><input value={form.cargo} onChange={(e) => setCampo("cargo", e.target.value)} /></label>
                    <label><span>Salário</span><input value={form.salario} onChange={(e) => setCampo("salario", e.target.value)} /></label>
                    <label><span>Admissão</span><input type="date" value={form.admissao} onChange={(e) => setCampo("admissao", e.target.value)} /></label>
                    <label><span>Expediente</span><input value={form.expediente} onChange={(e) => setCampo("expediente", e.target.value)} /></label>
                </div>
                <div className="rh-form-acoes">
                    <button type="submit" className="rh-btn">salvar cadastro</button>
                    <Link to="/rh">cancelar</Link>
                </div>
            </form>
        </div>
    );
}
