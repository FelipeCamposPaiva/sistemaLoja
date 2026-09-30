import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    CheckCircle2,
    ExternalLink,
    Package,
    ShoppingBag,
    Store,
    Users,
    XCircle
} from "lucide-react";

import useAuth from "../../hooks/useAuth.jsx";
import { catalogoVitrine, lerClientesLoja, lerLoja } from "../../constants/loja";
import { listarPedidosVenda } from "../../services/pedidoVenda.service";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";
import "../../styles/pages/loja-admin.css";

function saudacao() {
    const hora = new Date().getHours();
    if (hora < 12) {
        return "Bom dia";
    }
    if (hora < 18) {
        return "Boa tarde";
    }
    return "Boa noite";
}

export default function LojaPainel() {
    const { usuario } = useAuth();
    const nome = (usuario?.nome || "Felipe").split(" ")[0];
    const cfg = lerLoja();
    const produtos = catalogoVitrine();
    const clientes = lerClientesLoja();
    const [pedidos, setPedidos] = useState([]);

    useEffect(() => {
        let vivo = true;
        listarPedidosVenda()
            .then((lista) => {
                if (vivo) {
                    setPedidos(Array.isArray(lista) ? lista : []);
                }
            })
            .catch(() => {
                if (vivo) {
                    setPedidos([]);
                }
            });
        return () => {
            vivo = false;
        };
    }, []);

    const daLoja = useMemo(
        () => pedidos.filter((p) => String(p.origem || "").toLowerCase().includes("loja")),
        [pedidos]
    );
    const aprovados = daLoja.filter((p) => /aprov|pago|fatur/i.test(String(p.status || "")));
    const cancelados = daLoja.filter((p) => /cancel/i.test(String(p.status || "")));

    return (
        <div className="lja-page lja-home">
            <header className="lja-home-head">
                <div>
                    <h2>{saudacao()}, {nome}! Que bom te ver por aqui.</h2>
                    <p className="idx-sub">Painel da vitrine Tem de Tudo — o que acontece na loja pública.</p>
                </div>
                <a className="lja-ver" href="/" target="_blank" rel="noreferrer">
                    <ExternalLink size={16} /> ver a loja
                </a>
            </header>

            <div className="lja-home-grid">
                <article className="lja-kpi">
                    <Package size={22} />
                    <div>
                        <strong>{produtos.length.toLocaleString("pt-BR")}</strong>
                        <span>Produtos ativos</span>
                    </div>
                    <Link to="/loja-admin/produtos">ir para produtos</Link>
                </article>
                <article className="lja-kpi">
                    <CheckCircle2 size={22} />
                    <div>
                        <strong>{aprovados.length || daLoja.length}</strong>
                        <span>Pedidos da loja</span>
                    </div>
                    <Link to="/loja-admin/pedidos">ver pedidos</Link>
                </article>
                <article className="lja-kpi is-alert">
                    <XCircle size={22} />
                    <div>
                        <strong>{cancelados.length}</strong>
                        <span>Pedidos cancelados</span>
                    </div>
                    <Link to="/loja-admin/pedidos">abrir lista</Link>
                </article>
                <article className="lja-kpi">
                    <Store size={22} />
                    <div>
                        <strong>{cfg.dados.cidade}</strong>
                        <span>Dados da loja</span>
                    </div>
                    <Link to="/loja-admin/dados">editar dados</Link>
                </article>
            </div>

            <section className="lja-home-banner">
                <div>
                    <p>Produtos com avaliação vendem mais</p>
                    <h3>Depoimentos e fotos na vitrine aumentam a conversão.</h3>
                    <Link to="/loja-admin/avaliacoes" className="lja-save">ver avaliações</Link>
                </div>
                <p className="lja-home-quote">“O nome já diz tudo… atendimento top.”</p>
            </section>

            <h3 className="lja-home-sec">Seu uso este mês</h3>
            <div className="lja-home-grid is-3">
                <article className="lja-kpi">
                    <ShoppingBag size={22} />
                    <div>
                        <strong>{daLoja.length}</strong>
                        <span>Pedidos originados na vitrine</span>
                    </div>
                    <Link to="/loja-admin/pedidos">histórico</Link>
                </article>
                <article className="lja-kpi">
                    <Users size={22} />
                    <div>
                        <strong>{clientes.length}</strong>
                        <span>Clientes cadastrados no site</span>
                    </div>
                    <Link to="/loja-admin/usuarios">ir para usuários</Link>
                </article>
                <article className="lja-kpi">
                    <Package size={22} />
                    <div>
                        <strong>{cfg.cupons?.length || 0}</strong>
                        <span>Cupons progressivos ativos</span>
                    </div>
                    <Link to="/loja-admin/cupons">ver cupons</Link>
                </article>
            </div>
        </div>
    );
}
