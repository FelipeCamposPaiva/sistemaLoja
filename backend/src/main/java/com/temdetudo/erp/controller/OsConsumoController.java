package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.OsConsumo;
import com.temdetudo.erp.estoque.EstoqueOrigem;
import com.temdetudo.erp.repository.OsConsumoRepository;
import com.temdetudo.erp.service.EstoqueAuditoriaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;

import java.util.List;

@RestController
@RequestMapping("/api/os-consumo")
@CrossOrigin("*")
public class OsConsumoController {

    @Autowired
    private OsConsumoRepository repository;

    @Autowired
    private EstoqueAuditoriaService auditoriaService;

    @GetMapping("/{osId}")
    public List<OsConsumo> listar(@PathVariable Long osId) {
        return repository.findByOsId(osId);
    }

    @PostMapping
    public OsConsumo salvar(@RequestBody OsConsumo consumo) {
        return repository.save(consumo);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        repository.deleteById(id);
    }

    @PutMapping("/consumir/{osId}")
    @Transactional
    public void consumir(@PathVariable Long osId) {
        List<OsConsumo> consumos = repository.findByOsId(osId);

        for (OsConsumo item : consumos) {
            auditoriaService.registrarSaida(
                    item.getProdutoId(),
                    item.getQuantidade(),
                    EstoqueOrigem.OS,
                    osId,
                    "OS #" + osId,
                    "Consumo OS #" + osId
            );
        }
    }
}
