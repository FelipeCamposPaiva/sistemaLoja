package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.Inventario;
import com.temdetudo.erp.repository.InventarioRepository;
import com.temdetudo.erp.security.UsuarioAtual;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventario")
@CrossOrigin("*")
public class InventarioController {

    @Autowired
    private InventarioRepository repository;

    @Autowired
    private DataSource dataSource;

    @PostConstruct
    void ampliarLocalizacao() {
        try (var conexao = dataSource.getConnection(); var stmt = conexao.createStatement()) {
            stmt.execute("ALTER TABLE inventarios ADD COLUMN localizacao VARCHAR(255) NULL");
        } catch (Exception ignored) {
            /* coluna já pode existir */
        }
    }

    @GetMapping
    public List<Inventario> listar() {

        return repository.findAll();

    }

    @PostMapping
    public Inventario salvar(
            @RequestBody Inventario inventario
    ) {

        inventario.setDataInventario(
                LocalDateTime.now()
        );

        UsuarioAtual.obter().ifPresent(usuario -> {
            if (usuario.getId() != null) {
                inventario.setUsuarioId(usuario.getId().intValue());
            }
        });

        return repository.save(
                inventario
        );

    }
}