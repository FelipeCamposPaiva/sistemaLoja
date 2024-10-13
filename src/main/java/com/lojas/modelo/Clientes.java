package com.lojas.modelo;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import java.io.Serializable;
import java.sql.Timestamp;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Entity
@Log4j2
@Setter
@Getter
public class Clientes implements Serializable {
    @Column(name = "id")
    @Id
    private Long id;

    @Column(name = "nome")
    private String nome;

    @Column(name = "pessoa")
    private String pessoa;

    @Column(name = "cpf")
    private String cpf;

    @Column(name = "cnpj")
    private String cnpj;

    @Column(name = "inscricao_estadual")
    private String inscricaoEstadual;

    @Column(name = "rg")
    private String rg;

    @Column(name = "data_emissao")
    private Timestamp dataEmissao;

    @Column(name = "emissor")
    private boolean emissor;

    @Column(name = "celular")
    private String celular;

    @Column(name = "telefone")
    private String telefone;

    @Column(name = "email")
    private String email;

    @Column(name = "data_nascimento")
    private Timestamp dataNascimento;

    @Column(name = "estado_civil")
    private String estadoCivil;

    @Column(name = "cep")
    private String cep;

    @Column(name = "endereco")
    private String endereco;

    @Column(name = "bairro")
    private String bairro;

    @Column(name = "cidade")
    private String cidade;

    @Column(name = "uf")
    private String uf;

    @Column(name = "naturalidade")
    private String naturalidade;

    @Column(name = "limite_credito_venda_aprazo")
    private String limiteCreditoVendaAprazo;

    @Column(name = "complemento")
    private String complemento;

    @Column(name = "nome_pai")
    private String nomePai;

    @Column(name = "nome_mae")
    private String nomeMae;

    @Column(name = "observacoes")
    private String observacoes;

}
