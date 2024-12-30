package com.lojas.controle;

import com.lojas.modelo.Marcas;
import com.lojas.modelo.repositorio.IMarcas;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/marcas")
public class MarcasController {
    @Autowired
    private IMarcas repo;

    @GetMapping("")
    public ResponseEntity<List<Marcas>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Marcas> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<Marcas> criar(@RequestBody Marcas marca) {
        return ResponseEntity.ok(repo.save(marca));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Marcas> atualizar(@PathVariable Long id, @RequestBody Marcas marca) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        marca.setId(id);
        return ResponseEntity.ok(repo.save(marca));
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
