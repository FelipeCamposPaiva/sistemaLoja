package com.temdetudo.erp.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class EstoqueAuditoriaDTO {

    private Long id;
    private Long produtoId;
    private String produtoSku;
    private String produtoNome;
    private Integer localOrigem;
    private Integer localDestino;
    private String tipo;
    private BigDecimal quantidade;
    private BigDecimal efeito;
    private String observacao;
    private Long usuarioId;
    private String usuarioNome;
    private LocalDateTime dataMovimento;
    private String origem;
    private Long origemId;
    private String origemRef;
    private BigDecimal saldoAnterior;
    private BigDecimal saldoPosterior;
    private String status;
    private Long movimentoOrigemId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProdutoId() {
        return produtoId;
    }

    public void setProdutoId(Long produtoId) {
        this.produtoId = produtoId;
    }

    public String getProdutoSku() {
        return produtoSku;
    }

    public void setProdutoSku(String produtoSku) {
        this.produtoSku = produtoSku;
    }

    public String getProdutoNome() {
        return produtoNome;
    }

    public void setProdutoNome(String produtoNome) {
        this.produtoNome = produtoNome;
    }

    public Integer getLocalOrigem() {
        return localOrigem;
    }

    public void setLocalOrigem(Integer localOrigem) {
        this.localOrigem = localOrigem;
    }

    public Integer getLocalDestino() {
        return localDestino;
    }

    public void setLocalDestino(Integer localDestino) {
        this.localDestino = localDestino;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(BigDecimal quantidade) {
        this.quantidade = quantidade;
    }

    public BigDecimal getEfeito() {
        return efeito;
    }

    public void setEfeito(BigDecimal efeito) {
        this.efeito = efeito;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getUsuarioNome() {
        return usuarioNome;
    }

    public void setUsuarioNome(String usuarioNome) {
        this.usuarioNome = usuarioNome;
    }

    public LocalDateTime getDataMovimento() {
        return dataMovimento;
    }

    public void setDataMovimento(LocalDateTime dataMovimento) {
        this.dataMovimento = dataMovimento;
    }

    public String getOrigem() {
        return origem;
    }

    public void setOrigem(String origem) {
        this.origem = origem;
    }

    public Long getOrigemId() {
        return origemId;
    }

    public void setOrigemId(Long origemId) {
        this.origemId = origemId;
    }

    public String getOrigemRef() {
        return origemRef;
    }

    public void setOrigemRef(String origemRef) {
        this.origemRef = origemRef;
    }

    public BigDecimal getSaldoAnterior() {
        return saldoAnterior;
    }

    public void setSaldoAnterior(BigDecimal saldoAnterior) {
        this.saldoAnterior = saldoAnterior;
    }

    public BigDecimal getSaldoPosterior() {
        return saldoPosterior;
    }

    public void setSaldoPosterior(BigDecimal saldoPosterior) {
        this.saldoPosterior = saldoPosterior;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getMovimentoOrigemId() {
        return movimentoOrigemId;
    }

    public void setMovimentoOrigemId(Long movimentoOrigemId) {
        this.movimentoOrigemId = movimentoOrigemId;
    }
}
