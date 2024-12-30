package com.lojas.controle;

import com.lojas.modelo.AdicionalVenda;
import com.lojas.modelo.repositorio.IAdicionalVenda;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/adicionalVenda")
public class AdicionalVendaController {
    @Autowired
    private IAdicionalVenda repo;

    @GetMapping("")
    public ResponseEntity<List<AdicionalVenda>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdicionalVenda> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<AdicionalVenda> criar(@RequestBody AdicionalVenda adicionalVenda) {
        return ResponseEntity.ok(repo.save(adicionalVenda));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdicionalVenda> atualizar(@PathVariable Long id, @RequestBody AdicionalVenda adicionalVenda) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        adicionalVenda.setId(id);
        return ResponseEntity.ok(repo.save(adicionalVenda));
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
