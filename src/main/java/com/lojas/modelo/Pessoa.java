package com.lojas.modelo;

import java.io.Serializable;
import java.sql.Timestamp;
import java.util.HashSet;
import java.util.Set;
import javax.persistence.Column;
import javax.persistence.Entity;

import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Setter
@Getter
@Table(name = "pessoas")
@Entity
public class Pessoa implements Serializable {

    @Column(name = "id")
    private String id;
    @Column(name = "Nome")
    private String nome;
    @Column(name = "Sobrenome")
    private String sobreNome;
    @Id
    @NotNull
    @Column(name = "Matricula")
    private String matricula;
    @Column(name = "Empresa")
    private String empresa;
    @Column(name = "FunçãoEmpresa")
    private String fnEmpresa;
    @Column(name = "DataCadastro")
    private Timestamp dataCadastro;
    @Column(name = "DataEmbarque")
    private Timestamp dataEmbarque;
    @Column(name = "Camarote")
    private String camarote;
    @Column(name = "FunçãoEOR")
    private String fnEOR;
    @Column(name = "Embarcado")
    private boolean embarcado;
    @Column(name = "Baleeira")
    private String baleeira;
    @Column(name = "Dias")
    private Integer dias;
    @Column(name = "Ramal")
    private String ramal;

    @OneToMany(mappedBy = "pessoa")
    private Set<Andamento> listaAndamento = new HashSet<>();

    public Pessoa() {
    }

    public Pessoa(String id, String nome) {

        this.id = id;
        this.nome = nome;
    }

    public Pessoa(String id, String nome, String sobreNome,
            String matricula, String empresa, String fnEmpresa,
            Timestamp dataCadastro, Timestamp dataEmbarque,
            String camarote, String fnEOR, boolean embarcado,
            String baleeira, Integer dias, String ramal) {

        this.id = id;
        this.nome = nome;
        this.sobreNome = sobreNome;
        this.matricula = matricula;
        this.empresa = empresa;
        this.fnEmpresa = fnEmpresa;
        this.dataCadastro = dataCadastro;
        this.dataEmbarque = dataEmbarque;
        this.camarote = camarote;
        this.fnEOR = fnEOR;
        this.embarcado = embarcado;
        this.baleeira = baleeira;
        this.dias = dias;
        this.ramal = ramal;
    }

}
