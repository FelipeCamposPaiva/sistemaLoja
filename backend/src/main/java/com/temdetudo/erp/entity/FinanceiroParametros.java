package com.temdetudo.erp.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "financeiro_parametros")
public class FinanceiroParametros {

    @Id
    private Long id = 1L;

    @Column(name = "multa_percentual")
    private BigDecimal multaPercentual = new BigDecimal("2.00");

    @Column(name = "juros_mes_percentual")
    private BigDecimal jurosMesPercentual = new BigDecimal("1.00");

    @Column(name = "carencia_dias")
    private Integer carenciaDias = 0;

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getMultaPercentual() { return multaPercentual; }
    public void setMultaPercentual(BigDecimal multaPercentual) { this.multaPercentual = multaPercentual; }
    public BigDecimal getJurosMesPercentual() { return jurosMesPercentual; }
    public void setJurosMesPercentual(BigDecimal jurosMesPercentual) { this.jurosMesPercentual = jurosMesPercentual; }
    public Integer getCarenciaDias() { return carenciaDias; }
    public void setCarenciaDias(Integer carenciaDias) { this.carenciaDias = carenciaDias; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
