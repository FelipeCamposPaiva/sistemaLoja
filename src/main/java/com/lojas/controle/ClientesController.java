package com.lojas.controle;

import com.lojas.modelo.Clientes;
import com.lojas.modelo.repositorio.IClientes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/clientes")
public class ClientesController {
    @Autowired
    private IClientes repo;

    @GetMapping("")
    public ResponseEntity<List<Clientes>> listar() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Clientes> buscarPorId(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<Clientes> criar(@RequestBody Clientes cliente) {
        return ResponseEntity.ok(repo.save(cliente));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Clientes> atualizar(@PathVariable Long id, @RequestBody Clientes cliente) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        cliente.setId(id);
        return ResponseEntity.ok(repo.save(cliente));
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
