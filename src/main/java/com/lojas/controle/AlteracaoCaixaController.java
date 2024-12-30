package com.lojas.controle;

import com.lojas.modelo.AlteracaoCaixa;
import com.lojas.modelo.repositorio.IAlteracaoCaixa;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/alteracaoCaixa")
public class AlteracaoCaixaController {
    @Autowired
    private IAlteracaoCaixa repo;

    @GetMapping("")
    public ResponseEntity<List<AlteracaoCaixa>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlteracaoCaixa> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<AlteracaoCaixa> criar(@RequestBody AlteracaoCaixa alteracaoCaixa) {
        return ResponseEntity.ok(repo.save(alteracaoCaixa));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlteracaoCaixa> atualizar(@PathVariable Long id, @RequestBody AlteracaoCaixa alteracaoCaixa) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        alteracaoCaixa.setId(id);
        return ResponseEntity.ok(repo.save(alteracaoCaixa));
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
