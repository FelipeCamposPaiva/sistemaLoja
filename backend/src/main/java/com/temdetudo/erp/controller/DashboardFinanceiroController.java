package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.DashboardFinanceiroDTO;
import com.temdetudo.erp.entity.Caixa;
import com.temdetudo.erp.entity.ContaPagar;
import com.temdetudo.erp.entity.ContaReceber;
import com.temdetudo.erp.repository.CaixaRepository;
import com.temdetudo.erp.repository.ContaPagarRepository;
import com.temdetudo.erp.repository.ContaReceberRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/dashboard-financeiro")
@CrossOrigin("*")
public class DashboardFinanceiroController {

    @Autowired
    private CaixaRepository caixaRepository;

    @Autowired
    private ContaReceberRepository receberRepository;

    @Autowired
    private ContaPagarRepository pagarRepository;

    @GetMapping
    public DashboardFinanceiroDTO dashboard() {

        DashboardFinanceiroDTO dto =
                new DashboardFinanceiroDTO();

        BigDecimal entradas =
                caixaRepository.findAll()
                        .stream()
                        .filter(c ->
                                "ENTRADA".equals(
                                        c.getTipo()
                                )
                        )
                        .map(Caixa::getValor)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        BigDecimal saidas =
                caixaRepository.findAll()
                        .stream()
                        .filter(c ->
                                "SAIDA".equals(
                                        c.getTipo()
                                )
                        )
                        .map(Caixa::getValor)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        BigDecimal receber =
                receberRepository.findAll()
                        .stream()
                        .filter(c ->
                                !"RECEBIDO".equals(
                                        c.getStatus()
                                )
                        )
                        .map(ContaReceber::getValor)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        BigDecimal pagar =
                pagarRepository.findAll()
                        .stream()
                        .filter(c ->
                                !"PAGO".equals(
                                        c.getStatus()
                                )
                        )
                        .map(ContaPagar::getValor)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        dto.setSaldoCaixa(
                entradas.subtract(
                        saidas
                )
        );

        dto.setEntradasMes(
                entradas
        );

        dto.setSaidasMes(
                saidas
        );

        dto.setContasReceber(
                receber
        );

        dto.setContasPagar(
                pagar
        );

        dto.setResultado(
                entradas.subtract(
                        saidas
                ).add(receber)
                        .subtract(pagar)
        );

        return dto;
    }
}