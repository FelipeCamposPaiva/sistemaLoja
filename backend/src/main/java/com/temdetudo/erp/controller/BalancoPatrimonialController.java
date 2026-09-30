package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.BalancoPatrimonialDTO;
import com.temdetudo.erp.service.BalancoPatrimonialService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/balanco-patrimonial")
@CrossOrigin("*")
public class BalancoPatrimonialController {

    private final BalancoPatrimonialService service;

    public BalancoPatrimonialController(BalancoPatrimonialService service) {
        this.service = service;
    }

    @GetMapping
    public BalancoPatrimonialDTO buscar(
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) Integer mes
    ) {
        return service.montar(ano, mes);
    }
}
