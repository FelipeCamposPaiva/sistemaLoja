package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.InventarioItem;
import com.temdetudo.erp.estoque.EstoqueOrigem;
import com.temdetudo.erp.repository.InventarioItemRepository;
import com.temdetudo.erp.service.EstoqueAuditoriaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/inventario-itens")
@CrossOrigin("*")
public class InventarioItemController {

    @Autowired
    private InventarioItemRepository repository;

    @Autowired
    private EstoqueAuditoriaService auditoriaService;

    @GetMapping("/{inventarioId}")
    public List<InventarioItem> listar(@PathVariable Long inventarioId) {
        return repository.findByInventarioId(inventarioId);
    }

    @PostMapping
    @Transactional
    public InventarioItem salvar(@RequestBody InventarioItem item) {
        BigDecimal sistema = item.getQuantidadeSistema() == null ? BigDecimal.ZERO : item.getQuantidadeSistema();
        BigDecimal contada = item.getQuantidadeContada() == null ? BigDecimal.ZERO : item.getQuantidadeContada();
        item.setDiferenca(contada.subtract(sistema));

        boolean novo = item.getId() == null;
        InventarioItem salvo = repository.save(item);

        if (novo && item.getProdutoId() != null && item.getDiferenca() != null
                && item.getDiferenca().compareTo(BigDecimal.ZERO) != 0) {
            auditoriaService.ajustarPara(
                    item.getProdutoId(),
                    contada,
                    "BALANCO",
                    EstoqueOrigem.INVENTARIO,
                    item.getInventarioId(),
                    "Inventário #" + item.getInventarioId(),
                    "Balanço de inventário #" + item.getInventarioId()
            );
        }

        return salvo;
    }
}
