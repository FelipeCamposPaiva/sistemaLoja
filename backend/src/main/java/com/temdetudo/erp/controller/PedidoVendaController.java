package com.temdetudo.erp.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.temdetudo.erp.dto.NaturezaSugeridaDTO;
import com.temdetudo.erp.entity.Cliente;
import com.temdetudo.erp.entity.EstoqueMovimentacao;
import com.temdetudo.erp.entity.PedidoVenda;
import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.repository.ClienteRepository;
import com.temdetudo.erp.repository.EstoqueMovimentacaoRepository;
import com.temdetudo.erp.repository.PedidoVendaRepository;
import com.temdetudo.erp.repository.ProdutoRepository;
import com.temdetudo.erp.service.NaturezaOperacaoService;

import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;

import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos-venda")
@CrossOrigin("*")
public class PedidoVendaController {

    private final PedidoVendaRepository repository;
    private final ProdutoRepository produtoRepository;
    private final EstoqueMovimentacaoRepository estoqueRepository;
    private final ClienteRepository clienteRepository;
    private final NaturezaOperacaoService naturezaService;
    private final DataSource dataSource;
    private final ObjectMapper mapper;

    public PedidoVendaController(
            PedidoVendaRepository repository,
            ProdutoRepository produtoRepository,
            EstoqueMovimentacaoRepository estoqueRepository,
            ClienteRepository clienteRepository,
            NaturezaOperacaoService naturezaService,
            DataSource dataSource,
            ObjectMapper mapper
    ) {
        this.repository = repository;
        this.produtoRepository = produtoRepository;
        this.estoqueRepository = estoqueRepository;
        this.clienteRepository = clienteRepository;
        this.naturezaService = naturezaService;
        this.dataSource = dataSource;
        this.mapper = mapper;
    }

    @PostConstruct
    void ajustarColunas() {
        try (var conexao = dataSource.getConnection(); var stmt = conexao.createStatement()) {
            executar(stmt, "ALTER TABLE pedidos_venda MODIFY COLUMN status VARCHAR(40) NULL");
            executar(stmt, "ALTER TABLE pedidos_venda ADD COLUMN cliente_nome VARCHAR(255) NULL");
            executar(stmt, "ALTER TABLE pedidos_venda ADD COLUMN vendedor VARCHAR(500) NULL");
            executar(stmt, "ALTER TABLE pedidos_venda MODIFY COLUMN vendedor VARCHAR(500) NULL");
            executar(stmt, "ALTER TABLE pedidos_venda ADD COLUMN origem VARCHAR(80) NULL");
            executar(stmt, "ALTER TABLE pedidos_venda ADD COLUMN estoque_lancado TINYINT(1) NULL");
            executar(stmt, "ALTER TABLE pedidos_venda ADD COLUMN contas_lancadas TINYINT(1) NULL");
            executar(stmt, "ALTER TABLE pedidos_venda ADD COLUMN separacao VARCHAR(40) NULL");
            executar(stmt, "ALTER TABLE pedidos_venda ADD COLUMN expedicao VARCHAR(40) NULL");
            executar(stmt, "ALTER TABLE pedidos_venda ADD COLUMN detalhes LONGTEXT NULL");
        } catch (Exception ignored) {
            /* schema legado */
        }
    }

    private void executar(java.sql.Statement stmt, String sql) {
        try {
            stmt.execute(sql);
        } catch (Exception ignored) {
            /* coluna já existe */
        }
    }

    @GetMapping
    public List<PedidoVenda> listar(
            @RequestParam(required = false) Boolean estoqueLancado,
            @RequestParam(required = false) Boolean contasLancadas
    ) {
        List<PedidoVenda> lista = repository.findAll();
        if (estoqueLancado != null) {
            lista = lista.stream()
                    .filter((p) -> estoqueLancado.equals(Boolean.TRUE.equals(p.getEstoqueLancado())))
                    .toList();
        }
        if (contasLancadas != null) {
            lista = lista.stream()
                    .filter((p) -> contasLancadas.equals(Boolean.TRUE.equals(p.getContasLancadas())))
                    .toList();
        }
        return lista;
    }

