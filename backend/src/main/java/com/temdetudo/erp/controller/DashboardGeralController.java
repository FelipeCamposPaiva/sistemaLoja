package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.DashboardGeralDTO;

import com.temdetudo.erp.repository.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard-geral")
@CrossOrigin("*")
public class DashboardGeralController {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private OrdemServicoRepository ordemServicoRepository;

    @Autowired
    private CaixaRepository caixaRepository;

    @Autowired
    private ContaReceberRepository receberRepository;

    @Autowired
    private ContaPagarRepository pagarRepository;

    @Autowired
    private com.temdetudo.erp.service.DashboardSuprimentosService dashboardSuprimentos;

    @GetMapping
    public DashboardGeralDTO dashboard() {

        DashboardGeralDTO dto =
                new DashboardGeralDTO();

        dto.setTotalClientes(
                clienteRepository.count()
        );

        dto.setTotalProdutos(
                produtoRepository.count()
        );

        java.util.List<com.temdetudo.erp.entity.OrdemServico> ordens =
                ordemServicoRepository.findAll();

        dto.setTotalOS((long) ordens.size());

        dto.setOsProducao(ordens.stream()
                .filter(o -> {
                    String s = o.getStatus() == null ? "" : o.getStatus().toUpperCase();
                    return s.contains("PRODUC") || s.contains("ARTE") || s.contains("ACABAMENTO")
                            || s.contains("ANDAMENTO");
                })
                .count());

        dto.setTotalOrcamentos(ordens.stream()
                .filter(o -> {
                    String s = o.getStatus() == null ? "" : o.getStatus().toUpperCase();
                    return s.contains("ORCAMENT") || s.contains("ORÇAMENT") || s.contains("EM_ABERTO");
                })
                .count());

        dto.setEstoqueBaixo(
                dashboardSuprimentos.contarReposicao()
        );

        dto.setSaldoCaixa(
                0.0
        );

        dto.setContasReceber(
                0.0
        );

        dto.setContasPagar(
                0.0
        );

        return dto;

    }

}