package com.temdetudo.erp.dto;

import java.math.BigDecimal;

public class TransferenciaEstoqueRequest {

    private Long produtoId;
    private Integer localOrigem;
    private Integer localDestino;
    private BigDecimal quantidade;
    private String observacao;

    public Long getProdutoId() {
        return produtoId;
    }

    public void setProdutoId(Long produtoId) {
        this.produtoId = produtoId;
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

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(BigDecimal quantidade) {
        this.quantidade = quantidade;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }
}