    @GetMapping("/{id}")
    public PedidoVenda buscar(@PathVariable Integer id) {
        return repository.findById(id).orElseThrow();
    }

    @PostMapping
    public PedidoVenda salvar(@RequestBody PedidoVenda pedido) {
        preparar(pedido);
        if (pedido.getNumero() == null || pedido.getNumero().isBlank()) {
            pedido.setNumero("PV-" + (repository.count() + 1));
        }
        return repository.save(pedido);
    }

    @PostMapping("/importar")
    public Map<String, Integer> importar(@RequestBody List<PedidoVenda> itens) {
        int novos = 0;
        int atualizados = 0;
        int erros = 0;
        if (itens == null) {
            return resumoImportacao(0, 0, 0);
        }
        for (PedidoVenda recebido : itens) {
            try {
                preparar(recebido);
                PedidoVenda existente = localizar(recebido);
                if (existente == null) {
                    recebido.setId(null);
                    if (recebido.getNumero() == null || recebido.getNumero().isBlank()) {
                        recebido.setNumero("PV-" + (repository.count() + 1));
                    }
                    repository.save(recebido);
                    novos++;
                    continue;
                }
                copiar(existente, recebido);
                preparar(existente);
                repository.save(existente);
                atualizados++;
            } catch (Exception ex) {
                erros++;
            }
        }
        return resumoImportacao(novos, atualizados, erros);
    }

    @PutMapping("/{id}")
    public PedidoVenda atualizar(@PathVariable Integer id, @RequestBody PedidoVenda pedido) {
        pedido.setId(id);
        preparar(pedido);
        return repository.save(pedido);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Integer id) {
        repository.deleteById(id);
    }

    @PostMapping("/{id}/lancar-estoque")
    @Transactional
    public Map<String, Object> lancarEstoque(@PathVariable Integer id) {
        return lancarUm(repository.findById(id).orElseThrow());
    }

    @PostMapping("/lancar-estoque")
    @Transactional
    public Map<String, Object> lancarLote(@RequestBody List<Integer> ids) {
        int ok = 0;
        int erros = 0;
        List<String> mensagens = new ArrayList<>();
        if (ids != null) {
            for (Integer id : ids) {
                try {
                    PedidoVenda pedido = repository.findById(id).orElse(null);
                    if (pedido == null) {
                        erros++;
                        continue;
                    }
                    Map<String, Object> resumo = lancarUm(pedido);
                    if (Boolean.TRUE.equals(resumo.get("ok"))) {
                        ok++;
                    } else {
                        erros++;
                        mensagens.add(String.valueOf(resumo.get("mensagem")));
                    }
                } catch (Exception ex) {
                    erros++;
                    mensagens.add(ex.getMessage());
                }
            }
        }
        Map<String, Object> saida = new HashMap<>();
        saida.put("ok", ok);
        saida.put("erros", erros);
        saida.put("mensagens", mensagens);
        return saida;
    }

    @PutMapping("/{id}/flags")
    public PedidoVenda flags(@PathVariable Integer id, @RequestBody Map<String, Object> corpo) {
        PedidoVenda pedido = repository.findById(id).orElseThrow();
        if (corpo.containsKey("estoqueLancado")) {
            pedido.setEstoqueLancado(Boolean.TRUE.equals(corpo.get("estoqueLancado")));
        }
        if (corpo.containsKey("contasLancadas")) {
            pedido.setContasLancadas(Boolean.TRUE.equals(corpo.get("contasLancadas")));
        }
        if (corpo.get("separacao") != null) {
            pedido.setSeparacao(String.valueOf(corpo.get("separacao")));
        }
        if (corpo.get("expedicao") != null) {
            pedido.setExpedicao(String.valueOf(corpo.get("expedicao")));
        }
        if (corpo.get("status") != null) {
            pedido.setStatus(String.valueOf(corpo.get("status")));
        }
        gravarDetalheExpedicao(pedido, corpo);
        return repository.save(pedido);
    }

