package com.temdetudo.erp.dto;

public class LoginResponse {

    private String token;

    private String tipo;

    private Long id;

    private String nome;

    private String usuario;

    private String email;

    private String perfil;

    private Boolean precisa2fa = false;

    private String codigo2fa;

    private Boolean doisFatores = false;

    private String ultimoLogin;

    public LoginResponse() {
    }

    public LoginResponse(
            String token,
            String tipo,
            Long id,
            String nome,
            String usuario,
            String email,
            String perfil
    ) {

        this.token = token;
        this.tipo = tipo;
        this.id = id;
        this.nome = nome;
        this.usuario = usuario;
        this.email = email;
        this.perfil = perfil;

    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

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

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPerfil() {
        return perfil;
    }

    public void setPerfil(String perfil) {
        this.perfil = perfil;
    }

    public Boolean getPrecisa2fa() {
        return precisa2fa;
    }

    public void setPrecisa2fa(Boolean precisa2fa) {
        this.precisa2fa = precisa2fa;
    }

    public String getCodigo2fa() {
        return codigo2fa;
    }

    public void setCodigo2fa(String codigo2fa) {
        this.codigo2fa = codigo2fa;
    }

    public Boolean getDoisFatores() {
        return doisFatores;
    }

    public void setDoisFatores(Boolean doisFatores) {
        this.doisFatores = doisFatores;
    }

    public String getUltimoLogin() {
        return ultimoLogin;
    }

    public void setUltimoLogin(String ultimoLogin) {
        this.ultimoLogin = ultimoLogin;
    }

}