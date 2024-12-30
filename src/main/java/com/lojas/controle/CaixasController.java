package com.lojas.controle;

import com.lojas.modelo.Caixas;
import com.lojas.modelo.repositorio.ICaixas;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/caixas")
public class CaixasController {
    @Autowired
    private ICaixas repo;

    @GetMapping("")
    public ResponseEntity<List<Caixas>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Caixas> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<Caixas> criar(@RequestBody Caixas caixa) {
        return ResponseEntity.ok(repo.save(caixa));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Caixas> atualizar(@PathVariable Long id, @RequestBody Caixas caixa) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        caixa.setId(id);
        return ResponseEntity.ok(repo.save(caixa));
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