    private void gravarDetalheExpedicao(PedidoVenda pedido, Map<String, Object> corpo) {
        String[] campos = {"embalagem", "rastreio", "formaEnvio", "volumes", "notaFiscal", "dataLimiteDespacho"};
        Map<String, Object> extra = null;
        for (String campo : campos) {
            if (!corpo.containsKey(campo) || corpo.get(campo) == null) {
                continue;
            }
            if (extra == null) {
                extra = detalhesMutavel(pedido);
            }
            extra.put(campo, String.valueOf(corpo.get(campo)));
        }
        if (extra == null) {
            return;
        }
        try {
            pedido.setDetalhes(mapper.writeValueAsString(extra));
        } catch (Exception ex) {
            throw new IllegalStateException("Não foi possível gravar os dados de expedição.");
        }
    }

    private Map<String, Object> detalhesMutavel(PedidoVenda pedido) {
        Map<String, Object> extra = new HashMap<>();
        String bruto = pedido.getDetalhes();
        if (bruto == null || bruto.isBlank()) {
            return extra;
        }
        try {
            String texto = bruto.trim();
            if (texto.startsWith("{")) {
                extra.putAll(mapper.readValue(texto, new TypeReference<Map<String, Object>>() {}));
            } else if (texto.startsWith("[")) {
                extra.put("itens", mapper.readValue(texto, new TypeReference<List<Map<String, Object>>>() {}));
            }
        } catch (Exception ignored) {
            /* detalhes inválido */
        }
        return extra;
    }

