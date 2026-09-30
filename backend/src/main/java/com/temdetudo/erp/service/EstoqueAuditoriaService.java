package com.temdetudo.erp.service;

import com.temdetudo.erp.dto.EstoqueAuditoriaDTO;
import com.temdetudo.erp.entity.EstoqueMovimentacao;
import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.entity.Usuario;
import com.temdetudo.erp.estoque.EstoqueOrigem;
import com.temdetudo.erp.repository.EstoqueMovimentacaoRepository;
import com.temdetudo.erp.repository.ProdutoRepository;
import com.temdetudo.erp.repository.UsuarioRepository;
import com.temdetudo.erp.security.UsuarioAtual;

import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EstoqueAuditoriaService {

    public static final String STATUS_ATIVO = "ATIVO";
    public static final String STATUS_ESTORNADO = "ESTORNADO";
    public static final String STATUS_CANCELADO = "CANCELADO";

    private final EstoqueMovimentacaoRepository movimentacaoRepository;
    private final ProdutoRepository produtoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoria;

    public EstoqueAuditoriaService(
            EstoqueMovimentacaoRepository movimentacaoRepository,
            ProdutoRepository produtoRepository,
            UsuarioRepository usuarioRepository,
            AuditoriaService auditoria
    ) {
        this.movimentacaoRepository = movimentacaoRepository;
        this.produtoRepository = produtoRepository;
        this.usuarioRepository = usuarioRepository;
        this.auditoria = auditoria;
    }

    @Transactional
    public EstoqueMovimentacao registrar(EstoqueMovimentacao pedido) {
        if (pedido == null || pedido.getProdutoId() == null) {
            throw new IllegalArgumentException("Informe o produto da movimentação.");
        }
        if (pedido.getTipo() == null || pedido.getTipo().isBlank()) {
            throw new IllegalArgumentException("Informe o tipo da movimentação.");
        }

        String tipo = pedido.getTipo().trim().toUpperCase(Locale.ROOT);
        BigDecimal quantidade = nuloParaZero(pedido.getQuantidade());

        if (!"TRANSFERENCIA".equals(tipo) && !"BALANCO".equals(tipo)
                && quantidade.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Informe a quantidade da movimentação.");
        }

        Produto produto = produtoRepository.findById(pedido.getProdutoId())
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado."));

        BigDecimal saldoAnterior = nuloParaZero(produto.getEstoque());
        BigDecimal saldoPosterior = aplicar(tipo, saldoAnterior, quantidade, pedido);

        produto.setEstoque(saldoPosterior);
        produtoRepository.save(produto);

        EstoqueMovimentacao movimento = new EstoqueMovimentacao();
        movimento.setProdutoId(produto.getId());
        movimento.setLocalOrigem(pedido.getLocalOrigem());
        movimento.setLocalDestino(pedido.getLocalDestino());
        movimento.setTipo(tipo);
        movimento.setQuantidade("AJUSTE".equals(tipo) || "BALANCO".equals(tipo)
                ? saldoPosterior.subtract(saldoAnterior)
                : quantidade.abs());
        movimento.setObservacao(pedido.getObservacao());
        movimento.setOrigem(normalizarOrigem(pedido.getOrigem()));
        movimento.setOrigemId(pedido.getOrigemId());
        movimento.setOrigemRef(pedido.getOrigemRef());
        movimento.setSaldoAnterior(saldoAnterior);
        movimento.setSaldoPosterior(saldoPosterior);
        movimento.setStatus(STATUS_ATIVO);
        movimento.setMovimentoOrigemId(pedido.getMovimentoOrigemId());
        movimento.setDataMovimento(pedido.getDataMovimento() == null
                ? LocalDateTime.now()
                : pedido.getDataMovimento());
        preencherUsuario(movimento);

        EstoqueMovimentacao salvo = movimentacaoRepository.save(movimento);
        registrarLogCentral(salvo, produto);
        return salvo;
    }

    @Transactional
    public EstoqueMovimentacao registrarEntrada(
            Long produtoId,
            BigDecimal quantidade,
            String origem,
            Long origemId,
            String origemRef,
            String observacao
    ) {
        return registrarEntrada(produtoId, quantidade, origem, origemId, origemRef, observacao, null);
    }

    @Transactional
    public EstoqueMovimentacao registrarEntrada(
            Long produtoId,
            BigDecimal quantidade,
            String origem,
            Long origemId,
            String origemRef,
            String observacao,
            LocalDateTime dataMovimento
    ) {
        EstoqueMovimentacao pedido = base(produtoId, "ENTRADA", quantidade, origem, origemId, origemRef, observacao);
        pedido.setDataMovimento(dataMovimento);
        return registrar(pedido);
    }

    @Transactional
    public EstoqueMovimentacao registrarSaida(
            Long produtoId,
            BigDecimal quantidade,
            String origem,
            Long origemId,
            String origemRef,
            String observacao
    ) {
        EstoqueMovimentacao pedido = base(produtoId, "SAIDA", quantidade, origem, origemId, origemRef, observacao);
        return registrar(pedido);
    }

    @Transactional
    public EstoqueMovimentacao ajustarPara(
            Long produtoId,
            BigDecimal saldoAlvo,
            String tipo,
            String origem,
            Long origemId,
            String origemRef,
            String observacao
    ) {
        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado."));

        BigDecimal atual = nuloParaZero(produto.getEstoque());
        BigDecimal alvo = nuloParaZero(saldoAlvo);
        if (atual.compareTo(alvo) == 0) {
            return null;
        }

        EstoqueMovimentacao pedido = base(
                produtoId,
                tipo == null || tipo.isBlank() ? "AJUSTE" : tipo,
                alvo.subtract(atual),
                origem,
                origemId,
                origemRef,
                observacao
        );
        return registrar(pedido);
    }

    @Transactional
    public EstoqueMovimentacao estornar(Long id) {
        EstoqueMovimentacao original = movimentacaoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Movimentação não encontrada."));

        if (!STATUS_ATIVO.equalsIgnoreCase(nvl(original.getStatus(), STATUS_ATIVO))) {
            throw new IllegalStateException("Esta movimentação já foi cancelada ou estornada e permanece no histórico.");
        }

        BigDecimal efeito = efeitoDe(original);
        Produto produto = produtoRepository.findById(original.getProdutoId())
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado."));

        BigDecimal saldoAnterior = nuloParaZero(produto.getEstoque());
        BigDecimal saldoPosterior = saldoAnterior.subtract(efeito);
        if (saldoPosterior.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Não é possível estornar: o estoque ficaria negativo.");
        }

        produto.setEstoque(saldoPosterior);
        produtoRepository.save(produto);

        original.setStatus(STATUS_ESTORNADO);
        movimentacaoRepository.save(original);

        EstoqueMovimentacao estorno = new EstoqueMovimentacao();
        estorno.setProdutoId(original.getProdutoId());
        estorno.setLocalOrigem(original.getLocalDestino());
        estorno.setLocalDestino(original.getLocalOrigem());
        estorno.setTipo("ESTORNO");
        estorno.setQuantidade(efeito.negate());
        estorno.setObservacao("Estorno do movimento #" + original.getId()
                + (original.getObservacao() == null || original.getObservacao().isBlank()
                ? ""
                : " — " + original.getObservacao()));
        estorno.setOrigem(original.getOrigem());
        estorno.setOrigemId(original.getOrigemId());
        estorno.setOrigemRef(original.getOrigemRef());
        estorno.setSaldoAnterior(saldoAnterior);
        estorno.setSaldoPosterior(saldoPosterior);
        estorno.setStatus(STATUS_ATIVO);
        estorno.setMovimentoOrigemId(original.getId());
        estorno.setDataMovimento(original.getDataMovimento() == null
                ? LocalDateTime.now()
                : original.getDataMovimento());
        preencherUsuario(estorno);

        EstoqueMovimentacao salvo = movimentacaoRepository.save(estorno);
        registrarLogCentral(salvo, produto);
        return salvo;
    }

    @Transactional
    public int estornarOrigem(String origem, Long origemId) {
        List<EstoqueMovimentacao> ativos = movimentacaoRepository
                .findByOrigemAndOrigemIdAndStatusIgnoreCase(origem, origemId, STATUS_ATIVO);
        int qtd = 0;
        for (EstoqueMovimentacao movimento : ativos) {
            if ("ESTORNO".equalsIgnoreCase(movimento.getTipo())) {
                continue;
            }
            estornar(movimento.getId());
            qtd++;
        }
        return qtd;
    }

    public List<EstoqueAuditoriaDTO> consultar(
            Long usuarioId,
            Long produtoId,
            String tipo,
            String origem,
            String status,
            LocalDate de,
            LocalDate ate
    ) {
        Specification<EstoqueMovimentacao> spec = (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            if (usuarioId != null) {
                filtros.add(cb.equal(root.get("usuarioId"), usuarioId));
            }
            if (produtoId != null) {
                filtros.add(cb.equal(root.get("produtoId"), produtoId));
            }
            if (temTexto(tipo)) {
                filtros.add(cb.equal(cb.upper(root.get("tipo")), tipo.trim().toUpperCase(Locale.ROOT)));
            }
            if (temTexto(origem)) {
                filtros.add(cb.equal(cb.upper(root.get("origem")), origem.trim().toUpperCase(Locale.ROOT)));
            }
            if (temTexto(status)) {
                filtros.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase(Locale.ROOT)));
            }
            if (de != null) {
                filtros.add(cb.greaterThanOrEqualTo(root.get("dataMovimento"), de.atStartOfDay()));
            }
            if (ate != null) {
                filtros.add(cb.lessThanOrEqualTo(root.get("dataMovimento"), ate.atTime(LocalTime.MAX)));
            }
            return cb.and(filtros.toArray(Predicate[]::new));
        };

        List<EstoqueMovimentacao> movimentos = movimentacaoRepository.findAll(
                spec,
                Sort.by(Sort.Direction.DESC, "dataMovimento").and(Sort.by(Sort.Direction.DESC, "id"))
        );
        return paraDto(movimentos);
    }

    public Map<String, Object> filtros() {
        Map<String, Object> saida = new LinkedHashMap<>();
        List<Map<String, Object>> usuarios = usuarioRepository.findAll().stream()
                .filter(u -> !Boolean.FALSE.equals(u.getAtivo()))
                .map(u -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", u.getId());
                    item.put("nome", u.getNome());
                    item.put("usuario", u.getUsuario());
                    return item;
                })
                .collect(Collectors.toList());
        saida.put("usuarios", usuarios);
        saida.put("tipos", List.of(
                "ENTRADA", "SAIDA", "TRANSFERENCIA", "PRODUCAO", "PERDA", "AJUSTE", "BALANCO", "ESTORNO"
        ));
        saida.put("origens", List.of(
                EstoqueOrigem.MANUAL,
                EstoqueOrigem.NF,
                EstoqueOrigem.PEDIDO,
                EstoqueOrigem.API,
                EstoqueOrigem.OS,
                EstoqueOrigem.INVENTARIO,
                EstoqueOrigem.AJUSTE,
                EstoqueOrigem.IMPORTACAO,
                EstoqueOrigem.CADASTRO
        ));
        saida.put("status", List.of(STATUS_ATIVO, STATUS_ESTORNADO, STATUS_CANCELADO));
        return saida;
    }

    private BigDecimal aplicar(String tipo, BigDecimal saldoAnterior, BigDecimal quantidade, EstoqueMovimentacao pedido) {
        return switch (tipo) {
            case "ENTRADA", "PRODUCAO" -> saldoAnterior.add(quantidade.abs());
            case "SAIDA", "PERDA" -> {
                BigDecimal saida = quantidade.abs();
                if (saldoAnterior.compareTo(saida) < 0) {
                    throw new IllegalArgumentException("Estoque insuficiente.");
                }
                yield saldoAnterior.subtract(saida);
            }
            case "AJUSTE", "ESTORNO" -> saldoAnterior.add(quantidade);
            case "BALANCO" -> {
                if (pedido.getSaldoPosterior() != null) {
                    yield pedido.getSaldoPosterior();
                }
                yield saldoAnterior.add(quantidade);
            }
            case "TRANSFERENCIA" -> saldoAnterior;
            default -> throw new IllegalArgumentException("Tipo de movimentação não suportado: " + tipo);
        };
    }

    private void registrarLogCentral(EstoqueMovimentacao movimento, Produto produto) {
        String nome = produto == null || produto.getNome() == null
                ? ("Produto #" + movimento.getProdutoId())
                : produto.getNome();
        String resumo = movimento.getTipo()
                + " via " + nvl(movimento.getOrigem(), EstoqueOrigem.MANUAL)
                + (temTexto(movimento.getOrigemRef()) ? " (" + movimento.getOrigemRef() + ")" : "")
                + " qtd " + movimento.getQuantidade()
                + " saldo " + movimento.getSaldoAnterior()
                + " → " + movimento.getSaldoPosterior();
        String acao = "ESTORNO".equalsIgnoreCase(movimento.getTipo()) ? "ALTERAR" : "CRIAR";
        auditoria.registrarResumo("ESTOQUE", movimento.getId(), nome, acao, resumo);
        auditoria.registrarResumo(
                "PRODUTO",
                movimento.getProdutoId(),
                nome,
                "ALTERAR",
                "estoque " + movimento.getSaldoAnterior() + " → " + movimento.getSaldoPosterior()
        );
    }

    private void preencherUsuario(EstoqueMovimentacao movimento) {
        Usuario usuario = UsuarioAtual.obter().orElse(null);
        if (usuario == null) {
            return;
        }
        movimento.setUsuarioId(usuario.getId());
        String nome = usuario.getNome();
        if (nome == null || nome.isBlank()) {
            nome = usuario.getUsuario() != null ? usuario.getUsuario() : usuario.getEmail();
        }
        movimento.setUsuarioNome(nome);
    }

    private List<EstoqueAuditoriaDTO> paraDto(List<EstoqueMovimentacao> movimentos) {
        Set<Long> produtoIds = movimentos.stream()
                .map(EstoqueMovimentacao::getProdutoId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        Map<Long, Produto> produtos = produtoIds.isEmpty()
                ? Map.of()
                : produtoRepository.findAllById(produtoIds).stream()
                .collect(Collectors.toMap(Produto::getId, p -> p, (a, b) -> a, HashMap::new));

        List<EstoqueAuditoriaDTO> lista = new ArrayList<>();
        for (EstoqueMovimentacao m : movimentos) {
            EstoqueAuditoriaDTO dto = new EstoqueAuditoriaDTO();
            dto.setId(m.getId());
            dto.setProdutoId(m.getProdutoId());
            Produto produto = m.getProdutoId() == null ? null : produtos.get(m.getProdutoId());
            if (produto != null) {
                dto.setProdutoSku(produto.getSku());
                dto.setProdutoNome(produto.getNome());
            }
            dto.setLocalOrigem(m.getLocalOrigem());
            dto.setLocalDestino(m.getLocalDestino());
            dto.setTipo(m.getTipo());
            dto.setQuantidade(m.getQuantidade());
            dto.setEfeito(efeitoDe(m));
            dto.setObservacao(m.getObservacao());
            dto.setUsuarioId(m.getUsuarioId());
            dto.setUsuarioNome(nvl(m.getUsuarioNome(), "—"));
            dto.setDataMovimento(m.getDataMovimento());
            dto.setOrigem(m.getOrigem());
            dto.setOrigemId(m.getOrigemId());
            dto.setOrigemRef(m.getOrigemRef());
            dto.setSaldoAnterior(m.getSaldoAnterior());
            dto.setSaldoPosterior(m.getSaldoPosterior());
            dto.setStatus(nvl(m.getStatus(), STATUS_ATIVO));
            dto.setMovimentoOrigemId(m.getMovimentoOrigemId());
            lista.add(dto);
        }
        return lista;
    }

    private BigDecimal efeitoDe(EstoqueMovimentacao movimento) {
        if (movimento.getSaldoAnterior() != null && movimento.getSaldoPosterior() != null) {
            return movimento.getSaldoPosterior().subtract(movimento.getSaldoAnterior());
        }
        BigDecimal qtd = nuloParaZero(movimento.getQuantidade());
        String tipo = movimento.getTipo() == null ? "" : movimento.getTipo().toUpperCase(Locale.ROOT);
        return switch (tipo) {
            case "SAIDA", "PERDA" -> qtd.abs().negate();
            case "ESTORNO", "AJUSTE", "BALANCO" -> qtd;
            case "TRANSFERENCIA" -> BigDecimal.ZERO;
            default -> qtd.abs();
        };
    }

    private EstoqueMovimentacao base(
            Long produtoId,
            String tipo,
            BigDecimal quantidade,
            String origem,
            Long origemId,
            String origemRef,
            String observacao
    ) {
        EstoqueMovimentacao pedido = new EstoqueMovimentacao();
        pedido.setProdutoId(produtoId);
        pedido.setTipo(tipo);
        pedido.setQuantidade(quantidade);
        pedido.setOrigem(origem);
        pedido.setOrigemId(origemId);
        pedido.setOrigemRef(origemRef);
        pedido.setObservacao(observacao);
        return pedido;
    }

    private String normalizarOrigem(String origem) {
        if (!temTexto(origem)) {
            return EstoqueOrigem.MANUAL;
        }
        return origem.trim().toUpperCase(Locale.ROOT);
    }

    private static boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    private static String nvl(String valor, String padrao) {
        return temTexto(valor) ? valor : padrao;
    }

    private static BigDecimal nuloParaZero(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
