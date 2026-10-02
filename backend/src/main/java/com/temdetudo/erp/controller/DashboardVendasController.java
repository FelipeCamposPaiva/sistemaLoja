package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.DashboardVendasDTO;
import com.temdetudo.erp.service.DashboardVendasService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard-vendas")
@CrossOrigin("*")
public class DashboardVendasController {

    private final DashboardVendasService service;

    public DashboardVendasController(DashboardVendasService service) {
        this.service = service;
    }

    @GetMapping
    public DashboardVendasDTO dashboard(
            @RequestParam(defaultValue = "mes") String periodo,
            @RequestParam(required = false) Integer dias
    ) {
        return service.montar(periodo, dias);
    }
}