    private Map<String, Object> lancarUm(PedidoVenda pedido) {
        Map<String, Object> saida = new HashMap<>();
        if (Boolean.TRUE.equals(pedido.getEstoqueLancado())) {
            saida.put("ok", true);
            saida.put("mensagem", "Já estava lançado.");
            saida.put("pedido", pedido);
            return saida;
        }
        try {
            List<Map<String, Object>> itens = itensDe(pedido);
            for (Map<String, Object> item : itens) {
                BigDecimal qtd = numero(item.get("quantidade"));
                if (qtd.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                Produto produto = produtoDe(item);
                if (produto == null) {
                    continue;
                }
                Long produtoId = produto.getId();
                BigDecimal estoque = produto.getEstoque() == null ? BigDecimal.ZERO : produto.getEstoque();
                if (estoque.compareTo(qtd) < 0) {
                    throw new RuntimeException("Estoque insuficiente em " + produto.getNome());
                }
                produto.setEstoque(estoque.subtract(qtd));
                produtoRepository.save(produto);
                EstoqueMovimentacao mov = new EstoqueMovimentacao();
                mov.setProdutoId(produtoId);
                mov.setTipo("SAIDA");
                mov.setQuantidade(qtd);
                mov.setObservacao("Pedido " + pedido.getNumero());
                mov.setDataMovimento(LocalDateTime.now());
                estoqueRepository.save(mov);
            }
            pedido.setEstoqueLancado(true);
            repository.save(pedido);
            saida.put("ok", true);
            saida.put("pedido", pedido);
        } catch (Exception ex) {
            saida.put("ok", false);
            saida.put("mensagem", pedido.getNumero() + ": " + ex.getMessage());
        }
        return saida;
    }

    private Produto produtoDe(Map<String, Object> item) {
        Long produtoId = numeroLong(item.get("produtoId"));
        if (produtoId != null) {
            Produto porId = produtoRepository.findById(produtoId).orElse(null);
            if (porId != null) {
                return porId;
            }
        }
        Object skuBruto = item.get("sku");
        if (skuBruto == null) {
            return null;
        }
        String sku = String.valueOf(skuBruto).trim();
        if (sku.isBlank()) {
            return null;
        }
        return produtoRepository.findFirstBySkuIgnoreCase(sku).orElse(null);
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

    private void preparar(PedidoVenda pedido) {
        if (pedido.getDataPedido() == null) {
            pedido.setDataPedido(LocalDateTime.now());
        }
        if (pedido.getStatus() == null || pedido.getStatus().isBlank()) {
            pedido.setStatus("APROVADO");
        }
        if (pedido.getEstoqueLancado() == null) {
            pedido.setEstoqueLancado(false);
        }
        if (pedido.getContasLancadas() == null) {
            pedido.setContasLancadas(false);
        }
        if (pedido.getSeparacao() == null || pedido.getSeparacao().isBlank()) {
            pedido.setSeparacao("PENDENTE");
        }
        if (pedido.getExpedicao() == null || pedido.getExpedicao().isBlank()) {
            pedido.setExpedicao("PENDENTE");
        }
        aplicarNatureza(pedido);
    }

    private PedidoVenda localizar(PedidoVenda recebido) {
        if (recebido.getNumero() == null || recebido.getNumero().isBlank()) {
            return null;
        }
        return repository.findFirstByNumero(recebido.getNumero().trim()).orElse(null);
    }

    private void copiar(PedidoVenda dest, PedidoVenda src) {
        dest.setNumero(src.getNumero());
        dest.setClienteId(src.getClienteId());
        dest.setClienteNome(src.getClienteNome());
        if (src.getDataPedido() != null) {
            dest.setDataPedido(src.getDataPedido());
        }
        dest.setValorTotal(src.getValorTotal());
        dest.setStatus(src.getStatus());
        dest.setVendedor(src.getVendedor());
        dest.setOrigem(src.getOrigem());
        dest.setObservacoes(src.getObservacoes());
        dest.setEstoqueLancado(src.getEstoqueLancado());
        dest.setContasLancadas(src.getContasLancadas());
        dest.setSeparacao(src.getSeparacao());
        dest.setExpedicao(src.getExpedicao());
        dest.setDetalhes(src.getDetalhes());
        dest.setNaturezaOperacaoId(src.getNaturezaOperacaoId());
        dest.setNaturezaOperacao(src.getNaturezaOperacao());
        dest.setCfop(src.getCfop());
    }

    private Map<String, Integer> resumoImportacao(int novos, int atualizados, int erros) {
        Map<String, Integer> saida = new HashMap<>();
        saida.put("novos", novos);
        saida.put("atualizados", atualizados);
        saida.put("erros", erros);
        saida.put("total", novos + atualizados);
        return saida;
    }

    private void aplicarNatureza(PedidoVenda pedido) {
        if (pedido.getCfop() != null && !pedido.getCfop().isBlank()
                && pedido.getNaturezaOperacao() != null && !pedido.getNaturezaOperacao().isBlank()) {
            return;
        }
        Cliente cliente = null;
        if (pedido.getClienteId() != null) {
            cliente = clienteRepository.findById(pedido.getClienteId().longValue()).orElse(null);
        }
        NaturezaSugeridaDTO sugestao = naturezaService.sugerir(cliente);
        if (pedido.getNaturezaOperacaoId() == null) {
            pedido.setNaturezaOperacaoId(sugestao.getNaturezaId());
        }
        if (pedido.getNaturezaOperacao() == null || pedido.getNaturezaOperacao().isBlank()) {
            pedido.setNaturezaOperacao(sugestao.getNome());
        }
        if (pedido.getCfop() == null || pedido.getCfop().isBlank()) {
            pedido.setCfop(sugestao.getCfop());
        }
    }

    private BigDecimal numero(Object valor) {
        if (valor instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        try {
            return new BigDecimal(String.valueOf(valor));
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
}
