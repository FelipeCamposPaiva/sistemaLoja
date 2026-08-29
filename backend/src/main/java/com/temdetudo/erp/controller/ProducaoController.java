package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Producao;
import com.temdetudo.erp.repository.ProducaoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/producao")
@CrossOrigin("*")
public class ProducaoController {

    @Autowired
    private ProducaoRepository repository;

    @GetMapping
    public List<Producao> listar() {

        return repository.findAll();

    }

    @GetMapping("/{id}")
    public Producao buscar(
            @PathVariable Long id
    ) {

        return repository.findById(id)
                .orElseThrow();

    }

    @PostMapping
    public Producao salvar(
            @RequestBody Producao producao
    ) {

        if (producao.getStatus() == null) {

            producao.setStatus(
                    "ORCAMENTO"
            );

        }

        if (producao.getEtapa() == null) {

            producao.setEtapa(
                    producao.getStatus()
            );

        }

        if (producao.getPrioridade() == null) {

            producao.setPrioridade(
                    "NORMAL"
            );

        }

        producao.setCriadoEm(
                LocalDateTime.now()
        );

        return repository.save(
                producao
        );

    }

    @PutMapping("/{id}")
    public Producao atualizar(
            @PathVariable Long id,
            @RequestBody Producao dados
    ) {

        Producao producao =
                repository.findById(id)
                        .orElseThrow();

        producao.setCliente(
                dados.getCliente()
        );

        producao.setProduto(
                dados.getProduto()
        );

        producao.setQuantidade(
                dados.getQuantidade()
        );

        producao.setDataEntrega(
                dados.getDataEntrega()
        );

        producao.setPrioridade(
                dados.getPrioridade()
        );

        producao.setResponsavel(
                dados.getResponsavel()
        );

        producao.setObservacao(
                dados.getObservacao()
        );

        producao.setLocalId(
                dados.getLocalId()
        );

        return repository.save(
                producao
        );

    }

    @PutMapping("/{id}/status")
    public Producao atualizarStatus(
            @PathVariable Long id,
            @RequestBody Producao dados
    ) {

        Producao producao =
                repository.findById(id)
                        .orElseThrow();

        producao.setStatus(
                dados.getStatus()
        );

        producao.setEtapa(
                dados.getStatus()
        );

        if (
                "PRODUCAO".equals(
                        dados.getStatus()
                )
        ) {

            producao.setInicio(
                    LocalDateTime.now()
            );

        }

        if (
                "ENTREGUE".equals(
                        dados.getStatus()
                )
        ) {

            producao.setTermino(
                    LocalDateTime.now()
            );

        }

        return repository.save(
                producao
        );

    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        repository.deleteById(id);

    }

}