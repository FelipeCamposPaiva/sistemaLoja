package com.temdetudo.erp.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "estoque_movimentacao")
public class EstoqueMovimentacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "produto_id")
    private Long produtoId;

    @Column(name = "local_origem")
    private Integer localOrigem;

    @Column(name = "local_destino")
    private Integer localDestino;

    private String tipo;

    private BigDecimal quantidade;

    private String observacao;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "usuario_nome")
    private String usuarioNome;

    @Column(name = "data_movimento")
    private LocalDateTime dataMovimento;

    private String origem;

    @Column(name = "origem_id")
    private Long origemId;

    @Column(name = "origem_ref")
    private String origemRef;

    @Column(name = "saldo_anterior")
    private BigDecimal saldoAnterior;

    @Column(name = "saldo_posterior")
    private BigDecimal saldoPosterior;

    private String status;

    @Column(name = "movimento_origem_id")
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
