package com.temdetudo.erp.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.temdetudo.erp.dto.DashboardSuprimentosDTO;
import com.temdetudo.erp.dto.DashboardSuprimentosDTO.Grupo;
import com.temdetudo.erp.dto.DashboardSuprimentosDTO.Ponto;
import com.temdetudo.erp.dto.DashboardSuprimentosDTO.ProdutoLinha;
import com.temdetudo.erp.dto.DashboardSuprimentosDTO.VendasPeriodo;
import com.temdetudo.erp.dto.PedidosCompraGeradosDTO;
import com.temdetudo.erp.entity.Cliente;
import com.temdetudo.erp.entity.EstoqueMovimentacao;
import com.temdetudo.erp.entity.Marca;
import com.temdetudo.erp.entity.OrdemCompra;
import com.temdetudo.erp.entity.OrdemCompraItem;
import com.temdetudo.erp.entity.PedidoVenda;
import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.estoque.EstoqueOrigem;
import com.temdetudo.erp.repository.ClienteRepository;
import com.temdetudo.erp.repository.EstoqueMovimentacaoRepository;
import com.temdetudo.erp.repository.MarcaRepository;
import com.temdetudo.erp.repository.OrdemCompraItemRepository;
import com.temdetudo.erp.repository.OrdemCompraRepository;
import com.temdetudo.erp.repository.PedidoVendaRepository;
import com.temdetudo.erp.repository.ProdutoRepository;

import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

