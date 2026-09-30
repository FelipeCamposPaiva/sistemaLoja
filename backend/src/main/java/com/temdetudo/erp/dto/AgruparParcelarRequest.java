package com.temdetudo.erp.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class AgruparParcelarRequest {

    private List<Long> ids;
    private Integer parcelas;
    private BigDecimal jurosPct;
    private LocalDate primeiroVencimento;
    private Integer intervaloDias;

    public List<Long> getIds() {
        return ids;
    }

    public void setIds(List<Long> ids) {
        this.ids = ids;
    }

    public Integer getParcelas() {
        return parcelas;
    }

    public void setParcelas(Integer parcelas) {
        this.parcelas = parcelas;
    }

    public BigDecimal getJurosPct() {
        return jurosPct;
    }

    public void setJurosPct(BigDecimal jurosPct) {
        this.jurosPct = jurosPct;
    }

    public LocalDate getPrimeiroVencimento() {
        return primeiroVencimento;
    }

    public void setPrimeiroVencimento(LocalDate primeiroVencimento) {
        this.primeiroVencimento = primeiroVencimento;
    }

    public Integer getIntervaloDias() {
        return intervaloDias;
    }

    public void setIntervaloDias(Integer intervaloDias) {
        this.intervaloDias = intervaloDias;
    }
}
