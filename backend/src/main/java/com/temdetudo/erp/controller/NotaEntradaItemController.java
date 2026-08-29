package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.NotaEntradaItem;
import com.temdetudo.erp.repository.NotaEntradaItemRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notas-entrada-itens")
@CrossOrigin("*")
public class NotaEntradaItemController {

    @Autowired
    private NotaEntradaItemRepository repository;

    @GetMapping("/{notaId}")
    public List<NotaEntradaItem> listar(
            @PathVariable Long notaId
    ) {

        return repository.findByNotaEntradaId(
                notaId
        );

    }

    @PostMapping
    public NotaEntradaItem salvar(
            @RequestBody NotaEntradaItem item
    ) {

        return repository.save(
                item
        );

    }

    @DeleteMapping("/{id}")
    public void excluir(
            @PathVariable Long id
    ) {

        repository.deleteById(id);

    }

}