package com.temdetudo.erp.entity;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(unique = true, length = 50)
    private String usuario;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Perfil perfil;

    @Column(nullable = false)
    private Boolean ativo = true;

    @Column(name = "ultimo_login")
    private LocalDateTime ultimoLogin;

    @Column(name = "tentativas_login")
    private Integer tentativasLogin = 0;

    @Column(nullable = false)
    private Boolean bloqueado = false;

    @Column(name = "dois_fatores")
    private Boolean doisFatores = false;

    @Column(name = "codigo_2fa", length = 12)
    private String codigo2fa;

    @Column(name = "codigo_2fa_expira")
    private LocalDateTime codigo2faExpira;

    @Column(name = "recuperacao_token", length = 64)
    private String recuperacaoToken;

    @Column(name = "recuperacao_expira")
    private LocalDateTime recuperacaoExpira;

    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    public Usuario() {
    }

    @PrePersist
    public void prePersist() {

        criadoEm = LocalDateTime.now();
        atualizadoEm = LocalDateTime.now();

    }

    @PreUpdate
    public void preUpdate() {

        atualizadoEm = LocalDateTime.now();

    }

    //==========================
    // GETTERS
    //==========================

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getUsuario() {
        return usuario;
    }

    public String getEmail() {
        return email;
    }

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public String getSenha() {
        return senha;
    }

    public Perfil getPerfil() {
        return perfil;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public LocalDateTime getUltimoLogin() {
        return ultimoLogin;
    }

    public Integer getTentativasLogin() {
        return tentativasLogin;
    }

    public Boolean getBloqueado() {
        return bloqueado;
    }

    public Boolean getDoisFatores() {
        return doisFatores;
    }

    public String getCodigo2fa() {
        return codigo2fa;
    }

    public LocalDateTime getCodigo2faExpira() {
        return codigo2faExpira;
    }

    public String getRecuperacaoToken() {
        return recuperacaoToken;
    }

    public LocalDateTime getRecuperacaoExpira() {
        return recuperacaoExpira;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    //==========================
    // SETTERS
    //==========================

    public void setId(Long id) {
        this.id = id;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public void setPerfil(Perfil perfil) {
        this.perfil = perfil;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public void setUltimoLogin(LocalDateTime ultimoLogin) {
        this.ultimoLogin = ultimoLogin;
    }

    public void setTentativasLogin(Integer tentativasLogin) {
        this.tentativasLogin = tentativasLogin;
    }

    public void setBloqueado(Boolean bloqueado) {
        this.bloqueado = bloqueado;
    }

    public void setDoisFatores(Boolean doisFatores) {
        this.doisFatores = doisFatores;
    }

    public void setCodigo2fa(String codigo2fa) {
        this.codigo2fa = codigo2fa;
    }

    public void setCodigo2faExpira(LocalDateTime codigo2faExpira) {
        this.codigo2faExpira = codigo2faExpira;
    }

    public void setRecuperacaoToken(String recuperacaoToken) {
        this.recuperacaoToken = recuperacaoToken;
    }

    public void setRecuperacaoExpira(LocalDateTime recuperacaoExpira) {
        this.recuperacaoExpira = recuperacaoExpira;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }

    public void setAtualizadoEm(LocalDateTime atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }

}