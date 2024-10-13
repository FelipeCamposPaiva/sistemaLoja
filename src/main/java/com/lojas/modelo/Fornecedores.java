package com.lojas.modelo;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import java.io.Serializable;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Entity
@Log4j2
@Setter
@Getter
public class Fornecedores implements Serializable {
    @Column(name = "id")
    @Id
    private long id;

    @Column(name = "codigo")
    private String codigo;

    @Column(name = "nome")
    private String nome;

    @Column(name = "razao_social")
    private String razaoSocial;

    @Column(name = "cpf_cnpj")
    private String cpfCnpj;

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

    @Column(name = "complemento")
    private String complemento;

    @Column(name = "telefone")
    private String telefone;

    @Column(name = "celular")
    private String celular;

    @Column(name = "email")
    private String email;

    @Column(name = "imagem")
    private String imagem;

    @Column(name = "observacoes")
    private String observacoes;

    @Column(name = "empresas_id")
    private long empresasId;

    @Column(name = "inscricao_estadual")
    private String inscricaoEstadual;

    @Column(name = "contato")
    private String contato;

    @Column(name = "dados_bancarios")
    private String dadosBancarios;

    @Column(name = "ativo")
    private boolean ativo;

}
