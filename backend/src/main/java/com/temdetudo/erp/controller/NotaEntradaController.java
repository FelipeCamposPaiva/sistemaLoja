package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.NotaEntrada;
import com.temdetudo.erp.entity.NotaEntradaItem;
import com.temdetudo.erp.entity.Produto;
import com.temdetudo.erp.entity.EstoqueMovimentacao;
import com.temdetudo.erp.entity.ContaPagar;

import com.temdetudo.erp.repository.NotaEntradaRepository;
import com.temdetudo.erp.repository.NotaEntradaItemRepository;
import com.temdetudo.erp.repository.ProdutoRepository;
import com.temdetudo.erp.repository.EstoqueMovimentacaoRepository;
import com.temdetudo.erp.repository.ContaPagarRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/notas-entrada")
@CrossOrigin("*")
public class NotaEntradaController {

    @Autowired
    private NotaEntradaRepository repository;

    @Autowired
    private NotaEntradaItemRepository itemRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private EstoqueMovimentacaoRepository movimentacaoRepository;

    @Autowired
    private ContaPagarRepository contaPagarRepository;

    @GetMapping
    public List<NotaEntrada> listar() {

        return repository.findAll();

    }

    @GetMapping("/{id}")
    public NotaEntrada buscar(
            @PathVariable Long id
    ) {

        return repository.findById(id)
                .orElseThrow();

    }

    @PostMapping
    public NotaEntrada salvar(
            @RequestBody NotaEntrada nota
    ) {

        nota.setDataEntrada(
                LocalDateTime.now()
        );

        nota.setStatus(
                "LANÇADA"
        );

        return repository.save(
                nota
        );

    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        repository.deleteById(id);

    }

    @PutMapping("/{id}/confirmar")
    @Transactional
    public NotaEntrada confirmar(
            @PathVariable Long id
    ) {

        NotaEntrada nota =
                repository.findById(id)
                        .orElseThrow();

        if (
                "RECEBIDA".equalsIgnoreCase(
                        nota.getStatus()
                )
        ) {

            return nota;

        }

        List<NotaEntradaItem> itens =
                itemRepository.findByNotaEntradaId(
                        id
                );

        for (NotaEntradaItem item : itens) {

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
                    "Nota Entrada #" + id
            );

            mov.setDataMovimento(
                    LocalDateTime.now()
            );

            movimentacaoRepository.save(
                    mov
            );

        }

        ContaPagar conta =
                new ContaPagar();

        conta.setFornecedorId(
                nota.getFornecedorId()
        );

        conta.setValor(
                nota.getValorTotal()
        );

        conta.setVencimento(
                LocalDate.now()
                        .plusDays(30)
        );

        conta.setStatus(
                "ABERTO"
        );

        conta.setObservacao(
                "Gerado pela NF "
                        + nota.getNumeroNf()
        );

        contaPagarRepository.save(
                conta
        );

        nota.setStatus(
                "RECEBIDA"
        );

        return repository.save(
                nota
        );

    }

}