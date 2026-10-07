package com.temdetudo.erp.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    @Column(name = "cpf_cnpj")
    private String cpfCnpj;

    private String telefone;

    private String email;

    private String endereco;

    @Column(name = "data_cadastro")
    private LocalDateTime dataCadastro;

    private String tipo;

    @Column(name = "nome_fantasia")
    private String nomeFantasia;

    private String cidade;

    private String estado;

    private String cep;

    @Column(name = "limite_credito")
    private BigDecimal limiteCredito;

    private String observacoes;

    private Boolean ativo;

    @Column(name = "tiny_id")
    private Integer tinyId;

    @Column(name = "tipo_pessoa", length = 20)
    private String tipoPessoa;

    @Column(length = 2)
    private String contribuinte;

    @Column(length = 30)
    private String ie;

    @Column(name = "inscricao_municipal", length = 30)
    private String inscricaoMunicipal;

    @Column(name = "inscricao_suframa", length = 20)
    private String inscricaoSuframa;

    @Column(name = "consumidor_final")
    private Boolean consumidorFinal;

    @Column(length = 20)
    private String finalidade;

    @Column(name = "regime_tributario", length = 30)
    private String regimeTributario;

    @Column(name = "natureza_operacao_id")
    private Long naturezaOperacaoId;

    @Column(length = 150)
    private String vendedor;

    @Column(name = "vendedor_id")
    private Long vendedorId;

    @Column(name = "condicao_pagamento", length = 80)
    private String condicaoPagamento;

    @Column(name = "dia_pagamento")
    private Integer diaPagamento;

    @Column(name = "lista_preco", length = 80)
    private String listaPreco;

    @Column(length = 10)
    private String fundacao;

    @Lob
    @Column(columnDefinition = "MEDIUMTEXT")
    private String foto;

    @Lob
    @Column(columnDefinition = "MEDIUMTEXT")
    private String anexos;

    @Lob
    @Column(name = "dados_pessoais", columnDefinition = "TEXT")
    private String dadosPessoais;

    // GETTERS E SETTERS

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

    public String getCpfCnpj() {
        return cpfCnpj;
    }

    public void setCpfCnpj(String cpfCnpj) {
        this.cpfCnpj = cpfCnpj;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public LocalDateTime getDataCadastro() {
        return dataCadastro;
    }

    public void setDataCadastro(LocalDateTime dataCadastro) {
        this.dataCadastro = dataCadastro;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getNomeFantasia() {
        return nomeFantasia;
    }

    public void setNomeFantasia(String nomeFantasia) {
        this.nomeFantasia = nomeFantasia;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getCep() {
        return cep;
    }

    public void setCep(String cep) {
        this.cep = cep;
    }

    public BigDecimal getLimiteCredito() {
        return limiteCredito;
    }

    public void setLimiteCredito(BigDecimal limiteCredito) {
        this.limiteCredito = limiteCredito;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public Integer getTinyId() {
        return tinyId;
    }

    public void setTinyId(Integer tinyId) {
        this.tinyId = tinyId;
    }

    public String getTipoPessoa() {
        return tipoPessoa;
    }

    public void setTipoPessoa(String tipoPessoa) {
        this.tipoPessoa = tipoPessoa;
    }

    public String getContribuinte() {
        return contribuinte;
    }

    public void setContribuinte(String contribuinte) {
        this.contribuinte = contribuinte;
    }

    public String getIe() {
        return ie;
    }

    public void setIe(String ie) {
        this.ie = ie;
    }

    public String getInscricaoMunicipal() {
        return inscricaoMunicipal;
    }

    public void setInscricaoMunicipal(String inscricaoMunicipal) {
        this.inscricaoMunicipal = inscricaoMunicipal;
    }

    public String getInscricaoSuframa() {
        return inscricaoSuframa;
    }

    public void setInscricaoSuframa(String inscricaoSuframa) {
        this.inscricaoSuframa = inscricaoSuframa;
    }

    public Boolean getConsumidorFinal() {
        return consumidorFinal;
    }

    public void setConsumidorFinal(Boolean consumidorFinal) {
        this.consumidorFinal = consumidorFinal;
    }

    public String getFinalidade() {
        return finalidade;
    }

    public void setFinalidade(String finalidade) {
        this.finalidade = finalidade;
    }

    public String getRegimeTributario() {
        return regimeTributario;
    }

    public void setRegimeTributario(String regimeTributario) {
        this.regimeTributario = regimeTributario;
    }

    public Long getNaturezaOperacaoId() {
        return naturezaOperacaoId;
    }

    public void setNaturezaOperacaoId(Long naturezaOperacaoId) {
        this.naturezaOperacaoId = naturezaOperacaoId;
    }

    public String getVendedor() {
        return vendedor;
    }

    public void setVendedor(String vendedor) {
        this.vendedor = vendedor;
    }

    public Long getVendedorId() {
        return vendedorId;
    }

    public void setVendedorId(Long vendedorId) {
        this.vendedorId = vendedorId;
    }

    public String getCondicaoPagamento() {
        return condicaoPagamento;
    }

    public void setCondicaoPagamento(String condicaoPagamento) {
        this.condicaoPagamento = condicaoPagamento;
    }

    public Integer getDiaPagamento() {
        return diaPagamento;
    }

    public void setDiaPagamento(Integer diaPagamento) {
        this.diaPagamento = diaPagamento;
    }

    public String getListaPreco() {
        return listaPreco;
    }

    public void setListaPreco(String listaPreco) {
        this.listaPreco = listaPreco;
    }

    public String getFundacao() {
        return fundacao;
    }

    public void setFundacao(String fundacao) {
        this.fundacao = fundacao;
    }

    public String getFoto() {
        return foto;
    }

    public void setFoto(String foto) {
        this.foto = foto;
    }

    public String getAnexos() {
        return anexos;
    }

    public void setAnexos(String anexos) {
        this.anexos = anexos;
    }

    public String getDadosPessoais() {
        return dadosPessoais;
    }

    public void setDadosPessoais(String dadosPessoais) {
        this.dadosPessoais = dadosPessoais;
    }
}