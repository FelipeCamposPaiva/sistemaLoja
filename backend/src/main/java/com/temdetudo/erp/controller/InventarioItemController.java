package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.InventarioItem;
import com.temdetudo.erp.repository.InventarioItemRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/inventario-itens")
@CrossOrigin("*")
public class InventarioItemController {

    @Autowired
    private InventarioItemRepository repository;

    @GetMapping("/{inventarioId}")
    public List<InventarioItem> listar(
            @PathVariable Long inventarioId
    ) {

        return repository.findByInventarioId(
                inventarioId
        );

    }

    @PostMapping
    public InventarioItem salvar(
            @RequestBody InventarioItem item
    ) {

        BigDecimal sistema =
                item.getQuantidadeSistema();

        BigDecimal contada =
                item.getQuantidadeContada();

        item.setDiferenca(
                contada.subtract(
                        sistema
                )
        );

        return repository.save(
                item
        );

    }

}