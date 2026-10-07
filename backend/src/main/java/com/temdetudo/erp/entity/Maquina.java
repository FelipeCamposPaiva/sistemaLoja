package com.temdetudo.erp.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "maquinas")
public class Maquina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    @Column(length = 500)
    private String detalhe;

    @Column(length = 80)
    private String tipo;

    private String modelo;

    private String marca;

    private String localizacao;

    private String status;

    @Column(name = "prox_manutencao")
    private LocalDate proxManutencao;

    @Column(name = "horas_uso")
    private Integer horasUso;

    @Column(name = "bem_id")
    private Long bemId;

    @Column(name = "numero_serie", length = 80)
    private String numeroSerie;

    @Column(name = "valor_compra", precision = 12, scale = 2)
    private BigDecimal valorCompra;

    @Column(name = "data_compra")
    private LocalDate dataCompra;

    private String fornecedor;

    @Column(name = "fornecedor_id")
    private Long fornecedorId;

    @Column(name = "nota_entrada_id")
    private Long notaEntradaId;

    @Column(name = "nota_fiscal", length = 40)
    private String notaFiscal;

    @Column(name = "garantia_ate")
    private LocalDate garantiaAte;

    @Column(name = "previsao_retorno")
    private LocalDate previsaoRetorno;

    @Column(name = "ultima_utilizacao")
    private LocalDateTime ultimaUtilizacao;

    @Column(name = "energia_kwh", precision = 10, scale = 2)
    private BigDecimal energiaKwh;

    @Column(name = "energia_valor", precision = 12, scale = 2)
    private BigDecimal energiaValor;

    @Column(name = "material_media", precision = 10, scale = 3)
    private BigDecimal materialMedia;

    @Column(name = "material_unidade", length = 10)
    private String materialUnidade;

    @Column(name = "material_valor", precision = 12, scale = 2)
    private BigDecimal materialValor;

    @Column(columnDefinition = "TEXT")
    private String observacao;

    @Column(name = "codigo_publico", length = 40)
    private String codigoPublico;

    @Transient
    private String fotoCapa;

    @Transient
    private Double nivelMedio;

    @Transient
    private Integer qtdManutencoes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDetalhe() {
        return detalhe;
    }

    public void setDetalhe(String detalhe) {
        this.detalhe = detalhe;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getLocalizacao() {
        return localizacao;
    }

    public void setLocalizacao(String localizacao) {
        this.localizacao = localizacao;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getProxManutencao() {
        return proxManutencao;
    }

    public void setProxManutencao(LocalDate proxManutencao) {
        this.proxManutencao = proxManutencao;
    }

    public Integer getHorasUso() {
        return horasUso;
    }

    public void setHorasUso(Integer horasUso) {
        this.horasUso = horasUso;
    }

    public Long getBemId() {
        return bemId;
    }

    public void setBemId(Long bemId) {
        this.bemId = bemId;
    }

    public String getNumeroSerie() {
        return numeroSerie;
    }

    public void setNumeroSerie(String numeroSerie) {
        this.numeroSerie = numeroSerie;
    }

    public BigDecimal getValorCompra() {
        return valorCompra;
    }

    public void setValorCompra(BigDecimal valorCompra) {
        this.valorCompra = valorCompra;
    }

    public LocalDate getDataCompra() {
        return dataCompra;
    }

    public void setDataCompra(LocalDate dataCompra) {
        this.dataCompra = dataCompra;
    }

    public String getFornecedor() {
        return fornecedor;
    }

    public void setFornecedor(String fornecedor) {
        this.fornecedor = fornecedor;
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

    public String getNotaFiscal() {
        return notaFiscal;
    }

    public void setNotaFiscal(String notaFiscal) {
        this.notaFiscal = notaFiscal;
    }

    public LocalDate getGarantiaAte() {
        return garantiaAte;
    }

    public void setGarantiaAte(LocalDate garantiaAte) {
        this.garantiaAte = garantiaAte;
    }

    public LocalDate getPrevisaoRetorno() {
        return previsaoRetorno;
    }

    public void setPrevisaoRetorno(LocalDate previsaoRetorno) {
        this.previsaoRetorno = previsaoRetorno;
    }

    public LocalDateTime getUltimaUtilizacao() {
        return ultimaUtilizacao;
    }

    public void setUltimaUtilizacao(LocalDateTime ultimaUtilizacao) {
        this.ultimaUtilizacao = ultimaUtilizacao;
    }

    public BigDecimal getEnergiaKwh() {
        return energiaKwh;
    }

    public void setEnergiaKwh(BigDecimal energiaKwh) {
        this.energiaKwh = energiaKwh;
    }

    public BigDecimal getEnergiaValor() {
        return energiaValor;
    }

    public void setEnergiaValor(BigDecimal energiaValor) {
        this.energiaValor = energiaValor;
    }

    public BigDecimal getMaterialMedia() {
        return materialMedia;
    }

    public void setMaterialMedia(BigDecimal materialMedia) {
        this.materialMedia = materialMedia;
    }

    public String getMaterialUnidade() {
        return materialUnidade;
    }

    public void setMaterialUnidade(String materialUnidade) {
        this.materialUnidade = materialUnidade;
    }

    public BigDecimal getMaterialValor() {
        return materialValor;
    }

    public void setMaterialValor(BigDecimal materialValor) {
        this.materialValor = materialValor;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public String getCodigoPublico() {
        return codigoPublico;
    }

    public void setCodigoPublico(String codigoPublico) {
        this.codigoPublico = codigoPublico;
    }

    public String getFotoCapa() {
        return fotoCapa;
    }

    public void setFotoCapa(String fotoCapa) {
        this.fotoCapa = fotoCapa;
    }

    public Double getNivelMedio() {
        return nivelMedio;
    }

    public void setNivelMedio(Double nivelMedio) {
        this.nivelMedio = nivelMedio;
    }

    public Integer getQtdManutencoes() {
        return qtdManutencoes;
    }

    public void setQtdManutencoes(Integer qtdManutencoes) {
        this.qtdManutencoes = qtdManutencoes;
    }
}
