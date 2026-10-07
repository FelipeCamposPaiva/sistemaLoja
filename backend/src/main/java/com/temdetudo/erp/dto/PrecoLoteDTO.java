package com.temdetudo.erp.dto;

import java.math.BigDecimal;
import java.util.List;

public class PrecoLoteDTO {

    private List<Long> ids;
    private BigDecimal percentualReajuste;
    private BigDecimal descontoPercentual;
    private BigDecimal precoPromocional;
    private Boolean limparPromocao;
    private Boolean reajustarVenda;
    private Boolean reajustarAtacado;

    public List<Long> getIds() {
        return ids;
    }

    public void setIds(List<Long> ids) {
        this.ids = ids;
    }

    public BigDecimal getPercentualReajuste() {
        return percentualReajuste;
    }

    public void setPercentualReajuste(BigDecimal percentualReajuste) {
        this.percentualReajuste = percentualReajuste;
    }

    public BigDecimal getDescontoPercentual() {
        return descontoPercentual;
    }

    public void setDescontoPercentual(BigDecimal descontoPercentual) {
        this.descontoPercentual = descontoPercentual;
    }

    public BigDecimal getPrecoPromocional() {
        return precoPromocional;
    }

    public void setPrecoPromocional(BigDecimal precoPromocional) {
        this.precoPromocional = precoPromocional;
    }

    public Boolean getLimparPromocao() {
        return limparPromocao;
    }

    public void setLimparPromocao(Boolean limparPromocao) {
        this.limparPromocao = limparPromocao;
    }

    public Boolean getReajustarVenda() {
        return reajustarVenda;
    }

    public void setReajustarVenda(Boolean reajustarVenda) {
        this.reajustarVenda = reajustarVenda;
    }

    public Boolean getReajustarAtacado() {
        return reajustarAtacado;
    }

    public void setReajustarAtacado(Boolean reajustarAtacado) {
        this.reajustarAtacado = reajustarAtacado;
    }
}