import javax.sql.DataSource;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class DashboardSuprimentosService {

    private static final Locale PT = Locale.forLanguageTag("pt-BR");
    private static final DateTimeFormatter MES_CHAVE = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final DateTimeFormatter MES_ROTULO = DateTimeFormatter.ofPattern("MMM", PT);
    private static final Set<String> ORIGENS_REPOSICAO = Set.of(
            EstoqueOrigem.NF,
            EstoqueOrigem.PEDIDO,
            EstoqueOrigem.IMPORTACAO,
            EstoqueOrigem.MANUAL
    );

    private final ProdutoRepository produtoRepository;
    private final MarcaRepository marcaRepository;
    private final ClienteRepository clienteRepository;
    private final EstoqueMovimentacaoRepository movimentacaoRepository;
    private final PedidoVendaRepository pedidoVendaRepository;
    private final OrdemCompraRepository ordemCompraRepository;
    private final OrdemCompraItemRepository ordemCompraItemRepository;
    private final AuditoriaService auditoria;
    private final DataSource dataSource;
    private final ObjectMapper mapper;

    public DashboardSuprimentosService(
            ProdutoRepository produtoRepository,
            MarcaRepository marcaRepository,
            ClienteRepository clienteRepository,
            EstoqueMovimentacaoRepository movimentacaoRepository,
            PedidoVendaRepository pedidoVendaRepository,
            OrdemCompraRepository ordemCompraRepository,
            OrdemCompraItemRepository ordemCompraItemRepository,
            AuditoriaService auditoria,
            DataSource dataSource,
            ObjectMapper mapper
    ) {
        this.produtoRepository = produtoRepository;
        this.marcaRepository = marcaRepository;
        this.clienteRepository = clienteRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.pedidoVendaRepository = pedidoVendaRepository;
        this.ordemCompraRepository = ordemCompraRepository;
        this.ordemCompraItemRepository = ordemCompraItemRepository;
        this.auditoria = auditoria;
        this.dataSource = dataSource;
        this.mapper = mapper;
    }

    public DashboardSuprimentosDTO montar() {
        List<Produto> produtos = produtoRepository.findAll();
        Map<Integer, String> marcas = nomesMarcas();
        Map<Long, String> fornecedores = nomesFornecedores();
        Map<Long, VendaSku> vendasPorProduto = new HashMap<>();
        VendasPeriodo vendas = new VendasPeriodo();
        agregarVendas(produtos, vendasPorProduto, vendas);

        DashboardSuprimentosDTO dto = new DashboardSuprimentosDTO();
        dto.setVendas(vendas);

        Map<String, Grupo> porMarca = new LinkedHashMap<>();
        Map<String, Grupo> porFornecedor = new LinkedHashMap<>();
        List<ProdutoLinha> linhas = new ArrayList<>();
        List<ProdutoLinha> reposicao = new ArrayList<>();
        BigDecimal valorCusto = BigDecimal.ZERO;
        BigDecimal valorVenda = BigDecimal.ZERO;
        long skuAtivos = 0;
        long skuComEstoque = 0;

        for (Produto produto : produtos) {
            if (Boolean.FALSE.equals(produto.getAtivo())) {
                continue;
            }
            skuAtivos++;
            ProdutoLinha linha = linhaDe(produto, marcas, fornecedores, vendasPorProduto.get(produto.getId()));
            if (linha.getEstoque().compareTo(BigDecimal.ZERO) > 0) {
                skuComEstoque++;
            }
            valorCusto = valorCusto.add(linha.getValorCusto());
            valorVenda = valorVenda.add(linha.getValorVenda());
            acumularGrupo(porMarca, linha.getMarca(), linha);
            acumularGrupo(porFornecedor, linha.getFornecedor(), linha);
            linhas.add(linha);
            if (precisaReposicao(produto)) {
                reposicao.add(linha);
            }
        }

        linhas.sort(Comparator
                .comparing(ProdutoLinha::getValorCusto, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(ProdutoLinha::getNome, Comparator.nullsLast(String::compareToIgnoreCase)));
        reposicao.sort(Comparator.comparing(ProdutoLinha::getEstoque));

        dto.setValorCusto(valorCusto.setScale(2, RoundingMode.HALF_UP));
        dto.setValorVenda(valorVenda.setScale(2, RoundingMode.HALF_UP));
        dto.setMargemPercentual(margem(valorVenda, valorCusto));
        dto.setSkuAtivos(skuAtivos);
        dto.setSkuComEstoque(skuComEstoque);
        dto.setSkuReposicao(reposicao.size());
        dto.setPorMarca(ordenarGrupos(porMarca, false));
        dto.setPorFornecedor(ordenarGrupos(porFornecedor, false));
        dto.setMargensMarca(ordenarGrupos(porMarca, true));
        dto.setReposicoesAno(serieReposicoes());
        dto.setProdutos(linhas);
        dto.setReposicao(reposicao);
        dto.setMaisVendidos(maisVendidos(linhas));
        return dto;
    }

    public long contarReposicao() {
        return produtoRepository.findAll().stream()
                .filter(p -> !Boolean.FALSE.equals(p.getAtivo()))
                .filter(this::precisaReposicao)
                .count();
    }

    @Transactional
    public PedidosCompraGeradosDTO gerarPedidos(List<Long> idsPedidos) {
        DashboardSuprimentosDTO painel = montar();
        Map<Long, ProdutoLinha> porId = new HashMap<>();
        for (ProdutoLinha linha : painel.getProdutos()) {
            porId.put(linha.getId(), linha);
        }
        List<ProdutoLinha> escolhidos = new ArrayList<>();
        if (idsPedidos == null || idsPedidos.isEmpty()) {
            escolhidos.addAll(painel.getReposicao());
        } else {
            for (Long id : idsPedidos) {
                ProdutoLinha linha = porId.get(id);
                if (linha != null && linha.getComprar().compareTo(BigDecimal.ZERO) > 0) {
                    escolhidos.add(linha);
                }
            }
        }
        if (escolhidos.isEmpty()) {
            throw new IllegalArgumentException("Nenhum produto precisa de reposição para gerar pedido.");
        }

        Map<Long, List<ProdutoLinha>> porFornecedor = new LinkedHashMap<>();
        for (ProdutoLinha linha : escolhidos) {
            Long chave = linha.getFornecedorId() == null ? 0L : linha.getFornecedorId();
            porFornecedor.computeIfAbsent(chave, k -> new ArrayList<>()).add(linha);
        }

        PedidosCompraGeradosDTO saida = new PedidosCompraGeradosDTO();
        int itens = 0;
        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, List<ProdutoLinha>> grupo : porFornecedor.entrySet()) {
            OrdemCompra ordem = new OrdemCompra();
            Long fornecedorId = grupo.getKey() == 0L ? null : grupo.getKey();
            ordem.setFornecedorId(fornecedorId);
            ordem.setDataEmissao(LocalDateTime.now());
            ordem.setStatus("ABERTA");
            ordem.setObservacao("Gerada pelo dashboard de suprimentos");
            BigDecimal valorOrdem = BigDecimal.ZERO;
            for (ProdutoLinha linha : grupo.getValue()) {
                valorOrdem = valorOrdem.add(linha.getCusto().multiply(linha.getComprar()));
            }
            ordem.setValorTotal(valorOrdem.setScale(2, RoundingMode.HALF_UP));
            OrdemCompra salvo = ordemCompraRepository.save(ordem);
            auditoria.registrarCriacao("PEDIDO", salvo.getId(), "OC #" + salvo.getId(), salvo);

            for (ProdutoLinha linha : grupo.getValue()) {
                OrdemCompraItem item = new OrdemCompraItem();
                item.setOrdemId(salvo.getId());
                item.setProdutoId(linha.getId());
                item.setQuantidade(linha.getComprar());
                item.setValorUnitario(linha.getCusto());
                item.setValorTotal(linha.getCusto().multiply(linha.getComprar()).setScale(2, RoundingMode.HALF_UP));
                ordemCompraItemRepository.save(item);
                itens++;
            }
            total = total.add(salvo.getValorTotal());
            saida.getOrdens().add(salvo);
        }
        saida.setQuantidadeOrdens(saida.getOrdens().size());
        saida.setQuantidadeItens(itens);
        saida.setValorTotal(total.setScale(2, RoundingMode.HALF_UP));
        return saida;
    }

    private ProdutoLinha linhaDe(
            Produto produto,
            Map<Integer, String> marcas,
            Map<Long, String> fornecedores,
            VendaSku venda
    ) {
        BigDecimal estoque = n(produto.getEstoque());
        BigDecimal minimo = n(produto.getEstoqueMinimo());
        BigDecimal custo = custoDe(produto);
        BigDecimal preco = n(produto.getPreco());
        ProdutoLinha linha = new ProdutoLinha();
        linha.setId(produto.getId());
        linha.setSku(produto.getSku());
        linha.setNome(produto.getNome());
        linha.setMarca(nomeMarca(produto.getMarcaId(), marcas));
        linha.setFornecedor(nomeFornecedor(produto.getFornecedorId(), fornecedores));
        linha.setFornecedorId(produto.getFornecedorId());
        linha.setLocalizacao(produto.getLocalizacao());
        linha.setEstoque(estoque);
        linha.setEstoqueMinimo(minimo);
        linha.setCusto(custo);
        linha.setPreco(preco);
        linha.setValorCusto(custo.multiply(estoque).setScale(2, RoundingMode.HALF_UP));
        linha.setValorVenda(preco.multiply(estoque).setScale(2, RoundingMode.HALF_UP));
        linha.setMargemPercentual(margem(preco, custo));
        linha.setComprar(quantidadeComprar(produto));
        if (venda != null) {
            linha.setQtd15(venda.qtd15);
            linha.setQtd30(venda.qtd30);
            linha.setQtd45(venda.qtd45);
        }
        return linha;
    }

    private void agregarVendas(List<Produto> produtos, Map<Long, VendaSku> porProduto, VendasPeriodo vendas) {
        LocalDate hoje = LocalDate.now();
        LocalDateTime corte45 = hoje.minusDays(45).atStartOfDay();
        List<PedidoVenda> pedidos = pedidoVendaRepository.findByDataPedidoGreaterThanEqual(corte45);
        Map<Long, Produto> porId = new HashMap<>();
        Map<String, Produto> porSku = new HashMap<>();
        for (Produto produto : produtos) {
            porId.put(produto.getId(), produto);
            if (produto.getSku() != null && !produto.getSku().isBlank()) {
                porSku.putIfAbsent(produto.getSku().trim().toLowerCase(PT), produto);
            }
        }
        for (PedidoVenda pedido : pedidos) {
            if (!vendaValida(pedido) || pedido.getDataPedido() == null) {
                continue;
            }
            long dias = java.time.temporal.ChronoUnit.DAYS.between(pedido.getDataPedido().toLocalDate(), hoje);
            if (dias > 45) {
                continue;
            }
            for (Map<String, Object> item : itensDe(pedido)) {
                BigDecimal qtd = n(item.get("quantidade"));
                if (qtd.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                BigDecimal valor = valorItem(item, qtd);
                somarPeriodo(vendas, dias, qtd, valor);
                Produto produto = produtoDe(item, porId, porSku);
                if (produto == null) {
                    continue;
                }
                VendaSku acc = porProduto.computeIfAbsent(produto.getId(), k -> new VendaSku());
                if (dias <= 15) {
                    acc.qtd15 = acc.qtd15.add(qtd);
                }
                if (dias <= 30) {
                    acc.qtd30 = acc.qtd30.add(qtd);
                }
                acc.qtd45 = acc.qtd45.add(qtd);
            }
        }
    }

    private List<Ponto> serieReposicoes() {
        LocalDate inicioMes = LocalDate.now().withDayOfMonth(1);
        LocalDate primeiro = inicioMes.minusMonths(11);
        Map<String, Ponto> serie = new LinkedHashMap<>();
        for (int i = 0; i < 12; i++) {
            LocalDate mes = primeiro.plusMonths(i);
            Ponto ponto = new Ponto();
            ponto.setMes(mes.format(MES_CHAVE));
            String rotulo = mes.format(MES_ROTULO);
            ponto.setRotulo(rotulo.isEmpty() ? ponto.getMes() : rotulo.replace(".", ""));
            serie.put(ponto.getMes(), ponto);
        }
        List<EstoqueMovimentacao> movimentos = movimentacaoRepository
                .findByTipoIgnoreCaseAndDataMovimentoGreaterThanEqual(
                        "ENTRADA",
                        primeiro.atStartOfDay()
                );
        for (EstoqueMovimentacao mov : movimentos) {
            if (mov.getDataMovimento() == null) {
                continue;
            }
            String status = mov.getStatus() == null ? "" : mov.getStatus().toUpperCase(PT);
            if (status.contains("ESTORN") || status.contains("CANCEL")) {
                continue;
            }
            String origem = mov.getOrigem() == null ? "" : mov.getOrigem().toUpperCase(PT);
            if (!origem.isBlank() && !ORIGENS_REPOSICAO.contains(origem)) {
                continue;
            }
            String chave = mov.getDataMovimento().format(MES_CHAVE);
            Ponto ponto = serie.get(chave);
            if (ponto == null) {
                continue;
            }
            ponto.setQuantidade(ponto.getQuantidade().add(n(mov.getQuantidade())));
            ponto.setValor(ponto.getValor().add(n(mov.getQuantidade())));
        }
        return new ArrayList<>(serie.values());
    }

    private List<ProdutoLinha> maisVendidos(List<ProdutoLinha> linhas) {
        return linhas.stream()
                .filter(l -> l.getQtd45().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator.comparing(ProdutoLinha::getQtd45).reversed())
                .limit(12)
                .toList();
    }

    private Map<Integer, String> nomesMarcas() {
        Map<Integer, String> nomes = new HashMap<>();
        for (Marca marca : marcaRepository.findAll()) {
            if (marca.getId() != null) {
                nomes.put(marca.getId().intValue(), marca.getNome());
            }
        }
        return nomes;
    }

    private Map<Long, String> nomesFornecedores() {
        Map<Long, String> nomes = new HashMap<>();
        for (Cliente cliente : clienteRepository.findAll()) {
            if (cliente.getId() == null) {
                continue;
            }
            String tipo = cliente.getTipo() == null ? "" : cliente.getTipo().toUpperCase(PT);
            String nome = texto(cliente.getNomeFantasia(), cliente.getNome());
            if (nome != null && (tipo.contains("FORNEC") || nomes.get(cliente.getId()) == null)) {
                nomes.put(cliente.getId(), nome);
            }
        }
        try (var conexao = dataSource.getConnection();
             var stmt = conexao.createStatement();
             ResultSet rs = stmt.executeQuery(
                     "SELECT id, razao_social, nome_fantasia FROM fornecedores")) {
            while (rs.next()) {
                long id = rs.getLong("id");
                String nome = texto(rs.getString("nome_fantasia"), rs.getString("razao_social"));
                if (nome != null) {
                    nomes.put(id, nome);
                }
            }
        } catch (Exception ignored) {
            /* tabela opcional */
        }
        return nomes;
    }

    private boolean precisaReposicao(Produto produto) {
        BigDecimal estoque = n(produto.getEstoque());
        BigDecimal minimo = n(produto.getEstoqueMinimo());
        if (estoque.compareTo(BigDecimal.ZERO) <= 0) {
            return true;
        }
        return minimo.compareTo(BigDecimal.ZERO) > 0 && estoque.compareTo(minimo) <= 0;
    }

    private BigDecimal quantidadeComprar(Produto produto) {
        BigDecimal estoque = n(produto.getEstoque());
        BigDecimal minimo = n(produto.getEstoqueMinimo());
        BigDecimal maximo = n(produto.getEstoqueMaximo());
        if (maximo.compareTo(estoque) > 0) {
            return maximo.subtract(estoque);
        }
        if (minimo.compareTo(estoque) > 0) {
            return minimo.subtract(estoque);
        }
        if (estoque.compareTo(BigDecimal.ZERO) <= 0) {
            return minimo.compareTo(BigDecimal.ZERO) > 0 ? minimo : BigDecimal.ONE;
        }
        if (minimo.compareTo(BigDecimal.ZERO) > 0 && estoque.compareTo(minimo) <= 0) {
            return minimo;
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal custoDe(Produto produto) {
        if (produto.getCusto() != null && produto.getCusto().compareTo(BigDecimal.ZERO) > 0) {
            return produto.getCusto();
        }
        if (produto.getCustoMedio() != null && produto.getCustoMedio().compareTo(BigDecimal.ZERO) > 0) {
            return produto.getCustoMedio();
        }
        if (produto.getCustoCompra() != null && produto.getCustoCompra().compareTo(BigDecimal.ZERO) > 0) {
            return produto.getCustoCompra();
        }
        return n(produto.getCusto());
    }

    private void acumularGrupo(Map<String, Grupo> grupos, String nome, ProdutoLinha linha) {
        Grupo grupo = grupos.computeIfAbsent(nome, n -> {
            Grupo g = new Grupo();
            g.setNome(n);
            return g;
        });
        grupo.setQuantidade(grupo.getQuantidade().add(linha.getEstoque()));
        grupo.setValorCusto(grupo.getValorCusto().add(linha.getValorCusto()));
        grupo.setValorVenda(grupo.getValorVenda().add(linha.getValorVenda()));
        grupo.setItens(grupo.getItens() + 1);
        grupo.setMargemPercentual(margem(grupo.getValorVenda(), grupo.getValorCusto()));
    }

    private List<Grupo> ordenarGrupos(Map<String, Grupo> grupos, boolean porMargem) {
        Comparator<Grupo> cmp = porMargem
                ? Comparator.comparing(Grupo::getMargemPercentual, Comparator.nullsLast(Comparator.reverseOrder()))
                : Comparator.comparing(Grupo::getValorCusto, Comparator.nullsLast(Comparator.reverseOrder()));
        return grupos.values().stream()
                .filter(g -> porMargem
                        ? g.getValorCusto().compareTo(BigDecimal.ZERO) > 0
                        : g.getQuantidade().compareTo(BigDecimal.ZERO) > 0
                                || g.getValorCusto().compareTo(BigDecimal.ZERO) > 0)
                .sorted(cmp.thenComparing(Grupo::getNome, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private Produto produtoDe(Map<String, Object> item, Map<Long, Produto> porId, Map<String, Produto> porSku) {
        Long id = numeroLong(item.get("produtoId"));
        if (id != null && porId.containsKey(id)) {
            return porId.get(id);
        }
        Object skuBruto = item.get("sku");
        if (skuBruto == null) {
            return null;
        }
        String sku = String.valueOf(skuBruto).trim().toLowerCase(PT);
        return sku.isBlank() ? null : porSku.get(sku);
    }

    private List<Map<String, Object>> itensDe(PedidoVenda pedido) {
        String bruto = pedido.getDetalhes();
        if (bruto == null || bruto.isBlank()) {
            return List.of();
        }
        try {
            if (bruto.trim().startsWith("[")) {
                return mapper.readValue(bruto, new TypeReference<List<Map<String, Object>>>() {});
            }
            Map<String, Object> obj = mapper.readValue(bruto, new TypeReference<Map<String, Object>>() {});
            Object itens = obj.get("itens");
            if (itens instanceof List<?>) {
                return mapper.convertValue(itens, new TypeReference<List<Map<String, Object>>>() {});
            }
        } catch (Exception ignored) {
            /* detalhes inválido */
        }
        return List.of();
    }

    private void somarPeriodo(VendasPeriodo vendas, long dias, BigDecimal qtd, BigDecimal valor) {
        if (dias <= 15) {
            vendas.setQtd15(vendas.getQtd15().add(qtd));
            vendas.setValor15(vendas.getValor15().add(valor));
        }
        if (dias <= 30) {
            vendas.setQtd30(vendas.getQtd30().add(qtd));
            vendas.setValor30(vendas.getValor30().add(valor));
        }
        vendas.setQtd45(vendas.getQtd45().add(qtd));
        vendas.setValor45(vendas.getValor45().add(valor));
    }

    private boolean vendaValida(PedidoVenda pedido) {
        String status = pedido.getStatus() == null ? "" : pedido.getStatus().toUpperCase(PT);
        if (status.contains("CANCEL") || status.contains("RECUS") || status.contains("RASCUNHO")) {
            return false;
        }
        if (status.contains("ORCAMENT") || status.contains("ORÇAMENT")) {
            return false;
        }
        return true;
    }

    private BigDecimal valorItem(Map<String, Object> item, BigDecimal qtd) {
        BigDecimal direto = primeiroPositivo(item.get("valorTotal"), item.get("valor"), item.get("total"));
        if (direto.compareTo(BigDecimal.ZERO) > 0) {
            return direto;
        }
        BigDecimal unitario = primeiroPositivo(item.get("preco"), item.get("precoUnitario"), item.get("valorUnitario"));
        return unitario.multiply(qtd);
    }

    private BigDecimal primeiroPositivo(Object... valores) {
        for (Object valor : valores) {
            BigDecimal n = n(valor);
            if (n.compareTo(BigDecimal.ZERO) > 0) {
                return n;
            }
        }
        return BigDecimal.ZERO;
    }

    private String nomeMarca(Integer marcaId, Map<Integer, String> marcas) {
        if (marcaId == null) {
            return "Sem marca";
        }
        String nome = marcas.get(marcaId);
        return nome == null || nome.isBlank() ? "Marca #" + marcaId : nome;
    }

    private String nomeFornecedor(Long fornecedorId, Map<Long, String> fornecedores) {
        if (fornecedorId == null) {
            return "Sem fornecedor";
        }
        String nome = fornecedores.get(fornecedorId);
        return nome == null || nome.isBlank() ? "Fornecedor #" + fornecedorId : nome;
    }

    private String texto(String... valores) {
        for (String valor : valores) {
            if (valor != null && !valor.isBlank()) {
                return valor.trim();
            }
        }
        return null;
    }

    private BigDecimal margem(BigDecimal venda, BigDecimal custo) {
        if (venda == null || venda.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return venda.subtract(n(custo))
                .multiply(BigDecimal.valueOf(100))
                .divide(venda, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal n(Object valor) {
        if (valor == null) {
            return BigDecimal.ZERO;
        }
        if (valor instanceof BigDecimal n) {
            return n;
        }
        if (valor instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        try {
            return new BigDecimal(String.valueOf(valor).replace(",", "."));
        } catch (Exception ex) {
            return BigDecimal.ZERO;
        }
    }

    private Long numeroLong(Object valor) {
        if (valor == null) {
            return null;
        }
        try {
            long n = Long.parseLong(String.valueOf(valor).replaceAll("\\.0$", ""));
            return n > 0 ? n : null;
        } catch (Exception ex) {
            return null;
        }
    }

    private static class VendaSku {
        private BigDecimal qtd15 = BigDecimal.ZERO;
        private BigDecimal qtd30 = BigDecimal.ZERO;
        private BigDecimal qtd45 = BigDecimal.ZERO;
    }
}
