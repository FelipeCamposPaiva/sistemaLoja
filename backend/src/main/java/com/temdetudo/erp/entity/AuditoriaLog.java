package com.temdetudo.erp.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria_log")
public class AuditoriaLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 40)
    private String entidade;

    @Column(name = "registro_id")
    private Long registroId;

    @Column(name = "registro_nome", length = 255)
    private String registroNome;

    @Column(length = 20)
    private String acao;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "usuario_login", length = 80)
    private String usuarioLogin;

    @Column(name = "usuario_nome", length = 150)
    private String usuarioNome;

    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

    @Column(columnDefinition = "LONGTEXT")
    private String alteracoes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEntidade() {
        return entidade;
    }

    public void setEntidade(String entidade) {
        this.entidade = entidade;
    }

    public Long getRegistroId() {
        return registroId;
    }

    public void setRegistroId(Long registroId) {
        this.registroId = registroId;
    }

    public String getRegistroNome() {
        return registroNome;
    }

    public void setRegistroNome(String registroNome) {
        this.registroNome = registroNome;
    }

    public String getAcao() {
        return acao;
    }

    public void setAcao(String acao) {
        this.acao = acao;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getUsuarioLogin() {
        return usuarioLogin;
    }

    public void setUsuarioLogin(String usuarioLogin) {
        this.usuarioLogin = usuarioLogin;
    }

    public String getUsuarioNome() {
        return usuarioNome;
    }

    public void setUsuarioNome(String usuarioNome) {
        this.usuarioNome = usuarioNome;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }

    public String getAlteracoes() {
        return alteracoes;
    }

    public void setAlteracoes(String alteracoes) {
        this.alteracoes = alteracoes;
    }
}
