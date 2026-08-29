package com.temdetudo.erp.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "inventario_itens")
public class InventarioItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "inventario_id")
    private Long inventarioId;

    @Column(name = "produto_id")
    private Long produtoId;

    @Column(name = "quantidade_sistema")
    private BigDecimal quantidadeSistema;

    @Column(name = "quantidade_contada")
    private BigDecimal quantidadeContada;

    private BigDecimal diferenca;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getInventarioId() {
        return inventarioId;
    }

    public void setInventarioId(Long inventarioId) {
        this.inventarioId = inventarioId;
    }

    public Long getProdutoId() {
        return produtoId;
    }

    public void setProdutoId(Long produtoId) {
        this.produtoId = produtoId;
    }

    public BigDecimal getQuantidadeSistema() {
        return quantidadeSistema;
    }

    public void setQuantidadeSistema(BigDecimal quantidadeSistema) {
        this.quantidadeSistema = quantidadeSistema;
    }

    public BigDecimal getQuantidadeContada() {
        return quantidadeContada;
    }

    public void setQuantidadeContada(BigDecimal quantidadeContada) {
        this.quantidadeContada = quantidadeContada;
    }

    public BigDecimal getDiferenca() {
        return diferenca;
    }

    public void setDiferenca(BigDecimal diferenca) {
        this.diferenca = diferenca;
    }
}