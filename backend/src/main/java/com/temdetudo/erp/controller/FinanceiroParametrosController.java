package com.temdetudo.erp.controller;

import com.temdetudo.erp.entity.FinanceiroParametros;
import com.temdetudo.erp.service.JurosMultaService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/financeiro-parametros")
@CrossOrigin("*")
public class FinanceiroParametrosController {

    private final JurosMultaService service;

    public FinanceiroParametrosController(JurosMultaService service) {
        this.service = service;
    }

    @GetMapping
    public FinanceiroParametros buscar() {
        return service.parametros();
    }

    @PutMapping
    public FinanceiroParametros salvar(@RequestBody FinanceiroParametros parametros) {
        return service.salvarParametros(parametros);
    }
}
