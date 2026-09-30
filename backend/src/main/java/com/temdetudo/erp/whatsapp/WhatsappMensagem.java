package com.temdetudo.erp.whatsapp;

public class WhatsappMensagem {

    private String id;
    private String phone;
    private String nome;
    private String texto;
    private boolean deLoja;
    private String em;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getTexto() {
        return texto;
    }

    public void setTexto(String texto) {
        this.texto = texto;
    }

    public boolean isDeLoja() {
        return deLoja;
    }

    public void setDeLoja(boolean deLoja) {
        this.deLoja = deLoja;
    }

    public String getEm() {
        return em;
    }

    public void setEm(String em) {
        this.em = em;
    }
}
