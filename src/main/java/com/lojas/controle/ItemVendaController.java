package com.lojas.controle;

import com.lojas.modelo.ItemVenda;
import com.lojas.modelo.repositorio.IItemVenda;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/itemVenda")
public class ItemVendaController {
    @Autowired
    private IItemVenda repo;

    @GetMapping("")
    public ResponseEntity<List<ItemVenda>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemVenda> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<ItemVenda> criar(@RequestBody ItemVenda itemVenda) {
        return ResponseEntity.ok(repo.save(itemVenda));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemVenda> atualizar(@PathVariable Long id, @RequestBody ItemVenda itemVenda) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        itemVenda.setId(id);
        return ResponseEntity.ok(repo.save(itemVenda));
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
