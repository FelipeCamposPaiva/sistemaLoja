package com.temdetudo.erp.dto;

public class DashboardGeralDTO {

    //==========================
    // RESUMOS
    //==========================

    private Long totalClientes;
    private Long clientesNovos;

    private Long totalProdutos;

    private Long totalOS;

    private Long osProducao;

    private Long totalOrcamentos;

    private Long estoqueBaixo;

    //==========================
    // FINANCEIRO
    //==========================

    private Double vendasHoje;

    private Double faturamentoMes;

    private Double saldoCaixa;

    private Double contasReceber;

    private Double contasPagar;

    //==========================
    // GETTERS
    //==========================

    public Long getTotalClientes() {
        return totalClientes;
    }

    public void setTotalClientes(Long totalClientes) {
        this.totalClientes = totalClientes;
    }

    public Long getClientesNovos() {
        return clientesNovos;
    }

    public void setClientesNovos(Long clientesNovos) {
        this.clientesNovos = clientesNovos;
    }

    public Long getTotalProdutos() {
        return totalProdutos;
    }

    public void setTotalProdutos(Long totalProdutos) {
        this.totalProdutos = totalProdutos;
    }

    public Long getTotalOS() {
        return totalOS;
    }

    public void setTotalOS(Long totalOS) {
        this.totalOS = totalOS;
    }

    public Long getOsProducao() {
        return osProducao;
    }

    public void setOsProducao(Long osProducao) {
        this.osProducao = osProducao;
    }

    public Long getTotalOrcamentos() {
        return totalOrcamentos;
    }

    public void setTotalOrcamentos(Long totalOrcamentos) {
        this.totalOrcamentos = totalOrcamentos;
    }

    public Long getEstoqueBaixo() {
        return estoqueBaixo;
    }

    public void setEstoqueBaixo(Long estoqueBaixo) {
        this.estoqueBaixo = estoqueBaixo;
    }

    public Double getVendasHoje() {
        return vendasHoje;
    }

    public void setVendasHoje(Double vendasHoje) {
        this.vendasHoje = vendasHoje;
    }

    public Double getFaturamentoMes() {
        return faturamentoMes;
    }

    public void setFaturamentoMes(Double faturamentoMes) {
        this.faturamentoMes = faturamentoMes;
    }

    public Double getSaldoCaixa() {
        return saldoCaixa;
    }

    public void setSaldoCaixa(Double saldoCaixa) {
        this.saldoCaixa = saldoCaixa;
    }

    public Double getContasReceber() {
        return contasReceber;
    }

    public void setContasReceber(Double contasReceber) {
        this.contasReceber = contasReceber;
    }

    public Double getContasPagar() {
        return contasPagar;
    }

    public void setContasPagar(Double contasPagar) {
        this.contasPagar = contasPagar;
    }

}