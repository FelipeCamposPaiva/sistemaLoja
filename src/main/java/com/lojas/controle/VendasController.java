package com.lojas.controle;

import com.lojas.modelo.Vendas;
import com.lojas.modelo.repositorio.IVendas;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/vendas")
public class VendasController {
    @Autowired
    private IVendas repo;

    @GetMapping("")
    public ResponseEntity<List<Vendas>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vendas> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<Vendas> criar(@RequestBody Vendas venda) {
        return ResponseEntity.ok(repo.save(venda));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vendas> atualizar(@PathVariable Long id, @RequestBody Vendas venda) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        venda.setId(id);
        return ResponseEntity.ok(repo.save(venda));
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
