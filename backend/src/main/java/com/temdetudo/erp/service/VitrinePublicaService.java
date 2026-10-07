package com.temdetudo.erp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.temdetudo.erp.entity.Marca;
import com.temdetudo.erp.entity.PedidoVenda;
import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.repository.MarcaRepository;
import com.temdetudo.erp.repository.PedidoVendaRepository;
import com.temdetudo.erp.repository.ProdutoRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeSet;

@Service
public class VitrinePublicaService {

    private static final int MAX_ITENS = 80;
    private static final int MAX_QTD = 99;

    private final ProdutoRepository produtoRepository;
    private final MarcaRepository marcaRepository;
    private final PedidoVendaRepository pedidoRepository;
    private final ObjectMapper mapper;

    public VitrinePublicaService(
            ProdutoRepository produtoRepository,
            MarcaRepository marcaRepository,
            PedidoVendaRepository pedidoRepository,
            ObjectMapper mapper
    ) {
        this.produtoRepository = produtoRepository;
        this.marcaRepository = marcaRepository;
        this.pedidoRepository = pedidoRepository;
        this.mapper = mapper;
    }

    public Map<String, Object> catalogo() {
        Map<Long, String> marcas = new LinkedHashMap<>();
        for (Marca marca : marcaRepository.findAll()) {
            if (marca.getId() != null && marca.getNome() != null && !marca.getNome().isBlank()) {
                marcas.put(marca.getId(), marca.getNome().trim());
            }
        }

        List<Map<String, Object>> produtos = new ArrayList<>();
        TreeSet<String> grupos = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        TreeSet<String> marcasUsadas = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);

        for (Object[] linha : produtoRepository.listarResumoVitrine()) {
            if (Boolean.FALSE.equals(linha[11])) {
                continue;
            }
            BigDecimal preco = decimal(linha[3]);
            if (preco.signum() <= 0) {
                continue;
            }
            String grupo = texto(linha[7]);
            String raiz = grupo.contains(">") ? grupo.substring(0, grupo.indexOf('>')).trim() : grupo;
            String marca = "";
            if (linha[8] instanceof Number numero) {
                marca = marcas.getOrDefault(numero.longValue(), "");
            }
            if (!raiz.isBlank()) {
                grupos.add(raiz);
            }
            if (!marca.isBlank()) {
                marcasUsadas.add(marca);
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", linha[0]);
            item.put("sku", texto(linha[1]));
            item.put("nome", texto(linha[2]));
            item.put("preco", preco);
            item.put("precoPromocional", decimal(linha[4]));
            item.put("descontoPercentual", decimal(linha[5]));
            item.put("unidade", texto(linha[6]).isBlank() ? "UN" : texto(linha[6]));
            item.put("grupo", grupo);
            item.put("categoria", grupo);
            item.put("marca", marca);
            item.put("estoque", decimal(linha[9]));
            item.put("imagem", urlCurta(texto(linha[10])));
            item.put("ativo", true);
            produtos.add(item);
        }

        List<Map<String, Object>> gruposSaida = new ArrayList<>();
        long ordem = 1;
        for (String nome : grupos) {
            gruposSaida.add(Map.of("id", ordem++, "nome", nome));
        }
        List<Map<String, Object>> marcasSaida = new ArrayList<>();
        ordem = 1;
        for (String nome : marcasUsadas) {
            marcasSaida.add(Map.of("id", ordem++, "nome", nome));
        }

        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("produtos", produtos);
        corpo.put("grupos", gruposSaida);
        corpo.put("marcas", marcasSaida);
        return corpo;
    }

