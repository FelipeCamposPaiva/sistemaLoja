package com.temdetudo.erp.dto;

import com.temdetudo.erp.entity.OrdemCompra;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class PedidosCompraGeradosDTO {

    private int quantidadeOrdens;
    private int quantidadeItens;
    private BigDecimal valorTotal = BigDecimal.ZERO;
    private List<OrdemCompra> ordens = new ArrayList<>();

    public int getQuantidadeOrdens() { return quantidadeOrdens; }
    public void setQuantidadeOrdens(int quantidadeOrdens) { this.quantidadeOrdens = quantidadeOrdens; }
    public int getQuantidadeItens() { return quantidadeItens; }
    public void setQuantidadeItens(int quantidadeItens) { this.quantidadeItens = quantidadeItens; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public void setValorTotal(BigDecimal valorTotal) { this.valorTotal = valorTotal; }
    public List<OrdemCompra> getOrdens() { return ordens; }
    public void setOrdens(List<OrdemCompra> ordens) { this.ordens = ordens; }
}
