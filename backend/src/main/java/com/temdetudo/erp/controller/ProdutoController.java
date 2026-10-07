package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.PrecoLoteDTO;
import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.estoque.EstoqueOrigem;
import com.temdetudo.erp.preco.PrecoPromocional;
import com.temdetudo.erp.repository.ProdutoRepository;
import com.temdetudo.erp.service.AuditoriaService;
import com.temdetudo.erp.service.EstoqueAuditoriaService;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeSet;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/produtos")
@CrossOrigin("*")
public class ProdutoController {

    @Autowired
    private ProdutoRepository repository;

    @Autowired
    private AuditoriaService auditoria;

    @Autowired
    private EstoqueAuditoriaService estoqueAuditoria;

    @Autowired
    private DataSource dataSource;

    @PostConstruct
    void ampliarLocalizacao() {
        try (var conexao = dataSource.getConnection(); var stmt = conexao.createStatement()) {
            stmt.execute("ALTER TABLE produtos MODIFY COLUMN localizacao VARCHAR(255) NULL");
        } catch (Exception ignored) {
            /* coluna já pode ter o tamanho novo */
        }
    }

    @GetMapping
    public List<Produto> listar(
            @RequestParam(required = false) String localizacao,
            @RequestParam(required = false) Boolean comEstoque
    ) {
        return repository.findAll().stream()
                .filter(p -> naLocalizacao(p, localizacao))
                .filter(p -> !Boolean.TRUE.equals(comEstoque) || comEstoque(p))
                .collect(Collectors.toList());
    }

    @GetMapping("/localizacoes")
    public List<String> localizacoes() {
        TreeSet<String> saida = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        for (Produto produto : repository.findAll()) {
            if (produto.getLocalizacao() == null || produto.getLocalizacao().isBlank()) {
                continue;
            }
            for (String parte : produto.getLocalizacao().split("[,;/|]+")) {
                String t = parte.trim();
                if (!t.isEmpty()) {
                    saida.add(t);
                }
            }
        }
        return List.copyOf(saida);
    }

    @GetMapping("/{id}")
    public Produto buscar(
            @PathVariable Long id
    ) {

        return repository.findById(id)
                .orElseThrow();

    }

    @PostMapping
    public Produto salvar(
            @RequestBody Produto produto
    ) {

        if (produto.getAtivo() == null) {

            produto.setAtivo(true);

        }

        preparar(produto);

        BigDecimal estoqueInicial = produto.getEstoque();
        produto.setEstoque(BigDecimal.ZERO);
        Produto salvo = repository.save(produto);
        estoqueAuditoria.ajustarPara(
                salvo.getId(),
                estoqueInicial,
                "ENTRADA",
                EstoqueOrigem.CADASTRO,
                salvo.getId(),
                "Cadastro do produto",
                "Saldo inicial no cadastro"
        );
        auditoria.registrarCriacao("PRODUTO", salvo.getId(), salvo.getNome(), salvo);
        return repository.findById(salvo.getId()).orElse(salvo);
    }

    @PutMapping("/{id}")
    public Produto atualizar(
            @PathVariable Long id,
            @RequestBody Produto produto
    ) {

        Produto anterior = repository.findById(id).orElseThrow();
        var antes = auditoria.snapshot(anterior);
        BigDecimal estoqueAlvo = produto.getEstoque();
        produto.setId(id);
        produto.setEstoque(anterior.getEstoque());
        if (produto.getCriadoEm() == null) {
            produto.setCriadoEm(anterior.getCriadoEm());
        }
        if (produto.getMidia() == null) {
            produto.setMidia(anterior.getMidia());
        }
        if (produto.getImagem() == null) {
            produto.setImagem(anterior.getImagem());
        }
        preparar(produto);
        repository.save(produto);
        estoqueAuditoria.ajustarPara(
                id,
                estoqueAlvo,
                "AJUSTE",
                EstoqueOrigem.MANUAL,
                id,
                "Cadastro do produto",
                "Alteração manual do estoque no cadastro"
        );
        Produto salvo = repository.findById(id).orElseThrow();
        auditoria.registrarAlteracao("PRODUTO", id, salvo.getNome(), antes, auditoria.snapshot(salvo));
        return salvo;
    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        Produto anterior = repository.findById(id).orElse(null);
        repository.deleteById(id);
        if (anterior != null) {
            auditoria.registrarExclusao("PRODUTO", id, anterior.getNome(), anterior);
        }
    }

