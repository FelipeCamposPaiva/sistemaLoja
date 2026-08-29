package com.temdetudo.erp.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "marcas")
public class Marca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    private String fabricante;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    private String logo;

    private String site;

    private String email;

    private String telefone;

    private Boolean ativo = true;

    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    @PrePersist
    public void prePersist() {

        criadoEm = LocalDateTime.now();
        atualizadoEm = LocalDateTime.now();

        if (ativo == null) {
            ativo = true;
        }

    }

    @PreUpdate
    public void preUpdate() {

        atualizadoEm = LocalDateTime.now();

    }

    // ===========================
    // GETTERS
    // ===========================

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getFabricante() {
        return fabricante;
    }

    public String getDescricao() {
        return descricao;
    }

    public String getLogo() {
        return logo;
    }

    public String getSite() {
        return site;
    }

    public String getEmail() {
        return email;
    }

    public String getTelefone() {
        return telefone;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    // ===========================
    // SETTERS
    // ===========================

    public void setId(Long id) {
        this.id = id;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public void setFabricante(String fabricante) {
        this.fabricante = fabricante;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public void setLogo(String logo) {
        this.logo = logo;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }

    public void setAtualizadoEm(LocalDateTime atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }

}