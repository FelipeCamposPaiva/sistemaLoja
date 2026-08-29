package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.OrdemCompra;
import com.temdetudo.erp.entity.OrdemCompraItem;
import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.entity.EstoqueMovimentacao;

import com.temdetudo.erp.repository.OrdemCompraRepository;
import com.temdetudo.erp.repository.OrdemCompraItemRepository;
import com.temdetudo.erp.repository.ProdutoRepository;
import com.temdetudo.erp.repository.EstoqueMovimentacaoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/ordens-compra")
@CrossOrigin("*")
public class OrdemCompraController {

    @Autowired
    private OrdemCompraRepository repository;

    @Autowired
    private OrdemCompraItemRepository itemRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private EstoqueMovimentacaoRepository movimentacaoRepository;

    @GetMapping
    public List<OrdemCompra> listar() {

        return repository.findAll();

    }

    @GetMapping("/{id}")
    public OrdemCompra buscar(
            @PathVariable Long id
    ) {

        return repository.findById(id)
                .orElseThrow();

    }

    @PostMapping
    public OrdemCompra salvar(
            @RequestBody OrdemCompra ordem
    ) {

        ordem.setDataEmissao(
                LocalDateTime.now()
        );

        ordem.setStatus(
                "ABERTA"
        );

        return repository.save(
                ordem
        );

    }

    @PutMapping("/{id}")
    public OrdemCompra atualizar(
            @PathVariable Long id,
            @RequestBody OrdemCompra ordem
    ) {

        ordem.setId(id);

        return repository.save(
                ordem
        );

    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        repository.deleteById(id);

    }

    @PutMapping("/{id}/receber")
    @Transactional
    public OrdemCompra receber(
            @PathVariable Long id
    ) {

        OrdemCompra ordem =
                repository.findById(id)
                        .orElseThrow();

        List<OrdemCompraItem> itens =
                itemRepository.findByOrdemId(id);

        for (OrdemCompraItem item : itens) {

            Produto produto =
                    produtoRepository
                            .findById(
                                    item.getProdutoId()
                            )
                            .orElseThrow();

            BigDecimal estoqueAtual =
                    produto.getEstoque() == null
                            ? BigDecimal.ZERO
                            : produto.getEstoque();

            produto.setEstoque(
                    estoqueAtual.add(
                            item.getQuantidade()
                    )
            );

            produtoRepository.save(
                    produto
            );

            EstoqueMovimentacao mov =
                    new EstoqueMovimentacao();

            mov.setProdutoId(
                    produto.getId()
            );

            mov.setTipo(
                    "ENTRADA"
            );

            mov.setQuantidade(
                    item.getQuantidade()
            );

            mov.setObservacao(
                    "Recebimento OC #" + id
            );

            mov.setDataMovimento(
                    LocalDateTime.now()
            );

            movimentacaoRepository.save(
                    mov
            );

        }

        ordem.setStatus(
                "RECEBIDA"
        );

        return repository.save(
                ordem
        );

    }

}