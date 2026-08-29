package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Caixa;
import com.temdetudo.erp.entity.ContaPagar;
import com.temdetudo.erp.repository.CaixaRepository;
import com.temdetudo.erp.repository.ContaPagarRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/contas-pagar")
@CrossOrigin("*")
public class ContaPagarController {

    @Autowired
    private ContaPagarRepository repository;

    @Autowired
    private CaixaRepository caixaRepository;

    @GetMapping
    public List<ContaPagar> listar() {

        return repository.findAll();

    }

    @PostMapping
    public ContaPagar salvar(
            @RequestBody ContaPagar conta
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

    @PutMapping("/{id}/baixar")
    public ContaPagar baixar(
            @PathVariable Long id
    ) {

        ContaPagar conta =
                repository.findById(id)
                        .orElseThrow();

        conta.setStatus(
                "PAGO"
        );

        conta.setDataPagamento(
                LocalDate.now()
        );

        ContaPagar contaSalva =
                repository.save(
                        conta
                );

        Caixa caixa =
                new Caixa();

        caixa.setTipo(
                "SAIDA"
        );

        caixa.setDescricao(
                "Pagamento Conta #" +
                        contaSalva.getId()
        );

        caixa.setValor(
                contaSalva.getValor()
        );

        caixa.setOrigem(
                "CONTAS_PAGAR"
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