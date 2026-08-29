package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.OrdemCompraItem;
import com.temdetudo.erp.repository.OrdemCompraItemRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordens-compra-itens")
@CrossOrigin("*")
public class OrdemCompraItemController {

    @Autowired
    private OrdemCompraItemRepository repository;

    @GetMapping("/{ordemId}")
    public List<OrdemCompraItem> listar(
            @PathVariable Long ordemId
    ) {

        return repository.findByOrdemId(
                ordemId
        );

    }

    @PostMapping
    public OrdemCompraItem salvar(
            @RequestBody OrdemCompraItem item
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