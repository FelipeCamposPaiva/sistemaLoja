package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.EstoqueMovimentacao;
import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.repository.EstoqueMovimentacaoRepository;
import com.temdetudo.erp.repository.ProdutoRepository;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/estoque")
@CrossOrigin("*")
public class EstoqueMovimentacaoController {

    @Autowired
    private EstoqueMovimentacaoRepository repository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @GetMapping
    public List<EstoqueMovimentacao> listar() {

        return repository.findAll();

    }

    @PostMapping
    @Transactional
    public EstoqueMovimentacao salvar(
            @RequestBody EstoqueMovimentacao movimentacao
    ) {

        Produto produto =
                produtoRepository
                        .findById(
                                movimentacao.getProdutoId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Produto não encontrado"
                                ));

        BigDecimal estoqueAtual =
                produto.getEstoque() == null
                        ? BigDecimal.ZERO
                        : produto.getEstoque();

        BigDecimal quantidade =
                movimentacao.getQuantidade();

        switch (
                movimentacao.getTipo()
                        .toUpperCase()
        ) {

            case "ENTRADA":

                produto.setEstoque(
                        estoqueAtual.add(
                                quantidade
                        )
                );

                break;

            case "SAIDA":

                if (
                        estoqueAtual.compareTo(
                                quantidade
                        ) < 0
                ) {

                    throw new RuntimeException(
                            "Estoque insuficiente."
                    );

                }

                produto.setEstoque(
                        estoqueAtual.subtract(
                                quantidade
                        )
                );

                break;

            case "TRANSFERENCIA":

                // Futuramente:
                // movimentação entre locais

                break;
        }

        produtoRepository.save(
                produto
        );

        movimentacao.setDataMovimento(
                LocalDateTime.now()
        );

        return repository.save(
                movimentacao
        );

    }

}