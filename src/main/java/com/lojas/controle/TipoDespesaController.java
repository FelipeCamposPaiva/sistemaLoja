package com.lojas.controle;

import com.lojas.modelo.TipoDespesa;
import com.lojas.modelo.repositorio.ITipoDespesa;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/tipoDespesa")
public class TipoDespesaController {
    @Autowired
    private ITipoDespesa repo;

    @GetMapping("")
    public ResponseEntity<List<TipoDespesa>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TipoDespesa> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<TipoDespesa> criar(@RequestBody TipoDespesa tipoDespesa) {
        return ResponseEntity.ok(repo.save(tipoDespesa));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TipoDespesa> atualizar(@PathVariable Long id, @RequestBody TipoDespesa tipoDespesa) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        tipoDespesa.setId(id);
        return ResponseEntity.ok(repo.save(tipoDespesa));
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
