package com.temdetudo.erp.dto;

public class NaturezaSugeridaDTO {

    private Long naturezaId;
    private String codigo;
    private String nome;
    private String cfop;
    private String cfopInterno;
    private String cfopInterestadual;
    private String operacao;
    private String origem;
    private String motivo;

    public Long getNaturezaId() {
        return naturezaId;
    }

    public void setNaturezaId(Long naturezaId) {
        this.naturezaId = naturezaId;
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

    public String getCfop() {
        return cfop;
    }

    public void setCfop(String cfop) {
        this.cfop = cfop;
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

    public String getOperacao() {
        return operacao;
    }

    public void setOperacao(String operacao) {
        this.operacao = operacao;
    }

    public String getOrigem() {
        return origem;
    }

    public void setOrigem(String origem) {
        this.origem = origem;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}
