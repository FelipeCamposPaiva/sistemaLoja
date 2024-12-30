package com.lojas.controle;

import com.lojas.modelo.Grupos;
import com.lojas.modelo.repositorio.IGrupos;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/grupos")
public class GruposController {
    @Autowired
    private IGrupos repo;

    @GetMapping("")
    public ResponseEntity<List<Grupos>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Grupos> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<Grupos> criar(@RequestBody Grupos grupo) {
        return ResponseEntity.ok(repo.save(grupo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Grupos> atualizar(@PathVariable Long id, @RequestBody Grupos grupo) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        grupo.setId(id);
        return ResponseEntity.ok(repo.save(grupo));
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
