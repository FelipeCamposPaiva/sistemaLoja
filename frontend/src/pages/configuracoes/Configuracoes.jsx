import { Link } from "react-router-dom";
import { History, Plug, ReceiptText, Settings, Shield, Users, Wrench } from "lucide-react";

import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/ferramentas.css";

const BLOCOS = [
    {
        titulo: "Empresa",
        texto: "Dados da loja, usuários e permissões.",
        links: [
            { nome: "Minha conta", rota: "/dados_conta", Icon: Users },
            { nome: "Equipe", rota: "/funcionarios", Icon: Users }
        ]
    },
    {
        titulo: "Fiscal e vendas",
        texto: "Notas, PDV, faturamento e boletos.",
        links: [
            { nome: "Notas de entrada", rota: `${ROTAS.NOTAS_ENTRADA}#list`, Icon: ReceiptText },
            { nome: "PDV", rota: ROTAS.PDV, Icon: ReceiptText },
            { nome: "Juros e multa", rota: "/configuracoes/juros-multa", Icon: ReceiptText },
            { nome: "Inutilização de NF-e", rota: "/ferramentas/nfe-inutilizacao", Icon: Shield }
        ]
    },
    {
        titulo: "Integrações e manutenção",
        texto: "Canais, backup e tarefas.",
        links: [
            { nome: "Loja virtual", rota: ROTAS.LOJA_ADMIN, Icon: Plug },
            { nome: "Integrações", rota: ROTAS.INTEGRACOES, Icon: Plug },
            { nome: "Ferramentas", rota: ROTAS.FERRAMENTAS, Icon: Wrench },
            { nome: "Auditoria", rota: ROTAS.AUDITORIA, Icon: History },
            { nome: "Auditoria de estoque", rota: ROTAS.AUDITORIA_ESTOQUE, Icon: History },
            { nome: "Backup", rota: "/ferramentas/backup", Icon: Settings }
        ]
    }
];

export default function Configuracoes() {
    return (
        <div className="fer-main">
            <nav className="dash-crumb" aria-label="Trilha">
                <Link to={ROTAS.INDICE}>início</Link>
                <span>›</span>
                <span>configurações</span>
            </nav>
            <h2 className="fer-title">Configurações</h2>
            <p className="idx-sub" style={{ marginBottom: 22 }}>
                Atalhos para o que a loja usa no dia a dia — sem sair do ERP.
            </p>
            <div className="cfg-blocos">
                {BLOCOS.map((bloco) => (
                    <section key={bloco.titulo} className="cfg-bloco">
                        <h3>{bloco.titulo}</h3>
                        <p>{bloco.texto}</p>
                        <ul>
                            {bloco.links.map((link) => {
                                const Icon = link.Icon;
                                return (
                                    <li key={link.rota}>
                                        <Link to={link.rota}>
                                            <Icon size={16} />
                                            {link.nome}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
}
