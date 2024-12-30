package com.lojas.controle;

import com.lojas.modelo.Produtos;
import com.lojas.modelo.repositorio.IProdutos;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/produtos")
public class ProdutosController {
    @Autowired
    private IProdutos repo;

    @GetMapping("")
    public ResponseEntity<List<Produtos>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Produtos> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<Produtos> criar(@RequestBody Produtos produto) {
        return ResponseEntity.ok(repo.save(produto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Produtos> atualizar(@PathVariable Long id, @RequestBody Produtos produto) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        produto.setId(id);
        return ResponseEntity.ok(repo.save(produto));
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
