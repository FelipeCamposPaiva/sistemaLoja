package com.lojas.controle;

import com.lojas.modelo.Enderecos;
import com.lojas.modelo.repositorio.IEnderecos;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/enderecos")
public class EnderecosController {
    @Autowired
    private IEnderecos repo;

    @GetMapping("")
    public ResponseEntity<List<Enderecos>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Enderecos> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<Enderecos> criar(@RequestBody Enderecos endereco) {
        return ResponseEntity.ok(repo.save(endereco));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Enderecos> atualizar(@PathVariable Long id, @RequestBody Enderecos endereco) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        endereco.setId(id);
        return ResponseEntity.ok(repo.save(endereco));
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
