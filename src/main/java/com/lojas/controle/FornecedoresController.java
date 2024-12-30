package com.lojas.controle;

import com.lojas.modelo.Fornecedores;
import com.lojas.modelo.repositorio.IFornecedores;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/fornecedores")
public class FornecedoresController {
    @Autowired
    private IFornecedores repo;

    @GetMapping("")
    public ResponseEntity<List<Fornecedores>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Fornecedores> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<Fornecedores> criar(@RequestBody Fornecedores fornecedor) {
        return ResponseEntity.ok(repo.save(fornecedor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Fornecedores> atualizar(@PathVariable Long id, @RequestBody Fornecedores fornecedor) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        fornecedor.setId(id);
        return ResponseEntity.ok(repo.save(fornecedor));
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