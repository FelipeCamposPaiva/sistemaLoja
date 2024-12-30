package com.lojas.controle;

import com.lojas.modelo.FormaPagamento;
import com.lojas.modelo.repositorio.IFormaPagamento;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/formaPagamento")
public class FormaPagamentoController {
    @Autowired
    private IFormaPagamento repo;

    @GetMapping("")
    public ResponseEntity<List<FormaPagamento>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FormaPagamento> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<FormaPagamento> criar(@RequestBody FormaPagamento formaPagamento) {
        return ResponseEntity.ok(repo.save(formaPagamento));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FormaPagamento> atualizar(@PathVariable Long id, @RequestBody FormaPagamento formaPagamento) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        formaPagamento.setId(id);
        return ResponseEntity.ok(repo.save(formaPagamento));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
