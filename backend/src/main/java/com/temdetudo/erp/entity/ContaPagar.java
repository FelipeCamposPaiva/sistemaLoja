package com.temdetudo.erp.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "contas_pagar")
public class ContaPagar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fornecedor_id")
    private Long fornecedorId;

    @Column(name = "nota_entrada_id")
    private Long notaEntradaId;

    private BigDecimal valor;

    private LocalDate vencimento;

    @Column(name = "data_pagamento")
    private LocalDate dataPagamento;

    private String status;

    @Column(columnDefinition = "TEXT")
    private String observacao;

    @Column(name = "valor_pago")
    private BigDecimal valorPago;

    @Column(name = "valor_original")
    private BigDecimal valorOriginal;

    @Column(name = "grupo_id")
    private Long grupoId;

    private Integer parcela;

    private Integer parcelas;

    @Column(name = "juros_pct")
    private BigDecimal jurosPct;

    @Column(name = "origem_ids")
    private String origemIds;

    private String categoria;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFornecedorId() {
        return fornecedorId;
    }

    public void setFornecedorId(Long fornecedorId) {
        this.fornecedorId = fornecedorId;
    }

    public Long getNotaEntradaId() {
        return notaEntradaId;
    }

    public void setNotaEntradaId(Long notaEntradaId) {
        this.notaEntradaId = notaEntradaId;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public LocalDate getVencimento() {
        return vencimento;
    }

    public void setVencimento(LocalDate vencimento) {
        this.vencimento = vencimento;
    }

    public LocalDate getDataPagamento() {
        return dataPagamento;
    }

    public void setDataPagamento(LocalDate dataPagamento) {
        this.dataPagamento = dataPagamento;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public BigDecimal getValorPago() {
        return valorPago;
    }

    public void setValorPago(BigDecimal valorPago) {
        this.valorPago = valorPago;
    }

    public BigDecimal getValorOriginal() {
        return valorOriginal;
    }

    public void setValorOriginal(BigDecimal valorOriginal) {
        this.valorOriginal = valorOriginal;
    }

    public Long getGrupoId() {
        return grupoId;
    }

    public void setGrupoId(Long grupoId) {
        this.grupoId = grupoId;
    }

    public Integer getParcela() {
        return parcela;
    }

    public void setParcela(Integer parcela) {
        this.parcela = parcela;
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

    public String getOrigemIds() {
        return origemIds;
    }

    public void setOrigemIds(String origemIds) {
        this.origemIds = origemIds;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }
}