package com.temdetudo.erp.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "contas_receber")
public class ContaReceber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cliente_id")
    private Long clienteId;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    private BigDecimal valor;

    private LocalDate vencimento;

    @Column(name = "data_recebimento")
    private LocalDate dataRecebimento;

    private String status;

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

    private BigDecimal juros;

    private BigDecimal multa;

    @Column(name = "valor_atualizado")
    private BigDecimal valorAtualizado;

    @Column(name = "dias_atraso")
    private Integer diasAtraso;

    private String categoria;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
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

    public LocalDate getDataRecebimento() {
        return dataRecebimento;
    }

    public void setDataRecebimento(LocalDate dataRecebimento) {
        this.dataRecebimento = dataRecebimento;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public BigDecimal getJuros() {
        return juros;
    }

    public void setJuros(BigDecimal juros) {
        this.juros = juros;
    }

    public BigDecimal getMulta() {
        return multa;
    }

    public void setMulta(BigDecimal multa) {
        this.multa = multa;
    }

    public BigDecimal getValorAtualizado() {
        return valorAtualizado;
    }

    public void setValorAtualizado(BigDecimal valorAtualizado) {
        this.valorAtualizado = valorAtualizado;
    }

    public Integer getDiasAtraso() {
        return diasAtraso;
    }

    public void setDiasAtraso(Integer diasAtraso) {
        this.diasAtraso = diasAtraso;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }
}