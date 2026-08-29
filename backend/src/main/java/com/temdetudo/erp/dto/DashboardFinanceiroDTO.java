package com.temdetudo.erp.dto;

import java.math.BigDecimal;

public class DashboardFinanceiroDTO {

    private BigDecimal saldoCaixa;
    private BigDecimal contasReceber;
    private BigDecimal contasPagar;
    private BigDecimal entradasMes;
    private BigDecimal saidasMes;
    private BigDecimal resultado;

    public BigDecimal getSaldoCaixa() {
        return saldoCaixa;
    }

    public void setSaldoCaixa(BigDecimal saldoCaixa) {
        this.saldoCaixa = saldoCaixa;
    }

    public BigDecimal getContasReceber() {
        return contasReceber;
    }

    public void setContasReceber(BigDecimal contasReceber) {
        this.contasReceber = contasReceber;
    }

    public BigDecimal getContasPagar() {
        return contasPagar;
    }

    public void setContasPagar(BigDecimal contasPagar) {
        this.contasPagar = contasPagar;
    }

    public BigDecimal getEntradasMes() {
        return entradasMes;
    }

    public void setEntradasMes(BigDecimal entradasMes) {
        this.entradasMes = entradasMes;
    }

    public BigDecimal getSaidasMes() {
        return saidasMes;
    }

    public void setSaidasMes(BigDecimal saidasMes) {
        this.saidasMes = saidasMes;
    }

    public BigDecimal getResultado() {
        return resultado;
    }

    public void setResultado(BigDecimal resultado) {
        this.resultado = resultado;
    }
}