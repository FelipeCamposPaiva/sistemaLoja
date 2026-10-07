package com.temdetudo.erp.controller;

import com.temdetudo.erp.service.VitrinePublicaService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/publico/vitrine")
@CrossOrigin("*")
public class VitrinePublicaController {

    private final VitrinePublicaService vitrine;

    public VitrinePublicaController(VitrinePublicaService vitrine) {
        this.vitrine = vitrine;
    }

    @GetMapping
    public Map<String, Object> catalogo() {
        return vitrine.catalogo();
    }

    @PostMapping("/pedido")
    public Map<String, Object> pedir(@RequestBody Map<String, Object> corpo) {
        return vitrine.pedir(corpo);
    }
}
