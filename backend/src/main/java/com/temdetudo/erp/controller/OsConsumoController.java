package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.*;
import com.temdetudo.erp.repository.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/os-consumo")
@CrossOrigin("*")
public class OsConsumoController {

    @Autowired
    private OsConsumoRepository repository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private EstoqueMovimentacaoRepository movimentacaoRepository;

    @GetMapping("/{osId}")
    public List<OsConsumo> listar(
            @PathVariable Long osId
    ) {

        return repository.findByOsId(
                osId
        );

    }

    @PostMapping
    public OsConsumo salvar(
            @RequestBody OsConsumo consumo
    ) {

        return repository.save(
                consumo
        );

    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        repository.deleteById(id);

    }

    @PutMapping("/consumir/{osId}")
    @Transactional
    public void consumir(
            @PathVariable Long osId
    ) {

        List<OsConsumo> consumos =
                repository.findByOsId(
                        osId
                );

        for (OsConsumo item : consumos) {

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

            if (
                    estoqueAtual.compareTo(
                            item.getQuantidade()
                    ) < 0
            ) {

                throw new RuntimeException(
                        "Estoque insuficiente para produto "
                                + produto.getId()
                );

            }

            produto.setEstoque(
                    estoqueAtual.subtract(
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
                    "SAIDA"
            );

            mov.setQuantidade(
                    item.getQuantidade()
            );

            mov.setObservacao(
                    "Consumo OS #" + osId
            );

            mov.setDataMovimento(
                    LocalDateTime.now()
            );

            movimentacaoRepository.save(
                    mov
            );

        }

    }

}