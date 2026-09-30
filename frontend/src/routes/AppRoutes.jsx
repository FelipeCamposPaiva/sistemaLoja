import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";

import PublicRoute from "./guard/PublicRoute";
import PrivateRoute from "./guard/PrivateRoute";
import AppLayout from "../layout/AppLayout";
import MENU from "../constants/menu";
import Loader from "../components/Loader";

const Login = lazy(() => import("../pages/auth/Login"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const Indice = lazy(() => import("../pages/inicio/Indice"));
const Dashboard = lazy(() => import("../pages/inicio/Dashboard"));
const DetalhesVersao = lazy(() => import("../pages/inicio/DetalhesVersao"));
const Agenda = lazy(() => import("../pages/inicio/Agenda"));
const Integracoes = lazy(() => import("../pages/inicio/Integracoes"));
const IntegracaoEditar = lazy(() => import("../pages/inicio/IntegracaoEditar"));
const ClientesFornecedores = lazy(() => import("../pages/cadastros/ClientesFornecedores"));
const ContatoForm = lazy(() => import("../pages/cadastros/ContatoForm"));
const Produtos = lazy(() => import("../pages/cadastros/Produtos"));
const Categorias = lazy(() => import("../pages/cadastros/Categorias"));
const Marcas = lazy(() => import("../pages/cadastros/Marcas"));
const Vendedores = lazy(() => import("../pages/cadastros/Vendedores"));
const Moveis = lazy(() => import("../pages/cadastros/Moveis"));
const MovelForm = lazy(() => import("../pages/cadastros/MovelForm"));
const Maquinas = lazy(() => import("../pages/cadastros/Maquinas"));
const Embalagens = lazy(() => import("../pages/cadastros/Embalagens"));
const Ferramentas = lazy(() => import("../pages/inicio/Ferramentas"));
const FerramentaLista = lazy(() => import("../pages/ferramentas/FerramentaLista"));
const Sintegra = lazy(() => import("../pages/ferramentas/Sintegra"));
const Anexos = lazy(() => import("../pages/ferramentas/Anexos"));
const ResumoSincronizacoes = lazy(() => import("../pages/ferramentas/ResumoSincronizacoes"));
const SincronizacoesMultiempresa = lazy(() => import("../pages/ferramentas/SincronizacoesMultiempresa"));
const Importador = lazy(() => import("../pages/ferramentas/Importador"));
const ImportadorGestor = lazy(() => import("../pages/ferramentas/ImportadorGestor"));
const Ponto = lazy(() => import("../pages/painelfuncionario/Ponto"));
const Funcionarios = lazy(() => import("../pages/painelfuncionario/Funcionarios"));
const FuncionarioFicha = lazy(() => import("../pages/painelfuncionario/FuncionarioFicha"));
const RhFolha = lazy(() => import("../pages/painelfuncionario/RhFolha"));
const Comissoes = lazy(() => import("../pages/painelfuncionario/Comissoes"));
const RhHub = lazy(() => import("../pages/painelfuncionario/RhHub"));
const RhCadastro = lazy(() => import("../pages/painelfuncionario/RhCadastro"));
const RhMovimento = lazy(() => import("../pages/painelfuncionario/RhMovimento"));
const PainelProducao = lazy(() => import("../pages/servicos/PainelProducao/Producao"));
const ProducaoGrafica = lazy(() => import("../pages/servicos/ProducaoGrafica.jsx"));
const OrdemServico = lazy(() => import("../pages/servicos/OS/OrdemServico"));
const ExportadorOS = lazy(() => import("../pages/servicos/OS/ExportadorOS"));
const RelatorioTecnicos = lazy(() => import("../pages/servicos/OS/RelatorioTecnicos"));
const NfsOs = lazy(() => import("../pages/servicos/OS/NfsOs"));
const Tecnicos = lazy(() => import("../pages/cadastros/Tecnicos"));
const NotasEntrada = lazy(() => import("../pages/suprimentos/NotasEntrada"));
const NotaEntradaForm = lazy(() => import("../pages/suprimentos/NotaEntradaForm"));
const ControleEstoque = lazy(() => import("../pages/suprimentos/ControleEstoque"));
const AuditoriaEstoque = lazy(() => import("../pages/suprimentos/AuditoriaEstoque"));
const DashboardSuprimentos = lazy(() => import("../pages/suprimentos/DashboardSuprimentos"));
const OrdensCompra = lazy(() => import("../pages/suprimentos/OrdensCompra"));
const Inventario = lazy(() => import("../pages/suprimentos/Inventario"));
const Localizacoes = lazy(() => import("../pages/cadastros/Localizacoes"));
const Crm = lazy(() => import("../pages/ecommerce/Crm"));
const PedidoEcommerce = lazy(() => import("../pages/ecommerce/PedidoEcommerce"));
const LojaAdmin = lazy(() => import("../pages/ecommerce/LojaAdmin"));
const LojaPainel = lazy(() => import("../pages/ecommerce/LojaPainel"));
const LojaLayout = lazy(() => import("../pages/loja/LojaLayout"));
const LojaHome = lazy(() => import("../pages/loja/LojaHome"));
const LojaCatalogo = lazy(() => import("../pages/loja/LojaCatalogo"));
const LojaProduto = lazy(() => import("../pages/loja/LojaProduto"));
const LojaCarrinho = lazy(() => import("../pages/loja/LojaCarrinho"));
const LojaCheckout = lazy(() => import("../pages/loja/LojaCheckout"));
const LojaConta = lazy(() => import("../pages/loja/LojaConta"));
const LojaPagina = lazy(() => import("../pages/loja/LojaPagina"));
const LojaDesejos = lazy(() => import("../pages/loja/LojaDesejos"));
const PDV = lazy(() => import("../pages/vendas/PDV"));
const Promocoes = lazy(() => import("../pages/vendas/Promocoes"));
const PedidoVenda = lazy(() => import("../pages/vendas/PedidoVenda"));
const Separacao = lazy(() => import("../pages/vendas/Separacao"));
const Expedicao = lazy(() => import("../pages/vendas/Expedicao"));
const DashboardExpedicao = lazy(() => import("../pages/vendas/DashboardExpedicao"));
const ContasReceber = lazy(() => import("../pages/financas/ContasReceber"));
const ContasPagar = lazy(() => import("../pages/financas/ContasPagar"));
const Balancete = lazy(() => import("../pages/financas/Balancete"));
const CobrancaBancaria = lazy(() => import("../pages/financas/CobrancaBancaria"));
const BalancoPatrimonial = lazy(() => import("../pages/financas/BalancoPatrimonial"));
const MinhaConta = lazy(() => import("../pages/inicio/MinhaConta"));
const Configuracoes = lazy(() => import("../pages/configuracoes/Configuracoes"));
const FinanceiroJuros = lazy(() => import("../pages/configuracoes/FinanceiroJuros"));
const Auditoria = lazy(() => import("../pages/configuracoes/Auditoria"));
const NotFound = lazy(() => import("../pages/errors/NotFound"));
const Forbidden = lazy(() => import("../pages/errors/Forbidden"));
const Modulo = lazy(() => import("../pages/shared/Modulo"));

function ContatoRedirect() {
    const { id } = useParams();
    return <Navigate to={`/contatos/${id}`} replace />;
}

function OsRedirect() {
    const { id } = useParams();
    if (!id || id === "nova") {
        return <Navigate to="/ordem_servicos#add" replace />;
    }
    return <Navigate to={`/ordem_servicos#edit/${id}`} replace />;
}

function RedirectVendas() {
    const { search } = useLocation();
    return <Navigate to={{ pathname: "/vendas", search, hash: "list" }} replace />;
}

function RedirectFerramentas() {
    const { search } = useLocation();
    return <Navigate to={{ pathname: "/ferramentas_geral", search }} replace />;
}

function RedirectPedidosCompra() {
    const { search } = useLocation();
    return <Navigate to={{ pathname: "/pedidos_compra", search, hash: "list" }} replace />;
}

function HashList({ hash = "list", children }) {
    const loc = useLocation();
    if (!loc.hash || loc.hash === "#") {
        return <Navigate to={{ pathname: loc.pathname, search: loc.search, hash }} replace />;
    }
    return children;
}

function RedirectNotasEntrada() {
    const { search } = useLocation();
    return <Navigate to={{ pathname: "/notas_entrada", search, hash: "list" }} replace />;
}

function RedirectNotasEntradaId() {
    const { id } = useParams();
    return <Navigate to={`/notas_entrada/${id}`} replace />;
}

function LoaderPage() {
    return <Loader />;
}

const rotasMenu = [
    ...new Set(
        MENU.flatMap((grupo) =>
            grupo.itens
                .map((item) => item.rota)
                .filter((rota) => rota && !["/", "/index", "/dashboard", "/detalhes_versao", "/home_agenda", "/integracoes", "/integracoes", "/integracoes/nova", "/ferramentas", "/ferramentas_geral", "/contatos", "/contatos#/", "/dashboard#/vendas", "/dados_conta", "/clientes", "/produtos", "/produtos#list", "/produto_categorias", "/categorias-produtos", "/marcas", "/marcas#list", "/vendedores", "/vendedores#list", "/moveis", "/maquinas", "/embalagens", "/embalagens#list", "/localizacoes", "/ponto", "/ponto/registros", "/ponto/espelho", "/ponto/ajustes", "/ponto/relatorios", "/funcionarios", "/ferias", "/rescisoes", "/informes", "/rh-avisos", "/holerite", "/guias", "/rh-documentos", "/comissoes", "/painel-producao", "/producao", "/rh", "/crm", "/loja", "/loja-admin", "/pedido-ecommerce", "/notas-entrada", "/notas_entrada", "/notas_entrada#list", "/conferencia-compra", "/entrada_de_mercadorias", "/servicos-tomados", "/servicos_tomados", "/servicos_tomados#/", "/pdv", "/promocoes", "/produtos/reajuste", "/pedido-venda", "/vendas", "/vendas#list", "/separacao", "/expedicao", "/expedicao/dashboard", "/contas-receber", "/contas-pagar", "/balancete", "/balanco-patrimonial", "/cobranca-bancaria", "/minha-conta", "/configuracoes", "/configuracoes/juros-multa", "/auditoria", "/estoque", "/estoque/auditoria", "/estoque/dashboard", "/ordens-compra", "/pedidos_compra", "/pedidos_compra#list", "/necessidades-compra", "/giro-estoque", "/inventario", "/ordem_servicos", "/ordem_servicos/relatorio-tecnicos", "/tecnicos", "/nfs", "/os", "/os/nova", "/nova-os"].includes(rota))
        )
    )
];

export default function AppRoutes() {
    return (
        <Suspense fallback={<LoaderPage />}>
            <Routes>
                <Route element={<LojaLayout />}>
                    <Route path="/" element={<LojaHome />} />
                    <Route path="/loja" element={<LojaHome />} />
                    <Route path="/c/:grupo" element={<LojaCatalogo />} />
                    <Route path="/busca" element={<LojaCatalogo />} />
                    <Route path="/produto/:id/:slug" element={<LojaProduto />} />
                    <Route path="/produto/:id" element={<LojaProduto />} />
                    <Route path="/carrinho" element={<LojaCarrinho />} />
                    <Route path="/checkout" element={<LojaCheckout />} />
                    <Route path="/conta" element={<LojaConta />} />
                    <Route path="/desejos" element={<LojaDesejos />} />
                    <Route path="/p/:slug" element={<LojaPagina />} />
                </Route>

                <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/esqueci-senha" element={<ForgotPassword />} />
                </Route>

                <Route element={<PrivateRoute />}>
                    <Route element={<AppLayout />}>
                        <Route path="/index" element={<Indice />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/detalhes_versao" element={<DetalhesVersao />} />
                        <Route path="/home_agenda" element={<Agenda />} />
                        <Route path="/agenda" element={<Navigate to="/home_agenda" replace />} />
                        <Route path="/integracoes" element={<Integracoes />} />
                        <Route path="/integracoes/nova" element={<Integracoes />} />
                        <Route path="/integracoes/:id" element={<IntegracaoEditar />} />
                        <Route path="/contatos" element={<ClientesFornecedores />} />
                        <Route path="/contatos/novo" element={<ContatoForm />} />
                        <Route path="/contatos/:id" element={<ContatoForm />} />
                        <Route path="/produtos" element={<HashList><Produtos /></HashList>} />
                        <Route path="/produto_categorias" element={<Categorias />} />
                        <Route path="/categorias-produtos" element={<Navigate to="/produto_categorias" replace />} />
                        <Route path="/marcas" element={<HashList><Marcas /></HashList>} />
                        <Route path="/vendedores" element={<HashList><Vendedores /></HashList>} />
                        <Route path="/moveis" element={<Moveis />} />
                        <Route path="/moveis/novo" element={<MovelForm />} />
                        <Route path="/moveis/:id" element={<MovelForm />} />
                        <Route path="/maquinas" element={<Maquinas />} />
                        <Route path="/embalagens" element={<HashList><Embalagens /></HashList>} />
                        <Route path="/clientes" element={<Navigate to="/contatos#/" replace />} />
                        <Route path="/clientes/novo" element={<Navigate to="/contatos/novo" replace />} />
                        <Route path="/clientes/:id" element={<ContatoRedirect />} />
                        <Route path="/ponto" element={<Ponto />} />
                        <Route path="/ponto/registros" element={<Ponto />} />
                        <Route path="/ponto/espelho" element={<Ponto />} />
                        <Route path="/ponto/ajustes" element={<Ponto />} />
                        <Route path="/ponto/relatorios" element={<Ponto />} />
                        <Route path="/funcionarios" element={<Funcionarios />} />
                        <Route path="/funcionarios/:id" element={<FuncionarioFicha />} />
                        <Route path="/ferias" element={<RhFolha />} />
                        <Route path="/rescisoes" element={<RhFolha />} />
                        <Route path="/informes" element={<RhFolha />} />
                        <Route path="/rh-avisos" element={<RhFolha />} />
                        <Route path="/holerite" element={<RhFolha />} />
                        <Route path="/guias" element={<RhFolha />} />
                        <Route path="/rh-documentos" element={<RhFolha />} />
                        <Route path="/comissoes" element={<Comissoes />} />
                        <Route path="/comissoes/:id" element={<Comissoes />} />
                        <Route path="/rh" element={<RhHub />} />
                        <Route path="/rh/cadastro/:tipo" element={<RhCadastro />} />
                        <Route path="/rh/:acao" element={<RhMovimento />} />
                        <Route path="/painel-producao" element={<PainelProducao />} />
                        <Route path="/producao" element={<ProducaoGrafica />} />
                        <Route path="/ordem_servicos/exportar" element={<ExportadorOS />} />
                        <Route path="/ordem_servicos/relatorio-tecnicos" element={<RelatorioTecnicos />} />
                        <Route path="/tecnicos" element={<Tecnicos />} />
                        <Route path="/nfs" element={<NfsOs />} />
                        <Route path="/exportar_ordens_servico" element={<Navigate to="/ordem_servicos/exportar" replace />} />
                        <Route path="/importador_ordem_servicos" element={<Navigate to="/ferramentas/importar/os" replace />} />
                        <Route path="/ordem_servicos" element={<OrdemServico />} />
                        <Route path="/os" element={<Navigate to="/ordem_servicos" replace />} />
                        <Route path="/os/nova" element={<Navigate to="/ordem_servicos#add" replace />} />
                        <Route path="/os/:id" element={<OsRedirect />} />
                        <Route path="/nova-os" element={<Navigate to="/ordem_servicos#add" replace />} />
                        <Route path="/notas_entrada" element={<HashList><NotasEntrada /></HashList>} />
                        <Route path="/notas_entrada/nova" element={<NotaEntradaForm />} />
                        <Route path="/notas_entrada/:id" element={<NotaEntradaForm />} />
                        <Route path="/notas-entrada" element={<RedirectNotasEntrada />} />
                        <Route path="/notas-entrada/nova" element={<Navigate to="/notas_entrada/nova" replace />} />
                        <Route path="/notas-entrada/:id" element={<RedirectNotasEntradaId />} />
                        <Route path="/entrada_de_mercadorias" element={<Modulo />} />
                        <Route path="/conferencia-compra" element={<Navigate to="/entrada_de_mercadorias" replace />} />
                        <Route path="/servicos_tomados" element={<HashList hash="/"><Modulo /></HashList>} />
                        <Route path="/servicos-tomados" element={<Navigate to="/servicos_tomados#/" replace />} />
                        <Route path="/estoque" element={<ControleEstoque />} />
                        <Route path="/estoque/auditoria" element={<AuditoriaEstoque />} />
                        <Route path="/estoque/dashboard" element={<DashboardSuprimentos />} />
                        <Route path="/pedidos_compra" element={<HashList><OrdensCompra /></HashList>} />
                        <Route path="/ordens-compra" element={<RedirectPedidosCompra />} />
                        <Route path="/necessidades-compra" element={<DashboardSuprimentos />} />
                        <Route path="/giro-estoque" element={<DashboardSuprimentos />} />
                        <Route path="/inventario" element={<Inventario />} />
                        <Route path="/localizacoes" element={<Localizacoes />} />
                        <Route path="/crm" element={<Crm />} />
                        <Route path="/pedido-ecommerce" element={<PedidoEcommerce />} />
                        <Route path="/loja-admin" element={<LojaPainel />} />
                        <Route path="/loja-admin/pedidos" element={<PedidoEcommerce />} />
                        <Route path="/loja-admin/pedido-novo" element={<PedidoVenda />} />
                        <Route path="/loja-admin/produtos" element={<Produtos />} />
                        <Route path="/loja-admin/produto-novo" element={<Produtos />} />
                        <Route path="/loja-admin/promocoes" element={<Promocoes />} />
                        <Route path="/loja-admin/nfe" element={<NfsOs />} />
                        <Route path="/loja-admin/:secao" element={<LojaAdmin />} />
                        <Route path="/pdv" element={<PDV />} />
                        <Route path="/promocoes" element={<Promocoes />} />
                        <Route path="/produtos/reajuste" element={<Promocoes />} />
                        <Route path="/vendas" element={<PedidoVenda />} />
                        <Route path="/pedido-venda" element={<RedirectVendas />} />
                        <Route path="/pedidos" element={<RedirectVendas />} />
                        <Route path="/separacao" element={<Separacao />} />
                        <Route path="/separacao/:id" element={<Separacao />} />
                        <Route path="/expedicao/dashboard" element={<DashboardExpedicao />} />
                        <Route path="/expedicao" element={<Expedicao />} />
                        <Route path="/contas-receber" element={<ContasReceber />} />
                        <Route path="/contas-pagar" element={<ContasPagar />} />
                        <Route path="/balancete" element={<Balancete />} />
                        <Route path="/cobranca-bancaria" element={<CobrancaBancaria />} />
                        <Route path="/balanco-patrimonial" element={<BalancoPatrimonial />} />
                        <Route path="/dados_conta" element={<MinhaConta />} />
                        <Route path="/minha-conta" element={<Navigate to="/dados_conta" replace />} />
                        <Route path="/configuracoes" element={<Configuracoes />} />
                        <Route path="/configuracoes/juros-multa" element={<FinanceiroJuros />} />
                        <Route path="/auditoria" element={<Auditoria />} />
                        <Route path="/ferramentas_geral" element={<Ferramentas />} />
                        <Route path="/ferramentas" element={<RedirectFerramentas />} />
                        <Route path="/ferramentas/importar/gestor" element={<ImportadorGestor />} />
                        <Route path="/ferramentas/importar/:tipo" element={<Importador />} />
                        <Route path="/ferramentas/sintegra" element={<Sintegra />} />
                        <Route path="/ferramentas/anexos" element={<Anexos />} />
                        <Route path="/ferramentas/resumo-sincronizacoes" element={<ResumoSincronizacoes />} />
                        <Route path="/ferramentas/sincronizacoes-multiempresa" element={<SincronizacoesMultiempresa />} />
                        <Route path="/ferramentas/:pagina" element={<FerramentaLista />} />
                        {rotasMenu.map((rota) => (
                            <Route key={rota} path={rota} element={<Modulo />} />
                        ))}
                        <Route path="/403" element={<Forbidden />} />
                        <Route path="/404" element={<NotFound />} />
                    </Route>
                </Route>

                <Route element={<PrivateRoute />}>
                    <Route path="*" element={<Navigate to="/404" replace />} />
                </Route>
            </Routes>
        </Suspense>
    );
}