    public Map<String, Object> pedir(Map<String, Object> corpo) {
        if (corpo == null) {
            throw new IllegalArgumentException("Informe os dados do pedido.");
        }
        String nome = texto(corpo.get("nome"));
        if (nome.isBlank()) {
            throw new IllegalArgumentException("Informe seu nome.");
        }
        if (!(corpo.get("itens") instanceof List<?> itens) || itens.isEmpty()) {
            throw new IllegalArgumentException("O carrinho está vazio.");
        }
        if (itens.size() > MAX_ITENS) {
            throw new IllegalArgumentException("O pedido passou do limite de itens.");
        }

        List<Map<String, Object>> linhas = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (Object bruto : itens) {
            if (!(bruto instanceof Map<?, ?> item)) {
                continue;
            }
            Produto produto = achar(item);
            if (produto == null || Boolean.FALSE.equals(produto.getAtivo())) {
                continue;
            }
            BigDecimal unitario = precoDe(produto);
            if (unitario.signum() <= 0) {
                continue;
            }
            int qtd = quantidade(item.get("qtd"));
            total = total.add(unitario.multiply(BigDecimal.valueOf(qtd)));
            Map<String, Object> linha = new LinkedHashMap<>();
            linha.put("produtoId", produto.getId());
            linha.put("sku", texto(produto.getSku()));
            linha.put("descricao", texto(produto.getNome()));
            linha.put("quantidade", qtd);
            linha.put("valorUnitario", unitario);
            linhas.add(linha);
        }
        if (linhas.isEmpty()) {
            throw new IllegalArgumentException("Nenhum item do carrinho está à venda no sistema.");
        }

        String pagamento = texto(corpo.get("pagamento"));
        if (pagamento.toLowerCase(Locale.ROOT).contains("pix")) {
            total = total.multiply(new BigDecimal("0.90")).setScale(2, RoundingMode.HALF_UP);
        } else {
            total = total.setScale(2, RoundingMode.HALF_UP);
        }

        String email = texto(corpo.get("email"));
        String telefone = texto(corpo.get("telefone"));
        String cidade = texto(corpo.get("cidade"));
        String uf = texto(corpo.get("uf"));
        String envio = texto(corpo.get("envio"));
        String extra = texto(corpo.get("observacoes"));

        PedidoVenda pedido = new PedidoVenda();
        pedido.setNumero(proximoNumero());
        pedido.setClienteNome(cortar(nome, 255));
        pedido.setDataPedido(LocalDateTime.now());
        pedido.setValorTotal(total);
        pedido.setStatus("APROVADO");
        pedido.setOrigem("Loja");
        pedido.setVendedor("Loja virtual");
        pedido.setEstoqueLancado(false);
        pedido.setContasLancadas(false);
        pedido.setSeparacao("PENDENTE");
        pedido.setExpedicao("PENDENTE");
        pedido.setObservacoes(cortar(juntar(
                "Site",
                email,
                telefone,
                cidade.isBlank() ? "" : cidade + (uf.isBlank() ? "" : "/" + uf),
                pagamento,
                envio,
                extra
        ), 2000));
        try {
            Map<String, Object> detalhes = new LinkedHashMap<>();
            detalhes.put("itens", linhas);
            detalhes.put("cidade", cidade);
            detalhes.put("uf", uf);
            detalhes.put("pagamento", pagamento);
            detalhes.put("formaEnvio", envio);
            detalhes.put("email", email);
            detalhes.put("telefone", telefone);
            pedido.setDetalhes(mapper.writeValueAsString(detalhes));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Não foi possível montar o pedido.");
        }
        PedidoVenda salvo = pedidoRepository.save(pedido);
        return Map.of("id", salvo.getId(), "numero", salvo.getNumero());
    }

    private Produto achar(Map<?, ?> item) {
        Object id = item.get("id");
        if (id instanceof Number numero && numero.longValue() > 0) {
            Produto porId = produtoRepository.findById(numero.longValue()).orElse(null);
            if (porId != null) {
                return porId;
            }
        }
        String sku = texto(item.get("sku"));
        if (sku.isBlank()) {
            return null;
        }
        return produtoRepository.findFirstBySkuIgnoreCase(sku).orElse(null);
    }

    private String proximoNumero() {
        String numero = "LJ-" + (pedidoRepository.count() + 1);
        if (pedidoRepository.findFirstByNumero(numero).isPresent()) {
            numero = "LJ-" + System.currentTimeMillis();
        }
        return numero;
    }

    private BigDecimal precoDe(Produto produto) {
        BigDecimal preco = produto.getPreco() == null ? BigDecimal.ZERO : produto.getPreco();
        BigDecimal promo = produto.getPrecoPromocional();
        if (promo != null && promo.signum() > 0 && promo.compareTo(preco) < 0) {
            return promo;
        }
        return preco;
    }

    private int quantidade(Object valor) {
        int qtd = 1;
        if (valor instanceof Number numero) {
            qtd = numero.intValue();
        } else if (valor != null) {
            try {
                qtd = Integer.parseInt(String.valueOf(valor).trim());
            } catch (NumberFormatException ex) {
                qtd = 1;
            }
        }
        if (qtd < 1) {
            return 1;
        }
        return Math.min(qtd, MAX_QTD);
    }

    private BigDecimal decimal(Object valor) {
        if (valor instanceof BigDecimal numero) {
            return numero;
        }
        if (valor instanceof Number numero) {
            return BigDecimal.valueOf(numero.doubleValue());
        }
        return BigDecimal.ZERO;
    }

    private String texto(Object valor) {
        return valor == null ? "" : String.valueOf(valor).trim();
    }

    private String urlCurta(String url) {
        if (url.isBlank() || url.length() > 400 || url.startsWith("data:")) {
            return "";
        }
        return url;
    }

    private String cortar(String valor, int limite) {
        if (valor.length() <= limite) {
            return valor;
        }
        return valor.substring(0, limite);
    }

    private String juntar(String... partes) {
        StringBuilder saida = new StringBuilder();
        for (String parte : partes) {
            if (parte == null || parte.isBlank()) {
                continue;
            }
            if (!saida.isEmpty()) {
                saida.append(" · ");
            }
            saida.append(parte.trim());
        }
        return saida.toString();
    }
}
