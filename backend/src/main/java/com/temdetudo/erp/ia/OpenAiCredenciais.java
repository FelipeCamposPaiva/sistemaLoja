package com.temdetudo.erp.ia;

public class OpenAiCredenciais {

    private String apiKey = "";
    private String modelo = "gpt-4o-mini";

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo == null || modelo.isBlank() ? "gpt-4o-mini" : modelo.trim();
    }

    public boolean preenchida() {
        return apiKey.startsWith("sk-") && apiKey.length() > 20;
    }
}
