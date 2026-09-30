package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.AgendaEvento;
import com.temdetudo.erp.repository.AgendaEventoRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agenda")
@CrossOrigin("*")
public class AgendaEventoController {

    private final AgendaEventoRepository repository;

    public AgendaEventoController(
            AgendaEventoRepository repository) {

        this.repository = repository;
    }

    @GetMapping
    public List<AgendaEvento> listar() {
        return repository.findAll();
    }

    @PostMapping
    public AgendaEvento salvar(
            @RequestBody AgendaEvento evento) {

        return repository.save(evento);
    }

    @PutMapping("/{id}")
    public AgendaEvento atualizar(
            @PathVariable Long id,
            @RequestBody AgendaEvento evento) {

        evento.setId(id);
        return repository.save(evento);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        repository.deleteById(id);
    }
}