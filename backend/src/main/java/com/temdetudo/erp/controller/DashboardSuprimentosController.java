package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.DashboardSuprimentosDTO;
import com.temdetudo.erp.dto.PedidosCompraGeradosDTO;
import com.temdetudo.erp.service.DashboardSuprimentosService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard-suprimentos")
@CrossOrigin("*")
public class DashboardSuprimentosController {

    private final DashboardSuprimentosService service;

    public DashboardSuprimentosController(DashboardSuprimentosService service) {
        this.service = service;
    }

    @GetMapping
    public DashboardSuprimentosDTO dashboard() {
        return service.montar();
    }

    @PostMapping("/pedidos-compra")
    public PedidosCompraGeradosDTO gerarPedidos(@RequestBody(required = false) Map<String, Object> corpo) {
        return service.gerarPedidos(idsDe(corpo));
    }

    private List<Long> idsDe(Map<String, Object> corpo) {
        if (corpo == null) {
            return List.of();
        }
        Object bruto = corpo.get("ids");
        if (!(bruto instanceof List<?> lista)) {
            return List.of();
        }
        return lista.stream()
                .map((item) -> {
                    try {
                        return Long.parseLong(String.valueOf(item).replaceAll("\\.0$", ""));
                    } catch (Exception ex) {
                        return null;
                    }
                })
                .filter((id) -> id != null && id > 0)
                .toList();
    }
}
