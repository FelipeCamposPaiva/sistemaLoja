package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Caixa;
import com.temdetudo.erp.entity.ContaReceber;
import com.temdetudo.erp.repository.CaixaRepository;
import com.temdetudo.erp.repository.ContaReceberRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/contas-receber")
@CrossOrigin("*")
public class ContaReceberController {

    @Autowired
    private ContaReceberRepository repository;

    @Autowired
    private CaixaRepository caixaRepository;

    @GetMapping
    public List<ContaReceber> listar() {

        return repository.findAll();

    }

    @GetMapping("/{id}")
    public ContaReceber buscar(
            @PathVariable Long id
    ) {

        return repository.findById(id)
                .orElseThrow();

    }

    @PostMapping
    public ContaReceber salvar(
            @RequestBody ContaReceber conta
    ) {

        if (conta.getStatus() == null) {

            conta.setStatus(
                    "ABERTO"
            );

        }

        return repository.save(
                conta
        );

    }

    @PutMapping("/{id}/receber")
    public ContaReceber receber(
            @PathVariable Long id
    ) {

        ContaReceber conta =
                repository.findById(id)
                        .orElseThrow();

        conta.setStatus(
                "RECEBIDO"
        );

        conta.setDataRecebimento(
                LocalDate.now()
        );

        ContaReceber contaSalva =
                repository.save(
                        conta
                );

        Caixa caixa =
                new Caixa();

        caixa.setTipo(
                "ENTRADA"
        );

        caixa.setDescricao(
                "Recebimento Conta #" +
                        contaSalva.getId()
        );

        caixa.setValor(
                contaSalva.getValor()
        );

        caixa.setOrigem(
                "CONTAS_RECEBER"
        );

        caixa.setReferenciaId(
                contaSalva.getId()
        );

        caixa.setDataMovimento(
                LocalDateTime.now()
        );

        caixaRepository.save(
                caixa
        );

        return contaSalva;

    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        repository.deleteById(id);

    }

}