    @PostMapping("/reajustar")
    public Map<String, Object> reajustar(@RequestBody PrecoLoteDTO lote) {
        if (lote.getPercentualReajuste() == null || lote.getPercentualReajuste().compareTo(java.math.BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Informe um percentual de reajuste diferente de zero.");
        }
        if (lote.getPercentualReajuste().compareTo(new java.math.BigDecimal("-100")) <= 0) {
            throw new IllegalArgumentException("O reajuste precisa ser maior que -100%.");
        }
        boolean venda = lote.getReajustarVenda() == null || Boolean.TRUE.equals(lote.getReajustarVenda());
        boolean atacado = lote.getReajustarAtacado() == null || Boolean.TRUE.equals(lote.getReajustarAtacado());
        if (!venda && !atacado) {
            throw new IllegalArgumentException("Marque o preço de venda ou o preço de atacado.");
        }
        int ok = 0;
        for (Produto produto : alvos(lote)) {
            var antes = auditoria.snapshot(produto);
            PrecoPromocional.reajustar(produto, lote.getPercentualReajuste(), venda, atacado);
            Produto salvo = repository.save(produto);
            auditoria.registrarAlteracao("PRODUTO", salvo.getId(), salvo.getNome(), antes, auditoria.snapshot(salvo));
            ok++;
        }
        return Map.of("ok", ok, "total", ok);
    }

    @PostMapping("/promocao")
    public Map<String, Object> promocao(@RequestBody PrecoLoteDTO lote) {
        int ok = 0;
        for (Produto produto : alvos(lote)) {
            var antes = auditoria.snapshot(produto);
            if (Boolean.TRUE.equals(lote.getLimparPromocao())) {
                produto.setPrecoPromocional(null);
                produto.setDescontoPercentual(null);
            } else {
                if (lote.getDescontoPercentual() != null) {
                    produto.setDescontoPercentual(lote.getDescontoPercentual());
                    if (lote.getPrecoPromocional() == null) {
                        produto.setPrecoPromocional(null);
                    }
                }
                if (lote.getPrecoPromocional() != null) {
                    produto.setPrecoPromocional(lote.getPrecoPromocional());
                    if (lote.getDescontoPercentual() == null) {
                        produto.setDescontoPercentual(null);
                    }
                }
                PrecoPromocional.alinhar(produto);
            }
            Produto salvo = repository.save(produto);
            auditoria.registrarAlteracao("PRODUTO", salvo.getId(), salvo.getNome(), antes, auditoria.snapshot(salvo));
            ok++;
        }
        return Map.of("ok", ok, "total", ok);
    }

    private List<Produto> alvos(PrecoLoteDTO lote) {
        if (lote.getIds() == null || lote.getIds().isEmpty()) {
            throw new IllegalArgumentException("Selecione ao menos um produto.");
        }
        return repository.findAllById(lote.getIds());
    }

    @GetMapping("/buscar")
    public List<Produto> buscarPorTexto(
            @RequestParam String texto
    ) {

        String filtro =
                texto.toLowerCase();

        return repository.findAll()
                .stream()
                .filter(p ->

                        (p.getNome() != null &&
                                p.getNome()
                                        .toLowerCase()
                                        .contains(filtro))

                        ||

                        (p.getSku() != null &&
                                p.getSku()
                                        .toLowerCase()
                                        .contains(filtro))

                        ||

                        (p.getCodigoBarras() != null &&
                                p.getCodigoBarras()
                                        .contains(texto))

                        ||

                        naLocalizacao(p, texto)

                )
                .collect(Collectors.toList());

    }

    @GetMapping("/categoria/{categoria}")
    public List<Produto> categoria(
            @PathVariable String categoria
    ) {

        return repository.findAll()
                .stream()
                .filter(p ->

                        categoria.equalsIgnoreCase(
                                p.getCategoria()
                        )

                )
                .collect(Collectors.toList());

    }

    @GetMapping("/ativos")
    public List<Produto> ativos() {

        return repository.findAll()
                .stream()
                .filter(p ->

                        Boolean.TRUE.equals(
                                p.getAtivo()
                        )

                )
                .collect(Collectors.toList());

    }

    @PostMapping("/importar")
    public Map<String, Integer> importar(
            @RequestBody List<Produto> itens
    ) {

        int novos = 0;
        int atualizados = 0;
        int erros = 0;

        if (itens == null) {
            return resumo(0, 0, 0);
        }

        for (Produto recebido : itens) {

            if (recebido == null || recebido.getNome() == null || recebido.getNome().isBlank()) {
                continue;
            }

            if (recebido.getAtivo() == null) {
                recebido.setAtivo(true);
            }

            preparar(recebido);

            try {
                Produto existente = localizar(recebido);

                if (existente == null) {
                    BigDecimal estoqueAlvo = recebido.getEstoque();
                    recebido.setId(null);
                    recebido.setEstoque(BigDecimal.ZERO);
                    Produto salvo = repository.save(recebido);
                    estoqueAuditoria.ajustarPara(
                            salvo.getId(),
                            estoqueAlvo,
                            "ENTRADA",
                            EstoqueOrigem.IMPORTACAO,
                            salvo.getId(),
                            "Importação de produtos",
                            "Saldo inicial na importação"
                    );
                    auditoria.registrarResumo("PRODUTO", salvo.getId(), salvo.getNome(), "CRIAR", "importação em lote");
                    novos++;
                    continue;
                }

                BigDecimal estoqueAlvo = recebido.getEstoque();
                copiar(existente, recebido);
                existente.setEstoque(existente.getEstoque());
                repository.save(existente);
                if (estoqueAlvo != null) {
                    estoqueAuditoria.ajustarPara(
                            existente.getId(),
                            estoqueAlvo,
                            "AJUSTE",
                            EstoqueOrigem.IMPORTACAO,
                            existente.getId(),
                            "Importação de produtos",
                            "Ajuste de estoque na importação"
                    );
                }
                auditoria.registrarResumo("PRODUTO", existente.getId(), existente.getNome(), "ALTERAR", "atualizado na importação em lote");
                atualizados++;
            } catch (Exception ex) {
                erros++;
            }

        }

        return resumo(novos, atualizados, erros);

    }

    private Map<String, Integer> resumo(int novos, int atualizados, int erros) {
        Map<String, Integer> saida = new HashMap<>();
        saida.put("novos", novos);
        saida.put("atualizados", atualizados);
        saida.put("total", novos + atualizados);
        saida.put("erros", erros);
        return saida;
    }

    private String limpar(String valor, int max) {
        if (valor == null) {
            return null;
        }
        String t = valor.trim();
        if (t.isEmpty() || t.equalsIgnoreCase("SEM GTIN") || t.equalsIgnoreCase("SEMGTIN")) {
            return null;
        }
        return t.length() > max ? t.substring(0, max) : t;
    }

    private void preparar(Produto produto) {
        produto.setSku(limpar(produto.getSku(), 50));
        produto.setCodigoBarras(limpar(produto.getCodigoBarras(), 50));
        produto.setNome(limpar(produto.getNome(), 255));
        produto.setCategoria(limpar(produto.getCategoria(), 100));
        String unidade = limpar(produto.getUnidade(), 10);
        produto.setUnidade(unidade == null ? "UN" : unidade);
        produto.setNcm(limpar(produto.getNcm(), 20));
        produto.setCest(limpar(produto.getCest(), 20));
        produto.setLocalizacao(limpar(produto.getLocalizacao(), 255));
        PrecoPromocional.alinhar(produto);
    }

    private Produto localizar(Produto recebido) {

        if (recebido.getSku() != null && !recebido.getSku().isBlank()) {
            var porSku = repository.findFirstBySkuIgnoreCase(recebido.getSku().trim());
            if (porSku.isPresent()) {
                return porSku.get();
            }
        }

        if (recebido.getCodigoBarras() != null && !recebido.getCodigoBarras().isBlank()) {
            return repository.findFirstByCodigoBarras(recebido.getCodigoBarras().trim())
                    .orElse(null);
        }

        return null;

    }

    private void copiar(Produto destino, Produto origem) {

        if (origem.getSku() != null) {
            destino.setSku(origem.getSku());
        }
        if (origem.getCodigoBarras() != null) {
            destino.setCodigoBarras(origem.getCodigoBarras());
        }
        destino.setNome(origem.getNome());
        destino.setCategoria(origem.getCategoria());
        destino.setUnidade(origem.getUnidade());
        destino.setCusto(origem.getCusto());
        destino.setCustoCompra(origem.getCustoCompra());
        if (origem.getPreco() != null && origem.getPreco().compareTo(BigDecimal.ZERO) > 0) {
            destino.setPreco(origem.getPreco());
        }
        destino.setPrecoAtacado(origem.getPrecoAtacado());
        destino.setPrecoPromocional(origem.getPrecoPromocional());
        destino.setDescontoPercentual(origem.getDescontoPercentual());
        destino.setEstoqueMinimo(origem.getEstoqueMinimo());
        destino.setEstoqueMaximo(origem.getEstoqueMaximo());
        destino.setPeso(origem.getPeso());
        destino.setLocalizacao(origem.getLocalizacao());
        destino.setNcm(origem.getNcm());
        destino.setCest(origem.getCest());
        destino.setProdutoProducao(origem.getProdutoProducao());
        destino.setConsomeEstoque(origem.getConsomeEstoque());
        destino.setAtivo(origem.getAtivo());
        destino.setObservacoes(origem.getObservacoes());
        if (origem.getImagem() != null) {
            destino.setImagem(origem.getImagem());
        }
        if (origem.getMidia() != null) {
            destino.setMidia(origem.getMidia());
        }

    }

    private boolean naLocalizacao(Produto produto, String termo) {
        if (termo == null || termo.isBlank()) {
            return true;
        }
        String loc = produto.getLocalizacao();
        if (loc == null || loc.isBlank()) {
            return false;
        }
        String q = termo.trim().toLowerCase(Locale.ROOT);
        if (loc.toLowerCase(Locale.ROOT).contains(q)) {
            return true;
        }
        return Arrays.stream(loc.split("[,;/|]+"))
                .map(String::trim)
                .anyMatch(parte -> parte.toLowerCase(Locale.ROOT).contains(q));
    }

    private boolean comEstoque(Produto produto) {
        return produto.getEstoque() != null && produto.getEstoque().compareTo(BigDecimal.ZERO) > 0;
    }

    @GetMapping("/estoque-baixo")
    public List<Produto> estoqueBaixo() {

        return repository.findAll()
                .stream()
                .filter(p -> {

                    BigDecimal estoque =
                            p.getEstoque() == null
                                    ? BigDecimal.ZERO
                                    : p.getEstoque();

                    BigDecimal minimo =
                            p.getEstoqueMinimo() == null
                                    ? BigDecimal.ZERO
                                    : p.getEstoqueMinimo();

                    return estoque.compareTo(minimo) <= 0;

                })
                .collect(Collectors.toList());

    }

}