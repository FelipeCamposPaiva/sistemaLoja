package com.temdetudo.erp.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "naturezas_operacao")
public class NaturezaOperacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String codigo;

    @Column(nullable = false, length = 180)
    private String nome;

    @Column(name = "cfop_interno", length = 4)
    private String cfopInterno;

    @Column(name = "cfop_interestadual", length = 4)
    private String cfopInterestadual;

    @Column(name = "tipo_documento", length = 20)
    private String tipoDocumento;

    @Column(name = "para_contribuinte")
    private Boolean paraContribuinte;

    @Column(name = "para_nao_contribuinte")
    private Boolean paraNaoContribuinte;

    @Column(name = "para_pessoa_fisica")
    private Boolean paraPessoaFisica;

    @Column(name = "para_pessoa_juridica")
    private Boolean paraPessoaJuridica;

    @Column(length = 20)
    private String finalidade;

    @Column(name = "consumidor_final")
    private Boolean consumidorFinal;

    private Integer prioridade;

    private Boolean ativo;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCfopInterno() {
        return cfopInterno;
    }

    public void setCfopInterno(String cfopInterno) {
        this.cfopInterno = cfopInterno;
    }

    public String getCfopInterestadual() {
        return cfopInterestadual;
    }

    public void setCfopInterestadual(String cfopInterestadual) {
        this.cfopInterestadual = cfopInterestadual;
    }

    public String getTipoDocumento() {
        return tipoDocumento;
    }

    public void setTipoDocumento(String tipoDocumento) {
        this.tipoDocumento = tipoDocumento;
    }

    public Boolean getParaContribuinte() {
        return paraContribuinte;
    }

    public void setParaContribuinte(Boolean paraContribuinte) {
        this.paraContribuinte = paraContribuinte;
    }

    public Boolean getParaNaoContribuinte() {
        return paraNaoContribuinte;
    }

    public void setParaNaoContribuinte(Boolean paraNaoContribuinte) {
        this.paraNaoContribuinte = paraNaoContribuinte;
    }

    public Boolean getParaPessoaFisica() {
        return paraPessoaFisica;
    }

    public void setParaPessoaFisica(Boolean paraPessoaFisica) {
        this.paraPessoaFisica = paraPessoaFisica;
    }

    public Boolean getParaPessoaJuridica() {
        return paraPessoaJuridica;
    }

    public void setParaPessoaJuridica(Boolean paraPessoaJuridica) {
        this.paraPessoaJuridica = paraPessoaJuridica;
    }

    public String getFinalidade() {
        return finalidade;
    }

    public void setFinalidade(String finalidade) {
        this.finalidade = finalidade;
    }

    public Boolean getConsumidorFinal() {
        return consumidorFinal;
    }

    public void setConsumidorFinal(Boolean consumidorFinal) {
        this.consumidorFinal = consumidorFinal;
    }

    public Integer getPrioridade() {
        return prioridade;
    }

    public void setPrioridade(Integer prioridade) {
        this.prioridade = prioridade;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
}
