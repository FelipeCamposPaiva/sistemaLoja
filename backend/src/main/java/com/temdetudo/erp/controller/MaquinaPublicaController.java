package com.temdetudo.erp.controller;

import com.temdetudo.erp.service.MaquinaFichaService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/publico/maquinas")
@CrossOrigin("*")
public class MaquinaPublicaController {

    private final MaquinaFichaService ficha;

    public MaquinaPublicaController(MaquinaFichaService ficha) {
        this.ficha = ficha;
    }

    @GetMapping("/{codigo}")
    public Map<String, Object> abrir(@PathVariable String codigo) {
        return ficha.fichaPublica(codigo);
    }

    @PostMapping("/{codigo}/checklist/{itemId}")
    public Map<String, Object> marcar(
            @PathVariable String codigo,
            @PathVariable Long itemId,
            @RequestBody(required = false) Map<String, String> corpo
    ) {
        String responsavel = corpo == null ? "" : corpo.getOrDefault("responsavel", "");
        return ficha.marcarChecklist(codigo, itemId, responsavel);
    }
}
