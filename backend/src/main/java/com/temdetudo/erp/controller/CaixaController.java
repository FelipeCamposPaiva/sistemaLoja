package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Caixa;
import com.temdetudo.erp.repository.CaixaRepository;
import com.temdetudo.erp.service.AuditoriaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/caixa")
@CrossOrigin("*")
public class CaixaController {

    @Autowired
    private CaixaRepository repository;

    @Autowired
    private AuditoriaService auditoria;

    @GetMapping
    public List<Caixa> listar() {

        return repository.findAll();

    }

    @GetMapping("/{id}")
    public Caixa buscar(
            @PathVariable Long id
    ) {

        return repository.findById(id)
                .orElseThrow();

    }

    @PostMapping
    public Caixa salvar(
            @RequestBody Caixa caixa
    ) {

        caixa.setDataMovimento(
                LocalDateTime.now()
        );

        Caixa salvo = repository.save(
                caixa
        );
        auditoria.registrarCriacao("CAIXA", salvo.getId(), caixa.getDescricao(), salvo);
        return salvo;
    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        Caixa anterior = repository.findById(id).orElse(null);
        repository.deleteById(id);
        if (anterior != null) {
            auditoria.registrarExclusao("CAIXA", id, anterior.getDescricao(), anterior);
        }
    }

}