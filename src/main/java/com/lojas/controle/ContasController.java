package com.lojas.controle;

import com.lojas.modelo.Contas;
import com.lojas.modelo.repositorio.IContas;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/contas")
public class ContasController {
    @Autowired
    private IContas repo;

    @GetMapping("")
    public ResponseEntity<List<Contas>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Contas> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<Contas> criar(@RequestBody Contas conta) {
        return ResponseEntity.ok(repo.save(conta));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Contas> atualizar(@PathVariable Long id, @RequestBody Contas conta) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        conta.setId(id);
        return ResponseEntity.ok(repo.save(conta));
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
