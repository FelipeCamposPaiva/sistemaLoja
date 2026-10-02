package com.temdetudo.erp.dto;

import jakarta.validation.constraints.NotBlank;

public class Verificar2faRequest {

    @NotBlank(message = "Informe o usuário ou e-mail")
    private String login;

    @NotBlank(message = "Informe o código")
    private String codigo;

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }
}
