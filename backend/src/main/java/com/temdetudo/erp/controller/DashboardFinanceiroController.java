package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.DashboardFinanceiroDTO;
import com.temdetudo.erp.service.DashboardFinanceiroService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard-financeiro")
@CrossOrigin("*")
public class DashboardFinanceiroController {

    private final DashboardFinanceiroService service;

    public DashboardFinanceiroController(DashboardFinanceiroService service) {
        this.service = service;
    }

    @GetMapping
    public DashboardFinanceiroDTO dashboard() {
        return service.montar();
    }
}
