package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.BalanceteDTO;
import com.temdetudo.erp.entity.CategoriaFinanceira;
import com.temdetudo.erp.repository.CategoriaFinanceiraRepository;
import com.temdetudo.erp.service.BalanceteService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/balancete")
@CrossOrigin("*")
public class BalanceteController {

    private final BalanceteService service;
    private final CategoriaFinanceiraRepository categorias;

    public BalanceteController(BalanceteService service, CategoriaFinanceiraRepository categorias) {
        this.service = service;
        this.categorias = categorias;
    }

    @GetMapping
    public BalanceteDTO balancete(
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) String regime
    ) {
        LocalDate hoje = LocalDate.now();
        int a = ano == null ? hoje.getYear() : ano;
        int m = mes == null ? hoje.getMonthValue() : mes;
        return service.montar(anoCorrigido(a), mesCorrigido(m), regime);
    }

    @GetMapping("/categorias")
    public List<CategoriaFinanceira> categorias() {
        return categorias.findAllByOrderByOrdemAscCodigoAsc();
    }

    private static int anoCorrigido(int ano) {
        return Math.min(2100, Math.max(2000, ano));
    }

    private static int mesCorrigido(int mes) {
        return Math.min(12, Math.max(1, mes));
    }
}
