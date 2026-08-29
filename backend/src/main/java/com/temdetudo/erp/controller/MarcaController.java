package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Marca;
import com.temdetudo.erp.service.MarcaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marcas")
@CrossOrigin("*")
public class MarcaController {

    @Autowired
    private MarcaService service;

    @GetMapping
    public List<Marca> listar() {

        return service.listar();

    }

    @GetMapping("/ativas")
    public List<Marca> listarAtivas() {

        return service.listarAtivas();

    }

    @GetMapping("/{id}")
    public Marca buscar(
            @PathVariable Long id
    ) {

        return service.buscar(id);

    }

    @PostMapping
    public Marca salvar(
            @RequestBody Marca marca
    ) {

        return service.salvar(marca);

    }

    @PutMapping("/{id}")
    public Marca atualizar(
            @PathVariable Long id,
            @RequestBody Marca marca
    ) {

        return service.atualizar(id, marca);

    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        service.excluir(id);

    }

}