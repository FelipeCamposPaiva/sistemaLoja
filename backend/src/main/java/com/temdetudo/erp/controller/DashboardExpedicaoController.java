package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.DashboardExpedicaoDTO;
import com.temdetudo.erp.service.DashboardExpedicaoService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard-expedicao")
@CrossOrigin("*")
public class DashboardExpedicaoController {

    private final DashboardExpedicaoService service;

    public DashboardExpedicaoController(DashboardExpedicaoService service) {
        this.service = service;
    }

    @GetMapping
    public DashboardExpedicaoDTO dashboard() {
        return service.montar();
    }
}
