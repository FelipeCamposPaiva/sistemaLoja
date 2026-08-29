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
    private ProducaoRepository producaoRepository;

    @Autowired
    private CaixaRepository caixaRepository;

    @Autowired
    private ContaReceberRepository receberRepository;

    @Autowired
    private ContaPagarRepository pagarRepository;

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

        dto.setTotalOS(
                producaoRepository.count()
        );

        dto.setOsProducao(
                (long)
                producaoRepository
                        .findByStatus(
                                "PRODUCAO"
                        )
                        .size()
        );

        dto.setEstoqueBaixo(
                0L
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