package com.temdetudo.erp.dto;

import jakarta.validation.constraints.NotBlank;

public class RecuperarSenhaRequest {

    @NotBlank(message = "Informe o e-mail cadastrado")
    private String email;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
