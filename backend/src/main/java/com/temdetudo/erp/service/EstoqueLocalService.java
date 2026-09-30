package com.temdetudo.erp.service;

import com.temdetudo.erp.dto.TransferenciaEstoqueRequest;
import com.temdetudo.erp.entity.EstoqueMovimentacao;
import com.temdetudo.erp.entity.LocalEstoque;
import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.entity.SaldoEstoque;
import com.temdetudo.erp.estoque.EstoqueOrigem;
import com.temdetudo.erp.repository.LocalEstoqueRepository;
import com.temdetudo.erp.repository.ProdutoRepository;
import com.temdetudo.erp.repository.SaldoEstoqueRepository;

import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class EstoqueLocalService {

    private final LocalEstoqueRepository locais;
    private final SaldoEstoqueRepository saldos;
    private final ProdutoRepository produtos;
    private final EstoqueAuditoriaService auditoria;

    public EstoqueLocalService(
            LocalEstoqueRepository locais,
            SaldoEstoqueRepository saldos,
            ProdutoRepository produtos,
            EstoqueAuditoriaService auditoria
    ) {
        this.locais = locais;
        this.saldos = saldos;
        this.produtos = produtos;
        this.auditoria = auditoria;
    }

    public List<LocalEstoque> listarLocais() {
        List<LocalEstoque> lista = locais.findByAtivoTrueOrderByIdAsc();
        return lista.isEmpty() ? locais.findAll() : lista;
    }

    public List<Map<String, Object>> saldosDoProduto(Long produtoId) {
        Produto produto = produtos.findById(produtoId)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado."));
        List<LocalEstoque> depositos = listarLocais();
        List<SaldoEstoque> atuais = saldos.findByProdutoId(produtoId);
        Map<Integer, BigDecimal> mapa = new LinkedHashMap<>();
        for (SaldoEstoque saldo : atuais) {
            mapa.put(saldo.getLocalId(), nulo(saldo.getQuantidade()));
        }
        if (mapa.isEmpty()) {
            Integer destino = produto.getLocalId();
            if (destino == null) {
                destino = depositoPadrao(depositos);
            }
            if (destino != null) {
                mapa.put(destino, nulo(produto.getEstoque()));
                gravar(produtoId, destino, nulo(produto.getEstoque()));
            }
        }
        List<Map<String, Object>> saida = new ArrayList<>();
        for (LocalEstoque local : depositos) {
            Map<String, Object> linha = new LinkedHashMap<>();
            linha.put("id", local.getId());
            linha.put("nome", local.getNome());
            linha.put("sigla", local.getSigla());
            linha.put("tipo", local.getTipo());
            linha.put("quantidade", mapa.getOrDefault(local.getId(), BigDecimal.ZERO));
            saida.add(linha);
        }
        return saida;
    }

    @Transactional
    public List<Map<String, Object>> transferir(TransferenciaEstoqueRequest pedido) {
        if (pedido == null || pedido.getProdutoId() == null) {
            throw new IllegalArgumentException("Informe o produto.");
        }
        if (pedido.getLocalOrigem() == null || pedido.getLocalDestino() == null) {
            throw new IllegalArgumentException("Informe a origem e o destino.");
        }
        if (pedido.getLocalOrigem().equals(pedido.getLocalDestino())) {
            throw new IllegalArgumentException("Origem e destino precisam ser diferentes.");
        }
        BigDecimal qtd = nulo(pedido.getQuantidade());
        if (qtd.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Informe a quantidade a transferir.");
        }
        LocalEstoque origem = locais.findById(pedido.getLocalOrigem())
                .orElseThrow(() -> new IllegalArgumentException("Local de origem não encontrado."));
        LocalEstoque destino = locais.findById(pedido.getLocalDestino())
                .orElseThrow(() -> new IllegalArgumentException("Local de destino não encontrado."));

        garantirSaldos(pedido.getProdutoId());
        BigDecimal saldoOrigem = saldo(pedido.getProdutoId(), origem.getId());
        if (saldoOrigem.compareTo(qtd) < 0) {
            throw new IllegalArgumentException("Saldo insuficiente em " + origem.getNome() + ".");
        }
        gravar(pedido.getProdutoId(), origem.getId(), saldoOrigem.subtract(qtd));
        gravar(pedido.getProdutoId(), destino.getId(), saldo(pedido.getProdutoId(), destino.getId()).add(qtd));

        EstoqueMovimentacao movimento = new EstoqueMovimentacao();
        movimento.setProdutoId(pedido.getProdutoId());
        movimento.setLocalOrigem(origem.getId());
        movimento.setLocalDestino(destino.getId());
        movimento.setTipo("TRANSFERENCIA");
        movimento.setQuantidade(qtd);
        movimento.setOrigem(EstoqueOrigem.MANUAL);
        movimento.setObservacao(pedido.getObservacao() == null || pedido.getObservacao().isBlank()
                ? ("Transferência instantânea " + origem.getNome() + " → " + destino.getNome())
                : pedido.getObservacao());
        auditoria.registrar(movimento);
        return saldosDoProduto(pedido.getProdutoId());
    }

    private void garantirSaldos(Long produtoId) {
        saldosDoProduto(produtoId);
    }

    private Integer depositoPadrao(List<LocalEstoque> depositos) {
        for (LocalEstoque local : depositos) {
            if ("EST".equalsIgnoreCase(local.getSigla())) {
                return local.getId();
            }
        }
        return depositos.isEmpty() ? null : depositos.get(0).getId();
    }

    private BigDecimal saldo(Long produtoId, Integer localId) {
        return saldos.findByProdutoIdAndLocalId(produtoId, localId)
                .map(item -> nulo(item.getQuantidade()))
                .orElse(BigDecimal.ZERO);
    }

    private void gravar(Long produtoId, Integer localId, BigDecimal quantidade) {
        SaldoEstoque item = saldos.findByProdutoIdAndLocalId(produtoId, localId).orElseGet(() -> {
            SaldoEstoque novo = new SaldoEstoque();
            novo.setProdutoId(produtoId);
            novo.setLocalId(localId);
            return novo;
        });
        item.setQuantidade(quantidade);
        saldos.save(item);
    }

    private BigDecimal nulo(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}
