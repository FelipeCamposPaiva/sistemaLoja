package com.lojas.controle;

import com.lojas.modelo.PagamentoVenda;
import com.lojas.modelo.repositorio.IPagamentoVenda;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/pagamentoVenda")
public class PagamentoVendaController {
    @Autowired
    private IPagamentoVenda repo;

    @GetMapping("")
    public ResponseEntity<List<PagamentoVenda>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PagamentoVenda> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<PagamentoVenda> criar(@RequestBody PagamentoVenda pagamentoVenda) {
        return ResponseEntity.ok(repo.save(pagamentoVenda));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PagamentoVenda> atualizar(@PathVariable Long id, @RequestBody PagamentoVenda pagamentoVenda) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        pagamentoVenda.setId(id);
        return ResponseEntity.ok(repo.save(pagamentoVenda));
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
