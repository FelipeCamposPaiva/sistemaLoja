package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Inventario;
import com.temdetudo.erp.repository.InventarioRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventario")
@CrossOrigin("*")
public class InventarioController {

    @Autowired
    private InventarioRepository repository;

    @GetMapping
    public List<Inventario> listar() {

        return repository.findAll();

    }

    @PostMapping
    public Inventario salvar(
            @RequestBody Inventario inventario
    ) {

        inventario.setDataInventario(
                LocalDateTime.now()
        );

        return repository.save(
                inventario
        );

    }
}