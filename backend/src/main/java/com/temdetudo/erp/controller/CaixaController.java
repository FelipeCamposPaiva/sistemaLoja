package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Caixa;
import com.temdetudo.erp.repository.CaixaRepository;

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

        return repository.save(
                caixa
        );

    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        repository.deleteById(id);

    }

}