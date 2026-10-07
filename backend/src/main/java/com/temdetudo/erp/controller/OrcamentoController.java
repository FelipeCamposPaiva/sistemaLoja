package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Orcamento;
import com.temdetudo.erp.service.OrcamentoService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orcamentos")
@CrossOrigin("*")
public class OrcamentoController {

    private final OrcamentoService service;

    public OrcamentoController(OrcamentoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Orcamento> listar() {
        return service.listar();
    }

    @PostMapping
    public Orcamento salvar(@RequestBody Orcamento orcamento) {
        return service.salvar(orcamento);
    }

    @PutMapping("/{id}")
    public Orcamento atualizar(@PathVariable Long id, @RequestBody Orcamento orcamento) {
        return service.atualizar(id, orcamento);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }

    @PostMapping("/importar")
    public Map<String, Integer> importar(@RequestBody List<Orcamento> itens) {
        return service.importar(itens);
    }
}
