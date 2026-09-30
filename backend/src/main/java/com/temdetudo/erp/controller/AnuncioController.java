package com.temdetudo.erp.controller;

import com.temdetudo.erp.service.MarketplaceAnuncioService;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/anuncios")
@CrossOrigin("*")
public class AnuncioController {

    private final MarketplaceAnuncioService anuncios;

    public AnuncioController(MarketplaceAnuncioService anuncios) {
        this.anuncios = anuncios;
    }

    @DeleteMapping
    public Map<String, Object> excluir(@RequestParam String canal) {
        return Map.of("ok", anuncios.excluirPorCanal(canal), "canal", canal);
    }
}
