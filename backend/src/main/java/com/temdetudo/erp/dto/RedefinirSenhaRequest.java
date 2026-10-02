package com.temdetudo.erp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RedefinirSenhaRequest {

    @NotBlank(message = "Informe o e-mail")
    private String email;

    @NotBlank(message = "Informe o código")
    private String codigo;

    @NotBlank(message = "Informe a nova senha")
    @Size(min = 6, message = "A nova senha precisa ter ao menos 6 caracteres")
    private String senhaNova;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getSenhaNova() {
        return senhaNova;
    }

    public void setSenhaNova(String senhaNova) {
        this.senhaNova = senhaNova;
    }
}
