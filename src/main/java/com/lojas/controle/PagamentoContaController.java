package com.lojas.controle;

import com.lojas.modelo.PagamentoConta;
import com.lojas.modelo.repositorio.IPagamentoConta;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/pagamentoConta")
public class PagamentoContaController {
    @Autowired
    private IPagamentoConta repo;

    @GetMapping("")
    public ResponseEntity<List<PagamentoConta>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PagamentoConta> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<PagamentoConta> criar(@RequestBody PagamentoConta pagamentoConta) {
        return ResponseEntity.ok(repo.save(pagamentoConta));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PagamentoConta> atualizar(@PathVariable Long id, @RequestBody PagamentoConta pagamentoConta) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        pagamentoConta.setId(id);
        return ResponseEntity.ok(repo.save(pagamentoConta));
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
